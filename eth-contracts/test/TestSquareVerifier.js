let SquareVerifier = artifacts.require('Verifier');
let ZokratesProof = require('../../zokrates/code/square/output/proof_10.json');

contract('SquareVerifier', accounts => {
    const owner = accounts[0];

    let a = ZokratesProof.proof.a;
    let b = ZokratesProof.proof.b;
    let c = ZokratesProof.proof.c;
    let inputs = ZokratesProof.inputs;

    describe('Test Zokrates proof verification', () => {
        beforeEach(async () => {
            this.contract = await SquareVerifier.new({ from: owner });
        })

        it('Test verification with correct proof', async () => {
            let result = await this.contract.verifyTx.call(a, b, c, inputs);

            assert.equal(result, true, "Verification with correct proof failed");
        })

        it('Test verification with incorrect proof', async () => {
            let inputs = [
                "0x0000000000000000000000000000000000000000000000000000000000000001",
                "0x0000000000000000000000000000000000000000000000000000000000000002"
            ];
            let result = await this.contract.verifyTx.call(a, b, c, inputs);

            assert.equal(result, false, "Verification with incorrect proof failed");
        })
    })
})

