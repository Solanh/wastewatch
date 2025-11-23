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
import MenusList from "./pages/MenuList";
import EditMenu from "./pages/EditMenu";

function App() {
  const [count, setCount] = useState(0);

<<<<<<< HEAD
    return (
        <>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/add-item" element={<AddItem />} />
                <Route path="/menus/new" element={<AddMenu />} />
                <Route path="/menus" element={<MenusList />} />
                <Route path="/menus/:id" element={<EditMenu />} />
            </Routes>
        </>
    );
=======
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
>>>>>>> c1dff8e277e4e6d3b048ac564e2f854d6ccbda0f
}

export default App;
