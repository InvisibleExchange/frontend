import React, { useEffect, useState } from "react";

const Toast = ({ message, duration = 3000, onDismiss }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => {
      if (visible) {
        setVisible(false);
        if (onDismiss) {
          onDismiss();
        }
      }
    }, duration);

    return () => {
      clearTimeout(timer);
    };
  }, [duration, onDismiss, visible]);

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
