import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import RoleNavbar from "../components/RoleNavbar";
import Toast from "../components/Toast";
import API_BASE from "../services/api";
import "./StaffPanel.css";
const REQUIRED_HEADERS = [
  "rollNumber",
  "subjectCode",
  "assignmentMarks",
  "attendanceMarks",
  "continuousEvaluationMarks"
];

const parseNumberOrUndefined = (value) => {
  if (value === undefined || value === null || String(value).trim() === "") {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const parseCsvToUpdates = (csvText) => {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return { updates: [], skipped: 0, error: "CSV must include header and at least one data row" };
  }

  const headers = lines[0].split(",").map((h) => h.trim());
  const headerLookup = new Map(headers.map((h, idx) => [h.toLowerCase(), idx]));

  const missingHeaders = REQUIRED_HEADERS.filter(
    (h) => !headerLookup.has(h.toLowerCase())
  );

  if (missingHeaders.length) {
    return {
      updates: [],
      skipped: 0,
      error: `Missing CSV headers: ${missingHeaders.join(", ")}`
    };
  }

  const updates = [];
  let skipped = 0;

  for (let i = 1; i < lines.length; i += 1) {
    const cols = lines[i].split(",").map((c) => c.trim());

    const rollNumber = cols[headerLookup.get("rollnumber")] || "";
    const subjectCode = cols[headerLookup.get("subjectcode")] || "";

    if (!rollNumber || !subjectCode) {
      skipped += 1;
      continue;
    }

    const assignmentMarks = parseNumberOrUndefined(
      cols[headerLookup.get("assignmentmarks")]
    );
    const attendanceMarks = parseNumberOrUndefined(
      cols[headerLookup.get("attendancemarks")]
    );
    const continuousEvaluationMarks = parseNumberOrUndefined(
      cols[headerLookup.get("continuousevaluationmarks")]
    );

    if (
      assignmentMarks === undefined &&
      attendanceMarks === undefined &&
      continuousEvaluationMarks === undefined
    ) {
      skipped += 1;
      continue;
    }

    updates.push({
      rollNumber,
      subjectCode,
      assignmentMarks,
      attendanceMarks,
      continuousEvaluationMarks
    });
  }

  return { updates, skipped, error: "" };
};

function StaffPanel() {
  const [token, setToken] = useState(localStorage.getItem("staffToken") || "");
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("staffUser");
    return raw ? JSON.parse(raw) : null;
  });

  const [year, setYear] = useState(1);
  const [semester, setSemester] = useState(1);
  const [branch, setBranch] = useState("");
  const [subjectCode, setSubjectCode] = useState("");

  const [branches, setBranches] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [marksMap, setMarksMap] = useState({});
  const [draftMap, setDraftMap] = useState({});
  const [editingRows, setEditingRows] = useState({});

  const [status, setStatus] = useState(null);
  const [overview, setOverview] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [loadMessage, setLoadMessage] = useState("");
  const [csvParseMessage, setCsvParseMessage] = useState("");
  const [uploadMessage, setUploadMessage] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [downloadMessage, setDownloadMessage] = useState("");
  const [csvRows, setCsvRows] = useState([]);
  const [toast, setToast] = useState({ type: "info", message: "" });

  const showToast = (type, message) => {
    setToast({ type, message });
  };

  const buildDraftFromMark = (mark) => ({
    mid1: mark?.mid1 ?? 0,
    mid2: mark?.mid2 ?? 0,
    mid3: mark?.mid3 ?? 0,
    semMarks: mark?.semMarks ?? 0,
    assignmentMarks: mark?.assignmentMarks ?? "",
    attendanceMarks: mark?.attendanceMarks ?? "",
    continuousEvaluationMarks: mark?.continuousEvaluationMarks ?? ""
  });

  const validateRow = (row) => {
    const checks = [
      { key: "mid1", max: 20 },
      { key: "mid2", max: 20 },
      { key: "mid3", max: 20 },
      { key: "semMarks", max: 60 },
      { key: "assignmentMarks", max: 25 },
      { key: "attendanceMarks", max: 25 },
      { key: "continuousEvaluationMarks", max: 25 }
    ];

    for (const item of checks) {
      const raw = row[item.key];
      if (raw === "" || raw === null || raw === undefined) {
        continue;
      }

      const num = Number(raw);
      if (!Number.isFinite(num) || num < 0 || num > item.max) {
        return `${item.key} must be between 0 and ${item.max}`;
      }
    }

    return "";
  };

  const canPublish = user?.role === "admin";

  const statusBadgeLabel = useMemo(() => {
    if (!status) return "Unknown";
    return status.isPublished ? "Published" : "Unpublished";
  }, [status]);

  const statusClass = status?.isPublished ? "published" : "unpublished";

  const authHeaders = useMemo(
    () => ({ Authorization: `Bearer ${token}` }),
    [token]
  );

  const fetchStatus = async () => {
    if (!token) return;

    try {
      const res = await axios.get(`${API_BASE}/result-control/status`, {
        headers: authHeaders
      });
      setStatus(res.data);
      setStatusMessage("");
    } catch (error) {
      setStatusMessage(error?.response?.data?.message || "Failed to load publish status");
    }
  };

  const fetchOverview = async () => {
    if (!token || !canPublish) {
      return;
    }

    try {
      const res = await axios.get(`${API_BASE}/faculty-admin/overview`, {
        headers: authHeaders
      });
      setOverview(res.data);
    } catch (error) {
      setStatusMessage(error?.response?.data?.message || "Failed to load admin overview");
    }
  };

  const loadClassData = async (selectedBranch = branch, selectedSubjectCode = subjectCode) => {
    if (!token || !selectedBranch) {
      return;
    }

    try {
      const [studentsRes, subjectsRes, marksRes] = await Promise.all([
        axios.get(`${API_BASE}/faculty-admin/students`, {
          headers: authHeaders,
          params: { year, branch: selectedBranch }
        }),
        axios.get(`${API_BASE}/faculty-admin/subjects`, {
          headers: authHeaders,
          params: { year, semester, branch: selectedBranch }
        }),
        axios.get(`${API_BASE}/faculty-admin/marks`, {
          headers: authHeaders,
          params: {
            year,
            semester,
            branch: selectedBranch,
            subjectCode: selectedSubjectCode || undefined
          }
        })
      ]);

      const nextStudents = studentsRes.data.students || [];
      const nextSubjects = subjectsRes.data.subjects || [];
      const nextMarks = marksRes.data.marks || [];

      setStudents(nextStudents);
      setSubjects(nextSubjects);

      if (!selectedSubjectCode && nextSubjects.length) {
        setSubjectCode(nextSubjects[0].subjectCode);
      }

      const markByKey = {};
      nextMarks.forEach((m) => {
        markByKey[`${m.rollNumber}_${m.subjectCode}`] = m;
      });
      setMarksMap(markByKey);

      const nextDrafts = {};
      const nextEditingRows = {};
      const effectiveSubject = selectedSubjectCode || nextSubjects[0]?.subjectCode;
      if (effectiveSubject) {
        nextStudents.forEach((s) => {
          const m = markByKey[`${s.rollNumber}_${effectiveSubject}`];
          nextDrafts[s.rollNumber] = buildDraftFromMark(m);
          nextEditingRows[s.rollNumber] = !m;
        });
      }

      setDraftMap(nextDrafts);
      setEditingRows(nextEditingRows);
      setLoadMessage(`Loaded ${nextStudents.length} students for Year ${year} Semester ${semester} (${selectedBranch})`);
      setSaveMessage("");
      setDownloadMessage("");
      showToast("success", "Class data loaded");
    } catch (error) {
      setLoadMessage(error?.response?.data?.message || "Failed to load class data");
      showToast("error", error?.response?.data?.message || "Failed to load class data");
    }
  };

  const fetchBranches = async () => {
    if (!token) {
      return;
    }

    try {
      const res = await axios.get(`${API_BASE}/faculty-admin/branches`, {
        headers: authHeaders
      });

      const nextBranches = res.data.branches || [];
      setBranches(nextBranches);
      if (!branch && nextBranches.length) {
        setBranch(nextBranches[0]);
      }
    } catch (error) {
      setLoadMessage(error?.response?.data?.message || "Failed to load branches");
      showToast("error", error?.response?.data?.message || "Failed to load branches");
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchBranches();
    fetchOverview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (!token || !branch) {
      return;
    }

    loadClassData(branch, subjectCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, year, semester, branch, subjectCode]);

  const handleLogout = () => {
    localStorage.removeItem("staffToken");
    localStorage.removeItem("staffUser");
    setToken("");
    setUser(null);
    setStatus(null);
    setCsvRows([]);
    setCsvParseMessage("");
    setUploadMessage("");
    setStudents([]);
    setSubjects([]);
    setMarksMap({});
    setDraftMap({});
    setEditingRows({});
    setOverview(null);
  };

  const updateDraft = (rollNumber, field, value) => {
    setDraftMap((prev) => ({
      ...prev,
      [rollNumber]: {
        ...(prev[rollNumber] || {}),
        [field]: value
      }
    }));
  };

  const handleSaveStudentMarks = async (rollNumber) => {
    try {
      if (!subjectCode) {
        setSaveMessage("Select a subject before saving marks");
        showToast("error", "Select subject before saving");
        return;
      }

      const row = draftMap[rollNumber] || {};
      const validationError = validateRow(row);
      if (validationError) {
        setSaveMessage(validationError);
        showToast("error", validationError);
        return;
      }

      const payload = {
        rollNumber,
        subjectCode,
        ...row
      };

      await axios.put(`${API_BASE}/faculty-admin/marks/upsert`, payload, {
        headers: authHeaders
      });

      setEditingRows((prev) => ({ ...prev, [rollNumber]: false }));
      setSaveMessage(`Marks saved for ${rollNumber} (${subjectCode})`);
      showToast("success", `Marks saved for ${rollNumber}`);
      await loadClassData(branch, subjectCode);
    } catch (error) {
      setSaveMessage(error?.response?.data?.message || "Failed to save marks");
      showToast("error", error?.response?.data?.message || "Failed to save marks");
    }
  };

  const handleEditStudentMarks = (rollNumber) => {
    setEditingRows((prev) => ({ ...prev, [rollNumber]: true }));
  };

  const handleCancelEditRow = (rollNumber) => {
    const existing = marksMap[`${rollNumber}_${subjectCode}`];

    setDraftMap((prev) => ({
      ...prev,
      [rollNumber]: buildDraftFromMark(existing)
    }));

    setEditingRows((prev) => ({ ...prev, [rollNumber]: false }));
  };

  const handleDownloadClassSheet = async () => {
    try {
      const res = await axios.get(`${API_BASE}/faculty-admin/marks-sheet`, {
        headers: authHeaders,
        params: { year, semester, branch }
      });

      const rows = res.data.rows || [];
      if (!rows.length) {
        setDownloadMessage("No marks available for this class and semester");
        showToast("error", "No marks found for this selection");
        return;
      }

      const headers = Object.keys(rows[0]);
      const csv = [headers, ...rows.map((r) => headers.map((h) => r[h] ?? ""))]
        .map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
        .join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `marks_sheet_${branch}_Y${year}_S${semester}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setDownloadMessage(`Downloaded ${rows.length} rows`);
      showToast("success", "Class marksheet downloaded");
    } catch (error) {
      setDownloadMessage(error?.response?.data?.message || "Marks-sheet download failed");
      showToast("error", error?.response?.data?.message || "Marks-sheet download failed");
    }
  };

  const handleCsvUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      const csvText = String(e.target?.result || "");
      const parsed = parseCsvToUpdates(csvText);

      if (parsed.error) {
        setCsvRows([]);
        setCsvParseMessage(parsed.error);
        showToast("error", parsed.error);
        return;
      }

      setCsvRows(parsed.updates);
      setCsvParseMessage(
        `CSV parsed: ${parsed.updates.length} valid updates, ${parsed.skipped} skipped rows`
      );
      showToast("success", "CSV parsed successfully");
    };

    reader.readAsText(file);
  };

  const handleBulkSubmit = async () => {
    try {
      if (!csvRows.length) {
        setUploadMessage("No rows to upload. Please upload a valid CSV first.");
        showToast("error", "No valid CSV rows to upload");
        return;
      }

      const res = await axios.patch(
        `${API_BASE}/marks/bulk/internal`,
        { updates: csvRows },
        { headers: authHeaders }
      );

      setUploadMessage(
        `${res.data.message}. Matched: ${res.data.matchedCount}, Modified: ${res.data.modifiedCount}`
      );
      showToast("success", "Bulk upload completed");
    } catch (error) {
      setUploadMessage(error?.response?.data?.message || "Bulk upload failed");
      showToast("error", error?.response?.data?.message || "Bulk upload failed");
    }
  };

  const handleTogglePublish = async () => {
    try {
      const endpoint = status?.isPublished ? "unpublish" : "publish";

      await axios.patch(
        `${API_BASE}/result-control/${endpoint}`,
        {},
        { headers: authHeaders }
      );

      await fetchStatus();
      showToast("success", `Result ${endpoint} completed`);
    } catch (error) {
      setStatusMessage(error?.response?.data?.message || "Publish toggle failed");
      showToast("error", error?.response?.data?.message || "Publish toggle failed");
    }
  };

  if (!token || !user) {
    return (
      <div className="staff-page">
        <div className="staff-shell login-mode">
          <h1>Staff Session Expired</h1>
          <p>Please login again from the main portal.</p>
          <p className="back-link">
            <Link to="/">Back to Student Login</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="staff-page">
      <Toast type={toast.type} message={toast.message} onClose={() => setToast({ type: "info", message: "" })} />
      <div className="staff-shell">
        <RoleNavbar role={user?.role} onLogout={handleLogout} />
        <header className="staff-header">
          <div>
            <h1>Result Publication and Internal Marks Control</h1>
            <p>
              Logged in as {user.username} ({user.role})
            </p>
          </div>
          <button className="secondary" onClick={handleLogout}>Logout</button>
        </header>

        <section className="control-bar">
          <label>
            Year
            <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
              <option value={1}>1st Year</option>
              <option value={2}>2nd Year</option>
              <option value={3}>3rd Year</option>
              <option value={4}>4th Year</option>
            </select>
          </label>

          <label>
            Semester
            <select value={semester} onChange={(e) => setSemester(Number(e.target.value))}>
              <option value={1}>Semester 1</option>
              <option value={2}>Semester 2</option>
            </select>
          </label>

          <label>
            Branch
            <select value={branch} onChange={(e) => setBranch(e.target.value)}>
              {branches.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </label>

          <label>
            Subject
            <select value={subjectCode} onChange={(e) => setSubjectCode(e.target.value)}>
              {subjects.map((s) => (
                <option key={s.subjectCode} value={s.subjectCode}>
                  {s.subjectCode} - {s.subjectName}
                </option>
              ))}
            </select>
          </label>

          <button className="download-sheet" onClick={handleDownloadClassSheet}>Download Class Marksheet</button>
        </section>

        {loadMessage ? <p className="message">{loadMessage}</p> : null}
        {downloadMessage ? <p className="message">{downloadMessage}</p> : null}

        <section className="entry-card">
          <h2>Faculty Marks Entry Table</h2>
          <p>Enter Mid1, Mid2, Mid3 (each out of 20) and Sem Marks (out of 60). Best 2 mids are considered for internal total out of 40.</p>
          <div className="preview-wrap">
            <table>
              <thead>
                <tr>
                  <th>Roll Number</th>
                  <th>Name</th>
                  <th>Mid 1</th>
                  <th>Mid 2</th>
                  <th>Mid 3</th>
                  <th>Sem Marks</th>
                  <th>Assignment</th>
                  <th>Attendance</th>
                  <th>Continuous Eval</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => {
                  const row = draftMap[s.rollNumber] || {};
                  const existingRecord = marksMap[`${s.rollNumber}_${subjectCode}`];
                  const isEditing = Boolean(editingRows[s.rollNumber]) || !existingRecord;

                  return (
                    <tr key={s.rollNumber}>
                      <td>{s.rollNumber}</td>
                      <td>{s.name}</td>
                      <td><input disabled={!isEditing} value={row.mid1 ?? 0} onChange={(e) => updateDraft(s.rollNumber, "mid1", e.target.value)} /></td>
                      <td><input disabled={!isEditing} value={row.mid2 ?? 0} onChange={(e) => updateDraft(s.rollNumber, "mid2", e.target.value)} /></td>
                      <td><input disabled={!isEditing} value={row.mid3 ?? 0} onChange={(e) => updateDraft(s.rollNumber, "mid3", e.target.value)} /></td>
                      <td><input disabled={!isEditing} value={row.semMarks ?? 0} onChange={(e) => updateDraft(s.rollNumber, "semMarks", e.target.value)} /></td>
                      <td><input disabled={!isEditing} value={row.assignmentMarks ?? ""} onChange={(e) => updateDraft(s.rollNumber, "assignmentMarks", e.target.value)} /></td>
                      <td><input disabled={!isEditing} value={row.attendanceMarks ?? ""} onChange={(e) => updateDraft(s.rollNumber, "attendanceMarks", e.target.value)} /></td>
                      <td><input disabled={!isEditing} value={row.continuousEvaluationMarks ?? ""} onChange={(e) => updateDraft(s.rollNumber, "continuousEvaluationMarks", e.target.value)} /></td>
                      <td>
                        <div className="row-actions">
                          {isEditing ? (
                            <>
                              <button className="save-row" onClick={() => handleSaveStudentMarks(s.rollNumber)}>Save</button>
                              {existingRecord ? (
                                <button className="cancel-row" onClick={() => handleCancelEditRow(s.rollNumber)}>Cancel</button>
                              ) : null}
                            </>
                          ) : (
                            <button className="edit-row" onClick={() => handleEditStudentMarks(s.rollNumber)}>Edit</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {saveMessage ? <p className="message">{saveMessage}</p> : null}
        </section>

        <section className="audit-card">
          <div className="audit-row">
            <span>Current Status</span>
            <strong className={`status-badge ${statusClass}`}>{statusBadgeLabel}</strong>
          </div>
          <div className="audit-row">
            <span>Published By</span>
            <strong>{status?.publishedBy || "-"}</strong>
          </div>
          <div className="audit-row">
            <span>Published At</span>
            <strong>
              {status?.publishedAt ? new Date(status.publishedAt).toLocaleString() : "-"}
            </strong>
          </div>

          {canPublish ? (
            <button className="toggle" onClick={handleTogglePublish}>
              {status?.isPublished ? "Unpublish Results" : "Publish Results"}
            </button>
          ) : (
            <p className="helper">Only admin can publish/unpublish results.</p>
          )}
        </section>

        {canPublish && overview ? (
          <section className="admin-overview">
            <article>
              <h3>Students</h3>
              <strong>{overview.studentCount}</strong>
            </article>
            <article>
              <h3>Subjects</h3>
              <strong>{overview.subjectCount}</strong>
            </article>
            <article>
              <h3>Marks Records</h3>
              <strong>{overview.marksCount}</strong>
            </article>
            <article>
              <h3>Publish Status</h3>
              <strong>{overview.isPublished ? "Published" : "Unpublished"}</strong>
            </article>
          </section>
        ) : null}

        <section className="upload-card">
          <h2>Bulk Upload Internal Components (CSV)</h2>
          <p>
            Required headers: rollNumber, subjectCode, assignmentMarks, attendanceMarks,
            continuousEvaluationMarks
          </p>

          <input type="file" accept=".csv,text/csv" onChange={handleCsvUpload} />

          {csvParseMessage ? <p className="message">{csvParseMessage}</p> : null}

          <div className="actions">
            <button onClick={handleBulkSubmit}>Upload Parsed Rows</button>
          </div>

          {uploadMessage ? <p className="message">{uploadMessage}</p> : null}

          {csvRows.length > 0 ? (
            <div className="preview-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Roll Number</th>
                    <th>Subject Code</th>
                    <th>Assignment</th>
                    <th>Attendance</th>
                    <th>Continuous Eval</th>
                  </tr>
                </thead>
                <tbody>
                  {csvRows.slice(0, 10).map((row, idx) => (
                    <tr key={`${row.rollNumber}-${row.subjectCode}-${idx}`}>
                      <td>{row.rollNumber}</td>
                      <td>{row.subjectCode}</td>
                      <td>{row.assignmentMarks ?? "-"}</td>
                      <td>{row.attendanceMarks ?? "-"}</td>
                      <td>{row.continuousEvaluationMarks ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {csvRows.length > 10 ? (
                <p className="helper">Showing first 10 rows of {csvRows.length}</p>
              ) : null}
            </div>
          ) : null}
        </section>

        {statusMessage ? <p className="message error">{statusMessage}</p> : null}
      </div>
    </div>
  );
}

export default StaffPanel;
