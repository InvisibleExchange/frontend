import btcLogo from "../public/tokenIcons/bitcoin.png";
import ethLogo from "../public/tokenIcons/ethereum-eth-logo.png";
import solLogo from "../public/tokenIcons/solanaLogo.png";

export const marketList = [
  {
    pairs: "BTC/USDC",
    perpetual: "BTC-Perpetual",
    logo: btcLogo,
    priceDecimals: 2,
    isSpot: true,
    isPerp: true,
  },
  {
    pairs: "ETH/USDC",
    perpetual: "ETH-Perpetual",
    logo: ethLogo,
    priceDecimals: 2,
    isSpot: true,
    isPerp: true,
  },
  {
    pairs: "SOL/USDC",
    perpetual: "SOL-Perpetual",
    logo: solLogo,
    priceDecimals: 2,
    isSpot: false,
    isPerp: true,
  },
];

export const token2Market = {
  3592681469: marketList[0],
  453755560: marketList[1],
  277158171: marketList[2],
};

const exchange_config = require("../exchange-config.json");

export const tokenAddressList = exchange_config["TOKEN_ADDRESS_LIST"];

export const tokenAddress2Id = exchange_config["TOKEN_ADDRESS_2_ID"];

export const tokenId2Address = exchange_config["TOKEN_ID_2_ADDRESS"];

export const tokenId2Name = exchange_config["TOKEN_ID_2_NAME"];

export const invisibleContractAddress =
  exchange_config["INVISIBL1_ETH_ADDRESS"];

export const onchainDecimalsPerAsset =
  exchange_config["ONCHAIN_DECIMALS_PER_ASSET"];
