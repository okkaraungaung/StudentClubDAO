import { BrowserProvider, Contract, formatEther, parseEther } from "ethers";

export const CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
  "0x35c17FB4273D17eE4a5efB6925a6B84411C27688";

export const ABI = [
  "event MemberAdded(address indexed member,uint8 role,uint256 joinedPeriod)",
  "event MemberRemoved(address indexed member)",
  "event MemberRoleChanged(address indexed member,uint8 oldRole,uint8 newRole)",
  "event OverdueMemberRemoved(address indexed member,uint256 indexed unpaidPeriod)",
  "event FundsDeposited(address indexed sender,uint256 amount)",
  "event MembershipFeePaid(address indexed member,uint256 indexed periodId,uint256 amount)",
  "event MembershipFeeUpdated(uint256 oldFee,uint256 newFee)",
  "event PaymentPeriodCreated(uint256 indexed periodId,string name,uint256 startTime,uint256 endTime)",
  "event ProfileCreated(address indexed member,string nickname)",
  "event ProposalCreated(uint256 indexed proposalId,string title,uint256 amount,address recipient,address proposer)",
  "event ProposalExecuted(uint256 indexed proposalId,address recipient,uint256 amount)",
  "event VoteSubmitted(uint256 indexed proposalId,address indexed voter,bool approve)",
  "event NicknameChanged(address indexed member,string oldNickname,string newNickname)",
  "function admin() view returns(address)",
  "function memberCount() view returns(uint256)",
  "function membershipFee() view returns(uint256)",
  "function setMembershipFee(uint256)",
  "function paymentPeriodCount() view returns(uint256)",
  "function proposalCount() view returns(uint256)",
  "function getTreasuryBalance() view returns(uint256)",
  "function getMemberAddresses() view returns(address[])",
  "function members(address) view returns(string nickname,uint8 role,bool active,bool profileCreated,uint256 joinedPeriod)",
  "function createProfile(string)",
  "function changeNickname(string)",
  "function isNicknameAvailable(string) view returns(bool)",
  "function createPaymentPeriod(string,uint256,uint256)",
  "function paymentPeriods(uint256) view returns(uint256 id,string name,uint256 startTime,uint256 endTime,bool exists)",
  "function addMember(address,uint8,uint256)",
  "function changeMemberRole(address,uint8)",
  "function removeMember(address)",
  "function removeOverdueMember(address,uint256)",
  "function hasPaid(address,uint256) view returns(bool)",
  "function payMembershipFee(uint256) payable",
  "function depositFunds() payable",
  "function createProposal(string,string,uint256,address,uint256)",
  "function proposals(uint256) view returns(uint256 id,string title,string description,uint256 amount,address recipient,uint256 approveVotes,uint256 rejectVotes,uint256 deadline,bool executed,address proposer)",
  "function hasVoted(uint256,address) view returns(bool)",
  "function vote(uint256,bool)",
  "function executeProposal(uint256)",
  "function getProposalStatus(uint256) view returns(string)",
];

export const err = (e) =>
  e?.reason ||
  e?.shortMessage ||
  e?.info?.error?.message ||
  e?.message ||
  "Transaction failed";

export const shortAddress = (address) =>
  address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "—";

export const formatEth = (value) => `${formatEther(value)} ETH`;

export const parseEth = (value) => parseEther(value);

const DAO_CHAIN_UPDATE_STORAGE_KEY = "student-club-dao:last-chain-update";
export const DAO_CHAIN_UPDATE_EVENT = "student-club-dao:chain-updated";
const DAO_CHAIN_UPDATE_SOURCE =
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `dao-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const notifyDaoChainUpdate = () => {
  if (typeof window === "undefined") {
    return;
  }

  const payload = {
    source: DAO_CHAIN_UPDATE_SOURCE,
    stamp: Date.now(),
  };

  try {
    window.localStorage.setItem(
      DAO_CHAIN_UPDATE_STORAGE_KEY,
      JSON.stringify(payload),
    );
  } catch {
    // Ignore storage errors and still notify the current tab.
  }

  window.dispatchEvent(
    new CustomEvent(DAO_CHAIN_UPDATE_EVENT, { detail: payload }),
  );
};

export const subscribeDaoChainUpdates = (listener) => {
  if (typeof window === "undefined") {
    return () => {};
  }

  const shouldIgnorePayload = (payload) =>
    payload?.source && payload.source === DAO_CHAIN_UPDATE_SOURCE;

  const handleCustomEvent = (event) => {
    const payload = event?.detail;

    if (!shouldIgnorePayload(payload)) {
      listener();
    }
  };

  const handleStorageEvent = (event) => {
    if (event.key !== DAO_CHAIN_UPDATE_STORAGE_KEY || !event.newValue) {
      return;
    }

    try {
      const payload = JSON.parse(event.newValue);

      if (!shouldIgnorePayload(payload)) {
        listener();
      }
    } catch {
      listener();
    }
  };

  window.addEventListener(DAO_CHAIN_UPDATE_EVENT, handleCustomEvent);
  window.addEventListener("storage", handleStorageEvent);

  return () => {
    window.removeEventListener(DAO_CHAIN_UPDATE_EVENT, handleCustomEvent);
    window.removeEventListener("storage", handleStorageEvent);
  };
};

export const formatRelativeTime = (unixSeconds) => {
  const timestamp = Number(unixSeconds);

  if (!Number.isFinite(timestamp) || timestamp <= 0) {
    return "Recently";
  }

  const diffSeconds = Math.max(0, Math.floor(Date.now() / 1000) - timestamp);

  if (diffSeconds < 45) {
    return "Just now";
  }

  if (diffSeconds < 90) {
    return "1m ago";
  }

  if (diffSeconds < 3600) {
    return `${Math.round(diffSeconds / 60)}m ago`;
  }

  if (diffSeconds < 86400) {
    return `${Math.round(diffSeconds / 3600)}h ago`;
  }

  if (diffSeconds < 2592000) {
    return `${Math.round(diffSeconds / 86400)}d ago`;
  }

  if (diffSeconds < 31536000) {
    return `${Math.round(diffSeconds / 2592000)}mo ago`;
  }

  return `${Math.round(diffSeconds / 31536000)}y ago`;
};

export const formatTimeRemaining = (deadlineUnix, nowMs = Date.now()) => {
  const deadline = Number(deadlineUnix);

  if (!Number.isFinite(deadline) || deadline <= 0) {
    return "No deadline";
  }

  const diffMs = deadline * 1000 - nowMs;

  if (diffMs <= 0) {
    return "Ended";
  }

  const totalMinutes = Math.ceil(diffMs / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return hours > 0 ? `${days}d ${hours}h left` : `${days}d left`;
  }

  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m left` : `${hours}h left`;
  }

  return `${minutes}m left`;
};

export const formatPeriodDate = (unixSeconds) =>
  new Date(Number(unixSeconds) * 1000).toLocaleDateString();

export const formatPeriodRange = (startTime, endTime) =>
  `${formatPeriodDate(startTime)} - ${formatPeriodDate(Number(endTime) - 86400)}`;

export const formatDateLabel = (unixSeconds) => {
  const timestamp = Number(unixSeconds);

  if (!Number.isFinite(timestamp) || timestamp <= 0) {
    return "—";
  }

  return new Date(timestamp * 1000).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const initialFrom = (value, fallback = "M") => {
  const trimmed = value?.trim?.();
  return trimmed ? trimmed[0].toUpperCase() : fallback;
};

export const roleName = (role) => {
  switch (Number(role)) {
    case 2:
      return "Executive Member";
    case 1:
      return "Normal Member";
    default:
      return "Not a Member";
  }
};

export const dateToUnixStart = (dateString) =>
  Math.floor(new Date(`${dateString}T00:00:00Z`).getTime() / 1000);

export const dateToUnixEnd = (dateString) =>
  dateToUnixStart(dateString) + 86400;

export async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const field = document.createElement("textarea");
  field.value = text;
  field.setAttribute("readonly", "");
  field.style.position = "fixed";
  field.style.opacity = "0";
  document.body.appendChild(field);
  field.select();
  document.execCommand("copy");
  field.remove();
}

export async function createDaoClient() {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("Install MetaMask first");
  }

  const accounts = await window.ethereum.request({ method: "eth_accounts" });
  if (!accounts?.length) {
    throw new Error("Connect MetaMask first");
  }

  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const account = await signer.getAddress();
  const contract = new Contract(CONTRACT_ADDRESS, ABI, signer);
  const member = await contract.members(account);

  return { provider, signer, contract, account, member };
}

export async function requestDaoClient() {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("Install MetaMask first");
  }

  await window.ethereum.request({ method: "eth_requestAccounts" });
  return createDaoClient();
}

export async function loadPaymentPeriods(contract) {
  const count = await contract.paymentPeriodCount();
  const periods = [];

  for (let i = 1n; i <= count; i += 1n) {
    const period = await contract.paymentPeriods(i);
    const startTime = Number(period.startTime);
    const endTime = Number(period.endTime);

    periods.push({
      id: Number(period.id),
      name: period.name,
      startTime,
      endTime,
      exists: Boolean(period.exists),
      label: period.name ? period.name : `Period #${String(period.id)}`,
      range: formatPeriodRange(startTime, endTime),
    });
  }

  return periods.reverse();
}

const truncateText = (value, maxLength = 42) => {
  const text = String(value || "").trim();

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 1).trimEnd()}…`;
};

const resolveActivityLabel = async (contract, address, cache) => {
  const normalized = String(address || "").toLowerCase();

  if (!normalized) {
    return "Community";
  }

  if (cache.has(normalized)) {
    return cache.get(normalized);
  }

  try {
    const member = await contract.members(address);
    const nickname = String(member?.nickname || "").trim();
    const label =
      member?.profileCreated && nickname ? nickname : shortAddress(address);
    cache.set(normalized, label);
    return label;
  } catch {
    const label = shortAddress(address);
    cache.set(normalized, label);
    return label;
  }
};

const getBlockTimestamp = async (provider, blockNumber, cache) => {
  if (!Number.isFinite(Number(blockNumber)) || Number(blockNumber) <= 0) {
    return 0;
  }

  if (!cache.has(blockNumber)) {
    try {
      const block = await provider.getBlock(blockNumber);
      cache.set(blockNumber, block?.timestamp || 0);
    } catch {
      cache.set(blockNumber, 0);
    }
  }

  return cache.get(blockNumber) || 0;
};

const getLogIndex = (log) => Number(log.logIndex ?? log.index ?? 0);

const queryLogsChunk = async (contract, filter, fromBlock, toBlock) => {
  try {
    return await contract.queryFilter(filter, fromBlock, toBlock);
  } catch (error) {
    if (fromBlock >= toBlock) {
      throw error;
    }

    const midpoint = Math.floor((fromBlock + toBlock) / 2);
    const left = await queryLogsChunk(contract, filter, fromBlock, midpoint);
    const right = await queryLogsChunk(contract, filter, midpoint + 1, toBlock);
    return [...left, ...right];
  }
};

const loadLogsInChunks = async (
  contract,
  filterFactory,
  provider,
  fromBlock = 0,
  chunkSize = 4000,
) => {
  const latestBlock = await provider.getBlockNumber();

  if (!Number.isFinite(latestBlock) || latestBlock < 0) {
    return [];
  }

  const logs = [];
  const startBlock = Math.max(0, Number(fromBlock) || 0);

  for (
    let currentFrom = startBlock;
    currentFrom <= latestBlock;
    currentFrom += chunkSize
  ) {
    const toBlock = Math.min(currentFrom + chunkSize - 1, latestBlock);
    const chunkLogs = await queryLogsChunk(
      contract,
      filterFactory(),
      currentFrom,
      toBlock,
    );
    logs.push(...chunkLogs);
  }

  return logs;
};

export async function loadRecentActivity(contract, provider, limit = 4) {
  const labelCache = new Map();
  const blockCache = new Map();
  const latestBlock = await provider.getBlockNumber().catch(() => 0);
  const startBlock = Math.max(0, Number(latestBlock) - 20000);

  const configs = [
    {
      filter: () => contract.filters.FundsDeposited(),
      icon: "deposit",
      artwork: "activity-blue",
      type: "Treasury",
      build: async (log) => {
        const sender = log.args?.sender ?? log.args?.[0];
        const amount = log.args?.amount ?? log.args?.[1];
        const blockTime = await getBlockTimestamp(
          provider,
          log.blockNumber,
          blockCache,
        );
        const user = await resolveActivityLabel(contract, sender, labelCache);

        return {
          id: `${log.transactionHash}-${getLogIndex(log)}`,
          user,
          text: `added ${formatEth(amount)} to the treasury`,
          time: formatRelativeTime(blockTime),
          icon: "deposit",
          type: "Treasury",
          artwork: "activity-blue",
          blockNumber: Number(log.blockNumber),
          logIndex: getLogIndex(log),
        };
      },
    },
    {
      filter: () => contract.filters.ProposalCreated(),
      icon: "document",
      artwork: "activity-purple",
      type: "Proposal",
      build: async (log) => {
        const proposalId = log.args?.proposalId ?? log.args?.[0];
        const title = truncateText(log.args?.title ?? log.args?.[1] ?? "", 44);
        const proposer = log.args?.proposer ?? log.args?.[4];
        const blockTime = await getBlockTimestamp(
          provider,
          log.blockNumber,
          blockCache,
        );
        const user = await resolveActivityLabel(contract, proposer, labelCache);

        return {
          id: `${log.transactionHash}-${getLogIndex(log)}`,
          user,
          text: title
            ? `published proposal #${String(proposalId)}: "${title}"`
            : `published proposal #${String(proposalId)}`,
          time: formatRelativeTime(blockTime),
          icon: "document",
          type: "Proposal",
          artwork: "activity-purple",
          blockNumber: Number(log.blockNumber),
          logIndex: getLogIndex(log),
        };
      },
    },
    {
      filter: () => contract.filters.VoteSubmitted(),
      icon: "vote",
      artwork: "activity-orange",
      type: "Vote",
      build: async (log) => {
        const proposalId = log.args?.proposalId ?? log.args?.[0];
        const voter = log.args?.voter ?? log.args?.[1];
        const approve = Boolean(log.args?.approve ?? log.args?.[2]);
        const blockTime = await getBlockTimestamp(
          provider,
          log.blockNumber,
          blockCache,
        );
        const user = await resolveActivityLabel(contract, voter, labelCache);

        return {
          id: `${log.transactionHash}-${getLogIndex(log)}`,
          user,
          text: `${approve ? "approved" : "rejected"} proposal #${String(proposalId)}`,
          time: formatRelativeTime(blockTime),
          icon: "vote",
          type: "Vote",
          artwork: "activity-orange",
          blockNumber: Number(log.blockNumber),
          logIndex: getLogIndex(log),
        };
      },
    },
    {
      filter: () => contract.filters.ProposalExecuted(),
      icon: "execute",
      artwork: "activity-green",
      type: "Execution",
      build: async (log) => {
        const proposalId = log.args?.proposalId ?? log.args?.[0];
        const amount = log.args?.amount ?? log.args?.[2];
        const blockTime = await getBlockTimestamp(
          provider,
          log.blockNumber,
          blockCache,
        );

        return {
          id: `${log.transactionHash}-${getLogIndex(log)}`,
          user: "Treasury",
          text: `executed proposal #${String(proposalId)} and sent ${formatEth(amount)}`,
          time: formatRelativeTime(blockTime),
          icon: "execute",
          type: "Execution",
          artwork: "activity-green",
          blockNumber: Number(log.blockNumber),
          logIndex: getLogIndex(log),
        };
      },
    },
    {
      filter: () => contract.filters.MembershipFeePaid(),
      icon: "fee",
      artwork: "activity-blue",
      type: "Fee",
      build: async (log) => {
        const member = log.args?.member ?? log.args?.[0];
        const periodId = log.args?.periodId ?? log.args?.[1];
        const amount = log.args?.amount ?? log.args?.[2];
        const blockTime = await getBlockTimestamp(
          provider,
          log.blockNumber,
          blockCache,
        );
        const user = await resolveActivityLabel(contract, member, labelCache);

        return {
          id: `${log.transactionHash}-${getLogIndex(log)}`,
          user,
          text: `paid ${formatEth(amount)} for period #${String(periodId)}`,
          time: formatRelativeTime(blockTime),
          icon: "fee",
          type: "Fee",
          artwork: "activity-blue",
          blockNumber: Number(log.blockNumber),
          logIndex: getLogIndex(log),
        };
      },
    },
    {
      filter: () => contract.filters.ProfileCreated(),
      icon: "profile",
      artwork: "activity-purple",
      type: "Identity",
      build: async (log) => {
        const member = log.args?.member ?? log.args?.[0];
        const nickname = truncateText(
          log.args?.nickname ?? log.args?.[1] ?? "",
          36,
        );
        const blockTime = await getBlockTimestamp(
          provider,
          log.blockNumber,
          blockCache,
        );
        const user = await resolveActivityLabel(contract, member, labelCache);

        return {
          id: `${log.transactionHash}-${getLogIndex(log)}`,
          user,
          text: nickname
            ? `created profile "${nickname}"`
            : "created a new profile",
          time: formatRelativeTime(blockTime),
          icon: "profile",
          type: "Identity",
          artwork: "activity-purple",
          blockNumber: Number(log.blockNumber),
          logIndex: getLogIndex(log),
        };
      },
    },
    {
      filter: () => contract.filters.NicknameChanged(),
      icon: "edit",
      artwork: "activity-purple",
      type: "Identity",
      build: async (log) => {
        const member = log.args?.member ?? log.args?.[0];
        const newNickname = truncateText(
          log.args?.newNickname ?? log.args?.[2] ?? "",
          36,
        );
        const blockTime = await getBlockTimestamp(
          provider,
          log.blockNumber,
          blockCache,
        );
        const user = await resolveActivityLabel(contract, member, labelCache);

        return {
          id: `${log.transactionHash}-${getLogIndex(log)}`,
          user,
          text: newNickname
            ? `updated nickname to "${newNickname}"`
            : "updated their nickname",
          time: formatRelativeTime(blockTime),
          icon: "edit",
          type: "Identity",
          artwork: "activity-purple",
          blockNumber: Number(log.blockNumber),
          logIndex: getLogIndex(log),
        };
      },
    },
    {
      filter: () => contract.filters.MemberAdded(),
      icon: "members",
      artwork: "activity-green",
      type: "Membership",
      build: async (log) => {
        const member = log.args?.member ?? log.args?.[0];
        const role = Number(log.args?.role ?? log.args?.[1] ?? 0);
        const joinedPeriod = log.args?.joinedPeriod ?? log.args?.[2];
        const blockTime = await getBlockTimestamp(
          provider,
          log.blockNumber,
          blockCache,
        );
        const user = await resolveActivityLabel(contract, member, labelCache);

        return {
          id: `${log.transactionHash}-${getLogIndex(log)}`,
          user,
          text: `joined as ${roleName(role)}${joinedPeriod ? ` in period #${String(joinedPeriod)}` : ""}`,
          time: formatRelativeTime(blockTime),
          icon: "members",
          type: "Membership",
          artwork: "activity-green",
          blockNumber: Number(log.blockNumber),
          logIndex: getLogIndex(log),
        };
      },
    },
    {
      filter: () => contract.filters.MemberRoleChanged(),
      icon: "members",
      artwork: "activity-purple",
      type: "Admin",
      build: async (log) => {
        const member = log.args?.member ?? log.args?.[0];
        const oldRole = Number(log.args?.oldRole ?? log.args?.[1] ?? 0);
        const newRole = Number(log.args?.newRole ?? log.args?.[2] ?? 0);
        const blockTime = await getBlockTimestamp(
          provider,
          log.blockNumber,
          blockCache,
        );
        const user = await resolveActivityLabel(contract, member, labelCache);

        return {
          id: `${log.transactionHash}-${getLogIndex(log)}`,
          user,
          text: `changed role from ${roleName(oldRole)} to ${roleName(newRole)}`,
          time: formatRelativeTime(blockTime),
          icon: "members",
          type: "Admin",
          artwork: "activity-purple",
          blockNumber: Number(log.blockNumber),
          logIndex: getLogIndex(log),
        };
      },
    },
    {
      filter: () => contract.filters.MemberRemoved(),
      icon: "remove",
      artwork: "activity-red",
      type: "Admin",
      build: async (log) => {
        const member = log.args?.member ?? log.args?.[0];
        const blockTime = await getBlockTimestamp(
          provider,
          log.blockNumber,
          blockCache,
        );
        const user = await resolveActivityLabel(contract, member, labelCache);

        return {
          id: `${log.transactionHash}-${getLogIndex(log)}`,
          user,
          text: "was removed from the DAO",
          time: formatRelativeTime(blockTime),
          icon: "remove",
          type: "Admin",
          artwork: "activity-red",
          blockNumber: Number(log.blockNumber),
          logIndex: getLogIndex(log),
        };
      },
    },
    {
      filter: () => contract.filters.OverdueMemberRemoved(),
      icon: "clock",
      artwork: "activity-red",
      type: "Admin",
      build: async (log) => {
        const member = log.args?.member ?? log.args?.[0];
        const unpaidPeriod = log.args?.unpaidPeriod ?? log.args?.[1];
        const blockTime = await getBlockTimestamp(
          provider,
          log.blockNumber,
          blockCache,
        );
        const user = await resolveActivityLabel(contract, member, labelCache);

        return {
          id: `${log.transactionHash}-${getLogIndex(log)}`,
          user,
          text: unpaidPeriod
            ? `was removed for missing period #${String(unpaidPeriod)}`
            : "was removed for an overdue payment",
          time: formatRelativeTime(blockTime),
          icon: "clock",
          type: "Admin",
          artwork: "activity-red",
          blockNumber: Number(log.blockNumber),
          logIndex: getLogIndex(log),
        };
      },
    },
    {
      filter: () => contract.filters.MembershipFeeUpdated(),
      icon: "fee",
      artwork: "activity-blue",
      type: "Treasury",
      build: async (log) => {
        const oldFee = log.args?.oldFee ?? log.args?.[0];
        const newFee = log.args?.newFee ?? log.args?.[1];
        const blockTime = await getBlockTimestamp(
          provider,
          log.blockNumber,
          blockCache,
        );

        return {
          id: `${log.transactionHash}-${getLogIndex(log)}`,
          user: "Admin",
          text: `updated membership fee from ${formatEth(oldFee)} to ${formatEth(newFee)}`,
          time: formatRelativeTime(blockTime),
          icon: "fee",
          type: "Treasury",
          artwork: "activity-blue",
          blockNumber: Number(log.blockNumber),
          logIndex: getLogIndex(log),
        };
      },
    },
    {
      filter: () => contract.filters.PaymentPeriodCreated(),
      icon: "calendar",
      artwork: "activity-blue",
      type: "Admin",
      build: async (log) => {
        const periodId = log.args?.periodId ?? log.args?.[0];
        const name = truncateText(log.args?.name ?? log.args?.[1] ?? "", 36);
        const blockTime = await getBlockTimestamp(
          provider,
          log.blockNumber,
          blockCache,
        );

        return {
          id: `${log.transactionHash}-${getLogIndex(log)}`,
          user: "Admin",
          text: name
            ? `created payment period #${String(periodId)}: "${name}"`
            : `created payment period #${String(periodId)}`,
          time: formatRelativeTime(blockTime),
          icon: "calendar",
          type: "Admin",
          artwork: "activity-blue",
          blockNumber: Number(log.blockNumber),
          logIndex: getLogIndex(log),
        };
      },
    },
  ];

  const batches = await Promise.allSettled(
    configs.map(async (config) => {
      const logs = await loadLogsInChunks(
        contract,
        config.filter,
        provider,
        startBlock,
      );

      const items = await Promise.allSettled(
        logs.map((log) => config.build(log)),
      );

      return items
        .filter((item) => item.status === "fulfilled")
        .map((item) => item.value);
    }),
  );

  return batches
    .flatMap((batch) => (batch.status === "fulfilled" ? batch.value : []))
    .sort((a, b) => {
      if (a.blockNumber !== b.blockNumber) {
        return b.blockNumber - a.blockNumber;
      }

      return b.logIndex - a.logIndex;
    })
    .slice(0, limit);
}

export async function loadMemberDirectory(
  contract,
  provider,
  selectedPeriodId = null,
  cachedPeriods = null,
) {
  const blockCache = new Map();

  const safeRead = async (loader, fallback) => {
    try {
      return await loader();
    } catch {
      return fallback;
    }
  };

  const periods = cachedPeriods
    ? cachedPeriods
    : await safeRead(() => loadPaymentPeriods(contract), []);
  const membershipFee = await safeRead(() => contract.membershipFee(), 0n);
  const onChainMemberCount = await safeRead(() => contract.memberCount(), 0n);

  const selectedPeriodCandidate =
    selectedPeriodId !== null &&
    selectedPeriodId !== undefined &&
    String(selectedPeriodId).trim() !== ""
      ? Number(selectedPeriodId)
      : (periods[0]?.id ?? null);
  const effectiveSelectedPeriodId =
    Number.isFinite(selectedPeriodCandidate) && selectedPeriodCandidate > 0
      ? selectedPeriodCandidate
      : (periods[0]?.id ?? null);

  const periodLookup = new Map(
    periods.map((period) => [Number(period.id), period]),
  );

  const buildMemberEntry = async ({
    address,
    member,
    joinedInfo = null,
    removalInfo = null,
  }) => {
    const nickname = String(member?.nickname || "").trim();
    const active = Boolean(member?.active);
    const role = Number(member?.role ?? 0);
    const joinedPeriodId = Number(member?.joinedPeriod ?? 0);
    const joinedPeriod = periodLookup.get(joinedPeriodId) || null;
    const joinedAt = joinedInfo?.timestamp
      ? formatDateLabel(joinedInfo.timestamp)
      : joinedPeriodId === 0
        ? "Deployment"
        : joinedPeriod
          ? formatDateLabel(joinedPeriod.startTime)
          : "—";
    const joinedPeriodLabel =
      joinedPeriodId === 0
        ? "Genesis"
        : joinedPeriod?.name
          ? `${joinedPeriod.name} · Period #${String(joinedPeriodId)}`
          : `Period #${String(joinedPeriodId)}`;

    let paymentStatus = "Pending";
    let paymentTone = "neutral";
    let paymentDetail = "No payment period selected.";
    let paymentPaid = false;

    if (!active) {
      paymentStatus = "Inactive";
      paymentTone = "neutral";
      paymentDetail = removalInfo?.label || "This member is no longer active.";
    } else if (effectiveSelectedPeriodId === null) {
      paymentStatus = "No period";
      paymentTone = "neutral";
      paymentDetail = "Select a payment period to check status.";
    } else if (
      joinedPeriodId > 0 &&
      effectiveSelectedPeriodId < joinedPeriodId
    ) {
      paymentStatus = "Not required";
      paymentTone = "neutral";
      paymentDetail = `Joined after period #${String(effectiveSelectedPeriodId)}.`;
    } else {
      paymentPaid = await contract
        .hasPaid(address, effectiveSelectedPeriodId)
        .catch(() => false);

      if (paymentPaid) {
        paymentStatus = "Paid";
        paymentTone = "success";
        paymentDetail = `Paid for period #${String(effectiveSelectedPeriodId)}.`;
      } else {
        paymentStatus = "Due";
        paymentTone = "danger";
        paymentDetail = `Outstanding for period #${String(effectiveSelectedPeriodId)}.`;
      }
    }

    return {
      id: address.toLowerCase(),
      address,
      name: nickname || shortAddress(address),
      nickname,
      active,
      role,
      roleLabel: active ? roleName(role) : "Inactive",
      joinedPeriodId,
      joinedPeriodLabel,
      joinedAt,
      paymentPaid,
      paymentStatus,
      paymentTone,
      paymentDetail,
      removalLabel: removalInfo?.label || "",
      removalAt: removalInfo?.timestamp
        ? formatDateLabel(removalInfo.timestamp)
        : "",
      sortRole: role === 2 ? 0 : role === 1 ? 1 : 2,
      sortStatus:
        paymentStatus === "Due"
          ? 0
          : paymentStatus === "Not required"
            ? 1
            : paymentStatus === "Paid"
              ? 2
              : 3,
    };
  };

  const memberIndexResult = await safeRead(
    () => contract.getMemberAddresses(),
    null,
  );
  const useEnumerableMembers =
    Array.isArray(memberIndexResult) && memberIndexResult.length > 0;
  const memberEntries = [];

  if (useEnumerableMembers) {
    for (const rawAddress of memberIndexResult) {
      const address = String(rawAddress || "").trim();

      if (!address) {
        continue;
      }

      const member = await contract.members(address).catch(() => null);

      if (!member) {
        continue;
      }

      memberEntries.push(await buildMemberEntry({ address, member }));
    }
  } else {
    const [memberAddedResult, memberRemovedResult, overdueRemovedResult] =
      await Promise.allSettled([
        loadLogsInChunks(
          contract,
          () => contract.filters.MemberAdded(),
          provider,
        ),
        loadLogsInChunks(
          contract,
          () => contract.filters.MemberRemoved(),
          provider,
        ),
        loadLogsInChunks(
          contract,
          () => contract.filters.OverdueMemberRemoved(),
          provider,
        ),
      ]);

    const memberAddedLogs =
      memberAddedResult.status === "fulfilled" ? memberAddedResult.value : [];
    const memberRemovedLogs =
      memberRemovedResult.status === "fulfilled"
        ? memberRemovedResult.value
        : [];
    const overdueRemovedLogs =
      overdueRemovedResult.status === "fulfilled"
        ? overdueRemovedResult.value
        : [];

    const addressLookup = new Map();
    const joinedLookup = new Map();
    const removalLookup = new Map();

    for (const log of memberAddedLogs) {
      const address = String(log.args?.member ?? log.args?.[0] ?? "").trim();

      if (!address) {
        continue;
      }

      const normalized = address.toLowerCase();
      addressLookup.set(normalized, address);

      if (!joinedLookup.has(normalized)) {
        joinedLookup.set(normalized, {
          timestamp: await getBlockTimestamp(
            provider,
            log.blockNumber,
            blockCache,
          ),
          blockNumber: Number(log.blockNumber),
          logIndex: getLogIndex(log),
        });
      }
    }

    for (const log of memberRemovedLogs) {
      const address = String(log.args?.member ?? log.args?.[0] ?? "").trim();

      if (!address) {
        continue;
      }

      removalLookup.set(address.toLowerCase(), {
        kind: "Removed",
        label: "Removed by admin",
        timestamp: await getBlockTimestamp(
          provider,
          log.blockNumber,
          blockCache,
        ),
      });
    }

    for (const log of overdueRemovedLogs) {
      const address = String(log.args?.member ?? log.args?.[0] ?? "").trim();

      if (!address) {
        continue;
      }

      const unpaidPeriod = Number(log.args?.unpaidPeriod ?? log.args?.[1] ?? 0);

      removalLookup.set(address.toLowerCase(), {
        kind: "Overdue",
        label: unpaidPeriod
          ? `Removed for unpaid period #${String(unpaidPeriod)}`
          : "Removed for missed payment",
        timestamp: await getBlockTimestamp(
          provider,
          log.blockNumber,
          blockCache,
        ),
      });
    }

    for (const [normalizedAddress, address] of addressLookup.entries()) {
      const member = await contract.members(address).catch(() => null);

      if (!member) {
        continue;
      }

      memberEntries.push(
        await buildMemberEntry({
          address,
          member,
          joinedInfo: joinedLookup.get(normalizedAddress) || null,
          removalInfo: removalLookup.get(normalizedAddress) || null,
        }),
      );
    }
  }

  memberEntries.sort((a, b) => {
    if (a.active !== b.active) {
      return a.active ? -1 : 1;
    }

    if (a.sortStatus !== b.sortStatus) {
      return a.sortStatus - b.sortStatus;
    }

    if (a.sortRole !== b.sortRole) {
      return a.sortRole - b.sortRole;
    }

    if (a.joinedPeriodId !== b.joinedPeriodId) {
      return b.joinedPeriodId - a.joinedPeriodId;
    }

    return a.name.localeCompare(b.name);
  });

  const activeMembers = memberEntries.filter((member) => member.active);
  const executiveMembers = activeMembers.filter(
    (member) => Number(member.role) === 2,
  );
  const paidMembers = activeMembers.filter(
    (member) => member.paymentStatus === "Paid",
  );
  const dueMembers = activeMembers.filter(
    (member) => member.paymentStatus === "Due",
  );
  const inactiveMembers = memberEntries.filter((member) => !member.active);
  const currentPeriod = effectiveSelectedPeriodId
    ? periodLookup.get(effectiveSelectedPeriodId) || null
    : null;

  return {
    periods,
    selectedPeriodId: effectiveSelectedPeriodId,
    membershipFee,
    memberCount: Number(onChainMemberCount),
    members: memberEntries,
    stats: {
      activeMembers: Number(onChainMemberCount),
      executiveMembers: executiveMembers.length,
      paidMembers: paidMembers.length,
      dueMembers: dueMembers.length,
      inactiveMembers: inactiveMembers.length,
      currentPeriodLabel: currentPeriod?.name
        ? currentPeriod.name
        : effectiveSelectedPeriodId
          ? `Period #${String(effectiveSelectedPeriodId)}`
          : "No period selected",
      currentPeriodRange: currentPeriod?.range || "No payment periods yet",
    },
  };
}
