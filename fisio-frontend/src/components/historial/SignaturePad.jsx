import { useState, useEffect, useRef } from "react";
import { formatDateDDMMYYYY } from "../../utils/utils";

const SignaturePad = ({
  icon,
  label,
  value,
  onChange,
  placeholderName,
  nameValue,
  onNameChange,
  dateValue,
  onDateChange,
  readOnly = false
}) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.strokeStyle = "#1e1b4b"; // Indigo stroke
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (value) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = value;
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, [value]);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;

    return { x, y };
  };

  const startDrawing = (e) => {
    if (readOnly) return;
    if (e.type === "touchstart") {
      e.preventDefault();
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { x, y } = getCoordinates(e);
    const ctx = canvas.getContext("2d");

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (readOnly || !isDrawing) return;
    if (e.type === "touchmove") {
      e.preventDefault();
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { x, y } = getCoordinates(e);
    const ctx = canvas.getContext("2d");

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (readOnly || !isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    if (onChange) onChange(dataUrl);
  };

  const clearCanvas = () => {
    if (readOnly) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (onChange) onChange("");
  };

  return (
    <div
      className="signature-pad-container"
      style={{
        border: readOnly ? "1px solid var(--border-light)" : "1.5px solid var(--primary)",
        borderRadius: "12px",
        padding: "1.25rem",
        background: "var(--card-bg)",
        boxShadow: readOnly ? "none" : "0 4px 14px rgba(99, 102, 241, 0.12)",
        transition: "all 0.25s ease"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.4rem", marginBottom: "0.5rem" }}>
        <label className="form-label" style={{ fontWeight: "700", color: "var(--primary)", margin: 0, display: "flex", alignItems: "center", gap: "6px" }}>
          {icon} {label}
        </label>
        {!readOnly && (
          <span style={{ fontSize: "0.75rem", color: "var(--primary)", fontWeight: "600", background: "rgba(99, 102, 241, 0.1)", padding: "2px 8px", borderRadius: "10px" }}>
            Firma interactiva activa
          </span>
        )}
      </div>

      <div
        className="canvas-wrapper"
        style={{
          position: "relative",
          background: "#ffffff",
          border: readOnly ? "1px solid var(--border-light)" : "1.5px dashed var(--primary)",
          borderRadius: "8px",
          overflow: "hidden",
          height: "160px",
          marginBottom: "1rem"
        }}
      >
        <canvas
          ref={canvasRef}
          width={400}
          height={160}
          style={{
            width: "100%",
            height: "100%",
            cursor: readOnly ? "default" : "crosshair",
            touchAction: "none"
          }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {!readOnly && (
          <button
            type="button"
            onClick={clearCanvas}
            style={{
              position: "absolute",
              bottom: "10px",
              right: "10px",
              background: "rgba(239, 68, 68, 0.12)",
              color: "var(--danger)",
              border: "1px solid rgba(239, 68, 68, 0.25)",
              borderRadius: "6px",
              padding: "4px 10px",
              fontSize: "0.75rem",
              fontWeight: "700",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            Limpiar Firma
          </button>
        )}
        {!readOnly && !value && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              pointerEvents: "none",
              color: "#94a3b8",
              fontSize: "0.85rem",
              fontStyle: "italic",
              textAlign: "center"
            }}
          >
            Firme aquí con el dedo o ratón
          </div>
        )}
      </div>

      <div className="signature-fields" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px" }}>
        <div>
          <label className="form-label" style={{ fontSize: "0.8rem", marginBottom: "4px", fontWeight: "600" }}>Nombre firma</label>
          <input
            type="text"
            className="input"
            style={{
              padding: "0.45rem 0.75rem",
              fontSize: "0.85rem",
              background: readOnly ? "rgba(226, 232, 240, 0.45)" : "inherit",
              fontWeight: "600"
            }}
            placeholder={placeholderName}
            value={nameValue || ""}
            onChange={(e) => !readOnly && onNameChange && onNameChange(e.target.value)}
            disabled={readOnly}
          />
        </div>
        <div>
          <label className="form-label" style={{ fontSize: "0.8rem", marginBottom: "4px", fontWeight: "600" }}>Fecha firma</label>
          <input
            type={readOnly ? "text" : "date"}
            className="input"
            style={{
              padding: "0.45rem 0.75rem",
              fontSize: "0.85rem",
              background: readOnly ? "rgba(226, 232, 240, 0.45)" : "inherit",
              fontWeight: "600"
            }}
            value={readOnly ? (dateValue ? formatDateDDMMYYYY(dateValue) : "") : (dateValue ? String(dateValue).substring(0, 10) : "")}
            onChange={(e) => !readOnly && onDateChange && onDateChange(e.target.value)}
            disabled={readOnly}
          />
        </div>
      </div>
    </div>
  );
};

export default SignaturePad;
