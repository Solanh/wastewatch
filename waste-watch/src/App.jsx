import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import AddItem from "./pages/AddItem";
import AddMenu from "./pages/AddMenu";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/add-item" element={<AddItem />} />
        <Route path="/add-menu" element={<AddMenu />} />
      </Routes>
    </>
  );
}

export default App;
