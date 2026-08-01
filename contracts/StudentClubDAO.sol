// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract StudentClubDAO {
    enum MemberRole { None, Normal, Executive }

    struct Member {
        string nickname;
        MemberRole role;
        bool active;
        bool profileCreated;
        uint256 joinedPeriod;
    }

    struct PaymentPeriod {
        uint256 id;
        string name;
        uint256 startTime;
        uint256 endTime;
        bool exists;
    }

    struct Proposal {
        uint256 id;
        string title;
        string description;
        uint256 amount;
        address payable recipient;
        uint256 approveVotes;
        uint256 rejectVotes;
        uint256 deadline;
        bool executed;
        address proposer;
    }

    address public admin;
    uint256 public memberCount;
    uint256 public paymentPeriodCount;
    uint256 public proposalCount;
    uint256 public membershipFee = 0.001 ether;

    mapping(address => Member) public members;
    address[] private memberAddresses;
    mapping(address => bool) private memberListed;
    mapping(bytes32 => bool) private nicknameTaken;
    mapping(uint256 => PaymentPeriod) public paymentPeriods;
    mapping(address => mapping(uint256 => bool)) public hasPaid;
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    bool private locked;

    event MemberAdded(address indexed member, MemberRole role, uint256 joinedPeriod);
    event MemberRemoved(address indexed member);
    event MemberRoleChanged(address indexed member, MemberRole oldRole, MemberRole newRole);
    event OverdueMemberRemoved(address indexed member, uint256 indexed unpaidPeriod);
    event ProfileCreated(address indexed member, string nickname);
    event NicknameChanged(address indexed member, string oldNickname, string newNickname);
    event PaymentPeriodCreated(uint256 indexed periodId, string name, uint256 startTime, uint256 endTime);
    event MembershipFeePaid(address indexed member, uint256 indexed periodId, uint256 amount);
    event MembershipFeeUpdated(uint256 oldFee, uint256 newFee);
    event FundsDeposited(address indexed sender, uint256 amount);
    event ProposalCreated(uint256 indexed proposalId, string title, uint256 amount, address recipient, address proposer);
    event VoteSubmitted(uint256 indexed proposalId, address indexed voter, bool approve);
    event ProposalExecuted(uint256 indexed proposalId, address recipient, uint256 amount);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }

    modifier onlyActiveMember() {
        require(members[msg.sender].role != MemberRole.None, "Not a member");
        require(members[msg.sender].active, "Member inactive");
        _;
    }

    modifier onlyActiveExecutive() {
        require(members[msg.sender].role == MemberRole.Executive, "Only executives");
        require(members[msg.sender].active, "Member inactive");
        _;
    }

    modifier nonReentrant() {
        require(!locked, "Reentrant call");
        locked = true;
        _;
        locked = false;
    }

    constructor() {
        admin = msg.sender;
        members[msg.sender] = Member("", MemberRole.Executive, true, false, 0);
        _trackMemberAddress(msg.sender);
        memberCount = 1;
        emit MemberAdded(msg.sender, MemberRole.Executive, 0);
    }

    receive() external payable {
        require(msg.value > 0, "Amount required");
        emit FundsDeposited(msg.sender, msg.value);
    }

    function depositFunds() external payable {
        require(msg.value > 0, "Amount required");
        emit FundsDeposited(msg.sender, msg.value);
    }

    function createProfile(string calldata nickname) external onlyActiveMember {
        Member storage member = members[msg.sender];
        require(!member.profileCreated, "Profile exists");
        _validateNickname(nickname);
        bytes32 hash = _nicknameHash(nickname);
        require(!nicknameTaken[hash], "Nickname taken");
        member.nickname = nickname;
        member.profileCreated = true;
        nicknameTaken[hash] = true;
        emit ProfileCreated(msg.sender, nickname);
    }

    function changeNickname(string calldata nickname) external onlyActiveMember {
        Member storage member = members[msg.sender];
        require(member.profileCreated, "Create profile first");
        _validateNickname(nickname);
        bytes32 newHash = _nicknameHash(nickname);
        require(!nicknameTaken[newHash], "Nickname taken");
        string memory oldNickname = member.nickname;
        nicknameTaken[_nicknameHash(oldNickname)] = false;
        nicknameTaken[newHash] = true;
        member.nickname = nickname;
        emit NicknameChanged(msg.sender, oldNickname, nickname);
    }

    function isNicknameAvailable(string calldata nickname) external view returns (bool) {
        uint256 length = bytes(nickname).length;
        return length >= 3 && length <= 20 && !nicknameTaken[_nicknameHash(nickname)];
    }

    function createPaymentPeriod(string calldata name, uint256 startTime, uint256 endTime) external onlyAdmin {
        require(bytes(name).length > 0, "Name required");
        require(endTime > startTime, "Invalid dates");
        if (paymentPeriodCount > 0) {
            require(startTime >= paymentPeriods[paymentPeriodCount].endTime, "Period overlaps");
        }
        paymentPeriodCount++;
        paymentPeriods[paymentPeriodCount] = PaymentPeriod(paymentPeriodCount, name, startTime, endTime, true);
        emit PaymentPeriodCreated(paymentPeriodCount, name, startTime, endTime);
    }

    function addMember(address memberAddress, MemberRole role, uint256 joinedPeriod) external onlyAdmin {
        require(memberAddress != address(0), "Invalid address");
        require(role == MemberRole.Normal || role == MemberRole.Executive, "Invalid role");
        require(members[memberAddress].role == MemberRole.None, "Already member");
        require(paymentPeriods[joinedPeriod].exists, "Invalid period");
        members[memberAddress] = Member("", role, true, false, joinedPeriod);
        _trackMemberAddress(memberAddress);
        memberCount++;
        emit MemberAdded(memberAddress, role, joinedPeriod);
    }

    function changeMemberRole(address memberAddress, MemberRole newRole) external onlyAdmin {
        Member storage member = members[memberAddress];
        require(member.active && member.role != MemberRole.None, "Not active member");
        require(newRole == MemberRole.Normal || newRole == MemberRole.Executive, "Invalid role");
        MemberRole oldRole = member.role;
        member.role = newRole;
        emit MemberRoleChanged(memberAddress, oldRole, newRole);
    }

    function removeMember(address memberAddress) external onlyAdmin {
        require(memberAddress != admin, "Cannot remove admin");
        _remove(memberAddress);
        emit MemberRemoved(memberAddress);
    }

    function removeOverdueMember(address memberAddress, uint256 periodId) external onlyAdmin {
        Member storage member = members[memberAddress];
        PaymentPeriod storage period = paymentPeriods[periodId];
        require(memberAddress != admin, "Cannot remove admin");
        require(member.active && member.role != MemberRole.None, "Not active member");
        require(period.exists, "Period missing");
        require(periodId >= member.joinedPeriod, "Not required to pay");
        require(block.timestamp >= period.endTime, "Period not ended");
        require(!hasPaid[memberAddress][periodId], "Already paid");
        _remove(memberAddress);
        emit OverdueMemberRemoved(memberAddress, periodId);
    }

    function setMembershipFee(uint256 newFee) external onlyAdmin {
        require(newFee > 0, "Fee required");
        uint256 oldFee = membershipFee;
        membershipFee = newFee;
        emit MembershipFeeUpdated(oldFee, newFee);
    }

    function payMembershipFee(uint256 periodId) external payable onlyActiveMember {
        Member storage member = members[msg.sender];
        PaymentPeriod storage period = paymentPeriods[periodId];
        require(period.exists, "Period missing");
        require(periodId >= member.joinedPeriod, "Before joining");
        require(block.timestamp >= period.startTime, "Payment not open");
        require(block.timestamp < period.endTime, "Payment closed");
        require(!hasPaid[msg.sender][periodId], "Already paid");
        require(msg.value == membershipFee, "Wrong fee");
        hasPaid[msg.sender][periodId] = true;
        emit MembershipFeePaid(msg.sender, periodId, msg.value);
    }

    function createProposal(
        string calldata title,
        string calldata description,
        uint256 amount,
        address payable recipient,
        uint256 durationMinutes
    ) external onlyActiveExecutive {
        require(bytes(title).length > 0 && bytes(description).length > 0, "Text required");
        require(amount > 0, "Amount required");
        require(recipient != address(0), "Invalid recipient");
        require(durationMinutes > 0, "Invalid duration");
        proposalCount++;
        proposals[proposalCount] = Proposal(
            proposalCount,
            title,
            description,
            amount,
            recipient,
            0,
            0,
            block.timestamp + durationMinutes * 1 minutes,
            false,
            msg.sender
        );
        emit ProposalCreated(proposalCount, title, amount, recipient, msg.sender);
    }

    function vote(uint256 proposalId, bool approve) external onlyActiveMember {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.id != 0, "Proposal missing");
        require(block.timestamp < proposal.deadline, "Voting ended");
        require(!proposal.executed, "Already executed");
        require(!hasVoted[proposalId][msg.sender], "Already voted");
        hasVoted[proposalId][msg.sender] = true;
        if (approve) proposal.approveVotes++;
        else proposal.rejectVotes++;
        emit VoteSubmitted(proposalId, msg.sender, approve);
    }

    function executeProposal(uint256 proposalId) external onlyActiveExecutive nonReentrant {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.id != 0, "Proposal missing");
        require(block.timestamp >= proposal.deadline, "Voting active");
        require(!proposal.executed, "Already executed");
        require(proposal.approveVotes > proposal.rejectVotes, "Not approved");
        require(address(this).balance >= proposal.amount, "Insufficient funds");
        proposal.executed = true;
        (bool success, ) = proposal.recipient.call{value: proposal.amount}("");
        require(success, "Transfer failed");
        emit ProposalExecuted(proposalId, proposal.recipient, proposal.amount);
    }

    function getTreasuryBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function getMemberAddresses() external view returns (address[] memory) {
        return memberAddresses;
    }

    function getProposalStatus(uint256 proposalId) external view returns (string memory) {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.id != 0, "Proposal missing");
        if (proposal.executed) return "Executed";
        if (block.timestamp < proposal.deadline) return "Voting Active";
        if (proposal.approveVotes > proposal.rejectVotes) return "Approved";
        return "Rejected";
    }

    function _remove(address memberAddress) private {
        Member storage member = members[memberAddress];
        require(member.active && member.role != MemberRole.None, "Not active member");
        if (member.profileCreated) nicknameTaken[_nicknameHash(member.nickname)] = false;
        member.nickname = "";
        member.role = MemberRole.None;
        member.active = false;
        member.profileCreated = false;
        memberCount--;
    }

    function _trackMemberAddress(address memberAddress) private {
        if (memberListed[memberAddress]) {
            return;
        }

        memberListed[memberAddress] = true;
        memberAddresses.push(memberAddress);
    }

    function _validateNickname(string calldata nickname) private pure {
        uint256 length = bytes(nickname).length;
        require(length >= 3, "Nickname too short");
        require(length <= 20, "Nickname too long");
    }

    function _nicknameHash(string memory nickname) private pure returns (bytes32) {
        return keccak256(abi.encodePacked(nickname));
    }
}
