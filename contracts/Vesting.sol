//SPDX-License-Identifier: Unlicense
/***
 *                               ______     __   __     ______     ______                                  
 *                              /\  ___\   /\ "-.\ \   /\  ___\   /\  __ \                                 
 *                              \ \  __\   \ \ \-.  \  \ \___  \  \ \ \/\ \                                
 *                               \ \_____\  \ \_\\"\_\  \/\_____\  \ \_____\                               
 *                                \/_____/   \/_/ \/_/   \/_____/   \/_____/                               
 */

pragma solidity ^0.8.0;

import { SafeERC20, IERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


contract Vesting is Ownable {
    using SafeERC20 for IERC20;
    
    struct Vest {
        bool registered;    // has registered
        uint32 start;       // starting time of vesting
        uint32 last;        // last time claimed
        uint32 unlock;      // time of unlock
        uint128 claimed;    // total tokens claimed
        uint128 allocated;  // total tokens allocated
    }

    address public treasury;
    IERC20 public immutable enso_token;
    mapping (address => Vest) public vester;

    event UpdatedTreasury(address treasury);
    event Claimed(address vester, uint128 amount);
    event Registered(address vestor, uint32 unlock, uint128 allocated);
    event Unregistered(address vester, address treasury, uint128 amount);

    /**
    * @dev Require vester registered
    */
    modifier onlyRegistered(address _vester) {
        require(getRegistered(_vester), "Vesting#onlyRegistered: not registered");
        _;
    }

    constructor(IERC20 _enso, address _treasury) 
        public 
        Ownable() 
    {
        enso_token = _enso;
        treasury = _treasury;
    }

    function claim()
        external
        onlyRegistered(msg.sender)
    {
        uint128 amount;
        if(block.timestamp >= getUnlock(msg.sender)){
            amount = getRemaining(msg.sender);
            delete vester[msg.sender];
        }
        else {
            amount = getClaimable(msg.sender);
            vester[msg.sender].last = uint32(block.timestamp);
            vester[msg.sender].claimed += uint128(amount);
        }

        enso_token.safeTransferFrom(treasury, msg.sender, amount);
        emit Claimed(msg.sender, amount);
    }

    function register(address _vester, uint32 _start, uint32 _unlock, uint128 _allocated)
        public
        onlyOwner
    {
        _register(_vester, _start, _unlock, _allocated);
    }

    function unregister(address _vester) 
        public
        onlyOwner
    {
        _unregister(_vester);
    }

    function batchUnregister(address[] memory _vesters) 
        external
        onlyOwner
    {
        for (uint256 i = 0; i < _vesters.length; i++) {
            _unregister(_vesters[i]);
        }
    }

    function batchRegister(address[] memory _vesters, uint32[] memory _start, uint32[] memory _unlock, uint128[] memory _allocated)
        external
        onlyOwner
    {
        require(_vesters.length == _unlock.length, "Vesting#BatchRegister: incorrect length");
        require(_vesters.length == _allocated.length, "Vesting#BatchRegister: incorrect length");
        for (uint256 i = 0; i < _vesters.length; i++) {
            _register(_vesters[i], _start[i], _unlock[i], _allocated[i]);
        }
    }

    function updateTreasury(address _treasury)
        public
        onlyOwner
    {
        treasury = _treasury;
        emit UpdatedTreasury(_treasury);
    }

    function _unregister(address _vester)
        internal
        onlyRegistered(_vester)
    {
        uint128 amount = getRemaining(_vester);
        delete vester[_vester];

        enso_token.safeTransferFrom(treasury, treasury, amount);
        emit Unregistered(_vester, treasury, amount);
    }

    function _register(address _vester, uint32 _start, uint32 _unlock, uint128 _allocated)
        internal
    {
        require(_allocated > 0, "Vesting#register: allocated not greater than 0");
        require(_start > 0, "Vesting#register: start not greater than 0");
        require(_unlock > _start, "Vesting#register: not greater than start");
        require(!getRegistered(_vester), "Vesting#register: already registered");
        vester[_vester] = Vest({
            registered: true,
            start: _start,
            last: _start,
            unlock: _unlock,
            claimed: 0,
            allocated: _allocated
        });
        emit Registered(_vester, _unlock, _allocated);
    }

    function getClaimable(address _vester)
        public
        view
        returns(uint128)
    {
        return
        uint128(
            (
                (block.timestamp - getLast(_vester)) * getAllocated(_vester)) 
                / (getUnlock(_vester) - getStart(_vester)
            )
        );
    }

    function getRemaining(address _vester) 
        public
        view
        returns(uint128)
    {
        return getAllocated(_vester) - getClaimed(_vester);
    }

    function getStart(address _vester)
        public
        view
        returns(uint32)
    {
        return vester[_vester].start;
    }

    function getLast(address _vester)
        public
        view
        returns(uint32)
    {
        return vester[_vester].last;
    }

    function getUnlock(address _vester) 
        public
        view
        returns(uint32)
    {
        return vester[_vester].unlock;
    }

    function getAllocated(address _vester)
        public
        view
        returns(uint128)
    {
        return vester[_vester].allocated;
    }

    function getClaimed(address _vester) 
        public
        view
        returns(uint128)
    {
        return vester[_vester].claimed;
    }

    function getRegistered(address _vester) 
        public
        view
        returns(bool)
    {
        return vester[_vester].registered;
    }
}