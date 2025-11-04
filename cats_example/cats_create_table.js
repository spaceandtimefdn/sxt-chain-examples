import "dotenv/config";
import { ApiPromise, Keyring, WsProvider } from "@polkadot/api";
import fs from "fs";

async function main() {
  console.log("Connecting to RPC...");
  const provider = new WsProvider("wss://rpc.mainnet.sxt.network");
  const api = await ApiPromise.create({ provider, noInitWarn: true });
  console.log("Connected to RPC.");

  const createNamespaceTX = api.tx.tables.createNamespace(
    "CATS_5CQDKQCMVFRTHPG28DHG1DYWRFSHY1MBS5TGNEVA4KG5AGUG",
    0,
    "CREATE SCHEMA IF NOT EXISTS CATS_5CQDKQCMVFRTHPG28DHG1DYWRFSHY1MBS5TGNEVA4KG5AGUG",
    "PublicPermissionless",
    { UserCreated: "Cats" },
  );

  const createTablesTX = api.tx.tables.createTables([
    {
      ident: {
        namespace: "CATS_5CQDKQCMVFRTHPG28DHG1DYWRFSHY1MBS5TGNEVA4KG5AGUG",
        name: "CATS",
      },
      createStatement:
        "CREATE TABLE CATS_5CQDKQCMVFRTHPG28DHG1DYWRFSHY1MBS5TGNEVA4KG5AGUG.CATS (NAME VARCHAR NOT NULL, AGE BIGINT NOT NULL, IS_FEMALE BOOLEAN NOT NULL)",
      tableType: "PublicPermissionless",
      commitment: { Empty: { hyperKzg: true } },
      source: { UserCreated: "Cats" },
    },
  ]);

  const batchTX = api.tx.utility.batchAll([createNamespaceTX, createTablesTX]);

  const keyFile = fs.readFileSync(process.env.KEY_JSON_PATH);
  const pair = new Keyring().createFromJson(JSON.parse(keyFile));
  pair.decodePkcs8(process.env.KEY_PW);
  console.log("Signing and sending transaction...");
  const unsub = await batchTX.signAndSend(
    pair,
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
