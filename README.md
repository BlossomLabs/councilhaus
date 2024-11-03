# CouncilHaus: A Continuous and Participatory Budget Allocation dApp [![Coverage Status](https://coveralls.io/repos/github/BlossomLabs/councilhaus/badge.svg?branch=master&dummy=unused)](https://coveralls.io/github/BlossomLabs/councilhaus?branch=master)


## What is CouncilHaus?

CouncilHaus enables organizations with a set budget to allocate funds continuously among grantees. Council members vote to decide how the budget is distributed dynamically, ensuring efficient use of resources, reducing administrative overhead, and allowing real-time adjustments to meet evolving needs.

![](https://ipfs.blossom.software/ipfs/QmS39MkssLK2Tvv63NK7aYVmyDsDGJCJ2LEtBSr1saisK4)

## Key Features

1. **Participatory Decision Making**: Council members actively decide how funds are distributed, fostering a more inclusive allocation process.
2. **Flexible Allocation**: Members can allocate their voting power across multiple grantees, supporting various projects as they see fit.
3. **Transparent Process**: All allocations and decisions are recorded, providing a clear and auditable trail of fund distribution.
4. **Managed Access**: The system includes roles for administering members and grantees, maintaining control over who can participate.
5. **Automatic Distribution**: Once allocations are decided, the system automatically handles the distribution of funds to grantees.

## How It Works

1. **Council Formation**: Administrators can add council members, assigning them voting power based on their role or expertise.
2. **Grantee Registration**: Potential fund recipients (grantees) are added to the system.
3. **Budget Allocation**: Council members use their voting power to allocate funds to grantees they wish to support.
4. **Automatic Distribution**: Once allocations are set, the system takes care of distributing the funds according to the council's decisions.

## Why Use CouncilHaus?

CouncilHaus brings several benefits to organizations looking to manage grant or fund allocation:

- **Participation**: Encourages active involvement by recognizing and rewarding contributions, creating a more engaged, motivated, and thriving community.
- **Flexibility**: Council members can easily adjust their allocations, responding to changing needs or priorities.
- **Efficiency**: The automated distribution system reduces administrative overhead.
- **Transparency**: All decisions are recorded, promoting trust and accountability.

Whether you're a company, a DAO interested in funding an ecosystem of contributors, a public-goods organization,  or any entity that needs to manage collective fund allocation, CouncilHaus offers a modern, flexible, and efficient solution to empower your team and streamline grant-giving. For instance, Superfluid has used CouncilHaus to reward ecosystem contributors in an ongoing hackathon, with demo days every two weeks.

## How to run

Install bun (a fast JavaScript runtime) from [https://bun.sh/](https://bun.sh/) or just use `npm install -g bun`.

Use `bun` to install dependencies and run the project:

```bash
bun install
bun run dev
```

The development server will be available at http://localhost:3000/.

The smart contracts are in the `contracts` directory, and the frontend is in the `apps` directory.

## How to deploy

### Build Settings

- **Docker Image:**
  `node:lts`

- **Repository:**  
  [https://github.com/BlossomLabs/councilhaus](https://github.com/BlossomLabs/councilhaus)

- **Build Command:**  
  ```bash
  npm install -g bun && HUSKY=0 bun i && bun run --cwd apps/web/ build
  ```

- **Publish Directory:**  
  `apps/web/build`

### Environment Variables

- Use `VITE_WALLETCONNECT_PROJECT_ID` for your wallet connect project ID.
