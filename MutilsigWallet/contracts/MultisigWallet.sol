// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MultisigWallet {
    /* 数据结构：
        1. 议员总列表 senators
        2. 至少需要多少人批准才能使提案通过 threshold
        3. 提案结构 NewProposal
        4. 提案总列表 proposals
    */
    address[] senators;
    uint256 public threshold;
    Proposal[] proposals;

    struct Proposal {
        bool hasPaid;
        uint256 amount;
        address to;
        address[] approvers;
    }

    modifier onlySenator(){
        bool isSenator;
        for (uint256 i = 0; i < senators.length; i++) {
            if (senators[i] == msg.sender) {
                isSenator = true;
                break;
            }
        }
        require(isSenator, "You aren't a senator!");
        _;
    }

    constructor (address[] memory _senators, uint256 _threshold) {
        senators = _senators;
        threshold = _threshold;
    }

    function createProposal(uint256 _amount, address _to) onlySenator() external {
        address[] memory _approvers;
        proposals.push(Proposal({hasPaid:false, amount: _amount, to: _to, approvers: _approvers}));
    }

    function approve(uint id) onlySenator() external {
        require(proposals.length > id, "The Proposal doesn't exist!");
        Proposal storage proposal = proposals[id];
        require(proposal.hasPaid == false, "The Proposal has been paid!");
        address[] storage approvers = proposal.approvers;
        for (uint256 i = 0; i < approvers.length; i++) {
            require(approvers[i] != msg.sender, "You already have approved!");
        }
        approvers.push(msg.sender);
        if (approvers.length >= threshold) {
            proposal.hasPaid = true;
            payable(proposal.to).transfer(proposal.amount);
        }
    }

    function getSenators() view external returns (address[] memory) {
        return senators;
    }

    function getProposals() view external returns (Proposal[] memory) {
        return proposals;
    }

    receive() external payable {}

    fallback() external payable {}

}