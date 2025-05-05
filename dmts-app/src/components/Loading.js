import React, { useEffect, useState } from "react";
import Logo from "./Logo";
import "../styles/style.css";
import "../styles/splash.css";
import "../styles/progressbar.css";

const Loading = ({ onFinish }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let interval = null;
    if (progress < 100) {
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev < 100) return prev + 1;
          return 100;
        });
      }, 50);
    } else if (progress === 100) {
      // Wait 400ms to allow the bar to visually fill
      const timeout = setTimeout(() => {
        if (onFinish) onFinish();
      }, 400);
      return () => clearTimeout(timeout);
    }
    return () => clearInterval(interval);
  }, [progress, onFinish]);

  return (
    <div className="splash-overlay">
      <div className="splash-center">
        <Logo size="large" />
        <div className="mini-progress-bar-container">
          <div className="mini-progress-bar" style={{ width: `${progress}%` }}></div>
        </div>
      </div>
    </div>
  );
};

export default Loading;
