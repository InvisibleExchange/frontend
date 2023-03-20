const { checkPerpOrderValidity } = require("../helpers/orderHelpers");
const { trimHash, Note } = require("../users/Notes");

const axios = require("axios");
const { storeOrderId } = require("../helpers/firebase/firebaseConnection");

const { computeHashOnElements } = require("../helpers/pedersen");

const {
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

// const path = require("path");
// require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const EXPRESS_APP_URL = "http://localhost:4000"; // process.env.EXPRESS_APP_URL;

// TODO: Remove notes only after order is confirmed

/**
 * This constructs a spot swap and sends it to the backend
 * ## Params:
 * @param  order_side "Buy"/"Sell"
 * @param  expirationTime expiration time in hours
 * @param  baseToken
 * @param  quoteToken (price token)
 * @param  baseAmount the amount of base tokens to be bought/sold (only for sell orders)
 * @param  quoteAmount the amount of quote tokens to be spent/received  (only for buy orders)
 * @param  price  price of base token denominated in quote token (null if market order)
 * @param  feeLimit fee limit in percentage (10 = 10%)
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
  feeLimit
) {
  console.log("SEND SPOT ORDER");

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
    let priceScaled = price
      ? Number.parseInt(price * 10 ** priceDecimals)
      : null;
    receiveAmount = price
      ? Number.parseInt(
          (BigInt(spendAmount) * 10n ** BigInt(decimalMultiplier)) /
            BigInt(priceScaled)
        )
      : 0;
  } else {
    spendToken = baseToken;
    receiveToken = quoteToken;

    spendAmount = Number.parseInt(baseAmount * 10 ** baseDecimals);
    let priceScaled = price
      ? Number.parseInt(price * 10 ** priceDecimals)
      : null;
    receiveAmount = price
      ? Number.parseInt(
          (BigInt(spendAmount) * BigInt(priceScaled)) /
            10n ** BigInt(decimalMultiplier)
        )
      : 0;
  }

  if (expirationTime < 4 || expirationTime > 1000)
    throw new Error("Expiration time Invalid");

  let ts = new Date().getTime() / 3600_000; // number of hours since epoch
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
    price,
    feeLimit
  );

  let orderJson = limitOrder.toGrpcObject();
  orderJson.user_id = trimHash(user.userId, 64).toString();
  orderJson.is_market = !price;

  console.log(orderJson);

  user.awaittingOrder = true;
  await axios
    .post(`${EXPRESS_APP_URL}/submit_limit_order`, orderJson)
    .then(async (res) => {
      let order_response = res.data.response;

      if (order_response.successful) {
        await storeOrderId(user.userId, order_response.order_id, pfrKey, false);

        // {base_asset,expiration_timestamp,fee_limit,notes_in,order_id,order_side,price,qty_left,quote_asset,refund_note}

        // If this is a taker order it might have been filled fully/partially before the response was received (here)
        let filledAmount = user.filledAmounts[order_response.order_id]
          ? user.filledAmounts[order_response.order_id]
          : 0;

        order_side = order_side == "Buy" ? 0 : 1;
        let orderData = {
          base_asset: baseToken,
          quote_asset: quoteToken,
          expiration_timestamp: expirationTime,
          fee_limit: feeLimit,
          notes_in: limitOrder.notes_in,
          order_id: order_response.order_id,
          order_side,
          price: price,
          qty_left: receiveAmount - filledAmount,
          refund_note: limitOrder.refund_note,
        };

        if (orderData.notes_in.length > 0) {
          for (let note of orderData.notes_in) {
            user.noteData[note.token] = user.noteData[note.token].filter(
              (n) => n.index != note.index
            );
          }
        }

        // ? Add the refund note
        if (orderData.refund_note) {
          if (user.refundNotes[order_response.order_id]) {
            // If this is a market order then we can add the refund note immediately
            user.noteData[orderData.refund_note.token].push(
              orderData.refund_note
            );
          } else {
            // If this is a limit order then we need to wait for the order to be filled
            // (untill we receive a response through the websocket)
            user.refundNotes[order_response.order_id] = orderData.refund_note;
          }
        }

        if (
          orderData.qty_left >=
          DUST_AMOUNT_PER_ASSET[
            orderData.order_side == 1 ? baseToken : quoteToken
          ]
        ) {
          user.orders.push(orderData);
        }

        user.awaittingOrder = false;
      } else {
        let msg =
          "Failed to submit order with error: \n" +
          order_response.error_message;
        console.log(msg);

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
 * @param order_side "Long"/"Short"
 * @param  expirationTime expiration time in hours
 * @param  position_effect_type "Open"/"Modify"/"Close"
 * @param  syntheticToken the token of the position to be opened
 * @param  syntheticAmount the amount of synthetic tokens to be bought/sold
 * @param  price (null if market order)
 * @param  initial_margin if the position is being opened (else null)
 * @param  feeLimit fee limit in percentage (10 = 10%)
 */
async function sendPerpOrder(
  user,
  order_side,
  expirationTime,
  position_effect_type,
  syntheticToken,
  syntheticAmount,
  price,
  initial_margin,
  feeLimit
) {
  let syntheticDecimals = DECIMALS_PER_ASSET[syntheticToken];
  let priceDecimals = PRICE_DECIMALS_PER_ASSET[syntheticToken];

  let decimalMultiplier =
    syntheticDecimals + priceDecimals - COLLATERAL_TOKEN_DECIMALS;

  syntheticAmount = syntheticAmount * 10 ** syntheticDecimals;
  let scaledPrice = price
    ? price * 10 ** priceDecimals
    : order_side == "Long"
    ? 10 ** (6 + priceDecimals)
    : 0;
  let collateralAmount =
    (BigInt(syntheticAmount) * BigInt(scaledPrice)) /
    10n ** BigInt(decimalMultiplier);
  collateralAmount = Number.parseInt(collateralAmount.toString());

  if (position_effect_type == "Open") {
    initial_margin = Number.parseInt(
      initial_margin * 10 ** COLLATERAL_TOKEN_DECIMALS
    );
  }

  let ts = new Date().getTime() / 3600_000; // number of hours since epoch
  let expirationTimestamp = Number.parseInt(ts.toString()) + expirationTime;

  feeLimit = Number.parseInt(((feeLimit * collateralAmount) / 100).toString());

  checkPerpOrderValidity(
    user,
    order_side,
    position_effect_type,
    expirationTime,
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
    order_side,
    syntheticToken,
    COLLATERAL_TOKEN,
    syntheticAmount,
    collateralAmount,
    price,
    feeLimit,
    initial_margin
  );

  let orderJson = perpOrder.toGrpcObject();
  orderJson.user_id = trimHash(user.userId, 64).toString();
  orderJson.is_market = !price;

  await axios
    .post(`${EXPRESS_APP_URL}/submit_perpetual_order`, orderJson)
    .then((res) => {
      let order_response = res.data.response;

      if (order_response.successful) {
        console.log("Order submitted successful!");

        storeOrderId(user.userId, order_response.order_id, pfrKey, true);

        // {order_id,expiration_timestamp,qty_left,price,synthetic_token,order_side,position_effect_type,fee_limit,position_address,notes_in,refund_note,initial_margin}

        // If this is a taker order it might have been filled fully/partially before the response was received (here)
        let filledAmount = user.filledAmounts[order_response.order_id]
          ? user.filledAmounts[order_response.order_id]
          : 0;

        let orderData = {
          synthetic_token: perpOrder.synthetic_token,
          expiration_timestamp: perpOrder.expiration_timestamp,
          fee_limit: perpOrder.fee_limit,
          order_id: order_response.order_id,
          position_effect_type: orderJson.position_effect_type,
          order_side: perpOrder.order_side == "Long",
          price: perpOrder.price,
          position_address: perpOrder.position
            ? perpOrder.position.position_address
            : null,
          qty_left: perpOrder.synthetic_amount - filledAmount,
          notes_in:
            orderJson.position_effect_type == 0
              ? perpOrder.open_order_fields.notes_in
              : [],
          refund_note:
            orderJson.position_effect_type == 0 &&
            perpOrder.open_order_fields.refund_note
              ? perpOrder.open_order_fields.refund_note
              : null,
          initial_margin:
            orderJson.position_effect_type == 0
              ? perpOrder.open_order_fields.initial_margin
              : 0,
        };

        if (orderData.notes_in.length > 0) {
          for (let note of orderData.notes_in) {
            user.noteData[note.token] = user.noteData[note.token].filter(
              (n) => n.index != note.index
            );
          }
        }

        // ? Add the refund note
        if (orderData.refund_note) {
          if (user.refundNotes[order_response.order_id]) {
            // If this is a market order then we can add the refund note immediately
            user.noteData[orderData.refund_note.token].push(
              orderData.refund_note
            );
          } else {
            // If this is a limit order then we need to wait for the order to be filled
            // (untill we receive a response through the websocket)

            user.refundNotes[order_response.order_id] = orderData.refund_note;
          }
        }

        if (
          orderData.qty_left >= DUST_AMOUNT_PER_ASSET[orderData.synthetic_token]
        ) {
          user.perpetualOrders.push(orderData);
        }
      } else {
        let msg =
          "Failed to submit order with error: \n" +
          order_response.error_message;
        console.log(msg);
        throw new Error(msg);
      }
    });

  console.log("SEND PERP ORDER");
}

async function sendLiquidationOrder(user, expirationTime, position) {
  if (expirationTime < 4 || expirationTime > 1000)
    throw new Error("Expiration time Invalid");

  let ts = new Date().getTime() / 3600_000; // number of hours since epoch
  let expirationTimestamp = Number.parseInt(ts.toString()) + expirationTime;

  let perpOrder = user.makeLiquidationOrder(expirationTimestamp, position);

  let orderJson = perpOrder.toGrpcObject();
  orderJson.user_id = trimHash(user.userId, 64).toString();

  await axios
    .post(`${EXPRESS_APP_URL}/submit_perpetual_order`, orderJson)
    .then((res) => {
      let order_response = res.data.response;

      if (order_response.successful) {
        console.log("Order submitted successful!");
      } else {
        let msg =
          "Failed to submit order with error: \n" +
          order_response.error_message;
        console.log(msg);
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
  if (
    !(isPerp == true || isPerp == false) ||
    !marketId ||
    !orderId ||
    !(orderSide == true || orderSide == false)
  ) {
    throw new Error("Invalid parameters");
  }

  if (orderSide === 1 || orderSide === false) {
    orderSide = false;
  } else {
    orderSide = true;
  }

  let cancelReq = {
    marketId: marketId,
    order_id: orderId,
    order_side: orderSide,
    user_id: trimHash(user.userId, 64).toString(),
    is_perp: isPerp,
  };

  console.log(cancelReq);

  await axios
    .post("http://localhost:4000/cancel_order", cancelReq)
    .then((response) => {
      let order_response = response.data.response;

      if (order_response.successful) {
        console.log("Order canceled successfuly!");

        if (isPerp) {
          for (let i = 0; i < user.perpetualOrders.length; i++) {
            let ord = user.perpetualOrders[i];
            if (ord.order_id == orderId) {
              let notes_in = ord.notes_in;
              if (notes_in.length > 0) {
                for (let note of notes_in) {
                  user.noteData[note.token].push(note);
                }
              }
            }
          }

          user.perpetualOrders = user.perpetualOrders.filter(
            (o) => o.order_id != orderId
          );
        } else {
          for (let i = 0; i < user.orders.length; i++) {
            let ord = user.orders[i];
            if (ord.orderId == orderId) {
              let notes_in = ord.notes_in;
              if (notes_in.length > 0) {
                for (let note of notes_in) {
                  user.noteData[note.token].push(note);
                }
              }
            }
          }

          user.orders = user.orders.filter((o) => o.order_id != orderId);
        }
      } else {
        console.log("error canceling order: ", order_response.error_message);
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
        throw new Error(msg);
      }
    });
}

// * ======================================================================

async function sendWithdrawal(user, amount, token, starkKey) {
  if (!user || !amount || !token || !starkKey) {
    throw new Error("Invalid input");
  }

  let tokenDecimals = DECIMALS_PER_ASSET[token];
  amount = amount * 10 ** tokenDecimals;

  let withdrawal = user.makeWithdrawalOrder(amount, token, starkKey);

  await axios
    .post(`${EXPRESS_APP_URL}/execute_withdrawal`, withdrawal.toGrpcObject())
    .then((res) => {
      let withdrawal_response = res.data.response;

      if (withdrawal_response.successful) {
        console.log("Withdrawal successful!");

        for (let i = 0; i < withdrawal.notes_in.length; i++) {
          let note = withdrawal.notes_in[i];
          user.noteData[note.token] = user.noteData[note.token].filter(
            (n) => n.index != note.index
          );
          // removeNoteFromDb(note);
        }
      } else {
        let msg =
          "Withdrawal failed with error: \n" +
          withdrawal_response.error_message;
        console.log(msg);
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
async function sendSplitOrder(user, token, newAmounts) {
  newAmounts = newAmounts.map((a) => a * 10 ** DECIMALS_PER_ASSET[token]);

  let { notesIn, notesOut } = user.restructureNotes(token, newAmounts);

  let notes_in = notesIn.map((n) => n.toGrpcObject());
  let notes_out = notesOut.map((n) => n.toGrpcObject());

  await axios
    .post(`${EXPRESS_APP_URL}/split_notes`, {
      notes_in,
      notes_out,
    })
    .then((res) => {
      let split_response = res.data.response;

      console.log("SPLIT RESPONSE: ", split_response);

      if (split_response.successful) {
        let zero_idxs = split_response.zero_idxs;

        handleNoteSplit(user, zero_idxs, notesIn, notesOut);
      } else {
        let msg =
          "Note split failed with error: \n" + split_response.error_message;
        console.log(msg);
      }
    });

  console.log("SEND SPLIT ORDER");
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

  //todo: if (direction == "decrease" && margin_change >= MARGIN_LEFT?) {}
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
      order_side: position.order_side == "Long" ? 0 : 1,
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
            position.collateral_token,
            margin_change,
            close_order_fields.dest_received_blinding,
            marginChangeResponse.return_collateral_index
          );
          // storeNewNote(returnCollateralNote);
          user.noteData[position.collateral_token].push(returnCollateralNote);
        }

        // Update the user's position data
        user.positionData[syntheticToken] = user.positionData[
          syntheticToken
        ].map((pos) => {
          if (pos.position_address == positionAddress) {
            pos.margin += direction == "Add" ? margin_change : -margin_change;

            let bankruptcyPrice = _getBankruptcyPrice(
              pos.entry_price,
              pos.margin,
              pos.position_size,
              pos.order_side,
              pos.synthetic_token
            );

            let liquidationPrice = _getLiquidationPrice(
              pos.entry_price,
              bankruptcyPrice,
              pos.order_side
            );

            pos.bankruptcy_price = bankruptcyPrice;
            pos.liquidation_price = liquidationPrice;

            let hash = computeHashOnElements([
              pos.order_side == "Long" ? 0 : 1,
              pos.synthetic_token,
              pos.position_size,
              pos.entry_price,
              pos.liquidation_price,
              pos.position_address,
              pos.last_funding_idx,
            ]);

            pos.hash = hash.toString();

            return pos;
          } else {
            return pos;
          }
        });
      } else {
        let msg =
          "Failed to submit order with error: \n" +
          marginChangeResponse.error_message;
        console.log(msg);
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

// verify order signature: Some(1270017260089270687516297300848751004819581302746661782522231060681891660987) 3152498791076882037386150199679937572287600013373858450152118028363863484736  false
// ERROR: Some("Invalid signature: r:\"672489961620869661533783067566567890964653373859868190397942575525995918575\" s:\"630460561905133549657111467315905963820137638510173938977707964503224628123\"")
