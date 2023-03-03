import classNames from "classnames";
import React from "react";
import styles from "./MarketStats.module.css";

export default function MarketStats() {
  return (
    <div
      className={classNames(
        styles.container,
        "border-t border-l border-r border-border_color"
      )}
    >
      <div className={styles.price_container}>
        <div className={styles.price}>0</div>
        <div className={styles.price_usd}>$0.00</div>
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
