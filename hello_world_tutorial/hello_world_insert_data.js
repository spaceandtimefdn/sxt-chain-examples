import "dotenv/config";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { u8aToHex } from "@polkadot/util";
import { Wallet } from "ethers";
import { signAndSendEthEcdsa } from "../eth_ecdsa.js";
import { Table, Int64, Utf8, vectorFromArray, tableToIPC } from "apache-arrow";

async function main() {
  console.log("Connecting to RPC...");
  const provider = new WsProvider("wss://rpc.testnet.sxt.network");
  const api = await ApiPromise.create({ provider, noInitWarn: true });
  console.log("Connected to RPC.");

  const table = new Table({
    ID: vectorFromArray(
      [BigInt(1), BigInt(2), BigInt(3), BigInt(4), BigInt(5)],
      new Int64(),
    ),
    NAME: vectorFromArray(
      [
        "Amazon rainforest",
        "Caspian Sea",
        "Pacific Ocean",
        "Antarctic Desert",
        "Great Barrier Reef",
      ],
      new Utf8(),
    ),
    LATITUDE: vectorFromArray([-3n, 42n, 0n, -90n, -16n], new Int64()),
    LONGITUDE: vectorFromArray([60n, 51n, 160n, 0n, 146n], new Int64()),
    AREA: vectorFromArray(
      [5500000n, 371000n, 165250000n, 14200000n, 344400n],
      new Int64(),
    ),
  });
  const batchId = 1;
  const insertDataTx = api.tx.indexing.submitData(
    {
      namespace: "TUTORIAL_ABC8D709C80262965344F5240AD123F5CBE51123",
      name: "HELLO_WORLD",
    },
    batchId,
    u8aToHex(tableToIPC(table)),
  );

  const wallet = new Wallet(process.env.PRIVATE_KEY);

  console.log("Signing and sending transaction...");
  const unsub = await signAndSendEthEcdsa(api, insertDataTx, wallet, async (status) => {
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
