//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";


contract ENSO_ERC20 is ERC20 {

    constructor (string memory name_, string memory symbol_) ERC20(name_, symbol_) public {}
    function mint(address _account, uint256 _amount) 
        public
    {
        _mint(_account, _amount);
    }
}