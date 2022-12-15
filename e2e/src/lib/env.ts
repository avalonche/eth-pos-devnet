import dotenv from "dotenv"
import { providers, Wallet } from "ethers"

dotenv.config({ path: `.env` })

const env = {
    ADMIN_PRIVATE_KEY: process.env.ADMIN_PRIVATE_KEY || "0x2fc12ae741f29701f8e30f5de6350766c020cb80768a0ff01e6838ffd2431e11",
    TEST_PRIVATE_KEY: process.env.TEST_PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", // 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266
    CHAIN_ID: parseInt(process.env.CHAIN_ID || "32382"),
    CHAIN_NAME: process.env.CHAIN_NAME || "l1_chain",
    RPC_URL: process.env.RPC_URL || "http://localhost:8545",
    MEV_GETH_HTTP_URL: process.env.MEV_GETH_HTTP_URL || "http://localhost:8545",
}

const PROVIDER = new providers.JsonRpcProvider(env.RPC_URL, { chainId: env.CHAIN_ID, name: env.CHAIN_NAME })
const ADMIN_WALLET = new Wallet(env.ADMIN_PRIVATE_KEY, PROVIDER)
const TEST_WALLET = new Wallet(env.TEST_PRIVATE_KEY, PROVIDER)

export default { ...env, PROVIDER, ADMIN_WALLET, TEST_WALLET }