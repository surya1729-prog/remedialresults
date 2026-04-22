import { Link, useNavigate } from "react-router-dom";
import "./RoleNavbar.css";

function RoleNavbar({ role, onLogout }) {
  const navigate = useNavigate();

  const linksByRole = {
    student: [
      { to: "/student", label: "Dashboard" },
      { to: "/result", label: "Result" }
    ],
    faculty: [
      { to: "/faculty", label: "Dashboard" },
      { to: "/staff", label: "Marks Entry" }
    ],
    admin: [
      { to: "/admin", label: "Dashboard" },
      { to: "/staff", label: "System Control" }
    ]
  };

  const links = linksByRole[role] || [];

  const handleLogout = () => {
    onLogout?.();
    navigate("/");
  };

  return (
    <nav className="role-nav">
      <div className="brand">
        <img src="/rgukt-logo.svg" alt="RGUKT" />
        <div>
          <strong>RGUKT R.K Valley</strong>
          <span>Result Transparency System</span>
        </div>
      </div>

      <div className="links">
        {links.map((item) => (
          <Link key={item.to} to={item.to}>
            {item.label}
          </Link>
        ))}
      </div>

      <button onClick={handleLogout}>Logout</button>
    </nav>
  );
}

export default RoleNavbar;
