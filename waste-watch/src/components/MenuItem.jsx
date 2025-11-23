import React, { useState } from "react";

function MenuItem({ item, onToggle }) {
    const [checked, setChecked] = useState(false);

    const handleCheckbox = (e) => {
        const isChecked = e.target.checked;
        setChecked(isChecked);

        // Call parent callback with this item + new state
        if (onToggle) {
            onToggle(item, isChecked);
        }
    };

    // Make a unique id per item so label/checkbox are linked
    const checkboxId = `checkbox-${item}`;

    return (
        <li className="list-group-item">
            <div>
                <h6>{item}</h6>
            </div>
            <div className="d-flex">
                <label className="form-label me-2">Quantity:</label>
                <input className="form-control me-3" />
                <div className="form-check">
                    <input
                        className="form-check-input"
                        type="checkbox"
                        id={checkboxId}
                        checked={checked}
                        onChange={handleCheckbox}
                        style={{ transform: "scale(2)" }}
                    />
                    <label
                        className="form-check-label"
                        htmlFor={checkboxId}
                    >
                    </label>
                </div>
            </div>
        </li>
    );
}

export default MenuItem;
