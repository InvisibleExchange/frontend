import React, { useEffect, useState } from "react";

const Toast = ({ message, expiry, onDismiss }) => {
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

  return (
    <div className={`toast ${visible ? "show" : ""}`}>
      {message || "Sample toast message"}
      <button className="dismiss-btn" onClick={handleDismiss} title="Dismiss">
        &times;
      </button>
    </div>
  );
};

export default Toast;
