// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
// forge-lint: disable-start(unused-import)
import {ParamsBuilder} from "sxt-proof-of-sql-0.123.10/src/client/ParamsBuilder.post.sol";
import {ProofOfSqlTable} from "sxt-proof-of-sql-0.123.10/src/client/PoSQLTable.post.sol";
import {IQueryRouter} from "../interfaces/IQueryRouter.sol";
// forge-lint: disable-end(unused-import)
address constant QUERY_ROUTER = 0x220a7036a815a1Bd4A7998fb2BCE608581fA2DbB;
address constant QUERY_ROUTER_EXECUTOR = 0xaCf075862425A0c839844369ac20e334B3710e47;
address constant VERIFIER_ADDRESS = 0x74f710114A9a226fE70741a7fa10C6f3689538eF;
bytes32 constant VERSION = bytes32(uint256(uint160(VERIFIER_ADDRESS)));
address constant SXT = 0xE6Bfd33F52d82Ccb5b37E16D3dD81f9FFDAbB195;
