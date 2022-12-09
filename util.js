const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const Web3 = require("web3");
const ethers = require("ethers");
const util = require("ethereumjs-util");
const shim = require("@ethersproject/shims");
const dotenv = require("dotenv");
const setupABI = require("./abis/setup.json");
const transactionABI = require("./abis/transaction.json");

dotenv.config();

const rpc = "https://goerli.infura.io/v3/" + process.env.infuraApiKey;

const provider = new ethers.providers.JsonRpcProvider(rpc);
const wallet = new ethers.Wallet(process.env.ownerKey, provider);
const signer = wallet.provider.getSigner(wallet.address);
const web3 = new Web3(new Web3.providers.HttpProvider(rpc));

exports.generateAccessToken = function (token, data) {
  return jwt.sign(JSON.parse(data), token, { expiresIn: "10h" });
};

exports.authenticateToken = async function (token, payload) {
  if (!token || !payload) return false;

  try {
    const data = await jwt.verify(payload, token);
    return data;
  } catch (e) {
    console.log("jwt verify err=>", err);
    return false;
  }
};

exports.isTransactionSuccess = async function (tx_hash) {
  setTimeout(() => {
    return false;
  }, process.env.MaxDelayTime);
  try {
    let txn_data = await provider.getTransaction(tx_hash);
    if (txn_data) {
      if (txn_data.blockNumber) {
        return txn_data.from;
      } else {
        const waitFor = (delay) =>
          new Promise((resolve) => setTimeout(resolve, delay));
        while (1) {
          await waitFor(process.env.delayTime);
          let txn_data_again = await provider.getTransaction(tx_hash);
          if (txn_data_again && txn_data_again.blockNumber) {
            return txn_data_again.from;
          } else {
            continue;
          }
        }
      }
    }
  } catch (err) {
    console.log("isTransactionSuccess err", err);
    return false;
  }
  return false;
};

exports.getPublicKeyFromContract = async function (address) {
  try {
    const setupContract = new ethers.Contract(
      process.env.setupContractAddress,
      setupABI,
      signer
    );
    const public_key = await setupContract.getPubKey(address);
    if (public_key && public_key[0]) {
      return util.toAscii(public_key[0]);
    } else {
      console.log("get pubkey err => no data for that address");
      return false;
    }
  } catch (e) {
    console.log("get pubkey error", e);
    return false;
  }
};

function base64URLEncode(str) {
  return str
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest();
}

exports.getCodeChallenge = function (verifier) {
  var challenge = base64URLEncode(sha256(verifier));
  return challenge;
};

exports.signTransaction = async function (numTransaction) {
  try {
    const transactionContract = new ethers.Contract(
      process.env.transactionContractAddress,
      transactionABI,
      signer
    );
    // const transactionContract = new web3.eth.Contract(
    //     transactionABI,
    //     process.env.transactionContractAddress,
    //     signer
    //   );
    let nTX = await transactionContract.populateTransaction.setRelayerSign(
      numTransaction
    );
    let txn = await wallet.sendTransaction(nTX);
    let resTxn = await txn.wait();
    if (resTxn.blockNumber) {
      return true;
    } else {
      return false;
    }
  } catch (e) {
    console.log("get pubkey error", e);
    return false;
  }
  return false;
};
