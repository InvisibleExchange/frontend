import UserBase from "./UserBase.js";

const { LiquidationOrder } = require("../transactions/LiquidationOrder");

const bigInt = require("big-integer");
const { pedersen } = require("../helpers/pedersen");
const { ec, getKeyPair } = require("starknet").ec;

const {
  storeUserData,
  storePrivKey,
  removePrivKey,
  removeOrderId,
} = require("../helpers/firebaseConnection");

const {
  _subaddressPrivKeys,
  _oneTimeAddressPrivKey,
  _hideValuesForRecipient,
  _revealHiddenValues,
  _generateNewBliding,
  signMarginChange,
} = require("./Invisibl3UserUtils.js");

const EXCHANGE_CONFIG = require("../../exchange-config.json");

const DUST_AMOUNT_PER_ASSET = EXCHANGE_CONFIG["DUST_AMOUNT_PER_ASSET"];
const COLLATERAL_TOKEN = EXCHANGE_CONFIG["COLLATERAL_TOKEN"];
const CHAIN_IDS = EXCHANGE_CONFIG["CHAIN_IDS"];

const { Note, trimHash } = require("./Notes.js");
const { LimitOrder, SpotNotesInfo } = require("../transactions/LimitOrder");
const Deposit = require("../transactions/Deposit");
const {
  OpenOrderFields,
  CloseOrderFields,
  PerpOrder,
} = require("../transactions/PerpOrder");
const Withdrawal = require("../transactions/Withdrawal");

/* global BigInt */

const USER_ID_MASK =
  172815432917432758348972343289652348293569370432238525823094893243n;
const PRIVATE_SEED_MASK =
  3289567280438953725403208532754302390573452930958285878326574839523n;
const VIEW_KEY_MASK =
  7689472303258934252343208597532492385943798632767034892572348289573n;
const SPEND_KEY_MASK =
  8232958253823489479856437527982347891347326348905738437643519378455n;
// const COMMITMENT_MASK = 112233445566778899n;
// const AMOUNT_MASK = 998877665544332112n;

// TODOS !!!!!!!!!!!!!!!!!!!!!!!!!!!
// TODO: Make a function that calculates the aproximate amount of margin left for position based on entry and OB price
// TODO: A function that calculates the max leverage for a token and amount

export default class User extends UserBase {
  async handleActiveOrders(
    badOrderIds,
    orders,
    badPerpOrderIds,
    perpOrders,
    pfrNotes,
    emptyPrivKeys,
    emptyPositionPrivKeys
  ) {
    // ? Get the indexes of notes that are used in active orders (not partially filled)
    let activeOrderNoteIndexes = [];
    for (let order of orders) {
      for (let note of order.notes_in) {
        activeOrderNoteIndexes.push(note.index.toString());
      }

      if (order.refund_note) {
        this.refundNotes[order.order_id] = Note.fromGrpcObject(
          order.refund_note
        );
      }
    }
    for (let order of perpOrders) {
      if (order.position_effect_type == 0) {
        for (let note of order.notes_in) {
          activeOrderNoteIndexes.push(note.index.toString());
        }

        if (order.refund_note) {
          this.refundNotes[order.order_id] = Note.fromGrpcObject(
            order.refund_note
          );
        }
      }
    }

    // ? if there are no spot orders and no open/close orders than get rid of emptyPrivKeys
    let noActiveOrders = orders.length == 0;
    for (let order of perpOrders) {
      noActiveOrders =
        noActiveOrders &&
        (order.position_effect_type != 0 ||
          order.position_effect_type != "Open") &&
        (order.position_effect_type != 2 ||
          order.position_effect_type != "Close");
    }
    if (noActiveOrders) {
      for (let privKey of emptyPrivKeys) {
        removePrivKey(this.userId, privKey, false, this.privateSeed);
      }
    }
    // ? If there are no perp orders than get rid of emptyPositionPrivKeys
    if (perpOrders.length == 0) {
      for (let privKey of emptyPositionPrivKeys) {
        removePrivKey(this.userId, privKey, true, this.privateSeed);
      }
    }

    // ? Get the notes that aren't currently used in active orders and save the addresses of those that are
    let frozenAddresses = [];
    let newNoteData = {};

    for (const [token, arr] of Object.entries(this.noteData)) {
      newNoteData[token] = [];

      for (const note of arr) {
        if (!activeOrderNoteIndexes.includes(note.index.toString())) {
          newNoteData[token].push(note);
        } else {
          frozenAddresses.push(note.address.getX().toString());
        }
      }

      // for (const pfrKey of pfrKeys) {
      //   let addr = getKeyPair(pfrKey).getPublic().getX();

      //   let idxs = newNoteData[token]
      //     .filter((n) => n.address.getX().toString() == addr.toString())
      //     .map((n) => Number.parseInt(n.index));
      //   let maxIdx = Math.max(...idxs);

      //   let idx = newNoteData[token].findIndex((n) => n.index == maxIdx);

      //   if (idx !== -1 && !frozenAddresses.includes(addr.toString())) {
      //     newNoteData[token].splice(idx, 1);
      //   }
      // }
    }
    // ? Remove pfr notes from noteData

    for (const note of pfrNotes) {
      let token = note.token;
      let addr = note.address.getX().toString();

      if (!newNoteData[token]) {
        newNoteData[token] = [];
      }

      if (!frozenAddresses.includes(addr)) {
        // Find the index of the note with the same hash
        let idx = newNoteData[token].findIndex(
          (n) => n.hash == note.hash && n.index == note.index
        );

        newNoteData[token].splice(idx, 1);
      }
    }

    // If bad order Id and pfrAddress exists, add the note to the user's noteData

    this.orders = orders;
    this.perpetualOrders = perpOrders;

    for (let orderId of badOrderIds) {
      removeOrderId(this.userId, orderId, false, this.privateSeed);

      if (this.pfrKeys[orderId]) {
        handlePfrNoteData(
          this.userId,
          this.pfrKeys[orderId],
          this.privateSeed,
          newNoteData,
          this.notePrivKeys
        );
      }
    }
    for (let orderId of badPerpOrderIds) {
      removeOrderId(this.userId, orderId, true, this.privateSeed);

      if (this.pfrKeys[orderId]) {
        handlePfrNoteData(
          this.userId,
          this.pfrKeys[orderId],
          this.privateSeed,
          newNoteData,
          this.notePrivKeys
        );
      }
    }

    let noteDataNew = {};
    for (let [token, arr] of Object.entries(newNoteData)) {
      let newArr = [];
      for (let pos of arr) {
        // Check if a note with the same index is already in the newArr
        if (!newArr.find((n) => n.index == pos.index)) {
          newArr.push(pos);
        }
      }

      noteDataNew[token] = newArr;
    }

    this.noteData = noteDataNew;
  }

  //* GENERATE ORDERS  ==========================================================

  makePerpetualOrder(
    expiration_timestamp,
    position_effect_type,
    positionAddress,
    order_side,
    synthetic_token,
    collateral_token,
    synthetic_amount,
    collateral_amount,
    fee_limit,
    initial_margin,
    allow_partial_liquidation = true
  ) {
    if (!["Open", "Close", "Modify"].includes(position_effect_type)) {
      throw "Invalid position effect type (liquidation orders created seperately)";
    }

    if (!["Long", "Short"].includes(order_side)) {
      throw "Invalid order side";
    }

    let open_order_fields = null;
    let close_order_fields = null;

    let privKeys = null;

    let positionPrivKey = null;
    let perpPosition = null;

    if (position_effect_type == "Open") {
      // ? Get the notesIn and priv keys for these notes
      let { notesIn, refundAmount } = this.getNotesInAndRefundAmount(
        collateral_token,
        initial_margin
      );

      // ? Generate the dest spent and dest received addresses and blindings
      privKeys = notesIn.map((x) => x.privKey);

      let refundNote;
      if (refundAmount > DUST_AMOUNT_PER_ASSET[collateral_token]) {
        let { KoR, koR, ytR } = this.getDestReceivedAddresses(synthetic_token);
        this.notePrivKeys[KoR.getX().toString()] = koR;

        refundNote = new Note(
          KoR,
          collateral_token,
          refundAmount,
          ytR,
          notesIn[0].note.index
        );

        storePrivKey(this.userId, koR, false, this.privateSeed);
      }

      let { positionPrivKey, positionAddress } =
        this.getPositionAddress(synthetic_token);
      this.positionPrivKeys[positionAddress.getX().toString()] =
        positionPrivKey;

      open_order_fields = new OpenOrderFields(
        initial_margin,
        collateral_token,
        notesIn.map((n) => n.note),
        refundNote,
        positionAddress.getX().toString(),
        allow_partial_liquidation
      );

      storeUserData(this.userId, this.noteCounts, this.positionCounts);

      storePrivKey(this.userId, positionPrivKey, true, this.privateSeed);
    } else if (position_effect_type == "Close") {
      let { KoR, koR, ytR } = this.getDestReceivedAddresses(collateral_token);
      this.notePrivKeys[KoR.getX().toString()] = koR;

      close_order_fields = new CloseOrderFields(KoR, ytR);

      storeUserData(this.userId, this.noteCounts, this.positionCounts);

      storePrivKey(this.userId, koR, false, this.privateSeed);

      // ? Get the position priv Key for this position
      if (this.positionData[synthetic_token].length > 0) {
        for (let pos of this.positionData[synthetic_token]) {
          if (pos.position_header.position_address == positionAddress) {
            perpPosition = pos;
            break;
          }
        }
        positionPrivKey = this.positionPrivKeys[positionAddress];

        if (perpPosition.order_side == "Long") {
          order_side = "Short";
        } else {
          order_side = "Long";
        }
      } else {
        throw "No open position to close";
      }
    } else {
      // ? Get the position priv Key for this position
      if (this.positionData[synthetic_token].length > 0) {
        for (let pos of this.positionData[synthetic_token]) {
          if (pos.position_header.position_address == positionAddress) {
            perpPosition = pos;
            break;
          }
        }
        positionPrivKey = this.positionPrivKeys[positionAddress];
      }
    }

    let privKeySum;
    if (privKeys) {
      privKeySum = privKeys.reduce((a, b) => a + b, 0n);
    }

    let perpOrder = new PerpOrder(
      expiration_timestamp,
      perpPosition,
      position_effect_type,
      order_side,
      synthetic_token,
      synthetic_amount,
      collateral_amount,
      fee_limit,
      open_order_fields,
      close_order_fields
    );

    let _signature = perpOrder.signOrder(privKeys, positionPrivKey);

    return { perpOrder, pfrKey: privKeySum };
  }

  makeLiquidationOrder(
    liquidatedPosition,
    synthetic_amount,
    collateral_amount,
    initial_margin,
    allow_partial_liquidation = true
  ) {
    // ? Get the position priv Key for this position
    let order_side = liquidatedPosition.order_side == "Long" ? "Short" : "Long";

    // ? Get the notesIn and priv keys for these notes
    let { notesIn, refundAmount } = this.getNotesInAndRefundAmount(
      COLLATERAL_TOKEN,
      initial_margin
    );

    // ? Generate the dest spent and dest received addresses and blindings
    let privKeys = notesIn.map((x) => x.privKey);

    let refundNote;
    if (refundAmount > DUST_AMOUNT_PER_ASSET[COLLATERAL_TOKEN]) {
      let { KoR, koR, ytR } = this.getDestReceivedAddresses(COLLATERAL_TOKEN);
      this.notePrivKeys[KoR.getX().toString()] = koR;

      refundNote = new Note(
        KoR,
        COLLATERAL_TOKEN,
        refundAmount,
        ytR,
        notesIn[0].note.index
      );

      storePrivKey(this.userId, koR, false, this.privateSeed);
    }

    let { positionPrivKey, positionAddress } = this.getPositionAddress(
      liquidatedPosition.position_header.synthetic_token
    );
    this.positionPrivKeys[positionAddress.getX().toString()] = positionPrivKey;

    let open_order_fields = new OpenOrderFields(
      initial_margin,
      COLLATERAL_TOKEN,
      notesIn.map((n) => n.note),
      refundNote,
      positionAddress.getX().toString(),
      allow_partial_liquidation
    );

    storeUserData(this.userId, this.noteCounts, this.positionCounts);
    storePrivKey(this.userId, positionPrivKey, true, this.privateSeed);

    let perpOrder = new LiquidationOrder(
      liquidatedPosition,
      order_side,
      liquidatedPosition.position_header.synthetic_token,
      synthetic_amount,
      collateral_amount,
      open_order_fields
    );

    let _sig = perpOrder.signOrder(privKeys);

    return perpOrder;
  }

  makeLimitOrder(
    expiration_timestamp,
    token_spent,
    token_received,
    amount_spent,
    amount_received,
    fee_limit
  ) {
    // ? Get the notesIn and priv keys for these notes
    let { notesIn, refundAmount } = this.getNotesInAndRefundAmount(
      token_spent,
      amount_spent
    );

    // ? Generate the dest spent and dest received addresses and blindings

    let privKeys = notesIn.map((x) => x.privKey);
    let { KoR, koR, ytR } = this.getDestReceivedAddresses(token_received);

    let privKeySum = privKeys.reduce((a, b) => a + b, 0n);
    this.notePrivKeys[KoR.getX().toString()] = koR;

    let refundNote;
    if (refundAmount > DUST_AMOUNT_PER_ASSET[token_spent]) {
      let {
        KoR: KoR2,
        koR: koR2,
        ytR: ytR2,
      } = this.getDestReceivedAddresses(token_spent);
      this.notePrivKeys[KoR2.getX().toString()] = koR2;

      refundNote = new Note(
        KoR2,
        token_spent,
        refundAmount,
        ytR2,
        notesIn[0].note.index
      );

      storePrivKey(this.userId, koR2, false, this.privateSeed);
    }

    // ? generate the refund note
    let spotNoteInfo = new SpotNotesInfo(
      KoR,
      ytR,
      notesIn.map((x) => x.note),
      refundNote
    );

    let limitOrder = new LimitOrder(
      expiration_timestamp,
      token_spent,
      token_received,
      amount_spent,
      amount_received,
      fee_limit,
      spotNoteInfo,
      null
    );

    let _sig = limitOrder.signOrder(privKeys);

    storeUserData(this.userId, this.noteCounts, this.positionCounts);

    storePrivKey(this.userId, koR, false, this.privateSeed);

    return { limitOrder, pfrKey: privKeySum };
  }

  makeDepositOrder(depositId, depositAmount, depositToken, starkKey) {
    let depositStarkKey = this.getDepositStarkKey(depositToken);
    let privKey = this._getDepositStarkPrivKey(depositToken);

    // TODO =============================================================
    // if (starkKey != depositStarkKey) {
    //   throw new Error("Invalid stark key");
    // }

    // let chainId = Number.parseInt(BigInt(depositId) / 2n ** 32n);
    // if (!Object.values(CHAIN_IDS).includes(chainId)) {
    //   throw new Error("Invalid Chain id");
    // }

    // TODO =============================================================

    let { KoR, koR, ytR } = this.getDestReceivedAddresses(depositToken);
    let note = new Note(KoR, depositToken, depositAmount, ytR);
    this.notePrivKeys[KoR.getX().toString()] = koR;

    let sig = Deposit.signDeposit(depositId, [note], privKey);

    let deposit = new Deposit(
      depositId,
      depositToken,
      depositAmount,
      depositStarkKey,
      [note],
      sig
    );

    storeUserData(this.userId, this.noteCounts, this.positionCounts);

    storePrivKey(this.userId, koR, false, this.privateSeed);

    return deposit;
  }

  makeWithdrawalOrder(
    withdrawAmount,
    withdrawToken,
    withdrawalAddress,
    whitdrawalChainId,
    maxGasFee
  ) {
    if (!withdrawalAddress) return null;
    if (withdrawalAddress.toString().startsWith("0x")) {
      withdrawalAddress = BigInt(withdrawalAddress, 16);
    }
    if (!maxGasFee) maxGasFee = 0n;

    // ? Get the notesIn and priv keys for these notes
    let { notesIn, refundAmount } = this.getNotesInAndRefundAmount(
      withdrawToken,
      withdrawAmount
    );

    // ? Generate the dest spent and dest received addresses and blindings
    let privKeys = notesIn.map((x) => x.privKey);
    notesIn = notesIn.map((x) => x.note);
    let { KoR, koR, ytR } = this.getDestReceivedAddresses(withdrawToken);
    this.notePrivKeys[KoR.getX().toString()] = koR;

    // ? generate the refund note
    let refundNote = new Note(
      KoR,
      withdrawToken,
      refundAmount,
      ytR,
      notesIn[0].index
    );

    let signature = Withdrawal.signWithdrawal(
      notesIn,
      privKeys,
      refundNote,
      withdrawalAddress,
      whitdrawalChainId,
      maxGasFee
    );

    let withdrawal = new Withdrawal(
      whitdrawalChainId,
      withdrawToken,
      withdrawAmount,
      withdrawalAddress,
      maxGasFee,
      notesIn,
      refundNote,
      signature
    );

    storeUserData(this.userId, this.noteCounts, this.positionCounts);

    storePrivKey(this.userId, koR, false, this.privateSeed);

    return withdrawal;
  }

  restructureNotes(token, newAmount) {
    if (!newAmount) throw Error("No new amount provided");

    let { notesIn, refundAmount } = this.getNotesInAndRefundAmount(
      token,
      newAmount
    );

    if (!refundAmount || refundAmount <= 0) return null;

    let address0 = notesIn[0].note.address;
    let blinding0 = notesIn[0].note.blinding;
    let address1 = notesIn[notesIn.length - 1].note.address;
    let blinding1 = notesIn[notesIn.length - 1].note.blinding;

    let newNote = new Note(address0, token, newAmount, blinding0);

    // ? generate the refund note
    let refundNote = new Note(address1, token, refundAmount, blinding1);

    return {
      notesIn: notesIn.map((n) => n.note),
      newNote,
      refundNote,
    };
  }

  changeMargin(positionAddress, token, direction, amount) {
    if (amount == 0) throw Error("amount is zero");
    amount = Number.parseInt(amount);

    let position;
    let positionPrivKey;
    for (let position_ of this.positionData[token]) {
      if (position_.position_header.position_address == positionAddress) {
        position = position_;
        positionPrivKey = this.positionPrivKeys[positionAddress];

        break;
      }
    }
    if (position == null) throw Error("Position not found");

    let notes_in;
    let refund_note;
    let close_order_fields;
    let signature;

    if (direction == "Add") {
      // ? Get the notesIn and priv keys for these notes

      let { notesIn, refundAmount } = this.getNotesInAndRefundAmount(
        COLLATERAL_TOKEN,
        amount
      );

      // ? generate the refund note
      if (refundAmount > 0) {
        refund_note = new Note(
          notesIn[0].note.address,
          notesIn[0].note.token,
          refundAmount,
          notesIn[0].note.blinding,
          notesIn[0].note.index
        );
      }

      signature = signMarginChange(
        direction,
        amount,
        notesIn,
        refund_note,
        close_order_fields,
        position,
        positionPrivKey
      );

      notes_in = notesIn.map((n) => n.note);
    } else if (direction == "Remove") {
      let { KoR, koR, ytR } = this.getDestReceivedAddresses(COLLATERAL_TOKEN);
      this.notePrivKeys[KoR.getX().toString()] = koR;

      close_order_fields = new CloseOrderFields(KoR, ytR);

      signature = signMarginChange(
        direction,
        amount,
        notes_in,
        refund_note,
        close_order_fields,
        position,
        positionPrivKey
      );

      // this.perpetualOrderIds.push(order_id);
      storeUserData(this.userId, this.noteCounts, this.positionCounts);
      storePrivKey(this.userId, koR, false, this.privateSeed);
    } else throw Error("Invalid direction");

    return {
      notes_in,
      refund_note,
      close_order_fields,
      position,
      signature,
    };
  }

  // * ORDER HELPERS ============================================================
  getDestReceivedAddresses(tokenReceived) {
    // & This returns the dest received address and blinding

    // ? Get a pseudo-random deterministic number
    // ? from the private seed and token count to generate an address
    let noteCount2 = this.noteCounts[tokenReceived] ?? 0;

    // ? Update the note count
    this.noteCounts[tokenReceived] = (noteCount2 + 1) % 32;

    // ? Generate a new address and private key pair
    let koR = this.oneTimeAddressPrivKey(noteCount2, tokenReceived, "note");
    let KoR = getKeyPair(koR).getPublic();

    // ? Get the blinding for the note
    let ytR = this.generateBlinding(KoR);

    return { KoR, koR, ytR };
  }

  getNotesInAndRefundAmount(token, spendAmount) {
    // ? Get the notes in and refund note
    let notesIn = [];
    let amount = 0;

    if (!this.noteData[token]) throw new Error("Insufficient funds");
    let noteIn = this.noteData[token].find((n) => n.amount == spendAmount);
    if (noteIn) {
      const privKey = this.notePrivKeys[BigInt(noteIn.address.getX())];
      return { notesIn: [{ privKey, note: noteIn }], refundAmount: 0 };
    }

    let notes = [...this.noteData[token]];
    notes = notes.sort((a, b) => a.amount - b.amount);

    for (let i = 0; i < notes.length; i++) {
      const note = notes[i];
      const privKey = this.notePrivKeys[BigInt(note.address.getX())];

      amount += note.amount;
      notesIn.push({ privKey, note });

      // ? Get the refund note
      if (amount >= spendAmount) {
        let refundAmount = amount - Number.parseInt(spendAmount);

        return { notesIn, refundAmount };
      }
    }

    // ? If we get here, we don't have enough notes to cover the amount
    throw new Error("Insufficient funds");
  }

  getPositionAddress(syntheticToken) {
    let posCount = this.positionCounts[syntheticToken] ?? 0;

    this.positionCounts[syntheticToken] = (posCount + 1) % 16;

    let positionPrivKey = this.oneTimeAddressPrivKey(
      posCount,
      syntheticToken,
      "position"
    );
    let positionAddress = getKeyPair(positionPrivKey).getPublic();

    return { positionPrivKey, positionAddress };
  }

  getDepositStarkKey(depositToken) {
    let depositStarkKey = getKeyPair(this._getDepositStarkPrivKey(depositToken))
      .getPublic()
      .getX();
    return BigInt(depositStarkKey);
  }

  _getDepositStarkPrivKey(depositToken) {
    // TODO: This is a temporary function to get the deposit stark key
    return pedersen([this.privateSeed, depositToken]);
  }

  //* HELPERS ===========================================================================

  subaddressPrivKeys(randSeed) {
    return _subaddressPrivKeys(this.privSpendKey, this.privViewKey, randSeed);
  }

  oneTimeAddressPrivKey(count, token, type) {
    let seed;
    switch (type) {
      case "note":
        let noteSeedRandomness =
          328965294021249504871258328423859990890523432589236523n;
        seed = pedersen([noteSeedRandomness, token]);
        break;
      case "position":
        let positionSeedRandomness =
          87311195862357333589832472352389732849239571003295829n;
        seed = pedersen([positionSeedRandomness, token]);
        break;
      case "order_tab":
        let orderTabSeedRandomness =
          3289651004221748755344442085963285230025892366052333n;
        seed = pedersen([orderTabSeedRandomness, token]);
        break;

      default:
        break;
    }

    let { ksi, kvi } = this.subaddressPrivKeys(seed);
    let Kvi = getKeyPair(kvi).getPublic();

    return _oneTimeAddressPrivKey(Kvi, ksi, count);
  }

  generateBlinding(Ko) {
    return _generateNewBliding(Ko.getX(), this.privateSeed);
  }

  // Hides the values for the recipient
  hideValuesForRecipient(Ko, amount) {
    return _hideValuesForRecipient(Ko, amount, this.privateSeed);
  }

  // Used to reveal the blindings and amounts of the notes addressed to this user's ith subaddress
  revealHiddenValues(Ko, hiddenAmount, commitment) {
    return _revealHiddenValues(Ko, this.privateSeed, hiddenAmount, commitment);
  }

  // // Checks if the transaction is addressed to this user's its subaddress
  // checkOwnership(rKsi, Ko, ith = 1) {
  //   return _checkOwnership(rKsi, Ko, this.privSpendKey, this.privViewKey, ith);
  // }

  // * STATIC ========================================================================

  static fromPrivKey(privKey_) {
    try {
      if (!privKey_.startsWith("0x")) privKey_ = "0x" + privKey_;

      let privKey = BigInt(privKey_, 16);

      // & Generates a privViewKey and privSpendKey from one onchain private key and generates a user from it
      let privViewKey = trimHash(
        pedersen([VIEW_KEY_MASK, BigInt(privKey, 16)]),
        240
      );
      let privSpendKey = trimHash(
        pedersen([SPEND_KEY_MASK, BigInt(privKey, 16)]),
        240
      );

      let user = new User(privViewKey, privSpendKey);

      return user;
    } catch (e) {
      console.log(e);
      throw Error("Enter a hexademical private key");
    }
  }
}
