import React from "react";

function DashboardItem({item}){

    return(
        <li className="list-group-item dashboard-row    ">
            {item}
        </li>
    )

}

export default DashboardItem;