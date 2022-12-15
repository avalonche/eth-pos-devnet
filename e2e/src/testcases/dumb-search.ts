import { BigNumber, Contract, Wallet } from "ethers";
import { getWalletSet } from "../lib/setup";
import { v4 as uuidv4 } from 'uuid';
import env from "../lib/env";
import { TransactionRequest } from "@ethersproject/providers";
import { sendBundle } from "../lib/flashbots";
import { ETH, GWEI } from "../lib/helpers";
import { keccak256 } from "ethers/lib/utils";

const BID_VALUE = ETH.div(100)

export async function runTest(contract: Contract, blockNum: number) {
    const walletSet = getWalletSet()
    const bundles = await createDumbLotteryBundles(contract, walletSet, GWEI.mul(69))
    try {
        console.log("sending bundles")
        await Promise.all(bundles.map(async bundle => {
            return await sendBundle([bundle.bidTx, bundle.claimTx], blockNum + 5, uuidv4())
        }))
        console.log("checking bundles are included in target block", blockNum + 5)
        const includedBundles = await Promise.all(bundles.map(async bundle => await checkBundleStatus(bundle, blockNum + 5)))
        if (includedBundles.some((success) => !success)) {
            console.log("some bundles failed to be included")
        } else {
            console.log("success, all bundles are included")
        }
    } catch (e) {
        const err: any = e
        console.error("[sendBundle] backend error", err.code)
        console.error(err.response.status, err.response.statusText)
    }
}

async function checkBundleStatus(bundle: { bidTx: string, claimTx: string }, targetBlock: number) {
    return new Promise((resolve) => {
        var timer = setInterval(async function () {
            const blockNum = await env.PROVIDER.getBlockNumber()
            if (blockNum > targetBlock) {
                clearInterval(timer)
                const bidTx = await env.PROVIDER.getTransactionReceipt(keccak256(bundle.bidTx))
                const claimTx = await env.PROVIDER.getTransactionReceipt(keccak256(bundle.claimTx))
                if (bidTx && claimTx) {
                    resolve(true)
                    return
                }
                if (!bidTx) {
                    console.log(keccak256(bundle.bidTx), "was not found", bidTx)
                }
                if (!claimTx) {
                    console.log(keccak256(bundle.claimTx), "was not found", claimTx)
                }
                resolve(false)
            }
        }, 4000);
    })
}


/** return a bunch of bundles that compete for the same opportunity */
export const createDumbLotteryBundles = async (lotteryContract: Contract, walletSet: Wallet[], bidGasPrice: BigNumber): Promise<{ bidTx: string, claimTx: string }[]> => {
    const bidTx = await lotteryContract.populateTransaction.bid()
    const claimTx = await lotteryContract.populateTransaction.claim()
    const nonces = await Promise.all(walletSet.map(wallet => wallet.connect(env.PROVIDER).getTransactionCount()))

    const minBidGasPrice = GWEI.mul(Math.max(11, walletSet.length))
    if (bidGasPrice.lt(minBidGasPrice)) {
        bidGasPrice = minBidGasPrice
    }

    // sign a lottery bid with every wallet in the set
    const signedTxPromises = walletSet.map(async (wallet, idx) => {
        const bidReq = {
            ...bidTx,
            from: wallet.address,
            value: BID_VALUE.add(GWEI.mul(idx)),
            gasLimit: 100000,
            gasPrice: bidGasPrice.sub(GWEI.mul(idx)),
            chainId: env.CHAIN_ID,
            nonce: nonces[idx],
        }
        const claimReq: TransactionRequest = {
            ...claimTx,
            from: wallet.address,
            gasLimit: 100000,
            gasPrice: bidGasPrice.sub(GWEI.mul(10)),
            chainId: env.CHAIN_ID,
            nonce: nonces[idx] + 1,
        }
        return {
            bidTx: await wallet.signTransaction(bidReq),
            claimTx: await wallet.signTransaction(claimReq),
        }
    })
    return await Promise.all(signedTxPromises)
}
