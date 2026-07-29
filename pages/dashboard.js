import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import StatusMessage from "../components/StatusMessage";
import UiIcon from "../components/UiIcon";
import WalletChip from "../components/WalletChip";
import {
  copyText,
  createDaoClient,
  err,
  formatEth,
  initialFrom,
  parseEth,
  roleName,
  shortAddress,
} from "../lib/dao";

export default function DashboardPage() {
  const router = useRouter();
  const depositRef = useRef(null);
  const walletCopyTimer = useRef(null);

  const [loading, setLoading] = useState(true);
  const [savingNickname, setSavingNickname] = useState(false);
  const [depositing, setDepositing] = useState(false);
  const [status, setStatus] = useState("");
  const [tone, setTone] = useState("success");
  const [account, setAccount] = useState("");
  const [member, setMember] = useState(null);
  const [navUser, setNavUser] = useState("Connected");
  const [showAdmin, setShowAdmin] = useState(false);
  const [walletCopied, setWalletCopied] = useState(false);
  const [nickname, setNickname] = useState("");
  const [depositAmount, setDepositAmount] = useState("");

  const [metrics, setMetrics] = useState({
    adminAddress: "",
    treasuryBalance: null,
    membershipFee: null,
    memberCount: null,
  });

  const loadDashboard = async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
    }

    try {
      const session = await createDaoClient();

      if (Number(session.member.role) === 0 || !session.member.active) {
        throw new Error("This wallet is not an active member.");
      }

      if (!session.member.profileCreated) {
        await router.replace("/register");
        return;
      }

      const [adminAddress, treasuryBalance, membershipFee, memberCount] =
        await Promise.all([
          session.contract.admin(),
          session.contract.getTreasuryBalance(),
          session.contract.membershipFee(),
          session.contract.memberCount(),
        ]);

      setAccount(session.account);
      setMember(session.member);
      setNavUser(shortAddress(session.account));
      setNickname(session.member.nickname || "Member");

      setShowAdmin(
        session.account.toLowerCase() === adminAddress.toLowerCase(),
      );

      setMetrics({
        adminAddress,
        treasuryBalance,
        membershipFee,
        memberCount,
      });
    } catch (error) {
      setTone("error");
      setStatus(err(error));
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    void loadDashboard();

    return () => {
      if (walletCopyTimer.current) {
        clearTimeout(walletCopyTimer.current);
      }
    };
  }, []);

  const copyWalletAddress = async () => {
    if (!account) return;

    try {
      await copyText(account);
      setWalletCopied(true);

      if (walletCopyTimer.current) {
        clearTimeout(walletCopyTimer.current);
      }

      walletCopyTimer.current = setTimeout(() => {
        setWalletCopied(false);
      }, 1800);
    } catch (error) {
      setTone("error");
      setStatus(err(error));
    }
  };

  const updateNickname = async (event) => {
    event.preventDefault();

    const cleanedNickname = nickname.trim();

    if (!cleanedNickname) {
      setTone("error");
      setStatus("Please enter a nickname.");
      return;
    }

    try {
      setSavingNickname(true);
      setStatus("");

      const session = await createDaoClient();
      const transaction =
        await session.contract.updateNickname(cleanedNickname);

      await transaction.wait();

      setTone("success");
      setStatus("Your profile nickname was updated successfully.");
      await loadDashboard({ silent: true });
    } catch (error) {
      setTone("error");
      setStatus(err(error));
    } finally {
      setSavingNickname(false);
    }
  };

  const depositToTreasury = async (event) => {
    event.preventDefault();

    if (!depositAmount.trim()) {
      setTone("error");
      setStatus("Please enter an ETH amount.");
      return;
    }

    try {
      setDepositing(true);
      setStatus("");

      const session = await createDaoClient();
      const transaction = await session.contract.depositFunds({
        value: parseEth(depositAmount),
      });

      await transaction.wait();

      setDepositAmount("");
      setTone("success");
      setStatus("Your ETH deposit was added to the DAO treasury.");
      await loadDashboard({ silent: true });
    } catch (error) {
      setTone("error");
      setStatus(err(error));
    } finally {
      setDepositing(false);
    }
  };

  const nicknameValue = member?.nickname || nickname || "DAO Member";
  const walletAddress = account || "";
  const profileAvatar = initialFrom(nicknameValue);
  const heroRole = member ? roleName(Number(member.role)) : "Member";
  const heroJoined =
    member?.joinedPeriod !== undefined
      ? String(member.joinedPeriod)
      : member?.joinedAt !== undefined
        ? String(member.joinedAt)
        : "—";

  const treasuryValue =
    metrics.treasuryBalance !== null ? formatEth(metrics.treasuryBalance) : "—";

  const feeValue =
    metrics.membershipFee !== null ? formatEth(metrics.membershipFee) : "—";

  const memberCountValue =
    metrics.memberCount !== null ? String(metrics.memberCount) : "—";

  const activityItems = [
    {
      user: "Treasury",
      text: "received a new community contribution",
      time: "Recently",
      icon: "deposit",
      type: "Transfer",
      artwork: "activity-blue",
    },
    {
      user: "Community",
      text: "published a new funding proposal",
      time: "Today",
      icon: "activity",
      type: "Proposal",
      artwork: "activity-purple",
    },
    {
      user: "Members",
      text: "participated in the latest governance vote",
      time: "This week",
      icon: "members",
      type: "Vote",
      artwork: "activity-orange",
    },
    {
      user: nicknameValue,
      text: "is an active member of this DAO",
      time: "Active now",
      icon: "profile",
      type: "Member",
      artwork: "activity-green",
    },
  ];

  return (
    <>
      <Head>
        <title>Explore | Student Club DAO</title>
        <meta
          name="description"
          content="Explore proposals, treasury activity, and membership information for the Student Club DAO."
        />
      </Head>

      <DashboardLayout
        title="Explore"
        navUser={navUser}
        profileName={nicknameValue}
        showAdmin={showAdmin}
        actions={
          <div className="top-actions">
            <Link href="/proposals" className="market-button secondary">
              <UiIcon name="activity" size={17} />
              Explore
            </Link>

            <button
              type="button"
              className="market-button primary"
              onClick={() => {
                depositRef.current?.scrollIntoView({
                  behavior: "smooth",
                  block: "center",
                });

                setTimeout(() => {
                  depositRef.current?.focus();
                }, 400);
              }}
            >
              <UiIcon name="deposit" size={17} />
              Add funds
            </button>
          </div>
        }
      >
        <main className="nft-dashboard">
          <StatusMessage message={status} tone={tone} />

          <section className="hero">
            <div className="hero-light hero-light-one" />
            <div className="hero-light hero-light-two" />

            <div className="hero-content">
              <div className="hero-label">
                <span className="live-indicator" />
                Student Club DAO
              </div>

              <h1>
                Discover ideas.
                <br />
                Fund the future.
              </h1>

              <p>
                Explore community proposals, support student-led projects, and
                help shape every decision through decentralized governance.
              </p>

              <div className="hero-actions">
                <Link href="/proposals" className="hero-button filled">
                  Explore proposals
                </Link>

                <button
                  type="button"
                  className="hero-button transparent"
                  onClick={() => {
                    depositRef.current?.scrollIntoView({
                      behavior: "smooth",
                      block: "center",
                    });
                  }}
                >
                  Fund treasury
                </button>
              </div>

              <div className="hero-statistics">
                <div>
                  <strong>{memberCountValue}</strong>
                  <span>Members</span>
                </div>

                <div>
                  <strong>{treasuryValue}</strong>
                  <span>Treasury</span>
                </div>

                <div>
                  <strong>{heroJoined}</strong>
                  <span>Joined period</span>
                </div>
              </div>
            </div>

            <div className="featured-wrapper">
              <article className="featured-nft">
                <div className="featured-art">
                  <div className="art-grid" />
                  <div className="art-orb orb-blue" />
                  <div className="art-orb orb-purple" />
                  <div className="art-orb orb-pink" />

                  <div className="featured-badge">
                    <span />
                    Featured collection
                  </div>

                  <div className="art-letter">S</div>
                </div>

                <div className="featured-information">
                  <div>
                    <span>Student Club Collection</span>
                    <h2>DAO Genesis Pass</h2>
                  </div>

                  <div className="featured-price">
                    <span>Membership fee</span>
                    <strong>{feeValue}</strong>
                  </div>
                </div>

                <div className="featured-owner">
                  <div className="owner-avatar">{profileAvatar}</div>

                  <div>
                    <span>Connected member</span>
                    <strong>{nicknameValue}</strong>
                  </div>

                  <div className="verified-badge">✓</div>
                </div>
              </article>
            </div>
          </section>

          <section className="market-section">
            <div className="section-header">
              <div>
                <span className="section-label">Marketplace overview</span>
                <h2>Trending in your DAO</h2>
              </div>

              <Link href="/proposals" className="view-all">
                View proposals
                <span>→</span>
              </Link>
            </div>

            <div className="metric-grid">
              <article className="metric-card">
                <div className="metric-top">
                  <div className="metric-icon blue">
                    <UiIcon name="treasury" size={22} />
                  </div>
                  <span className="metric-rank">#01</span>
                </div>

                <span className="metric-label">Treasury balance</span>
                <strong className="metric-value">{treasuryValue}</strong>

                <div className="metric-footer">
                  <span>Available community funds</span>
                  <strong>ETH</strong>
                </div>
              </article>

              <article className="metric-card">
                <div className="metric-top">
                  <div className="metric-icon purple">
                    <UiIcon name="members" size={22} />
                  </div>
                  <span className="metric-rank">#02</span>
                </div>

                <span className="metric-label">Community members</span>
                <strong className="metric-value">{memberCountValue}</strong>

                <div className="metric-footer">
                  <span>Verified DAO members</span>
                  <strong className="positive">Active</strong>
                </div>
              </article>

              <article className="metric-card">
                <div className="metric-top">
                  <div className="metric-icon pink">
                    <UiIcon name="fee" size={22} />
                  </div>
                  <span className="metric-rank">#03</span>
                </div>

                <span className="metric-label">Membership floor</span>
                <strong className="metric-value">{feeValue}</strong>

                <div className="metric-footer">
                  <span>Current entry amount</span>
                  <strong>ETH</strong>
                </div>
              </article>
            </div>
          </section>

          <section className="dashboard-content">
            <div className="activity-column">
              <div className="section-header activity-header">
                <div>
                  <span className="section-label">Live marketplace</span>
                  <h2>Recent activity</h2>
                </div>

                <button
                  type="button"
                  className="refresh-button"
                  onClick={() => loadDashboard()}
                  disabled={loading}
                >
                  {loading ? "Loading..." : "Refresh"}
                </button>
              </div>

              <div className="activity-list">
                {activityItems.map((activity) => (
                  <article
                    className="activity-item"
                    key={`${activity.user}-${activity.type}`}
                  >
                    <div className={`activity-artwork ${activity.artwork}`}>
                      <UiIcon name={activity.icon} size={21} />
                    </div>

                    <div className="activity-description">
                      <p>
                        <strong>{activity.user}</strong> {activity.text}
                      </p>
                      <span>{activity.time}</span>
                    </div>

                    <span className="activity-type">{activity.type}</span>
                  </article>
                ))}
              </div>
            </div>

            <aside className="profile-column">
              <article className="profile-card">
                <div className="profile-cover">
                  <div className="profile-cover-grid" />
                  <div className="profile-cover-circle circle-one" />
                  <div className="profile-cover-circle circle-two" />
                </div>

                <div className="profile-content">
                  <div className="large-avatar">
                    {profileAvatar}
                    <span>✓</span>
                  </div>

                  <h2>{nicknameValue}</h2>
                  <p>
                    {heroRole} · Period {heroJoined}
                  </p>

                  <WalletChip
                    address={walletAddress}
                    copied={walletCopied}
                    onCopy={copyWalletAddress}
                    disabled={loading || !walletAddress}
                  />

                  <div className="profile-information">
                    <div>
                      <span>Role</span>
                      <strong>{heroRole}</strong>
                    </div>

                    <div>
                      <span>Membership</span>
                      <strong className="active-text">Active</strong>
                    </div>

                    <div>
                      <span>Profile</span>
                      <strong>
                        {member?.profileCreated ? "Verified" : "Incomplete"}
                      </strong>
                    </div>
                  </div>
                </div>
              </article>
            </aside>
          </section>

          <section className="utility-grid">
            <article className="utility-card">
              <div className="utility-header">
                <div className="utility-icon purple">
                  <UiIcon name="profile" size={20} />
                </div>

                <div>
                  <span>Identity</span>
                  <h3>Edit profile</h3>
                </div>
              </div>

              <form className="utility-form" onSubmit={updateNickname}>
                <label htmlFor="nickname">Display name</label>

                <input
                  id="nickname"
                  type="text"
                  value={nickname}
                  onChange={(event) => setNickname(event.target.value)}
                  placeholder="Enter your nickname"
                  maxLength={40}
                  disabled={savingNickname}
                />

                <p>
                  This name appears on your dashboard and connected member
                  profile.
                </p>

                <button type="submit" disabled={savingNickname || loading}>
                  {savingNickname ? "Saving..." : "Save profile"}
                </button>
              </form>
            </article>

            <article className="utility-card highlighted">
              <div className="utility-header">
                <div className="utility-icon blue">
                  <UiIcon name="deposit" size={20} />
                </div>

                <div>
                  <span>Treasury</span>
                  <h3>Add community funds</h3>
                </div>
              </div>

              <form className="utility-form" onSubmit={depositToTreasury}>
                <label htmlFor="depositAmount">Deposit amount</label>

                <div className="eth-field">
                  <input
                    ref={depositRef}
                    id="depositAmount"
                    type="number"
                    min="0"
                    step="any"
                    value={depositAmount}
                    onChange={(event) => setDepositAmount(event.target.value)}
                    placeholder="0.00"
                    disabled={depositing}
                  />
                  <span>ETH</span>
                </div>

                <p>
                  Deposited ETH becomes available for approved community
                  proposals.
                </p>

                <button type="submit" disabled={depositing || loading}>
                  {depositing ? "Confirming..." : "Deposit ETH"}
                </button>
              </form>
            </article>

            <article className="utility-card">
              <div className="utility-header">
                <div className="utility-icon pink">
                  <UiIcon name="activity" size={20} />
                </div>

                <div>
                  <span>Explore</span>
                  <h3>Quick navigation</h3>
                </div>
              </div>

              <div className="quick-links">
                <Link href="/proposals">
                  <span>Browse proposals</span>
                  <strong>→</strong>
                </Link>

                <Link href="/create-proposal">
                  <span>Create proposal</span>
                  <strong>→</strong>
                </Link>

                {showAdmin && (
                  <Link href="/admin">
                    <span>Admin dashboard</span>
                    <strong>→</strong>
                  </Link>
                )}

                <button
                  type="button"
                  onClick={() => loadDashboard()}
                  disabled={loading}
                >
                  <span>Refresh blockchain data</span>
                  <strong>↻</strong>
                </button>
              </div>
            </article>
          </section>
        </main>
      </DashboardLayout>
    </>
  );
}
