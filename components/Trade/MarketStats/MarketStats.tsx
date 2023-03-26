import classNames from "classnames";
import React, { useContext } from "react";
import styles from "./MarketStats.module.css";
import { WalletContext } from "../../../context/WalletContext";

const {
  SYMBOLS_TO_IDS,
  DECIMALS_PER_ASSET,
  PRICE_DECIMALS_PER_ASSET,
} = require("../../../app_logic/helpers/utils");

export default function MarketStats({ token, perpType }: any) {
  let { user, getMarkPrice } = useContext(WalletContext);

  return (
    <div
      className={classNames(
        styles.container,
        "border-t border-l border-r border-border_color"
      )}
    >
      <div className={styles.price_container}>
        <div className={styles.price}>
          ${getMarkPrice(SYMBOLS_TO_IDS[token], perpType == "perpetual")}
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
    </div>
  );
}
