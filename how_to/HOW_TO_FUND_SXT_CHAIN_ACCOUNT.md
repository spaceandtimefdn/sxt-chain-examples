# Fund your wallet's SXT Chain account (gas)

You need to fund an SXT Chain account for your wallet with compute credits (add a balance to pay for gas) before you can create tables (execute DDL transactions on SXT Chain) and before you can insert rows of data to your custom tables (execute DML transactions against your tables on SXT Chain).

**Funding your account using SXT token:** There is a straightforward, bridge-like contract on Ethereum where you can deposit funds (using SXT token on Ethereum) with an ECDSA wallet which shortly are made available on SXT Chain in your account.

**Funding your account using USDC, ETH etc:** In addition, we offer a convenient tool for users who are not holding SXT token and want to fund their account with other popular tokens such as USDC, USDT, ETH, etc called “Dreamspace Pay”. Dreamspace Pay is a smart contract on Ethereum which handles swaps from popular tokens to SXT token and funds your account, so that you don’t have to purchase SXT ahead of time, as a convenience.

## How to Fund an Account Directly

In order to use the SXT Chain, compute credits are required. This how-to walks through the steps to fund an account with compute credits using the SXTChainFunding smart contract (`0xb1bc1d7eb1e6c65d0de909d8b4f27561ef568199`).

### Step 1: Approve Spend

Call the [`approve`](https://etherscan.io/address/0xE6Bfd33F52d82Ccb5b37E16D3dD81f9FFDAbB195#writeContract#F1) function on the `SXTChainFunding` contract.

- `spender` should be the SXTChainFunding contract address: `0xb1bc1d7eb1e6c65d0de909d8b4f27561ef568199`
- `value` should the the amount to be spent. Because SXT has 18 decimals, 123 SXT should be entered as `123000000000000000000`.

![Approve Funds](./doc_assets/etherscan_approve_sxtchainfunding_example.png)

### Step 2: Send Funds

Call the [`fundAddress`](https://etherscan.io/address/0xb1bc1d7eb1e6c65d0de909d8b4f27561ef568199#writeContract#F2) function on the SXTChainFunding contract.

- `onBehalfOf` should be the the hex address to be funded: `0xABC8d709C80262965344f5240Ad123f5cBE51123`.
- `value` should be what was entered for `value` above.

![Send Funds](./doc_assets/etherscan_fund_address_example.png)

> NOTE: To fund a 32-byte address, call [`fund32ByteAddress`](https://etherscan.io/address/0xb1bc1d7eb1e6c65d0de909d8b4f27561ef568199#writeContract#F1) instead. See the ["How To convert between address formats"](./HOW_TO_CONVERT_BETWEEN_ADDRESS_FORMATS.md) for more details.

## How To Fund an Account with Dreamspace Pay

In order to use the SXT Chain, compute credits are required. This how-to walks through the steps to fund an account with compute credits using the Dreamspace Pay smart contract (`0x880a88bF31800aB4B48ACd46220D9BA6898Bb419`).

Dreamspace Pay supports funding with many different tokens. In this example, we will use `USDC` (`0xdAC17F958D2ee523a2206206994597C13D831ec7`).

Dreamspace Pay also supports the following tokens as well:

- `WETH` (`0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2`), which has 18 decimals.
- `SXT` (`0xE6Bfd33F52d82Ccb5b37E16D3dD81f9FFDAbB195`), which has 18 decimals.
- `USDC` (`0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48`), which has 6 decimals.
- `USDT` (`0xdAC17F958D2ee523a2206206994597C13D831ec7`), which has 6 decimals.

### Step 1: Approve Spend

Call the [`approve`](https://etherscan.io/address/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48#writeProxyContract#F1) function on the `USDC` contract.

- `spender` should be the DSPay contract address: `0x880a88bF31800aB4B48ACd46220D9BA6898Bb419`
- `value` should the the amount to be spent. Because USDC has 6 decimals, 123 USDC should be entered as `123000000`.

![Approve Spend](./doc_assets/etherscan_approve_dspay_example.png)

### Step 2: Send Funds

Call the [`sendWithCallback`](https://etherscan.io/address/0x880a88bF31800aB4B48ACd46220D9BA6898Bb419#writeContract#F14) function on the DSPay contract. (Do NOT use `send`.)

- `asset` should be the USDC token: `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48`.
- `amount` should be the amount to be spent. This is the same as the `value` in the approve.
- `onBehalfOf` should be the 32 byte hex address to be funded. Be sure to use the 32 byte format of your address. See the ["How To convert between address formats"](./HOW_TO_CONVERT_BETWEEN_ADDRESS_FORMATS.md) for more details
- `merchant` should be the SXT Chain merchant address, which is `0xff0C0BeC16A1A7b1A1fF031a8a59b322159094C9`.
- `memo` can be anything. `0x` is fine.
- `itemId` should be `0x0000000000000000000000000000000000000000000000000000000000000000` (32 bytes of 0s)
- `callbackData` is ignored. `0x` is fine.

![Approve Spend](./doc_assets/etherscan_send_with_callback_dspay_example.png)
