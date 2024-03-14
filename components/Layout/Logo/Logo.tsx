import React from "react";
// import { ZZLOGO } from "../../../data/svgs";
import invisibleLogo from "../../../public/tokenIcons/invisible-logo.png";
import styles from "./Logo.module.css";
import Image from "next/image";

export default function Logo() {
  // return <div className={styles.container}>{ZZLOGO}</div>
  return (
    <div className={styles.container}>
      <Image
        src={invisibleLogo.src}
        alt="invisible Exchange Logo"
        width={40}
        height={40}
        style={{
          objectFit: "contain",
          height: "2.5rem",
          borderRadius: "50%",
        }}
      />
    </div>
  );
}
