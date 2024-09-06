# CouncilHaus: A Decentralized Grant Allocation System [![Coverage Status](https://coveralls.io/repos/github/BlossomLabs/councilhaus/badge.svg?branch=master)](https://coveralls.io/github/BlossomLabs/councilhaus?branch=master)

## What is Council?

Council is an innovative system designed to democratize and streamline the process of allocating grants or funds within an organization. It's like a digital roundtable where designated council members can collaboratively decide how to distribute resources to various projects or individuals (called grantees).

## Key Features

1. **Democratic Decision Making**: Council members are given voting power, allowing them to have a say in how funds are distributed.
2. **Flexible Allocation**: Members can allocate their voting power across multiple grantees, supporting various projects as they see fit.
3. **Transparent Process**: All allocations and decisions are recorded, ensuring a clear and auditable trail of fund distribution.
4. **Managed Access**: The system includes roles for administering members and grantees, maintaining control over who can participate.
5. **Fair Distribution**: Once allocations are decided, the system automatically handles the distribution of funds to grantees.

## How It Works

1. **Council Formation**: Administrators can add council members, assigning them voting power based on their role or expertise.
2. **Grantee Registration**: Potential fund recipients (grantees) are added to the system.
3. **Budget Allocation**: Council members use their voting power to allocate funds to grantees they wish to support.
4. **Automatic Distribution**: Once allocations are set, the system takes care of distributing the funds according to the council's decisions.

## Why Use Council?

Council brings several benefits to organizations looking to manage grant or fund allocation:

- **Decentralized Decision Making**: It moves away from top-down fund allocation, embracing a more collaborative approach.
- **Flexibility**: Council members can easily adjust their allocations, responding to changing needs or priorities.
- **Efficiency**: The automated distribution system reduces administrative overhead.
- **Transparency**: All decisions are recorded, promoting trust and accountability.

Whether you're a non-profit organization, a research institution, or any entity that needs to manage collective fund allocation, Council provides a modern, fair, and efficient solution to empower your team and streamline your grant-giving process.

## How to run

Install bun from https://bun.sh/

Use `bun` to install dependencies and run the project:

```bash
bun install
bun run dev
```

The smart contracts are in the `contracts` directory, and the frontend is in the `apps` directory.