import React, { useContext } from "react";
import classNames from "classnames";
import { UserContext } from "../../../../context/UserContext";
import {
  addCommasToNumber,
  formatInputNum,
} from "../../TradeActions/ActionPanel/TradeFormHelpers/FormHelpers";

import btcLogo from "../../../../public/tokenIcons/bitcoin.png";
import ethLogo from "../../../../public/tokenIcons/ethereum-eth-logo.png";
import usdcLogo from "../../../../public/tokenIcons/usdc-logo.png";

const tokenLogos = {
  54321: ethLogo,
  12345: btcLogo,
  55555: usdcLogo,
};

const {
  IDS_TO_SYMBOLS,
  DECIMALS_PER_ASSET,
  PRICE_DECIMALS_PER_ASSET,
} = require("../../../../app_logic/helpers/utils");

const Balances = () => {
  const { user, getMarkPrice } = useContext(UserContext);

  let userBalances: { token: any; balance: any }[] = [];
  if (user && user.userId) {
    Object.keys(user.noteData).forEach((token: any) => {
      userBalances.push({
        token: token,
        balance: user.getAvailableAmount(token),
      });
    });
  }

  return (
    <div className="block footer-table-wrp">
      <table className="w-1/3 table-fixed">
        <thead className="text-fg_middle_color text-[13px] font-overpass bg-bg_color">
          <tr>
            <th className="py-2 pl-5  text-left font-overpass">Symbol</th>
            <th className=" text-left">Available balance</th>
            <th className="pr-3  text-left">USD balance</th>
          </tr>
        </thead>

        <tbody className="overflow-y-auto max-h-24">
          {user && user.userId
            ? userBalances.map(({ token, balance }) => {
                let bal = Number(
                  formatInputNum(balance / 10 ** DECIMALS_PER_ASSET[token], 2)
                ).toFixed(2);
                let nominal =
                  IDS_TO_SYMBOLS[token] == "USDC"
                    ? Number(
                        formatInputNum(
                          (
                            balance /
                            10 ** DECIMALS_PER_ASSET[token]
                          ).toString(),
                          2
                        )
                      ).toFixed(2)
                    : Number(
                        formatInputNum(
                          (
                            (balance / 10 ** DECIMALS_PER_ASSET[token]) *
                            getMarkPrice(token, false)
                          ).toString(),
                          3
                        )
                      ).toFixed(3);

                return (
                  <tr
                    key={token}
                    className={classNames(
                      "cursor-pointer hover:bg-border_color text-sm"
                    )}
                  >
                    <td className="py-2.5 pl-5 font-medium  flex items-center gap-3">
                      <div className="flex">
                        <img
                          src={tokenLogos[token].src}
                          alt="Currency Logo"
                          className="logo_icon"
                        />
                        <p className="pt-1">{IDS_TO_SYMBOLS[token]}</p>
                      </div>
                    </td>
                    <td className="font-medium  dark:text-white text-fg_below_color">
                      {addCommasToNumber(bal)} {IDS_TO_SYMBOLS[token]}
                    </td>
                    <td className={classNames("pr-3 font-medium")}>
                      {addCommasToNumber(nominal)} USD
                    </td>
                  </tr>
                );
              })
            : null}
        </tbody>
      </table>
    </div>
  );
};

export default Balances;
