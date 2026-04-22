import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Result from "./pages/Result";
import StaffPanel from "./pages/StaffPanel";
import StudentHome from "./pages/StudentHome";
import FacultyHome from "./pages/FacultyHome";
import AdminHome from "./pages/AdminHome";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/student" element={<StudentHome />} />
      <Route path="/faculty" element={<FacultyHome />} />
      <Route path="/admin" element={<AdminHome />} />
      <Route path="/result" element={<Result />} />
      <Route path="/staff" element={<StaffPanel />} />
    </Routes>
  );
}

export default App;