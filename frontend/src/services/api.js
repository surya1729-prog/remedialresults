const rawApiBase = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const API_BASE = rawApiBase.replace(/\/+$/, "");

export default API_BASE;
