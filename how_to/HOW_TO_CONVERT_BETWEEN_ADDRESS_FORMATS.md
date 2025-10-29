# How to convert between address formats

There are 3 main wallet address formats:
* SS58 - native Space and Time Chain wallet address
* 20 byte hex - 40 charater hex Ethereum-style ECDSA address
* 32 byte hex

In order to use the native wallet, we recommend using one the following
- [Talisman](https://talisman.xyz/)
- [Polkadot Developer Signer](https://polkadot.js.org/extension/)
- [SubWallet](https://www.subwallet.app/)

## 20 byte hex ⟷ 32 byte hex

Converting from a 20 byte hex to a 32 byte hex simply requires prepending 12 bytes of 0s, that is, 24 0s.

So, `0xABC8d709C80262965344f5240Ad123f5cBE51123` becomes `0x000000000000000000000000ABC8d709C80262965344f5240Ad123f5cBE51123`.

Not every 32 byte hex address can be converted to a 20 byte hex address, since not every 32 byte hex address starts with 12 bytes of 0. Converting back simply means removing the 24 0s.

## SS58 ⟶ 32 byte hex

- Option 1: use the [Polkadot Developer Interface](https://polkadot.js.org/apps/#/utilities) utility for converting addresses.
- Option 2: install [`subkey`](https://crates.io/crates/subkey) and run `subkey inspect YOUR_SS58_ADDRESS`.
- Option 3: use the [Subscan](https://sxt.subscan.io/tools/format_transform) utility for converting addresses.

Using `subkey` on the SS58 address `5DtfCxBg5RnhGBYKxS15q3MtCYbpvam2cjnbG8kyphGhYXmn` gives the following:
```bash
$ subkey inspect 5DtfCxBg5RnhGBYKxS15q3MtCYbpvam2cjnbG8kyphGhYXmn
Public Key URI `5DtfCxBg5RnhGBYKxS15q3MtCYbpvam2cjnbG8kyphGhYXmn` is account:
  Network ID/Version: substrate
  Public key (hex):   0x50cf17598eac69c4b16c4789e1f51e73834fcb7ef7c03743ae035b475637524b
  Account ID:         0x50cf17598eac69c4b16c4789e1f51e73834fcb7ef7c03743ae035b475637524b
  Public key (SS58):  5DtfCxBg5RnhGBYKxS15q3MtCYbpvam2cjnbG8kyphGhYXmn
  SS58 Address:       5DtfCxBg5RnhGBYKxS15q3MtCYbpvam2cjnbG8kyphGhYXmn
```

You can read off the 32 byte hex address: `0x50cf17598eac69c4b16c4789e1f51e73834fcb7ef7c03743ae035b475637524b`.

## 32 byte hex ⟶ SS58

- Option 1: install [`subkey`](https://crates.io/crates/subkey) and run `subkey inspect --public YOUR_HEX_ADDRESS`.
- Option 2: use the [Subscan](https://sxt.subscan.io/tools/format_transform) utility for converting addresses.

Using `subkey` on the SS58 address `0x50cf17598eac69c4b16c4789e1f51e73834fcb7ef7c03743ae035b475637524b` gives the following:
```bash
$ subkey inspect --public 0x50cf17598eac69c4b16c4789e1f51e73834fcb7ef7c03743ae035b475637524b
Network ID/Version: substrate
  Public key (hex):   0x50cf17598eac69c4b16c4789e1f51e73834fcb7ef7c03743ae035b475637524b
  Account ID:         0x50cf17598eac69c4b16c4789e1f51e73834fcb7ef7c03743ae035b475637524b
  Public key (SS58):  5DtfCxBg5RnhGBYKxS15q3MtCYbpvam2cjnbG8kyphGhYXmn
  SS58 Address:       5DtfCxBg5RnhGBYKxS15q3MtCYbpvam2cjnbG8kyphGhYXmn
```

You can read off the SS58 address: `5DtfCxBg5RnhGBYKxS15q3MtCYbpvam2cjnbG8kyphGhYXmn`.