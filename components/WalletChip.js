import { shortAddress } from "../lib/dao";

export default function WalletChip({
  address,
  copied = false,
  onCopy,
  disabled = false,
}) {
  const short = shortAddress(address);
  const title = address ? `Copy full wallet address: ${address}` : "Wallet address";

  return (
    <button
      className={`wallet-chip${copied ? " is-copied" : ""}`}
      type="button"
      onClick={onCopy}
      disabled={disabled || !address}
      title={title}
      aria-label={title}
    >
      <span className="wallet-chip-address">{short}</span>
      <span className="wallet-chip-copy">{copied ? "Copied" : "Copy"}</span>
    </button>
  );
}
