import { BrowserProvider, Contract, formatEther, parseEther } from "ethers";

export const CONTRACT_ADDRESS = "0xbAdADa5C2311D16008dFd98C9E7bf9516BF5c043";

export const ABI = [
  "function admin() view returns(address)",
  "function memberCount() view returns(uint256)",
  "function membershipFee() view returns(uint256)",
  "function paymentPeriodCount() view returns(uint256)",
  "function proposalCount() view returns(uint256)",
  "function getTreasuryBalance() view returns(uint256)",
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

export const formatPeriodDate = (unixSeconds) =>
  new Date(Number(unixSeconds) * 1000).toLocaleDateString();

export const formatPeriodRange = (startTime, endTime) =>
  `${formatPeriodDate(startTime)} - ${formatPeriodDate(Number(endTime) - 86400)}`;

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

export const dateToUnixEnd = (dateString) => dateToUnixStart(dateString) + 86400;

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
