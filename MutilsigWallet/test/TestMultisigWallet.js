// [可选]使用`@openzeppelin/test-helpers`测试框架进行断言
const {expectRevert} = require("@openzeppelin/test-helpers");
// 1. 定义合约元件(代表合约文件)
const MultisigWallet = artifacts.require("MultisigWallet");
// 2. 定义合约块(accounts为自动生成的10个测试账号; 块内将用于编写所有测试代码)
contract("MultisigWallet", (accounts) => {
    let wallet;
    // 3. 合约实例化 beforeEach()：该函数会在 每个`it块之前` 执行，相对地还有`afterEach()`
    beforeEach(async () => {
        wallet = await MultisigWallet.new([accounts[0], accounts[1], accounts[2]], 2);
        // 保证合约在操作前有存款
        await web3.eth.sendTransaction({from: accounts[0], to: wallet.address, value: 1e18});
    })
    // 4. it块: 测试合约成员senators和threshold	说明：若仅想执行某个it块，可以使用语法：it.only()
    it("should have correct senators and threshold", async () => {
        const senators = await wallet.getSenators();
        const threshold = await wallet.threshold();
        for (let i = 0; i < senators.length; i++) {
            assert(accounts[i] === senators[i], "[ERROR] senators");
        }
        // 注意：区块链返回的`单独数字`将被包装为BigNumber(BN.js)，返回的`结构体成员数字`将被包装为字符串
        assert(threshold.toString() === "2", "[ERROR] threshold");
    })

    // 5. it块：测试createProposal()和getProposals()
    it("should create a NewProposal", async () => {
        await wallet.createProposal(1e10, accounts[5], {from: accounts[0]});
        await wallet.createProposal(1e10, accounts[5], {from: accounts[0]});
        await wallet.createProposal(1e10, accounts[5], {from: accounts[0]});
        let proposals = await wallet.getProposals();
        // 注意：区块链返回的`单独数字`将被包装为BigNumber(BN.js)，返回的`结构体成员数字`将被包装为字符串
        assert(proposals.length === 3, "[ERROR] proposals.length error");
        assert(proposals[0].amount === "10000000000", "[ERROR] proposal.amount");
        assert(proposals[0].approvers.length === 0, "proposal.approvers.length");
        assert(proposals[0].to === accounts[5], "proposal.approvers.length");
    })

    // 6. it块：测试createProposal()的非权限用户调用
    it("should revert, and return error", async () => {
        try {
            await wallet.createProposal(1e10, accounts[5], {from: accounts[6]});
        } catch (e) {
            assert(e.reason === "You aren't a senator!");
        }
        // 或 [可选]使用`@openzeppelin/test-helpers`测试框架
        await expectRevert(
            wallet.createProposal(1e10, accounts[5], {from: accounts[6]}),
            "You aren't a senator!"
        );
    })

    // 最后 it块：测试 approve()
    it("should be commit proposal with approving", async () => {
        // 新建提案
        await wallet.createProposal(1e10, accounts[5], {from: accounts[0]});

        // 第一个议员投票
        await wallet.approve(0, {from: accounts[0]});
        let proposals = await wallet.getProposals();
        assert(proposals[0].approvers[0] === accounts[0], "[ERROR] proposal.approvers[0] !== accounts[0]");

        // 非议员投票：异常(`@openzeppelin/test-helpers`测试框架)
        await expectRevert(
            wallet.approve(0, {from: accounts[5]}),
            "You aren't a senator!"
        );

        // 第二个议员投票
        await wallet.approve(0, {from: accounts[1]});
        proposals = await wallet.getProposals();
        assert(proposals[0].approvers[1] === accounts[1], "[ERROR] proposal.approvers[1] !== accounts[1]");
        assert(proposals[0].hasPaid === true, "[ERROR] proposal.hasPaid !== true");
    })

})
