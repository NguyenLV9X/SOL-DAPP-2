let Auction = artifacts.require('./Auction.sol');

let auctionInstance;

contract('AuctionContract', function(accounts) {

    //accounts[0] is the default account
    describe('Contract deployment', function() {

        it('Contract deployment', function() {
            //Fetching the contract instance of our smart contract
            return Auction.deployed().then(function(instance) {
                //We save the instance in a global variable and all smart contract functions are called using this
                auctionInstance = instance;
                assert(
                    auctionInstance !== undefined,
                    'Auction contract should be defined'
                );
            });
        });

        it('Initial rule with corrected startingPrice and minimumStep', function() {
            //Fetching the rule of Auction
            return auctionInstance.rule().then(function(rule) {
                //We save the instance in a global variable and all smart contract functions are called using this
                assert(rule !== undefined, 'Rule should be defined');
                assert.equal(rule.startingPrice, 50, 'Starting price should be 50');
                assert.equal(rule.minimumStep, 5, 'Minimum step should be 5');
            });
        });

    });


    describe('Register', function() {

        it('Only Auctioneer can register bidders', function() {
            return auctionInstance.register(accounts[1], 100, { from: accounts[0] }).then(function() {
                return auctionInstance.register(accounts[2], 100, { from: accounts[1] }).then(function() {
                    throw ("Failed to check Auctioneer in register");
                }).catch(function(e) {
                    if (e === "Failed to check Auctioneer in register bidders") {
                        assert(false);
                    } else {
                        assert(true);
                    }
                });
            });
        });

        it('This action is only available in Created State', function() {
            return auctionInstance.state().then(function(state) {
                return auctionInstance.register(accounts[2], 100, { from: accounts[0] }).then(function() {
                    assert.equal(state, 0, 'register is only available in Created State');
                });
            });
        });

        it('When register, the account address and the number of tokens need to be inputted', function() {
            return auctionInstance.register(accounts[3], 100, { from: accounts[0] }).then(function() {
                return auctionInstance.register({ from: accounts[0] }).then(function() {
                    throw ("Failed to check inputted");
                }).catch(function(e) {
                    if (e === "Failed to check inputted") {
                        assert(false);
                    } else {
                        assert(true);
                    }
                });
            });
        });

    });

    describe('Start the session', function() {

        it('Only Auctioneer can start the session', function() {
            return auctionInstance.startSession({ from: accounts[1] }).then(function() {
                throw ("Failed to check Auctioneer in startSession");
            }).catch(function(e) {
                if (e === "Failed to check Auctioneer in startSession") {
                    assert(false);
                } else {
                    assert(true);
                }
            });
        });

        it("The action is only avaiable in Created State", function() {
            return auctionInstance.state().then(function(state) {
                return auctionInstance.startSession({ from: accounts[0] }).then(function() {
                    assert.equal(state, 0, 'startSession is only available in Created State');
                })
            });
        });

    });

    describe('Bid', function() {

        it('All the Bidders can bid', function() {
            return auctionInstance.bid(55, { from: accounts[3] }).then(function() {
                return auctionInstance.bid(60, { from: accounts[1] }).then(function() {
                    return auctionInstance.bid(65, { from: accounts[5] }).then(function() {
                        throw ("Failed to check all the Bidders can bid");
                    }).catch(function(e) {
                        if (e === "Failed to check all the Bidders can bid") {
                            assert(false);
                        } else {
                            assert(true);
                        }
                    });
                });
            });
        });

        it("This action is only available in Started State", function() {
            return auctionInstance.state().then(function(state) {
                return auctionInstance.bid(65, { from: accounts[2] }).then(function() {
                    assert.equal(state, 1, 'bid is only available in Started State');
                });
            });
        });

        it("The next price must be inputted", function() {
            return auctionInstance.bid({ from: accounts[1] }).then(function() {
                throw ("Failed to check inputted");
            }).catch(function(e) {
                if (e === "Failed to check inputted") {
                    assert(false);
                } else {
                    assert(true);
                }
            });
        });

        it("The next price must higher than the latest price plus the minimum step", function() {
            return auctionInstance.rule().then(function(rule) {
                return auctionInstance.bid(70, { from: accounts[2] }).then(function() {
                    return auctionInstance.currentPrice().then(function(currentPrice) {
                        let newPrice = 70 + Number(rule.minimumStep);
                        if (newPrice >= Number(currentPrice) + Number(rule.minimumStep)) {
                            assert(true);
                        } else {
                            assert(false);
                        }
                        return auctionInstance.bid(newPrice, { from: accounts[2] });
                    });
                });
            });
        });

    });

    describe('Announce', function() {

        it('Only Auctioneer can announce', function() {
            return auctionInstance.announce({ from: accounts[1] }).then(function() {
                throw ("Failed to check Auctioneer in announce");
            }).catch(function(e) {
                if (e === "Failed to check Auctioneer in announce") {
                    assert(false);
                } else {
                    assert(true);
                }
            });
        });

        it("This action is only available in Started State", function() {
            return auctionInstance.state().then(function(state) {
                return auctionInstance.announce({ from: accounts[0] }).then(function() {
                    assert.equal(state, 1, 'announce is only available in Started State');
                });
            });
        });

        it("After 3 times (4th call of this action), the session will end", function() {
            return auctionInstance.bid(80, { from: accounts[1] }).then(function() {
                return auctionInstance.announce({ from: accounts[0] }).then(function() {
                    return auctionInstance.announce({ from: accounts[0] }).then(function() {
                        return auctionInstance.announce({ from: accounts[0] }).then(function() {
                            return auctionInstance.announce({ from: accounts[0] }).then(function() {
                                return auctionInstance.state().then(function(state) {
                                    assert.equal(state, 2, 'switch session to closing state');
                                });
                            });
                        });
                    });
                });
            });
        });

    });

    describe('Get back the deposit', function() {

        it("All the Bidders (except the Winner) can Get back the deposit", function() {
            return auctionInstance.getDeposit({ from: accounts[2] }).then(function() {
                return auctionInstance.getDeposit({ from: accounts[1] }).then(function() {
                    throw ("Failed to except the Winner");
                }).catch(function(e) {
                    if (e === "Failed to except the Winner") {
                        assert(false);
                    } else {
                        assert(true);
                    }
                });
            });
        });

        it("This action is only available in Closing State", function() {
            return auctionInstance.state().then(function(state) {
                return auctionInstance.getDeposit({ from: accounts[3] }).then(function() {
                    assert.equal(state, 2, 'getDeposit is only available in Closing State');
                });
            });
        });

    });
});