import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/AppLayout.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Profile from "./pages/Profile.jsx";
import Scholarships from "./pages/Scholarships.jsx";
import OcrAnalyzer from "./pages/OcrAnalyzer.jsx";
import ReadinessScore from "./pages/ReadinessScore.jsx";
import FailureDiagnosis from "./pages/FailureDiagnosis.jsx";
import Chatbot from "./pages/Chatbot.jsx";
import AwarenessGuide from "./pages/AwarenessGuide.jsx";
import Notifications from "./pages/Notifications.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import DocumentVault from "./pages/DocumentVault.jsx";
import RiskAnalyzer from "./pages/RiskAnalyzer.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/scholarships" element={<Scholarships />} />
        <Route path="/ocr-analyzer" element={<OcrAnalyzer />} />
        <Route path="/readiness-score" element={<ReadinessScore />} />
        <Route path="/failure-diagnosis" element={<FailureDiagnosis />} />
        <Route path="/chatbot" element={<Chatbot />} />
        <Route path="/awareness" element={<AwarenessGuide />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/document-vault" element={<DocumentVault />} />
        <Route path="/risk-analyzer" element={<RiskAnalyzer />} />
        </Route>
      </Route>
      <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
        <Route element={<AppLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Route>
      </Route>
    </Routes>
  );
}
