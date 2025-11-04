import "dotenv/config";
import { ApiPromise, Keyring, WsProvider } from "@polkadot/api";
import fs from "fs";
import { u8aToHex } from "@polkadot/util";
import {
  Table,
  Int64,
  Utf8,
  vectorFromArray,
  tableToIPC,
  Bool,
} from "apache-arrow";

async function main() {
  console.log("Connecting to RPC...");
  const provider = new WsProvider("wss://rpc.mainnet.sxt.network");
  const api = await ApiPromise.create({ provider, noInitWarn: true });
  console.log("Connected to RPC.");

  const table = new Table({
      NAME: vectorFromArray(["Chloe", "Margaret", "Prudence", "Lucy", "Pepper", "Rocky", "Katy", "Sasha"], new Utf8()),
      AGE: vectorFromArray([BigInt(13), BigInt(3), BigInt(6), BigInt(6), BigInt(3), BigInt(3), BigInt(0), BigInt(0)], new Int64()),
      IS_FEMALE: vectorFromArray([true, true, true, true, true, false, true, false], new Bool()),
    });

  const batchId = 1;
  const insertDataTx = api.tx.indexing.submitData(
    { namespace: "CATS_5CQDKQCMVFRTHPG28DHG1DYWRFSHY1MBS5TGNEVA4KG5AGUG", name: "CATS" },
    batchId,
    u8aToHex(tableToIPC(table)),
  );

  const keyFile = fs.readFileSync(process.env.KEY_JSON_PATH);
  const pair = new Keyring().createFromJson(JSON.parse(keyFile));
  pair.decodePkcs8(process.env.KEY_PW);
  console.log("Signing and sending transaction...");
  const unsub = await insertDataTx.signAndSend(
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
