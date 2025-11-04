import "dotenv/config";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { u8aToHex, hexToU8a } from "@polkadot/util";
import { Wallet } from "ethers";
import { EthEcdsaSigner } from "../lib/ethecdsa_signer.js";
import {
  Table,
  Int64,
  Utf8,
  vectorFromArray,
  tableToIPC,
  Binary,
} from "apache-arrow";

async function main() {
  console.log("Connecting to RPC...");
  const provider = new WsProvider("wss://rpc.mainnet.sxt.network");
  const api = await ApiPromise.create({ provider, noInitWarn: true });
  console.log("Connected to RPC.");

  const table = new Table({
    ID: vectorFromArray(
      ["0x0001", "0x0002", "0x0003", "0x0004", "0x0005"].map((a) =>
        hexToU8a(a),
      ),
      new Binary(),
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
  const signer = new EthEcdsaSigner(wallet, api);
  console.log("Signing and sending transaction...");
  const unsub = await insertDataTx.signAndSend(
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
