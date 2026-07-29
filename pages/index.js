import Head from "next/head";
import { useRouter } from "next/router";
import { useState } from "react";
import AuthLayout from "../components/AuthLayout";
import StatusMessage from "../components/StatusMessage";
import { err, requestDaoClient } from "../lib/dao";

export default function HomePage() {
  const router = useRouter();
  const [status, setStatus] = useState("");
  const [tone, setTone] = useState("success");
  const [loading, setLoading] = useState(false);

  const connect = async () => {
    try {
      setLoading(true);
      setStatus("");
      const { member } = await requestDaoClient();
      await router.push(member.profileCreated ? "/dashboard" : "/register");
    } catch (e) {
      setTone("error");
      setStatus(err(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Connect Wallet — Student Club DAO</title>
      </Head>
      <AuthLayout
        eyebrow="Secure access"
        title="Student Club DAO"
        description="Connect MetaMask to open the club dashboard, review proposals, and keep your membership in one place."
        highlights={[
          { label: "MetaMask sign-in" },
          { label: "Treasury dashboard" },
          { label: "On-chain voting", soft: true },
        ]}
        panelEyebrow="Get started"
        panelTitle="Connect your wallet"
        panelDescription="You’ll be redirected to the dashboard after your wallet is verified."
      >
        <button type="button" onClick={connect} disabled={loading}>
          {loading ? "Connecting..." : "Connect MetaMask"}
        </button>
        <StatusMessage message={status} tone={tone} />
      </AuthLayout>
    </>
  );
}
