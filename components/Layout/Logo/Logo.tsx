import React from "react"
import { ZZLOGO } from "../../../data/svgs"
import styles from "./Logo.module.css"

export default function Logo() {
  return <div className={styles.container}>{ZZLOGO}</div>
}
