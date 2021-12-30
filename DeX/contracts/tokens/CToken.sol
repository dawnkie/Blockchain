// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

contract CToken is ERC20{
    constructor() ERC20('CT', 'C Token') {}

    function faucet(address to, uint amount) external {
        _mint(to, amount);
    }
}
