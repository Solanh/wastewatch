import React, { useState } from "react";
import Navbar from "../components/navbar";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";
import MenuItem from "../components/MenuItem";

const test = [
    { item: "banana" },
    { item: "apple" },
    { item: "orange" },
    { item: "grapes" },
];

function AddMenu() {
    const [selectedItems, setSelectedItems] = useState([]);

    const handleToggler = (item, checked) => {
        if (checked) {
            setSelectedItems((prev) => [...prev, item]);
        } else {
            setSelectedItems((prev) => prev.filter((i) => i !== item));
        }
    };

    return (
        <>
            <Navbar />
            <div className="container mt-5 pt-5">
                <div className="row">
                    <div className="col-6">
                        <h4>Menu Items</h4>
                    </div>
                    <div className="col-6">
                        <div className="btn-group d-flex justify-content-end">
                            <Link
                                className="btn btn-primary ms-4"
                                to="/add-item"
                            >
                                Add Items
                            </Link>
                            <Link className="btn btn-warning" to="/add-item">
                                Add Selected to Menu
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="row align-items-start">
                    <ul className="col-7 list-group mt-4">
                        {test.map((data, idx) => (
                            <MenuItem
                                key={idx}
                                item={data.item}
                                onToggle={handleToggler}
                            />
                        ))}
                    </ul>

                    <div className="col-4 card mt-4">
                        <div className="card-title text-center">
                            <h6 className="mt-2">Submit Menu</h6>
                        </div>
                        <div className="card-body">
                            <p>Selected Items:</p>
                            <ul className="list-group">
                                {selectedItems.map((item, idx) => (
                                    <li className="list-group-item" key={idx}>{item}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </>
    );
}

export default AddMenu;
