import React from "react";
// import { ZZLOGO } from "../../../data/svgs";
import invisibleLogo from "../../../public/tokenIcons/invisible-logo.png";
import styles from "./Logo.module.css";

export default function Logo() {
  // return <div className={styles.container}>{ZZLOGO}</div>
  return (
    <div className={styles.container}>
      <img
        src={invisibleLogo.src}
        alt="Currency Logo"
        style={{ height: "2.5rem", borderRadius: "50%" }}
      />
    </div>
  );
}
