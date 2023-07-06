import { useState, useContext } from "react";

// import Jazzicon, { jsNumberForAddress } from "react-jazzicon"

// import DownArrow from "../DownArrow"
// import ConnectButtonDropdown from "./ConnectButtonDropdown"
// import { hideAddress } from "../../utils/utils"
// import useTranslation from "next-translate/useTranslation"
import { WalletContext } from "../../../context/WalletContext";
import { hideAddress } from "../../../utils/utils";

function ConnectWallet() {
  const { userAddress, username, connect, disconnect } =
    useContext(WalletContext);

  if (!userAddress) {
    return (
      <button
        className="flex items-center px-8 py-1.5 mr-5 font-medium text-white rounded-md bg-blue hover:opacity-75"
        onClick={() => connect()}
      >
        Connect
      </button>
    );
  } else {
    let usernameOrAddress;
    if (username) {
      usernameOrAddress = <div className="font-mono text-sm">{username} </div>;
    } else if (userAddress) {
      usernameOrAddress = (
        <div className="font-mono text-sm">{hideAddress(userAddress)}</div>
      );
    }

    return (
      <div
        className="flex items-center gap-3 pl-6 mr-5 border-l cursor-pointer hover:opacity-75 border-border_color"
        onClick={disconnect}
      >
        <div className="w-3 h-3 rounded-full bg-green" />
        <div>{usernameOrAddress}</div>
      </div>
    );
  }
}

export default ConnectWallet;
