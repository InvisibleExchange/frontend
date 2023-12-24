import React, { useEffect, useState } from "react";

const Toast = ({ message, expiry, onDismiss, type }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);

    let now = new Date().getTime();
    let duration = expiry - now;
    const timer = setTimeout(() => {
      let now = new Date().getTime();
      let duration = expiry - now;
      if (duration <= 0) {
        handleDismiss();
      }
    }, duration);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  const handleDismiss = () => {
    setVisible(false);

    if (onDismiss) {
      onDismiss();
    }
  };

  let colorClass = "";
  switch (type) {
    case "error":
      colorClass = "error_toast";
      break;

    case "info":
      colorClass = "info_toast";
      break;

    case "pending_tx":
      colorClass = "tx_toast";
      break;

    default:
      colorClass = "info_toast";
      break;
  }

  let aTag;
  if (type == "pending_tx") {
    let txHash = message.split(": ")[1];
    let txLink = "https://sepolia.etherscan.io/tx/" + txHash.toString();
    aTag = (
      <a href={txLink} target="_blank">
        {message ?? ""}
      </a>
    );
  }

  return (
    <div className={`toast ${visible ? "show" : ""} ${colorClass}`}>
      <div>{type == "pending_tx" ? aTag : message}</div>

      <button className="dismiss-btn" onClick={handleDismiss} title="Dismiss">
        &times;
      </button>
    </div>
  );
};

export default Toast;
