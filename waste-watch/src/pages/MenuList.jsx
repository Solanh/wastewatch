// src/pages/MenuList.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/navbar";
import Footer from "../components/Footer";

const API_BASE = "/api"; // or "http://localhost:8000/api"

function MenusList() {
    const [menus, setMenus] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadMenus = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_BASE}/menus`);
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || "Failed to fetch menus");
            }
            const data = await res.json();
            setMenus(data);
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMenus();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this menu?")) return;

        try {
            const res = await fetch(`${API_BASE}/menus/${id}`, {
                method: "DELETE",
            });
            if (!res.ok && res.status !== 204) {
                const text = await res.text();
                throw new Error(text || "Failed to delete menu");
            }
            // Refresh list
            setMenus((prev) => prev.filter((m) => m._id !== id && m.id !== id));
        } catch (err) {
            console.error(err);
            alert("Error deleting menu: " + err.message);
        }
    };

    return (
        <>
            <Navbar />
            <div className="container mt-5 pt-5">
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h3>Menus</h3>
                    <Link className="btn btn-primary" to="/menus/new">
                        + New Menu
                    </Link>
                </div>

                {loading && <p>Loading menus...</p>}
                {error && <p className="text-danger">{error}</p>}

                {!loading && !error && menus.length === 0 && (
                    <p>No menus yet. Create one!</p>
                )}

                {!loading && menus.length > 0 && (
                    <table className="table table-striped">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Items</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {menus.map((menu) => {
                                const id = menu._id || menu.id;
                                return (
                                    <tr key={id}>
                                        <td>{menu.name}</td>
                                        <td>{menu.items?.length ?? 0}</td>
                                        <td>
                                            <Link
                                                className="btn btn-sm btn-primary me-2"
                                                to={`/dashboard/${id}`}
                                            >
                                                Use Menu
                                            </Link>
                                            <Link
                                                className="btn btn-sm btn-secondary me-2"
                                                to={`/menus/${id}`}
                                            >
                                                Edit
                                            </Link>
                                            <button
                                                className="btn btn-sm btn-danger"
                                                onClick={() => handleDelete(id)}
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
            <Footer />
        </>
    );
}

export default MenusList;
