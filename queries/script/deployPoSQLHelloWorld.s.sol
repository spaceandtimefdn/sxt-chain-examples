// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script} from "forge-std/src/Script.sol";
import {stdJson} from "forge-std/src/StdJson.sol";
import {PoSQLHelloWorld} from "../src/PoSQLHelloWorld.sol";

/// @title Deploy PoSQLHelloWorld
/// @notice Reads per-chain payout from config/examples.addresses.json (or ENV override) and deploys.
///
/// ## How to Run
/// `forge script script/deployPoSQLHelloWorld.s.sol:DeployPoSQLHelloWorld --broadcast --rpc-url=$ETH_RPC_URL --private-key=$PRIVATE_KEY --verify -vvvvv`
contract DeployPoSQLHelloWorld is Script {
    using stdJson for string;

    function run() public {
        // pick chain id from the RPC you pass to forge, or override via env
        uint256 chainId = block.chainid;

        string memory path = string.concat(vm.projectRoot(), "/config/examples.addresses.json");
        /// forge-lint: disable-start(unsafe-cheatcode)
        string memory json = vm.readFile(path);

        // Build JSON pointer like ".11155111.QUERY_ROUTER_ADDRESS"
        string memory base = string.concat(".", vm.toString(chainId));
        address queryRouter = json.readAddress(string.concat(base, ".QUERY_ROUTER_ADDRESS"));
        bytes32 version = json.readBytes32(string.concat(base, ".PROOF_OF_SQL_VERSION_HASH"));
        address sxt = json.readAddress(string.concat(base, ".SXT_TOKEN_CONTRACT_ADDRESS"));
        uint248 amount = uint248(uint256(json.readUint(string.concat(base, ".PAYMENT_AMOUNT"))));

        vm.startBroadcast(); // uses PRIVATE_KEY from env or CLI
        new PoSQLHelloWorld(queryRouter, version, sxt, amount);
        vm.stopBroadcast();
    }
}
