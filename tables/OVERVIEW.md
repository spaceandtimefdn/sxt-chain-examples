# Tables on Space and Time

## Overview

Space and Time (SXT Chain) is the first trustless database for the EVM, enabling smart contracts to interact with historical, cross-chain, or offchain data as if it were natively accessible onchain. Space and Time (SXT Chain) is optimized for:

* High-throughput data ingestion from blockchains, consumer apps, and enterprise sources
* Verifiable query execution over large datasets (millions of rows)
* Fast ZK proof generation and EVM-compatible proof verification with minimal gas

## Using Tables

SXT Chain is a permissionless L1 blockchain that acts as a decentralized database and enables developers to define, own, and maintain tamperproof tables using standard SQL DDL. These tables form the foundation of Space and Time’s verifiable data model, allowing structured data to be inserted, queried, and cryptographically proven at scale.

Creating a table on SXT Chain is similar to defining a schema in any relational database, but with added guarantees of verifiability and decentralized consensus. Developers submit to SXT Chain an ECDSA or ED25519-signed Substrate transaction containing CREATE TABLE SQL syntax to define table structure, including column types, and constraints.

Once created, the table is:

    Assigned a unique table ID
    Associated with an initial table owner (the signer of the DDL transaction)
    Registered in the SXT Chain under consensus
    Bound to a cryptographic commitment representing the table’s state (initially empty)

All inserts, updates, and deletions from that point forward are tracked by cryptographic commitments stored onchain, allowing for ZK-proven query execution and verifiable data integrity.

When creating a SXT Chain table, there are several types to choose from depending on the application and access required:

    Public/Permissionless Tables: Any user can submit data (e.g., public content feeds or game leaderboards).
    Community Tables: Only the table owner (or a whitelisted set of public keys) can insert data. Useful for oracle publishers or protocol-owned datasets.

Ownership is defined at table creation via the wallet signature that initiates the DDL transaction.

## Paying for Tables and Inserts

Table creation is paid for using compute credits. Compute credits can be acquired through a few different means, mentioned in other parts of this documentation.

| Action             | Cost              |
|--------------------|-------------------|
| Table Creation     | 20 SXT per Table  |
| Namespace Creation | 20 SXT per Schema |
| Row Inserts        | ~0.02 SXT per row | 

## More Reading

* [PublicPermissionless Tables](./PUBLIC_TABLES.MD)
* [Community Tables](./COMMUNITY_TABLES.MD)

