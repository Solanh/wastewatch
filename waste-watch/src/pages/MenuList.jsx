// src/pages/MenusList.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/navbar";
import Footer from "../components/Footer";

async function fetchMenus() {
    const res = await fetch("/api/menus");
    if (!res.ok) {
        throw new Error("Failed to fetch menus");
    }
    return res.json();
}

function MenusList() {
    const [menus, setMenus] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        (async () => {
            try {
                const data = await fetchMenus();
                setMenus(data); // [{id, name, items: [...], createdAt}, ...]
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

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
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {menus.map((menu) => (
                                <tr key={menu.id}>
                                    <td>{menu.name}</td>
                                    <td>{menu.items?.length ?? 0}</td>
                                    <td>
                                        {menu.createdAt
                                            ? new Date(
                                                  menu.createdAt
                                              ).toLocaleString()
                                            : "-"}
                                    </td>
                                    <td>
                                        <Link
                                            className="btn btn-sm btn-secondary me-2"
                                            to={`/menus/${menu.id}`}
                                        >
                                            Edit
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
            <Footer />
        </>
    );
}

export default MenusList;
