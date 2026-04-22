import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Toast from "../components/Toast";
import "./Login.css";

function Login() {
  const [loginRole, setLoginRole] = useState("student");
  const [rollNumber, setRollNumber] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [toast, setToast] = useState({ type: "info", message: "" });
  const navigate = useNavigate();

  const showToast = (type, message) => {
    setToast({ type, message });
  };

  const clearToast = () => {
    setToast({ type: "info", message: "" });
  };

  const handleStudentLogin = async () => {
    if (!rollNumber.trim()) {
      showToast("error", "Roll Number is required");
      return;
    }

    if (!password.trim()) {
      showToast("error", "Password is required");
      return;
    }

    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", {
        rollNumber,
        password,
      });

      // Save token
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("student", JSON.stringify(res.data.student));

      showToast("success", "Student login successful");
      navigate("/student");

    } catch (err) {
      showToast("error", err?.response?.data?.message || "Student login failed");
    }
  };

  const handleStaffLogin = async () => {
    if (!username.trim()) {
      showToast("error", "Username is required");
      return;
    }

    if (!password.trim()) {
      showToast("error", "Password is required");
      return;
    }

    try {
      const res = await axios.post("http://localhost:5000/api/auth/staff-login", {
        role: loginRole,
        username,
        password,
      });

      localStorage.setItem("staffToken", res.data.token);
      localStorage.setItem("staffUser", JSON.stringify(res.data.user));
      showToast("success", `${loginRole} login successful`);
      navigate(loginRole === "admin" ? "/admin" : "/faculty");
    } catch (err) {
      showToast("error", err?.response?.data?.message || "Staff login failed");
    }
  };

  const handleLogin = () => {
    if (loginRole === "student") {
      handleStudentLogin();
      return;
    }

    handleStaffLogin();
  };

  return (
    <div className="login-page">
      <Toast type={toast.type} message={toast.message} onClose={clearToast} />
      <div className="login-card">
        <img className="login-logo" src="/rgukt-logo.svg" alt="RGUKT" />
        <h1>RGUKT Result Portal</h1>
        <p>Student, Faculty, and Admin access in one secure and transparent system.</p>

        <div className="role-tabs">
          <button
            className={loginRole === "student" ? "active" : ""}
            onClick={() => setLoginRole("student")}
            type="button"
          >
            Student
          </button>
          <button
            className={loginRole === "faculty" ? "active" : ""}
            onClick={() => setLoginRole("faculty")}
            type="button"
          >
            Faculty
          </button>
          <button
            className={loginRole === "admin" ? "active" : ""}
            onClick={() => setLoginRole("admin")}
            type="button"
          >
            Admin
          </button>
        </div>

        {loginRole === "student" ? (
          <input
            type="text"
            placeholder="Roll Number"
            value={rollNumber}
            onChange={(e) => setRollNumber(e.target.value)}
          />
        ) : (
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        )}

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button onClick={handleLogin}>
          {loginRole === "student" ? "Login as Student" : `Login as ${loginRole}`}
        </button>
      </div>
    </div>
  );
}

export default Login;