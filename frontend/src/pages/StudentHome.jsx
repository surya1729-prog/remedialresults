import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import RoleNavbar from "../components/RoleNavbar";
import "./DashboardHome.css";

function StudentHome() {
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const raw = localStorage.getItem("student");

    if (!token || !raw) {
      navigate("/");
      return;
    }

    setStudent(JSON.parse(raw));
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("student");
  };

  return (
    <div className="dash-page">
      <div className="dash-shell">
        <RoleNavbar role="student" onLogout={handleLogout} />

        <section className="hero-card student">
          <h1>Welcome to Student Dashboard</h1>
          <p>
            {student
              ? `${student.name} (${student.rollNumber}) - ${student.branch} Year ${student.year}`
              : "View your transparent results with complete internal and external marks."}
          </p>
          <button onClick={() => navigate("/result")}>View Result and Marksheet</button>
        </section>
      </div>
    </div>
  );
}

export default StudentHome;
