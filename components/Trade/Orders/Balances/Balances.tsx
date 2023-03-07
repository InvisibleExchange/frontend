import React, { useContext } from "react";
import classNames from "classnames";
import { WalletContext } from "../../../../context/WalletContext";

const {
  IDS_TO_SYMBOLS,
  DECIMALS_PER_ASSET,
  PRICE_DECIMALS_PER_ASSET,
} = require("../../../../app_logic/helpers/utils");

const Balances = () => {
  const { user } = useContext(WalletContext);

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
    <table className="w-1/3 table-fixed">
      <thead className="text-fg_middle_color text-[13px] font-overpass ">
        <tr>
          <th className="py-2 pl-5  text-left font-overpass">Symbol</th>
          <th className=" text-left">Available balance</th>
          <th className="pr-3  text-left">USD balance</th>
        </tr>
      </thead>

      <tbody>
        {user && user.userId
          ? userBalances.map(({ token, balance }) => {
              return (
                <tr
                  key={token}
                  className={classNames(
                    "cursor-pointer hover:bg-border_color text-sm"
                  )}
                >
                  <td className="py-2.5 pl-5 font-medium  flex items-center gap-3">
                    {IDS_TO_SYMBOLS[token]}
                  </td>
                  <td className="font-medium  dark:text-white text-fg_below_color">
                    {balance / 10 ** DECIMALS_PER_ASSET[token]}{" "}
                    {IDS_TO_SYMBOLS[token]}
                  </td>
                  <td className={classNames("pr-3 font-medium")}>
                    {balance / 10 ** DECIMALS_PER_ASSET[token]} * Price USD
                  </td>
                </tr>
              );
            })
          : null}
      </tbody>
    </table>
  );
};

export default Balances;
