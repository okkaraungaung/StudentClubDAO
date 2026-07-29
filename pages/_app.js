import { useEffect } from "react";
import "../css/dashboard.css";
import "../css/dashboard-marketplace.css";

function WalletEventBridge() {
  useEffect(() => {
    const ethereum = window.ethereum;
    if (!ethereum?.on) return undefined;

    const reload = () => window.location.reload();
    ethereum.on("accountsChanged", reload);
    ethereum.on("chainChanged", reload);

    return () => {
      if (ethereum.removeListener) {
        ethereum.removeListener("accountsChanged", reload);
        ethereum.removeListener("chainChanged", reload);
        return;
      }

      ethereum.off?.("accountsChanged", reload);
      ethereum.off?.("chainChanged", reload);
    };
  }, []);

  return null;
}

export default function App({ Component, pageProps }) {
  return (
    <>
      <WalletEventBridge />
      <Component {...pageProps} />
    </>
  );
}
