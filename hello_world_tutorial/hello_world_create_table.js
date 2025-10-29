import "dotenv/config";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { Wallet } from "ethers";
import { EthEcdsaSigner } from "../lib/ethecdsa_signer.js";

async function main() {
  console.log("Connecting to RPC...");
  const provider = new WsProvider("wss://rpc.testnet.sxt.network");
  const api = await ApiPromise.create({ provider, noInitWarn: true });
  console.log("Connected to RPC.");

  const createNamespaceTX = api.tx.tables.createNamespace(
    "TUTORIAL_ABC8D709C80262965344F5240AD123F5CBE51123",
    0,
    "CREATE SCHEMA IF NOT EXISTS TUTORIAL_ABC8D709C80262965344F5240AD123F5CBE51123",
    "Community",
    { UserCreated: "Tutorial" },
  );

  const createTablesTX = api.tx.tables.createTables([
    {
      ident: {
        namespace: "TUTORIAL_ABC8D709C80262965344F5240AD123F5CBE51123",
        name: "HELLO_WORLD",
      },
      createStatement:
        "CREATE TABLE TUTORIAL_ABC8D709C80262965344F5240AD123F5CBE51123.HELLO_WORLD (ID BINARY NOT NULL, NAME VARCHAR NOT NULL, LATITUDE BIGINT NOT NULL, LONGITUDE BIGINT NOT NULL, AREA BIGINT NOT NULL)",
      tableType: "Community",
      commitment: { Empty: { hyperKzg: true } },
      source: { UserCreated: "Planet Earth" },
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
