const axios = require("axios");
const User = require("../users/Invisibl3User").default;
const { Note } = require("../users/Notes");
const {
  storeNewNote,
  removeNoteFromDb,
} = require("./firebase/firebaseConnection");

const SYMBOLS_TO_IDS = {
  BTC: 12345,
  ETH: 54321,
  USDC: 55555,
};
const IDS_TO_SYMBOLS = {
  12345: "BTC",
  54321: "ETH",
  55555: "USDC",
};

const LEVERAGE_BOUNDS_PER_ASSET = {
  12345: [1, 20.0], // BTC
  54321: [10.0, 100.0], // ETH
};

const DECIMALS_PER_ASSET = {
  12345: 8, // BTC
  54321: 8, // ETH
  55555: 6, // USDC
};

const PRICE_DECIMALS_PER_ASSET = {
  12345: 6, // BTC
  54321: 6, // ETH
};

const DUST_AMOUNT_PER_ASSET = {
  12345: 100, // BTC ~ 1c
  54321: 1000, // ETH ~ 1c
  55555: 1000, // USDC ~ 0.1c
};

const MAX_LEVERAGE = 15;

const LEVERAGE_DECIMALS = 6;
const COLLATERAL_TOKEN_DECIMALS = 6;
const COLLATERAL_TOKEN = 55555;

function get_max_leverage(token, amount) {
  let [min_bound, max_bound] = LEVERAGE_BOUNDS_PER_ASSET[token];

  let maxLev;
  if (amount < min_bound) {
    maxLev = MAX_LEVERAGE;
  } else if (amount < max_bound) {
    // b. For trades between $100,000 and $1,000,000, reduce the maximum leverage proportionally, such as 50 * ($100,000/$trade size).

    maxLev = MAX_LEVERAGE * (min_bound / amount);
  } else {
    maxLev = 1;
  }

  return maxLev;
}

function getMinViableMargin(position) {
  const maxLeverage = get_max_leverage(
    position.synthetic_token,
    position.position_size / 10 ** DECIMALS_PER_ASSET[position.synthetic_token]
  );

  let maxLiquidationPrice = (1 - 1 / maxLeverage) * position.entry_price;

  let multiplier =
    10 **
    (DECIMALS_PER_ASSET[position.synthetic_token] +
      PRICE_DECIMALS_PER_ASSET[position.synthetic_token] -
      COLLATERAL_TOKEN_DECIMALS);

  let minMargin = (position.position_size * maxLiquidationPrice) / maxLeverage;
  minMargin = minMargin / multiplier;

  return minMargin;
}

function checkViableSizeAfterIncrease(position, added_size, added_price) {
  let new_size =
    position.position_size /
      10 ** DECIMALS_PER_ASSET[position.synthetic_token] +
    added_size;
  const maxLeverage = get_max_leverage(position.synthetic_token, new_size);

  let scaledPrice =
    added_price * 10 ** PRICE_DECIMALS_PER_ASSET[position.synthetic_token];
  let scaledSize =
    added_size * 10 ** DECIMALS_PER_ASSET[position.synthetic_token];

  let avgEntryPrice =
    (position.position_size * position.entry_price + scaledSize * scaledPrice) /
    (position.position_size + scaledSize);

  let leverage =
    ((position.position_size + scaledSize) * avgEntryPrice) / position.margin;

  let multiplier =
    10 **
    (DECIMALS_PER_ASSET[position.synthetic_token] +
      PRICE_DECIMALS_PER_ASSET[position.synthetic_token] -
      COLLATERAL_TOKEN_DECIMALS);

  leverage = leverage / multiplier;

  return leverage <= maxLeverage;
}

/// Things we keep track of
/// Index prices
/// Orderbooks

function _getBankruptcyPrice(
  entryPrice,
  margin,
  size,
  orderSide,
  syntheticToken
) {
  const syntheticDecimals = DECIMALS_PER_ASSET[syntheticToken];
  const syntheticPriceDecimals = PRICE_DECIMALS_PER_ASSET[syntheticToken];

  const decConversion1 =
    syntheticPriceDecimals - COLLATERAL_TOKEN_DECIMALS + syntheticDecimals;
  const multiplier1 = 10 ** decConversion1;

  if (orderSide == "Long" || orderSide == 0) {
    return entryPrice - (margin * multiplier1) / size;
  } else {
    const bp = entryPrice + (margin * multiplier1) / size;
    return bp;
  }
}

function _getLiquidationPrice(entryPrice, bankruptcyPrice, orderSide) {
  if (bankruptcyPrice == 0) {
    return 0;
  }

  // maintnance margin
  let mm_rate = 3; // 3% of 100

  // liquidation price is 2% above/below the bankruptcy price
  if (orderSide == "Long" || orderSide == 0) {
    return bankruptcyPrice + (mm_rate * entryPrice) / 100;
  } else {
    return bankruptcyPrice - (mm_rate * entryPrice) / 100;
  }
}

function calulateLiqPriceInMarginChangeModal(position, marginChange) {
  marginChange = marginChange * 10 ** COLLATERAL_TOKEN_DECIMALS;

  let bankruptcyPrice = _getBankruptcyPrice(
    position.entry_price,
    position.margin + marginChange,
    position.position_size,
    position.order_side,
    position.synthetic_token
  );

  let liqPrice = _getLiquidationPrice(
    position.entry_price,
    bankruptcyPrice,
    position.order_side
  );

  return Math.max(liqPrice, 0);
}

function calulateLiqPriceInIncreaseSize(position, sizeChange, indexPrice) {
  let scaledPrice =
    indexPrice * 10 ** PRICE_DECIMALS_PER_ASSET[position.synthetic_token];
  let scaledSize =
    sizeChange * 10 ** DECIMALS_PER_ASSET[position.synthetic_token];

  let avgEntryPrice =
    (position.position_size * position.entry_price + scaledSize * scaledPrice) /
    (position.position_size + scaledSize);

  let bankruptcyPrice = _getBankruptcyPrice(
    avgEntryPrice,
    position.margin,
    position.position_size + scaledSize,
    position.order_side,
    position.synthetic_token
  );

  let liqPrice = _getLiquidationPrice(
    avgEntryPrice,
    bankruptcyPrice,
    position.order_side
  );

  return Math.max(liqPrice, 0);
}

function calulateLiqPriceInDecreaseSize(position, sizeChange) {
  let scaledSize =
    sizeChange * 10 ** DECIMALS_PER_ASSET[position.synthetic_token];

  let new_size = position.position_size - scaledSize;

  let bankruptcyPrice = _getBankruptcyPrice(
    position.entry_price,
    position.margin,
    new_size,
    position.order_side,
    position.synthetic_token
  );

  let liqPrice = _getLiquidationPrice(
    position.entry_price,
    bankruptcyPrice,
    position.order_side
  );

  return Math.max(liqPrice, 0);
}

function calulateLiqPriceInFlipSide(position, sizeChange, indexPrice) {
  let scaledSize =
    sizeChange * 10 ** DECIMALS_PER_ASSET[position.synthetic_token];
  let scaledPrice =
    indexPrice * 10 ** PRICE_DECIMALS_PER_ASSET[position.synthetic_token];

  let new_size = scaledSize - position.position_size;

  let newOrderSide = position.order_side == "Long" ? "Short" : "Long";

  let bankruptcyPrice = _getBankruptcyPrice(
    scaledPrice,
    position.margin,
    new_size,
    newOrderSide,
    position.synthetic_token
  );

  let liqPrice = _getLiquidationPrice(
    scaledPrice,
    bankruptcyPrice,
    newOrderSide
  );

  return Math.max(liqPrice, 0);
}

function getCurrentLeverage(indexPrice, size, margin, syntheticToken) {
  if (indexPrice == 0) {
    throw "Index price cannot be 0";
  }

  const syntheticDecimals = DECIMALS_PER_ASSET[syntheticToken];
  const syntheticPriceDecimals = PRICE_DECIMALS_PER_ASSET[syntheticToken];

  const decimalConversion =
    syntheticDecimals +
    syntheticPriceDecimals -
    (COLLATERAL_TOKEN_DECIMALS + LEVERAGE_DECIMALS);

  const multiplier = 10 ** decimalConversion;

  const currentLeverage = (indexPrice * size) / (margin * multiplier);

  return currentLeverage;
}

function averageEntryPrice(
  current_size,
  current_entry_price,
  added_size,
  added_entry_price
) {
  let prev_nominal_usd = current_size * current_entry_price;
  let added_nominal_usd = added_size * added_entry_price;

  let average_entry_price =
    (prev_nominal_usd + added_nominal_usd) / (current_size + added_size);

  return average_entry_price;
}

const SPOT_MARKET_IDS = {
  12345: 11,
  54321: 12,
};

const PERP_MARKET_IDS = {
  12345: 21,
  54321: 22,
};

const SPOT_MARKET_IDS_2_TOKENS = {
  11: 12345,
  12: 54321,
};

const PERP_MARKET_IDS_2_TOKENS = {
  21: 12345,
  22: 54321,
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
    .post("http://localhost:4000/get_liquidity", {
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
// "type": "perpetual"/"spot"
// "market":  11 / 12 / 21 / 22
// "ask_liquidity": [ [price, size, timestamp], [price, size, timestamp], ... ]
// "bid_liquidity": [ [price, size, timestamp], [price, size, timestamp], ... ]

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

/**
 * Handles the result received from the backend after a swap executed.
 * @param  result  The result structure is:
 *  result format:
 *   {
 *          swap_note: Note
 *          new_pfr_note: Note or null,
 *          new_amount_filled: u64,
 *   }
 */
function handleSwapResult(user, orderId, swap_response) {
  //

  let swapNoteObject = swap_response.swap_note;
  let swapNote = Note.fromGrpcObject(swapNoteObject);
  if (user.noteData[swapNote.token]) {
    user.noteData[swapNote.token].push(swapNote);
  } else {
    user.noteData[swapNote.token] = [swapNote];
  }

  let newPfrNote_ = swap_response.new_pfr_note;
  if (newPfrNote_) {
    let newPfrNote = Note.fromGrpcObject(newPfrNote_);
    user.pfrNotes.push(newPfrNote);
  }

  let idx = user.orders.findIndex((o) => o.order_id == orderId);
  let order = user.orders[idx];
  order.qty_left = order.qty_left - swap_response.swap_note.amount;

  // TODO: lest then 000
  if (order.qty_left <= 0) {
    user.orders.splice(idx, 1);
  } else {
    user.orders[idx] = order;
  }
}

/**
 * Handles the result received from the backend after a perpetual swap executed.
 * @param  result  The result structure is:
 *  result format:
 *   {
 *       position: PerpPosition/null,
 *       new_pfr_info: [Note, u64,u64]>/null,
 *       return_collateral_note: Note/null,
 *       qty: u64,
 *    }
 */
function handlePerpSwapResult(user, orderId, swap_response) {
  //

  // ? Save position data (if not null)
  let position = swap_response.position;
  if (position) {
    if (user.positionData[position.token]) {
      user.positionData[position.token].push(position);
    } else {
      user.positionData[position.token] = [position];
    }
  }

  // ? Save partiall fill note (if not null)
  let newPfrInfo = swap_response.new_pfr_info;
  if (newPfrInfo && newPfrInfo[0]) {
    let newPfrNote = Note.fromGrpcObject(newPfrInfo[0]);
    user.pfrNotes.push(newPfrNote);
  }

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
  }

  let idx = user.perpetualOrders.findIndex((o) => o.order_id == orderId);
  let order = user.perpetualOrders[idx];
  order.qty_left = order.qty_left - swap_response.qty;

  // TODO: lest then 000
  if (order.qty_left <= 0) {
    user.perpetualOrders.splice(idx, 1);
  } else {
    user.perpetualOrders[idx] = order;
  }
}

/**
 * Handles the result received from the backend after a note split(restructuring)
 * Removes the previous notes and adds the new notes to the user's noteData and database.
 * @param  zero_idxs  The indexes of new notes
 */
function handleNoteSplit(user, zero_idxs, notesIn, notesOut) {
  //

  for (const noteIn of notesIn) {
    user.noteData[noteIn.token].filter((n) => n.index != noteIn.index);
  }

  if (notesIn.length > notesOut.length) {
    for (let i = notesOut.length; i < notesIn.length; i++) {
      let note = notesIn[i];
      removeNoteFromDb(note);
    }

    for (let i = 0; i < zero_idxs.length; i++) {
      let note = notesOut[i];
      note.index = zero_idxs[i];
      storeNewNote(note);
      user.noteData[note.token].push(note);
    }
  } else {
    for (let i = 0; i < zero_idxs.length; i++) {
      let note = notesOut[i];
      note.index = zero_idxs[i];
      storeNewNote(note);
      user.noteData[note.token].push(note);
    }
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
    "Sign this message to access your Invisibl3 account. \nIMPORTANT: Only sign this message on Invisible.com!!"
  );

  let pk = keyDerivation.getPrivateKeyFromEthSignature(sig);

  console.log(pk);

  let user = User.fromPrivKey(pk);

  await user.login();

  let { badOrderIds, orders, badPerpOrderIds, perpOrders } =
    await getActiveOrders(user.orderIds, user.perpetualOrderIds);

  await user.handleActiveOrders(
    badOrderIds,
    orders,
    badPerpOrderIds,
    perpOrders
  );

  return user;
}

async function getActiveOrders(order_ids, perp_order_ids) {
  return await axios
    .post("http://localhost:4000/get_orders", { order_ids, perp_order_ids })
    .then((res) => {
      let order_response = res.data.response;

      let badOrderIds = order_response.bad_order_ids;
      let orders = order_response.orders;
      let badPerpOrderIds = order_response.bad_perp_order_ids;
      let perpOrders = order_response.perp_orders;
      let pfrNotes = order_response.pfr_notes;

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
  DECIMALS_PER_ASSET,
  PRICE_DECIMALS_PER_ASSET,
  DUST_AMOUNT_PER_ASSET,
  LEVERAGE_DECIMALS,
  COLLATERAL_TOKEN_DECIMALS,
  COLLATERAL_TOKEN,
  get_max_leverage,
  getMinViableMargin,
  MAX_LEVERAGE,
  calulateLiqPriceInMarginChangeModal,
  calulateLiqPriceInIncreaseSize,
  calulateLiqPriceInDecreaseSize,
  calulateLiqPriceInFlipSide,
  checkViableSizeAfterIncrease,
  getCurrentLeverage,
  averageEntryPrice,
  handleSwapResult,
  handlePerpSwapResult,
  handleNoteSplit,
  getActiveOrders,
  fetchLiquidity,
  loginUser,
  SYMBOLS_TO_IDS,
  IDS_TO_SYMBOLS,
  PERP_MARKET_IDS,
  SPOT_MARKET_IDS,
  SPOT_MARKET_IDS_2_TOKENS,
  PERP_MARKET_IDS_2_TOKENS,
};
