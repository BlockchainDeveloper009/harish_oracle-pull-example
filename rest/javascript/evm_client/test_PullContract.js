const PullServiceClient = require("./pullServiceClient");
const {Web3} = require('web3');
const { ethers } = require("ethers");
// Load environment variables from .env file
require('dotenv').config();

// Access the variables



async function test_PullContract() {
    
    const address = 'https://rpc-testnet-dora-2.supra.com';
    //const pairIndexes = [89, 425, 426, 427, 432, 75 ]; // Set the pair indexes as an array
    const pairIndexes = [432]; // Set the pair indexes as an array
    const pairSymbols = ['USDC_USD, SAUCE_wHBAR, xSAUCE_wHBAR, HBARX_wHBAR, HBAR_USD, HBAR_USDT']; // Set the pair indexes as an array
    const chainType = 'evm'; // Set the chain type (evm, sui, aptos, radix)
    
    const client = new PullServiceClient(address);
    const apiKey = process.env.API_KEY;
    
    const request = {
        pair_indexes: pairIndexes,
        chain_type: chainType
    };

    console.log("Requesting proof for price index : ", request.pair_indexes);
    console.log("Requesting proof for pairSymbols  : ", pairSymbols);
    pairSymbols
    const WALLET_ADDRESS = process.env.WALLET_ADDRESS ; //"0x1d4F7bac4eAa3Cc5513B7A539330b53AE94A858a";
    const PRIVATE_KEY = process.env.PRIVATE_KEY; //"859d1c39730867ff539b0d5223ee4801a8ead5640383fab058c3db29971385b8";
  
    client.getProof(request)
        .then(response => {
            console.log('Proof received:', response);
            callContract(response)
        })
        .catch(error => {
            console.error('getProof-->Error:', error?.response?.data);
            console.log(error)
            console.log('****************')
        });
}

async function callContract(response) {
    //https://testnet.hashio.io/api
    const RPC_URL = 'https://testnet.hashio.io/api';
    const WALLET_ADDRESS = process.env.WALLET_ADDRESS ; //"0x1d4F7bac4eAa3Cc5513B7A539330b53AE94A858a";
    const PRIVATE_KEY = process.env.PRIVATE_KEY; //"859d1c39730867ff539b0d5223ee4801a8ead5640383fab058c3db29971385b8";

    
    const contractAddress =  process.env.CONTRACT_ADDRESS;  // Address of your smart contract
    
   try {
    
    const web3 = new Web3(new Web3.providers.HttpProvider(RPC_URL)); // Rpc url for desired chain

    const contractAbi = require("../../resources/abi.json"); // Path of your smart contract ABI

    

    const contract = new web3.eth.Contract(contractAbi, contractAddress);

    const hex = response.proof_bytes;

    
    
    

    /////////////////////////////////////////////////// Utility code to deserialise the oracle proof bytes (Optional) ///////////////////////////////////////////////////////////////////

    const OracleProofABI = require("../../resources/oracleProof.json"); // Interface for the Oracle Proof data

    let proof_data = web3.eth.abi.decodeParameters(OracleProofABI,hex); // Deserialising the Oracle Proof data 

    let pairId = []  // list of all the pair ids requested
    let pairPrice = []; // list of prices for the corresponding pair ids
    let pairDecimal = []; // list of pair decimals for the corresponding pair ids
    let pairTimestamp = []; // list of pair last updated timestamp for the corresponding pair ids

    for (let i = 0; i < proof_data[0].data.length; ++i) {

        for (let j = 0; j<proof_data[0].data[i].committee_data.length; j++) {

        pairId.push(proof_data[0].data[i].committee_data[j].committee_feed.pair.toString(10)); // pushing the pair ids requested in the output vector

        pairPrice.push(proof_data[0].data[i].committee_data[j].committee_feed.price.toString(10)); // pushing the pair price for the corresponding ids

        pairDecimal.push(proof_data[0].data[i].committee_data[j].committee_feed.decimals.toString(10)); // pushing the pair decimals for the corresponding ids requested

        pairTimestamp.push(proof_data[0].data[i].committee_data[j].committee_feed.timestamp.toString(10)); // pushing the pair timestamp for the corresponding ids requested

        }

    }

    console.log("Pair index : ", pairId);
    console.log("Pair Price : ", pairPrice);
    console.log("Pair Decimal : ", pairDecimal);
    console.log("Pair Timestamp : ", pairTimestamp);
    
    /////////////////////////////////////////////////// End of the utility code to deserialise the oracle proof bytes (Optional) ////////////////////////////////////////////////////////////////
    let bytes = web3.utils.hexToBytes(hex);
    
    const txData = contract.methods.verifyOracleProof(bytes).encodeABI(); // function from you contract eg:GetPairPrice from example-contract.sol
    //const gasEstimate = await contract.methods.verifyOracleProof(bytes).estimateGas({from: WALLET_ADDRESS});
    await contract.methods.verifyOracleProof(bytes)
    // Create the transaction object
    const transactionObject = {
        from: "0x1d4F7bac4eAa3Cc5513B7A539330b53AE94A858a",
        to: contractAddress,
        data: txData,
        gas: gasEstimate,
        gasPrice: await web3.eth.getGasPrice() // Set your desired gas price here, e.g: web3.utils.toWei('1000', 'gwei')
    };
    
    // Sign the transaction with the private key
    const signedTransaction = await web3.eth.accounts.signTransaction(transactionObject, PRIVATE_KEY);

    // Send the signed transaction
    const receipt = await web3.eth.sendSignedTransaction(signedTransaction.rawTransaction,null,{checkRevertBeforeSending:false});
    console.log('Transaction receipt:', receipt);

   } catch (error) {
        console.log('try-catch');
        console.log(error);
        console.log('&&&&&&&&&&&&&&&&&&&&');
   }
}

module.exports = test_PullContract();