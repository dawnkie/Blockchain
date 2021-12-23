import React from "react";

function Header({senators, threshold}) {
    return (
        <header>
            <ul>
                <li>Senators: {senators.join(',')}</li>
                <li>Threshold: {threshold}</li>
            </ul>
        </header>
    )
}

export default Header;