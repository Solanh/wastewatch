import React from "react";
import logo from "../assets/logo.png";
import { Link } from "react-router-dom";

function Navbar() {
    return (
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark fixed-top py-3">
            <div className="container-fluid">
                <Link to="/">
                    <img
                        className="nav-brand rounded-circle me-3"
                        src={logo}
                        alt="Waste Watch Logo"
                        height={54}
                    />
                </Link>

                <button
                    className="navbar-toggler"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#navbarNav"
                    aria-controls="navbarNav"
                    aria-expanded="false"
                    aria-label="Toggle navigation"
                >
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse" id="navbarNav">
                    <ul className="navbar-nav">
                        <li className="nav-item">
                            <Link className="nav-link active" to="/">
                                Dashboard
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link active" to="/reports">
                                Reports
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link active" to="/menus">
                                Menus
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link active" to="/settings">
                                Settings
                            </Link>
                        </li>
                        {/* <li className="nav-item">
                            <a className="nav-link" href="#">
                                Pricing
                            </a>
                        </li> */}
                        {/* <li className="nav-item">
                            <a className="nav-link disabled" aria-disabled="true">
                                Disabled
                            </a>
                        </li> */}
                    </ul>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
