// src/pages/Reports.jsx
import React, { useEffect, useState, useRef } from "react";
import Navbar from "../components/navbar";
import Footer from "../components/Footer";
import { Bar } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const API_BASE = "/api";

function Reports() {
    const [menus, setMenus] = useState([]);
    const [selectedMenuId, setSelectedMenuId] = useState("");
    const [scope, setScope] = useState("menu"); // "menu", "day", "week", "month"

    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const summaryRequestIdRef = useRef(0);

    // Load menus on mount
    useEffect(() => {
        const fetchMenus = async () => {
            try {
                setLoading(true);
                setError("");

                const res = await fetch(`${API_BASE}/menus`);
                if (!res.ok) {
                    const text = await res.text();
                    throw new Error(text || "Failed to fetch menus");
                }

                const data = await res.json();
                const normalized = data.map((m) => ({
                    ...m,
                    id: String(m.id ?? m._id),
                }));

                setMenus(normalized);

                // default to first menu, but allow "All menus"
                if (normalized.length > 0) {
                    setSelectedMenuId(String(normalized[0].id));
                    await fetchSummary(String(normalized[0].id), scope);
                } else {
                    // still fetch global summary
                    await fetchSummary("", scope);
                }
            } catch (err) {
                console.error(err);
                setError(err.message || "Failed to load reports");
            } finally {
                setLoading(false);
            }
        };

        const fetchSummary = async (menuId, currentScope) => {
            const requestId = ++summaryRequestIdRef.current;

            try {
                setLoading(true);
                setError("");

                const params = new URLSearchParams();
                if (menuId) params.set("menu_id", String(menuId));
                if (currentScope) params.set("scope", currentScope);

                const url = params.toString()
                    ? `${API_BASE}/waste-summary?${params.toString()}`
                    : `${API_BASE}/waste-summary`;

                const res = await fetch(url);
                if (!res.ok) throw new Error("Failed to fetch summary");

                const data = await res.json();

                if (requestId !== summaryRequestIdRef.current) return;
                setSummary(data);
            } catch (err) {
                console.error(err);
                if (requestId !== summaryRequestIdRef.current) return;
                setError(err.message || "Failed to load reports");
            } finally {
                if (requestId === summaryRequestIdRef.current) {
                    setLoading(false);
                }
            }
        };

        // call inner function
        fetchMenus();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchSummary = async (menuId, currentScope) => {
        const requestId = ++summaryRequestIdRef.current;

        try {
            setLoading(true);
            setError("");

            const params = new URLSearchParams();
            if (menuId) params.set("menu_id", String(menuId));
            if (currentScope) params.set("scope", currentScope);

            const url = params.toString()
                ? `${API_BASE}/waste-summary?${params.toString()}`
                : `${API_BASE}/waste-summary`;

            const res = await fetch(url);
            if (!res.ok) throw new Error("Failed to fetch summary");

            const data = await res.json();

            if (requestId !== summaryRequestIdRef.current) return;
            setSummary(data);
        } catch (err) {
            console.error(err);
            if (requestId !== summaryRequestIdRef.current) return;
            setError(err.message || "Failed to load reports");
        } finally {
            if (requestId === summaryRequestIdRef.current) {
                setLoading(false);
            }
        }
    };

    const handleMenuChange = async (e) => {
        const newId = e.target.value;
        setSelectedMenuId(newId);
        await fetchSummary(newId || "", scope);
    };

    const handleScopeChange = async (e) => {
        const newScope = e.target.value;
        setScope(newScope);
        await fetchSummary(selectedMenuId || "", newScope);
    };

    const hasData =
        summary &&
        Array.isArray(summary.individual_waste) &&
        summary.individual_waste.length > 0;

    let content;

    if (loading && !summary) {
        content = (
            <div className="text-center mt-5">
                <div className="spinner-border text-primary"></div>
                <p className="mt-2 mb-0">Loading reports...</p>
            </div>
        );
    } else if (error) {
        content = (
            <p className="text-center mt-5 text-danger">
                {error}
            </p>
        );
    } else if (!hasData) {
        content = (
            <p className="text-center mt-5">
                No data available yet.
            </p>
        );
    } else {
        // Prepare data
        const items = summary.individual_waste;
        const topItems = items.slice(0, 8); // top 8 by total_waste (already sorted)

        const leastWasteful = [...items]
            .sort((a, b) => a.total_waste - b.total_waste)
            .slice(0, 3);

        const totalWaste = summary.total_waste || 0;
        const totalItemsTracked = items.length;

        const chartData = {
            labels: topItems.map((w) => w.item),
            datasets: [
                {
                    label: "Leftovers",
                    data: topItems.map((w) => w.leftovers),
                    backgroundColor: "rgba(54, 162, 235, 0.7)",
                },
                {
                    label: "Wasted",
                    data: topItems.map((w) => w.wasted),
                    backgroundColor: "rgba(255, 99, 132, 0.7)",
                },
            ],
        };

        const options = {
            responsive: true,
            plugins: {
                legend: { position: "top" },
                title: {
                    display: true,
                    text: "Top Items by Total Waste (Leftovers + Wasted)",
                },
            },
            scales: {
                x: {
                    stacked: true,
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                },
            },
        };

        content = (
            <>
                {/* Summary cards */}
                <div className="row g-3 mb-4">
                    <div className="col-12 col-md-4">
                        <div className="card shadow-sm h-100">
                            <div className="card-body">
                                <h6 className="text-muted mb-1">Total Waste</h6>
                                <p className="fs-4 fw-semibold mb-0">
                                    {totalWaste}
                                </p>
                                <small className="text-muted">
                                    Combined leftovers + wasted servings
                                </small>
                            </div>
                        </div>
                    </div>
                    <div className="col-12 col-md-4">
                        <div className="card shadow-sm h-100">
                            <div className="card-body">
                                <h6 className="text-muted mb-1">
                                    Items Tracked
                                </h6>
                                <p className="fs-4 fw-semibold mb-0">
                                    {totalItemsTracked}
                                </p>
                                <small className="text-muted">
                                    Unique menu items in this view
                                </small>
                            </div>
                        </div>
                    </div>
                    <div className="col-12 col-md-4">
                        <div className="card shadow-sm h-100">
                            <div className="card-body">
                                <h6 className="text-muted mb-1">
                                    Most Wasted Item
                                </h6>
                                <p className="fw-semibold mb-1">
                                    {items[0].item}
                                </p>
                                <small className="text-muted">
                                    Leftovers: {items[0].leftovers} &middot; Wasted: {items[0].wasted}
                                </small>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main chart */}
                <div
                    className="p-4 rounded-4 shadow-sm mx-auto mb-4"
                    style={{
                        maxWidth: "900px",
                        background: "linear-gradient(135deg, #FFE6F2, #E3F2FF)",
                        border: "2px solid #ffffffaa",
                    }}
                >
                    <Bar data={chartData} options={options} />
                </div>

                {/* Least wasteful items */}
                <div className="row g-3">
                    <div className="col-12 col-md-6">
                        <div className="card shadow-sm h-100">
                            <div className="card-body">
                                <h5 className="card-title mb-3">
                                    Least Wasteful Items
                                </h5>
                                <ul className="list-group list-group-flush">
                                    {leastWasteful.map((item) => (
                                        <li
                                            key={item.item}
                                            className="list-group-item d-flex justify-content-between align-items-center"
                                        >
                                            <span>{item.item}</span>
                                            <span className="badge bg-success rounded-pill">
                                                Total waste: {item.total_waste}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                                <small className="text-muted d-block mt-2">
                                    These are good candidates to highlight or
                                    promote more.
                                </small>
                            </div>
                        </div>
                    </div>

                    <div className="col-12 col-md-6">
                        <div className="card shadow-sm h-100">
                            <div className="card-body">
                                <h5 className="card-title mb-3">
                                    Top 3 Most Wasted Items
                                </h5>
                                <ul className="list-group list-group-flush">
                                    {items.slice(0, 3).map((item) => (
                                        <li
                                            key={item.item}
                                            className="list-group-item d-flex justify-content-between align-items-center"
                                        >
                                            <span>{item.item}</span>
                                            <span className="badge bg-danger rounded-pill">
                                                Total waste: {item.total_waste}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                                <small className="text-muted d-block mt-2">
                                    Consider menu tweaks or portion changes here.
                                </small>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <div className="d-flex flex-column min-vh-100">
            <Navbar />
            <main className="flex-grow-1 pb-5">
                <div className="container mt-5 pt-5 mb-5">
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
                        <div>
                            <h2 className="mb-1">Reports</h2>
                            <small className="text-muted">
                                Explore waste patterns across menus and time.
                            </small>
                        </div>

                        <div className="d-flex flex-wrap gap-2">
                            <div>
                                <label className="form-label mb-1">
                                    Menu
                                </label>
                                <select
                                    className="form-select form-select-sm"
                                    value={selectedMenuId}
                                    onChange={handleMenuChange}
                                >
                                    {menus.length === 0 && (
                                        <option value="">
                                            All menus
                                        </option>
                                    )}
                                    {menus.length > 0 && (
                                        <>
                                            <option value="">
                                                All menus
                                            </option>
                                            {menus.map((m) => (
                                                <option key={m.id} value={m.id}>
                                                    {m.name}
                                                </option>
                                            ))}
                                        </>
                                    )}
                                </select>
                            </div>

                            <div>
                                <label className="form-label mb-1">
                                    Time Window
                                </label>
                                <select
                                    className="form-select form-select-sm"
                                    value={scope}
                                    onChange={handleScopeChange}
                                >
                                    <option value="menu">Current Menu (all)</option>
                                    <option value="day">Today</option>
                                    <option value="week">This Week</option>
                                    <option value="month">This Month</option>
                                </select>
                            </div>

                            <div className="d-flex align-items-end">
                                <button
                                    className="btn btn-sm btn-outline-primary"
                                    onClick={() =>
                                        fetchSummary(
                                            selectedMenuId || "",
                                            scope
                                        )
                                    }
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" />
                                            Updating...
                                        </>
                                    ) : (
                                        "Refresh"
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {content}
                </div>
            </main>
            <Footer />
        </div>
    );
}

export default Reports;
