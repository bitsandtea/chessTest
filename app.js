const express = require("express");
const ethers = require("ethers");
const bodyParser = require("body-parser");

const app = express();

//env variables
require("dotenv").config();

//middleware
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

// Specify a port number for the server

const port = 8000;

// variables can be moved to .env later on
const smartContract = "0x4691f60c894d3f16047824004420542e4674e621";

//minified the ABI here only for the two functions that we need for this example
const abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "balanceOf",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "recipient",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "transfer",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
];
const signerPKey = process.env.pkey;
const chainStackBSCNodeKey = process.env.chainStackBSCNodeKey;
const NETWORK_ID = 56; // for BSC
const chainStackBSCNode = `https://bsc-mainnet.core.chainstack.com/${chainStackBSCNodeKey}`;

// Start the server and listen to the port
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

var urlInfo = {
  url: chainStackBSCNode,
};
var provider = new ethers.providers.JsonRpcProvider(urlInfo, NETWORK_ID);

const contract = new ethers.Contract(smartContract, abi, provider);

app.get("/getName", async (req, res) => {
  // Get the id parameter from the request
  try {
    const name = await contract.name();

    res.send({ name: name.toString() });
  } catch (err) {
    res.send({ error: err.message });
  }
});
// route for getting balance, that calls the balanceOf function of the smart contract provided
app.get("/getBalance/:id", async (req, res) => {
  try {
    const balance = await contract.balanceOf(req.params.id);
    const decimals = await contract.decimals();

    const formatted = ethers.utils.formatUnits(balance, decimals);

    res.send({
      "rawBalance: ": balance.toString(),
      "formattedBalance: ": formatted.toString(),
    });
  } catch (err) {
    res.send({ error: err.message });
  }
});

//signs a transaction using the pkey in .env for transfering the required amount. Also calculates gas and broadcasts the transaction. The user gets the transaction hash with a link to the transaction on BSCscan
app.post("/transfer", async (req, res) => {
  try {
    const { recipient, amount } = req.body;
    const wallet = new ethers.Wallet(signerPKey, provider);
    const contractWithSigner = contract.connect(wallet);

    const tx = await contractWithSigner.transfer(recipient, amount);

    res.send({ txHash: tx.hash, link: `https://bscscan.com/tx/${tx.hash}` });
  } catch (err) {
    res.send({ error: err.message });
  }
});
