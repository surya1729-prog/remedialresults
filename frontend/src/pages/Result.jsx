import { useEffect, useState } from "react";
import axios from "axios";

function Result() {
  const [results, setResults] = useState([]);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await axios.get(
          "http://localhost:5000/api/result/R210546",
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        setResults(res.data.results);
      } catch (err) {
        console.log(err);
      }
    };

    fetchResult();
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Student Result</h1>

      <table border="1" cellPadding="10" style={{ width: "100%", marginTop: "20px" }}>
        <thead>
          <tr>
            <th>Subject Code</th>
            <th>Subject Name</th>
            <th>Mid 1</th>
            <th>Mid 2</th>
            <th>Mid 3</th>
            <th>Best 2 Mids</th>
            <th>Sem Marks</th>
            <th>Total</th>
            <th>Status</th>
            <th>Reason</th>
          </tr>
        </thead>

        <tbody>
          {results.map((r, index) => (
            <tr key={index}>
              <td>{r.subjectCode}</td>
              <td>{r.subjectName}</td>
              <td>{r.mid1}</td>
              <td>{r.mid2}</td>
              <td>{r.mid3}</td>
              <td>{r.bestTwoMid}</td>
              <td>{r.semMarks}</td>
              <td>{r.total}</td>
              <td style={{ color: r.status === "PASS" ? "green" : "red" }}>
                {r.status}
              </td>
              <td>{r.reason}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Result;