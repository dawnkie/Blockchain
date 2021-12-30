// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

contract BToken is ERC20{
    constructor() ERC20('BT', 'B Token') {}

    function faucet(address to, uint amount) external {
        _mint(to, amount);
    }
}
