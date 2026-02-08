// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ParamsBuilder, ProofOfSqlTable} from "sxt-proof-of-sql-contracts/src/PoSQL.sol";
import {IQueryCallback} from "sxt-proof-of-sql-contracts/src/IQueryCallback.sol";
import {IQueryRouter} from "sxt-proof-of-sql-contracts/src/query-router/interfaces/IQueryRouter.sol";

/// @title PoSQLCats
/// @notice Example contract demonstrating a Proof of SQL query with parameterized filters.
/// @dev This contract uses QueryRouter to pay for and execute the query.
/// the query is a SQL query that returns cats filtered by age and gender.
/// note: make sure that the caller holds SXT enough to cover the query payment. Also this is a simple
/// example and does not include zero address checks and other security checks.

/// @dev to deploy this contract, use the DeployPoSQLCats script
contract PoSQLCats is IQueryCallback {
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
    /// select * from CATS_C0A95B8A7EBCAFF89436492A205E98D2E3277B37.CATS WHERE age > $1 and is_female = $2
    bytes public constant QUERY_PLAN =
        hex"00000000000000010000000000000032434154535f433041393542384137454243414646383934333634393241323035453938443245333237374233372e434154530000000000000004000000000000000000000000000000044e414d450000000700000000000000000000000000000003414745000000050000000000000000000000000000000949535f46454d414c45000000000000000000000000000000000000000e4d4554415f5355424d49545445520000000b000000000000000400000000000000044e414d450000000000000003414745000000000000000949535f46454d414c45000000000000000e4d4554415f5355424d4954544552000000000000000000000000000000060000000a0000000000000000000000010000000b00000000000000000000000500000000020000000000000000000000020000000b0000000000000001000000000000000000000004000000000000000000000000000000000000000000000001000000000000000000000002000000000000000000000003";

    constructor(address queryRouter, bytes32 version, address sxt, uint248 amount) {
        QUERY_ROUTER = queryRouter;
        VERSION = version;
        SXT = sxt;
        PAYMENT_AMOUNT = amount;
    }

    /// @notice Pay for and execute a query to get cats by age and gender.
    /// @param minAge The minimum age for cats to return (age > minAge)
    /// @param isFemale Whether to filter for female cats
    function query(int64 minAge, bool isFemale) external {
        // 0. pull SXT from the caller (must have approved this contract beforehand)
        IERC20(SXT).safeTransferFrom(msg.sender, address(this), PAYMENT_AMOUNT);

        // 1. approve payment to be spent by QueryRouter, that will cover PoSQLVerifier's fees and fulfillment callback gas.
        // Note: make sure that the caller address holds at least `PAYMENT_AMOUNT` of SXT.
        IERC20(SXT).forceApprove(QUERY_ROUTER, PAYMENT_AMOUNT); // use forceApprove to handle nonzero allowances

        // 2. Assemble the SQL parameters using the `ParamsBuilder` library
        bytes memory ageParam = ParamsBuilder.bigIntParam(minAge);
        bytes memory genderParam = ParamsBuilder.boolParam(isFemale);
        bytes[] memory queryParameters = new bytes[](2);
        queryParameters[0] = ageParam;
        queryParameters[1] = genderParam;
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
    event QueryFulfilled(uint256 catCount);

    /// @inheritdoc IQueryCallback
    /// @notice Handle the query result.
    /// @dev This will be called once the query has been executed and verified on-chain.
    function queryCallback(bytes32, bytes calldata queryResult, bytes calldata) external {
        // Use the `ProofOfSqlTable` to deserialize and read data from the result
        (, ProofOfSqlTable.Table memory tableResult) = ProofOfSqlTable.__deserializeFromBytes(queryResult);
        // The query returns 4 columns: NAME, AGE, IS_FEMALE, META_SUBMITTER
        uint256 catCount = ProofOfSqlTable.readVarCharColumn(tableResult, 0).length;
        // Emit the count.
        emit QueryFulfilled(catCount);
    }
}
