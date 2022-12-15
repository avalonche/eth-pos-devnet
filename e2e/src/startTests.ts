import env from "./lib/env";
import { createWallets, fundWallets, deployContracts } from "./lib/setup";
import { runTest } from "./testcases/dumb-search";

const checkMerge = async () => {
  return new Promise((resolve) => {
    var timer = setInterval(async function () {
      const block = await env.PROVIDER.getBlock("latest")
      if (block.difficulty == 0) {
        console.log("transitioned to PoS")
        clearInterval(timer) // stop the setInterval once we get to PoS
        resolve(null)
      } else {
        console.log("network still in PoW stage")
      }
    }, 4000);
  })
}

const main = async () => {
  await checkMerge()
  console.log("creating test wallets")
  await createWallets(100)
  console.log("funding wallets")
  await fundWallets()
  console.log("deploying test contracts")
  const contract = await deployContracts()
  const blockNum = await env.PROVIDER.getBlockNumber();
  await runTest(contract.lotteryContract, blockNum)
}

main()