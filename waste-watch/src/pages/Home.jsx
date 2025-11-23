// src/pages/Home.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/navbar";
import Footer from "../components/Footer";
import DashboardItem from "../components/DashboardItem";
import ReactMarkdown from "react-markdown";

const API_BASE = "/api";

function Home() {
    const { menuId: paramMenuId } = useParams();
    const navigate = useNavigate();

    const [menus, setMenus] = useState([]);
    const [selectedMenuId, setSelectedMenuId] = useState("");
    const [menuName, setMenuName] = useState("");
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [summary, setSummary] = useState("");
    const [summaryLoading, setSummaryLoading] = useState(false);

    // ---------------------------------------
    // Save menu
    // ---------------------------------------
    const saveMenuToBackend = async (id, currentItems, currentName) => {
        if (!id) return;

        try {
            setSaving(true);

            const payload = {
                name: currentName,
                items: currentItems.map((it) => ({
                    name: it.item,
                    quantity: it.qty,
                    taken: it.taken,
                    wasted: it.wasted ?? 0,
                })),
            };

            const res = await fetch(`${API_BASE}/menus/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || "Failed to save menu");
            }

            const updated = await res.json();
            setMenuName(updated.name || "");

            const mapped = (updated.items || []).map((item) => ({
                item: item.name,
                qty: item.quantity,
                taken: item.taken ?? 0,
                wasted: item.wasted ?? 0,
            }));

            setItems(mapped);
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    // ---------------------------------------
    // Summary
    // ---------------------------------------
    const fetchSummary = async () => {
        try {
            setSummaryLoading(true);

            const res = await fetch(`${API_BASE}/summary`);
            if (!res.ok) throw new Error("Failed to fetch summary");

            const data = await res.json();
            setSummary(data.summary);
        } catch (err) {
            console.error(err);
            setSummary("Error fetching summary");
        } finally {
            setSummaryLoading(false);
        }
    };

    // ---------------------------------------
    // Load menu
    // ---------------------------------------
    const loadMenuById = async (id) => {
        if (!id) {
            setItems([]);
            setMenuName("");
            return;
        }

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

            const mapped = (menu.items || []).map((item) => ({
                item: item.name,
                qty: item.quantity,
                taken: item.taken ?? 0,
                wasted: item.wasted ?? 0,
            }));

            setItems(mapped);
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // ---------------------------------------
    // Load menus initially
    // ---------------------------------------
    useEffect(() => {
        const fetchMenusAndSelect = async () => {
            try {
                setLoading(true);
                setError("");

                const res = await fetch(`${API_BASE}/menus`);
                if (!res.ok) {
                    const text = await res.text();
                    throw new Error(text || "Failed to fetch menus");
                }

                const data = await res.json();
                setMenus(data);

                if (data.length === 0) {
                    setMenuName("");
                    setItems([]);
                    setSelectedMenuId("");
                    setLoading(false);
                    return;
                }

                const lastStoredId = localStorage.getItem("lastMenuId");
                const ids = data.map((m) => m.id || m._id);

                let initialId = paramMenuId || lastStoredId;
                if (!initialId || !ids.includes(initialId)) {
                    initialId = ids[0];
                }

                setSelectedMenuId(initialId);
                localStorage.setItem("lastMenuId", initialId);

                if (paramMenuId !== initialId) {
                    navigate(`/dashboard/${initialId}`, { replace: true });
                }

                await loadMenuById(initialId);
            } catch (err) {
                console.error(err);
                setError(err.message);
                setLoading(false);
            }
        };

        fetchMenusAndSelect();
    }, [paramMenuId]);

    // Load summary once
    useEffect(() => {
        fetchSummary();
    }, []);

    // Change menu
    const handleMenuChange = async (e) => {
        const newId = e.target.value;

        setSelectedMenuId(newId);
        localStorage.setItem("lastMenuId", newId);
        navigate(`/dashboard/${newId}`, { replace: true });

        await loadMenuById(newId);
    };

    // ---------------------------------------
    // Handle Taken Qty edits
    // ---------------------------------------
    const handleTakenChange = async (index, newValue) => {
        const taken = Math.max(0, Number(newValue) || 0);

        setItems((prev) => {
            const copy = [...prev];
            const item = { ...copy[index] };
            item.taken = Math.min(taken, item.qty);
            copy[index] = item;
            return copy;
        });

        const currentItems = items.map((it, idx) =>
            idx === index ? { ...it, taken: Math.min(taken, it.qty) } : it
        );

        await saveMenuToBackend(selectedMenuId, currentItems, menuName);
    };

    // ---------------------------------------
    // Render
    // ---------------------------------------
    return (
        <div className="d-flex flex-column min-vh-100">
            <Navbar />

            <main className="flex-grow-1">
                <div className="container mt-5 pt-5 pb-5">
                    {/* Header */}
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
                        <div>
                            <h1 className="h3 fw-semibold mb-0">
                                {menuName
                                    ? `Dashboard — ${menuName}`
                                    : "Dashboard"}
                            </h1>
                            <small className="text-muted">
                                Track items, leftovers, and waste for your
                                selected menu.
                            </small>
                        </div>

                        <div className="d-flex flex-column">
                            <label className="form-label mb-1">
                                Select Menu
                            </label>
                            <select
                                className="form-select"
                                value={selectedMenuId || ""}
                                onChange={handleMenuChange}
                            >
                                <option value="" disabled>
                                    Choose a menu...
                                </option>
                                {menus.map((menu) => (
                                    <option
                                        key={menu.id || menu._id}
                                        value={menu.id || menu._id}
                                    >
                                        {menu.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Loading state */}
                    {loading && (
                        <div className="text-center py-4">
                            <div className="spinner-border text-primary"></div>
                            <p className="mt-2 mb-0">Loading menu...</p>
                        </div>
                    )}

                    {error && !loading && (
                        <div className="alert alert-danger" role="alert">
                            {error}
                        </div>
                    )}

                    {/* Dashboard */}
                    {!loading && !error && items.length > 0 && (
                        <div className="row g-4">
                            {/* LEFT HALF: Item / Qty / Taken / Leftovers / Waste */}
                            <div className="col-12 col-lg-6">
                                <div className="card shadow-sm h-100">
                                    <div className="card-body">
                                        <h5 className="card-title mb-3">
                                            Menu Breakdown
                                        </h5>
                                        <div className="row g-3">
                                            {[
                                                "Item",
                                                "Initial Qty",
                                                "Taken Qty",
                                                "Leftovers",
                                                "Wasted Qty",
                                            ].map((title, colIdx) => (
                                                <div
                                                    key={colIdx}
                                                    className="col-6"
                                                >
                                                    <h6 className="fw-semibold mb-2">
                                                        {title}
                                                    </h6>
                                                    <ul className="list-group">
                                                        {items.map(
                                                            (data, idx) => {
                                                                const leftovers =
                                                                    data.qty -
                                                                    data.taken;

                                                                if (
                                                                    title ===
                                                                    "Taken Qty"
                                                                ) {
                                                                    return (
                                                                        <li
                                                                            key={
                                                                                idx
                                                                            }
                                                                            className="list-group-item p-1"
                                                                        >
                                                                            <input
                                                                                type="number"
                                                                                className="form-control form-control-sm"
                                                                                min="0"
                                                                                max={
                                                                                    data.qty
                                                                                }
                                                                                value={
                                                                                    data.taken
                                                                                }
                                                                                onChange={(
                                                                                    e
                                                                                ) =>
                                                                                    handleTakenChange(
                                                                                        idx,
                                                                                        e
                                                                                            .target
                                                                                            .value
                                                                                    )
                                                                                }
                                                                            />
                                                                        </li>
                                                                    );
                                                                }

                                                                let value;
                                                                switch (title) {
                                                                    case "Item":
                                                                        value =
                                                                            data.item;
                                                                        break;
                                                                    case "Initial Qty":
                                                                        value =
                                                                            data.qty;
                                                                        break;
                                                                    case "Leftovers":
                                                                        value =
                                                                            leftovers;
                                                                        break;
                                                                    case "Wasted Qty":
                                                                        value =
                                                                            data.wasted;
                                                                        break;
                                                                    default:
                                                                        value =
                                                                            "";
                                                                }

                                                                return (
                                                                    <DashboardItem
                                                                        key={
                                                                            idx
                                                                        }
                                                                        item={
                                                                            value
                                                                        }
                                                                    />
                                                                );
                                                            }
                                                        )}
                                                    </ul>
                                                </div>
                                            ))}
                                        </div>
                                        {saving && (
                                            <small className="text-muted mt-2 d-block">
                                                Saving changes...
                                            </small>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT HALF: Analytics + Summary */}
                            <div className="col-12 col-lg-6 d-flex flex-column gap-3">
                                {/* Analytics */}
                                <div className="card shadow-sm">
                                    <div className="card-body">
                                        <h5 className="card-title mb-2">
                                            Analytics
                                        </h5>
                                        <p className="text-muted mb-1">
                                            Scans recorded: 0
                                        </p>
                                        <p className="text-muted mb-3">
                                            No analytics yet. Once you start
                                            scanning items, we’ll show waste
                                            insights here.
                                        </p>

                                        <h6 className="fw-semibold">
                                            Top wasted items
                                        </h6>
                                        <p className="text-muted mb-0">
                                            No wasted items yet.
                                        </p>
                                    </div>
                                </div>

                                {/* Summary */}
                                <div className="card shadow-sm flex-grow-1">
                                    <div className="card-body d-flex flex-column">
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                            <h5 className="card-title mb-0">
                                                Summary
                                            </h5>
                                            <button
                                                className="btn btn-sm btn-outline-primary"
                                                onClick={fetchSummary}
                                                disabled={summaryLoading}
                                            >
                                                {summaryLoading ? (
                                                    <>
                                                        <span className="spinner-border spinner-border-sm me-2" />
                                                        Updating...
                                                    </>
                                                ) : (
                                                    "Refresh"
                                                )}
                                            </button>
                                        </div>

                                        <div
                                            className="mt-2"
                                            style={{ minHeight: "60px" }}
                                        >
                                            {summaryLoading ? (
                                                <div className="d-flex align-items-center">
                                                    <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                                                    <span>
                                                        Generating summary...
                                                    </span>
                                                </div>
                                            ) : (
                                                <div
                                                    className="text-muted"
                                                    style={{
                                                        whiteSpace: "pre-wrap",
                                                    }}
                                                >
                                                    <ReactMarkdown>
                                                        {summary ||
                                                            "No summary yet"}
                                                    </ReactMarkdown>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Empty state if there are no items but no error */}
                    {!loading && !error && items.length === 0 && (
                        <div className="alert alert-info mt-3">
                            This menu doesn’t have any items yet.
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}

export default Home;
