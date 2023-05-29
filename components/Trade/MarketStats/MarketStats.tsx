import classNames from "classnames";
import React, { useContext } from "react";
import styles from "./MarketStats.module.css";
import { WalletContext } from "../../../context/WalletContext";

const {
  SYMBOLS_TO_IDS,
  DECIMALS_PER_ASSET,
  PRICE_DECIMALS_PER_ASSET,
} = require("../../../app_logic/helpers/utils");

export default function MarketStats() {
  let { getMarkPrice, selectedMarket, selectedType } =
    useContext(WalletContext);

  let token =
    selectedType == "perpetual"
      ? selectedMarket.perpetual.split("-")[0]
      : selectedMarket.pairs.split("/")[0];

  return (
    <div
      className={classNames(
        styles.container,
        "border-t border-l border-r border-border_color"
      )}
    >
      <div className={styles.price_container}>
        <div className={styles.price}>
          $
          {getMarkPrice(
            SYMBOLS_TO_IDS[token],
            selectedType == "perpetual"
          ).toFixed(2)}
        </div>
        {/* <div className={styles.price_usd}>$0.00</div> */}
      </div>
      <div className={styles.twentyfour_change}>
        <div className={styles.label}>24h Change</div>
        <div className={`${styles.value} ${styles.positive} `}>0 ( + 0%)</div>
      </div>
      <div className={styles.twentyfour_volume}>
        <div className={styles.label}>24h Volume</div>
        <div className={styles.value}>$0.00</div>
      </div>
      <div className={styles.twentyfour_trades}>
        <div className={styles.label}>24h Trades</div>
        <div className={styles.value}>0</div>
      </div>
      {selectedType == "perpetual" ? (
        <div className={styles.twentyfour_trades}>
          <div className={styles.label}>8h Funding</div>
          <div className={`${styles.value} ${styles.positive} `}>
            +0.001976%
          </div>
        </div>
      ) : null}
    </div>
  );
}
