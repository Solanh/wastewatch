import React from "react";
import Navbar from "../components/navbar";
import Footer from "../components/Footer";
import DashboardItem from "../components/DashboardItem";

const test = [
    { item: "Apple", qty: 10, taken: 5, wasted: 1 },
    { item: "Banana", qty: 12, taken: 3, wasted: 2 },
    { item: "John", qty: 1, taken: 1, wasted: 1 },
];

function Home() {
    return (
        <>
            <Navbar />
            <div className="container mt-5 pt-5">
                <div className="display-3 mb-4">Home</div>

                <div className="row">
                    {/* Dashboard columns */}
                    {["Item", "Initial Qty", "Taken Qty", "Leftovers", "Wasted Qty"].map(
                        (title, colIdx) => (
                            <div key={colIdx} className="col-12 col-md-6 col-lg-2 mb-3">
                                <h5>{title}</h5>
                                <ul className="list-group">
                                    {test.map((data, idx) => {
                                        let value;
                                        switch (title) {
                                            case "Item":
                                                value = data.item;
                                                break;
                                            case "Initial Qty":
                                                value = data.qty;
                                                break;
                                            case "Taken Qty":
                                                value = data.taken;
                                                break;
                                            case "Leftovers":
                                                value = data.qty - data.taken;
                                                break;
                                            case "Wasted Qty":
                                                value = data.wasted;
                                                break;
                                            default:
                                                value = "";
                                        }
                                        return <DashboardItem key={idx} item={value} />;
                                    })}
                                </ul>
                            </div>
                        )
                    )}

                    {/* Right-side analytics panel */}
                    <div className="col-12 col-lg-2 mb-3">
                        <div className="card p-3 mb-3">
                            <h6>Analytics <span style={{float: "right", color: "red", cursor: "pointer"}}>Clear</span></h6>
                            <p>Scans recorded: 0</p>
                            <p className="text-muted">No data yet</p>
                            <h6>Top wasted items</h6>
                            <p className="text-muted">No wasted items yet</p>
                        </div>

                        <div className="card p-3">
                            <h6>Summary</h6>
                            <button className="btn btn-primary mt-2">Refresh</button>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
}

export default Home;
