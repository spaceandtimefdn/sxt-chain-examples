import { hexToU8a, u8aConcat } from "@polkadot/util";
import { blake2AsU8a } from "@polkadot/util-crypto";
export async function signAndSendEthEcdsa(api, tx, wallet, cb) {
  const signer = u8aConcat(new Uint8Array(12), hexToU8a(wallet.address));
  const header = await api.rpc.chain.getHeader();
  const account = await api.query.system.account(signer);
  const era = { current: header.number, period: 64 };
  const payloadForSig = api.registry.createType("ExtrinsicPayload", {
    method: tx.method.toHex(),
    era,
    nonce: account.nonce,
    specVersion: api.runtimeVersion.specVersion,
    transactionVersion: api.runtimeVersion.transactionVersion,
    genesisHash: api.genesisHash,
    blockHash: header.hash,
  });
  let payloadBytes = payloadForSig.toU8a({ method: true });
  if (payloadBytes.length > 256) payloadBytes = blake2AsU8a(payloadBytes);
  const signature = hexToU8a(wallet.signMessageSync(payloadBytes));
  tx.addSignature(signer, { EthEcdsa: signature }, payloadForSig.toHex());
  return await api.rpc.author.submitAndWatchExtrinsic(tx.toHex(), cb);
}
