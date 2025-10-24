import 'dotenv/config';
import { ApiPromise, Keyring, WsProvider } from "@polkadot/api";
import { hexToU8a, u8aToHex } from "@polkadot/util";
import fs from "fs";
import {
  Table,
  Int64,
  Binary,
  Utf8,
  vectorFromArray,
  tableToIPC,
} from "apache-arrow";

async function main() {
  console.log("Connecting to RPC...");
  const api = await ApiPromise.create({
    provider: new WsProvider("wss://rpc.testnet.sxt.network"),
    noInitWarn: true,
  });

  const table = new Table({
    A: vectorFromArray([BigInt(12345), BigInt(67890)], new Int64()),
    B: vectorFromArray(
      [hexToU8a("0x010203"), hexToU8a("0x040506")],
      new Binary(),
    ),
    C: vectorFromArray(["hello", "world"], new Utf8()),
  });
  const batchId = "MY_NAMESPACE.MY_TABLE.1";
  const tx = api.tx.indexing.submitData(
    { namespace: "MY_NAMESPACE", name: "MY_TABLE" },
    batchId,
    u8aToHex(tableToIPC(table)),
  );
  console.log("Calldata of transaction:", tx.toHex());

  console.log("Signing and sending transaction...");
  const keyFile = fs.readFileSync(process.env.KEY_JSON_PATH);
  const pair = new Keyring().createFromJson(JSON.parse(keyFile));
  pair.decodePkcs8(process.env.KEY_PW);
  const unsub = await tx.signAndSend(pair, async (status) => {
    if (status.isFinalized) {
      console.log("Finalized in block", status.blockNumber.toString());
      unsub();
      process.exit(0);
    }
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
