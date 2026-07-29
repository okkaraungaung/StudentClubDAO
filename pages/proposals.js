import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import StatusMessage from "../components/StatusMessage";
import UiIcon from "../components/UiIcon";
import styles from "../css/proposals.module.css";
import {
  createDaoClient,
  err,
  formatEth,
  parseEth,
  shortAddress,
} from "../lib/dao";

export default function ProposalsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [processingProposal, setProcessingProposal] = useState(null);
  const [status, setStatus] = useState("");
  const [tone, setTone] = useState("success");
  const [navUser, setNavUser] = useState("Member");
  const [profileName, setProfileName] = useState("Member");
  const [showAdmin, setShowAdmin] = useState(false);
  const [showCreateBox, setShowCreateBox] = useState(false);
  const [proposals, setProposals] = useState([]);
  const [filter, setFilter] = useState("All");

  const loadProposals = async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
    }

    try {
      const session = await createDaoClient();

      if (!session.member.profileCreated) {
        await router.replace("/register");
        return;
      }

      const [adminAddress, count] = await Promise.all([
        session.contract.admin(),
        session.contract.proposalCount(),
      ]);

      const items = [];

      for (let i = 1n; i <= count; i += 1n) {
        const proposal = await session.contract.proposals(i);
        const proposalStatus = await session.contract.getProposalStatus(i);
        const voted = await session.contract.hasVoted(i, session.account);

        items.push({
          id: String(proposal.id),
          title: proposal.title,
          description: proposal.description,
          amount: proposal.amount,
          approveVotes: String(proposal.approveVotes),
          rejectVotes: String(proposal.rejectVotes),
          status: proposalStatus,
          voted,
        });
      }

      setProfileName(session.member.nickname || "Member");
      setNavUser(shortAddress(session.account));
      setShowAdmin(
        session.account.toLowerCase() === adminAddress.toLowerCase(),
      );
      setShowCreateBox(Number(session.member.role) === 2);
      setProposals(items.reverse());
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
    void loadProposals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createProposal = async (event) => {
    event.preventDefault();

    try {
      setCreating(true);
      setStatus("");

      const form = event.currentTarget;
      const formData = new FormData(form);

      const title = String(formData.get("title") || "").trim();
      const description = String(formData.get("description") || "").trim();
      const amount = String(formData.get("amount") || "").trim();
      const recipient = String(formData.get("recipient") || "").trim();
      const duration = String(formData.get("duration") || "5").trim();

      if (!title || !description || !amount || !recipient || !duration) {
        throw new Error("Please fill out every proposal field.");
      }

      const session = await createDaoClient();

      const transaction = await session.contract.createProposal(
        title,
        description,
        parseEth(amount),
        recipient,
        duration,
      );

      await transaction.wait();

      setTone("success");
      setStatus("Proposal created successfully.");
      form.reset();

      await loadProposals({ silent: true });
    } catch (error) {
      setTone("error");
      setStatus(err(error));
    } finally {
      setCreating(false);
    }
  };

  const vote = async (proposalId, approve) => {
    try {
      setProcessingProposal(`${proposalId}-vote`);
      setStatus("");

      const session = await createDaoClient();
      const transaction = await session.contract.vote(proposalId, approve);

      await transaction.wait();

      setTone("success");
      setStatus(
        approve
          ? "Approval vote submitted successfully."
          : "Rejection vote submitted successfully.",
      );

      await loadProposals({ silent: true });
    } catch (error) {
      setTone("error");
      setStatus(err(error));
    } finally {
      setProcessingProposal(null);
    }
  };

  const execute = async (proposalId) => {
    try {
      setProcessingProposal(`${proposalId}-execute`);
      setStatus("");

      const session = await createDaoClient();
      const transaction = await session.contract.executeProposal(proposalId);

      await transaction.wait();

      setTone("success");
      setStatus("Proposal executed successfully.");

      await loadProposals({ silent: true });
    } catch (error) {
      setTone("error");
      setStatus(err(error));
    } finally {
      setProcessingProposal(null);
    }
  };

  const activeProposals = proposals.filter(
    (proposal) => proposal.status === "Voting Active",
  ).length;

  const approvedProposals = proposals.filter(
    (proposal) => proposal.status === "Approved",
  ).length;

  const executedProposals = proposals.filter(
    (proposal) => proposal.status === "Executed",
  ).length;

  const totalProposals = proposals.length;

  const filteredProposals = proposals.filter((proposal) => {
    if (filter === "All") {
      return true;
    }

    return proposal.status === filter;
  });

  const getStatusClass = (proposalStatus) => {
    switch (proposalStatus) {
      case "Voting Active":
        return styles.statusActive;
      case "Approved":
        return styles.statusApproved;
      case "Executed":
        return styles.statusExecuted;
      case "Rejected":
        return styles.statusRejected;
      default:
        return styles.statusDefault;
    }
  };

  const getApprovalPercentage = (proposal) => {
    const approve = Number(proposal.approveVotes);
    const reject = Number(proposal.rejectVotes);
    const total = approve + reject;

    if (total === 0) {
      return 0;
    }

    return Math.round((approve / total) * 100);
  };

  return (
    <>
      <Head>
        <title>Proposals | Student Club DAO</title>
        <meta
          name="description"
          content="Explore, vote on, and execute Student Club DAO proposals."
        />
      </Head>

      <DashboardLayout
        title="Proposals"
        navUser={navUser}
        profileName={profileName}
        showAdmin={showAdmin}
        actions={
          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.refreshButton}
              onClick={() => loadProposals()}
              disabled={loading}
            >
              <UiIcon name="activity" size={17} />
              {loading ? "Loading..." : "Refresh"}
            </button>

            {showCreateBox && (
              <a href="#create-proposal" className={styles.createButton}>
                <UiIcon name="document" size={17} />
                Create proposal
              </a>
            )}
          </div>
        }
      >
        <main className={styles.page}>
          <StatusMessage message={status} tone={tone} />

          <section className={styles.pageHeader}>
            <div>
              <span className={styles.pageEyebrow}>DAO Governance</span>

              <h1>Community Proposals</h1>

              <p>
                Review funding requests, vote on active proposals, and execute
                approved community decisions.
              </p>
            </div>

            <div className={styles.pageHeaderStats}>
              <div>
                <strong>{totalProposals}</strong>
                <span>Total</span>
              </div>

              <div>
                <strong>{activeProposals}</strong>
                <span>Active</span>
              </div>

              <div>
                <strong>{approvedProposals}</strong>
                <span>Approved</span>
              </div>
            </div>
          </section>

          <section className={styles.statisticsSection}>
            <div className={styles.sectionHeading}>
              <div>
                <span className={styles.sectionLabel}>Governance overview</span>
                <h2>Proposal activity</h2>
              </div>
            </div>

            <div className={styles.statisticsGrid}>
              <article className={styles.statisticCard}>
                <div className={styles.statisticTop}>
                  <div className={`${styles.statisticIcon} ${styles.blueIcon}`}>
                    <UiIcon name="vote" size={22} />
                  </div>

                  <span className={styles.statisticNumber}>#01</span>
                </div>

                <span className={styles.statisticLabel}>Open voting</span>

                <strong className={styles.statisticValue}>
                  {activeProposals}
                </strong>

                <div className={styles.statisticFooter}>
                  <span>Accepting member votes</span>
                  <strong className={styles.activeText}>Active</strong>
                </div>
              </article>

              <article className={styles.statisticCard}>
                <div className={styles.statisticTop}>
                  <div
                    className={`${styles.statisticIcon} ${styles.purpleIcon}`}
                  >
                    <UiIcon name="execute" size={22} />
                  </div>

                  <span className={styles.statisticNumber}>#02</span>
                </div>

                <span className={styles.statisticLabel}>Ready to execute</span>

                <strong className={styles.statisticValue}>
                  {approvedProposals}
                </strong>

                <div className={styles.statisticFooter}>
                  <span>Approved funding requests</span>
                  <strong>Approved</strong>
                </div>
              </article>

              <article className={styles.statisticCard}>
                <div className={styles.statisticTop}>
                  <div className={`${styles.statisticIcon} ${styles.pinkIcon}`}>
                    <UiIcon name="document" size={22} />
                  </div>

                  <span className={styles.statisticNumber}>#03</span>
                </div>

                <span className={styles.statisticLabel}>Total proposals</span>

                <strong className={styles.statisticValue}>
                  {totalProposals}
                </strong>

                <div className={styles.statisticFooter}>
                  <span>Stored on the blockchain</span>
                  <strong>On-chain</strong>
                </div>
              </article>
            </div>
          </section>

          {showCreateBox && (
            <section id="create-proposal" className={styles.createSection}>
              <div className={styles.createInformation}>
                <span className={styles.sectionLabel}>New funding request</span>

                <h2>Create a proposal</h2>

                <p>
                  Submit a clear proposal for members to review and vote on.
                  Include the requested amount, recipient wallet, and voting
                  duration.
                </p>

                <div className={styles.createSteps}>
                  <div>
                    <span>01</span>
                    <p>Describe the community idea.</p>
                  </div>

                  <div>
                    <span>02</span>
                    <p>Set the requested ETH amount.</p>
                  </div>

                  <div>
                    <span>03</span>
                    <p>Choose the voting duration.</p>
                  </div>
                </div>
              </div>

              <form className={styles.createForm} onSubmit={createProposal}>
                <div className={styles.formHeader}>
                  <div className={`${styles.statisticIcon} ${styles.blueIcon}`}>
                    <UiIcon name="document" size={21} />
                  </div>

                  <div>
                    <span>Proposal details</span>
                    <h3>Funding request</h3>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="title">Proposal title</label>
                  <input
                    id="title"
                    name="title"
                    placeholder="Example: Sponsor coding workshop"
                    required
                    disabled={creating}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    placeholder="Explain the proposal, expected outcome, and community benefit."
                    rows="5"
                    required
                    disabled={creating}
                  />
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="amount">Amount requested</label>

                    <div className={styles.inputSuffix}>
                      <input
                        id="amount"
                        name="amount"
                        type="number"
                        min="0"
                        step="0.0001"
                        placeholder="0.00"
                        required
                        disabled={creating}
                      />
                      <span>ETH</span>
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="duration">Voting duration</label>

                    <div className={styles.inputSuffix}>
                      <input
                        id="duration"
                        name="duration"
                        type="number"
                        min="1"
                        defaultValue="5"
                        required
                        disabled={creating}
                      />
                      <span>MIN</span>
                    </div>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="recipient">Recipient wallet</label>
                  <input
                    id="recipient"
                    name="recipient"
                    placeholder="0x..."
                    required
                    disabled={creating}
                  />
                </div>

                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={creating || loading}
                >
                  {creating ? "Creating proposal..." : "Publish proposal"}
                </button>
              </form>
            </section>
          )}

          <section id="all-proposals" className={styles.proposalsSection}>
            <div className={styles.sectionHeading}>
              <div>
                <span className={styles.sectionLabel}>Explore governance</span>
                <h2>All proposals</h2>
              </div>

              <div className={styles.filters}>
                {[
                  "All",
                  "Voting Active",
                  "Approved",
                  "Executed",
                  "Rejected",
                ].map((filterName) => (
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
                <h3>Loading proposals</h3>
                <p>Reading governance data from the blockchain.</p>
              </div>
            ) : filteredProposals.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <UiIcon name="document" size={30} />
                </div>
                <h3>No proposals found</h3>
                <p>There are no proposals matching this filter.</p>
              </div>
            ) : (
              <div className={styles.proposalGrid}>
                {filteredProposals.map((proposal) => {
                  const canVote =
                    !proposal.voted && proposal.status === "Voting Active";

                  const canExecute = proposal.status === "Approved";

                  const approvalPercentage = getApprovalPercentage(proposal);

                  const isVoting = processingProposal === `${proposal.id}-vote`;

                  const isExecuting =
                    processingProposal === `${proposal.id}-execute`;

                  return (
                    <article className={styles.proposalCard} key={proposal.id}>
                      <div className={styles.proposalArtwork}>
                        <div className={styles.proposalPattern} />

                        <span className={styles.proposalId}>
                          #{proposal.id}
                        </span>

                        <span
                          className={`${styles.statusBadge} ${getStatusClass(
                            proposal.status,
                          )}`}
                        >
                          {proposal.status}
                        </span>

                        <div className={styles.proposalArtworkIcon}>
                          <UiIcon name="document" size={43} />
                        </div>
                      </div>

                      <div className={styles.proposalBody}>
                        <h3>{proposal.title}</h3>

                        <p className={styles.proposalDescription}>
                          {proposal.description}
                        </p>

                        <div className={styles.amountRow}>
                          <div>
                            <span>Requested amount</span>
                            <strong>{formatEth(proposal.amount)}</strong>
                          </div>

                          <div className={styles.ethereumBadge}>ETH</div>
                        </div>

                        <div className={styles.votingSection}>
                          <div className={styles.votingHeader}>
                            <span>Approval progress</span>
                            <strong>{approvalPercentage}%</strong>
                          </div>

                          <div className={styles.progressTrack}>
                            <div
                              className={styles.progressValue}
                              style={{
                                width: `${approvalPercentage}%`,
                              }}
                            />
                          </div>

                          <div className={styles.voteCounts}>
                            <span>
                              <strong>{proposal.approveVotes}</strong> Approve
                            </span>

                            <span>
                              <strong>{proposal.rejectVotes}</strong> Reject
                            </span>
                          </div>
                        </div>

                        <div className={styles.proposalActions}>
                          <button
                            type="button"
                            className={styles.approveButton}
                            disabled={!canVote || isVoting}
                            onClick={() => vote(proposal.id, true)}
                          >
                            <UiIcon name="vote" size={16} />
                            {isVoting ? "Voting..." : "Approve"}
                          </button>

                          <button
                            type="button"
                            className={styles.rejectButton}
                            disabled={!canVote || isVoting}
                            onClick={() => vote(proposal.id, false)}
                          >
                            Reject
                          </button>

                          <button
                            type="button"
                            className={styles.executeButton}
                            disabled={!canExecute || isExecuting}
                            onClick={() => execute(proposal.id)}
                          >
                            <UiIcon name="execute" size={16} />
                            {isExecuting ? "Executing..." : "Execute"}
                          </button>
                        </div>

                        {proposal.voted && (
                          <div className={styles.votedMessage}>
                            ✓ You already voted on this proposal.
                          </div>
                        )}
                      </div>
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
