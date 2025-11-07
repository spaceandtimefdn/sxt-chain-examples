import "dotenv/config";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { Wallet } from "ethers";
import { EthEcdsaSigner } from "../lib/ethecdsa_signer.js";

async function main() {
  console.log("Connecting to RPC...");
  const provider = new WsProvider("wss://rpc.mainnet.sxt.network");
  const api = await ApiPromise.create({ provider, noInitWarn: true });
  console.log("Connected to RPC.");

  // Get wallet address for namespace
  const wallet = new Wallet(process.env.PRIVATE_KEY);
  const ethAddress = wallet.address.substring(2).toUpperCase();
  const namespace = `MYAPP_${ethAddress}`;

  // The data submitter wallet address to grant permission to
  const dataSubmitterAddress = process.env.DATA_SUBMITTER_ADDRESS;

  if (!dataSubmitterAddress) {
    console.error("Error: DATA_SUBMITTER_ADDRESS environment variable not set");
    console.log("Add DATA_SUBMITTER_ADDRESS=0x... to your .env file");
    process.exit(1);
  }

  // Convert Ethereum address to Substrate AccountId format
  // Substrate AccountIds are 32 bytes: 12 zero bytes + 20-byte Ethereum address
  const dataSubmitterAccountId = "0x" + "00".repeat(12) + dataSubmitterAddress.substring(2).toUpperCase();

  console.log("Granting permission to:", dataSubmitterAddress);
  console.log("For table:", `${namespace}.USERS`);

  // Create the permission for submitting data to this specific table
  const permission = {
    IndexingPallet: {
      SubmitDataForPrivilegedQuorum: {
	      namespace: namespace, // <--- Your Namespace
        name: "USERS" // <--- Your Table Name
      }
    }
  };

  // Build the transaction to add data submitter permission
  const addPermissionTx = api.tx.permissions.addProxyPermission(
    dataSubmitterAccountId,
    permission
  );

  const signer = new EthEcdsaSigner(wallet, api);
  console.log("Signing and sending transaction...");
  const unsub = await addPermissionTx.signAndSend(
    signer.address,
    { signer },
    async (status) => {
      if (status.isFinalized) {
        console.log("Permission granted successfully!");
        console.log("Finalized in block", status.blockNumber.toString());
        console.log("");
        console.log("Details:");
        console.log("  Table:", `${namespace}.USERS`);
        console.log("  Data submitter address:", dataSubmitterAddress);
        console.log("  Permission: SubmitDataForPrivilegedQuorum");
        console.log("");
        console.log("The data submitter address can now submit data to this table.");
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
