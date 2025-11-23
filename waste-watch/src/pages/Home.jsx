// src/pages/Home.jsx
import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/navbar";
import Footer from "../components/Footer";
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
    const [summaryScope, setSummaryScope] = useState("menu"); // "menu", "day", "week", "month"

    // Prevent double-init in React 18 StrictMode
    const hasInitializedRef = useRef(false);

    // For cancelling / ignoring stale summary requests
    const summaryRequestIdRef = useRef(0);

    const getTopWastedItem = () => {
        if (!items || items.length === 0) return null;

        const highest = items.reduce((max, curr) =>
            curr.wasted > max.wasted ? curr : max
        );

        return highest;
    };

    // ---------------------------------------
    // Save menu
    // ---------------------------------------
    const saveMenuToBackend = async (id, currentItems, currentName) => {
        if (!id) return;

        try {
            setSaving(true);

            // Look up the menu metadata (including meal_period) from state
            const currentMenuMeta = menus.find(
                (m) => String(m.id ?? m._id) === String(id)
            );
            const meal_period = currentMenuMeta?.meal_period ?? 1; // default to breakfast if missing

            const payload = {
                name: currentName,
                meal_period,
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
    // Summary (for current menu + scope)
    // ---------------------------------------
    const fetchSummary = async (menuId, scope) => {
        const targetMenuId = menuId ?? selectedMenuId;
        const targetScope = scope ?? summaryScope;

        if (!targetMenuId) {
            setSummary("Select a menu to see a summary.");
            return;
        }

        const requestId = ++summaryRequestIdRef.current;

        try {
            setSummaryLoading(true);

            const params = new URLSearchParams({
                menu_id: String(targetMenuId),
                scope: targetScope,
            });

            const res = await fetch(`${API_BASE}/summary?${params.toString()}`);
            if (!res.ok) throw new Error("Failed to fetch summary");

            const data = await res.json();

            // Ignore if another request started after this one
            if (requestId !== summaryRequestIdRef.current) return;

            setSummary(data.summary);
        } catch (err) {
            console.error(err);
            if (requestId !== summaryRequestIdRef.current) return;
            setSummary("Error fetching summary");
        } finally {
            if (requestId === summaryRequestIdRef.current) {
                setSummaryLoading(false);
            }
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
        if (hasInitializedRef.current) return;
        hasInitializedRef.current = true;

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

                // Normalize IDs as strings for consistency
                const normalized = data.map((m) => ({
                    ...m,
                    id: String(m.id ?? m._id),
                }));

                setMenus(normalized);

                if (normalized.length === 0) {
                    setMenuName("");
                    setItems([]);
                    setSelectedMenuId("");
                    setLoading(false);
                    return;
                }

                const lastStoredId = localStorage.getItem("lastMenuId");
                const ids = normalized.map((m) => m.id);

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
                await fetchSummary(initialId, summaryScope);
            } catch (err) {
                console.error(err);
                setError(err.message);
                setLoading(false);
            }
        };

        fetchMenusAndSelect();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paramMenuId, navigate]);

    // Change menu
    const handleMenuChange = async (e) => {
        const newId = e.target.value;

        setSelectedMenuId(newId);
        localStorage.setItem("lastMenuId", newId);
        navigate(`/dashboard/${newId}`, { replace: true });

        await loadMenuById(newId);
        await fetchSummary(newId, summaryScope);
    };

    // Change summary scope
    const handleScopeChange = async (e) => {
        const newScope = e.target.value;
        setSummaryScope(newScope);
        await fetchSummary(selectedMenuId, newScope);
    };

    // ---------------------------------------
    // Handle Taken Qty edits
    // ---------------------------------------
    const handleTakenChange = (index, newValue) => {
        const taken = Math.max(0, Number(newValue) || 0);

        setItems((prev) => {
            const updated = prev.map((it, idx) =>
                idx === index
                    ? { ...it, taken: Math.min(taken, it.qty) }
                    : it
            );

            // Save updated items for current menu
            saveMenuToBackend(selectedMenuId, updated, menuName);

            return updated;
        });
    };

    // ---------------------------------------
    // Render
    // ---------------------------------------
    return (
        <div className="d-flex flex-column min-vh-100">
            <Navbar />

            <main className="flex-grow-1 mb-5">
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
                                    <option key={menu.id} value={menu.id}>
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

                                                                const baseLiProps =
                                                                    {
                                                                        key: idx,
                                                                        className:
                                                                            "list-group-item p-1 d-flex align-items-center",
                                                                        style: {
                                                                            minHeight:
                                                                                "38px",
                                                                        },
                                                                    };

                                                                if (
                                                                    title ===
                                                                    "Taken Qty"
                                                                ) {
                                                                    return (
                                                                        <li
                                                                            {
                                                                                ...baseLiProps
                                                                            }
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
                                                                    <li
                                                                        {
                                                                            ...baseLiProps
                                                                        }
                                                                    >
                                                                        <span>
                                                                            {
                                                                                value
                                                                            }
                                                                        </span>
                                                                    </li>
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
                                {/* Analytics (commented for now, but helper exists) */}
                                {/* <div className="card shadow-sm">
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
                                            Top wasted item
                                        </h6>
                                        {(() => {
                                            const top = getTopWastedItem();
                                            if (!top || top.wasted === 0)
                                                return (
                                                    <p className="text-muted mb-0">
                                                        No wasted items yet.
                                                    </p>
                                                );

                                            return (
                                                <p className="mb-0">
                                                    <strong>
                                                        {top.item}
                                                    </strong>{" "}
                                                    — {top.wasted} wasted
                                                </p>
                                            );
                                        })()}
                                    </div>
                                </div> */}

                                {/* Summary */}
                                <div className="card shadow-sm flex-grow-1">
                                    <div className="card-body d-flex flex-column">
                                        <div className="d-flex flex-wrap justify-content-between align-items-center mb-2 gap-2">
                                            <div className="d-flex align-items-center gap-2">
                                                <h5 className="card-title mb-0">
                                                    Summary
                                                </h5>
                                                <select
                                                    className="form-select form-select-sm w-auto"
                                                    value={summaryScope}
                                                    onChange={handleScopeChange}
                                                >
                                                    <option value="menu">
                                                        Current Menu
                                                    </option>
                                                    <option value="day">
                                                        Today
                                                    </option>
                                                    <option value="week">
                                                        This Week
                                                    </option>
                                                    <option value="month">
                                                        This Month
                                                    </option>
                                                </select>
                                            </div>

                                            <button
                                                className="btn btn-sm btn-outline-primary"
                                                onClick={() =>
                                                    fetchSummary()
                                                }
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
