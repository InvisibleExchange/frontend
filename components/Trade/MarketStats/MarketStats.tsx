import classNames from "classnames";
import React, { useContext, useEffect, useState } from "react";
import styles from "./MarketStats.module.css";
import { WalletContext } from "../../../context/WalletContext";
import { UserContext } from "../../../context/UserContext";
import {
  addCommasToNumber,
  formatInputNum,
} from "../TradeActions/ActionPanel/TradeFormHelpers/FormHelpers";

const {
  SYMBOLS_TO_IDS,
  DECIMALS_PER_ASSET,
  PRICE_DECIMALS_PER_ASSET,
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
  } = useContext(WalletContext);

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

  return (
    <div
      className={classNames(
        styles.container,
        "border-t border-l border-r border-border_color"
      )}
    >
      <div className={styles.price_container}>
        <div className={styles.price}>${marketPrice.toFixed(2)}</div>
        {/* <div className={styles.price_usd}>$0.00</div> */}
      </div>
      <div className={styles.twentyfour_change}>
        <div className={styles.label}>24h Change</div>
        <div className={`${styles.value} ${colorStyle}`}>
          {priceChange24h[token]?.absolute.toFixed(2)} (
          {(priceChange24h[token]?.percentage * 100).toFixed(2)}%)
        </div>
      </div>
      <div className={styles.twentyfour_volume}>
        <div className={styles.label}>24h Volume</div>
        <div className={styles.value}>
          $
          {addCommasToNumber(
            Number(formatInputNum(nominalVolume.toString(), 2)).toFixed(2)
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
