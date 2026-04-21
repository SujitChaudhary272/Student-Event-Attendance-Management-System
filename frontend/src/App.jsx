import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

/* Public Pages */
import Home from "./pages/public/Home";
import ClubEventsPage from "./pages/public/ClubEventsPage";
import EventExplorePage from "./pages/public/EventExplorePage";

/* Student */
import StudentDashboard from "./pages/student/StudentDashboard";
import FirstTimeJoinFlow from "./pages/student/FirstTimeJoinFlow";
/* Organizer */
import OrganizerDashboard from "./pages/organizer/OrganizerDashboard";
import EventManagement from "./pages/organizer/EventManagement";

/* Admin */
import AdminDashboard from "./pages/admin/AdminDashboard";
import ManageClubs from "./pages/admin/ManageClubs";
import ManageMembers from "./pages/admin/ManageMembers";
import AdminReports from "./pages/admin/AdminReports";
import AdminClubEvents from "./pages/admin/AdminClubEvents";
import AdminEventParticipants from "./pages/admin/AdminEventParticipants";
import AdminRoute from "./routes/ProtectedRoute";
import OrganizerRoute from "./routes/OrganizerRoute";


/* Auth */
import StudentLogin from "./pages/auth/Login";        // student only
import StudentRegister from "./pages/auth/Register";
import ClubLogin from "./pages/auth/ClubLogin";
import AdminLogin from "./pages/auth/AdminLogin";

export default function App() {
  return (
    <Router>
      <div className="ucef-app">
      <Routes>

        {/* ================= PUBLIC ================= */}
        {/* Landing Page */}
        <Route path="/" element={<Home />} /> 
        <Route path="/club/:clubId" element={<ClubEventsPage />} />
        <Route path="/event/:eventId" element={<EventExplorePage />} />

        {/* ================= STUDENT ================= */}
        <Route path="/student/login" element={<StudentLogin />} />
        <Route path="/register" element={<StudentRegister />} />
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/club/:clubId/event/:eventId/join" element={<FirstTimeJoinFlow />} />

        {/* ================= ORGANIZER ================= */}
        <Route path="/organizer/login" element={<ClubLogin />} />
        <Route path="/organizer/dashboard" element={<OrganizerRoute><OrganizerDashboard /></OrganizerRoute>} />
        <Route path="/organizer/event/:eventId" element={<OrganizerRoute><EventManagement /></OrganizerRoute>} />

        

        {/* ================= ADMIN ================= */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/clubs" element={<AdminRoute><ManageClubs /></AdminRoute>} />
        <Route path="/admin/clubs/:clubId/members" element={<AdminRoute><ManageMembers /></AdminRoute>} />
        <Route path="/admin/clubs/:clubId/events" element={<AdminRoute><AdminClubEvents /></AdminRoute>} />
        <Route path="/admin/events/:eventId/participants" element={<AdminRoute><AdminEventParticipants /></AdminRoute>} />
        <Route path="/admin/reports" element={<AdminRoute><AdminReports /></AdminRoute>} />

        {/* ================= FALLBACK ================= */}
        {/* <Route path="*" element={<NotFound />} /> */}

      </Routes>
      </div>
    </Router>
  );
}
