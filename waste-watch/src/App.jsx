import { useState } from "react";
import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import AddItem from "./pages/AddItem";
import AddMenu from "./pages/AddMenu";
import MenusList from "./pages/MenuList";
import EditMenu from "./pages/EditMenu";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/add-item" element={<AddItem />} />
                <Route path="/menus/new" element={<AddMenu />} />
                <Route path="/menus" element={<MenusList />} />
                <Route path="/menus/:id" element={<EditMenu />} />
                <Route path="/dashboard/:menuId" element={<Home />} />

            </Routes>
        </BrowserRouter>
    );
}

export default App;
