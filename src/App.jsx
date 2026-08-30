import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Tournaments from "./pages/Tournaments";
import TournamentDetails from "./pages/TournamentDetails";
import TeamRegistration from "./pages/TeamRegistration";
import PaymentCheckout from "./pages/PaymentCheckout";
import Schedule from "./pages/Schedule";
import Leaderboard from "./pages/Leaderboard";
import LiveMatch from "./pages/LiveMatch";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";
import TeamDetail from "./pages/TeamDetail";
import NotFound from "./pages/NotFound";
import RoleRoute from "./components/RoleRoute";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tournaments" element={<Tournaments />} />
        <Route path="/tournaments/:id" element={<TournamentDetails />} />
        <Route path="/tournaments/:id/register" element={<TeamRegistration />} />
        <Route path="/tournaments/:id/payment" element={<PaymentCheckout />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/match/:id" element={<LiveMatch />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<RoleRoute role="player"><Dashboard /></RoleRoute>} />
        <Route path="/team/:id" element={<TeamDetail />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/admin" element={<RoleRoute role="admin"><AdminDashboard /></RoleRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}
