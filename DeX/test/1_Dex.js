const AToken = artifacts.require("tokens/AToken");
const BToken = artifacts.require("tokens/BToken");
const CToken = artifacts.require("tokens/CToken");
const Dai = artifacts.require("tokens/Dai");
const DeX = artifacts.require("DeX");


contract("`DeX.sol`, test start..", accounts => {
    // console.log(accounts)
    let aToken, bToken, cToken, dai, deX;

    beforeEach("", async () => {
        // console.log("1------beforeEach start 测试`beforeEach`块中所有代码是否在`it`块前执行完毕");
        // [aToken, bToken, cToken, dai, deX] = await Promise.all([AToken, BToken, CToken, Dai, DeX].map(Token => Token.new()));
        [aToken, bToken, cToken, dai, deX] = await Promise.all([AToken, BToken, CToken, Dai, DeX].map(contract => contract.new()));
        // 测试环境
        // DeX发放许可证
        // await 等待其修饰的语句执行结束(若不加该修饰，会导致`it`块与该异步语句同步执行!)
        // Promise.all()：多个Promise一起执行完再回调，其参数为iterable类型
        await Promise.all([aToken, bToken, cToken, dai].map(token => {
            deX.addLicense(token.address, {from: accounts[0]});
        }));
        // 初始化账户[1-8] (accounts[0]为管理员账户，account[9]为无存款账户)
        let amount = web3.utils.toWei("1000");
        const initialBalance = async (trader, token) => {
            await token.faucet(trader, amount);
            await token.approve(deX.address, amount, {from: trader});
            // show info
            // let balance = await token.balanceOf(trader);
            // console.log(trader + " " + token.address + " " + balance.toString() + " beforeEach");
        }
        // await 是修饰子线程 Promise 的，表示等待执行(子线程不加`await`修饰会导致`it`块与该异步语句同步执行!)
        // map() method creates a Array of Promise
        for (const trader of accounts.slice(1, 9)) {
            await Promise.all(
                [aToken, bToken, cToken, dai].map(
                    token => initialBalance(trader, token)
                )
            );
        }
        // console.log("2------beforeEach end 测试`beforeEach`块中所有代码是否在`it`块前执行完毕");
    });

    it('test for `deposit()`, assisted by `getBalanceOf()` and `aToken.balanceOf()`', async () => {
        // console.log("x------it 测试`beforeEach`块中所有代码是否在`it`块前执行完毕");
        // 1- false - isTokenLicensed(_token)
        try {
            await deX.deposit("0x0000000000000000000000000000000000000000", 100, {from: accounts[1]});
        } catch (e) {
            assert(e.reason === "This token does not Exist or License!");
        }
        // 2- AToken→DeX deposit(address _token, uint256 _amount)
        await deX.deposit(aToken.address, 100, {from: accounts[1]});
        // 2.1- DeX内 余额增加
        assert((await deX.getBalanceOf(accounts[1], aToken.address)).toString() === "100");
        // 2.2-  AToken内 余额减少
        let BN = web3.utils.BN;
        assert((await aToken.balanceOf(accounts[1])).toString() === new BN("1000000000000000000000").sub(new BN("100")).toString(), "ERROR")
    });

    it('test for `withdraw()`, assisted by `deposit()`, `getBalanceOf()` and `aToken.balanceOf()`', async () => {
        // 0- 环境准备 预存 AToken→DeX 100
        await deX.deposit(aToken.address, 100, {from: accounts[1]});
        // 1- false - isTokenLicensed(_token)
        try {
            await deX.withdraw("0x0000000000000000000000000000000000000000", 100, {from: accounts[1]});
        } catch (e) {
            assert(e.reason === "This token does not Exist or License!");
        }
        // 2- false - require(balances[msg.sender][_token] >= _amount, "Not sufficient funds!");
        try {
            await deX.withdraw(aToken.address, 10000, {from: accounts[9]});
        } catch (e) {
            assert(e.reason === "Not sufficient funds!");
        }
        // 3- AToken←DeX withdraw(address _token, uint256 _amount)
        await deX.withdraw(aToken.address, 100, {from: accounts[1]});
        // 3.1- DeX内 余额减少
        assert((await deX.getBalanceOf(accounts[1], aToken.address)).toString() === "0");
        // 3.2- AToken内 余额增加
        let BN = web3.utils.BN;
        assert((await aToken.balanceOf(accounts[1])).toString() === new BN("1000000000000000000000").toString())
    });

    it('test for `limitOrder()`, assisted by `deposit()`, `getOrders()` and `getQuoteTokens()`', async function () {
        // 代币余额
        await deX.deposit(dai.address, 100, {from: accounts[1]});
        await deX.deposit(dai.address, 100, {from: accounts[2]});
        await deX.deposit(dai.address, 100, {from: accounts[3]});
        await deX.deposit(dai.address, 100, {from: accounts[4]});
        // 报价出售
        await deX.limitOrder(aToken.address, dai.address, 100, 100, {from: accounts[1]});
        await deX.limitOrder(aToken.address, dai.address, 90, 100, {from: accounts[2]});
        await deX.limitOrder(aToken.address, dai.address, 95, 100, {from: accounts[3]});
        await deX.limitOrder(aToken.address, dai.address, 100, 100, {from: accounts[4]});
        // 结果预测1 getOrders() -  accounts[2](2， 90, 100) → accounts[3](3, 95, 100) → accounts[1](1, 100, 100) → accounts[4](4, 100, 100)
        let result = await deX.getOrders(aToken.address, dai.address);
        assert(result[1][0].baseAmount === "90" && result[1][0].quoteAmount === "100" && result[1][0].latterId === "3", "limitOrder-chain has wrong first-element");
        assert(result[1][1].baseAmount === "95" && result[1][1].quoteAmount === "100" && result[1][1].latterId === "1", "limitOrder-chain has wrong Second-element");
        assert(result[1][2].baseAmount === "100" && result[1][2].quoteAmount === "100" && result[1][2].latterId === "4", "limitOrder-chain has wrong Third-element");
        assert(result[1][3].baseAmount === "100" && result[1][3].quoteAmount === "100" && result[1][3].latterId === "0", "limitOrder-chain has wrong fourth-element");
        assert(result[0].toString() === "2", "limitOrder-chain has wrong `startId`");
        // 结果预测2 getQuoteTokens() - [aToken.address,cToken.address,bToken.address]
        await deX.deposit(cToken.address, 100, {from: accounts[1]});
        await deX.deposit(bToken.address, 100, {from: accounts[1]});

        await deX.limitOrder(aToken.address, cToken.address, 95, 100, {from: accounts[1]});
        await deX.limitOrder(aToken.address, bToken.address, 95, 100, {from: accounts[1]});

        let tokens = await deX.getQuoteTokens(aToken.address);
        assert(tokens[0] === dai.address, "wrong getQuoteTokens()[0] - tokens[0] should be "+dai.address+", but tokens="+tokens+"")
        assert(tokens[1] === cToken.address, "wrong getQuoteTokens()[1] - tokens[1] should be "+cToken.address+", but tokens="+tokens+"")
        assert(tokens[2] === bToken.address, "wrong getQuoteTokens()[2] - tokens[2] should be "+bToken.address+", but tokens="+tokens+"")
    });

    it.only('test for `marketOrder()`, assisted by `deposit()`, `limitOrder()`, `getBalanceOf()`', async function () {
        // 卖家代币余额(dai)
        await deX.deposit(dai.address, 100, {from: accounts[1]});
        await deX.deposit(dai.address, 100, {from: accounts[2]});
        await deX.deposit(dai.address, 100, {from: accounts[3]});
        await deX.deposit(dai.address, 100, {from: accounts[4]});
        // 卖家报价出售(dai)
        await deX.limitOrder(aToken.address, dai.address, 100, 100, {from: accounts[1]});
        await deX.limitOrder(aToken.address, dai.address, 90, 100, {from: accounts[2]});
        await deX.limitOrder(aToken.address, dai.address, 95, 100, {from: accounts[3]});
        await deX.limitOrder(aToken.address, dai.address, 100, 100, {from: accounts[4]});
        // 买家代币余额(aToken)
        await deX.deposit(aToken.address, 200, {from: accounts[5]});
        await deX.deposit(aToken.address, 200, {from: accounts[6]});
        await deX.deposit(aToken.address, 200, {from: accounts[7]});
        await deX.deposit(aToken.address, 200, {from: accounts[8]});
        // 买家购买代币(aToken -> dai)
        await deX.marketOrder(dai.address, aToken.address, 10, {from: accounts[5]});
        await deX.marketOrder(dai.address, aToken.address, 100, {from: accounts[6]});
        await deX.marketOrder(dai.address, aToken.address, 75, {from: accounts[7]});
        await deX.marketOrder(dai.address, aToken.address, 200, {from: accounts[8]});
        // 结果预测
        // 1- 卖家：
        //      (1) DeX aToken - accounts[1] 100， accounts[2] 90， accounts[3] 95， accounts[4] 100
        //      (1) DeX dai - accounts[1] 0， accounts[2] 0， accounts[3] 0， accounts[4] 0
        assert((await deX.getBalanceOf(accounts[1], aToken.address)).toString() === "0" && (await deX.getBalanceOf(accounts[1], dai.address)).toString() === "100", "Wrong balance of accounts[1]");
        assert((await deX.getBalanceOf(accounts[2], aToken.address)).toString() === "0" && (await deX.getBalanceOf(accounts[2], dai.address)).toString() === "90", "Wrong balance of accounts[2]");
        assert((await deX.getBalanceOf(accounts[3], aToken.address)).toString() === "0" && (await deX.getBalanceOf(accounts[3], dai.address)).toString() === "95", "Wrong balance of accounts[3]");
        assert((await deX.getBalanceOf(accounts[4], aToken.address)).toString() === "0" && (await deX.getBalanceOf(accounts[4], dai.address)).toString() === "100", "Wrong balance of accounts[4]");
        // 2- 买家：
        //      (1) DeX aToken - accounts[5] 190， accounts[6] 100， accounts[7] 125， accounts[8] 0
        //      (1) DeX dai - 所有买家支出aToken=385, 得到的总量 = 400
        assert((await deX.getBalanceOf(accounts[5], aToken.address)).toString() === "190", "Wrong balance of accounts[1]");
        assert((await deX.getBalanceOf(accounts[6], aToken.address)).toString() === "100", "Wrong balance of accounts[1]");
        assert((await deX.getBalanceOf(accounts[7], aToken.address)).toString() === "125", "Wrong balance of accounts[1]");
        assert((await deX.getBalanceOf(accounts[8], aToken.address)).toString() === "0", "Wrong balance of accounts[1]");

        let b5 = (await deX.getBalanceOf(accounts[5], dai.address)).toString();
        let b6 = (await deX.getBalanceOf(accounts[6], dai.address)).toString();
        let b7 = (await deX.getBalanceOf(accounts[7], dai.address)).toString();
        let b8 = (await deX.getBalanceOf(accounts[8], dai.address)).toString();
        assert(Number(b5) + Number(b6) + Number(b7) + Number(b8) === 400, "Wrong buyers dai-amount : " + b5 + " " + b6 + " " + b7 + " " + b8 + " ");
    });
})