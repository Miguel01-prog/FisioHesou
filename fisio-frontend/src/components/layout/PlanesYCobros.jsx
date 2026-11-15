import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import api from "../../api.js";
import { showSuccess, showError, showConfirm } from "../../utils/alerts.js";
import LoadingSpinner from "./LoadingSpinner.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaDollarSign,
  FaBoxes,
  FaCalendarCheck,
  FaLayerGroup,
  FaToggleOn,
  FaToggleOff,
  FaHeartbeat,
  FaAppleAlt,
  FaTimes
} from "react-icons/fa";

export default function PlanesYCobros() {
  const { user } = useAuth();
  const [planes, setPlanes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [busqueda, setBusqueda] = useState("");

  // Modal Crear / Editar
  const [modalAbierto, setModalAbierto] = useState(false);
  const [planEditando, setPlanEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);

  // Form state
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [costo, setCosto] = useState("");
  const [sesiones, setSesiones] = useState(1);
  const [tipo, setTipo] = useState(""); // Inicia en vacío para "Seleccione..."
  const [activo, setActivo] = useState(true);

  // Obtener área o especialidad directamente de la sesión activa
  const getAreaFromSession = () => {
    const role = (user?.role || user?.rol || "").toLowerCase();
    if (role.includes("nutri")) return "nutriologa";
    return "fisioterapia";
  };

  const getAreaLabel = (areaKey) => {
    const a = (areaKey || getAreaFromSession()).toLowerCase();
    if (a.includes("nutri")) return "Nutrición";
    return "Fisioterapia";
  };

  useEffect(() => {
    cargarPlanes();
  }, []);

  // Bloquear scroll de body cuando el modal está abierto para mobile UX
  useEffect(() => {
    if (modalAbierto) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [modalAbierto]);

  const cargarPlanes = async () => {
    try {
      setLoading(true);
      const res = await api.get("/costos-planes");
      setPlanes(res.data?.planes || []);
    } catch (err) {
      console.error("Error al cargar planes y costos:", err);
      showError("Error", "No se pudieron cargar los planes y costos de la clínica.");
    } finally {
      setLoading(false);
    }
  };

  const abrirModalCrear = () => {
    setPlanEditando(null);
    setNombre("");
    setDescripcion("");
    setCosto("");
    setSesiones(1);
    setTipo(""); // Inicia en vacío para que el combo muestre "Seleccione..."
    setActivo(true);
    setModalAbierto(true);
  };

  const abrirModalEditar = (p) => {
    setPlanEditando(p);
    setNombre(p.nombre || "");
    setDescripcion(p.descripcion || "");
    setCosto(p.costo !== undefined ? String(p.costo) : "");
    setSesiones(p.sesiones || 1);
    setTipo(p.tipo || "");
    setActivo(p.activo !== false);
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setPlanEditando(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) {
      return showError("Campo requerido", "Ingresa el nombre del plan o servicio.");
    }
    if (!tipo) {
      return showError("Campo requerido", "Por favor selecciona el tipo de servicio.");
    }
    if (costo === "" || isNaN(Number(costo)) || Number(costo) < 0) {
      return showError("Costo inválido", "Ingresa un costo numérico válido (mayor o igual a 0).");
    }

    try {
      setGuardando(true);
      const sessionArea = getAreaFromSession();
      const payload = {
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        costo: Number(costo),
        sesiones: tipo === "sesion" ? 1 : Math.max(1, parseInt(sesiones, 10) || 1),
        tipo,
        area: sessionArea, // Se asigna directamente de la sesión
        activo: planEditando ? (planEditando.activo !== false) : true // Siempre activo al crearse
      };

      if (planEditando) {
        await api.put(`/costos-planes/${planEditando._id}`, payload);
        showSuccess("Plan Actualizado", `El plan "${nombre}" fue modificado correctamente.`);
      } else {
        await api.post("/costos-planes", payload);
        showSuccess("Plan Creado", `Se creó el plan "${nombre}" correctamente.`);
      }

      cerrarModal();
      await cargarPlanes();
    } catch (err) {
      console.error("Error al guardar plan:", err);
      const msg = err?.response?.data?.message || "Ocurrió un error al guardar el plan.";
      showError("Error", msg);
    } finally {
      setGuardando(false);
    }
  };

  const handleToggleEstado = async (plan) => {
    try {
      await api.patch(`/costos-planes/${plan._id}/estado`);
      setPlanes((prev) =>
        prev.map((p) => (p._id === plan._id ? { ...p, activo: !p.activo } : p))
      );
      showSuccess(
        plan.activo ? "Plan Desactivado" : "Plan Activado",
        `El plan "${plan.nombre}" ahora está ${plan.activo ? "inactivo" : "activo"}.`
      );
    } catch (err) {
      console.error("Error al cambiar estado:", err);
      showError("Error", "No se pudo cambiar el estado del plan.");
    }
  };

  const handleEliminarPlan = async (plan) => {
    const confirmado = await showConfirm(
      "¿Eliminar Plan / Costo?",
      `¿Confirmas que deseas eliminar el plan "${plan.nombre}"? Esta acción no se puede deshacer.`
    );
    if (!confirmado) return;

    try {
      await api.delete(`/costos-planes/${plan._id}`);
      setPlanes((prev) => prev.filter((p) => p._id !== plan._id));
      showSuccess("Plan Eliminado", `El plan "${plan.nombre}" ha sido eliminado.`);
    } catch (err) {
      console.error("Error al eliminar plan:", err);
      showError("Error", "No se pudo eliminar el plan seleccionado.");
    }
  };

  // Filtrado de planes
  const planesFiltrados = useMemo(() => {
    const sessionArea = getAreaFromSession();
    return planes.filter((p) => {
      // Filtrar por área de la sesión o general
      if (p.area && p.area !== "general" && p.area !== sessionArea) {
        return false;
      }

      // Búsqueda por texto
      if (busqueda.trim()) {
        const query = busqueda.toLowerCase();
        const coincideNombre = (p.nombre || "").toLowerCase().includes(query);
        const coincideDesc = (p.descripcion || "").toLowerCase().includes(query);
        if (!coincideNombre && !coincideDesc) return false;
      }

      // Filtro por Tipo
      if (filtroTipo !== "todos") {
        if (p.tipo !== filtroTipo) return false;
      }

      // Filtro por Estado
      if (filtroEstado !== "todos") {
        const esActivo = p.activo !== false;
        if (filtroEstado === "activos" && !esActivo) return false;
        if (filtroEstado === "inactivos" && esActivo) return false;
      }

      return true;
    });
  }, [planes, busqueda, filtroTipo, filtroEstado, user]);

  // KPIs
  const stats = useMemo(() => {
    const total = planesFiltrados.length;
    const activos = planesFiltrados.filter((p) => p.activo !== false).length;
    const paquetes = planesFiltrados.filter((p) => p.tipo === "paquete").length;
    const individuales = planesFiltrados.filter((p) => p.tipo === "sesion").length;
    const sumaCosto = planesFiltrados.reduce((acc, p) => acc + (Number(p.costo) || 0), 0);
    const promedio = total > 0 ? sumaCosto / total : 0;
    return { total, activos, paquetes, individuales, promedio };
  }, [planesFiltrados]);

  const formatPrecio = (num) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 2
    }).format(num || 0);
  };

  const getTipoLabel = (t) => {
    switch (t) {
      case "paquete":
        return { label: "Paquete de Sesiones", color: "#6366f1", bg: "rgba(99, 102, 241, 0.12)" };
      case "sesion":
      default:
        return { label: "Sesión Individual", color: "#10b981", bg: "rgba(16, 185, 129, 0.12)" };
    }
  };

  const getAreaBadge = (a) => {
    const areaLower = (a || getAreaFromSession()).toLowerCase();
    if (areaLower.includes("nutri")) {
      return { label: "Nutrición", icon: <FaAppleAlt size={11} />, color: "#10b981", bg: "rgba(16, 185, 129, 0.1)" };
    }
    return { label: "Fisioterapia", icon: <FaHeartbeat size={11} />, color: "#3b82f6", bg: "rgba(59, 130, 246, 0.1)" };
  };

  return (
    <div className="auth-wrapper-content fade-in-up" style={{ width: "100%", paddingBottom: "3rem" }}>
      <style>{`
        /* Hero card */
        .planes-header-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1.25rem;
          width: 100%;
        }

        .planes-title-area {
          flex: 1 1 340px;
          min-width: 280px;
        }

        .planes-actions-area {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          flex-shrink: 0;
        }

        /* KPI Stat Cards */
        .planes-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1.15rem;
          margin-bottom: 1.5rem;
          width: 100%;
        }

        .planes-stat-card {
          background: var(--card-bg, #ffffff);
          backdrop-filter: blur(20px) saturate(135%);
          -webkit-backdrop-filter: blur(20px) saturate(135%);
          border: 1px solid var(--card-border, rgba(255, 255, 255, 0.6));
          border-radius: var(--radius-md, 16px);
          padding: 1.25rem 1.35rem;
          box-shadow: var(--shadow-glass), var(--shadow-sm);
          display: flex;
          align-items: center;
          gap: 1rem;
          transition: transform var(--transition-fast), box-shadow var(--transition-fast);
        }

        .planes-stat-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-glass), var(--shadow-md);
        }

        .planes-stat-icon-bubble {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.35rem;
          flex-shrink: 0;
        }

        /* Filters Bar */
        .planes-filters-bar {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.85rem;
          width: 100%;
        }

        .planes-search-wrapper {
          flex: 1 1 280px;
          min-width: 240px;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: rgba(255, 255, 255, 0.65);
          border: 1px solid var(--card-border, rgba(99, 102, 241, 0.15));
          border-radius: var(--radius-sm, 10px);
          padding: 0.6rem 1rem;
          transition: all var(--transition-fast);
        }

        [data-theme="dark"] .planes-search-wrapper {
          background: rgba(15, 23, 42, 0.5);
          border-color: rgba(255, 255, 255, 0.08);
        }

        .planes-search-wrapper:focus-within {
          background: #ffffff;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px var(--primary-glow);
        }

        [data-theme="dark"] .planes-search-wrapper:focus-within {
          background: rgba(15, 23, 42, 0.85);
        }

        .planes-search-input {
          border: none;
          background: transparent;
          outline: none;
          width: 100%;
          font-size: 0.9rem;
          font-family: var(--font-family-sans);
          color: var(--text-main);
        }

        .planes-search-input::placeholder {
          color: var(--text-muted);
          opacity: 0.75;
        }

        .planes-filters-group {
          display: flex;
          flex-wrap: wrap;
          gap: 0.65rem;
          flex: 0 1 auto;
        }

        .clinic-filter-select {
          background: rgba(255, 255, 255, 0.75);
          border: 1px solid var(--card-border, rgba(99, 102, 241, 0.16));
          border-radius: var(--radius-sm, 10px);
          padding: 0.6rem 0.95rem;
          font-size: 0.86rem;
          font-weight: 600;
          color: var(--text-main);
          outline: none;
          cursor: pointer;
          transition: all var(--transition-fast);
          box-shadow: var(--shadow-sm);
        }

        [data-theme="dark"] .clinic-filter-select {
          background: rgba(15, 23, 42, 0.65);
          border-color: rgba(255, 255, 255, 0.08);
          color: var(--text-main);
        }

        .clinic-filter-select:hover {
          border-color: var(--primary);
          background: #ffffff;
        }

        [data-theme="dark"] .clinic-filter-select:hover {
          background: rgba(15, 23, 42, 0.85);
        }

        .clinic-filter-select:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px var(--primary-glow);
          background: #ffffff;
        }

        .btn-action-round {
          width: 34px;
          height: 34px;
          border-radius: 9px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid transparent;
          background: rgba(99, 102, 241, 0.08);
          color: var(--primary);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .btn-action-round:hover {
          background: var(--primary);
          color: #ffffff;
          transform: scale(1.06);
        }

        .btn-action-round.danger {
          background: rgba(239, 68, 68, 0.08);
          color: #ef4444;
        }

        .btn-action-round.danger:hover {
          background: #ef4444;
          color: #ffffff;
        }

        /* ==========================================================================
           TABLA DE PLANES Y COSTOS (Independiente de tabla-pacientes)
           ========================================================================== */
        .planes-table-wrapper {
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          border-radius: var(--radius-sm, 12px);
        }

        .tabla-planes-costos {
          width: 100%;
          min-width: 650px;
          border-collapse: separate;
          border-spacing: 0 10px;
          margin-top: -6px;
        }

        .tabla-planes-costos thead {
          display: table-header-group !important;
        }

        .tabla-planes-costos thead tr {
          display: table-row !important;
          background: transparent !important;
          box-shadow: none !important;
        }

        .tabla-planes-costos th {
          color: var(--text-muted);
          font-family: var(--font-family-display);
          font-weight: 700;
          font-size: 0.85rem;
          padding: 0.75rem 1rem;
          text-align: left;
          border-bottom: 2px solid var(--border-light, rgba(99, 102, 241, 0.12));
          white-space: nowrap;
        }

        .tabla-planes-costos tbody {
          display: table-row-group !important;
        }

        .tabla-planes-costos tbody tr {
          display: table-row !important;
          background: rgba(255, 255, 255, 0.65) !important;
          box-shadow: var(--shadow-sm) !important;
          border-radius: var(--radius-sm, 10px);
          transition: transform var(--transition-fast), box-shadow var(--transition-fast), background var(--transition-fast);
        }

        [data-theme="dark"] .tabla-planes-costos tbody tr {
          background: rgba(15, 23, 42, 0.45) !important;
        }

        .tabla-planes-costos tbody tr:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(99, 102, 241, 0.1) !important;
          background: #ffffff !important;
        }

        [data-theme="dark"] .tabla-planes-costos tbody tr:hover {
          background: rgba(15, 23, 42, 0.8) !important;
        }

        .tabla-planes-costos td {
          padding: 1rem 1.15rem;
          vertical-align: middle;
          border-top: 1px solid var(--card-border, rgba(255, 255, 255, 0.7));
          border-bottom: 1px solid var(--card-border, rgba(255, 255, 255, 0.7));
          color: var(--text-main);
          font-size: 0.9rem;
        }

        .tabla-planes-costos tr td:first-child {
          border-top-left-radius: var(--radius-sm, 10px);
          border-bottom-left-radius: var(--radius-sm, 10px);
          border-left: 1px solid var(--card-border, rgba(255, 255, 255, 0.7));
        }

        .tabla-planes-costos tr td:last-child {
          border-top-right-radius: var(--radius-sm, 10px);
          border-bottom-right-radius: var(--radius-sm, 10px);
          border-right: 1px solid var(--card-border, rgba(255, 255, 255, 0.7));
        }

        /* Anular pseudo-elementos de pacientes */
        .tabla-planes-costos td::before {
          content: none !important;
          display: none !important;
        }

        /* ==========================================================================
           MODAL RESPONSIVO PORTALED (Directo a document.body)
           ========================================================================== */
        .planes-modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(15, 23, 42, 0.68);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 99999 !important;
          padding: 1rem;
          overflow-y: auto;
          pointer-events: auto !important;
          animation: planesFadeInModal 0.22s ease-out;
        }

        .planes-modal-content {
          position: relative;
          background: #ffffff;
          border-radius: 20px;
          padding: 2rem 2.25rem;
          width: 100%;
          max-width: 520px;
          max-height: 90vh;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          box-shadow: 0 24px 50px rgba(0, 0, 0, 0.25);
          border: 1px solid rgba(255, 255, 255, 0.9);
          margin: auto;
          pointer-events: auto !important;
          animation: planesScaleUpModal 0.26s cubic-bezier(0.16, 1, 0.3, 1);
          color: var(--text-main);
        }

        [data-theme="dark"] .planes-modal-content {
          background: #0f172a;
          border-color: rgba(255, 255, 255, 0.1);
        }

        .planes-modal-close-btn {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(148, 163, 184, 0.15);
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: var(--text-muted);
          font-size: 0.95rem;
          transition: all var(--transition-fast);
          z-index: 10;
        }

        .planes-modal-close-btn:hover {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
          transform: scale(1.08);
        }

        .planes-modal-grid-2col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1.15rem;
        }

        @keyframes planesFadeInModal {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes planesScaleUpModal {
          from {
            opacity: 0;
            transform: scale(0.94) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @media (max-width: 768px) {
          .planes-header-card {
            flex-direction: column;
            align-items: stretch !important;
            gap: 1rem;
          }
          .planes-actions-area {
            justify-content: flex-end;
          }
          .planes-search-wrapper {
            flex: 1 1 100%;
          }
          .planes-filters-group {
            width: 100%;
            display: grid;
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 520px) {
          .planes-modal-content {
            padding: 1.35rem 1rem !important;
            border-radius: 14px !important;
            max-height: 94vh !important;
          }
          .planes-modal-grid-2col {
            grid-template-columns: 1fr !important;
            gap: 0.85rem !important;
          }
        }
      `}</style>

      {/* HEADER HERO */}
      <div className="auth-card" style={{ padding: "1.5rem 1.75rem", marginBottom: "1.5rem" }}>
        <div className="planes-header-card">
          <div className="planes-title-area">
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  background: "var(--primary-light, rgba(99, 102, 241, 0.12))",
                  color: "var(--primary, #6366f1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.25rem",
                  boxShadow: "var(--shadow-sm)"
                }}
              >
                <FaDollarSign />
              </div>
              <h2 className="title_card" style={{ margin: 0, fontSize: "1.55rem" }}>
                Planes y Costos del Sistema
              </h2>
            </div>
          </div>

          <div className="planes-actions-area">
            <button
              type="button"
              className="save-btn hover-grow"
              onClick={abrirModalCrear}
              style={{
                height: "42px",
                padding: "0 1.25rem",
                fontSize: "0.9rem",
                borderRadius: "var(--radius-sm, 10px)",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                margin: 0
              }}
            >
              <FaPlus size={12} /> <span>Nuevo Plan / Costo</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI STATS CARDS */}
      <div className="planes-stats-grid">
        <div className="planes-stat-card">
          <div className="planes-stat-icon-bubble" style={{ background: "rgba(99, 102, 241, 0.12)", color: "var(--primary, #6366f1)" }}>
            <FaLayerGroup />
          </div>
          <div>
            <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600 }}>Planes Totales</span>
            <h3 style={{ margin: "2px 0 0 0", fontSize: "1.45rem", fontWeight: 800, color: "var(--text-main)" }}>
              {stats.total}
            </h3>
            <span style={{ fontSize: "0.72rem", color: "var(--success, #10b981)", fontWeight: 700 }}>
              {stats.activos} activos
            </span>
          </div>
        </div>

        <div className="planes-stat-card">
          <div className="planes-stat-icon-bubble" style={{ background: "rgba(139, 92, 246, 0.12)", color: "#8b5cf6" }}>
            <FaBoxes />
          </div>
          <div>
            <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600 }}>Paquetes</span>
            <h3 style={{ margin: "2px 0 0 0", fontSize: "1.45rem", fontWeight: 800, color: "var(--text-main)" }}>
              {stats.paquetes}
            </h3>
            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Multi-sesiones</span>
          </div>
        </div>

        <div className="planes-stat-card">
          <div className="planes-stat-icon-bubble" style={{ background: "rgba(16, 185, 129, 0.12)", color: "#10b981" }}>
            <FaCalendarCheck />
          </div>
          <div>
            <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600 }}>Sesiones Individuales</span>
            <h3 style={{ margin: "2px 0 0 0", fontSize: "1.45rem", fontWeight: 800, color: "var(--text-main)" }}>
              {stats.individuales}
            </h3>
            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Por sesión única</span>
          </div>
        </div>
      </div>
      {loading ? (
        <div style={{ padding: "4rem 0", display: "flex", justifyContent: "center" }}>
          <LoadingSpinner text="Cargando planes y costos..." />
        </div>
      ) : planesFiltrados.length === 0 ? (
        <div
          className="auth-card"
          style={{ textAlign: "center", padding: "3.5rem 1.5rem" }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background: "var(--primary-light, rgba(99, 102, 241, 0.12))",
              color: "var(--primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.25rem auto",
              fontSize: "1.6rem",
              boxShadow: "var(--shadow-sm)"
            }}
          >
            <FaDollarSign />
          </div>
          <h3 className="title_card" style={{ margin: "0 0 0.5rem 0", fontSize: "1.25rem" }}>
            No se encontraron planes
          </h3>
          <p className="text-muted" style={{ margin: "0 0 1.5rem 0", fontSize: "0.9rem" }}>
            {planes.length === 0
              ? "Aún no has registrado planes o tarifas en el sistema. Crea tu primer plan ahora."
              : "No hay planes que coincidan con los filtros seleccionados."}
          </p>
          <button
            type="button"
            className="save-btn hover-grow"
            onClick={abrirModalCrear}
            style={{ height: "42px", padding: "0 22px", borderRadius: "10px", margin: "0 auto" }}
          >
            <FaPlus size={12} style={{ marginRight: "6px" }} /> Crear Plan / Costo
          </button>
        </div>
      ) : (
        /* VISTA EN TABLA */
        <div className="auth-card" style={{ padding: "1.25rem", width: "100%" }}>
          <div className="planes-table-wrapper">
            <table className="tabla-planes-costos">
            <thead>
              <tr>
                <th style={{ padding: "14px 16px" }}>Plan / Servicio</th>
                <th style={{ padding: "14px 14px" }}>Tipo</th>
                <th style={{ padding: "14px 14px" }}>Área</th>
                <th style={{ padding: "14px 14px" }}>Sesiones</th>
                <th style={{ padding: "14px 14px" }}>Costo</th>
                <th style={{ padding: "14px 14px", textAlign: "center" }}>Estado</th>
                <th style={{ padding: "14px 16px", textAlign: "right" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {planesFiltrados.map((plan) => {
                const tipoInfo = getTipoLabel(plan.tipo);
                const areaInfo = getAreaBadge(plan.area);
                const esActivo = plan.activo !== false;

                return (
                  <tr key={plan._id} style={{ opacity: esActivo ? 1 : 0.65 }}>
                    <td style={{ padding: "14px 16px" }}>
                      <strong style={{ color: "var(--text-main)", fontSize: "0.92rem" }}>{plan.nombre}</strong>
                      {plan.descripcion && (
                        <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "3px", lineHeight: 1.35 }}>
                          {plan.descripcion}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <span
                        style={{
                          background: tipoInfo.bg,
                          color: tipoInfo.color,
                          padding: "4px 10px",
                          borderRadius: "999px",
                          fontSize: "0.74rem",
                          fontWeight: 700
                        }}
                      >
                        {tipoInfo.label}
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <span
                        style={{
                          background: areaInfo.bg,
                          color: areaInfo.color,
                          padding: "4px 10px",
                          borderRadius: "999px",
                          fontSize: "0.74rem",
                          fontWeight: 600,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px"
                        }}
                      >
                        {areaInfo.icon} {areaInfo.label}
                      </span>
                    </td>
                    <td style={{ padding: "14px 14px" }}>
                      <strong>{plan.sesiones}</strong> {plan.sesiones === 1 ? "sesión" : "sesiones"}
                      {plan.sesiones > 1 && (
                        <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginTop: "2px" }}>
                          ~{formatPrecio(plan.costo / plan.sesiones)} / ses.
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "14px 14px", fontWeight: 800, color: "var(--primary)", fontSize: "1rem" }}>
                      {formatPrecio(plan.costo)}
                    </td>
                    <td style={{ padding: "12px 14px", textAlign: "center" }}>
                      <button
                        type="button"
                        onClick={() => handleToggleEstado(plan)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: esActivo ? "var(--success, #10b981)" : "#94a3b8",
                          fontSize: "1.55rem",
                          lineHeight: 1
                        }}
                        title={esActivo ? "Desactivar plan" : "Activar plan"}
                      >
                        {esActivo ? <FaToggleOn /> : <FaToggleOff />}
                      </button>
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "6px" }}>
                        <button
                          type="button"
                          className="btn-action-round"
                          onClick={() => abrirModalEditar(plan)}
                          title="Editar"
                        >
                          <FaEdit size={13} />
                        </button>
                        <button
                          type="button"
                          className="btn-action-round danger"
                          onClick={() => handleEliminarPlan(plan)}
                          title="Eliminar"
                        >
                          <FaTrash size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* MODAL CREAR / EDITAR RESPONSIVO PORTALED */}
      {modalAbierto &&
        createPortal(
          <div className="planes-modal-backdrop" onClick={cerrarModal}>
            <div
              className="planes-modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="planes-modal-close-btn"
                onClick={cerrarModal}
                title="Cerrar modal"
                aria-label="Cerrar modal"
              >
                <FaTimes />
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "1.1rem" }}>
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "12px",
                    background: "var(--primary-light, rgba(99, 102, 241, 0.12))",
                    color: "var(--primary, #6366f1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.25rem",
                    boxShadow: "var(--shadow-sm)",
                    flexShrink: 0
                  }}
                >
                  {planEditando ? <FaEdit /> : <FaPlus />}
                </div>
                <div>
                  <h3 className="title_card" style={{ margin: 0, fontSize: "1.25rem" }}>
                    {planEditando ? "Editar Plan / Costo" : "Nuevo Plan / Costo"}
                  </h3>
                </div>
              </div>

              <hr style={{ margin: "0.5rem 0 1.25rem 0" }} />

              <form onSubmit={handleSubmit}>
                {/* Nombre */}
                <div style={{ marginBottom: "1.1rem" }}>
                  <label className="form-label" style={{ display: "block", marginBottom: "0.45rem" }}>
                    Nombre del Plan o Servicio <span style={{ color: "var(--danger, #ef4444)" }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Ej. Sesión Individual, Paquete 5 Sesiones..."
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                  />
                </div>

                {/* Fila: Tipo de Servicio y Sesiones Incluidas */}
                <div className="planes-modal-grid-2col">
                  <div>
                    <label className="form-label" style={{ display: "block", marginBottom: "0.45rem" }}>
                      Tipo de Servicio <span style={{ color: "var(--danger, #ef4444)" }}>*</span>
                    </label>
                    <select
                      className="input"
                      value={tipo}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTipo(val);
                        if (val === "sesion") setSesiones(1);
                        else if (val === "paquete" && sesiones === 1) setSesiones(5);
                      }}
                      required
                      style={{ cursor: "pointer" }}
                    >
                      <option value="">Seleccione...</option>
                      <option value="sesion">Sesión Individual</option>
                      <option value="paquete">Paquete de Sesiones</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label" style={{ display: "block", marginBottom: "0.45rem" }}>
                      Sesiones Incluidas <span style={{ color: "var(--danger, #ef4444)" }}>*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      className="input"
                      value={tipo === "sesion" ? 1 : sesiones}
                      onChange={(e) => setSesiones(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      disabled={tipo === "sesion"}
                      required
                      style={tipo === "sesion" ? { background: "rgba(148, 163, 184, 0.12)", cursor: "not-allowed" } : {}}
                    />
                  </div>
                </div>

                {/* Fila: Costo */}
                <div style={{ marginBottom: "1.1rem" }}>
                  <label className="form-label" style={{ display: "block", marginBottom: "0.45rem" }}>
                    Costo ($ MXN) <span style={{ color: "var(--danger, #ef4444)" }}>*</span>
                  </label>
                  <div style={{ position: "relative" }}>
                    <span
                      style={{
                        position: "absolute",
                        left: "14px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        fontWeight: 700,
                        color: "var(--text-muted)",
                        fontSize: "1.05rem"
                      }}
                    >
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="input"
                      placeholder="0.00"
                      value={costo}
                      onChange={(e) => setCosto(e.target.value)}
                      required
                      style={{ paddingLeft: "30px", fontSize: "1rem", fontWeight: 600 }}
                    />
                  </div>
                  {tipo === "paquete" && sesiones > 1 && costo && Number(costo) > 0 && (
                    <div style={{ fontSize: "0.78rem", color: "var(--primary)", marginTop: "4px", fontWeight: 600 }}>
                      Aproximadamente {formatPrecio(Number(costo) / sesiones)} por sesión.
                    </div>
                  )}
                </div>

                {/* Descripción */}
                <div style={{ marginBottom: "1.5rem" }}>
                  <label className="form-label" style={{ display: "block", marginBottom: "0.45rem" }}>
                    Descripción (Opcional)
                  </label>
                  <textarea
                    className="textarea"
                    rows={2}
                    placeholder="Detalles sobre lo que incluye este plan, condiciones, vigencia..."
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    style={{ minHeight: "75px" }}
                  />
                </div>

                {/* Botones Acciones */}
                <div style={{ display: "flex", gap: "0.85rem" }}>
                  <button
                    type="button"
                    onClick={cerrarModal}
                    style={{
                      flex: 1,
                      height: "44px",
                      borderRadius: "var(--radius-sm, 10px)",
                      fontWeight: 600,
                      fontSize: "0.9rem",
                      background: "rgba(148, 163, 184, 0.12)",
                      border: "1px solid rgba(148, 163, 184, 0.2)",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      transition: "all var(--transition-fast)"
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="save-btn hover-grow"
                    disabled={guardando}
                    style={{
                      flex: 1.5,
                      height: "44px",
                      fontSize: "0.92rem",
                      margin: 0
                    }}
                  >
                    {guardando ? (
                      <LoadingSpinner text="Guardando..." />
                    ) : planEditando ? (
                      "Guardar Cambios"
                    ) : (
                      "Crear Plan / Costo"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
