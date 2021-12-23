const MultisigWallet = artifacts.require("MultisigWallet");

// truffle 注入对象：deployer, _network, accounts 分别表示部署者、网络号、初始10账号
module.exports = async function (deployer, _network, accounts) {
    // 部署合约(执行合约构造函数)
    await deployer.deploy(MultisigWallet, [accounts[0], accounts[1], accounts[2]], 2);
    // 合约实例化
    const wallet = await MultisigWallet.deployed();
    // 保证合约在操作前有存款
    await web3.eth.sendTransaction({from: accounts[0], to: wallet.address, value: 1e18});
};
