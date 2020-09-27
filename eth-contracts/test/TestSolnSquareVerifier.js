let SquareVerifier = artifacts.require('Verifier');
let SolnSquareVerifier = artifacts.require('SolnSquareVerifier');
let ZokratesProof = require('../../zokrates/code/square/output/proof_1.json');

contract('SolnSquareVerifier', accounts => {
    const owner = accounts[0];

    let a = ZokratesProof.proof.a;
    let b = ZokratesProof.proof.b;
    let c = ZokratesProof.proof.c;
    let inputs = ZokratesProof.inputs;

    let tokenId1 = 3;
    let tokenId2 = 4;

    before('setup contract', async () => {
        const SquareVerifierContract = await SquareVerifier.new({ from: owner });
        this.contract = await SolnSquareVerifier.new(SquareVerifierContract.address, { from: owner });
    });

    it('Should fail minting when contract is paused', async () => {
        let result = true;

        await this.contract.setPause(true, { from: owner }); // Pause contract

        try {
            await this.contract.mintToken(accounts[1], tokenId1, a, b, c, inputs, { from: owner });
        } catch (e) {
            result = false;
        }

        await this.contract.setPause(false, { from: owner }); // Unpause contract

        assert.equal(result, false, "Token minting should fail when contract is paused");
    });

    it('Should mint ERC721 token with correct proof', async () => {
        let result = true;

        try {
            await this.contract.mintToken(accounts[1], tokenId1, a, b, c, inputs, { from: owner });
        } catch (e) {
            result = false;
        }

        assert.equal(result, true, "Token minting failed");
    });

    it('Should fail minting with already used proof', async () => {
        let result = true;

        try {
            await this.contract.mintToken(accounts[1], tokenId1, a, b, c, inputs, { from: owner });
        } catch (e) {
            result = false;
        }

        assert.equal(result, false, "Token minting must fail with already used proof");
    });

    it('Should not mint token with incorrect proof', async () => {
        let result = true;
        let inputs = [
            "0x0000000000000000000000000000000000000000000000000000000000000002",
            "0x0000000000000000000000000000000000000000000000000000000000000003"
        ];

        try {
            await this.contract.mintToken(accounts[2], tokenId2, a, b, c, inputs, { from: owner });
        } catch (e) {
            result = false;
        }

        assert.equal(result, false, "Minting with incorrect proof should fail but passed");
    });

    it('Should add new solution', async () => {
        let key = await this.contract.generateKey.call(a, b, c, inputs);
        let solution = await this.contract.getSolution.call(key);

        assert.equal(solution, true, "Solution not added");
    });
});