import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import RoleNavbar from "../components/RoleNavbar";
import "./DashboardHome.css";

function FacultyHome() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("staffToken");
    const raw = localStorage.getItem("staffUser");

    if (!token || !raw) {
      navigate("/");
      return;
    }

    const user = JSON.parse(raw);
    if (user.role !== "faculty") {
      navigate("/");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("staffToken");
    localStorage.removeItem("staffUser");
  };

  return (
    <div className="dash-page">
      <div className="dash-shell">
        <RoleNavbar role="faculty" onLogout={handleLogout} />

        <section className="hero-card faculty">
          <h1>Faculty Dashboard</h1>
          <p>Enter student marks semester-wise, upload bulk CSV, and download class marks sheets.</p>
          <button onClick={() => navigate("/staff")}>Open Marks Entry Panel</button>
        </section>
      </div>
    </div>
  );
}

export default FacultyHome;
