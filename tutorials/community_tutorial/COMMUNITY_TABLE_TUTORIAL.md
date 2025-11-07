# Community Table Tutorial

In this tutorial, we will be creating a **Community table** on the Space and Time chain using an ECDSA wallet.

Community tables are user-owned tables with **controlled access**. Only the table creator and users who have been granted permission can insert data into these tables. This makes them ideal for private data storage, application data, or any scenario where you need to control who can write to your tables.

The major steps we will walk through are:

1. Funding a wallet with compute credits.
2. Creating a Community table on the Space and Time chain.
3. Granting insert permissions to other addresses (optional).
4. Inserting data into the new table.


## Step 1: Funding a Wallet

In order to interact with the Space and Time chain, you need compute credits. In this tutorial, we will use the wallet address `0xABC8d709C80262965344f5240Ad123f5cBE51123` and will be funding the wallet with 100 SXT.

You can fund your wallet using one of two methods:

### Option A: Manual Funding

To manually fund your wallet, you can follow the instructions in the [Hello World Tutorial](../../hello_world_tutorial/HELLO_WORLD_TUTORIAL.md)

### Option B: Dreamspace Pay

For a simpler funding experience, see the [How to fund a wallet with Dreamspace Pay](../../how_to/HOW_TO_FUND_A_WALLET_WITH_DSPAY.md) guide.

## Step 2: Clone this repo

We will be using this repo, which has the scripts that we will be using. So, we clone this repo:

```bash
git clone git@github.com:spaceandtimefdn/sxt-chain-examples.git
cd sxt-chain-examples
```

We will be using [Node.js](https://nodejs.org/en/download/current) which can be installed a variety of ways.

Then, we need to install the prerequisite npm packages:

```bash
npm install
```

Then, we can make the `community_table_tutorial` directory our working directory.

```bash
cd community_table_tutorial
```

## Step 3: Creating a Community Table (DDL)

We will write a node script that will create a Community table for us. This script is named `community_create_table.js`.

For this tutorial, we'll create a user management table called `USERS` with the following schema:

| `USER_ID` (`BIGINT`) | `USERNAME` (`VARCHAR`) | `EMAIL` (`VARCHAR`) | `CREATED_AT` (`BIGINT`) |
| -------------------- | ---------------------- | ------------------- | ----------------------- |
| 1                    | alice                  | alice@example.com   | 1700000000              |
| 2                    | bob                    | bob@example.com     | 1700000100              |
| 3                    | charlie                | charlie@example.com | 1700000200              |

The first thing we must do in order to create a table is create a connection with a Space and Time RPC node:

```javascript
const provider = new WsProvider("wss://rpc.mainnet.sxt.network");
const api = await ApiPromise.create({ provider, noInitWarn: true });
```

Next, we build a transaction to create a new namespace. **Important**: The namespace must end with the wallet address (without the `0x` prefix, uppercase). We will use the namespace `MYAPP_DEF1234567890ABCDEF1234567890ABCDEF12345`.

```javascript
const createNamespaceTX = api.tx.tables.createNamespace(
  "MYAPP_DEF1234567890ABCDEF1234567890ABCDEF12345",
  0,
  "CREATE SCHEMA IF NOT EXISTS MYAPP_DEF1234567890ABCDEF1234567890ABCDEF12345",
  "Community",
  { UserCreated: "My Application Namespace" },
);
```

Then, we build a transaction for the DDL of the new Community table.

```javascript
const createTablesTX = api.tx.tables.createTables([
  {
    ident: {
      namespace: "MYAPP_DEF1234567890ABCDEF1234567890ABCDEF12345",
      name: "USERS",
    },
    createStatement:
      "CREATE TABLE MYAPP_DEF1234567890ABCDEF1234567890ABCDEF12345.USERS (USER_ID BIGINT NOT NULL, USERNAME VARCHAR NOT NULL, EMAIL VARCHAR NOT NULL, CREATED_AT BIGINT NOT NULL)",
    tableType: "Community",
    commitment: { Empty: { hyperKzg: true } },
    source: { UserCreated: "User management table" },
  },
]);
```

Then, instead of submitting two separate transactions, we opt to batch these into a single transaction:

```javascript
const batchTX = api.tx.utility.batchAll([createNamespaceTX, createTablesTX]);
```

We must sign the transaction. To do this, we add the private key of our `0xDEF...345` wallet as an environment variable. We add it to a `.env` file and `import 'dotenv/config';`. The `.env` file looks like this:

```
PRIVATE_KEY=d157███████████████████████ REDACTED ███████████████████████f415
```

We can then create a wallet in our script by using the `ethers` package and the custom `EthEcdsaSigner`:

```javascript
const wallet = new Wallet(process.env.PRIVATE_KEY);
const signer = new EthEcdsaSigner(wallet, api);
```

Finally, we submit the transaction to the Space and Time chain to create the namespace and table.

```javascript
await batchTX.signAndSend(signer.address, { signer });
```

Now, we run the script with:

```bash
node community_create_table.js
```

**What makes this a Community table?**
- The `tableType` is set to `"Community"`
- Only you (the creator) can insert data initially
- You can grant permission to other specific users to insert data
- No automatic `META_SUBMITTER` column is added

## Step 4: Granting Insert Permissions (Optional)

Community tables have **controlled access**, meaning only authorized addresses can insert data. By default, only the table creator (you) can insert data. If you want to allow another wallet address to insert data, you need to explicitly grant them permission.

**Note**: If you're only inserting data from your own wallet (the table creator), you can skip this step and go directly to Step 5.

### When to grant permissions

You should grant insert permissions when:
- You have multiple wallets or services that need to insert data
- You're building an application where different users submit data to your table
- You want to delegate data submission to another party

### Granting permission to another address

To grant insert permission to another address, we'll use the `add_insert_permission.js` script.

First, add the address you want to grant permission to in your `.env` file:

```
PRIVATE_KEY=d157███████████████████████ REDACTED ███████████████████████f415
DATA_SUBMITTER_ADDRESS=0xABC1234567890ABCDEF1234567890ABCDEF67890
```

The script will:
1. Convert the Ethereum address to Substrate AccountId format (32 bytes: 12 zero bytes + 20-byte Ethereum address)
2. Create a permission for `IndexingPallet.SubmitDataForPrivilegedQuorum` for the specific table
3. Submit the transaction using `api.tx.permissions.addProxyPermission()`

Here's the key part of the permission granting code:

```javascript
// Convert Ethereum address to Substrate AccountId format
const dataSubmitterAccountId = "0x" + "00".repeat(12) + dataSubmitterAddress.substring(2).toUpperCase();

// Create the permission for submitting data to this specific table
const permission = {
  IndexingPallet: {
    SubmitDataForPrivilegedQuorum: {
      namespace: namespace,
      name: "USERS"
    }
  }
};

// Build the transaction to add data submitter permission
const addPermissionTx = api.tx.permissions.addProxyPermission(
  dataSubmitterAccountId,
  permission
);
```

Run the script to grant the permission:

```bash
node add_insert_permission.js
```

You should see output like:

```
Connected to RPC.
Granting permission to: 0xABC1234567890ABCDEF1234567890ABCDEF67890
For table: MYAPP_DEF1234567890ABCDEF1234567890ABCDEF12345.USERS
Signing and sending transaction...
Permission granted successfully!
```

Once the permission is granted, the specified address can now submit data to your Community table.

## Step 5: Inserting Data (DML)

Now that we have created the table (and optionally granted permissions to other addresses), we can insert data. The corresponding script is named `community_insert_data.js`.

**Important**: You can only insert data if you are either:
- The table creator (your wallet created the table in Step 3), or
- An address that has been granted insert permission (via Step 4)

The majority of the script is identical to the one that created the table. The only difference is how we build the transaction.

The data is inserted to the chain as an Apache Arrow table. We build the table as follows:

```javascript
const table = new Table({
  USER_ID: vectorFromArray([1n, 2n, 3n], new Int64()),
  USERNAME: vectorFromArray(["alice", "bob", "charlie"], new Utf8()),
  EMAIL: vectorFromArray(
    ["alice@example.com", "bob@example.com", "charlie@example.com"],
    new Utf8()
  ),
  CREATED_AT: vectorFromArray([1700000000n, 1700000100n, 1700000200n], new Int64())
});
```

Finally, we build the transaction that will insert the table. We need to specify a unique `batchId` for each insertion.

```javascript
const batchId = "MYAPP_DEF1234567890ABCDEF1234567890ABCDEF12345.USERS.1";
const insertDataTx = api.tx.indexing.submitData(
  {
    namespace: "MYAPP_DEF1234567890ABCDEF1234567890ABCDEF12345",
    name: "USERS",
  },
  batchId,
  u8aToHex(tableToIPC(table)),
);
```

We run the script with:

```bash
node community_insert_data.js
```

We have now created a Community table and inserted data!

## Community vs PublicPermissionless Tables

**Community tables** are best when you need **controlled access**:
- ✅ Private application data
- ✅ User management systems
- ✅ Controlled datasets
- ✅ Data that requires permission to modify

For **open-access** tables where anyone can insert data, see the [PublicPermissionless Table Tutorial](../public_permissionless_tutorial/PUBLIC_PERMISSIONLESS_TUTORIAL.md).

## Next Steps

- Learn about [PublicPermissionless tables](../public_permissionless_tutorial/PUBLIC_PERMISSIONLESS_TUTORIAL.md) for open crowdsourced data
- Explore how to grant permissions to other users (see the [Community Tables How-To Guide](../docs/how-to-create-community-tables.md))
- Query your data using Proof of SQL
