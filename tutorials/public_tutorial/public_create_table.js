import "dotenv/config";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { Wallet } from "ethers";
import { EthEcdsaSigner } from "../lib/ethecdsa_signer.js";

async function main() {
  console.log("Connecting to RPC...");
  const provider = new WsProvider("wss://rpc.mainnet.sxt.network");
  const api = await ApiPromise.create({ provider, noInitWarn: true });
  console.log("Connected to RPC.");

  // Get wallet address for namespace
  const wallet = new Wallet(process.env.PRIVATE_KEY);
  const ethAddress = wallet.address.substring(2).toUpperCase(); // Remove 0x and uppercase
  const namespace = `MOVIES_${ethAddress}`;

  console.log("Creating namespace:", namespace);

  const createNamespaceTX = api.tx.tables.createNamespace(
    namespace,
    0,
    `CREATE SCHEMA IF NOT EXISTS ${namespace}`,
    "PublicPermissionless",
    { UserCreated: "MoviesPoll" },
  );

  const createTablesTX = api.tx.tables.createTables([
    {
      ident: {
        namespace: namespace,
        name: "VOTES",
      },
      createStatement:
        `CREATE TABLE IF NOT EXISTS ${namespace}.VOTES (` +
        `MOVIE VARCHAR NOT NULL, ` +
        `WEEK BIGINT NOT NULL, ` +
        `PRIMARY_KEY(MOVIE, WEEK))`,
      tableType: "PublicPermissionless",
      commitment: { Empty: { hyperKzg: true } },
      source: { UserCreated: "MoviesPoll" },
    },
  ]);

  const batchTX = api.tx.utility.batchAll([createNamespaceTX, createTablesTX]);

  const signer = new EthEcdsaSigner(wallet, api);
  console.log("Signing and sending transaction...");
  const unsub = await batchTX.signAndSend(
    signer.address,
    { signer },
    async (status) => {
      if (status.isFinalized) {
        console.log("Finalized in block", status.blockNumber.toString());
        console.log("Namespace:", namespace);
        console.log("Table:", `${namespace}.VOTES`);
        unsub();
        process.exit(0);
      }
    },
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
