import btcLogo from "../public/tokenIcons/bitcoin.png";
import ethLogo from "../public/tokenIcons/ethereum-eth-logo.png";

export const marketList = [
  {
    pairs: "BTC/USDC",
    // lastPrice: "1.0000202555",
    // change: -1.58,
    perpetual: "BTC-Perpetual",
    logo: btcLogo,
  },
  {
    pairs: "ETH/USDC",
    // lastPrice: "0.0000202555",
    // change: +1.58,
    perpetual: "ETH-Perpetual",
    logo: ethLogo,
  },
];

export const token2Market = {
  12345: marketList[0],
  54321: marketList[1],
};
