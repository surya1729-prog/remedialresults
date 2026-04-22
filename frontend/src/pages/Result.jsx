import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import RoleNavbar from "../components/RoleNavbar";
import Toast from "../components/Toast";
import "./Result.css";

const FIRST_NAMES = [
  "Aarav",
  "Vivaan",
  "Arjun",
  "Nikhil",
  "Tejas",
  "Sai",
  "Karthik",
  "Rahul",
  "Sanjay",
  "Vishal"
];

const LAST_NAMES = [
  "Kumar",
  "Reddy",
  "Sharma",
  "Varma",
  "Rao",
  "Naidu",
  "Iyer",
  "Mehta",
  "Patel",
  "Verma"
];

const getPrintableName = (student) => {
  if (!student) {
    return "Student";
  }

  const name = student.name || "";

  if (name && !name.startsWith("Student_")) {
    return name;
  }

  const roll = student.rollNumber || "";
  const hash = roll.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);

  const first = FIRST_NAMES[hash % FIRST_NAMES.length];
  const last = LAST_NAMES[hash % LAST_NAMES.length];

  return `${first} ${last}`;
};

const loadLogoDataUrl = () =>
  new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const size = 220;
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext("2d");

        if (!context) {
          resolve(null);
          return;
        }

        // Crop the source into a circular badge to avoid boxed logo rendering.
        context.save();
        context.beginPath();
        context.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        context.closePath();
        context.clip();

        const scale = Math.max(size / image.width, size / image.height);
        const drawWidth = image.width * scale;
        const drawHeight = image.height * scale;
        const offsetX = (size - drawWidth) / 2;
        const offsetY = (size - drawHeight) / 2;

        context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
        context.restore();

        resolve(canvas.toDataURL("image/png"));
      } catch (_) {
        resolve(null);
      }
    };
    image.onerror = () => resolve(null);
    image.src = `${window.location.origin}/rgukt-logo.svg`;
  });

function Result() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [student, setStudent] = useState(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState({ type: "info", message: "" });
  const [yearFilter, setYearFilter] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("");

  const latestResultLabel = data?.summary?.latestResultLabel || "Semester info unavailable";
  const latestResultYear = data?.summary?.latestResultYear;
  const latestResultSemester = data?.summary?.latestResultSemester;

  const showToast = (type, message) => {
    setToast({ type, message });
  };

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const token = localStorage.getItem("token");
        const studentString = localStorage.getItem("student");

        if (!token || !studentString) {
          navigate("/");
          return;
        }

        setStudent(JSON.parse(studentString));

        const res = await axios.get("http://localhost:5000/api/result/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setData(res.data);
      } catch (err) {
        setError(err?.response?.data?.message || "Unable to load result data");
      }
    };

    fetchResult();
  }, [navigate]);

  useEffect(() => {
    if (!data?.results?.length || yearFilter || semesterFilter) {
      return;
    }

    const latestSemester = data.results
      .filter((sub) => sub.semesterInfo?.year && sub.semesterInfo?.semester)
      .sort((a, b) => {
        const yearDiff = a.semesterInfo.year - b.semesterInfo.year;
        if (yearDiff !== 0) {
          return yearDiff;
        }

        return a.semesterInfo.semester - b.semesterInfo.semester;
      })
      .at(-1);

    if (latestSemester) {
      setYearFilter(String(latestSemester.semesterInfo.year));
      setSemesterFilter(String(latestSemester.semesterInfo.semester));
    }
  }, [data, yearFilter, semesterFilter]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("student");
  };

  const handleDownloadMarksheet = async () => {
    if (!student || !data?.results?.length) {
      showToast("error", "Result data is not available for marks memo");
      return;
    }

    const confirmed = window.confirm(
      "Download complete marks memo for all years and semesters?"
    );

    if (!confirmed) {
      showToast("info", "Marksheet download cancelled");
      return;
    }

    const printableName = getPrintableName(student);
    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const logoDataUrl = await loadLogoDataUrl();

    if (logoDataUrl) {
      doc.addImage(logoDataUrl, "PNG", 40, 18, 62, 62);
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Rajiv Gandhi University of Knowledge Technologies", 112, 52);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text("Academic Marks Memo - Complete B.Tech (Sem-wise)", 112, 72);

    doc.setDrawColor(15, 61, 143);
    doc.setLineWidth(1);
    doc.line(40, 94, pageWidth - 40, 94);

    doc.setFontSize(10);
    doc.text(`Student Name: ${printableName}`, 40, 114);
    doc.text(`Roll Number: ${student.rollNumber}`, 40, 130);
    doc.text(`Branch: ${student.branch}`, 40, 146);
    doc.text(`Profile Year: ${student.year}`, pageWidth - 170, 114);
    doc.text(`Results Up To: Y${latestResultYear ?? "-"} S${latestResultSemester ?? "-"}`, pageWidth - 170, 130);
    doc.text(`Total Subjects: ${data.summary.subjectCount}`, pageWidth - 170, 146);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - 170, 162);

    doc.setFont("helvetica", "bold");
    doc.text(`Results Available Up To: ${latestResultLabel}`, 40, 178);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Marking Scheme: Mid1, Mid2, Mid3 are each out of 20; Best 2 mids are internal out of 40;", 40, 192);
    doc.text("Semester exam is out of 60; Total is out of 100; PASS if total >= 40.", 40, 204);

    const sortedResults = [...data.results].sort((a, b) => {
      const yearA = a.semesterInfo?.year || 99;
      const yearB = b.semesterInfo?.year || 99;
      if (yearA !== yearB) {
        return yearA - yearB;
      }

      const semA = a.semesterInfo?.semester || 99;
      const semB = b.semesterInfo?.semester || 99;
      return semA - semB;
    });

    const semesterGroups = sortedResults.reduce((acc, sub) => {
      const year = sub.semesterInfo?.year ?? "NA";
      const semester = sub.semesterInfo?.semester ?? "NA";
      const key = `${year}-${semester}`;

      if (!acc[key]) {
        acc[key] = {
          year,
          semester,
          label:
            typeof year === "number" && typeof semester === "number"
              ? `B.Tech ${year} Year - Sem ${semester}`
              : "Semester info unavailable",
          rows: []
        };
      }

      acc[key].rows.push(sub);
      return acc;
    }, {});

    const semesterList = Object.values(semesterGroups).sort((a, b) => {
      const yearA = typeof a.year === "number" ? a.year : 99;
      const yearB = typeof b.year === "number" ? b.year : 99;
      if (yearA !== yearB) {
        return yearA - yearB;
      }

      const semA = typeof a.semester === "number" ? a.semester : 99;
      const semB = typeof b.semester === "number" ? b.semester : 99;
      return semA - semB;
    });

    let cursorY = 222;

    semesterList.forEach((group, index) => {
      if (cursorY > pageHeight - 150) {
        doc.addPage();
        cursorY = 50;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(`${index + 1}. ${group.label}`, 40, cursorY);

      autoTable(doc, {
        startY: cursorY + 8,
        head: [["Code", "Subject Name", "Best 2 Mids (40)", "Sem (60)", "Total (100)", "Status"]],
        body: group.rows.map((sub) => [
          sub.subjectCode,
          sub.subjectName,
          sub.internal.total,
          sub.external.semMarks,
          sub.total,
          sub.status
        ]),
        headStyles: {
          fillColor: [15, 61, 143],
          textColor: [255, 255, 255],
          fontStyle: "bold"
        },
        alternateRowStyles: {
          fillColor: [247, 251, 255]
        },
        styles: {
          fontSize: 8,
          cellPadding: 4
        },
        columnStyles: {
          1: { cellWidth: 180 }
        },
        didParseCell: (hookData) => {
          if (hookData.column.index === 5 && hookData.cell.raw === "REMEDIAL") {
            hookData.cell.styles.textColor = [154, 52, 18];
            hookData.cell.styles.fontStyle = "bold";
          }
        }
      });

      const semesterPass = group.rows.filter((sub) => sub.status === "PASS").length;
      const semesterRemedial = group.rows.length - semesterPass;
      const semesterAverage = group.rows.length
        ? Number(
            (
              group.rows.reduce((sum, sub) => sum + sub.total, 0) /
              group.rows.length
            ).toFixed(2)
          )
        : 0;

      const tableEndY = doc.lastAutoTable ? doc.lastAutoTable.finalY : cursorY + 20;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(
        `Semester Summary: Subjects ${group.rows.length} | Pass ${semesterPass} | Remedial ${semesterRemedial} | Avg ${semesterAverage}`,
        40,
        tableEndY + 14
      );

      cursorY = tableEndY + 30;
    });

    const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : cursorY;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(
      `Overall Summary: Pass ${data.summary.passCount} | Remedial ${data.summary.remedialCount} | Average ${data.summary.average}`,
      40,
      finalY + 26
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("This is a system-generated marks memo for academic reference.", 40, finalY + 42);

    doc.save(`${data.rollNumber}_complete_btech_marksmemo.pdf`);
    showToast("success", "Complete B.Tech marks memo PDF downloaded");
  };

  const handlePrintPdf = () => {
    if (!student || !yearFilter || !semesterFilter) {
      showToast("error", "Please select a year and semester first");
      return;
    }

    if (!selectedSemesterResults.length) {
      showToast("error", "Result data not ready for the selected semester");
      return;
    }

    const printableName = getPrintableName(student);

    const rows = selectedSemesterResults
      .map(
        (sub) => `
          <tr>
            <td>${sub.subjectCode}</td>
            <td>${sub.subjectName}</td>
            <td>${sub.internal.total}</td>
            <td>${sub.external.semMarks}</td>
            <td>${sub.total}</td>
            <td>${sub.status}</td>
            <td>${sub.remedialReasons.length ? sub.remedialReasons.join(", ") : "Passed"}</td>
          </tr>`
      )
      .join("");

    const pdfTitle = `${printableName} - ${student.rollNumber} - B.Tech ${yearFilter} Year - Sem ${semesterFilter}`;

    const html = `
      <html>
      <head>
        <title>${pdfTitle}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #1f2937; }
          .head { display: flex; align-items: center; gap: 14px; border-bottom: 2px solid #0f3d8f; padding-bottom: 8px; }
          .head img {
            width: 78px;
            height: 78px;
            object-fit: cover;
            display: block;
            border-radius: 999px;
            border: 2px solid #0f3d8f33;
            padding: 4px;
            background: #ffffff;
          }
          .head-text { display: block; }
          h1 { font-size: 22px; margin: 0; }
          h2 { font-size: 16px; margin: 4px 0 0; color: #334155; }
          .meta { margin: 14px 0; }
          .meta p { margin: 4px 0; }
          .semester-title { margin-top: 8px; font-weight: 700; color: #0f3d8f; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #94a3b8; padding: 8px; font-size: 13px; }
          th { background: #e2e8f0; text-align: left; }
          .sum { margin-top: 12px; font-weight: 700; }
          .signature-row { margin-top: 44px; display: flex; justify-content: space-between; gap: 24px; }
          .signature-block { flex: 1; text-align: center; }
          .signature-line { width: 82%; margin: 0 auto 8px; border-top: 1.5px solid #1f2937; }
          .signature-label { font-weight: 700; font-size: 12px; letter-spacing: 0.4px; }
        </style>
      </head>
      <body>
        <div class="head">
          <img src="${window.location.origin}/rgukt-logo.svg" alt="RGUKT" />
          <div class="head-text">
            <h1>Rajiv Gandhi University of Knowledge Technologies</h1>
            <h2>R.K Valley - Academic Marksheet</h2>
          </div>
        </div>
        <div class="meta">
          <p><strong>Student:</strong> ${printableName}</p>
          <p><strong>Roll Number:</strong> ${student.rollNumber}</p>
          <p><strong>Branch:</strong> ${student.branch}</p>
          <p><strong>Selected Year:</strong> ${yearFilter}</p>
          <p><strong>Selected Semester:</strong> ${semesterFilter}</p>
        </div>
        <div class="semester-title">${selectedSemesterLabel}</div>
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Subject</th>
              <th>Internal Total</th>
              <th>External</th>
              <th>Total</th>
              <th>Status</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <p class="sum">Pass: ${selectedSemesterPassedCount} | Remedial: ${selectedSemesterRemedialCount} | Average: ${selectedSemesterAverage}</p>

        <div class="signature-row">
          <div class="signature-block">
            <div class="signature-line"></div>
            <div class="signature-label">CONTROLLER OF EXAMINATIONS</div>
          </div>
          <div class="signature-block">
            <div class="signature-line"></div>
            <div class="signature-label">DEAN (ACADEMICS)</div>
          </div>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open("", "_blank", "width=1000,height=900");
    if (!printWindow) {
      showToast("error", "Popup blocked. Please allow popups for PDF print.");
      return;
    }

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    showToast("success", "Print dialog opened for PDF download");
  };

  if (error) {
    return (
      <div className="result-page">
        <div className="result-shell">
          <h2>{error}</h2>
          <button className="logout" onClick={handleLogout}>Back to Login</button>
        </div>
      </div>
    );
  }

  if (!data) return <h2>Loading...</h2>;

  const allSemesters = Array.from(
    new Map(
      data.results
        .filter((sub) => sub.semesterInfo?.year && sub.semesterInfo?.semester)
        .map((sub) => {
          const key = `${sub.semesterInfo.year}-${sub.semesterInfo.semester}`;
          return [
            key,
            {
              key,
              year: sub.semesterInfo.year,
              semester: sub.semesterInfo.semester,
              label: `B.Tech ${sub.semesterInfo.year} Year - Sem ${sub.semesterInfo.semester}`
            }
          ];
        })
    ).values()
  ).sort((a, b) => (a.year - b.year) || (a.semester - b.semester));

  const availableYears = Array.from(new Set(allSemesters.map((item) => item.year))).sort(
    (a, b) => b - a
  );

  const availableSemesters = allSemesters
    .filter((item) => !yearFilter || item.year === Number(yearFilter))
    .map((item) => item.semester)
    .filter((value, index, arr) => arr.indexOf(value) === index)
    .sort((a, b) => a - b);

  const selectedSemesterResults = data.results.filter((sub) => {
    const year = sub.semesterInfo?.year;
    const semester = sub.semesterInfo?.semester;

    if (!yearFilter || !semesterFilter) {
      return false;
    }

    if (year !== Number(yearFilter)) {
      return false;
    }

    if (semester !== Number(semesterFilter)) {
      return false;
    }

    return year !== null && semester !== null;
  });

  const selectedSemesterLabel =
    yearFilter && semesterFilter
      ? `B.Tech ${yearFilter} Year - Sem ${semesterFilter}`
      : "Select Year and Semester";

  const selectedSemesterPassedCount = selectedSemesterResults.filter((sub) => sub.status === "PASS").length;
  const selectedSemesterRemedialCount = selectedSemesterResults.filter((sub) => sub.status === "REMEDIAL").length;
  const selectedSemesterAverage = selectedSemesterResults.length
    ? Number(
        (
          selectedSemesterResults.reduce((sum, sub) => sum + sub.total, 0) /
          selectedSemesterResults.length
        ).toFixed(2)
      )
    : 0;

  const handleYearChange = (event) => {
    const selectedYear = event.target.value;
    setYearFilter(selectedYear);
    setSemesterFilter("");
  };

  const currentBatchLabel = student?.rollNumber?.slice(0, 3) || "Batch";

  return (
    <div className="result-page">
      <Toast type={toast.type} message={toast.message} onClose={() => setToast({ type: "info", message: "" })} />
      <div className="result-shell">
        <RoleNavbar role="student" onLogout={handleLogout} />
        <header className="result-header">
          <div>
            <h1>Academic Transparency Dashboard</h1>
            {student ? (
              <p>
                {student.name} ({student.rollNumber}) • {student.branch} • {currentBatchLabel} • Profile Year {student.year} • Results Up To {latestResultLabel}
              </p>
            ) : null}
          </div>
          <div className="result-actions">
            <button className="print" onClick={handlePrintPdf}>Print PDF</button>
            <button className="download" onClick={handleDownloadMarksheet}>Download Marksheet</button>
            <button className="logout" onClick={handleLogout}>Logout</button>
          </div>
        </header>

        <section className="semester-explorer">
          <div className="semester-explorer-head">
            <h2>Semester Result Explorer</h2>
            <p>
              Select the year and semester to view only that semester's results. The year list is shown from 4th year down to 1st year for all passed-out batches.
            </p>
          </div>

          <div className="tracker-filters">
            <label>
              Year
              <select value={yearFilter} onChange={handleYearChange}>
                <option value="">Select Year</option>
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    B.Tech {year} Year
                  </option>
                ))}
              </select>
            </label>

            <label>
              Semester
              <select
                value={semesterFilter}
                onChange={(event) => setSemesterFilter(event.target.value)}
                disabled={!yearFilter}
              >
                <option value="">Select Semester</option>
                {availableSemesters.map((semester) => (
                  <option key={semester} value={semester}>
                    Sem {semester}
                  </option>
                ))}
              </select>
            </label>
          </div>

        </section>

        {selectedSemesterResults.length > 0 ? (
          <>
            <h3 className="selected-semester-heading">Showing: {selectedSemesterLabel}</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Year / Sem</th>
                  <th>Internal</th>
                  <th>External</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {selectedSemesterResults.map((sub, i) => (
                  <tr key={`${sub.subjectCode}-${i}`}>
                    <td>
                      <div className="subject-name">{sub.subjectName}</div>
                      <small>{sub.subjectCode}</small>
                    </td>
                    <td>{sub.semesterInfo?.label || "Semester info unavailable"}</td>
                    <td>
                      <div className="internal-breakdown">
                        <span>M1: {sub.internal.mid1}</span>
                        <span>M2: {sub.internal.mid2}</span>
                        <span>M3: {sub.internal.mid3}</span>
                        <span>Best2: {sub.internal.bestTwoMid}</span>
                        <strong>Internal Total: {sub.internal.total}</strong>
                      </div>
                    </td>
                    <td>{sub.external.semMarks}</td>
                    <td>{sub.total}</td>
                    <td>
                      <span className={sub.status === "PASS" ? "pill pass" : "pill remedial"}>
                        {sub.status}
                      </span>
                    </td>
                    <td>
                      {sub.status === "PASS"
                        ? "Passed in selected semester"
                        : sub.remedialReasons.join(", ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        ) : (
          <h3>Select year and semester to view results</h3>
        )}
      </div>
    </div>
  );
}

export default Result;