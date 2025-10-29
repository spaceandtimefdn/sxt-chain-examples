import { hexToU8a, u8aConcat, u8aToHex } from "@polkadot/util";
import { blake2AsU8a } from "@polkadot/util-crypto";
export class EthEcdsaSigner {
  constructor(wallet, api) {
    this.wallet = wallet;
    this.address = u8aToHex(
      u8aConcat(new Uint8Array(12), hexToU8a(wallet.address)),
    );
    this.registry = api.registry;
  }
  async signPayload(payload) {
    const payloadObj = this.registry.createType("ExtrinsicPayload", payload);
    let payloadBytes = payloadObj.toU8a({ method: true });
    if (payloadBytes.length > 256) payloadBytes = blake2AsU8a(payloadBytes);
    const signature = hexToU8a(this.wallet.signMessageSync(payloadBytes));
    return { id: this.wallet.address, signature: { EthEcdsa: signature } };
  }
}
export default EthEcdsaSigner;
