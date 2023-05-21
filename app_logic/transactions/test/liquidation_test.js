const { default: axios } = require("axios");
const { sendLiquidationOrder } = require("../constructOrders");
const {
  fetchIndividualPosition,
} = require("../../helpers/firebase/firebaseConnection");
const {
  PRICE_DECIMALS_PER_ASSET,
  DECIMALS_PER_ASSET,
} = require("../../helpers/utils");

async function testLiquidations(user, marketPrice) {
  let res = await axios.post(
    `http://localhost:4000/get_liquidatable_positions`,
    {
      token: 54321,
      price: 1000,
    }
  );

  //  (position_index INTEGER PRIMARY KEY NOT NULL, position_address TEXT NOT NULL, synthetic_token INTEGER NOT NULL, order_side BIT NOT NULL, liquidation_price INTEGER NOT NULL)
  let {
    position_index,
    position_address,
    synthetic_token,
    order_side,
    liquidation_price,
  } = res.data.response[0];

  let position = await fetchIndividualPosition(
    position_address.toString(),
    position_index.toString()
  );

  let leverage = 10;
  let size = position.position_size / 10 ** DECIMALS_PER_ASSET[synthetic_token];
  let initial_margin = (size * marketPrice) / leverage;
  let slippage = 0.2;

  await sendLiquidationOrder(
    user,
    position,
    marketPrice,
    synthetic_token,
    size,
    initial_margin,
    slippage
  );
}

export default testLiquidations;
