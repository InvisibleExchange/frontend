const axios = require("axios");
const User = require("../users/Invisibl3User").default;
const { Note, trimHash } = require("../users/Notes");

const SYMBOLS_TO_IDS = {
  BTC: 12345,
  ETH: 54321,
  USDC: 55555,
  PEPE: 66666,
};
const IDS_TO_SYMBOLS = {
  12345: "BTC",
  54321: "ETH",
  55555: "USDC",
  66666: "PEPE",
};

const CHAIN_IDS = {
  "ETH Mainnet": 9090909,
  Starknet: 7878787,
  ZkSync: 5656565,
};

const DECIMALS_PER_ASSET = {
  12345: 9, // BTC
  54321: 9, // ETH
  55555: 6, // USDC
  66666: 0, // PEPE
};

const PRICE_DECIMALS_PER_ASSET = {
  12345: 6, // BTC
  54321: 6, // ETH
  66666: 10, // PEPE
};

const DUST_AMOUNT_PER_ASSET = {
  12345: 2500, // BTC ~ 5c
  54321: 25000, // ETH ~ 5c
  55555: 50000, // USDC ~ 5c
  66666: 50000, // PEPE ~ 5c
};

const LEVERAGE_DECIMALS = 4;
const COLLATERAL_TOKEN_DECIMALS = 6;
const COLLATERAL_TOKEN = 55555;

// const SERVER_URL = "localhost";
// const EXPRESS_APP_URL = `http://${SERVER_URL}:4000`;
// const SERVER_WS_URL = `ws://${SERVER_URL}:50053`;
// const RELAY_WS_URL = `ws://${SERVER_URL}:4040`;

const SERVER_URL = "54.212.28.196";
const EXPRESS_APP_URL = "https://invisible.zigzag.exchange/api";
const SERVER_WS_URL = "wss://invisible.zigzag.exchange/ws2";
const RELAY_WS_URL = "wss://invisible.zigzag.exchange/ws1";

/// Things we keep track of
/// Index prices
/// Orderbooks

const SPOT_MARKET_IDS = {
  12345: 11,
  54321: 12,
};

const PERP_MARKET_IDS = {
  12345: 21,
  54321: 22,
  66666: 23,
};

const SPOT_MARKET_IDS_2_TOKENS = {
  11: { base: 12345, quote: 55555 },
  12: { base: 54321, quote: 55555 },
};

const PERP_MARKET_IDS_2_TOKENS = {
  21: 12345,
  22: 54321,
  23: 66666,
};

// How many decimals to round to on the frontend
const PRICE_ROUNDING_DECIMALS = {
  12345: 2,
  54321: 2,
  55555: 2,
  66666: 9,
};

// How many decimals to round to on the frontend
const SIZE_ROUNDING_DECIMALS = {
  12345: 4,
  54321: 4,
  55555: 2,
  66666: 0,
};

/**
 * gets the order book entries for a given market
 * ## Params:
 * @param  token
 * @param  isPerp if is perpetual market
 * ## Returns:
 * @return {} {bid_queue, ask_queue}  queue structure= [price, size, timestamp]
 */
async function fetchLiquidity(token, isPerp) {
  let marketId = isPerp ? PERP_MARKET_IDS[token] : SPOT_MARKET_IDS[token];

  return await axios
    .post(`${EXPRESS_APP_URL}/get_liquidity`, {
      market_id: marketId,
      is_perp: isPerp,
    })
    .then((res) => {
      let liquidity_response = res.data.response;

      if (liquidity_response.successful) {
        let bidQueue = liquidity_response.bid_queue;
        let askQueue = liquidity_response.ask_queue;

        return { bidQueue, askQueue };
      } else {
        let msg =
          "Getting liquidity failed with error: \n" +
          liquidity_response.error_message;
        throw new Error(msg);
      }
    });
}

// Also a websocket to listen to orderbook updates
// let W3CWebSocket = require("websocket").w3cwebsocket;
// client = new W3CWebSocket("ws://localhost:50053/");

// client.onopen = function () {
//   client.send(trimHash(user.userId, 64));
// };

// client.onmessage = function (e) {
//   let msg = JSON.parse(e.data);

// MESSAGE OPTIONS:

// 1.)
// "message_id": LIQUIDITY_UPDATE,
// "liquidity_updates": [ liquidityUpdate1, liquidityUpdate2, ... ]
// => liquidityUpdate: {
//    "type": "perpetual"/"spot"
//    "market":  11 / 12 / 21 / 22
//    "ask_diffs": [ [index,[price, size, timestamp]], [index,[price, size, timestamp]], ... ]
//    "bid_diffs": [ [index,[price, size, timestamp]], [index,[price, size, timestamp]], ... ]
// }

// type: book.is_perp ? "perpetual" : "spot",
// market: book.market_id,
// bid_diffs: bid_diffs,
// ask_diffs: ask_diffs,

// 2.)
// "message_id": "PERPETUAL_SWAP",
// "order_id": u64,
// "swap_response": responseObject,
// -> handlePerpSwapResult(user, responseObject)

// 3.)
// "message_id": "SWAP_RESULT",
// "order_id": u64,
// "swap_response": responseObject,
// -> handleSwapResult(user, responseObject)

function handleLiquidityUpdate(
  result,
  liquidity,
  setLiquidity,
  perpLiquidity,
  setPerpLiquidity
) {
  let isSpotUpdated = false;
  let isPerpUpdated = false;

  for (let update of result.liquidity_updates) {
    update = JSON.parse(update);

    let isPerp = update.is_perp;
    let marketId = update.market_id;

    let liq = isPerp
      ? { ...perpLiquidity[PERP_MARKET_IDS_2_TOKENS[marketId]] }
      : { ...liquidity[SPOT_MARKET_IDS_2_TOKENS[marketId].base] };

    if (!liq) {
      liq = {
        bidQueue: [],
        askQueue: [],
      };
    }
    if (!liq.bidQueue) {
      liq.bidQueue = [];
    }
    if (!liq.askQueue) {
      liq.askQueue = [];
    }

    if (update.ask_queue) {
      let askQueue = update.ask_queue.map((item) => {
        return {
          price: item[0],
          amount: item[1],
          timestamp: item[2],
        };
      });
      let revAq = [];
      for (let i = askQueue.length - 1; i >= 0; i--) {
        revAq.push(askQueue[i]);
      }

      liq.askQueue = revAq;
    }

    if (update.bid_queue) {
      let bidQueue = update.bid_queue.map((item) => {
        return {
          price: item[0],
          amount: item[1],
          timestamp: item[2],
        };
      });

      liq.bidQueue = bidQueue;
    }

    if (isPerp) {
      isPerpUpdated = true;
      perpLiquidity[PERP_MARKET_IDS_2_TOKENS[marketId]] = liq;
    } else {
      isSpotUpdated = true;

      liquidity[SPOT_MARKET_IDS_2_TOKENS[marketId].base] = liq;
    }
  }

  if (isSpotUpdated) {
    setLiquidity(liquidity);
  }
  if (isPerpUpdated) {
    setPerpLiquidity(perpLiquidity);
  }
}

/**
 * Handles the result received from the backend after a swap executed.
 * @param  result  The result structure is:
 *  result format:
 *   {
 *          type: "perpetual"/"spot"
 *          asset: u64
 *          amount: u64
 *          price: u64
 *          is_buy: bool
 *          timestamp: u64
 *   }
 */
function handleFillResult(
  user,
  result,
  fills_,
  setFills,
  perpFills_,
  setPerpFills
) {
  for (let f of result.fillUpdates) {
    f = JSON.parse(f);

    let fills = f.type == "perpetual" ? perpFills_ : fills_;

    if (!fills[f.asset]) {
      fills[f.asset] = [];
    }

    fills[f.asset].unshift({
      amount: f.amount,
      price: f.price,
      base_token: f.asset,
      is_buy: f.is_buy,
      timestamp: f.timestamp,
      isPerp: f.type == "perpetual",
    });

    if (fills[f.asset].length > 15) {
      fills[f.asset] = fills[f.asset].slice(fills[f.asset].length - 15);
    }

    if (user) {
      let trimedId = trimHash(user.userId, 64).toString();

      if (f.user_id_a == trimedId || f.user_id_b == trimedId) {
        let fill = {
          amount: f.amount,
          price: f.price,
          base_token: f.asset,
          side: f.user_id_a == trimedId ? "Buy" : "Sell",
          time: f.timestamp,
          isPerp: f.type == "perpetual",
        };

        user.fills.unshift(fill);
      }
    }
  }

  setFills(fills_);
  setPerpFills(perpFills_);
}

/**
 * Handles the result received from the backend after a swap executed.
 * @param  result  The result structure is:
 *  result format:
 *   {
 *          swap_note: Note
 *          new_pfr_note: Note or null,
 *          new_amount_filled: u64,
 *          fee_taken: u64,
 *   }
 */
function handleSwapResult(user, orderId, swap_response) {
  let noteInfoSwapResponse = swap_response.note_info_swap_response;

  let swapNoteObject = noteInfoSwapResponse.swap_note;
  let swapNote = Note.fromGrpcObject(swapNoteObject);
  if (user.noteData[swapNote.token]) {
    user.noteData[swapNote.token].push(swapNote);
  } else {
    user.noteData[swapNote.token] = [swapNote];
  }

  // let newPfrNote_ = swap_response.new_pfr_note;
  // if (newPfrNote_) {
  //   let newPfrNote = Note.fromGrpcObject(newPfrNote_);
  //   user.pfrNotes.push(newPfrNote);
  // }

  if (user.refundNotes[orderId]) {
    if (
      noteInfoSwapResponse.swap_note.amount ==
      noteInfoSwapResponse.new_amount_filled - swap_response.fee_taken
    ) {
      // This is a limit first fill order and the refun note has been stored, then we can
      // add the refund note to the noteData
      let refund_note = user.refundNotes[orderId];

      if (user.noteData[refund_note.token]) {
        user.noteData[refund_note.token].push(refund_note);
      } else {
        user.noteData[refund_note.token] = [refund_note];
      }
    }
  }

  let idx = user.orders.findIndex((o) => o.order_id == orderId);
  let order = user.orders[idx];

  if (order) {
    order.qty_left -= noteInfoSwapResponse.swap_note.amount;

    if (!noteInfoSwapResponse.new_pfr_note) {
      user.orders.splice(idx, 1);
    } else {
      user.orders[idx] = order;
    }
  }
  user.filledAmounts[orderId] = noteInfoSwapResponse.new_amount_filled;
}

/**
 * Handles the result received from the backend after a perpetual swap executed.
 * @param  result  The result structure is:
 *  result format:
 *
 *
 *   {
 *       position: PerpPosition/null,
 *       new_pfr_info: [Note/null, u64,u64]>,
 *       return_collateral_note: Note/null,
 *       synthetic_token: u64,
 *       qty: u64,
 *       fee_taken: u64,
 *    }
 */
function handlePerpSwapResult(user, orderId, swap_response) {
  //

  // ? Save position data (if not null)
  let position = swap_response.position;

  if (position) {
    if (
      !user.positionData[position.position_header.synthetic_token] ||
      user.positionData[position.position_header.synthetic_token].length == 0
    ) {
      user.positionData[position.position_header.synthetic_token] = [position];
    } else {
      // check if positions with this address and index already exist
      let idx = user.positionData[
        position.position_header.synthetic_token
      ].findIndex(
        (p) =>
          p.position_header.position_address ==
            position.position_header.position_address &&
          p.index == position.index
      );

      if (idx >= 0) {
        user.positionData[position.position_header.synthetic_token][idx] =
          position;
      } else {
        user.positionData[position.position_header.synthetic_token].push(
          position
        );
      }
    }
  }

  // // ? Save partiall fill note (if not null)
  // let newPfrInfo = swap_response.new_pfr_info;
  // if (newPfrInfo && newPfrInfo[0]) {
  //   let newPfrNote = Note.fromGrpcObject(newPfrInfo[0]);
  //   user.pfrNotes.push(newPfrNote);
  // }

  // ? Save return collateral note (if not null)
  let returnCollateralNote = swap_response.return_collateral_note;
  if (returnCollateralNote) {
    let returnCollateralNoteObject = Note.fromGrpcObject(returnCollateralNote);
    if (user.noteData[returnCollateralNoteObject.token]) {
      user.noteData[returnCollateralNoteObject.token].push(
        returnCollateralNoteObject
      );
    } else {
      user.noteData[returnCollateralNoteObject.token] = [
        returnCollateralNoteObject,
      ];
    }

    if (!position) {
      // filter out the position that has synthetic_amount == qty
      let idx = user.positionData[swap_response.synthetic_token].findIndex(
        (p) =>
          Math.abs(p.position_size - swap_response.qty) <
          DUST_AMOUNT_PER_ASSET[p.position_header.synthetic_token]
      );

      if (idx >= 0) {
        user.positionData[swap_response.synthetic_token].splice(idx, 1);
      }
    }
  }

  if (user.refundNotes[orderId]) {
    if (
      swap_response.new_pfr_info[1] ==
      swap_response.qty - swap_response.fee_taken
    ) {
      // this is a limit order and the refun note has been stored, then we can
      // add the refund note to the noteData
      let refund_note = user.refundNotes[orderId];

      if (user.noteData[refund_note.token]) {
        user.noteData[refund_note.token].push(refund_note);
      } else {
        user.noteData[refund_note.token] = [refund_note];
      }
    }
  }

  let idx = user.perpetualOrders.findIndex((o) => o.order_id == orderId);
  let order = user.perpetualOrders[idx];

  if (order) {
    order.qty_left =
      order.qty_left - swap_response.qty - swap_response.fee_taken;

    if (order.qty_left < DUST_AMOUNT_PER_ASSET[swap_response.synthetic_token]) {
      user.perpetualOrders.splice(idx, 1);
    } else {
      user.perpetualOrders[idx] = order;
    }
  }

  user.filledAmounts[orderId] = swap_response.new_pfr_info[1];
}

/**
 * Handles the result received from the backend after a note split(restructuring)
 * Removes the previous notes and adds the new notes to the user's noteData and database.
 * @param  zero_idxs  The indexes of new notes
 */
function handleNoteSplit(user, zero_idxs, notesIn, notesOut) {
  //

  for (const noteIn of notesIn) {
    user.noteData[noteIn.token] = user.noteData[noteIn.token].filter(
      (n) => n.index != noteIn.index
    );
  }

  for (let i = 0; i < zero_idxs.length; i++) {
    let note = notesOut[i];
    note.index = zero_idxs[i];
    // storeNewNote(note);
    user.noteData[note.token].push(note);
  }
}

//

//

//

/**
 * This ask the user to sign a message to login. The signature is used to derive the private key
 * and use it to login and fetch all the user's data.
 * @param  signer  ethers.js signer
 */
async function loginUser(signer) {
  const keyDerivation =
    require("@starkware-industries/starkware-crypto-utils").keyDerivation;

  let sig = await signer.signMessage(
    "Sign this message to access your Invisibl3 account. \nIMPORTANT: Be careful to only sign this message on the official website!"
  );

  let pk = keyDerivation.getPrivateKeyFromEthSignature(sig);

  let user = User.fromPrivKey(pk);

  let { emptyPrivKeys, emptyPositionPrivKeys } = await user.login();

  let { badOrderIds, orders, badPerpOrderIds, perpOrders, pfrNotes } =
    await getActiveOrders(user.orderIds, user.perpetualOrderIds);

  await user.handleActiveOrders(
    badOrderIds,
    orders,
    badPerpOrderIds,
    perpOrders,
    pfrNotes,
    emptyPrivKeys,
    emptyPositionPrivKeys
  );

  return user;
}

async function getActiveOrders(order_ids, perp_order_ids) {
  return await axios
    .post(`${EXPRESS_APP_URL}/get_orders`, { order_ids, perp_order_ids })
    .then((res) => {
      let order_response = res.data.response;

      let badOrderIds = order_response.bad_order_ids;
      let orders = order_response.orders;
      let badPerpOrderIds = order_response.bad_perp_order_ids;
      let perpOrders = order_response.perp_orders;
      let pfrNotes = order_response.pfr_notes
        ? order_response.pfr_notes.map((n) => Note.fromGrpcObject(n))
        : [];

      return { badOrderIds, orders, badPerpOrderIds, perpOrders, pfrNotes };
    })
    .catch((err) => {
      alert(err);
    });
}

//

//

//

//

//

module.exports = {
  EXPRESS_APP_URL,
  SERVER_WS_URL,
  RELAY_WS_URL,
  DECIMALS_PER_ASSET,
  PRICE_DECIMALS_PER_ASSET,
  DUST_AMOUNT_PER_ASSET,
  LEVERAGE_DECIMALS,
  COLLATERAL_TOKEN_DECIMALS,
  COLLATERAL_TOKEN,
  CHAIN_IDS,
  handleSwapResult,
  handlePerpSwapResult,
  handleNoteSplit,
  handleFillResult,
  handleLiquidityUpdate,
  getActiveOrders,
  fetchLiquidity,
  loginUser,
  SYMBOLS_TO_IDS,
  IDS_TO_SYMBOLS,
  PERP_MARKET_IDS,
  SPOT_MARKET_IDS,
  SPOT_MARKET_IDS_2_TOKENS,
  PERP_MARKET_IDS_2_TOKENS,
  PRICE_ROUNDING_DECIMALS,
  SIZE_ROUNDING_DECIMALS,
};

//

//

//

//

//
