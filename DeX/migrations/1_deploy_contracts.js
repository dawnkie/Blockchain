const AToken = artifacts.require("tokens/AToken");
const BToken = artifacts.require("tokens/BToken");
const CToken = artifacts.require("tokens/CToken");
const Dai = artifacts.require("tokens/Dai");
const DeX = artifacts.require("DeX");

// truffle 注入对象：deployer, _network, accounts 分别表示部署接口、网络号、初始10个账号
module.exports = async function (deployer, _network, accounts) {
    // 1- 部署合约
    await Promise.all([AToken, BToken, CToken, Dai, DeX].map(contract => deployer.deploy(contract)));
    // 2- 初始环境
    const deX = await DeX.deployed();
    const tokens = await Promise.all([AToken, BToken, CToken, Dai].map(contract => contract.deployed()));
    //  2.1- 初始账户保证一定数量的代币 初始化账户[0-8] (accounts[0]为管理员账户，account[9]为无存款账户)
    const amount = web3.utils.toWei("1000");
    for (const trader of accounts.slice(0, 9)) {
        await Promise.all(
            tokens.map(
                token => token.faucet(trader, amount)
            )
        );
    }
    //  2.2- 为所有代币合约发放许可证
    await Promise.all(tokens.map(token => {
        deX.addLicense(token.address, {from: accounts[0]});
    }));
    //  2.3- 确保流动池中有限价订单(每种代币都创建限价订单/买卖链)
    for (const token of tokens) {
        await token.approve(deX.address, amount, {from: accounts[0]});
        await deX.deposit(token.address, amount, {from: accounts[0]});
    }
    for (let i = 0; i < 10; i++) {
        for (const baseToken of tokens) {
            await Promise.all(
                tokens.filter(token => token.address !== baseToken.address).map(
                    quoteToken => deX.limitOrder(baseToken.address, quoteToken.address, Math.floor(Math.random() * 150 + 1), 100, {from: accounts[0]})
                )
            );
        }
    }
};