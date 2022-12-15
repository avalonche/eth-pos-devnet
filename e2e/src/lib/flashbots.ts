import env from "./env"
import axios from "axios"
import { id as ethersId } from "ethers/lib/utils"
import { Wallet } from "ethers"

export const sendBundle = async (signedTransactions: string[], targetBlock: number, uuid: string) => {
    const params = [
        {
            txs: signedTransactions,
            blockNumber: `0x${targetBlock.toString(16)}`,
            userUuid: uuid,
        }
    ]

    const { headers, body } = await getRpcRequest(params, "eth_sendBundle", env.ADMIN_WALLET)
    return (await axios.post(env.MEV_GETH_HTTP_URL, body, {
        headers,
    })).data
}

/**
 * Standardized RPC request for talking to Bundle API (mev-geth) directly.
 * @param params 
 * @param method 
 * @param authSigner 
 * @returns 
 */
export const getRpcRequest = async (params: any, method: string, authSigner: Wallet) => {
    const body = {
        params,
        method,
        id: '1337',
        jsonrpc: "2.0"
    }
    const signature = `${await authSigner.getAddress()}:${await authSigner.signMessage(ethersId(JSON.stringify(body)))}`
    const headers = {
        'Content-Type': 'application/json',
        'X-Flashbots-Signature': signature,
    }
    return {
        headers,
        signature,
        body,
    }
}