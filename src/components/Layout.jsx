// src/components/Layout.jsx
import { Outlet } from "react-router-dom";
import Header from "./header";

export default function Layout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <Header />
      {/* spacer so content isn't under the floating header */}
      <div className="h-20" />
      <Outlet />
    </div>
  );
}