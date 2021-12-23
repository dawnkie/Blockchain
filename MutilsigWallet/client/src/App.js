import React, {useEffect, useState} from 'react';
import {getWeb3, getMultisigWallet} from './utils.js';
import Header from "./Header";
import NewProposal from "./NewProposal";
import ProposalList from "./ProposalList";

function App() {
    const [web3, setWeb3] = useState(undefined);
    const [accounts, setAccounts] = useState(undefined);
    const [wallet, setWallet] = useState(undefined);
    const [senators, setSenators] = useState([]);
    const [threshold, setThreshold] = useState(undefined);
    const [proposals, setProposals] = useState([]);

    useEffect(() => {
        const init = async () => {
            const web3 = await getWeb3();
            const accounts = await web3.eth.getAccounts();
            const wallet = await getMultisigWallet(web3);
            const senators = await wallet.methods.getSenators().call();
            const threshold = await wallet.methods.threshold().call();
            const proposals = await wallet.methods.getProposals().call();
            setWeb3(web3);
            setAccounts(accounts);
            setWallet(wallet);
            setSenators(senators);
            setThreshold(threshold);
            setProposals(proposals)
        };
        init();
    }, []);


    const createProposal = async proposal => {
        // 前提：已连接metamask
        await wallet.methods.createProposal(proposal.amount, proposal.to).send({from: accounts[0]});
    }

    const approve = index =>{
        // 前提：已连接metamask
        wallet.methods.approve(index).send({from: accounts[0]});
    }


    if (!(web3 && accounts && wallet && senators.length && threshold)) {
        return <div>Maybe something wrong, Genies Data still is Loading...</div>;
    } else {
        return (
            <div>
                Multisig Dapp
                <Header senators={senators} threshold={threshold}/>
                <NewProposal createProposal={createProposal}/>
                <ProposalList proposals={proposals} approve={approve}/>
            </div>
        );
    }
}

export default App;
