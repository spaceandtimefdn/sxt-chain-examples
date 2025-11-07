import "dotenv/config";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { u8aToHex } from "@polkadot/util";
import { Wallet } from "ethers";
import { EthEcdsaSigner } from "../lib/ethecdsa_signer.js";
import {
    Table,
    Int64,
    Utf8,
    vectorFromArray,
    tableToIPC,
} from "apache-arrow";

async function main() {
    console.log("Connecting to RPC...");
    const provider = new WsProvider("wss://rpc.mainnet.sxt.network");
    const api = await ApiPromise.create({ provider, noInitWarn: true });
    console.log("Connected to RPC.");

    // Get wallet address for namespace
    const wallet = new Wallet(process.env.PRIVATE_KEY);
    const ethAddress = wallet.address.substring(2).toUpperCase();
    const namespace = `MOVIES_${ethAddress}`;

    console.log("Inserting data into:", `${namespace}.VOTES`);

    // IMPORTANT: Do NOT include META_SUBMITTER - it's added automatically!
    const table = new Table({
        MOVIE: vectorFromArray(
            ["Movie A", "Movie B", "Movie C"],
            new Utf8()
        ),
        WEEK: vectorFromArray([2n, 2n, 2n], new Int64())
        // META_SUBMITTER will be automatically added by the chain
        // containing your 32-byte AccountId
    });

    const batchId = 1;
    const insertDataTx = api.tx.indexing.submitData(
        {
            namespace: namespace,
            name: "VOTES",
        },
        batchId,
        u8aToHex(tableToIPC(table)),
    );

    const signer = new EthEcdsaSigner(wallet, api);
    console.log("Signing and sending transaction...");

    // Calculate META_SUBMITTER value for display
    const paddedAddress = "0x" + "00".repeat(12) + ethAddress;

    const unsub = await insertDataTx.signAndSend(
        signer.address,
        { signer },
        async (status) => {
            if (status.isFinalized) {
                console.log("Finalized in block", status.blockNumber.toString());
                console.log("Table:", `${namespace}.VOTES`);
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
