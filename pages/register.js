import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import AuthLayout from "../components/AuthLayout";
import WalletChip from "../components/WalletChip";
import StatusMessage from "../components/StatusMessage";
import { copyText, createDaoClient, err } from "../lib/dao";

export default function RegisterPage() {
  const router = useRouter();
  const copyTimer = useRef(null);
  const [account, setAccount] = useState("");
  const [nickname, setNickname] = useState("");
  const [status, setStatus] = useState("");
  const [tone, setTone] = useState("success");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const { account: walletAccount, member } = await createDaoClient();
        if (!active) return;
        if (member.profileCreated) {
          await router.replace("/dashboard");
          return;
        }
        setAccount(walletAccount);
      } catch (e) {
        if (!active) return;
        setTone("error");
        setStatus(err(e));
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
      clearTimeout(copyTimer.current);
    };
  }, [router]);

  const handleCopy = async () => {
    try {
      await copyText(account);
      setCopied(true);
      clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 1400);
    } catch (e) {
      setTone("error");
      setStatus(err(e));
    }
  };

  const createProfile = async (event) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      setStatus("");
      const form = event.currentTarget;
      const formData = new FormData(form);
      const name = String(formData.get("nickname") || "").trim();
      if (!name) throw new Error("Nickname is required");

      const { contract } = await createDaoClient();
      if (!(await contract.isNicknameAvailable(name))) {
        throw new Error("Nickname is unavailable");
      }

      const tx = await contract.createProfile(name);
      await tx.wait();
      await router.push("/dashboard");
    } catch (e) {
      setTone("error");
      setStatus(err(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Create Profile — Student Club DAO</title>
      </Head>
      <AuthLayout
        eyebrow="Finish setup"
        title="Create Member Profile"
        description="Set your nickname before entering the dashboard so your wallet feels like a real club identity."
        highlights={[
          { label: "Wallet verified" },
          { label: "Nickname identity" },
          { label: "Dashboard ready", soft: true },
        ]}
        panelEyebrow="Member setup"
        panelTitle="Choose your nickname"
        panelDescription="This name will appear across the dashboard, proposals, and fees pages."
      >
        <div className="profile-wallet-row">
          <span className="detail-label">Wallet</span>
          <WalletChip address={account} copied={copied} onCopy={handleCopy} />
        </div>
        <form onSubmit={createProfile}>
          <label htmlFor="nickname">Nickname</label>
          <input
            id="nickname"
            name="nickname"
            minLength={3}
            maxLength={20}
            required
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
          />
          <button type="submit" disabled={submitting || loading}>
            {submitting ? "Creating..." : "Create Profile"}
          </button>
        </form>
        <StatusMessage message={status} tone={tone} />
      </AuthLayout>
    </>
  );
}
