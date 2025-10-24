import 'dotenv/config';
import { ApiPromise, WsProvider } from "@polkadot/api";
import { Wallet } from "ethers";
import { signAndSendEthEcdsa } from "./eth_ecdsa.js";

async function main() {
  console.log("Connecting to RPC...");
  const api = await ApiPromise.create({
    provider: new WsProvider("wss://rpc.testnet.sxt.network"),
    noInitWarn: true,
  });

  const tx = api.tx.tables.createTables([
    {
      ident: { namespace: "MY_NAMESPACE", name: "MY_ECDSA_TABLE" },
      createStatement:
        "CREATE TABLE MY_NAMESPACE.MY_ECDSA_TABLE (A BIGINT NOT NULL, B BINARY NOT NULL, C VARCHAR NOT NULL)",
      tableType: "Community",
      commitment: { Empty: { hyperKzg: true } },
      source: { UserCreated: "" },
    },
  ]);
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
