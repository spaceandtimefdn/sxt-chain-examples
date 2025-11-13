// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "../libraries/ProofOfSQL.sol";
import {SafeERC20, IERC20} from "@openzeppelin-contracts-5.2.0/token/ERC20/utils/SafeERC20.sol";

contract HelloWorld {
    using SafeERC20 for IERC20;

    // SELECT NAME FROM TUTORIAL_ABC8D709C80262965344F5240AD123F5CBE51123.HELLO_WORLD WHERE LONGITUDE = 60
    bytes public constant QUERY_PLAN =
        hex"0000000000000001000000000000003d5455544f5249414c5f414243384437303943383032363239363533343446353234304144313233463543424535313132332e48454c4c4f5f574f524c440000000000000002000000000000000000000000000000044e414d4500000007000000000000000000000000000000094c4f4e47495455444500000005000000000000000100000000000000044e414d45000000000000000000000000000000020000000000000000000000010000000100000005000000000000003c0000000000000001000000000000000000000000";

    mapping(bytes32 => bool) public pendingQueries;

    function query() external {
        IQueryRouter.Query memory query = IQueryRouter.Query({
            innerQuery: QUERY_PLAN,
            parameters: ParamsBuilder.serializeParamArray(new bytes[](0)),
            version: VERSION,
            metadata: ""
        });

        IQueryRouter.Callback memory callback = IQueryRouter.Callback({
            callbackContract: address(this),
            selector: HelloWorld.queryCallback.selector,
            gasLimit: 100_000,
            maxGasPrice: 10 gwei,
            callbackData: ""
        });

        uint256 paymentAmount = 100 ether;
        IQueryRouter.Payment memory payment = IQueryRouter.Payment({
            paymentAmount: paymentAmount, refundTo: msg.sender, timeout: uint64(block.timestamp + 1 hours)
        });
        IERC20(SXT).safeTransferFrom(msg.sender, address(this), paymentAmount);
        IERC20(SXT).safeIncreaseAllowance(QUERY_ROUTER, paymentAmount);

        bytes32 queryId = IQueryRouter(QUERY_ROUTER).requestQuery(query, callback, payment);

        pendingQueries[queryId] = true;
    }

    event QueryFulfilled(string name);
    error UnauthorizedCaller();

    function queryCallback(bytes32 queryId, bytes calldata queryResult, bytes calldata callbackData) external {
        if (msg.sender != QUERY_ROUTER_EXECUTOR || !pendingQueries[queryId]) revert UnauthorizedCaller();
        delete pendingQueries[queryId];

        (, ProofOfSqlTable.Table memory tableResult) = ProofOfSqlTable.__deserializeFromBytes(queryResult);
        string[] memory names = ProofOfSqlTable.readVarCharColumn(tableResult, 0);
        for (uint256 i = 0; i < names.length; ++i) {
            emit QueryFulfilled(names[i]);
        }
    }
}
