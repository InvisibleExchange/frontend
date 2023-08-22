import React, { useContext, useEffect, useRef, useState } from "react";
// import useFavoriteMarkets from "../../../../../hooks/useFavoriteMarkets/useFavoriteMarkets";

import classNames from "classnames";
import { HiStar, HiOutlineStar } from "react-icons/hi2";
import { FiSearch } from "react-icons/fi";
import { UserContext } from "../../../../../context/UserContext";

const { SYMBOLS_TO_IDS } = require("../../../../../app_logic/helpers/utils");

interface Props {
  close: () => void;
  marketList: any;
  setCurrentMarket: (market: any) => void;
  isCurrentMarket: any;
}

// const filterTokens = [
//   {
//     name: "ALL",
//     value: "",
//   },
// {
//   name: "BTC",
//   value: "btc",
// },
// {
//   name: "ETH",
//   value: "eth",
// },
// ];

export default function MarketsList({
  close,
  marketList,
  setCurrentMarket,
  isCurrentMarket,
}: Props) {
  let { getMarkPrice, priceChange24h } = useContext(UserContext);

  const [query, setQuery] = useState("");
  const [coinQuery, setCoinQuery] = useState("");

  const coinFilteredMarkets =
    coinQuery === ""
      ? marketList
      : marketList.filter((market: any) =>
          market.pairs
            .toLowerCase()
            .replace(/\s+/g, "")
            .includes(coinQuery.toLowerCase().replace(/\s+/g, ""))
        );

  const filteredMarkets =
    query === ""
      ? coinFilteredMarkets
      : coinFilteredMarkets.filter((market: any) =>
          market.pairs
            .toLowerCase()
            .replace(/\s+/g, "")
            .includes(query.toLowerCase().replace(/\s+/g, ""))
        );

  useEffect(() => {}, [isCurrentMarket]);

  return (
    <div className="top-12 bg-bg_color rounded-2xl">
      <div className="p-3 ">
        <input
          className=" w-full px-10 py-2 font-normal tracking-wide rounded-md bg-border_color focus:outline-none !font-overpass placeholder:font-overpass"
          type="text"
          name="query"
          placeholder="Search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <FiSearch className="absolute top-6 left-6" />
      </div>
      {/* <div className="flex items-center gap-6 p-3 bg-border_color">
        <HiStar className="w-3 h-3" />
        {filterTokens.map((item, index) => {
          return (
            <button
              key={index}
              className={classNames(
                "text-sm font-normal text-fg_below_color",
                coinQuery === item.value && " text-fg_top_color"
              )}
              onClick={() => setCoinQuery(item.value)}
            >
              {item.name}
            </button>
          );
        })}
      </div> */}

      <div className="block table-wrp">
        <table className="w-full table-fixed">
          <thead className="sticky border-y border-border_color text-fg_middle_color ">
            <tr>
              <th className="py-2 pl-3 text-[13px] font-light text-left font-overpass bg-bg_color">
                Pairs
              </th>
              <th className="text-[13px] font-light text-right font-overpass bg-bg_color">
                Last Price
              </th>
              <th className="pr-3 text-[13px] font-light text-right font-overpass bg-bg_color">
                Change
              </th>
            </tr>
          </thead>
          <tbody className="overflow-y-auto max-h-24">
            {filteredMarkets.map((item: any, index: any) => {
              let token = item.pairs.split("/")[0];

              let marketPrice = getMarkPrice(SYMBOLS_TO_IDS[token], false);

              let colorStyle =
                priceChange24h[token]?.absolute > 0
                  ? "text-green_lighter"
                  : "text-red";

              return (
                <tr
                  key={index}
                  className={classNames(
                    "cursor-pointer border-border_color ",
                    isCurrentMarket.pairs === item.pairs && "bg-border_color"
                  )}
                  onClick={(e) => {
                    setCurrentMarket(item);
                  }}
                >
                  <td
                    style={{
                      width: "150%",
                    }}
                    className="py-2.5 pl-3  max-h-12 flex items-center gap-3 overflow-y-auto"
                  >
                    <img
                      src={item.logo.src}
                      alt="BTC Logo"
                      className="logo_icon"
                    />
                    <p className="text-sm dark:text-white text-fg_below_color">
                      {item.pairs}
                    </p>

                    {/* <button
                      onClick={() => {
                        // Marked as favorite
                      }}
                    >
                      <HiOutlineStar className="w-4 h-4" />
                      <HiStar className="w-4 h-4" />
                    </button> */}
                  </td>

                  <td className="text-sm text-right dark:text-white text-fg_below_color max-h-12">
                    {marketPrice.toFixed(2)}
                  </td>
                  <td
                    className={classNames(
                      "pr-3 text-sm text-right max-h-12",
                      colorStyle
                    )}
                  >
                    {(priceChange24h[token]?.percentage * 100).toFixed(2)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
