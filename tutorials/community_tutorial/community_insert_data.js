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
    const namespace = `MYAPP_${ethAddress}`;

    console.log("Inserting data into:", `${namespace}.USERS`);

    const table = new Table({
        USER_ID: vectorFromArray([1n, 2n, 3n], new Int64()),
        USERNAME: vectorFromArray(["alice", "bob", "charlie"], new Utf8()),
        EMAIL: vectorFromArray(
            ["alice@example.com", "bob@example.com", "charlie@example.com"],
            new Utf8()
        ),
        CREATED_AT: vectorFromArray([1700000000n, 1700000100n, 1700000200n], new Int64())
    });

    // Submit data (every batch id must be unique)
    const batchId = 1;
    const insertDataTx = api.tx.indexing.submitData(
        {
            namespace: namespace,
            name: "USERS",
        },
        batchId,
        u8aToHex(tableToIPC(table)),
    );

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
