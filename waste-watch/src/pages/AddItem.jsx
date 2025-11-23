import React, { useState } from "react";
import Select from "react-select";
import Navbar from "../components/navbar";
import Footer from "../components/Footer";
import classNames from "../data/classNames.json";

function AddMenu() {
    const [selectedItem, setSelectedItem] = useState(null);
    const [menuItems, setMenuItems] = useState([]);

    const options = classNames.map((name) => ({ value: name, label: name }));

    const handleAddItem = () => {
        if (
            selectedItem &&
            !menuItems.find((i) => i.value === selectedItem.value)
        ) {
            setMenuItems([...menuItems, selectedItem]);
            setSelectedItem(null);
        }
    };

    const handleDeleteItem = (value) => {
        setMenuItems(menuItems.filter((item) => item.value !== value));
    };

    const handleSubmit = () => {
        // change
        const menuJSON = menuItems.map((item) => item.value);
        console.log("Submitted Menu:", JSON.stringify(menuJSON, null, 2));

        const blob = new Blob([JSON.stringify(menuJSON, null, 2)], {
            type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "menu.json";
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <>
            <Navbar />
            <div className="container mt-5 pt-5">
                <h3 className="text-center mb-4">Add Menu Items</h3>

                <div className="col-6 mx-auto mb-3">
                    <Select
                        options={options}
                        value={selectedItem}
                        onChange={setSelectedItem}
                        placeholder="Select or type an item..."
                        isClearable
                        isSearchable
                    />
                    <div className="text-center">
                        <button
                            className="btn btn-primary mt-2 "
                            onClick={handleAddItem}
                        >
                            Add Item
                        </button>
                    </div>
                </div>

                {menuItems.length > 0 && (
                    <div className="col-8 mx-auto mt-4">
                        <h5>Menu Preview</h5>
                        <table className="table table-bordered">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Item</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {menuItems.map((item, idx) => (
                                    <tr key={item.value}>
                                        <td>{idx + 1}</td>
                                        <td>{item.label}</td>
                                        <td>
                                            <button
                                                className="btn btn-danger btn-sm"
                                                onClick={() =>
                                                    handleDeleteItem(item.value)
                                                }
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="text-center">
                            <button
                                className="btn btn-success"
                                onClick={handleSubmit}
                            >
                                Submit Menu
                            </button>
                        </div>
                    </div>
                )}
            </div>
            <Footer />
        </>
    );
}

export default AddMenu;
