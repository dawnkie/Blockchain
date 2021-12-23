import Web3 from "web3";
import ArtifactMW from "./contracts/MultisigWallet.json";
import detectEthereumProvider from "@metamask/detect-provider"

// 节点实例
const getWeb3 = () => {
    return new Promise(async (resolve, reject) => {
        let provider = await detectEthereumProvider();
        if (provider){
            await provider.request({method:"eth_requestAccounts"});
            try {
                const web3 = new Web3(window.ethereum);
                resolve(web3);
            }catch (e){
                reject(e);
            }
        }
        reject("Must install metamask!");
    })

    // return new Web3("http://localhost:8545")
}

// 合约实例
const getMultisigWallet = async web3 => {
    const networkId = await web3.eth.net.getId();
    const networkDeployment = ArtifactMW.networks[networkId];
    return new web3.eth.Contract(
        ArtifactMW.abi,
        networkDeployment && networkDeployment.address
    );
}


export {getWeb3, getMultisigWallet}