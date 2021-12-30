// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

//import './IERC20.sol';
//import "./PRBMathUD60x18.sol";
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import "prb-math/contracts/PRBMathUD60x18.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract DeX {
    using PRBMathUD60x18 for uint256;
    /* 数据结构：
        1. 稳定货币 Stable Currencies
        2. 普通货币 Plebeian currencies
        3. 订单账本 orderBook
        4. 订单 order
        5. 管理员 admin
    */
    mapping(address => mapping(address => uint256)) public balances;
    mapping(address => mapping(address => uint256)) tokens;
    mapping(address => bool) licenses;
    address admin;

    // 交易订单
    // baseToken=>quoteTokens=>orderBooks=>id=>Order
    mapping(address => OrderPool) orderPools;

    // 1 - 115792089237316195423570985008687907853269984665640564039457584007913129639935
    uint256 nextId;

    struct OrderPool {
        address[] quoteTokens;
        mapping(address => OrderBook) orderBooks;
    }

    struct OrderBook {
        uint256 startId;
        mapping(uint256 => Order) orders;
    }
    // Order：单向链表
    struct Order {
        uint256 latterId;
        uint256 baseAmount;     // 期望获得
        uint256 quoteAmount;    // 实际出价
        uint256 date;
        uint256 filled;
        address owner;
    }

    //    // 流动池 自动做市商 constant(K)=X*Y price=X/Y 注意：decimals()设计的初衷是`off-chain`
    //    // liquidityPools=>quoteTokens=>liquidityBooks=>pairs
    //    mapping(address => LiquidityPool) liquidityPools;
    //
    //    struct LiquidityPool {
    //        address[] quoteTokens;
    //        mapping(address => LiquidityBook) liquidityBooks;
    //    }
    //    // uint256为首元素的Id，uint256为下个元素的Id，uint256[2]为baseToken总量，uint256[3]为quoteToken总量, uint256[4]是K
    //    struct LiquidityBook {
    //        uint256[5] startId;
    //        mapping(uint256 => Pair) pairs;
    //    }
    //    // LP(latterId,baseAmount,date,quoteAmount,owner)
    //    struct Pair {
    //        uint256 latterId;
    //        uint256 baseAmount;
    //        uint256 date;
    //        uint256 quoteAmount;
    //        address owner;
    //    }



    // 构造函数
    constructor(){
        admin = msg.sender;
        nextId = 1;
    }

    // 是否为管理员
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only Admin");
        _;
    }

    // 查询余额
    function getBalanceOf(address _user, address _contract) view external returns (uint256){
        return balances[_user][_contract];
    }

    // 查询P数组
    function getQuoteTokens(address _baseToken) view external returns (address[] memory){
        return orderPools[_baseToken].quoteTokens;
    }

    // 查询LP对
    function getOrders(address _baseToken, address _quoteToken) view external returns (uint256, Order[] memory){
        mapping(uint256 => Order) storage orders = orderPools[_baseToken].orderBooks[_quoteToken].orders;
        // 计算订单链表的长度
        uint256 len;
        uint256 iteratorId = orderPools[_baseToken].orderBooks[_quoteToken].startId;
        while (true) {
            if (iteratorId == 0) {
                break;
            }
            len ++;
            iteratorId = orders[iteratorId].latterId;
        }
        // 数组打包订单链表
        Order[] memory ordersList = new Order[](len);
        iteratorId = orderPools[_baseToken].orderBooks[_quoteToken].startId;
        for (uint256 i = 0; i < len; i++) {
            ordersList[i] = orders[iteratorId];
            iteratorId = orders[iteratorId].latterId;
        }
        return (orderPools[_baseToken].orderBooks[_quoteToken].startId, ordersList);
    }

    // 发放许可证
    function addLicense(address _token) onlyAdmin() public {
        require(licenses[_token] == false, "Already License!");
        licenses[_token] = true;
    }

    // 是否有许可证
    modifier isTokenLicensed(address _token) {
        require(licenses[_token] == true, "This token does not Exist or License!");
        _;
    }

    // 存款 → DeX
    function deposit(address _token, uint256 _amount) isTokenLicensed(_token) external {
        IERC20(_token).transferFrom(msg.sender, address(this), _amount);
        balances[msg.sender][_token] += _amount;
    }

    // DeX → 取款
    function withdraw(address _token, uint256 _amount) isTokenLicensed(_token) external {
        require(balances[msg.sender][_token] >= _amount, "Not sufficient funds!");
        balances[msg.sender][_token] -= _amount;
        IERC20(_token).transfer(msg.sender, _amount);
    }

    // 流动性
    // 限价委托[_baseToken][_quoteToken] (付出)_quoteToken →(期望) _baseToken
    function limitOrder(address _baseToken, address _quoteToken, uint256 _baseAmount, uint256 _quoteAmount) external {
        require(_baseToken != _quoteToken, "Must be diff Tokens");
        require(_quoteAmount > 0 || _baseAmount > 0, _quoteAmount == 0 ? "illegal _quoteAmount!" : "illegal _baseAmount!");
        require(balances[msg.sender][_quoteToken] >= _quoteAmount, "Not sufficient Balance!");
        // 扣除余额
        balances[msg.sender][_quoteToken] -= _quoteAmount;
        // 新订单
        Order memory newOrder;
        newOrder.owner = msg.sender;
        newOrder.baseAmount = _baseAmount;
        newOrder.quoteAmount = _quoteAmount;
        newOrder.date = block.timestamp;
        mapping(uint256 => Order) storage orders = orderPools[_baseToken].orderBooks[_quoteToken].orders;
        // 创建订单
        // 价格计算：K1 = A/B k2=A%B
        uint256 sizeK1;
        uint256 _sizeK1 = _quoteAmount / _baseAmount;
        uint256 _sizeK2 = _quoteAmount % _baseAmount;
        // 升序：(_sizeK1值越大代表卖价越低)卖价低的排在前
        uint256 formerId;
        uint256 iteratorId = orderPools[_baseToken].orderBooks[_quoteToken].startId;
        while (iteratorId != 0) {
            sizeK1 = orders[iteratorId].quoteAmount / orders[iteratorId].baseAmount;
            if (_sizeK1 > sizeK1 || (_sizeK1 == sizeK1 && _sizeK2 > orders[iteratorId].quoteAmount % orders[iteratorId].baseAmount)) {
                if (iteratorId == orderPools[_baseToken].orderBooks[_quoteToken].startId) {
                    // 若`迭代子`是首元素，则更新`新订单`指针，并记录`新订单`为首订单
                    newOrder.latterId = iteratorId;
                    orderPools[_baseToken].orderBooks[_quoteToken].startId = nextId;
                } else {
                    // 若`迭代子`不是首元素，则更新`前订单`和`新订单`的指针
                    orders[formerId].latterId = nextId;
                    newOrder.latterId = iteratorId;
                }
                break;
            }
            formerId = iteratorId;
            iteratorId = orders[iteratorId].latterId;
        }
        // 首笔限价委托：if startId 等于初始值`0`
        if (orderPools[_baseToken].orderBooks[_quoteToken].startId == 0) {
            orderPools[_baseToken].orderBooks[_quoteToken].startId = nextId;
            // 如果该quoteToken未记录，则记录
            bool isExist;
            address[] storage quoteTokens = orderPools[_baseToken].quoteTokens;
            for (uint256 i = 0; i < quoteTokens.length; i++) {
                if (quoteTokens[i] == _quoteToken) {
                    isExist = true;
                }
            }
            if (!isExist) {
                quoteTokens.push(_quoteToken);
            }
        } else {
            // 链尾判断：若抵达链表尾部，则将新订单置为新链尾
            if (iteratorId == 0) {
                orders[formerId].latterId = nextId;
            }
        }
        // 记录
        orders[nextId++] = newOrder;
    }

    // 市场交易[_quoteToken][_baseToken] (付出)_quoteToken →(立即) _baseToken
    function marketOrder(address _baseToken, address _quoteToken, uint256 _quoteAmount) external {
        require(balances[msg.sender][_quoteToken] >= _quoteAmount, "Not sufficient Balance of _quoteToken!");
        require(orderPools[_quoteToken].orderBooks[_baseToken].startId != 0, "No Sellers!");
        // 取出卖方订单列表(默认按价格升序)
        mapping(uint256 => Order) storage orders = orderPools[_quoteToken].orderBooks[_baseToken].orders;
        // 订单交易，删除已完成订单
        uint256 available;
        uint256 consume;
        uint256 remaining = _quoteAmount;
        uint256 iteratorId = orderPools[_quoteToken].orderBooks[_baseToken].startId;
        uint256 tempId;
        while (iteratorId != 0) {
            // _quoteToken ←~ (q-f)/q*b QuoteToken
            consume = (orders[iteratorId].quoteAmount - orders[iteratorId].filled).fromUint().div(orders[iteratorId].quoteAmount.fromUint()).mul(orders[iteratorId].baseAmount.fromUint()).toUint();
            if (remaining > consume) {
                // 更新发起账户
                balances[msg.sender][_quoteToken] -= consume;
                balances[msg.sender][_baseToken] += orders[iteratorId].quoteAmount - orders[iteratorId].filled;
                // 更新限价委托
                balances[orders[iteratorId].owner][_baseToken] += consume;

                remaining -= consume;

                tempId = iteratorId;
                iteratorId = orders[iteratorId].latterId;
                delete orders[tempId];
            } else {
                // _quoteToken ~→ (q-f)/q*b QuoteToken
                available = remaining.fromUint().div(orders[iteratorId].baseAmount.fromUint()).mul(orders[iteratorId].quoteAmount.fromUint()).toUint();
                // 更新发起账户
                balances[msg.sender][_quoteToken] -= remaining;
                balances[msg.sender][_baseToken] += available;
                // 更新限价委托
                balances[orders[iteratorId].owner][_baseToken] += remaining;

                if (orders[iteratorId].filled + available == orders[iteratorId].quoteAmount) {
                    orderPools[_quoteToken].orderBooks[_baseToken].startId = orders[iteratorId].latterId;
                    delete orders[iteratorId];
                } else {
                    orders[iteratorId].filled += available;
                    orderPools[_quoteToken].orderBooks[_baseToken].startId = iteratorId;
                }
                return;
            }
        }
        if (iteratorId == 0) {
            orderPools[_quoteToken].orderBooks[_baseToken].startId = 0;
        }
    }
}
