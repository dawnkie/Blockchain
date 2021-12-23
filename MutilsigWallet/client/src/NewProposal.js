import React, {useState} from "react";

function NewProposal({createProposal}) {
    const [proposal, setProposal] = useState(undefined);

    function updateProposal(e, field){
        setProposal({...proposal, [field]: e.target.value})
    }

    function submitProposal(e){
        e.preventDefault();
        createProposal(proposal)
    }

    return (
        <div>
            CreateProposal
            <form onSubmit={e=>submitProposal(e)}>
                <label htmlFor="amount">amount</label><input id="amount" type="text" onChange={e=>updateProposal(e,"amount")}/>
                <label htmlFor="to">to</label><input id="to" type="text" onChange={e=>updateProposal(e,"to")}/>
                <button type="submit">Submit</button>
            </form>
        </div>
    )
}

export default NewProposal;