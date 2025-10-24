import 'dotenv/config';
import { ApiPromise, Keyring, WsProvider } from "@polkadot/api";
import fs from "fs";

async function main() {
  console.log("Connecting to RPC...");
  const api = await ApiPromise.create({
    provider: new WsProvider("wss://rpc.testnet.sxt.network"),
    noInitWarn: true,
  });

  const tx = api.tx.tables.createTables([
    {
      ident: { namespace: "MY_NAMESPACE", name: "MY_TABLE" },
      createStatement:
        "CREATE TABLE MY_NAMESPACE.MY_TABLE (A BIGINT NOT NULL, B BINARY NOT NULL, C VARCHAR NOT NULL)",
      tableType: "Community",
      commitment: { Empty: { hyperKzg: true } },
      source: { UserCreated: "" },
    },
  ]);
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
