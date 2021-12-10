import { ethers } from "hardhat";
import { expect } from "chai";
import { BigNumber, Contract, ContractFactory, Signer } from "ethers";
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'

describe('vesting', () => {
    let accounts: SignerWithAddress[],
        MockERC20: ContractFactory,
        erc20: Contract,
        Vesting: ContractFactory,
        vesting: Contract,
        treasury: SignerWithAddress,
        attacker: SignerWithAddress,
        vesters: any,
        start: BigNumber,
        end: BigNumber,
        total: BigNumber,
        each: BigNumber,
        rewardSecond : BigNumber,
        duration: BigNumber

    before(async () => {        
        accounts = await ethers.getSigners()
        treasury = accounts[0]
        attacker = accounts[10]
        total = await ethers.utils.parseEther("10")
        each = await ethers.utils.parseEther("4")

        MockERC20 = await ethers.getContractFactory("ENSO_ERC20");
        Vesting = await ethers.getContractFactory("Vesting");
    });

    const initialize = async (name:string, tests:any) => {
        describe(name, () => {
            before(async () => {
                start = await getTime()
                erc20 = await MockERC20.deploy('name', 'symbol')
                vesting = await Vesting.deploy(erc20.address, treasury.address)
                duration = BigNumber.from(1000)
                end = start.add(duration)
                vesters = [
                    {"v": accounts[1], "s": start, "u": end, "a": each },
                    {"v": accounts[2], "s": start, "u": end, "a": each }
                ]
                rewardSecond = each.div(duration)
            });
            tests();
        });
    }

    const approval = async (name:string, tests:any) => {
        describe(name, () => {
            before(async () => {
                await erc20.mint(treasury.address, total)
                await erc20.approve(vesting.address, total)
            });
            tests();
        });
    }
 
    initialize('deployed', () => {
        describe('initialized', () => {
            it('enso token', async () => {
                expect(await vesting.enso_token()).to.equal(erc20.address)
            });
            it('treasury', async () => {
                expect(await vesting.treasury()).to.equal(treasury.address)
            });
            it('owner set', async () => {
                expect(await vesting.owner()).to.equal(treasury.address)
            });
        });
        describe('single actions', () => {
            let vester: String;
            before(async () => {
                vester = (vesters[0].v).address;
            });
            describe('register', () => {
                initialize('non-functional', () => {
                    approval('once approved', () => {
                        before(async () => {
                            await vesting.register(vester, vesters[0].s, vesters[0].u, vesters[0].a)
                        });
                        it('revert already registered', async () => {
                            await expect(vesting.register(vester, vesters[0].s, vesters[0].u, vesters[0].a))
                            .to.be.revertedWith('Vesting#register: already registered')
                        })
                    })
                    it('revert not owner', async () => {
                        await expect(vesting.connect(attacker).register(vester, vesters[0].s, vesters[0].u, vesters[0].a))
                        .to.be.revertedWith('Ownable: caller is not the owner')
                    });
                    it('revert allocated not greater than 0', async () => {
                        await expect(vesting.register(vester, vesters[0].s, vesters[0].u, 0))
                        .to.be.revertedWith('Vesting#register: allocated not greater than 0')
                    });
                    it('revert start not greater than 0', async () => {
                        await expect(vesting.register(vester, 0, vesters[0].u, vesters[0].a))
                        .to.be.revertedWith('Vesting#register: start not greater than 0')
                    });
                    it('revert unlock not greater than start', async () => {
                        await expect(vesting.register(vester, vesters[0].s, 100, vesters[0].a))
                        .to.be.revertedWith('Vesting#register: not greater than start')
                    });
                })
                initialize('non-functional', () => {
                    approval('once approved', () => {
                        before(async () => {
                            await vesting.register(vester, vesters[0].s, vesters[0].u, vesters[0].a)
                        });
                        it('start set', async () => {
                            expect(await vesting.getStart(vester)).to.equal(start)
                        });
                        it('last set', async () => {
                            expect(await vesting.getLast(vester)).to.equal(start)
                        });
                        it('unlock set', async () => {
                            expect(await vesting.getUnlock(vester)).to.equal(vesters[0].u)
                        });
                        it('claimed', async () => {
                            expect(await vesting.getClaimed(vester)).to.equal(0)
                        });
                        it('allocated', async () => {
                            expect(await vesting.getAllocated(vester)).to.equal(vesters[0].a)
                        });
                    });
                })
            });
            initialize('claim', () => {
                describe('non-functional', () => {
                    it('not registered', async () => {
                        await expect(vesting.connect(attacker).claim())
                        .to.be.revertedWith('Vesting#onlyRegistered: not registered')
                    });
                });
                approval('functional-approval', () => {
                    let reward: BigNumber;
                    let last: BigNumber;
                    before(async () => {
                        await vesting.register(vester, vesters[0].s, vesters[0].u, vesters[0].a)
                        await increaseTime(Number(duration)/2)
                    });
                    describe('less than unlock time', () => {
                        before(async () => {
                            reward = rewardSecond.mul((await getTime()).sub(start))
                        });
                        it('claimable amount', async () => {
                            expect(await vesting.getClaimable(vester)).to.equal(reward)
                        });
                        describe('claimed', () => {
                            let last: BigNumber;
                            before(async () => {
                                await vesting.connect(vesters[0].v).claim()
                                reward = rewardSecond.mul((await getTime()).sub(start))
                                last = await getTime()
                            });
                            it('balance updated', async () => {
                                expect(await erc20.balanceOf(vester)).to.equal(reward)
                            });
                            it('approval updated', async () => {
                                expect(await erc20.allowance(treasury.address, vesting.address)).to.equal((total.sub(reward)))
                            });
                            it('last updated', async () => {
                                expect(await vesting.getLast(vester)).to.equal(last)
                            });
                            it('claimed updated', async () => {
                                expect(await vesting.getClaimed(vester)).to.equal(reward)
                            });
                        });
                    });
                    describe('great than unlock time', async () => {
                        before(async () => {
                            await increaseTime(Number(duration))
                        });
                        describe('claim', () => {
                            before(async () => {
                                await vesting.connect(vesters[0].v).claim()
                                reward = rewardSecond.mul((await getTime()).sub(start))
                                last = await getTime()
                            });
                            it('balance updated', async () => {
                                expect(await erc20.balanceOf(vester)).to.equal(each)
                            });
                            it('approval updated', async () => {
                                expect(await erc20.allowance(treasury.address, vesting.address)).to.equal(total.sub(each))
                            });
                            it('last deleted', async () => {
                                expect(await vesting.getLast(vester)).to.equal(0)
                            });
                            it('claimed deleted', async () => {
                                expect(await vesting.getClaimed(vester)).to.equal(0)
                            });
                        });
                    });
                });
            });
            initialize('unregister', () => {
                describe('non-functional', () => {
                    it('revert not registered', async () => {
                        await expect(vesting.unregister(vester))
                        .to.be.revertedWith('Vesting#onlyRegistered: not registered')
                    });
                });
                describe('functional', () => {
                    before(async () => {
                        await vesting.register(vester, vesters[0].s, vesters[0].u, vesters[0].a)
                    });
                    approval('when registered', () => {
                        let balance : BigNumber;
                        before(async () => {
                            balance = await erc20.balanceOf(treasury.address)
                            await vesting.unregister(vester);
                        });
                        it('user deleted', async () => {
                            expect(await vesting.getLast(vester)).to.equal(0)
                        });
                        it('approval updated', async () => {
                            expect(await erc20.allowance(treasury.address, vesting.address)).to.equal(total.sub(each))
                        });
                        it('balance updated', async () => {
                            expect(await erc20.allowance(treasury.address, vesting.address)).to.equal(total.sub(each))
                        });
                    });
                });
            });
            initialize('updateTreasury', () => {
                describe('non-functional', () => {
                    it('revert not from owner', async () => {
                        await expect(vesting.connect(attacker).updateTreasury(accounts[3].address))
                        .to.be.revertedWith('Ownable: caller is not the owner')
                    });
                });
                describe('functional', () => {
                    before(async () => {
                        await vesting.updateTreasury(accounts[3].address)
                    });
                    it('address updated', async () => {
                        expect(await vesting.treasury()).to.equal(accounts[3].address)
                    });
                });
            })
        })
    })

    const increaseTime = async (seconds: Number) => {
        await ethers.provider.send("evm_increaseTime", [seconds])
        await ethers.provider.send("evm_mine", [])
    }

    const getTime = async () => {
        let block = await ethers.provider.getBlock(
            await ethers.provider.getBlockNumber()
            )
        return ethers.BigNumber.from(block.timestamp)
    }
})