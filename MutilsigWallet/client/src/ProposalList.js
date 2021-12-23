import React from "react";

function ProposalList({proposals, approve}) {
    return (
        <table>
            <thead>
            <tr>
                <th>ID</th>
                <th>To</th>
                <th>Amount</th>
                <th>HasPaid</th>
                <th>Approvers</th>
                <th>Action</th>
            </tr>
            </thead>
            <tbody>
            {proposals.map((item, index) => {
                return <tr key={index}>
                    <td>{index}</td>
                    <td>{item.to}</td>
                    <td>{item.amount}</td>
                    <td>{item.hasPaid ? 'yes' : 'no'}</td>
                    <td>{item.approvers.join(',')}</td>
                    <td>
                        <button onClick={() => approve(index)}>approve</button>
                    </td>
                </tr>
            })}
            </tbody>
        </table>
    )
}

export default ProposalList;