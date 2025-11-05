// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ParamsBuilder, ProofOfSqlTable} from "sxt-proof-of-sql-contracts/src/PoSQL.sol";
import {IQueryCallback} from "sxt-proof-of-sql-contracts/src/IQueryCallback.sol";
import {IQueryRouter} from "sxt-proof-of-sql-contracts/src/query-router/interfaces/IQueryRouter.sol";

/// @title PoSQLHelloWorld
/// @notice Example "Hello World"-style contract of a Proof of SQL query.
/// @dev This contract uses QueryRouter to pay for and execute the query.
/// the query is a simple SQL query that returns the number of ethereum contracts created by msg.sender.
/// note: make sure that this contract holds SXT enough to cover the query payment. Also this is a simple
/// example and does not include zero address checks and other security checks.

/// @dev to deploy this contract, use the DeployPoSQLHelloWorld script:
/// forge script script/deployPoSQLHelloWorld.s.sol:DeployPoSQLHelloWorld --broadcast --rpc-url=$ETH_RPC_URL --private-key=$PRIVATE_KEY --verify -vvvvv
contract PoSQLHelloWorld is IQueryCallback {
    using SafeERC20 for IERC20;

    /// @notice QueryRouter contract address
    address public immutable QUERY_ROUTER;
    /// @notice Proof of SQL version hash
    bytes32 public immutable VERSION;
    /// @notice SXT token address
    address public immutable SXT;
    /// @notice The ammount of SXT to pay for the query
    uint256 public immutable PAYMENT_AMOUNT;

    uint256 public constant MAX_GAS_PRICE = 1e6;
    uint64 public constant GAS_LIMIT = 1e6;

    /// @dev hex-serialized SQL query plan:
    /// SELECT BLOCK_NUMBER FROM ETHEREUM.CONTRACTS WHERE CONTRACT_CREATOR_ADDRESS=$1
    bytes public constant QUERY_PLAN =
        hex"00000000000000010000000000000012455448455245554d2e434f4e54524143545300000000000000020000000000000000000000000000000c424c4f434b5f4e554d4245520000000500000000000000000000000000000018434f4e54524143545f43524541544f525f414444524553530000000b0000000000000001000000000000000c424c4f434b5f4e554d424552000000000000000000000000000000020000000000000000000000010000000b00000000000000000000000b0000000000000001000000000000000000000000";

    constructor(address queryRouter, bytes32 version, address sxt, uint248 amount) {
        QUERY_ROUTER = queryRouter;
        VERSION = version;
        SXT = sxt;
        PAYMENT_AMOUNT = amount;
    }

    /// @notice Pay for and execute a "Hello World"-style query.
    function query() external {
        // 0. pull SXT from the caller (must have approved this contract beforehand)
        IERC20(SXT).safeTransferFrom(msg.sender, address(this), PAYMENT_AMOUNT);

        // 1. approve payment to be spent by QueryRouter, that will cover PoSQLVerifier's fees and fulfillment callback gas.
        // Note: make sure that the caller address holds at least `PAYMENT_AMOUNT` of SXT.
        IERC20(SXT).forceApprove(QUERY_ROUTER, PAYMENT_AMOUNT); // use forceApprove to handle nonzero allowances

        // 2. Assemble the SQL parameters using the `ParamsBuilder` library
        bytes memory param = ParamsBuilder.varBinaryParam(abi.encodePacked(msg.sender));
        bytes[] memory queryParameters = new bytes[](1);
        queryParameters[0] = param;
        bytes memory serializedParams = ParamsBuilder.serializeParamArray(queryParameters);

        // 3. Assemble the request needed to run the query
        IQueryRouter.Query memory queryToRequest = IQueryRouter.Query({
            version: VERSION, innerQuery: QUERY_PLAN, parameters: serializedParams, metadata: hex""
        });

        // 4. Assemble the information needed to call the callback
        IQueryRouter.Callback memory callback = IQueryRouter.Callback({
            maxGasPrice: MAX_GAS_PRICE,
            gasLimit: GAS_LIMIT,
            callbackContract: address(this),
            selector: IQueryCallback.queryCallback.selector,
            callbackData: ""
        });

        // 5. Execute the query.
        IQueryRouter(QUERY_ROUTER) // aderyn-ignore unchecked-return
            .requestQuery(queryToRequest, callback, PAYMENT_AMOUNT, uint64(block.timestamp + 1 hours));
    }

    /// @notice Example event emitting the query result.
    event QueryFulfilled(uint256 contractCount);

    /// @inheritdoc IQueryCallback
    /// @notice Handle the query result.
    /// @dev This will be called once the query has been executed and verified on-chain.
    function queryCallback(bytes32, bytes calldata queryResult, bytes calldata) external {
        // Use the `ProofOfSqlTable` to deserialize and read data from the result
        (, ProofOfSqlTable.Table memory tableResult) = ProofOfSqlTable.__deserializeFromBytes(queryResult);
        uint256 contractCount = ProofOfSqlTable.readBigIntColumn(tableResult, 0).length;
        // Emit the count.
        emit QueryFulfilled(contractCount);
    }
}
