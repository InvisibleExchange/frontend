const { checkPerpOrderValidity } = require("../helpers/orderHelpers");
const { trimHash, Note } = require("../users/Notes");

const axios = require("axios");
const { storeOrderId } = require("../helpers/firebaseConnection");

const { computeHashOnElements } = require("../helpers/pedersen");

const {
  EXPRESS_APP_URL,
  COLLATERAL_TOKEN,
  COLLATERAL_TOKEN_DECIMALS,
  DECIMALS_PER_ASSET,
  PRICE_DECIMALS_PER_ASSET,
  handleNoteSplit,
  DUST_AMOUNT_PER_ASSET,
} = require("../helpers/utils");
const {
  _getBankruptcyPrice,
  _getLiquidationPrice,
} = require("../helpers/tradePriceCalculations");
const { restoreUserState } = require("../helpers/keyRetrieval");

/**
 * This constructs a spot swap and sends it to the backend
 * ## Params:
 * @param  order_side "Buy"/"Sell"
 * @param  expirationTime expiration time in seconds
 * @param  baseToken
 * @param  quoteToken (price token)
 * @param  baseAmount the amount of base tokens to be bought/sold (only for sell orders)
 * @param  quoteAmount the amount of quote tokens to be spent/received  (only for buy orders)
 * @param  price  price of base token denominated in quote token (current price if market order)
 * @param  feeLimit fee limit in percentage (1 = 1%)
 * @param  slippage  the slippage limit in percentage (1 = 1%) (null if limit)
 */
async function sendSpotOrder(
  user,
  order_side,
  expirationTime,
  baseToken,
  quoteToken,
  baseAmount,
  quoteAmount,
  price,
  feeLimit,
  slippage,
  isMarket
) {
  if (
    !expirationTime ||
    !baseToken ||
    !quoteToken ||
    !(baseAmount || quoteAmount) ||
    !feeLimit ||
    !(order_side == "Buy" || order_side == "Sell")
  ) {
    console.log("Please fill in all fields");
    throw "Unfilled fields";
  }

  let baseDecimals = DECIMALS_PER_ASSET[baseToken];
  let quoteDecimals = DECIMALS_PER_ASSET[quoteToken];
  let priceDecimals = PRICE_DECIMALS_PER_ASSET[baseToken];

  let decimalMultiplier = baseDecimals + priceDecimals - quoteDecimals;

  let spendToken;
  let spendAmount;
  let receiveToken;
  let receiveAmount;
  if (order_side == "Buy") {
    spendToken = quoteToken;
    receiveToken = baseToken;

    spendAmount = Number.parseInt(quoteAmount * 10 ** quoteDecimals);
    let priceScaled = price * 10 ** priceDecimals;
    priceScaled = isMarket
      ? (priceScaled * (100 + slippage)) / 100
      : priceScaled;
    priceScaled = Number.parseInt(priceScaled);

    receiveAmount = Number.parseInt(
      (BigInt(spendAmount) * 10n ** BigInt(decimalMultiplier)) /
        BigInt(priceScaled)
    );
  } else {
    spendToken = baseToken;
    receiveToken = quoteToken;

    spendAmount = Number.parseInt(baseAmount * 10 ** baseDecimals);
    let priceScaled = price * 10 ** priceDecimals;
    priceScaled = isMarket
      ? (priceScaled * (100 - slippage)) / 100
      : priceScaled;
    priceScaled = Number.parseInt(priceScaled);

    receiveAmount = Number.parseInt(
      (BigInt(spendAmount) * BigInt(priceScaled)) /
        10n ** BigInt(decimalMultiplier)
    );
  }

  if (expirationTime < 0 || expirationTime > 3600_000)
    throw new Error("Expiration time Invalid");

  let ts = new Date().getTime() / 1000; // number of seconds since epoch
  let expirationTimestamp = Number.parseInt(ts.toString()) + expirationTime;

  feeLimit = Number.parseInt(((feeLimit * receiveAmount) / 100).toString());

  if (spendAmount > user.getAvailableAmount(spendToken)) {
    console.log("Insufficient balance");
    throw new Error("Insufficient balance");
  }

  let { limitOrder, pfrKey } = user.makeLimitOrder(
    expirationTimestamp,
    spendToken,
    receiveToken,
    spendAmount,
    receiveAmount,
    feeLimit
  );

  let orderJson = limitOrder.toGrpcObject();
  orderJson.user_id = trimHash(user.userId, 64).toString();
  orderJson.is_market = isMarket;

  user.awaittingOrder = true;

  await axios
    .post(`${EXPRESS_APP_URL}/submit_limit_order`, orderJson)
    .then(async (res) => {
      let order_response = res.data.response;

      if (order_response.successful) {
        await storeOrderId(
          user.userId,
          order_response.order_id,
          pfrKey,
          false,
          user.privateSeed
        );

        let spotNotesInfo = limitOrder.spot_note_info;

        // {base_asset,expiration_timestamp,fee_limit,notes_in,order_id,order_side,price,qty_left,quote_asset,refund_note}

        // If this is a taker order it might have been filled fully/partially before the response was received (here)
        let filledAmount = user.filledAmounts[order_response.order_id]
          ? user.filledAmounts[order_response.order_id]
          : 0;

        if (spotNotesInfo.notes_in.length > 0) {
          for (let note of spotNotesInfo.notes_in) {
            user.noteData[note.token] = user.noteData[note.token].filter(
              (n) => n.index != note.index
            );
          }
        }

        // ? Add the refund note
        if (spotNotesInfo.refund_note) {
          if (filledAmount > 0) {
            // If this is a market order then we can add the refund note immediately
            user.noteData[spotNotesInfo.refund_note.token].push(
              spotNotesInfo.refund_note
            );
          } else {
            // If this is a limit order then we need to wait for the order to be filled
            // (untill we receive a response through the websocket)
            user.refundNotes[order_response.order_id] =
              spotNotesInfo.refund_note;
          }
        }

        if (
          filledAmount < receiveAmount - DUST_AMOUNT_PER_ASSET[receiveToken] &&
          !isMarket
        ) {
          // If the order has not been fully filled already and is not a market order

          order_side = order_side == "Buy" ? 1 : 0;
          let orderData = {
            base_asset: baseToken,
            quote_asset: quoteToken,
            expiration_timestamp: expirationTimestamp,
            fee_limit: feeLimit,
            notes_in: spotNotesInfo.notes_in,
            order_id: order_response.order_id,
            order_side,
            price: price,
            qty_left: receiveAmount - filledAmount,
            refund_note: spotNotesInfo.refund_note,
          };

          user.orders.push(orderData);
        }

        user.awaittingOrder = false;
      } else {
        let msg =
          "Failed to submit order with error: \n" +
          order_response.error_message;
        console.log(msg);

        if (order_response.error_message.includes("Note does not exist")) {
          restoreUserState(user, true, false);
        }

        user.awaittingOrder = false;
        throw new Error(msg);
      }
    });
}

// * =====================================================================================================================================
// * =====================================================================================================================================
// * =====================================================================================================================================

/**
 * This constructs a perpetual swap and sends it to the backend
 * ## Params:
 * @param  order_side "Long"/"Short"
 * @param  expirationTime expiration time in hours
 * @param  position_effect_type "Open"/"Modify"/"Close"
 * @param  positionAddress the address of the position to be modified/closed (null if open)
 * @param  syntheticToken the token of the position to be opened
 * @param  syntheticAmount the amount of synthetic tokens to be bought/sold
 * @param  price (null if market order)
 * @param  initial_margin if the position is being opened (else null)
 * @param  feeLimit fee limit in percentage (10 = 10%)
 * @param  slippage  the slippage limit in percentage (1 = 1%) (null if limit)
 * @param  isMarket if the order is a market order
 */
async function sendPerpOrder(
  user,
  order_side,
  expirationTime,
  position_effect_type,
  positionAddress,
  syntheticToken,
  syntheticAmount,
  price,
  initial_margin,
  feeLimit,
  slippage,
  isMarket
) {
  let syntheticDecimals = DECIMALS_PER_ASSET[syntheticToken];
  let priceDecimals = PRICE_DECIMALS_PER_ASSET[syntheticToken];

  let decimalMultiplier =
    syntheticDecimals + priceDecimals - COLLATERAL_TOKEN_DECIMALS;

  syntheticAmount = Number.parseInt(syntheticAmount * 10 ** syntheticDecimals);
  let scaledPrice = price * 10 ** priceDecimals;
  scaledPrice = isMarket
    ? order_side == "Long"
      ? (scaledPrice * (100 + slippage)) / 100
      : (scaledPrice * (100 - slippage)) / 100
    : scaledPrice;
  scaledPrice = Number.parseInt(scaledPrice);

  let collateralAmount =
    (BigInt(syntheticAmount) * BigInt(scaledPrice)) /
    10n ** BigInt(decimalMultiplier);
  collateralAmount = Number.parseInt(collateralAmount.toString());

  if (position_effect_type == "Open") {
    initial_margin = Number.parseInt(
      initial_margin * 10 ** COLLATERAL_TOKEN_DECIMALS
    );
  } else {
    if (!positionAddress) throw "Choose a position to modify/close";
  }

  if (expirationTime < 0 || expirationTime > 3600_000)
    throw new Error("Expiration time Invalid");

  let ts = new Date().getTime() / 1000; // number of seconds since epoch
  let expirationTimestamp = Number.parseInt(ts.toString()) + expirationTime;

  feeLimit = Number.parseInt(((feeLimit * collateralAmount) / 100).toString());

  checkPerpOrderValidity(
    user,
    order_side,
    position_effect_type,
    syntheticToken,
    syntheticAmount,
    COLLATERAL_TOKEN,
    collateralAmount,
    initial_margin,
    feeLimit
  );

  let { perpOrder, pfrKey } = user.makePerpetualOrder(
    expirationTimestamp,
    position_effect_type,
    positionAddress,
    order_side,
    syntheticToken,
    COLLATERAL_TOKEN,
    syntheticAmount,
    collateralAmount,
    feeLimit,
    initial_margin
  );

  user.awaittingOrder = true;

  let orderJson = perpOrder.toGrpcObject();
  orderJson.user_id = trimHash(user.userId, 64).toString();
  orderJson.is_market = isMarket;

  await axios
    .post(`${EXPRESS_APP_URL}/submit_perpetual_order`, orderJson)
    .then((res) => {
      let order_response = res.data.response;

      if (order_response.successful) {
        storeOrderId(
          user.userId,
          order_response.order_id,
          pfrKey,
          true,
          user.privateSeed
        );

        // {order_id,expiration_timestamp,qty_left,price,synthetic_token,order_side,position_effect_type,fee_limit,position_address,notes_in,refund_note,initial_margin}

        // If this is a taker order it might have been filled fully/partially before the response was received (here)
        let filledAmount = user.filledAmounts[order_response.order_id]
          ? user.filledAmounts[order_response.order_id]
          : 0;

        let notesIn =
          orderJson.position_effect_type == 0
            ? perpOrder.open_order_fields.notes_in
            : [];
        if (notesIn.length > 0) {
          for (let note of notesIn) {
            user.noteData[note.token] = user.noteData[note.token].filter(
              (n) => n.index != note.index
            );
          }
        }

        // ? Add the refund note

        let refundNote =
          orderJson.position_effect_type == 0 &&
          perpOrder.open_order_fields.refund_note
            ? perpOrder.open_order_fields.refund_note
            : null;
        if (refundNote) {
          if (filledAmount > 0) {
            // If this is a market order then we can add the refund note immediately
            user.noteData[refundNote.token].push(refundNote);
          } else {
            // If this is a limit order then we need to wait for the order to be filled
            // (untill we receive a response through the websocket)

            user.refundNotes[order_response.order_id] = refundNote;
          }
        }

        if (
          filledAmount <
            syntheticAmount -
              DUST_AMOUNT_PER_ASSET[perpOrder.synthetic_token] &&
          !isMarket
        ) {
          let orderData = {
            synthetic_token: perpOrder.synthetic_token,
            expiration_timestamp: expirationTimestamp,
            fee_limit: feeLimit,
            order_id: order_response.order_id,
            position_effect_type: orderJson.position_effect_type,
            order_side: perpOrder.order_side == "Long",
            price: price,
            position_address: perpOrder.position
              ? perpOrder.position.position_header.position_address
              : null,
            qty_left: perpOrder.synthetic_amount - filledAmount,
            notes_in: notesIn,
            refund_note: refundNote,
            initial_margin:
              orderJson.position_effect_type == 0
                ? perpOrder.open_order_fields.initial_margin
                : 0,
          };

          user.perpetualOrders.push(orderData);
        }
        user.awaittingOrder = false;
      } else {
        let msg =
          "Failed to submit order with error: \n" +
          order_response.error_message;
        console.log(msg);

        if (
          order_response.error_message.includes("Note does not exist") ||
          order_response.error_message.includes("Position does not exist")
        ) {
          restoreUserState(user, true, true);
        }

        user.awaittingOrder = false;
        throw new Error(msg);
      }
    });
}

/**
 * This constructs a perpetual swap and sends it to the backend
 * ## Params:
 * @param  position  the position to be modified/closed (null if open)
 * @param  price (null if market order)
 * @param  syntheticToken the token of the position to be opened
 * @param  syntheticAmount the amount of synthetic tokens to be bought/sold
 * @param  initial_margin if the position is being opened (else null)
 * @param  slippage  the slippage limit in percentage (1 = 1%) (null if limit)
 */
async function sendLiquidationOrder(
  user,
  position,
  price,
  syntheticToken,
  syntheticAmount,
  initial_margin,
  slippage
) {
  let syntheticDecimals = DECIMALS_PER_ASSET[syntheticToken];
  let priceDecimals = PRICE_DECIMALS_PER_ASSET[syntheticToken];

  let decimalMultiplier =
    syntheticDecimals + priceDecimals - COLLATERAL_TOKEN_DECIMALS;

  syntheticAmount = syntheticAmount * 10 ** syntheticDecimals;
  let scaledPrice = price * 10 ** priceDecimals;

  let order_side = position.order_side == "Long" ? "Short" : "Long";
  scaledPrice =
    order_side == "Long"
      ? (scaledPrice * (100 + slippage)) / 100
      : (scaledPrice * (100 - slippage)) / 100;
  scaledPrice = Number.parseInt(scaledPrice);

  let collateralAmount =
    (BigInt(syntheticAmount) * BigInt(scaledPrice)) /
    10n ** BigInt(decimalMultiplier);
  collateralAmount = Number.parseInt(collateralAmount.toString());

  initial_margin = Number.parseInt(
    initial_margin * 10 ** COLLATERAL_TOKEN_DECIMALS
  );

  let liquidationOrder = user.makeLiquidationOrder(
    position,
    syntheticAmount,
    collateralAmount,
    initial_margin
  );

  let orderJson = liquidationOrder.toGrpcObject();
  orderJson.user_id = trimHash(user.userId, 64).toString();

  await axios
    .post(`${EXPRESS_APP_URL}/submit_liquidation_order`, orderJson)
    .then((res) => {
      let order_response = res.data.response;

      if (order_response.successful) {
        // ? Save position data (if not null)
        let position = order_response.new_position;

        if (position) {
          this.position.order_side =
            this.position.order_side == 1 ? "Long" : "Short";

          if (
            !user.positionData[position.position_header.synthetic_token] ||
            user.positionData[position.position_header.synthetic_token]
              .length == 0
          ) {
            user.positionData[position.position_header.synthetic_token] = [
              position,
            ];
          } else {
            user.positionData[position.position_header.synthetic_token].push(
              position
            );
          }

          //
        }
      } else {
        let msg =
          "Failed to submit order with error: \n" +
          order_response.error_message;
        console.log(msg);

        if (
          order_response.error_message.includes("Note does not exist") ||
          order_response.error_message.includes("Position does not exist")
        ) {
          restoreUserState(user, true, true);
        }

        throw new Error(msg);
      }
    });
}

// * =====================================================================================================================================

/**
 * Sends a cancell order request to the server
 * ## Params:
 * @param orderId order id of order to cancel
 * @param orderSide true-Bid, false-Ask
 * @param isPerp
 * @param marketId market id of the order
 */
async function sendCancelOrder(user, orderId, orderSide, isPerp, marketId) {
  if (!(isPerp === true || isPerp === false) || !marketId || !orderId) {
    throw new Error("Invalid parameters");
  }

  if (orderSide === 0 || orderSide === false || orderSide == "Short") {
    orderSide = false;
  } else if (orderSide === 1 || orderSide === true || orderSide == "Long") {
    orderSide = true;
  } else {
    throw new Error("Invalid order side");
  }

  let cancelReq = {
    marketId: marketId,
    order_id: orderId,
    order_side: orderSide,
    user_id: trimHash(user.userId, 64).toString(),
    is_perp: isPerp,
  };

  await axios
    .post(`${EXPRESS_APP_URL}/cancel_order`, cancelReq)
    .then((response) => {
      let order_response = response.data.response;

      if (order_response.successful) {
        let pfrNote = order_response.pfr_note;
        if (pfrNote) {
          // This means that the order has been filled partially
          // so we need don't need to add the notesIn to the user's noteData
          // instead we add the pfrNote to the user's noteData

          let note = Note.fromGrpcObject(pfrNote);
          user.noteData[pfrNote.token].push(note);

          if (isPerp) {
            // loop over the user's perpetual orders and find the order that has been cancelledž
            user.perpetualOrders = user.perpetualOrders.filter(
              (o) => o.order_id != orderId
            );
          } else {
            // loop over the user's spot orders and find the order that has been cancelled
            user.orders = user.orders.filter((o) => o.order_id != orderId);
          }
        } else {
          // This means that the order has not been filled partially yet
          // so we need to add the notesIn to the user's noteData

          if (isPerp) {
            for (let i = 0; i < user.perpetualOrders.length; i++) {
              // loop over the user's perpetual orders and find the order that has been cancelled
              // if notesIn is not empty (open order) then add the notes to the user's noteData

              let ord = user.perpetualOrders[i];
              if (ord.order_id == orderId.toString()) {
                let notes_in = ord.notes_in;
                if (notes_in && notes_in.length > 0) {
                  for (let note_ of notes_in) {
                    let note = Note.fromGrpcObject(note_);
                    user.noteData[note.token].push(note);
                  }
                }
              }
            }

            user.perpetualOrders = user.perpetualOrders.filter(
              (o) => o.order_id != orderId
            );
          } else {
            // loop over the user's spot orders and find the order that has been cancelled
            // if notesIn is not empty then add the notes to the user's noteData

            for (let i = 0; i < user.orders.length; i++) {
              let ord = user.orders[i];

              if (ord.order_id == orderId) {
                let notes_in = ord.notes_in;
                if (notes_in.length > 0) {
                  for (let note_ of notes_in) {
                    let note = Note.fromGrpcObject(note_);
                    user.noteData[note.token].push(note);
                  }
                }
              }
            }

            user.orders = user.orders.filter((o) => o.order_id != orderId);
          }
        }
      } else {
        console.log("error canceling order: ", order_response.error_message);
      }
    });
}

// * =====================================================================================================================================

/**
 * Sends an amend order request to the server
 * ## Params:
 * @param orderId order id of order to cancel
 * @param orderSide "Buy"/"Sell"
 * @param isPerp
 * @param marketId market id of the order
 * @param newPrice new price of the order
 * @param newExpirationTime new expiration time in seconds
 * @param match_only true if order should be matched only, false if matched and amended
 * @returns true if order should be removed, false otherwise
 */

async function sendAmendOrder(
  user,
  orderId,
  order_side,
  isPerp,
  marketId,
  newPrices,
  newExpirationTime
) {
  let ts = new Date().getTime() / 1000; // number of seconds since epoch
  let expirationTimestamp = Number.parseInt(ts.toString()) + newExpirationTime;

  if (
    !(isPerp === true || isPerp === false) ||
    !marketId ||
    !orderId ||
    !newPrices ||
    !newExpirationTime ||
    (order_side !== "Buy" && order_side !== "Sell")
  )
    return;

  newPrices = newPrices.map((p) => Number(p));

  let order;
  let signature;
  if (isPerp) {
    let ord = user.perpetualOrders.filter((o) => o.order_id == orderId)[0];

    // {order_id,expiration_timestamp,qty_left,price,synthetic_token,order_side,position_effect_type,fee_limit,position_address,notes_in,refund_note,initial_margin}

    let newCollateralAmount = getQuoteQty(
      ord.synthetic_amount,
      newPrices[0],
      ord.synthetic_token,
      COLLATERAL_TOKEN,
      null
    );

    ord.collateral_amount = newCollateralAmount;
    ord.expiration_timestamp = expirationTimestamp;

    if (ord.position_effect_type == "Open") {
      // open order
      let privKeys = ord.open_order_fields.notes_in.map(
        (note) => user.notePrivKeys[note.address.getX().toString()]
      );

      let sig = ord.signOrder(privKeys, null);
      signature = sig;
    } else {
      let position_priv_key =
        user.positionPrivKeys[ord.position.position_header.position_address];

      let sig = ord.signOrder(null, position_priv_key);
      signature = sig;
    }

    order = ord;
  } else {
    let ord = user.orders.filter((o) => o.order_id == orderId)[0];

    // {base_asset,expiration_timestamp,fee_limit,notes_in,order_id,order_side,price,qty_left,quote_asset,refund_note}

    if (order_side == "Buy") {
      let newAmountReceived = getQtyFromQuote(
        ord.amount_spent,
        newPrices[0],
        ord.token_received,
        ord.token_spent
      );

      ord.amount_received = newAmountReceived;
      ord.expiration_timestamp = expirationTimestamp;
    } else {
      let newAmountReceived = getQuoteQty(
        ord.amount_spent,
        newPrices[0],
        ord.token_spent,
        ord.token_received,
        null
      );

      ord.amount_received = newAmountReceived;
      ord.expiration_timestamp = expirationTimestamp;
    }

    let privKeys = ord.notes_in.map(
      (note) => user.notePrivKeys[note.address.getX().toString()]
    );

    let sig = ord.signOrder(privKeys);

    signature = sig;
    order = ord;
  }

  let amendReq = {
    market_id: marketId,
    order_id: orderId.toString(),
    order_side: order_side == "Buy",
    new_prices: newPrices,
    new_expiration: expirationTimestamp,
    signature: { r: signature[0].toString(), s: signature[1].toString() },
    user_id: trimHash(user.userId, 64).toString(),
    is_perp: isPerp,
    match_only: false,
  };

  return axios.post(`${EXPRESS_APP_URL}/amend_order`, amendReq).then((res) => {
    let order_response = res.data.response;

    if (order_response.successful) {
      if (isPerp) {
        for (let i = 0; i < user.perpetualOrders.length; i++) {
          let ord = user.perpetualOrders[i];

          if (ord.order_id == orderId.toString()) {
            user.perpetualOrders[i] = order;
          }
        }
      } else {
        for (let i = 0; i < user.orders.length; i++) {
          let ord = user.orders[i];

          if (ord.order_id == orderId.toString()) {
            user.orders[i] = order;
          }
        }
      }
    } else {
      let msg =
        "Amend order failed with error: \n" + order_response.error_message;
      console.log(msg);
    }
  });
}

// * =====================================================================================================================================
// * =====================================================================================================================================
// * =====================================================================================================================================

async function sendDeposit(user, depositId, amount, token, pubKey) {
  if (!user || !amount || !token || !depositId || !pubKey) {
    throw new Error("Invalid input");
  }

  let tokenDecimals = DECIMALS_PER_ASSET[token];
  amount = amount * 10 ** tokenDecimals;

  let deposit = user.makeDepositOrder(depositId, amount, token, pubKey);

  await axios
    .post(`${EXPRESS_APP_URL}/execute_deposit`, deposit.toGrpcObject())
    .then((res) => {
      let deposit_response = res.data.response;

      if (deposit_response.successful) {
        let zero_idxs = deposit_response.zero_idxs;
        for (let i = 0; i < zero_idxs.length; i++) {
          const idx = zero_idxs[i];
          let note = deposit.notes[i];
          note.index = idx;
          // storeNewNote(note)

          if (!user.noteData[note.token]) {
            user.noteData[note.token] = [note];
          } else {
            user.noteData[note.token].push(note);
          }
        }
      } else {
        let msg =
          "Deposit failed with error: \n" + deposit_response.error_message;
        console.log(msg);

        if (deposit_response.error_message.includes("Note does not exist")) {
          restoreUserState(user, true, false);
        }

        throw new Error(msg);
      }
    });
}

// * ======================================================================

async function sendWithdrawal(
  user,
  amount,
  token,
  recipient,
  withdrawalChainId,
  withdrawalId,
  maxGasFee
) {
  if (
    !user ||
    !amount ||
    !withdrawalChainId ||
    !token ||
    !recipient ||
    !withdrawalId
  ) {
    throw new Error("Invalid input");
  }

  let tokenDecimals = DECIMALS_PER_ASSET[token];
  amount = amount * 10 ** tokenDecimals;

  let withdrawal = user.makeWithdrawalOrder(
    amount,
    token,
    recipient,
    withdrawalChainId,
    maxGasFee
  );

  let withdrawalObj = withdrawal.toGrpcObject();
  withdrawalObj.withdrawal_id = withdrawalId.toString();

  await axios
    .post(`${EXPRESS_APP_URL}/execute_withdrawal`, withdrawalObj)
    .then((res) => {
      let withdrawal_response = res.data.response;

      if (withdrawal_response.successful) {
        for (let i = 0; i < withdrawal.notes_in.length; i++) {
          let note = withdrawal.notes_in[i];

          user.noteData[note.token] = user.noteData[note.token].filter(
            (n) => n.index != note.index
          );
        }

        if (withdrawal.refund_note) {
          user.noteData[withdrawal.refund_note.token].push(
            withdrawal.refund_note
          );
        }
      } else {
        let msg =
          "Withdrawal failed with error: \n" +
          withdrawal_response.error_message;
        console.log(msg);

        if (withdrawal_response.error_message.includes("Note does not exist")) {
          restoreUserState(user, true, false);
        }

        throw new Error(msg);
      }
    });
}

// * ======================================================================

/**
 * Restructures notes to have new amounts. This is useful if you don't want to wait for an order to be filled before you receive a refund.
 * ## Params:
 * @param token - token to restructure notes for
 * @param newAmounts - array of new amounts
 */
async function sendSplitOrder(user, token, newAmount) {
  newAmount = newAmount * 10 ** DECIMALS_PER_ASSET[token];

  let res = user.restructureNotes(token, newAmount);
  if (!res) return;
  let { notesIn, newNote, refundNote } = res;

  let notes_in = notesIn.map((n) => n.toGrpcObject());

  await axios
    .post(`${EXPRESS_APP_URL}/split_notes`, {
      notes_in,
      note_out: newNote.toGrpcObject(),
      refund_note: refundNote.toGrpcObject(),
    })
    .then((res) => {
      let split_response = res.data.response;

      if (split_response.successful) {
        let zero_idxs = split_response.zero_idxs;

        handleNoteSplit(user, zero_idxs, notesIn, [newNote, refundNote]);
      } else {
        let msg =
          "Note split failed with error: \n" + split_response.error_message;
        console.log(msg);

        if (order_response.error_message.includes("Note does not exist")) {
          restoreUserState(user, true, false);
        }
      }
    });
}

// * ======================================================================

/**
 * Sends a change margin order to the server, which add or removes margin from a position
 * ## Params:
 * @param positionAddress address of the position to change margin on
 * @param syntheticToken token of the position
 * @param amount amount of margin to add or remove
 * @param direction "Add"/"Remove"
 */
async function sendChangeMargin(
  user,
  positionAddress,
  syntheticToken,
  amount,
  direction
) {
  let margin_change = amount * 10 ** COLLATERAL_TOKEN_DECIMALS;

  let { notes_in, refund_note, close_order_fields, position, signature } =
    user.changeMargin(
      positionAddress,
      syntheticToken,
      direction,
      margin_change
    );
  let marginChangeMessage = {
    margin_change:
      direction == "Add"
        ? margin_change.toString()
        : (-margin_change).toString(),
    notes_in: notes_in ? notes_in.map((n) => n.toGrpcObject()) : null,
    refund_note: refund_note ? refund_note.toGrpcObject() : null,
    close_order_fields: close_order_fields
      ? close_order_fields.toGrpcObject()
      : null,
    position: {
      ...position,
      order_side: position.order_side == "Long" ? 1 : 0,
    },
    signature: {
      r: signature[0].toString(),
      s: signature[1].toString(),
    },
  };

  await axios
    .post(`${EXPRESS_APP_URL}/change_position_margin`, marginChangeMessage)
    .then((res) => {
      let marginChangeResponse = res.data.response;
      if (marginChangeResponse.successful) {
        if (direction == "Add") {
          for (let i = 0; i < notes_in.length; i++) {
            let note = notes_in[i];
            user.noteData[note.token] = user.noteData[note.token].filter(
              (n) => n.index != note.index
            );
          }

          if (refund_note) {
            user.noteData[refund_note.token].push(refund_note);
          }
        } else {
          // dest_received_address: any, dest_received_blinding
          let returnCollateralNote = new Note(
            close_order_fields.dest_received_address,
            COLLATERAL_TOKEN,
            margin_change,
            close_order_fields.dest_received_blinding,
            marginChangeResponse.return_collateral_index
          );
          // storeNewNote(returnCollateralNote);
          user.noteData[COLLATERAL_TOKEN].push(returnCollateralNote);
        }

        // Update the user's position data
        user.positionData[syntheticToken] = user.positionData[
          syntheticToken
        ].map((pos) => {
          if (pos.position_header.position_address == positionAddress) {
            pos.margin += direction == "Add" ? margin_change : -margin_change;

            let bankruptcyPrice = _getBankruptcyPrice(
              pos.entry_price,
              pos.margin,
              pos.position_size,
              pos.order_side,
              pos.position_header.synthetic_token
            );

            let liquidationPrice = _getLiquidationPrice(
              pos.entry_price,
              pos.margin,
              pos.position_size,
              pos.order_side,
              pos.position_header.synthetic_token,
              pos.position_header.allow_partial_liquidations
            );

            pos.bankruptcy_price = bankruptcyPrice;
            pos.liquidation_price = liquidationPrice;

            let hash = computeHashOnElements([
              pos.position_header.hash,
              pos.order_side == "Long" ? 1 : 0,
              pos.position_size,
              pos.entry_price,
              pos.liquidation_price,
              pos.last_funding_idx,
              pos.vlp_supply,
            ]);

            pos.hash = hash.toString();

            return pos;
          } else {
            return pos;
          }
        });
      } else {
        let msg =
          "Failed to change margin with error: \n" +
          marginChangeResponse.error_message;
        console.log(msg);

        if (
          marginChangeResponse.error_message.includes("Note does not exist") ||
          marginChangeResponse.error_message.includes("Position does not exist")
        ) {
          restoreUserState(user, true, true);
        }
      }
    });
}

module.exports = {
  sendSpotOrder,
  sendPerpOrder,
  sendCancelOrder,
  sendDeposit,
  sendWithdrawal,
  sendSplitOrder,
  sendChangeMargin,
  sendLiquidationOrder,
};

// // ========================
