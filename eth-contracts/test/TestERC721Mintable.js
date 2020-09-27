var ERC721MintableComplete = artifacts.require('CustomERC721Token');

contract('TestERC721Mintable', accounts => {

    const account_one = accounts[0];
    const account_two = accounts[1];

    let tokenId1 = 10;
    let tokenId2 = 11;
    let tokenId3 = 12;

    describe('match erc721 spec', function () {
        beforeEach(async function () {
            this.contract = await ERC721MintableComplete.new({ from: account_one });

            // TODO: mint multiple tokens
            await this.contract.mint(account_two, tokenId1);
            await this.contract.mint(accounts[2], tokenId2);
            await this.contract.mint(accounts[3], tokenId3);
        })

        it('should return total supply', async function () {
            let totalSupply = await this.contract.totalSupply.call();

            assert.equal(totalSupply, 3, "Total supply doesn't match");
        })

        it('should get token balance', async function () {
            let balance1 = await this.contract.balanceOf.call(account_two);
            let balance2 = await this.contract.balanceOf.call(accounts[2]);
            let balance3 = await this.contract.balanceOf.call(accounts[3]);

            assert.equal(balance1, 1, "Token balance doesn't match");
            assert.equal(balance2, 1, "Token balance doesn't match");
            assert.equal(balance3, 1, "Token balance doesn't match");
        })

        // token uri should be complete i.e: https://s3-us-west-2.amazonaws.com/udacity-blockchain/capstone/1
        it('should return token uri', async function () {
            let baseTokenURI = "https://s3-us-west-2.amazonaws.com/udacity-blockchain/capstone/";

            let tokenURI1 = await this.contract.tokenURI.call(tokenId1);
            let tokenURI2 = await this.contract.tokenURI.call(tokenId2);
            let tokenURI3 = await this.contract.tokenURI.call(tokenId3);

            assert.equal(tokenURI1, baseTokenURI + tokenId1, "Token uri must be of specified format");
            assert.equal(tokenURI2, baseTokenURI + tokenId2, "Token uri must be of specified format");
            assert.equal(tokenURI3, baseTokenURI + tokenId3, "Token uri must be of specified format");

        })

        it('should transfer token from one owner to another', async function () {
            let originalOwner = await this.contract.ownerOf.call(tokenId1);
            await this.contract.transferFrom(originalOwner, accounts[2], tokenId1, { from: account_two });
            let newOwner = await this.contract.ownerOf.call(tokenId1);

            assert.equal(originalOwner, account_two, "Token owner doesn't match for the specified token id");
            assert.equal(newOwner, accounts[2], "New token owner doesn't match with the specified token id");
        })
    });

    describe('have ownership properties', function () {
        beforeEach(async function () { 
            this.contract = await ERC721MintableComplete.new({ from: account_one });
        })

        it('only contract owner should be able to pause/unpause contract', async function () {
            let txOne = true;
            try {
                await this.contract.setPause(true, { from: account_two });
            } catch (e) {
                txOne = false;
            }

            let txTwo = true;
            try {
                await this.contract.setPause(true, { from: account_one });
            } catch (e) {
                txTwo = false;
            }

            assert.equal(txOne, false, "Only owner should be able to pause/unpause contract");
            assert.equal(txTwo, true, "Owner should be able to pause/unpause contract");
        })

        it('should fail when minting when address is not contract owner', async function () { 
            let failed = false;
            try {
                await this.contract.mint(account_two, tokenId1, { from: accounts[3] });
            } catch (e) {
                failed = true;
            }

            assert.equal(failed, true, "Minting should fail when address is not contract owner");
        })

        it('should return contract owner', async function () { 
            let contractOwner = await this.contract.getOwner.call();

            assert.equal(contractOwner, account_one, "Contract owner should be address that instantiated the contract");
        })
    });
})