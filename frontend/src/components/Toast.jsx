import "./Toast.css";

function Toast({ type = "info", message, onClose }) {
  if (!message) {
    return null;
  }

  return (
    <div className={`toast ${type}`}>
      <span>{message}</span>
      <button onClick={onClose} type="button">x</button>
    </div>
  );
}

export default Toast;
