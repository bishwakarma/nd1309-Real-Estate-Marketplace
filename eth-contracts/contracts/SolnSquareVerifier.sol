pragma solidity >=0.4.21 <0.6.0;

// TODO define a contract call to the zokrates generated solidity contract <Verifier> or <renamedVerifier>
contract Verifier {
    function verifyTx(
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c, uint[2] memory input
    ) public view returns (bool r);
}

import './ERC721Mintable.sol';

// TODO define another contract named SolnSquareVerifier that inherits from your ERC721Mintable class
contract SolnSquareVerifier is CustomERC721Token {
    Verifier verifier;

    // TODO define a solutions struct that can hold an index & an address
    struct Solutions {
        uint256 index;
        address owner;
    }

    // TODO define an array of the above struct
    Solutions[] private _allSolutions;

    // TODO define a mapping to store unique solutions submitted
    mapping(bytes32 => Solutions) private _solutions;

    // TODO Create an event to emit when a solution is added
    event SolutionAdded(uint256 index, address owner);

    constructor(address verifierContract) public {
        verifier = Verifier(verifierContract);
    }

    // TODO Create a function to add the solutions to the array and emit the event
    function _addSolution(uint256 index, address to, bytes32 key) internal {
        _solutions[key] = Solutions({index: index, owner: to});
        _allSolutions.push(_solutions[key]);
        emit SolutionAdded(index, to);
    }

    function getSolution(bytes32 key) public view returns (bool) {
        if(_solutions[key].owner != address(0)) {
            return true;
        }
        return false;
    }

    function generateKey(uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c, uint[2] memory input) public pure returns (bytes32) {
        bytes32 key = keccak256(abi.encodePacked(a, b, c, input));
        return key;
    }

    // TODO Create a function to mint new NFT only after the solution has been verified
    //  - make sure the solution is unique (has not been used before)
    //  - make sure you handle metadata as well as tokenSupply
    function mintToken(address to, uint256 tokenId,
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c, uint[2] memory input) whenNotPaused public {
        bytes32 key = generateKey(a, b, c, input);
        require(_solutions[key].owner == address(0), "Solution already used");
        require(verifier.verifyTx(a, b, c, input), "Incorrect proof");
        _addSolution(tokenId, to, key);
        super.mint(to, tokenId);
    }
}
