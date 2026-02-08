// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ParamsBuilder, ProofOfSqlTable} from "sxt-proof-of-sql-contracts/src/PoSQL.sol";
import {IQueryCallback} from "sxt-proof-of-sql-contracts/src/IQueryCallback.sol";
import {IQueryRouter} from "sxt-proof-of-sql-contracts/src/query-router/interfaces/IQueryRouter.sol";

/// @title PoSQLTimeStampWithInequality
/// @notice Example "Hello World"-style contract of a Proof of SQL query using a timestamp and an inequality.
/// @dev This contract uses QueryRouter to pay for and execute the query.
/// the query is a simple SQL query that retrieves the number of blocks that occurred in a specific 60,000 millisecond window.
/// note: make sure that this contract holds SXT enough to cover the query payment. Also this is a simple
/// example and does not include zero address checks and other security checks.

/// @dev to deploy this contract, use the DeployPoSQLTimeStampWithInequality script:
/// forge script script/deployPoSQLTimeStampWithInequality.s.sol:DeployPoSQLTimeStampWithInequality --broadcast --rpc-url=$ETH_RPC_URL --private-key=$PRIVATE_KEY --verify -vvvvv
contract PoSQLTimeStampWithInequality is IQueryCallback {
    using SafeERC20 for IERC20;

    /// @notice QueryRouter contract address
    address public immutable QUERY_ROUTER;
    /// @notice Proof of SQL version
    bytes32 public immutable VERSION;
    /// @notice SXT token
    address public immutable SXT;
    /// @notice The ammount of SXT to pay for the query
    uint256 public immutable PAYMENT_AMOUNT;

    uint256 public constant MAX_GAS_PRICE = 1e6;
    uint64 public constant GAS_LIMIT = 1e6;
    int64 public constant MINUTES_IN_MILLISECONDS = 6e4;

    /// @dev hex-serialized SQL query plan:
    /// SELECT BLOCK_NUMBER FROM ETHEREUM.BLOCKS WHERE TIME_STAMP>$1 AND TIME_STAMP<$2
    bytes public constant QUERY_PLAN =
        hex"0000000000000001000000000000000f455448455245554d2e424c4f434b5300000000000000020000000000000000000000000000000c424c4f434b5f4e554d424552000000050000000000000000000000000000000a54494d455f5354414d500000000900000001000000000000000000000001000000000000000c424c4f434b5f4e554d424552000000000000000000000000000000060000000a0000000000000000000000010000000b0000000000000000000000090000000100000000000000000a0000000000000000000000010000000b0000000000000001000000090000000100000000010000000000000001000000000000000000000000";

    constructor(address queryRouter, bytes32 version, address sxt, uint248 amount) {
        QUERY_ROUTER = queryRouter;
        VERSION = version;
        SXT = sxt;
        PAYMENT_AMOUNT = amount;
    }

    /// @notice Pay for and execute a "Hello World"-style query with an inequality and timestamp.
    function query() external {
        // 0. pull SXT from the caller (must have approved this contract beforehand)
        IERC20(SXT).safeTransferFrom(msg.sender, address(this), PAYMENT_AMOUNT);

        // 1. approve payment to be spent by QueryRouter, that will cover PoSQLVerifier's fees and fulfillment callback gas.
        // Note: make sure that the caller address holds at least `PAYMENT_AMOUNT` of SXT.
        IERC20(SXT).forceApprove(QUERY_ROUTER, PAYMENT_AMOUNT); // use forceApprove to handle nonzero allowances

        // 2. Assemble the SQL parameters using the `ParamsBuilder` library
        int64 blockTimeStampInMilliseconds = int64(uint64(uint256(1746470771) * 1000));

        bytes memory param1 =
            ParamsBuilder.unixTimestampMillisParam(blockTimeStampInMilliseconds - MINUTES_IN_MILLISECONDS);
        bytes memory param2 = ParamsBuilder.unixTimestampMillisParam(blockTimeStampInMilliseconds);
        bytes[] memory queryParameters = new bytes[](2);
        queryParameters[0] = param1;
        queryParameters[1] = param2;
        bytes memory serializedParams = ParamsBuilder.serializeParamArray(queryParameters);

        IQueryRouter.Query memory queryToRequest = IQueryRouter.Query({
            version: VERSION, innerQuery: QUERY_PLAN, parameters: serializedParams, metadata: hex""
        });

        IQueryRouter.Callback memory callback = IQueryRouter.Callback({
            maxGasPrice: MAX_GAS_PRICE,
            gasLimit: GAS_LIMIT,
            callbackContract: address(this),
            selector: IQueryCallback.queryCallback.selector,
            callbackData: ""
        });

        // 3. Execute the query.
        IQueryRouter(QUERY_ROUTER) // aderyn-ignore unchecked-return
            .requestQuery(queryToRequest, callback, PAYMENT_AMOUNT, uint64(block.timestamp + 1 hours));
    }

    /// @notice Example event emitting the total number of blocks in the 60 second window.
    event QueryFulfilled(uint256 totalBlocks);

    /// @inheritdoc IQueryCallback
    /// @notice Handle the query result.
    /// @dev This will be called once the query has been executed and verified on-chain.
    function queryCallback(bytes32, bytes calldata queryResult, bytes calldata) external {
        (, ProofOfSqlTable.Table memory tableResult) = ProofOfSqlTable.__deserializeFromBytes(queryResult);
        uint256 length = ProofOfSqlTable.readBigIntColumn(tableResult, 0).length;
        // Emit the total number of blocks in the 60 second window
        emit QueryFulfilled(length);
    }
}
