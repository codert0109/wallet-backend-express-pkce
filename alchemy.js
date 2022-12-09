// Setup: npm install alchemy-sdk
const Alchemy = require("alchemy-sdk");
const dotenv = require("dotenv");

dotenv.config();

const mainnet_config = {
  apiKey: process.env.alchemy_apiKey,
  network: Alchemy.Network.ETH_MAINNET,
};
const goerli_config = {
  apiKey: process.env.alchemy_apiKey,
  network: Alchemy.Network.ETH_GOERLI,
};
const mainnet_alchemy = new Alchemy(mainnet_config);
const goerli_alchemy = new Alchemy(goerli_config);

exports.getTransactionsFromMain = async function (address) {
  try {
    const data = await mainnet_alchemy.core.getAssetTransfers({
      fromBlock: "0x0",
      fromAddress: address,
      category: ["external", "internal", "erc20", "erc721", "erc1155"],
    });
    return data;
  } catch (e) {
    return false;
  }
};

exports.getTransactionsFromGoerli = async function (address) {
  try {
    const data = await goerli_alchemy.core.getAssetTransfers({
      fromBlock: "0x0",
      fromAddress: address,
      category: ["external", "internal", "erc20", "erc721", "erc1155"],
    });
    return data;
  } catch (e) {
    return false;
  }
};
