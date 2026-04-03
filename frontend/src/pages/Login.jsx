import { useState } from "react";
import axios from "axios";

function Login() {
  const [rollNumber, setRollNumber] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", {
        rollNumber,
        password,
      });

      localStorage.setItem("token", res.data.token);

      alert("Login Successful ✅");

      window.location.href = "/result";

    } catch (err) {
      alert("Login Failed ❌");
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h2>Student Login</h2>

      <input
        placeholder="Roll Number"
        value={rollNumber}
        onChange={(e) => setRollNumber(e.target.value)}
      /><br /><br />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      /><br /><br />

      <button onClick={handleLogin}>Login</button>
    </div>
  );
}

export default Login;