import { restoreUserState } from "../helpers/keyRetrieval.js";

const { pedersen, computeHashOnElements } = require("../helpers/pedersen");
const { getKeyPair } = require("starknet").ec;

const {
  fetchUserData,
  removePrivKey,
  removeOrderId,
  fetchUserFills,
  fetchOnchainDeposits,
  fetchPendingWithdrawals,
  fetchActiveWithdrawals,
} = require("../helpers/firebaseConnection");

const {
  fetchNoteData,
  fetchPositionData,
  handlePfrNoteData,
} = require("./Invisibl3UserUtils.js");

const { Note, trimHash } = require("./Notes.js");

/* global BigInt */

const USER_ID_MASK =
  1728154329174327583489723432896523482935693704322138525823094893243n;
const PRIVATE_SEED_MASK =
  3289567280438953725403208532754302390573452930958285878326574839523n;
const VIEW_KEY_MASK =
  7689472303258934252343208597532492385943798632767034892572348289573n;
const SPEND_KEY_MASK =
  8232958253823489479856437527982347891347326348905738437643519378455n;

export default class UserBase {
  // Each user has a class where he stores all his information (should never be shared with anyone)
  // private keys should be 240 bits
  constructor(_privViewKey, _privSpendKey) {
    if (
      _privViewKey.toString(2).length > 240 ||
      _privSpendKey.toString(2).length > 240
    ) {
      throw new Error("private keys should be 240 bits");
    }

    this.userId = computeHashOnElements([
      USER_ID_MASK,
      _privViewKey,
      _privSpendKey,
    ]);
    this.privViewKey = _privViewKey; //kv
    this.privSpendKey = _privSpendKey; //ks

    // ? privateSeed only uses the privViewKey because it allows someone to disclose their history,
    // ? without allowing them to spend their funds
    this.privateSeed = computeHashOnElements([
      PRIVATE_SEED_MASK,
      _privViewKey,
      _privSpendKey,
    ]);

    // ? Number of notes generated by the user for each token
    this.noteCounts = {};
    // ? Number of positions opened by the user for each token
    this.positionCounts = {};

    this.pubViewKey = getKeyPair(_privViewKey);
    this.pubSpendKey = getKeyPair(_privSpendKey);

    this.orderIds = [];
    this.perpetualOrderIds = [];

    this.orders = []; // {base_asset,expiration_timestamp,fee_limit,notes_in,order_id,order_side,price,qty_left,quote_asset,refund_note}
    this.perpetualOrders = []; // {order_id,expiration_timestamp,qty_left,price,synthetic_token,order_side,position_effect_type,fee_limit,position_address,notes_in,refund_note,initial_margin}

    this.depositIds = []; // these ids are in encrypted format
    this.deposits = []; // {depositId, tokenId, depositAmount, starkKey, timestamp, txHash}

    this.withdrawals = [];
    this.withdrawalIds = [];

    // this.noteData structure is as follows:  {token1: [note1,..., noteN],...,tokenN: ...]}
    this.noteData = {};
    this.notePrivKeys = {}; // Maps {noteAddress: privKey}
    // this.positionData structure is as follows:  {token1: [positionJson1,...],...,tokenN: [positionJsonN,...]}
    this.positionData = {};
    this.positionPrivKeys = {}; // Maps {posAddress: privKey}
    //
    this.refundNotes = {}; // {orderId: refundNote}
    this.filledAmounts = {}; // {orderId: filledAmount}
    this.closingPositions = {}; // {orderId: position}
    this.awaittingOrder = false; // set to true when an order is created and to false when it's accepted (filled if market)
    //
    this.pfrKeys = {}; // Maps {orderId: pfrPrivKey}
    this.fills = []; // [{base_token, amount, price, side, time, isPerp}]
  }

  //* FETCH USER DATA  =========================================================

  getAvailableAmount(token) {
    let sum = 0;
    if (!this.noteData[token]) {
      return 0;
    }
    for (let n of this.noteData[token]) {
      sum += n.amount;
    }

    return sum;
  }

  async login() {
    let userData = await fetchUserData(this.userId, this.privateSeed).catch(
      console.log
    );

    // ? Get Pending Deposits =====================================
    let { deposits, newDepositIds } = await fetchOnchainDeposits(
      userData.depositIds,
      this.privateSeed
    );
    this.deposits = deposits ?? [];
    this.depositIds = newDepositIds ?? [];

    console.log("deposits123", deposits);

    // ? Get Pending Deposits =====================================
    let { withdrawals, newWithdrawalIds } = await fetchPendingWithdrawals(
      userData.withdrawalIds,
      this.privateSeed
    );

    console.log("withdrawals123", withdrawals);

    this.withdrawals = withdrawals ?? [];
    this.withdrawalIds = newWithdrawalIds ?? [];

    // ? Get Note Data ============================================
    let keyPairs =
      userData.privKeys.length > 0
        ? userData.privKeys.map((pk) => getKeyPair(pk))
        : [];

    let { emptyPrivKeys, noteData, notePrivKeys, error } = await fetchNoteData(
      keyPairs,
      this.privateSeed
    );
    if (error) {
      restoreUserState(this, true, false).catch(console.log);
    }

    // ? Get Position Data ============================================
    let addressData =
      userData.positionPrivKeys.length > 0
        ? userData.positionPrivKeys.map((pk) => {
            return { pk: pk, address: getKeyPair(pk).getPublic() };
          })
        : [];

    let {
      emptyPositionPrivKeys,
      positionData,
      posPrivKeys,
      error: error2,
    } = await fetchPositionData(addressData);
    if (error2) {
      restoreUserState(this, false, true).catch(console.log);
    }

    // ? Get Fill Data ============================================

    let fills = await fetchUserFills(this.userId);

    // ? Get Order Data ============================================

    let positionDataNew = {};
    for (let [token, arr] of Object.entries(positionData)) {
      let newArr = [];
      for (let pos of arr) {
        // Check if a position with the same index is already in the newArr
        if (!newArr.find((p) => p.index == pos.index)) {
          newArr.push(pos);
        }
      }

      positionDataNew[token] = newArr;
    }

    this.noteData = noteData;
    this.notePrivKeys = notePrivKeys;
    this.noteCounts = userData.noteCounts;
    this.positionCounts = userData.positionCounts;
    this.positionData = positionDataNew;
    this.positionPrivKeys = posPrivKeys;
    this.orderIds = [...new Set(userData.orderIds)];
    this.perpetualOrderIds = [...new Set(userData.perpetualOrderIds)];
    this.pfrKeys = userData.pfrKeys;
    this.fills = [...new Set(fills)];

    return { emptyPrivKeys, emptyPositionPrivKeys };
  }

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

  static getkeyPairsFromPrivKeys(privKeys) {
    let keyPairs = [];
    for (let privKey of privKeys) {
      let keyPair = getKeyPair(privKey);
      keyPairs.push(keyPair);
    }

    return keyPairs;
  }
}

//
//
//
//
//
//
//
//
//
//