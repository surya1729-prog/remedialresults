import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Result from "./pages/Result";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/result" element={<Result />} />
    </Routes>
  );
}

export default App;