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
  12345: marketList[0],
  54321: marketList[1],
  66666: marketList[2],
};

export const tokenAddressList = [
  "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
];

export const tokenAddress2Id = {
  "0x5FbDB2315678afecb367f032d93F642f64180aa3": 55555,
  "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512": 12345,
};

export const tokenId2Address = {
  55555: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  12345: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
};

export const tokenId2Name = {
  55555: "USDC",
  12345: "WBTC",
};

export const onchainDecimalsPerAsset = {
  55555: 18,
  12345: 18,
  54321: 18,
};
