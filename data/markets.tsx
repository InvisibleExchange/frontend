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

const CONTRACT_ADDRESSES = exchange_config["CONTRACT_ADDRESSES"];

function tokenAddressList(chainId: number): string[] {
  return CONTRACT_ADDRESSES[chainId]["TOKEN_ADDRESS_LIST"];
}

function tokenAddress2Id(chainId: number) {
  return CONTRACT_ADDRESSES[chainId]["TOKEN_ADDRESS_2_ID"];
}

function tokenId2Address(chainId: number) {
  return CONTRACT_ADDRESSES[chainId]["TOKEN_ID_2_ADDRESS"];
}

function tokenId2Name() {
  return exchange_config["TOKEN_ID_2_NAME"];
}

function invisibleContractAddress(chainId: number) {
  return CONTRACT_ADDRESSES[chainId]["INVISIBLE_ADDRESS"];
}

function onchainDecimalsPerAsset() {
  return CONTRACT_ADDRESSES["ONCHAIN_DECIMALS_PER_ASSET"];
}

export {
  tokenAddressList,
  tokenAddress2Id,
  tokenId2Address,
  tokenId2Name,
  invisibleContractAddress,
  onchainDecimalsPerAsset,
};
