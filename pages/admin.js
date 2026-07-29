import Head from "next/head";
import { useEffect, useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import StatusMessage from "../components/StatusMessage";
import UiIcon from "../components/UiIcon";
import {
  createDaoClient,
  dateToUnixEnd,
  dateToUnixStart,
  err,
  formatPeriodRange,
  shortAddress,
} from "../lib/dao";
import styles from "../css/admin.module.css";

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [processingAction, setProcessingAction] = useState("");
  const [status, setStatus] = useState("");
  const [tone, setTone] = useState("success");
  const [navUser, setNavUser] = useState("Member");
  const [profileName, setProfileName] = useState("Member");
  const [showAdmin, setShowAdmin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [periods, setPeriods] = useState([]);
  const [memberCount, setMemberCount] = useState(0);

  const loadPeriods = async (contract) => {
    const count = await contract.paymentPeriodCount();
    const items = [];

    for (let i = 1n; i <= count; i += 1n) {
      const period = await contract.paymentPeriods(i);

      items.push({
        id: String(period.id),
        name: period.name,
        startTime: period.startTime,
        endTime: period.endTime,
      });
    }

    return items.reverse();
  };

  const loadAdmin = async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
    }

    try {
      const session = await createDaoClient();
      const adminAddress = await session.contract.admin();

      if (session.account.toLowerCase() !== adminAddress.toLowerCase()) {
        throw new Error("Admin access only.");
      }

      const [items, totalMembers] = await Promise.all([
        loadPeriods(session.contract),
        session.contract.memberCount(),
      ]);

      setProfileName(session.member.nickname || "Admin");
      setNavUser(shortAddress(session.account));
      setShowAdmin(true);
      setIsAdmin(true);
      setPeriods(items);
      setMemberCount(Number(totalMembers));
    } catch (error) {
      setTone("error");
      setStatus(err(error));
      setIsAdmin(false);
      setShowAdmin(false);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    void loadAdmin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshAdminData = async () => {
    try {
      setLoading(true);
      setStatus("");
      await loadAdmin({ silent: true });
    } finally {
      setLoading(false);
    }
  };

  const createPeriod = async (event) => {
    event.preventDefault();

    try {
      setProcessingAction("create-period");
      setStatus("");

      const form = event.currentTarget;
      const formData = new FormData(form);
      const periodName = String(formData.get("periodName") || "").trim();
      const startDate = String(formData.get("startDate") || "").trim();
      const endDate = String(formData.get("endDate") || "").trim();

      if (!periodName || !startDate || !endDate) {
        throw new Error("Please complete every payment period field.");
      }

      if (new Date(startDate) > new Date(endDate)) {
        throw new Error("The end date must be after the start date.");
      }

      const session = await createDaoClient();

      const transaction = await session.contract.createPaymentPeriod(
        periodName,
        dateToUnixStart(startDate),
        dateToUnixEnd(endDate),
      );

      await transaction.wait();

      setTone("success");
      setStatus("Payment period created successfully.");
      form.reset();

      await loadAdmin({ silent: true });
    } catch (error) {
      setTone("error");
      setStatus(err(error));
    } finally {
      setProcessingAction("");
    }
  };

  const addMember = async (event) => {
    event.preventDefault();

    try {
      setProcessingAction("add-member");
      setStatus("");

      const form = event.currentTarget;
      const formData = new FormData(form);

      const memberAddress = String(formData.get("memberAddress") || "").trim();

      const memberRole = String(formData.get("memberRole") || "1").trim();

      const joinedPeriod = String(formData.get("joinedPeriod") || "").trim();

      if (!memberAddress || !memberRole || !joinedPeriod) {
        throw new Error("Please complete every member field.");
      }

      const session = await createDaoClient();

      const transaction = await session.contract.addMember(
        memberAddress,
        memberRole,
        joinedPeriod,
      );

      await transaction.wait();

      setTone("success");
      setStatus("Member added successfully.");
      form.reset();

      await loadAdmin({ silent: true });
    } catch (error) {
      setTone("error");
      setStatus(err(error));
    } finally {
      setProcessingAction("");
    }
  };

  const removeOverdue = async (event) => {
    event.preventDefault();

    try {
      setProcessingAction("remove-member");
      setStatus("");

      const form = event.currentTarget;
      const formData = new FormData(form);

      const overdueAddress = String(
        formData.get("overdueAddress") || "",
      ).trim();

      const overduePeriod = String(formData.get("overduePeriod") || "").trim();

      if (!overdueAddress || !overduePeriod) {
        throw new Error("Please complete every overdue member field.");
      }

      const session = await createDaoClient();

      const transaction = await session.contract.removeOverdueMember(
        overdueAddress,
        overduePeriod,
      );

      await transaction.wait();

      setTone("success");
      setStatus("Overdue member removed successfully.");
      form.reset();

      await loadAdmin({ silent: true });
    } catch (error) {
      setTone("error");
      setStatus(err(error));
    } finally {
      setProcessingAction("");
    }
  };

  const periodCount = periods.length;

  return (
    <>
      <Head>
        <title>Admin Console | Student Club DAO</title>

        <meta
          name="description"
          content="Manage Student Club DAO members and payment periods."
        />
      </Head>

      <DashboardLayout
        title="Admin Console"
        navUser={navUser}
        profileName={profileName}
        showAdmin={showAdmin}
        actions={
          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.refreshButton}
              onClick={refreshAdminData}
              disabled={loading}
            >
              <UiIcon name="activity" size={17} />
              {loading ? "Loading..." : "Refresh"}
            </button>

            <a href="#admin-tools" className={styles.manageButton}>
              <UiIcon name="gear" size={17} />
              Admin tools
            </a>
          </div>
        }
      >
        <main className={styles.page}>
          <StatusMessage message={status} tone={tone} />

          <section className={styles.pageHeader}>
            <div className={styles.headerContent}>
              <span className={styles.eyebrow}>Administration workspace</span>

              <h1>Manage your DAO with confidence</h1>

              <p>
                Create payment periods, onboard new members, and manage overdue
                accounts from one secure administrative workspace.
              </p>

              <div className={styles.headerButtons}>
                <a href="#admin-tools" className={styles.primaryButton}>
                  Open admin tools
                </a>

                <a href="#period-list" className={styles.secondaryButton}>
                  Review payment periods
                </a>
              </div>
            </div>

            <div className={styles.adminSummary}>
              <div className={styles.summaryTop}>
                <div className={styles.summaryIcon}>
                  <UiIcon name="gear" size={27} />
                </div>

                <span className={styles.adminBadge}>Admin access</span>
              </div>

              <span className={styles.summaryLabel}>Administration status</span>

              <strong className={styles.summaryTitle}>
                {isAdmin ? "Authorized" : "Checking access"}
              </strong>

              <p>
                You can manage payment periods and member accounts through the
                connected smart contract.
              </p>

              <div className={styles.summaryDetails}>
                <div>
                  <span>Members</span>
                  <strong>{memberCount}</strong>
                </div>

                <div>
                  <span>Periods</span>
                  <strong>{periodCount}</strong>
                </div>

                <div>
                  <span>Tools</span>
                  <strong>3</strong>
                </div>
              </div>
            </div>
          </section>

          <section className={styles.overviewSection}>
            <div className={styles.sectionHeading}>
              <div>
                <span className={styles.sectionLabel}>DAO overview</span>

                <h2>Administration summary</h2>
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

                <span className={styles.statisticLabel}>DAO members</span>

                <strong className={styles.statisticValue}>{memberCount}</strong>

                <div className={styles.statisticFooter}>
                  <span>Registered on-chain</span>
                  <strong className={styles.activeText}>Active</strong>
                </div>
              </article>

              <article className={styles.statisticCard}>
                <div className={styles.statisticTop}>
                  <div
                    className={`${styles.statisticIcon} ${styles.greenIcon}`}
                  >
                    <UiIcon name="calendar" size={22} />
                  </div>

                  <span className={styles.statisticNumber}>#02</span>
                </div>

                <span className={styles.statisticLabel}>Payment periods</span>

                <strong className={styles.statisticValue}>{periodCount}</strong>

                <div className={styles.statisticFooter}>
                  <span>Configured periods</span>
                  <strong>On-chain</strong>
                </div>
              </article>

              <article className={styles.statisticCard}>
                <div className={styles.statisticTop}>
                  <div
                    className={`${styles.statisticIcon} ${styles.amberIcon}`}
                  >
                    <UiIcon name="gear" size={22} />
                  </div>

                  <span className={styles.statisticNumber}>#03</span>
                </div>

                <span className={styles.statisticLabel}>Management tools</span>

                <strong className={styles.statisticValue}>3</strong>

                <div className={styles.statisticFooter}>
                  <span>Create, add, and remove</span>
                  <strong>Available</strong>
                </div>
              </article>
            </div>
          </section>

          {loading ? (
            <section className={styles.emptyState}>
              <div className={styles.loader} />
              <h3>Loading admin console</h3>
              <p>Verifying administrator access and reading contract data.</p>
            </section>
          ) : !isAdmin ? (
            <section className={styles.accessDenied}>
              <div className={styles.deniedIcon}>
                <UiIcon name="gear" size={30} />
              </div>

              <h2>Administrator access required</h2>

              <p>
                The connected wallet does not have permission to use the DAO
                administration tools.
              </p>
            </section>
          ) : (
            <section id="admin-tools" className={styles.adminWorkspace}>
              <div className={styles.toolsColumn}>
                <article className={styles.toolCard}>
                  <div className={styles.toolHeader}>
                    <div className={`${styles.toolIcon} ${styles.blueIcon}`}>
                      <UiIcon name="calendar" size={21} />
                    </div>

                    <div>
                      <span>Payment management</span>
                      <h2>Create payment period</h2>
                    </div>
                  </div>

                  <p className={styles.toolDescription}>
                    Create a new membership payment period with a clear start
                    date and deadline.
                  </p>

                  <form className={styles.form} onSubmit={createPeriod}>
                    <div className={styles.formGroup}>
                      <label htmlFor="periodName">Period name</label>

                      <input
                        id="periodName"
                        name="periodName"
                        placeholder="Example: August 2026"
                        required
                        disabled={processingAction === "create-period"}
                      />
                    </div>

                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label htmlFor="startDate">Start date</label>

                        <input
                          id="startDate"
                          name="startDate"
                          type="date"
                          required
                          disabled={processingAction === "create-period"}
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label htmlFor="endDate">End date</label>

                        <input
                          id="endDate"
                          name="endDate"
                          type="date"
                          required
                          disabled={processingAction === "create-period"}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className={styles.primarySubmitButton}
                      disabled={loading || processingAction === "create-period"}
                    >
                      <UiIcon name="calendar" size={17} />

                      {processingAction === "create-period"
                        ? "Creating period..."
                        : "Create payment period"}
                    </button>
                  </form>
                </article>

                <article className={styles.toolCard}>
                  <div className={styles.toolHeader}>
                    <div className={`${styles.toolIcon} ${styles.greenIcon}`}>
                      <UiIcon name="members" size={21} />
                    </div>

                    <div>
                      <span>Member onboarding</span>
                      <h2>Add DAO member</h2>
                    </div>
                  </div>

                  <p className={styles.toolDescription}>
                    Add a wallet as a normal member or executive and assign its
                    starting payment period.
                  </p>

                  <form className={styles.form} onSubmit={addMember}>
                    <div className={styles.formGroup}>
                      <label htmlFor="memberAddress">Wallet address</label>

                      <input
                        id="memberAddress"
                        name="memberAddress"
                        placeholder="0x..."
                        required
                        disabled={processingAction === "add-member"}
                      />
                    </div>

                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label htmlFor="memberRole">Member role</label>

                        <select
                          id="memberRole"
                          name="memberRole"
                          defaultValue="1"
                          disabled={processingAction === "add-member"}
                        >
                          <option value="1">Normal member</option>

                          <option value="2">Executive member</option>
                        </select>
                      </div>

                      <div className={styles.formGroup}>
                        <label htmlFor="joinedPeriod">Joined period</label>

                        <input
                          id="joinedPeriod"
                          name="joinedPeriod"
                          type="number"
                          min="1"
                          placeholder="Period ID"
                          required
                          disabled={processingAction === "add-member"}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className={styles.successSubmitButton}
                      disabled={loading || processingAction === "add-member"}
                    >
                      <UiIcon name="members" size={17} />

                      {processingAction === "add-member"
                        ? "Adding member..."
                        : "Add DAO member"}
                    </button>
                  </form>
                </article>
              </div>

              <div className={styles.sideColumn}>
                <article className={styles.dangerCard}>
                  <div className={styles.toolHeader}>
                    <div className={`${styles.toolIcon} ${styles.redIcon}`}>
                      <UiIcon name="clock" size={21} />
                    </div>

                    <div>
                      <span>Membership enforcement</span>
                      <h2>Remove overdue member</h2>
                    </div>
                  </div>

                  <p className={styles.toolDescription}>
                    Remove a member only after confirming the wallet failed to
                    pay the selected period.
                  </p>

                  <div className={styles.warningBox}>
                    <strong>Important</strong>

                    <p>
                      This action changes the member status on-chain and should
                      be used carefully.
                    </p>
                  </div>

                  <form className={styles.form} onSubmit={removeOverdue}>
                    <div className={styles.formGroup}>
                      <label htmlFor="overdueAddress">Member wallet</label>

                      <input
                        id="overdueAddress"
                        name="overdueAddress"
                        placeholder="0x..."
                        required
                        disabled={processingAction === "remove-member"}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="overduePeriod">Unpaid period ID</label>

                      <input
                        id="overduePeriod"
                        name="overduePeriod"
                        type="number"
                        min="1"
                        placeholder="Enter period ID"
                        required
                        disabled={processingAction === "remove-member"}
                      />
                    </div>

                    <button
                      type="submit"
                      className={styles.dangerSubmitButton}
                      disabled={loading || processingAction === "remove-member"}
                    >
                      {processingAction === "remove-member"
                        ? "Removing member..."
                        : "Remove overdue member"}
                    </button>
                  </form>
                </article>

                <article id="period-list" className={styles.periodListCard}>
                  <div className={styles.periodListHeader}>
                    <div>
                      <span className={styles.sectionLabel}>
                        Contract records
                      </span>

                      <h2>Payment periods</h2>
                    </div>

                    <span className={styles.periodCount}>{periodCount}</span>
                  </div>

                  {periods.length === 0 ? (
                    <div className={styles.noPeriods}>
                      <UiIcon name="calendar" size={24} />
                      <p>No payment periods have been created.</p>
                    </div>
                  ) : (
                    <div className={styles.periodList}>
                      {periods.map((period) => (
                        <article className={styles.periodItem} key={period.id}>
                          <div className={styles.periodNumber}>{period.id}</div>

                          <div className={styles.periodInformation}>
                            <strong>{period.name}</strong>

                            <span>
                              {formatPeriodRange(
                                period.startTime,
                                period.endTime,
                              )}
                            </span>
                          </div>

                          <span className={styles.periodStatus}>Active</span>
                        </article>
                      ))}
                    </div>
                  )}
                </article>
              </div>
            </section>
          )}
        </main>
      </DashboardLayout>
    </>
  );
}
