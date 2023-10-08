import classNames from "classnames";
import React, { useContext, useEffect } from "react";
import styles from "./MarketStats.module.css";
import { UserContext } from "../../../context/UserContext";
import {
  addCommasToNumber,
  formatInputNum,
} from "../TradeActions/ActionPanel/TradeFormHelpers/FormHelpers";

const {
  SYMBOLS_TO_IDS,
  DECIMALS_PER_ASSET,
  PRICE_ROUNDING_DECIMALS,
  SIZE_ROUNDING_DECIMALS,
} = require("../../../app_logic/helpers/utils");

export default function MarketStats() {
  let {
    getMarkPrice,
    selectedMarket,
    selectedType,
    priceChange24h,
    spot24hInfo,
    perp24hInfo,
    tokenFundingInfo,
  } = useContext(UserContext);

  let token =
    selectedType == "perpetual"
      ? selectedMarket.perpetual.split("-")[0]
      : selectedMarket.pairs.split("/")[0];

  let marketPrice = getMarkPrice(
    SYMBOLS_TO_IDS[token],
    selectedType == "perpetual"
  );

  let colorStyle =
    priceChange24h[token]?.absolute > 0 ? styles.positive : styles.negative;

  let nominalVolume = 0;
  let trades = 0;
  let priceChangeInfo = selectedType == "perpetual" ? perp24hInfo : spot24hInfo;
  if (priceChangeInfo && priceChangeInfo[SYMBOLS_TO_IDS[token]]) {
    let res = priceChangeInfo[SYMBOLS_TO_IDS[token]];
    trades = res.trades;
    nominalVolume =
      (res.volume / 10 ** DECIMALS_PER_ASSET[SYMBOLS_TO_IDS[token]]) *
      marketPrice;
  }

  let latestFundingRate = 0;

  if (
    tokenFundingInfo.fundingRates &&
    tokenFundingInfo.fundingRates[SYMBOLS_TO_IDS[token]]
  ) {
    latestFundingRate =
      tokenFundingInfo.fundingRates[SYMBOLS_TO_IDS[token]][
        tokenFundingInfo.fundingRates[SYMBOLS_TO_IDS[token]].length - 1
      ] / 100_000;
  }

  useEffect(() => {}, [priceChange24h]);

  let priceRoundingDecimals = PRICE_ROUNDING_DECIMALS[SYMBOLS_TO_IDS[token]];
  let sizeRoundingDecimals = SIZE_ROUNDING_DECIMALS[SYMBOLS_TO_IDS[token]];

  return (
    <div
      className={classNames(
        styles.container,
        "border-t border-l border-r border-border_color w-full"
      )}
    >
      <div className={styles.price_container}>
        <div className={styles.price}>
          ${marketPrice.toFixed(priceRoundingDecimals)}
        </div>
        {/* <div className={styles.price_usd}>$0.00</div> */}
      </div>
      <div className={styles.twentyfour_change}>
        <div className={styles.label}>24h Change</div>
        <div className={`${styles.value} ${colorStyle}`}>
          {priceChange24h[token]
            ? priceChange24h[token].absolute.toFixed(priceRoundingDecimals)
            : 0}{" "}
          (
          {priceChange24h[token]
            ? priceChange24h[token].percentage.toFixed(2)
            : 0}
          %)
        </div>
      </div>
      <div className={styles.twentyfour_volume}>
        <div className={styles.label}>24h Volume</div>
        <div className={styles.value}>
          $
          {addCommasToNumber(
            Number(
              formatInputNum(nominalVolume.toString(), sizeRoundingDecimals)
            ).toFixed(sizeRoundingDecimals)
          )}
        </div>
      </div>
      <div className={styles.twentyfour_trades}>
        <div className={styles.label}>24h Trades</div>
        <div className={styles.value}>{addCommasToNumber(trades)}</div>
      </div>
      {selectedType == "perpetual" ? (
        <div className={styles.twentyfour_trades}>
          <div className={styles.label}>1h Funding</div>
          <div className={`${styles.value} ${styles.positive} `}>
            {latestFundingRate ? latestFundingRate : 0}%
          </div>
        </div>
      ) : null}
    </div>
  );
}
