const Web3 = require('web3')
const EthereumTransaction = require('ethereumjs-tx').Transaction
const fs = require('fs')

const NETWORK = process.env.NETWORK // Either local or rinkeby

const INFURA_KEY = fs.readFileSync(".infuraKey").toString().trim();
const NUM_TOKENS = 10 // Total number of tokens to mint

let MNEMONIC, network, NFT_CONTRACT_ADDRESS, OWNER_ADDRESS, web3Instance, result;

console.log(`Connected network: ${NETWORK}`)

if (NETWORK === 'rinkeby') {
    MNEMONIC = fs.readFileSync(".secret").toString().trim()
    network = `https://rinkeby.infura.io/v3/${INFURA_KEY}`
    NFT_CONTRACT_ADDRESS = '0x8332104f21d14CbB3D06A6AcBC56272550ae3Eed'
    OWNER_ADDRESS = '0x116375c0D0A8049f436a78870b287f9F962a2248'
} else {
    // Local network
    MNEMONIC = fs.readFileSync(".localSecret").toString().trim() // Ganache generated mnemonic
    network = 'http://127.0.0.1:8545' // RPC server address
    NFT_CONTRACT_ADDRESS = '0x867A21F12B1bF244F7Edf206A146eA21722a1a11' // SolnSquareVerifier contract address
    OWNER_ADDRESS = '0x36eD70E5252dDf707C317d3ddc38840f94F471aB' // Contract owner address
}

const NFT_ABI = require('../artefacts/SolnSquareVerifier.json').abi

async function main() {
    if(NETWORK === 'rinkeby') {
        web3Instance = new Web3(new Web3.providers.WebsocketProvider(network.replace('https', 'wss')
            .replace('v3', 'ws/v3')))
    } else {
        // Local network
        web3Instance = new Web3(new Web3.providers.WebsocketProvider(network.replace('http', 'ws')))
    }

    try {
        // Instantiate smart contract
        const nftContract = new web3Instance.eth.Contract(NFT_ABI, NFT_CONTRACT_ADDRESS)

        // Tokens issued directly to the owner
        for (let i = 1; i <= NUM_TOKENS; i++) {
            let zokratesProof = require(`../zokrates/code/square/output/proof_${i}.json`);
            if(NETWORK === 'rinkeby') {
                // Private key of the contract owner
                let privateKeySender = fs.readFileSync(".privateKey").toString().trim()
                let privateKeySenderHex = new Buffer.from(privateKeySender, 'hex')

                let data = nftContract.methods
                    .mintToken(OWNER_ADDRESS, i, zokratesProof.proof.a, zokratesProof.proof.b, zokratesProof.proof.c, zokratesProof.inputs)
                    .encodeABI()

                // Get transaction count for correct nonce
                let txCount = await web3Instance.eth.getTransactionCount(OWNER_ADDRESS, (err, txCount) => {return txCount})

                // Create transaction
                let rawTransaction = {
                    nonce: web3Instance.utils.toHex(txCount),
                    to: NFT_CONTRACT_ADDRESS,
                    gasPrice: web3Instance.utils.toHex(web3Instance.utils.toWei('6', 'gwei')),
                    gasLimit: web3Instance.utils.toHex(2100000),
                    value: web3Instance.utils.toHex(web3Instance.utils.toWei('0')),
                    data: data
                }

                // Sign transaction
                let transaction = new EthereumTransaction(rawTransaction, {'chain': 'rinkeby'})
                transaction.sign(privateKeySenderHex)

                // Send signed transaction
                let serializedTransaction = transaction.serialize()
                await web3Instance.eth.sendSignedTransaction('0x'+ serializedTransaction.toString('hex'), (err, transactionHash) => {
                    console.log(`Minted tokenID: ${i}. TX Hash: ${transactionHash}`)
                })
            } else {
                // Local network
                result = await nftContract.methods
                    .mintToken(OWNER_ADDRESS, i, zokratesProof.proof.a, zokratesProof.proof.b, zokratesProof.proof.c, zokratesProof.inputs)
                    .send({ from: OWNER_ADDRESS, gasLimit: 2100000 })
                console.log(`Minted tokenID: ${i}. TX Hash: ${result.transactionHash}`)
            }
        }

        // Capture events for each transaction
        nftContract.events.Transfer({
            fromBlock: 0
        }, function (error, event) {
            if (error) console.log(error)
            console.log(event)
        })

        nftContract.events.SolutionAdded({
            fromBlock: 0
        }, function (error, event) {
            if (error) console.log(error)
            console.log(event)
        })
    } catch (e) {
        console.log(e)
    }
}

main()