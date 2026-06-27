import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import Topbar from "./Topbar.jsx";
import FloatingChat from "./FloatingChat.jsx";

export default function AppLayout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-panel">
        <Topbar />
        <section className="content-wrap">
          <Outlet />
        </section>
      </main>
      <FloatingChat />
    </div>
  );
}
