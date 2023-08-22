import btcLogo from "../public/tokenIcons/bitcoin.png";
import ethLogo from "../public/tokenIcons/ethereum-eth-logo.png";
import pepeLogo from "../public/tokenIcons/PEPE.png";

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
    pairs: "PEPE/USDC",
    perpetual: "PEPE-Perpetual",
    logo: pepeLogo,
    priceDecimals: 9,
    isSpot: false,
    isPerp: true,
  },
];

export const token2Market = {
  12345: marketList[0],
  54321: marketList[1],
  66666: marketList[2],
};
