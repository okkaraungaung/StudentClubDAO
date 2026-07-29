import { useEffect, useState } from "react";
import UiIcon from "./UiIcon";

const AUTO_DISMISS_MS = 4500;

export default function StatusMessage({ message, tone = "success" }) {
  const [visible, setVisible] = useState(Boolean(message));

  useEffect(() => {
    if (!message) {
      setVisible(false);
      return undefined;
    }

    setVisible(true);

    const timer = window.setTimeout(() => {
      setVisible(false);
    }, AUTO_DISMISS_MS);

    return () => window.clearTimeout(timer);
  }, [message, tone]);

  if (!message || !visible) {
    return null;
  }

  const isError = tone === "error";
  const iconName = isError ? "remove" : "check";
  const role = isError ? "alert" : "status";
  const liveMode = isError ? "assertive" : "polite";

  return (
    <div
      id="status"
      className={`status show ${tone}`}
      role={role}
      aria-live={liveMode}
      aria-atomic="true"
    >
      <div className="status-icon" aria-hidden="true">
        <UiIcon name={iconName} size={16} />
      </div>
      <div className="status-copy">{message}</div>
      <button
        type="button"
        className="status-dismiss"
        onClick={() => setVisible(false)}
        aria-label="Dismiss message"
      >
        <UiIcon name="remove" size={14} />
      </button>
    </div>
  );
}
