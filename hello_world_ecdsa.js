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

  const tx = api.tx.system.remark("Hello World!");
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
