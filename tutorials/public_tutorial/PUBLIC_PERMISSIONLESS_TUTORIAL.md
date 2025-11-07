# PublicPermissionless Table Tutorial

In this tutorial, we will create a PublicPermissionless table on the Space and Time chain using an ECDSA wallet. The example demonstrates a movie polling system where users can vote on which movie will lead box office earnings each week.

PublicPermissionless tables are open-access tables where anyone can insert data. The system automatically tracks who submitted each row using a META_SUBMITTER column. This makes them suitable for crowdsourced datasets, public feedback, polls, or any scenario requiring open participation with accountability.

The major steps we will walk through are:

1. Funding a wallet with compute credits
2. Cloning this repository
3. Creating a PublicPermissionless table on the Space and Time chain
4. Inserting data into the table
5. Understanding the META_SUBMITTER column

## Step 1: Funding a Wallet

In order to interact with the Space and Time chain, you need compute credits. In this tutorial, we will use the wallet address `0xABC8d709C80262965344f5240Ad123f5cBE51123` and will be funding the wallet with 100 SXT.

You can fund your wallet using one of two methods:

### Option A: Manual Funding

To manually fund your wallet, you can follow the instructions in the [Hello World Tutorial](../../hello_world_tutorial/HELLO_WORLD_TUTORIAL.md)

### Option B: Dreamspace Pay

For a simpler funding experience, see the [How to fund a wallet with Dreamspace Pay](../../how_to/HOW_TO_FUND_A_WALLET_WITH_DSPAY.md) guide.

## Step 2: Clone this Repository

Clone this repository which contains the scripts you will need:

```bash
git clone git@github.com:spaceandtimefdn/sxt-chain-examples.git
cd sxt-chain-examples
```

Install [Node.js](https://nodejs.org/en/download/current) if you have not already.

Install the prerequisite npm packages:

```bash
npm install
```

Navigate to the public_example directory:

```bash
cd tables/public_example
```

## Step 3: Creating a PublicPermissionless Table

We will write a node script that creates a PublicPermissionless table. This script is named `public_create_table.js`.

For this tutorial, we will create a movie polling table called `VOTES` with the following schema:

| `MOVIE` (`VARCHAR`) | `WEEK` (`BIGINT`) | `META_SUBMITTER` (`BINARY`) |
|---------------------|-------------------|-----------------------------|
| Movie A             | 2                 | 0x000...user1address        |
| Movie A             | 2                 | 0x000...user2address        |
| Movie B             | 2                 | 0x000...user3address        |

Note: The META_SUBMITTER column is not included in the CREATE statement. The system automatically adds it to track who submits each row.

The first step is to create a connection with a Space and Time RPC node:

```javascript
const provider = new WsProvider("wss://rpc.mainnet.sxt.network");
const api = await ApiPromise.create({ provider, noInitWarn: true });
```

Next, build a transaction to create a new namespace. The namespace must end with the wallet address (without the `0x` prefix, uppercase). We will use the namespace `MOVIES_ABC8D709C80262965344F5240AD123F5CBE51123`.

```javascript
const createNamespaceTX = api.tx.tables.createNamespace(
  "MOVIES_ABC8D709C80262965344F5240AD123F5CBE51123",
  0,
  "CREATE SCHEMA IF NOT EXISTS MOVIES_ABC8D709C80262965344F5240AD123F5CBE51123",
  "PublicPermissionless",
  { UserCreated: "MoviesPoll" },
);
```

Then, build a transaction for the DDL of the new PublicPermissionless table. Do not include the META_SUBMITTER column in your CREATE statement as it is added automatically.

```javascript
const createTablesTX = api.tx.tables.createTables([
  {
    ident: {
      namespace: "MOVIES_ABC8D709C80262965344F5240AD123F5CBE51123",
      name: "VOTES",
    },
    createStatement:
      "CREATE TABLE IF NOT EXISTS MOVIES_ABC8D709C80262965344F5240AD123F5CBE51123.VOTES (" +
      "MOVIE VARCHAR NOT NULL, " +
      "WEEK BIGINT NOT NULL, " +
      "PRIMARY_KEY(MOVIE, WEEK))",
    tableType: "PublicPermissionless",
    commitment: { Empty: { hyperKzg: true } },
    source: { UserCreated: "MoviesPoll" },
  },
]);
```

Instead of submitting two separate transactions, batch them into a single transaction:

```javascript
const batchTX = api.tx.utility.batchAll([createNamespaceTX, createTablesTX]);
```

To sign the transaction, add the private key of your wallet as an environment variable. Add it to a `.env` file and include `import 'dotenv/config';` in your script. The `.env` file should look like this:

```
PRIVATE_KEY=a234███████████████████████ REDACTED ███████████████████████b567
```

Create a wallet in your script using the `ethers` package and the custom `EthEcdsaSigner`:

```javascript
const wallet = new Wallet(process.env.PRIVATE_KEY);
const signer = new EthEcdsaSigner(wallet, api);
```

Finally, submit the transaction to the Space and Time chain to create the namespace and table:

```javascript
await batchTX.signAndSend(signer.address, { signer });
```

Run the script:

```bash
node public_create_table.js
```

What makes this a PublicPermissionless table:

- The `tableType` is set to `"PublicPermissionless"`
- Anyone can insert data without permissions
- A `META_SUBMITTER BINARY NOT NULL` column is automatically added to track who submitted each row
- You do not include `META_SUBMITTER` in your CREATE statement

## Step 4: Inserting Data

Now that the table exists, anyone can insert data. The corresponding script is named `public_insert_data.js`.

The majority of the script is identical to the one that created the table. The difference is in how we build the transaction.

The data is inserted to the chain as an Apache Arrow table. Build the table as follows. Do not include the META_SUBMITTER column in your data as the chain adds it automatically.

```javascript
const table = new Table({
  MOVIE: vectorFromArray(
    ["Movie A", "Movie B", "Movie C"],
    new Utf8()
  ),
  WEEK: vectorFromArray([2n, 2n, 2n], new Int64())
});
```

Build the transaction that will insert the table. Specify a unique `batchId` for each insertion.

```javascript
const batchId = "MOVIES_ABC8D709C80262965344F5240AD123F5CBE51123.VOTES." + Date.now();
const insertDataTx = api.tx.indexing.submitData(
  {
    namespace: "MOVIES_ABC8D709C80262965344F5240AD123F5CBE51123",
    name: "VOTES",
  },
  batchId,
  u8aToHex(tableToIPC(table)),
);
```

Run the script:

```bash
node public_insert_data.js
```

You have now created a PublicPermissionless table and inserted data. Anyone with a funded wallet can now insert data into this table.

## Step 5: Understanding META_SUBMITTER

The META_SUBMITTER column is the key feature that distinguishes PublicPermissionless tables. It provides automatic data provenance tracking.

### What is META_SUBMITTER

- Type: `BINARY NOT NULL` (32 bytes)
- Content: The AccountId of whoever submitted each row
- Format:
  - Ethereum addresses: 12 zero bytes + 20-byte Ethereum address
  - Substrate addresses: Full 32-byte public key
- Automatic: You never include it in CREATE statements or INSERT data as the chain adds it

### Example: Your Address in META_SUBMITTER

If your Ethereum address is `0xABC8d709C80262965344f5240Ad123f5cBE51123`, your META_SUBMITTER value will be:

```
0x000000000000000000000000ABC8D709C80262965344F5240AD123F5CBE51123
```

This is 12 zero bytes padding plus your 20-byte address.

### Querying by Submitter

When querying the table with Proof of SQL, you can filter by META_SUBMITTER:

```sql
-- Find all votes from a specific submitter
SELECT * FROM MOVIES_ABC8D709C80262965344F5240AD123F5CBE51123.VOTES
WHERE META_SUBMITTER = 0x000000000000000000000000ABC8D709C80262965344F5240AD123F5CBE51123;

-- Count votes by each user
SELECT META_SUBMITTER, COUNT(*) as vote_count
FROM MOVIES_ABC8D709C80262965344F5240AD123F5CBE51123.VOTES
GROUP BY META_SUBMITTER;

-- Find most popular movie each week
SELECT WEEK, MOVIE, COUNT(*) as votes
FROM MOVIES_ABC8D709C80262965344F5240AD123F5CBE51123.VOTES
GROUP BY WEEK, MOVIE
ORDER BY WEEK, votes DESC;
```

### Use Cases for META_SUBMITTER

- Data provenance: Track who contributed each piece of data
- Reputation systems: Build contributor scores based on submission quality
- Spam filtering: Identify and filter submissions from problematic addresses
- Contribution tracking: Reward active contributors
- Data quality: Implement per-submitter quality metrics

## PublicPermissionless vs Community Tables

PublicPermissionless tables are best when you need open access with tracking:

- Crowdsourced datasets
- Public feedback collection
- Open bug reports
- Community contributions
- Surveys and polls
- Any scenario where tracking submitters matters

For controlled-access tables where only specific users can insert, see the Community Table documentation.

## Next Steps

- Learn about Community tables for controlled-access data
- Query your data using Proof of SQL
- Build reputation systems using META_SUBMITTER tracking
- Explore other table types and features on Space and Time
