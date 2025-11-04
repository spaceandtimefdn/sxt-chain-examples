import "dotenv/config";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { Wallet } from "ethers";
import { EthEcdsaSigner } from "../lib/ethecdsa_signer.js";

async function main() {
  console.log("Connecting to RPC...");
  const provider = new WsProvider("wss://rpc.mainnet.sxt.network");
  const api = await ApiPromise.create({ provider, noInitWarn: true });
  console.log("Connected to RPC.");

  const createNamespaceTX = api.tx.tables.createNamespace(
    "TUTORIAL_ABC8D709C80262965344F5240AD123F5CBE51123",
    0,
    "CREATE SCHEMA IF NOT EXISTS TUTORIAL_ABC8D709C80262965344F5240AD123F5CBE51123",
    "PublicPermissionless",
    { UserCreated: "Space and Time Translations" },
  );

  const createTablesTX = api.tx.tables.createTables([
    {
      ident: {
        namespace: "TUTORIAL_ABC8D709C80262965344F5240AD123F5CBE51123",
        name: "SPACEANDTIME",
      },
      createStatement:
        "CREATE TABLE TUTORIAL_ABC8D709C80262965344F5240AD123F5CBE51123.SPACEANDTIME (LANGUAGE VARCHAR NOT NULL, SPACE VARCHAR NOT NULL, TIME VARCHAR NOT NULL, SPACE_AND_TIME VARCHAR NOT NULL)",
      tableType: "PublicPermissionless",
      commitment: { Empty: { hyperKzg: true } },
      source: { UserCreated: "Top 500 Languages" },
    },
  ]);

  const batchTX = api.tx.utility.batchAll([createNamespaceTX, createTablesTX]);

  const wallet = new Wallet(process.env.PRIVATE_KEY);
  const signer = new EthEcdsaSigner(wallet, api);
  console.log("Signing and sending transaction...");
  const unsub = await batchTX.signAndSend(
    signer.address,
    { signer },
    async (status) => {
      if (status.isFinalized) {
        console.log("Finalized in block", status.blockNumber.toString());
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
