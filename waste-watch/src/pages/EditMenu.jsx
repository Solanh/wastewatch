// src/pages/EditMenu.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Select from "react-select";
import Navbar from "../components/navbar";
import Footer from "../components/Footer";
import classNames from "../data/classNames.json";

const API_BASE = "/api"; // or "http://localhost:8000/api" if you don't have a proxy

function EditMenu() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [menuName, setMenuName] = useState("");
    const [menuItems, setMenuItems] = useState([]); // [{ value, label, quantity }]
    const [selectedItem, setSelectedItem] = useState(null);
    const [mealPeriod, setMealPeriod] = useState(2); // 1=breakfast,2=lunch,3=dinner

    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    const options = classNames.map((name) => ({ value: name, label: name }));

    const loadMenu = async () => {
        try {
            setLoading(true);
            setError("");

            const res = await fetch(`${API_BASE}/menus/${id}`);
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || "Failed to load menu");
            }

            const menu = await res.json();
            setMenuName(menu.name || "");
            setMealPeriod(menu.meal_period ?? 2);

            setMenuItems(
                (menu.items || []).map((item) => ({
                    value: item.name,
                    label: item.name,
                    quantity: item.quantity,
                }))
            );
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMenu();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const handleAddItem = () => {
        if (
            selectedItem &&
            !menuItems.find((i) => i.value === selectedItem.value)
        ) {
            setMenuItems((prev) => [...prev, { ...selectedItem, quantity: 1 }]);
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
            meal_period: mealPeriod,
            items: menuItems.map((item) => ({
                name: item.value,
                quantity: Number(item.quantity),
            })),
        };

        try {
            setIsSubmitting(true);
            const res = await fetch(`${API_BASE}/menus/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || "Failed to update menu");
            }
            const updated = await res.json();
            console.log("Updated menu:", updated);
            alert("Menu updated!");

            // Remember this as the last used menu
            const updatedId = updated.id || updated._id || id;
            if (updatedId) {
                localStorage.setItem("lastMenuId", updatedId);
            }

            navigate("/menus");
        } catch (err) {
            console.error(err);
            alert("Error updating menu: " + err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <>
                <Navbar />
                <div className="container mt-5 pt-5">
                    <p>Loading menu...</p>
                </div>
                <Footer />
            </>
        );
    }

    if (error) {
        return (
            <>
                <Navbar />
                <div className="container mt-5 pt-5">
                    <p className="text-danger">Error: {error}</p>
                </div>
                <Footer />
            </>
        );
    }

    return (
        <>
            <Navbar />
            <div className="container my-5 pt-5">
                <h3 className="text-center mb-4">Edit Menu</h3>

                {/* Menu name */}
                <div className="col-6 mx-auto mb-3">
                    <label className="form-label">Menu Name</label>
                    <input
                        className="form-control"
                        value={menuName}
                        onChange={(e) => setMenuName(e.target.value)}
                    />
                </div>

                {/* Meal period */}
                <div className="col-6 mx-auto mb-3">
                    <label className="form-label">Meal Period</label>
                    <select
                        className="form-select"
                        value={mealPeriod}
                        onChange={(e) => setMealPeriod(Number(e.target.value))}
                    >
                        <option value={1}>Breakfast</option>
                        <option value={2}>Lunch</option>
                        <option value={3}>Dinner</option>
                    </select>
                </div>

                {/* Selector */}
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

                {/* Submit Menu card */}
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
                                        ? "Saving..."
                                        : "Save Changes"}
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

export default EditMenu;
