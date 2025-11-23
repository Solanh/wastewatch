// src/pages/AddMenu.jsx
import React, { useState } from "react";
import Select from "react-select";
import Navbar from "../components/navbar";
import Footer from "../components/Footer";
import classNames from "../data/classNames.json";

const API_BASE = "/api"; // or "http://localhost:8000/api" if no proxy

function AddMenu() {
    const [selectedItem, setSelectedItem] = useState(null);
    const [menuItems, setMenuItems] = useState([]); // [{ value, label, quantity }]
    const [menuName, setMenuName] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const options = classNames.map((name) => ({ value: name, label: name }));

    const handleAddItem = () => {
        if (
            selectedItem &&
            !menuItems.find((i) => i.value === selectedItem.value)
        ) {
            setMenuItems((prev) => [
                ...prev,
                { ...selectedItem, quantity: 1 }, // default quantity
            ]);
            setSelectedItem(null);
        }
    };

    const handleQuantityChange = (value, qty) => {
        const quantity = Number(qty);
        setMenuItems((prev) =>
            prev.map((item) =>
                item.value === value ? { ...item, quantity } : item
            )
        );
    };

    const handleDeleteItem = (value) => {
        setMenuItems((prev) => prev.filter((item) => item.value !== value));
    };

    const handleSubmit = async () => {
        if (!menuName.trim()) {
            alert("Please give this menu a name.");
            return;
        }

        if (menuItems.length === 0) {
            alert("Add at least one item to the menu.");
            return;
        }

        const invalid = menuItems.some(
            (item) => !item.quantity || item.quantity <= 0
        );
        if (invalid) {
            alert("Every item must have a quantity of at least 1.");
            return;
        }

        const payload = {
            name: menuName.trim(),
            items: menuItems.map((item) => ({
                name: item.value,
                quantity: Number(item.quantity),
            })),
        };

        try {
            setIsSubmitting(true);
            const res = await fetch(`${API_BASE}/menus`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || "Failed to create menu");
            }

            const saved = await res.json();
            console.log("Created menu:", saved);
            alert("Menu created!");

            // Remember this as the last used menu
            const newId = saved.id || saved._id;
            if (newId) {
                localStorage.setItem("lastMenuId", newId);
            }

            // optional: clear form
            setMenuItems([]);
            setMenuName("");
        } catch (err) {
            console.error(err);
            alert("Error saving menu: " + err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <Navbar />
            <div className="container mt-5 pt-5">
                <h3 className="text-center mb-4">Create Menu</h3>

                {/* Menu name */}
                <div className="col-6 mx-auto mb-3">
                    <label className="form-label">Menu Name</label>
                    <input
                        className="form-control"
                        value={menuName}
                        onChange={(e) => setMenuName(e.target.value)}
                        placeholder="e.g., Lunch Menu - Monday"
                    />
                </div>

                {/* Selector + Add Selected to Menu */}
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
                            className="btn btn-primary mt-2"
                            onClick={handleAddItem}
                        >
                            Add Selected to Menu
                        </button>
                    </div>
                </div>

                {/* Submit Menu card with quantities */}
                {menuItems.length > 0 && (
                    <div className="col-10 mx-auto mt-4 card">
                        <div className="card-header text-center">
                            <h5 className="mt-2">Submit Menu</h5>
                        </div>
                        <div className="card-body">
                            <table className="table table-bordered mb-3">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Item</th>
                                        <th style={{ width: "120px" }}>
                                            Quantity
                                        </th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {menuItems.map((item, idx) => (
                                        <tr key={item.value}>
                                            <td>{idx + 1}</td>
                                            <td>{item.label}</td>
                                            <td>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    className="form-control form-control-sm"
                                                    value={item.quantity}
                                                    onChange={(e) =>
                                                        handleQuantityChange(
                                                            item.value,
                                                            e.target.value
                                                        )
                                                    }
                                                />
                                            </td>
                                            <td>
                                                <button
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() =>
                                                        handleDeleteItem(
                                                            item.value
                                                        )
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
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting
                                        ? "Submitting..."
                                        : "Submit Menu"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <Footer />
        </>
    );
}

export default AddMenu;
