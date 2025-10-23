# Space and Time Chain Examples

This repository contains three small demo scripts that show how to interact with the Space and Time network. Each example is available with two signing approaches: native Substrate wallets, and Ethereum-style ECDSA signing.

## Example

The repository includes three example flows. Each has a native and an `_ecdsa` variant.

- Hello World (`hello_world.js` and `hello_world_ecdsa.js`)
  - Submits a `system.remark("Hello World!")` extrinsic.

- Create Table (`create_table.js`, `create_table_ecdsa.js`)
  - Creates a table using a CREATE TABLE statement.

- Insert Data
  - Scripts: `insert_data.js`, `insert_data_ecdsa.js`
  - Builds an Apache Arrow `Table`, converts it to IPC hex, and submits it using `indexing.submitData`.

## Prerequisites & installation

You will need Node.js. These were developed using v25.0.0. Other modern versions will likely work as well.

Install dependencies from the project root:

```bash
npm install
```

## Wallets / Signing

The examples use two signing modes: native keyfile (Substrate Keyring / sr25519) and ECDSA (ethers Wallet).

Create a `.env` file at the project root with the values used by the examples. Example `.env`:

```env
# native keyfile
KEY_JSON_PATH=path/to/account.json
KEY_PW=your-key-password

# ECDSA
WALLET_SEED=0x123...456
```

Run the native examples:

```bash
node hello_world.js
node create_table.js
node insert_data.js
```

Run the ECDSA examples:

```bash
node hello_world_ecdsa.js
node create_table_ecdsa.js
node insert_data_ecdsa.js
```
