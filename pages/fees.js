import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import StatusMessage from "../components/StatusMessage";
import UiIcon from "../components/UiIcon";
import {
  createDaoClient,
  err,
  formatEth,
  formatPeriodRange,
  shortAddress,
} from "../lib/dao";
import styles from "../css/fees.module.css";

export default function FeesPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [processingPeriod, setProcessingPeriod] = useState(null);
  const [status, setStatus] = useState("");
  const [tone, setTone] = useState("success");
  const [navUser, setNavUser] = useState("Member");
  const [profileName, setProfileName] = useState("Member");
  const [showAdmin, setShowAdmin] = useState(false);
  const [feeValue, setFeeValue] = useState("");
  const [periods, setPeriods] = useState([]);
  const [filter, setFilter] = useState("All");

  const loadFees = async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
    }

    try {
      const session = await createDaoClient();

      if (!session.member.profileCreated) {
        await router.replace("/register");
        return;
      }

      const [adminAddress, membershipFee, count] = await Promise.all([
        session.contract.admin(),
        session.contract.membershipFee(),
        session.contract.paymentPeriodCount(),
      ]);

      const items = [];

      for (let i = 1n; i <= count; i += 1n) {
        const period = await session.contract.paymentPeriods(i);
        const paid = await session.contract.hasPaid(session.account, i);

        items.push({
          id: String(period.id),
          name: period.name,
          startTime: period.startTime,
          endTime: period.endTime,
          paid,
        });
      }

      setProfileName(session.member.nickname || "Member");
      setNavUser(shortAddress(session.account));

      setShowAdmin(
        session.account.toLowerCase() === adminAddress.toLowerCase(),
      );

      setFeeValue(formatEth(membershipFee));
      setPeriods(items.reverse());
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
    void loadFees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const payFee = async (periodId) => {
    try {
      setProcessingPeriod(periodId);
      setStatus("");

      const session = await createDaoClient();
      const membershipFee = await session.contract.membershipFee();

      const transaction = await session.contract.payMembershipFee(periodId, {
        value: membershipFee,
      });

      await transaction.wait();

      setTone("success");
      setStatus("Membership fee paid successfully.");

      await loadFees({ silent: true });
    } catch (error) {
      setTone("error");
      setStatus(err(error));
    } finally {
      setProcessingPeriod(null);
    }
  };

  const paidPeriods = periods.filter((period) => period.paid).length;

  const pendingPeriods = periods.filter((period) => !period.paid).length;

  const periodCount = periods.length;

  const paymentProgress =
    periodCount === 0 ? 0 : Math.round((paidPeriods / periodCount) * 100);

  const filteredPeriods = periods.filter((period) => {
    if (filter === "Paid") {
      return period.paid;
    }

    if (filter === "Pending") {
      return !period.paid;
    }

    return true;
  });

  return (
    <>
      <Head>
        <title>Membership Fees | Student Club DAO</title>

        <meta
          name="description"
          content="View and pay Student Club DAO membership fees."
        />
      </Head>

      <DashboardLayout
        title="Membership Fees"
        navUser={navUser}
        profileName={profileName}
        showAdmin={showAdmin}
        actions={
          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.refreshButton}
              disabled={loading}
              onClick={() => loadFees()}
            >
              <UiIcon name="activity" size={17} />
              {loading ? "Loading..." : "Refresh"}
            </button>

            <a href="#payment-periods" className={styles.reviewButton}>
              <UiIcon name="fee" size={17} />
              Review periods
            </a>
          </div>
        }
      >
        <main className={styles.page}>
          <StatusMessage message={status} tone={tone} />

          <section className={styles.pageHeader}>
            <div className={styles.headerContent}>
              <span className={styles.eyebrow}>Membership management</span>

              <h1>Keep your membership payments up to date</h1>

              <p>
                Review every payment period, settle outstanding membership fees,
                and maintain your active standing in the Student Club DAO.
              </p>

              <div className={styles.headerButtons}>
                <a href="#payment-periods" className={styles.primaryButton}>
                  View payment periods
                </a>

                {pendingPeriods > 0 && (
                  <a href="#pending-periods" className={styles.secondaryButton}>
                    View pending payments
                  </a>
                )}
              </div>
            </div>

            <div className={styles.paymentSummary}>
              <div className={styles.summaryIcon}>
                <UiIcon name="fee" size={28} />
              </div>

              <span className={styles.summaryLabel}>
                Current membership fee
              </span>

              <strong className={styles.summaryValue}>{feeValue || "—"}</strong>

              <span className={styles.summaryCurrency}>ETH</span>

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

              <p>
                {paidPeriods} of {periodCount} payment periods completed
              </p>
            </div>
          </section>

          <section className={styles.overviewSection}>
            <div className={styles.sectionHeading}>
              <div>
                <span className={styles.sectionLabel}>Account overview</span>

                <h2>Membership fee status</h2>
              </div>
            </div>

            <div className={styles.statisticsGrid}>
              <article className={styles.statisticCard}>
                <div className={styles.statisticTop}>
                  <div className={`${styles.statisticIcon} ${styles.blueIcon}`}>
                    <UiIcon name="fee" size={22} />
                  </div>

                  <span className={styles.statisticNumber}>#01</span>
                </div>

                <span className={styles.statisticLabel}>Current fee</span>

                <strong className={styles.statisticValue}>
                  {feeValue || "—"}
                </strong>

                <div className={styles.statisticFooter}>
                  <span>Required for each period</span>
                  <strong>ETH</strong>
                </div>
              </article>

              <article className={styles.statisticCard}>
                <div className={styles.statisticTop}>
                  <div
                    className={`${styles.statisticIcon} ${styles.greenIcon}`}
                  >
                    <UiIcon name="check" size={22} />
                  </div>

                  <span className={styles.statisticNumber}>#02</span>
                </div>

                <span className={styles.statisticLabel}>Paid periods</span>

                <strong className={styles.statisticValue}>{paidPeriods}</strong>

                <div className={styles.statisticFooter}>
                  <span>Successfully completed</span>
                  <strong className={styles.successText}>Paid</strong>
                </div>
              </article>

              <article className={styles.statisticCard}>
                <div className={styles.statisticTop}>
                  <div
                    className={`${styles.statisticIcon} ${styles.amberIcon}`}
                  >
                    <UiIcon name="clock" size={22} />
                  </div>

                  <span className={styles.statisticNumber}>#03</span>
                </div>

                <span className={styles.statisticLabel}>Pending periods</span>

                <strong className={styles.statisticValue}>
                  {pendingPeriods}
                </strong>

                <div className={styles.statisticFooter}>
                  <span>Still require payment</span>
                  <strong className={styles.warningText}>Pending</strong>
                </div>
              </article>
            </div>
          </section>

          <section id="payment-periods" className={styles.periodsSection}>
            <div className={styles.sectionHeading}>
              <div>
                <span className={styles.sectionLabel}>Payment history</span>

                <h2>Membership periods</h2>

                <p className={styles.sectionDescription}>
                  Select a payment period below to review its status and
                  complete any outstanding membership payment.
                </p>
              </div>

              <div className={styles.filters}>
                {["All", "Pending", "Paid"].map((filterName) => (
                  <button
                    key={filterName}
                    type="button"
                    className={filter === filterName ? styles.activeFilter : ""}
                    onClick={() => setFilter(filterName)}
                  >
                    {filterName}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className={styles.emptyState}>
                <div className={styles.loader} />
                <h3>Loading payment periods</h3>
                <p>
                  Reading your membership payment information from the
                  blockchain.
                </p>
              </div>
            ) : filteredPeriods.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <UiIcon name="fee" size={30} />
                </div>

                <h3>No payment periods found</h3>

                <p>There are no membership periods matching this filter.</p>
              </div>
            ) : (
              <div className={styles.periodGrid}>
                {filteredPeriods.map((period) => {
                  const isProcessing = processingPeriod === period.id;

                  return (
                    <article
                      id={period.paid ? undefined : "pending-periods"}
                      className={`${styles.periodCard} ${
                        period.paid ? styles.paidCard : styles.pendingCard
                      }`}
                      key={period.id}
                    >
                      <div className={styles.periodCardHeader}>
                        <div
                          className={`${styles.periodIcon} ${
                            period.paid
                              ? styles.periodIconPaid
                              : styles.periodIconPending
                          }`}
                        >
                          <UiIcon
                            name={period.paid ? "check" : "clock"}
                            size={20}
                          />
                        </div>

                        <span
                          className={`${styles.statusBadge} ${
                            period.paid ? styles.paidBadge : styles.pendingBadge
                          }`}
                        >
                          {period.paid ? "Paid" : "Payment due"}
                        </span>
                      </div>

                      <span className={styles.periodNumber}>
                        Payment period #{period.id}
                      </span>

                      <h3>{period.name}</h3>

                      <div className={styles.dateBox}>
                        <span>Period duration</span>

                        <strong>
                          {formatPeriodRange(period.startTime, period.endTime)}
                        </strong>
                      </div>

                      <div className={styles.feeRow}>
                        <div>
                          <span>Membership fee</span>
                          <strong>{feeValue || "—"}</strong>
                        </div>

                        <span className={styles.ethBadge}>ETH</span>
                      </div>

                      <button
                        type="button"
                        className={
                          period.paid ? styles.paidButton : styles.payButton
                        }
                        disabled={period.paid || loading || isProcessing}
                        onClick={() => payFee(period.id)}
                      >
                        <UiIcon
                          name={period.paid ? "check" : "fee"}
                          size={17}
                        />

                        {period.paid
                          ? "Payment completed"
                          : isProcessing
                            ? "Processing payment..."
                            : `Pay ${feeValue || ""} ETH`}
                      </button>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </main>
      </DashboardLayout>
    </>
  );
}
