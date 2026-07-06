import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import Topbar from "./Topbar.jsx";
import FloatingChat from "./FloatingChat.jsx";
import OnboardingModal from "./OnboardingModal.jsx";
import { profileApi } from "../services/api.js";

export default function AppLayout() {
  const [showOnboarding, setShowOnboarding] = React.useState(false);

  React.useEffect(() => {
    // Already completed onboarding
    if (localStorage.getItem("scholarsense_onboarded")) return;

    // Check if profile has key fields filled
    profileApi.getMine()
      .then(data => {
        const p = data.profile;
        const isEmpty = !p || (!p.fullName && !p.category && !p.bankName);
        if (isEmpty) setShowOnboarding(true);
        else localStorage.setItem("scholarsense_onboarded", "true");
      })
      .catch(() => {});
  }, []);

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
      {showOnboarding && (
        <OnboardingModal onComplete={() => setShowOnboarding(false)} />
      )}
    </div>
  );
}
