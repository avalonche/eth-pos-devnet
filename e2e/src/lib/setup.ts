import { Wallet, utils, ContractFactory, BigNumber } from "ethers"
import fs from "fs/promises"
import env from '../lib/env'
import contracts from './contracts'
import minionWallets from "../output/wallets.json"
import { GWEI } from "./helpers"

const WALLETS_DIR = "src/output/"
const WALLETS_PATH = WALLETS_DIR + "wallets.json"
const FUND_AMOUNT = utils.parseEther("50")
const NUM_WALLETS = 100

export async function createWallets(numWallets: number) {
    try {
        const dir = await fs.opendir(WALLETS_DIR)
        dir.closeSync()
    } catch (e) {
        await fs.mkdir(WALLETS_DIR)
    }
    try {
        await fs.stat(WALLETS_PATH)
    } catch (e) {

    }

    let wallets = []
    for (let i = 0; i < numWallets; i++) {
        const wallet = Wallet.createRandom()
        wallets.push({
            address: wallet.address,
            privateKey: wallet.privateKey,
        })
    }
    await fs.writeFile(WALLETS_PATH, JSON.stringify(wallets, null, 2))
}

export async function fundWallets() {
    // read wallets from file, send them each some ether
    const adminWallet = env.ADMIN_WALLET
    const nonce = await adminWallet.getTransactionCount()

    const txs = minionWallets.map((wallet, i) => {
        const tx = {
            chainId: env.CHAIN_ID,
            value: FUND_AMOUNT,
            from: adminWallet.address,
            to: wallet.address,
            nonce: nonce + i,
            gasPrice: GWEI.mul(15),
            gasLimit: 21000,
        }
        return tx
    })

    const signedTxPromises = txs.map(tx => {
        return adminWallet.signTransaction(tx)
    })
    const signedTxs = await Promise.all(signedTxPromises)


    const sentTxPromises = signedTxs.map(tx => (
        env.PROVIDER.sendTransaction(tx)
    ))

    await Promise.all(sentTxPromises)
}

export async function deployContracts() {
    const lottery = new ContractFactory(
        contracts.LotteryMEV.abi, contracts.LotteryMEV.bytecode, env.ADMIN_WALLET
    )
    const lotteryContract = await lottery.deploy({ gasLimit: 150000 })
    return {
        lotteryContract,
    }
}

export async function setupTestEnv() {
    await createWallets(NUM_WALLETS);
    await fundWallets();
    return await deployContracts();
}

export const getWalletSet = () => {
    const wallets = minionWallets
        .map(wallet => new Wallet(wallet.privateKey))
    return wallets
}
