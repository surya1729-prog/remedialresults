import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import RoleNavbar from "../components/RoleNavbar";
import Toast from "../components/Toast";
import "./DashboardHome.css";

function AdminHome() {
  const navigate = useNavigate();
  const [overview, setOverview] = useState(null);
  const [reportRows, setReportRows] = useState([]);
  const [year, setYear] = useState(1);
  const [semester, setSemester] = useState(1);
  const [toast, setToast] = useState({ type: "info", message: "" });

  const showToast = (type, message) => {
    setToast({ type, message });
  };

  const downloadCsv = (rows, fileName) => {
    if (!rows.length) {
      showToast("error", "No report data to export");
      return false;
    }

    const headers = Object.keys(rows[0]);
    const csv = [headers, ...rows.map((r) => headers.map((h) => r[h] ?? ""))]
      .map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  };

  const fetchReport = async (token, y = year, s = semester) => {
    try {
      const reportRes = await axios.get(
        "http://localhost:5000/api/faculty-admin/reports/remedial-summary",
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { year: y, semester: s }
        }
      );
      setReportRows(reportRes.data.rows || []);
    } catch (_) {
      setReportRows([]);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("staffToken");
    const raw = localStorage.getItem("staffUser");

    if (!token || !raw) {
      navigate("/");
      return;
    }

    const user = JSON.parse(raw);
    if (user.role !== "admin") {
      navigate("/");
      return;
    }

    const load = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/faculty-admin/overview", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setOverview(res.data);
        await fetchReport(token);
      } catch (_) {
        setOverview(null);
      }
    };

    load();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("staffToken");
    localStorage.removeItem("staffUser");
  };

  const handleRunReport = async () => {
    const token = localStorage.getItem("staffToken");
    if (!token) {
      showToast("error", "Session expired. Please login again.");
      return;
    }
    await fetchReport(token, year, semester);
    showToast("success", "Report refreshed");
  };

  const handleExportReport = () => {
    const exported = downloadCsv(
      reportRows,
      `admin_remedial_summary_Y${year}_S${semester}.csv`
    );
    if (exported) {
      showToast("success", "Admin report exported");
    }
  };

  return (
    <div className="dash-page">
      <Toast type={toast.type} message={toast.message} onClose={() => setToast({ type: "info", message: "" })} />
      <div className="dash-shell">
        <RoleNavbar role="admin" onLogout={handleLogout} />

        <section className="hero-card admin">
          <h1>Admin Dashboard</h1>
          <p>Control publication, monitor records, and manage the remedial transparency system.</p>
          <button onClick={() => navigate("/staff")}>Open System Control Panel</button>
        </section>

        {overview ? (
          <section className="overview-grid">
            <article><h3>Students</h3><strong>{overview.studentCount}</strong></article>
            <article><h3>Subjects</h3><strong>{overview.subjectCount}</strong></article>
            <article><h3>Marks</h3><strong>{overview.marksCount}</strong></article>
            <article><h3>Result State</h3><strong>{overview.isPublished ? "Published" : "Unpublished"}</strong></article>
          </section>
        ) : null}

        <section className="report-card">
          <h2>Branch-wise Remedial Summary</h2>
          <div className="report-actions">
            <label>
              Year
              <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={4}>4</option>
              </select>
            </label>
            <label>
              Semester
              <select value={semester} onChange={(e) => setSemester(Number(e.target.value))}>
                <option value={1}>1</option>
                <option value={2}>2</option>
              </select>
            </label>
            <button onClick={handleRunReport}>Run Report</button>
            <button onClick={handleExportReport}>Export CSV</button>
          </div>

          <div className="report-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Branch</th>
                  <th>Total Students</th>
                  <th>Subjects Evaluated</th>
                  <th>Passed Entries</th>
                  <th>Remedial Entries</th>
                  <th>Remedial %</th>
                </tr>
              </thead>
              <tbody>
                {reportRows.map((r) => (
                  <tr key={r.branch}>
                    <td>{r.branch}</td>
                    <td>{r.totalStudents}</td>
                    <td>{r.subjectsEvaluated}</td>
                    <td>{r.passedEntries}</td>
                    <td>{r.remedialEntries}</td>
                    <td>{r.remedialRate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

export default AdminHome;
