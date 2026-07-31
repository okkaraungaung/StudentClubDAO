import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import StatusMessage from "../components/StatusMessage";
import UiIcon from "../components/UiIcon";
import styles from "../css/members.module.css";
import {
  createDaoClient,
  err,
  formatEth,
  initialFrom,
  loadMemberDirectory,
  shortAddress,
} from "../lib/dao";

const FILTERS = ["Active", "All", "Due", "Paid", "Inactive"];

export default function MembersPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [tone, setTone] = useState("success");
  const [navUser, setNavUser] = useState("Member");
  const [profileName, setProfileName] = useState("Member");
  const [showAdmin, setShowAdmin] = useState(false);
  const [showExecutive, setShowExecutive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("Active");
  const [periods, setPeriods] = useState([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState("");
  const [members, setMembers] = useState([]);
  const [membershipFee, setMembershipFee] = useState(null);
  const [summary, setSummary] = useState({
    activeMembers: 0,
    executiveMembers: 0,
    paidMembers: 0,
    dueMembers: 0,
    inactiveMembers: 0,
    currentPeriodLabel: "No period selected",
    currentPeriodRange: "No payment periods yet",
  });

  const loadMembers = async ({ silent = false, periodOverride = null } = {}) => {
    if (!silent) {
      setLoading(true);
    }

    try {
      const session = await createDaoClient();
      const adminAddress = await session.contract.admin();

      if (!session.member.profileCreated) {
        await router.replace("/register");
        return;
      }

      const isAdmin = session.account.toLowerCase() === adminAddress.toLowerCase();
      const isExecutive = Number(session.member.role) === 2;

      if (!isAdmin && !isExecutive) {
        throw new Error("Executive access only.");
      }

      const directory = await loadMemberDirectory(
        session.contract,
        session.provider,
        periodOverride ?? selectedPeriodId,
        null,
      );

      setNavUser(shortAddress(session.account));
      setProfileName(session.member.nickname || "Executive");
      setShowAdmin(isAdmin);
      setShowExecutive(isExecutive);
      setPeriods(directory.periods);
      setSelectedPeriodId(
        directory.selectedPeriodId ? String(directory.selectedPeriodId) : "",
      );
      setMembers(directory.members);
      setMembershipFee(directory.membershipFee);
      setSummary(directory.stats);
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
    void loadMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePeriodChange = async (event) => {
    const nextPeriodId = String(event.target.value || "");
    setSelectedPeriodId(nextPeriodId);
    await loadMembers({ periodOverride: nextPeriodId });
  };

  const refreshMembers = async () => {
    await loadMembers({
      periodOverride: selectedPeriodId || null,
    });
  };

  const focusDueMembers = () => {
    setFilter("Due");
    document.getElementById("member-directory")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const paymentProgress =
    summary.activeMembers > 0
      ? Math.round((summary.paidMembers / summary.activeMembers) * 100)
      : 0;

  const membershipFeeLabel =
    membershipFee !== null ? formatEth(membershipFee) : "—";

  const currentPeriodLabel = summary.currentPeriodLabel || "No period selected";
  const currentPeriodRange = summary.currentPeriodRange || "No payment periods yet";

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const visibleMembers = members.filter((member) => {
    const matchesFilter =
      filter === "All"
        ? true
        : filter === "Active"
          ? member.active
          : member.paymentStatus === filter;

    const matchesSearch =
      !normalizedSearch ||
      [
        member.name,
        member.address,
        member.roleLabel,
        member.paymentStatus,
        member.paymentDetail,
        member.joinedPeriodLabel,
        member.joinedAt,
      ].some((value) =>
        String(value || "").toLowerCase().includes(normalizedSearch),
      );

    return matchesFilter && matchesSearch;
  });

  const emptyStateTitle =
    searchQuery.trim().length > 0
      ? "No members matched your search"
      : filter === "Due"
        ? "No members are due right now"
        : filter === "Paid"
          ? "No paid members in this view"
          : filter === "Inactive"
            ? "No inactive members found"
            : "No members available";

  const emptyStateText =
    searchQuery.trim().length > 0
      ? "Try a shorter name or paste only part of the address."
      : filter === "Due"
        ? "Everyone in the selected period has already paid, or the current roster has no outstanding dues."
        : filter === "Paid"
          ? "Switch to another period or clear the filter to see the full roster."
          : filter === "Inactive"
            ? "The contract has no inactive member records yet."
            : "The directory has not loaded any member records yet.";

  return (
    <>
      <Head>
        <title>Members | Student Club DAO</title>
        <meta
          name="description"
          content="Executive member directory with addresses, join dates, and payment status from the Student Club DAO blockchain data."
        />
      </Head>

      <DashboardLayout
        title="Members"
        navUser={navUser}
        profileName={profileName}
        showAdmin={showAdmin}
        showExecutive={showExecutive}
        actions={
          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.refreshButton}
              onClick={refreshMembers}
              disabled={loading}
            >
              <UiIcon name="activity" size={17} />
              {loading ? "Loading..." : "Refresh"}
            </button>

            <button
              type="button"
              className={styles.focusButton}
              onClick={focusDueMembers}
            >
              <UiIcon name="members" size={17} />
              Due members
            </button>
          </div>
        }
      >
        <main className={styles.page}>
          <StatusMessage message={status} tone={tone} />

          <section className={styles.pageHeader}>
            <div className={styles.headerContent}>
              <span className={styles.eyebrow}>Executive member tools</span>

              <h1>Track every member, address, and fee status</h1>

              <p>
                Use blockchain events to inspect the current roster, review who
                paid the selected period, and see the exact date each member
                joined the DAO.
              </p>

              <div className={styles.headerButtons}>
                <a href="#member-directory" className={styles.primaryButton}>
                  Open directory
                </a>

                <Link href="/fees" className={styles.secondaryButton}>
                  Open fees page
                </Link>
              </div>
            </div>

            <div className={styles.summaryPanel}>
              <div className={styles.summaryIcon}>
                <UiIcon name="members" size={28} />
              </div>

              <span className={styles.summaryLabel}>Selected payment period</span>
              <strong className={styles.summaryValue}>{currentPeriodLabel}</strong>
              <p className={styles.summaryRange}>{currentPeriodRange}</p>

              <div className={styles.summaryDivider} />

              <div className={styles.summaryProgressHeader}>
                <span>Payment completion</span>
                <strong>{paymentProgress}%</strong>
              </div>

              <div className={styles.progressTrack}>
                <div
                  className={styles.progressValue}
                  style={{ width: `${paymentProgress}%` }}
                />
              </div>

              <div className={styles.summaryStats}>
                <div>
                  <span>Paid</span>
                  <strong>{summary.paidMembers}</strong>
                </div>

                <div>
                  <span>Due</span>
                  <strong>{summary.dueMembers}</strong>
                </div>

                <div>
                  <span>Inactive</span>
                  <strong>{summary.inactiveMembers}</strong>
                </div>
              </div>

              <div className={styles.summaryFooter}>
                <span>Current membership fee</span>
                <strong>{membershipFeeLabel}</strong>
              </div>
            </div>
          </section>

          <section className={styles.overviewSection}>
            <div className={styles.sectionHeading}>
              <div>
                <span className={styles.sectionLabel}>Roster overview</span>
                <h2>Members at a glance</h2>
                <p className={styles.sectionDescription}>
                  Join dates come from the on-chain member-added event, so this
                  page stays aligned with the blockchain instead of a manual
                  spreadsheet.
                </p>
              </div>
            </div>

            <div className={styles.statisticsGrid}>
              <article className={styles.statisticCard}>
                <div className={styles.statisticTop}>
                  <div className={`${styles.statisticIcon} ${styles.blueIcon}`}>
                    <UiIcon name="members" size={22} />
                  </div>

                  <span className={styles.statisticNumber}>#01</span>
                </div>

                <span className={styles.statisticLabel}>Active members</span>
                <strong className={styles.statisticValue}>
                  {summary.activeMembers}
                </strong>

                <div className={styles.statisticFooter}>
                  <span>Current on-chain roster</span>
                  <strong>Live</strong>
                </div>
              </article>

              <article className={styles.statisticCard}>
                <div className={styles.statisticTop}>
                  <div className={`${styles.statisticIcon} ${styles.purpleIcon}`}>
                    <UiIcon name="members" size={22} />
                  </div>

                  <span className={styles.statisticNumber}>#02</span>
                </div>

                <span className={styles.statisticLabel}>Executive members</span>
                <strong className={styles.statisticValue}>
                  {summary.executiveMembers}
                </strong>

                <div className={styles.statisticFooter}>
                  <span>Addresses with executive role</span>
                  <strong>Review</strong>
                </div>
              </article>

              <article className={styles.statisticCard}>
                <div className={styles.statisticTop}>
                  <div className={`${styles.statisticIcon} ${styles.orangeIcon}`}>
                    <UiIcon name="fee" size={22} />
                  </div>

                  <span className={styles.statisticNumber}>#03</span>
                </div>

                <span className={styles.statisticLabel}>Membership fee</span>
                <strong className={styles.statisticValue}>
                  {membershipFeeLabel}
                </strong>

                <div className={styles.statisticFooter}>
                  <span>Required for each period</span>
                  <strong>ETH</strong>
                </div>
              </article>

              <article className={styles.statisticCard}>
                <div className={styles.statisticTop}>
                  <div className={`${styles.statisticIcon} ${styles.greenIcon}`}>
                    <UiIcon name="calendar" size={22} />
                  </div>

                  <span className={styles.statisticNumber}>#04</span>
                </div>

                <span className={styles.statisticLabel}>Selected period</span>
                <strong className={styles.statisticValue}>
                  {currentPeriodLabel}
                </strong>

                <div className={styles.statisticFooter}>
                  <span>{currentPeriodRange}</span>
                  <strong>Audit</strong>
                </div>
              </article>
            </div>
          </section>

          <section className={styles.directorySection} id="member-directory">
            <div className={styles.sectionHeading}>
              <div>
                <span className={styles.sectionLabel}>Member directory</span>
                <h2>Search and audit members</h2>
                <p className={styles.sectionDescription}>
                  Switch the payment period, search by address or nickname, and
                  filter the roster by payment state.
                </p>
              </div>
            </div>

            <div className={styles.controlsBar}>
              <label className={styles.searchField}>
                <span>Search</span>
                <input
                  type="search"
                  className={styles.searchInput}
                  placeholder="Search by name or address"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
              </label>

              <label className={styles.periodSelect}>
                <span>Payment period</span>
                <select
                  value={selectedPeriodId}
                  onChange={handlePeriodChange}
                  disabled={loading || periods.length === 0}
                >
                  {periods.length > 0 ? (
                    periods.map((period) => (
                      <option key={period.id} value={String(period.id)}>
                        {period.label} · {period.range}
                      </option>
                    ))
                  ) : (
                    <option value="">No payment periods available</option>
                  )}
                </select>
              </label>
            </div>

            <div className={styles.filters}>
              {FILTERS.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={filter === item ? styles.activeFilter : ""}
                  onClick={() => setFilter(item)}
                >
                  {item}
                </button>
              ))}
            </div>

            {loading && members.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.loader} />
                <h3>Loading member directory</h3>
                <p>We are reading the on-chain membership records right now.</p>
              </div>
            ) : visibleMembers.length > 0 ? (
              <div className={styles.memberGrid}>
                {visibleMembers.map((member) => {
                  const statusClass =
                    member.paymentStatus === "Paid"
                      ? styles.statusPaid
                      : member.paymentStatus === "Due"
                        ? styles.statusDue
                        : member.paymentStatus === "Inactive"
                          ? styles.statusInactive
                          : styles.statusNeutral;

                  return (
                    <article className={styles.memberCard} key={member.id}>
                      <div className={styles.memberCardTop}>
                        <div className={styles.memberIdentity}>
                          <div className={styles.memberAvatar}>
                            {initialFrom(member.nickname || member.roleLabel)}
                          </div>

                          <div className={styles.memberName}>
                            <h3>{member.name}</h3>
                            <span className={styles.memberRole}>
                              {member.roleLabel}
                            </span>
                          </div>
                        </div>

                        <span className={`${styles.memberStatus} ${statusClass}`}>
                          {member.paymentStatus}
                        </span>
                      </div>

                      <div className={styles.addressBox}>
                        <span>Wallet address</span>
                        <strong>{member.address}</strong>
                      </div>

                      <div className={styles.memberMeta}>
                        <div>
                          <span>Joined on</span>
                          <strong>{member.joinedAt}</strong>
                        </div>

                        <div>
                          <span>Joined period</span>
                          <strong>{member.joinedPeriodLabel}</strong>
                        </div>
                      </div>

                      <div className={styles.memberFooter}>
                        <div className={styles.memberFooterRow}>
                          <span>Selected period</span>
                          <strong>{currentPeriodLabel}</strong>
                        </div>

                        <p>{member.paymentDetail}</p>

                        {!member.active && member.removalLabel ? (
                          <div className={styles.removalNote}>
                            <UiIcon name="remove" size={14} />
                            <span>
                              {member.removalLabel}
                              {member.removalAt ? ` · ${member.removalAt}` : ""}
                            </span>
                          </div>
                        ) : null}
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <UiIcon name="members" size={24} />
                </div>
                <h3>{emptyStateTitle}</h3>
                <p>{emptyStateText}</p>
              </div>
            )}
          </section>
        </main>
      </DashboardLayout>
    </>
  );
}
