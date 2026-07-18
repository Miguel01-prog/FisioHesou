import React, { useState, useEffect } from "react";
import api from "../../api.js";
import LoadingSpinner from "../../components/layout/LoadingSpinner.jsx";
import { showError, showSuccess } from "../../utils/alerts.js";
import { FiPlus, FiSettings, FiTrash2, FiEdit2, FiCheck, FiX, FiLink, FiImage, FiChevronDown, FiChevronRight, FiFolder } from "react-icons/fi";

export default function ModulosPage() {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  
   const [editingId, setEditingId] = useState(null);
  const [key, setKey] = useState("");
  const [label, setLabel] = useState("");
  const [path, setPath] = useState("");
  const [icon, setIcon] = useState("");
  const [parentKey, setParentKey] = useState("");
  const [isContainer, setIsContainer] = useState(false);
  const [active, setActive] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [expandedParents, setExpandedParents] = useState({});
  const [showFormModal, setShowFormModal] = useState(false);

  const toggleParent = (pKey) => {
    setExpandedParents(prev => ({
      ...prev,
      [pKey]: !prev[pKey]
    }));
  };

  const fetchModules = async () => {
    try {
      const res = await api.get("/modules");
      setModules(res.data.modules || []);
    } catch (err) {
      console.error(err);
      showError("Error", "No se pudieron cargar los módulos del sistema");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, []);

  const handleEditClick = (m) => {
    setEditingId(m._id);
    setKey(m.key);
    setLabel(m.label);
    setPath(m.path);
    setIcon(m.icon);
    setParentKey(m.parentKey || "");
    setIsContainer(m.path === "#");
    setActive(m.active);
    setShowFormModal(true);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setKey("");
    setLabel("");
    setPath("");
    setIcon("");
    setParentKey("");
    setIsContainer(false);
    setActive(true);
    setShowFormModal(false);
  };

  const handleDeleteClick = async (id) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este módulo? Las clínicas que lo utilicen ya no podrán visualizarlo en su menú lateral.")) {
      return;
    }

    try {
      await api.delete(`/modules/${id}`);
      showSuccess("Eliminado", "Módulo eliminado correctamente");
      fetchModules();
    } catch (err) {
      console.error(err);
      showError("Error", err.response?.data?.message || "No se pudo eliminar el módulo");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!key.trim() || !label.trim() || (!isContainer && !path.trim()) || !icon.trim()) {
      return showError("Campos obligatorios", "Por favor, completa todos los campos del módulo");
    }

    const cleanKey = key.toLowerCase().replace(/[^a-z0-9_]/g, "_");

    setGuardando(true);
    try {
      const payload = {
        key: cleanKey,
        label: label.trim(),
        path: isContainer ? "#" : path.trim().replace(/^\//, ""), // Set path to '#' if it is a container
        icon: icon.trim(),
        parentKey: isContainer ? null : (parentKey || null),
        active
      };

      if (editingId) {
        await api.put(`/modules/${editingId}`, payload);
        showSuccess("Actualizado", "Módulo actualizado correctamente");
      } else {
        await api.post("/modules", payload);
        showSuccess("Creado", "Nuevo módulo registrado con éxito");
      }

      handleCancelEdit();
      fetchModules();
    } catch (err) {
      console.error(err);
      showError("Error", err.response?.data?.message || "Ocurrió un error al procesar el módulo");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="modulos-admin-container" style={{ padding: "1.5rem", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Cabecera */}
      <header style={{ marginBottom: "2rem" }}>
        <h1 style={{ color: "var(--primary)", fontSize: "1.8rem", fontWeight: "700" }}>
          ⚙️ Administrador de Módulos del Sistema
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
          Registra nuevas secciones del menú, iconos y rutas para expandir el sistema a otros giros de negocio.
        </p>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "2rem" }}>
        
        {/* Formulario de registro en Ventana Modal */}
        {showFormModal && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(4px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
            padding: "1rem"
          }}>
            <section className="auth-card card" style={{
              width: "100%",
              maxWidth: "500px",
              padding: "2.2rem",
              position: "relative",
              animation: "fadeInUp 0.25s ease-out",
              background: "var(--card-bg)",
              border: "1px solid var(--card-border)",
              borderRadius: "16px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)",
              maxHeight: "90vh",
              overflowY: "auto"
            }}>
              {/* Close Button X */}
              <button
                type="button"
                onClick={handleCancelEdit}
                style={{
                  position: "absolute",
                  top: "1.25rem",
                  right: "1.25rem",
                  background: "transparent",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "4px",
                  borderRadius: "50%",
                  transition: "all 0.2s"
                }}
                title="Cerrar"
              >
                <FiX size={18} />
              </button>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <h2 style={{ fontSize: "1.2rem", color: "var(--text-main)", fontWeight: "600", margin: 0 }}>
                  {editingId ? "Editar Módulo" : "Registrar Nuevo Módulo"}
                </h2>
              </div>

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
            
            {/* Key */}
            <div>
              <label htmlFor="mod-key" className="form-label" style={{ display: "block", marginBottom: "0.5rem" }}>
                Identificador Técnico (Key) *
              </label>
              <input
                id="mod-key"
                type="text"
                className="input"
                placeholder="Ej. barberia_cortes"
                value={key}
                onChange={e => setKey(e.target.value)}
                required
                disabled={guardando}
              />
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block", marginTop: "4px" }}>
                Único, sin espacios ni caracteres especiales.
              </span>
            </div>

            {/* Label */}
            <div>
              <label htmlFor="mod-label" className="form-label" style={{ display: "block", marginBottom: "0.5rem" }}>
                Etiqueta / Nombre Visible *
              </label>
              <input
                id="mod-label"
                type="text"
                className="input"
                placeholder="Ej. Cortes y Estilos"
                value={label}
                onChange={e => setLabel(e.target.value)}
                required
                disabled={guardando}
              />
            </div>
            
            {/* Container Checkbox */}
            <div style={{ padding: "0.5rem", background: "rgba(255,255,255,0.02)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.04)" }}>
              <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "0.6rem", cursor: "pointer", fontWeight: "600" }}>
                <input
                  type="checkbox"
                  checked={isContainer}
                  onChange={e => {
                    const checked = e.target.checked;
                    setIsContainer(checked);
                    if (checked) {
                      setPath("#");
                      setParentKey("");
                    } else {
                      setPath("");
                    }
                  }}
                  disabled={guardando}
                  style={{ width: "18px", height: "18px", cursor: "pointer" }}
                />
                ¿Es una categoría contenedora (Menú Padre)?
              </label>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block", marginTop: "4px", paddingLeft: "26px" }}>
                Activa esto para crear un desplegable que agrupe otros submenús (ej. Carpeta de Configuración).
              </span>
            </div>

            {/* Path */}
            {!isContainer && (
              <div>
                <label htmlFor="mod-path" className="form-label" style={{ display: "block", marginBottom: "0.5rem" }}>
                  Ruta React Router (Path) *
                </label>
                <input
                  id="mod-path"
                  type="text"
                  className="input"
                  placeholder="Ej. barberia"
                  value={path}
                  onChange={e => setPath(e.target.value)}
                  required={!isContainer}
                  disabled={guardando}
                />
              </div>
            )}

            {/* Icon */}
            <div>
              <label htmlFor="mod-icon" className="form-label" style={{ display: "block", marginBottom: "0.5rem" }}>
                Nombre del Icono (react-icons) *
              </label>
              <input
                id="mod-icon"
                type="text"
                className="input"
                placeholder="Ej. FiScissors, FiCalendar, FiUsers"
                value={icon}
                onChange={e => setIcon(e.target.value)}
                required
                disabled={guardando}
              />
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block", marginTop: "4px" }}>
                Referencia al pack Lucide / Feather Icons.
              </span>
            </div>

            {/* Parent Module Selector */}
            {!isContainer && (
              <div>
                <label htmlFor="mod-parent" className="form-label" style={{ display: "block", marginBottom: "0.5rem" }}>
                  Módulo Padre (Opcional)
                </label>
                <select
                  id="mod-parent"
                  className="input"
                  value={parentKey}
                  onChange={e => setParentKey(e.target.value)}
                  disabled={guardando}
                  style={{ background: "rgba(0,0,0,0.2)", color: "var(--text-main)", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  <option value="">Ninguno (Módulo Principal)</option>
                  {modules
                    .filter(m => m.path === "#" && m._id !== editingId)
                    .map(p => (
                      <option key={p.key} value={p.key}>{p.label} ({p.key})</option>
                    ))
                  }
                </select>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block", marginTop: "4px" }}>
                  Selecciona la carpeta contenedora en la que se anidará esta opción.
                </span>
              </div>
            )}

            {/* Active Checkbox */}
            <div>
              <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={active}
                  onChange={e => setActive(e.target.checked)}
                  disabled={guardando}
                  style={{ width: "18px", height: "18px" }}
                />
                Módulo Habilitado Globalmente
              </label>
            </div>

            {/* Módulos Hijos Asociados (Sólo cuando se edita un contenedor existente) */}
            {editingId && isContainer && (() => {
              const editingModule = modules.find(m => m._id === editingId);
              const childModules = editingModule ? modules.filter(m => m.parentKey === editingModule.key) : [];
              if (childModules.length === 0) return null;
              
              return (
                <div style={{
                  padding: "1rem",
                  background: "rgba(94, 80, 161, 0.08)",
                  borderRadius: "8px",
                  border: "1px solid rgba(94, 80, 161, 0.2)",
                  marginTop: "0.5rem"
                }}>
                  <h4 style={{ fontSize: "0.85rem", color: "var(--primary)", marginBottom: "0.5rem", fontWeight: "600" }}>
                    📋 Módulos Hijos Anidados:
                  </h4>
                  <ul style={{ paddingLeft: "1.2rem", margin: 0, fontSize: "0.8rem", color: "var(--text-muted)", display: "flex", flexDirection: "column", gap: "4px" }}>
                    {childModules.map(child => (
                      <li key={child._id}>
                        <strong>{child.label}</strong> (<code>{child.key}</code>)
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })()}

            {/* Acciones del formulario */}
            <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
              {editingId && (
                <button
                  type="button"
                  className="btn btn-outline w-100"
                  onClick={handleCancelEdit}
                  disabled={guardando}
                  style={{ height: "45px" }}
                >
                  Cancelar
                </button>
              )}
              <button
                type="submit"
                className="btn btn-primary w-100"
                style={{ height: "45px" }}
                disabled={guardando}
              >
                {guardando ? "Procesando..." : editingId ? "Guardar Módulo" : "Crear Módulo"}
              </button>
            </div>

              </form>
            </section>
          </div>
        )}

        {/* Listado de Módulos (auth-card card) */}
        <section className="auth-card card" style={{ padding: "2rem", width: "100%" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
            <h2 style={{ fontSize: "1.2rem", color: "var(--text-main)", fontWeight: "600", margin: 0 }}>
              Módulos Registrados ({modules.length})
            </h2>
            <button
              onClick={() => {
                handleCancelEdit();
                setShowFormModal(true);
              }}
              className="btn btn-primary"
              style={{ padding: "6px 12px", fontSize: "0.85rem", height: "36px", display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <FiPlus size={16} /> Crear Módulo
            </button>
          </div>

          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
              <LoadingSpinner />
            </div>
          ) : modules.length === 0 ? (
            <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem 0" }}>
              No hay módulos definidos en la base de datos.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", textAlign: "left" }}>
                    <th style={{ padding: "10px", color: "var(--primary)", fontSize: "0.8rem", fontWeight: "600" }}>KEY</th>
                    <th style={{ padding: "10px", color: "var(--primary)", fontSize: "0.8rem", fontWeight: "600" }}>ETIQUETA</th>
                    <th style={{ padding: "10px", color: "var(--primary)", fontSize: "0.8rem", fontWeight: "600" }}>ICONO / RUTA</th>
                    <th style={{ padding: "10px", color: "var(--primary)", fontSize: "0.8rem", fontWeight: "600" }}>ESTATUS</th>
                    <th style={{ padding: "10px", color: "var(--primary)", fontSize: "0.8rem", fontWeight: "600", textAlign: "center" }}>ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const parentModules = modules.filter(m => !m.parentKey);
                    const rows = [];

                    parentModules.forEach((parent) => {
                      const children = modules.filter(c => c.parentKey === parent.key);
                      const hasChildren = children.length > 0;
                      const isExpanded = !!expandedParents[parent.key];

                      // 1. Render Parent Row
                      rows.push(
                        <tr key={parent._id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                          <td style={{ padding: "12px 10px", fontSize: "0.85rem" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              {hasChildren && (
                                <button
                                  type="button"
                                  onClick={() => toggleParent(parent.key)}
                                  style={{
                                    background: "transparent",
                                    border: "none",
                                    color: "var(--primary)",
                                    cursor: "pointer",
                                    padding: "2px",
                                    display: "inline-flex",
                                    alignItems: "center"
                                  }}
                                  title={isExpanded ? "Colapsar" : "Expandir"}
                                >
                                  {isExpanded ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
                                </button>
                              )}
                              <code style={{ color: "var(--text-main)", fontWeight: "600" }}>{parent.key}</code>
                            </div>
                          </td>
                          <td style={{ padding: "12px 10px", fontSize: "0.85rem", color: "var(--text-main)", fontWeight: "600" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              {parent.path === "#" && (
                                <span style={{
                                  fontSize: "0.65rem",
                                  padding: "2px 6px",
                                  borderRadius: "4px",
                                  background: "rgba(94, 80, 161, 0.15)",
                                  color: "var(--primary)",
                                  fontWeight: "700",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "3px"
                                }}>
                                  <FiFolder size={10} /> Carpeta
                                </span>
                              )}
                              {parent.label}
                            </div>
                          </td>
                          <td style={{ padding: "12px 10px", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                            <div>🚩 Route: <code>/{parent.path}</code></div>
                            <div style={{ marginTop: "3px" }}>🎨 Icon: <code>{parent.icon}</code></div>
                          </td>
                          <td style={{ padding: "12px 10px" }}>
                            <span style={{
                              fontSize: "0.65rem",
                              padding: "2px 6px",
                              borderRadius: "8px",
                              background: parent.active ? "rgba(34, 197, 94, 0.12)" : "rgba(239, 68, 68, 0.12)",
                              color: parent.active ? "#22c55e" : "#ef4444",
                              fontWeight: "700"
                            }}>
                              {parent.active ? "Activo" : "Inactivo"}
                            </span>
                          </td>
                          <td style={{ padding: "12px 10px", textAlign: "center" }}>
                            <div style={{ display: "inline-flex", gap: "0.4rem" }}>
                              <button
                                onClick={() => handleEditClick(parent)}
                                className="btn btn-outline"
                                style={{ padding: "3px 6px", height: "24px", fontSize: "0.7rem" }}
                                title="Editar módulo"
                              >
                                <FiEdit2 size={10} />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(parent._id)}
                                className="btn btn-primary"
                                style={{ padding: "3px 6px", height: "24px", fontSize: "0.7rem", background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.4)" }}
                                title="Eliminar"
                              >
                                <FiTrash2 size={10} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );

                      // 2. Render Associated Children Rows (only if parent is expanded)
                      if (hasChildren && isExpanded) {
                        children.forEach((child) => {
                          rows.push(
                            <tr key={child._id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)", background: "rgba(255,255,255,0.01)" }}>
                              <td style={{ padding: "12px 10px 12px 2.2rem", fontSize: "0.82rem" }}>
                                <span style={{ color: "var(--primary)", marginRight: "6px", fontWeight: "bold" }}>↳</span>
                                <code style={{ color: "var(--text-muted)" }}>{child.key}</code>
                              </td>
                              <td style={{ padding: "12px 10px 12px 2.2rem", fontSize: "0.82rem", color: "var(--text-main)", fontWeight: "500" }}>
                                {child.label}
                              </td>
                              <td style={{ padding: "12px 10px", fontSize: "0.72rem", color: "var(--text-muted)" }}>
                                <div>🚩 Route: <code>/{child.path}</code></div>
                                <div>🎨 Icon: <code>{child.icon}</code></div>
                              </td>
                              <td style={{ padding: "12px 10px" }}>
                                <span style={{
                                  fontSize: "0.65rem",
                                  padding: "2px 6px",
                                  borderRadius: "8px",
                                  background: child.active ? "rgba(34, 197, 94, 0.12)" : "rgba(239, 68, 68, 0.12)",
                                  color: child.active ? "#22c55e" : "#ef4444",
                                  fontWeight: "700"
                                }}>
                                  {child.active ? "Activo" : "Inactivo"}
                                </span>
                              </td>
                              <td style={{ padding: "12px 10px", textAlign: "center" }}>
                                <div style={{ display: "inline-flex", gap: "0.4rem" }}>
                                  <button
                                    onClick={() => handleEditClick(child)}
                                    className="btn btn-outline"
                                    style={{ padding: "3px 6px", height: "24px", fontSize: "0.7rem" }}
                                    title="Editar módulo"
                                  >
                                    <FiEdit2 size={10} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteClick(child._id)}
                                    className="btn btn-primary"
                                    style={{ padding: "3px 6px", height: "24px", fontSize: "0.7rem", background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.4)" }}
                                    title="Eliminar"
                                  >
                                    <FiTrash2 size={10} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        });
                      }
                    });

                    // 3. Render Orphans (mismatched parentKey references)
                    const parentKeys = parentModules.map(p => p.key);
                    const orphans = modules.filter(m => m.parentKey && !parentKeys.includes(m.parentKey));
                    orphans.forEach((orphan) => {
                      rows.push(
                        <tr key={orphan._id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)", background: "rgba(239,68,68,0.03)" }}>
                          <td style={{ padding: "12px 10px", fontSize: "0.82rem" }}>
                            <code style={{ color: "#ef4444" }}>{orphan.key}</code>
                            <div style={{ fontSize: "0.65rem", color: "#ef4444", marginTop: "2px" }}>
                              ⚠️ Padre inexistente: <code>{orphan.parentKey}</code>
                            </div>
                          </td>
                          <td style={{ padding: "12px 10px", fontSize: "0.82rem", color: "var(--text-main)" }}>
                            {orphan.label}
                          </td>
                          <td style={{ padding: "12px 10px", fontSize: "0.72rem", color: "var(--text-muted)" }}>
                            <div>🚩 Route: <code>/{orphan.path}</code></div>
                            <div style={{ marginTop: "3px" }}>🎨 Icon: <code>{orphan.icon}</code></div>
                          </td>
                          <td style={{ padding: "12px 10px" }}>
                            <span style={{
                              fontSize: "0.65rem",
                              padding: "2px 6px",
                              borderRadius: "8px",
                              background: orphan.active ? "rgba(34, 197, 94, 0.12)" : "rgba(239, 68, 68, 0.12)",
                              color: orphan.active ? "#22c55e" : "#ef4444",
                              fontWeight: "700"
                            }}>
                              {orphan.active ? "Activo" : "Inactivo"}
                            </span>
                          </td>
                          <td style={{ padding: "12px 10px", textAlign: "center" }}>
                            <div style={{ display: "inline-flex", gap: "0.4rem" }}>
                              <button
                                onClick={() => handleEditClick(orphan)}
                                className="btn btn-outline"
                                style={{ padding: "3px 6px", height: "24px", fontSize: "0.7rem" }}
                                title="Editar módulo"
                              >
                                <FiEdit2 size={10} />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(orphan._id)}
                                className="btn btn-primary"
                                style={{ padding: "3px 6px", height: "24px", fontSize: "0.7rem", background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.4)" }}
                                title="Eliminar"
                              >
                                <FiTrash2 size={10} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    });

                    return rows;
                  })()}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
