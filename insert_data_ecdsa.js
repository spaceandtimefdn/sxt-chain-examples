import 'dotenv/config';
import { ApiPromise, WsProvider } from "@polkadot/api";
import { hexToU8a, u8aToHex } from "@polkadot/util";
import { Wallet } from "ethers";
import { signAndSendEthEcdsa } from "./eth_ecdsa.js";
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
  const batchId = "MY_NAMESPACE.MY_ECDSA_TABLE.1";
  const tx = api.tx.indexing.submitData(
    { namespace: "MY_NAMESPACE", name: "MY_ECDSA_TABLE" },
    batchId,
    u8aToHex(tableToIPC(table)),
  );
  console.log("Calldata of transaction:", tx.toHex());

  console.log("Signing and sending transaction...");
  const wallet = new Wallet(process.env.WALLET_SEED);
  const unsub = await signAndSendEthEcdsa(api, tx, wallet, async (status) => {
    if (status.isFinalized) {
      const header = await api.rpc.chain.getHeader(status.asFinalized);
      console.log("Finalized in block", header.number.toString());
      unsub();
      process.exit(0);
    }
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
