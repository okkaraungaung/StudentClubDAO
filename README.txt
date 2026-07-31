# Student Club DAO

A decentralized application for managing a student club through blockchain-based governance.

The Student Club DAO allows members to connect their cryptocurrency wallets, manage membership fees, create and vote on proposals, contribute funds to the treasury, and perform administrative tasks through a modern web interface.

## Features

### Member Dashboard

- Connect a cryptocurrency wallet
- View membership information
- View DAO treasury balance
- Update profile nickname
- Deposit ETH into the DAO treasury
- View membership role and current status

### Proposal Management

- View all DAO proposals
- Filter proposals by status
- Create funding proposals
- Approve or reject active proposals
- View proposal voting progress
- Execute approved proposals
- Display requested ETH amount and vote totals

### Membership Fees

- View the current membership fee
- View all payment periods
- Check paid and unpaid periods
- Pay membership fees with ETH
- Track overall payment completion

### Admin Console

Administrators can:

- Create new payment periods
- Add normal or executive members
- Assign a member’s joining period
- Remove overdue members
- View the total number of members
- Review all payment periods

### User Interface

- Responsive desktop, tablet, and mobile design
- NFT marketplace-inspired dashboard
- Clean light interface for proposals, fees, and administration
- Loading indicators and transaction status messages
- Reusable dashboard layout and icon components

## Technology Stack

### Frontend

- Next.js
- React
- JavaScript
- CSS Modules

### Blockchain

- Solidity
- Ethereum
- Ethers.js
- Smart contracts

### Development Tools

- Node.js
- pnpm
- Git
- GitHub
- MetaMask

## Project Structure

```text
StudentClubDAO/
├── components/
│   ├── DashboardLayout.js
│   ├── StatusMessage.js
│   ├── UiIcon.js
│   └── WalletChip.js
│
├── contracts/
│   └── StudentClubDAO.sol
│
├── lib/
│   └── dao.js
│
├── pages/
│   ├── _app.js
│   ├── index.js
│   ├── dashboard.js
│   ├── proposals.js
│   ├── fees.js
│   ├── admin.js
│   └── register.js
│
├── styles/
│   ├── globals.css
│   ├── Dashboard.module.css
│   ├── Proposals.module.css
│   ├── Fees.module.css
│   └── Admin.module.css
│
├── public/
├── package.json
├── pnpm-lock.yaml
└── README.md