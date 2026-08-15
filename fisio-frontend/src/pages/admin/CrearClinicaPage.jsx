import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api.js";
import LoadingSpinner from "../../components/layout/LoadingSpinner.jsx";
import { showError, showSuccess } from "../../utils/alerts.js";
import { FiInfo, FiTag, FiCpu, FiPlus, FiGrid, FiTrash2, FiArrowLeft } from "react-icons/fi";

export default function CrearClinicaPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Tab control state
  const [activeTab, setActiveTab] = useState("general");

  // Form fields
  const [nombre, setNombre] = useState("");
  const [subdominio, setSubdominio] = useState("");
  const [logo, setLogo] = useState("");
  const [activo, setActivo] = useState(true);
  const [blockSundays, setBlockSundays] = useState(false);

  // Custom Labels
  const [patientLabelSingular, setPatientLabelSingular] = useState("Paciente");
  const [patientLabelPlural, setPatientLabelPlural] = useState("Pacientes");
  const [specialistLabelSingular, setSpecialistLabelSingular] = useState("Especialista");
  const [specialistLabelPlural, setSpecialistLabelPlural] = useState("Especialistas");

  // Dynamic Services
  const [services, setServices] = useState([
    { name: "Fisioterapia", key: "fisioterapia", description: "Rehabilitación y terapia física", icon: "🦽" }
  ]);

  // Sidebar Feature Flags / Modules
  const [modules, setModules] = useState(["agenda", "pacientes", "bloquear"]);

  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [availableModules, setAvailableModules] = useState([]);

  const fetchAvailableModules = async () => {
    try {
      const res = await api.get("/modules");
      setAvailableModules((res.data.modules || []).filter(m => m.active));
    } catch (err) {
      console.error("Error al cargar módulos:", err);
    }
  };

  useEffect(() => {
    fetchAvailableModules();
  }, []);

  useEffect(() => {
    if (id) {
      const loadClient = async () => {
        setCargando(true);
        try {
          const res = await api.get("/clients");
          const match = (res.data.clients || []).find(c => c._id === id);
          if (match) {
            setNombre(match.name);
            setSubdominio(match.subdomain);
            setLogo(match.logo || "");
            setPatientLabelSingular(match.patientLabelSingular || "Paciente");
            setPatientLabelPlural(match.patientLabelPlural || "Pacientes");
            setSpecialistLabelSingular(match.specialistLabelSingular || "Especialista");
            setSpecialistLabelPlural(match.specialistLabelPlural || "Especialistas");
            setServices(match.services && match.services.length > 0 ? match.services : [{ name: "", key: "", description: "", icon: "📅" }]);
            setModules(match.modules || ["agenda", "pacientes", "bloquear"]);
            setActivo(match.active !== undefined ? match.active : true);
            setBlockSundays(match.blockSundays || false);
          } else {
            showError("No encontrado", "No se encontró el negocio solicitado");
            navigate("/admin/clinicas");
          }
        } catch (err) {
          console.error(err);
          showError("Error", "No se pudo cargar la información del negocio");
        } finally {
          setCargando(false);
        }
      };
      loadClient();
    }
  }, [id, navigate]);

  const handleAddService = () => {
    setServices([
      ...services,
      { name: "", key: "", description: "", icon: "📅" }
    ]);
  };

  const handleRemoveService = (index) => {
    setServices(services.filter((_, i) => i !== index));
  };

  const handleServiceChange = (index, field, value) => {
    const updated = [...services];
    updated[index][field] = value;

    // Auto-generate key from name if modifying name
    if (field === "name") {
      updated[index]["key"] = value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9_]/g, "_");
    }

    setServices(updated);
  };

  const handleModuleCheckboxChange = (moduleKey, checked) => {
    if (checked) {
      setModules([...modules, moduleKey]);
    } else {
      // Uncheck parent and all associated child modules for consistency
      const childrenKeys = availableModules.filter(m => m.parentKey === moduleKey).map(m => m.key);
      setModules(modules.filter(m => m !== moduleKey && !childrenKeys.includes(m)));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre.trim() || !subdominio.trim()) {
      return showError("Campos vacíos", "Por favor ingresa todos los campos obligatorios");
    }

    const cleanSubdomain = subdominio.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");

    // Validate services
    const validServices = services.filter(s => s.name.trim() !== "" && s.key.trim() !== "");
    if (validServices.length === 0) {
      return showError("Servicios inválidos", "Debes registrar al menos un servicio con nombre y clave válidos.");
    }

    setGuardando(true);
    try {
      const payload = {
        name: nombre.trim(),
        subdomain: cleanSubdomain,
        patientLabelSingular: patientLabelSingular.trim() || "Paciente",
        patientLabelPlural: patientLabelPlural.trim() || "Pacientes",
        specialistLabelSingular: specialistLabelSingular.trim() || "Especialista",
        specialistLabelPlural: specialistLabelPlural.trim() || "Especialistas",
        services: validServices,
        modules,
        active: activo,
        logo,
        blockSundays
      };

      if (id) {
        await api.put(`/clients/${id}`, payload);
        showSuccess("Éxito", "Clínica actualizada correctamente");
      } else {
        await api.post("/clients", payload);
        showSuccess("Éxito", "Clínica creada correctamente");
      }

      navigate("/admin/clinicas");
    } catch (err) {
      console.error(err);
      showError("Error", err.response?.data?.message || "Ocurrió un error al procesar el negocio");
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="crear-clinica-container" style={{ padding: "1.5rem", maxWidth: "900px", margin: "0 auto" }}>
      <header style={{ marginBottom: "2rem" }}>
        <h1 style={{ color: "var(--primary)", fontSize: "1.8rem", fontWeight: "700" }}>
          {id ? "⚙️ Editar negocio" : "🚀 Registrar nuevo negocio"}
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
          Configura a tu gusto las opciones, terminología, servicios y accesos del sidebar.
        </p>
      </header>

      {/* Formulario Modular con Pestañas */}
      <section className="auth-card card" style={{ padding: "2rem", width: "100%" }}>

        {/* Tab Header Selector */}
        <div style={{ display: "flex", gap: "0.5rem", borderBottom: "1px solid rgba(255,255,255,0.08)", marginBottom: "1.5rem", overflowX: "auto", pb: "5px" }}>
          <button
            type="button"
            onClick={() => setActiveTab("general")}
            style={{
              padding: "0.75rem 1.25rem",
              background: activeTab === "general" ? "rgba(94, 80, 161, 0.15)" : "transparent",
              color: activeTab === "general" ? "var(--primary)" : "var(--text-muted)",
              border: "none",
              borderBottom: activeTab === "general" ? "2px solid var(--primary)" : "2px solid transparent",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "0.9rem",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              borderRadius: "6px 6px 0 0",
              transition: "all 0.2s ease"
            }}
          >
            <FiInfo /> General
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("etiquetas")}
            style={{
              padding: "0.75rem 1.25rem",
              background: activeTab === "etiquetas" ? "rgba(94, 80, 161, 0.15)" : "transparent",
              color: activeTab === "etiquetas" ? "var(--primary)" : "var(--text-muted)",
              border: "none",
              borderBottom: activeTab === "etiquetas" ? "2px solid var(--primary)" : "2px solid transparent",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "0.9rem",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              borderRadius: "6px 6px 0 0",
              transition: "all 0.2s ease"
            }}
          >
            <FiTag /> Etiquetas
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("modulos")}
            style={{
              padding: "0.75rem 1.25rem",
              background: activeTab === "modulos" ? "rgba(94, 80, 161, 0.15)" : "transparent",
              color: activeTab === "modulos" ? "var(--primary)" : "var(--text-muted)",
              border: "none",
              borderBottom: activeTab === "modulos" ? "2px solid var(--primary)" : "2px solid transparent",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "0.9rem",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              borderRadius: "6px 6px 0 0",
              transition: "all 0.2s ease"
            }}
          >
            <FiCpu /> Módulos
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("servicios")}
            style={{
              padding: "0.75rem 1.25rem",
              background: activeTab === "servicios" ? "rgba(94, 80, 161, 0.15)" : "transparent",
              color: activeTab === "servicios" ? "var(--primary)" : "var(--text-muted)",
              border: "none",
              borderBottom: activeTab === "servicios" ? "2px solid var(--primary)" : "2px solid transparent",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "0.9rem",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              borderRadius: "6px 6px 0 0",
              transition: "all 0.2s ease"
            }}
          >
            <FiGrid /> Servicios
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

          {/* Tab 1: General Info */}
          {activeTab === "general" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
                <div>
                  <label htmlFor="client-name" className="form-label" style={{ display: "block", marginBottom: "0.5rem" }}>Nombre del Negocio / Clínica *</label>
                  <input
                    id="client-name"
                    type="text"
                    className="input"
                    placeholder="Ej. Barbería Classic"
                    value={nombre}
                    onChange={e => setNombre(e.target.value)}
                    required
                    disabled={guardando}
                  />
                </div>
                <div>
                  <label htmlFor="client-subdomain" className="form-label" style={{ display: "block", marginBottom: "0.5rem" }}>Subdominio / Slug URL *</label>
                  <input
                    id="client-subdomain"
                    type="text"
                    className="input"
                    placeholder="Ej. barber-classic"
                    value={subdominio}
                    onChange={e => setSubdominio(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    required
                    disabled={guardando}
                  />
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block", marginTop: "4px" }}>
                    URL pública: <code>/citas/{subdominio || "subdominio"}</code>
                  </span>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem", alignItems: "center" }}>
                <div>
                  <label htmlFor="client-logo" className="form-label" style={{ display: "block", marginBottom: "0.5rem" }}>URL del Logo (Opcional)</label>
                  <input
                    id="client-logo"
                    type="text"
                    className="input"
                    placeholder="Ej. https://url-de-tu-logo.png"
                    value={logo}
                    onChange={e => setLogo(e.target.value)}
                    disabled={guardando}
                  />
                </div>
                {id && (
                  <div style={{ marginTop: "1rem" }}>
                    <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={activo}
                        onChange={e => setActivo(e.target.checked)}
                        disabled={guardando}
                        style={{ width: "18px", height: "18px" }}
                      />
                      Giro Activo / Operando en la Nube
                    </label>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Custom Terminology */}
          {activeTab === "etiquetas" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "0 0 0.5rem 0" }}>
                Modifica las etiquetas para que toda la interfaz se adapte al giro del cliente (ej. Clínicas, Barberías, etc.).
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.5rem" }}>
                <div>
                  <label htmlFor="patient-singular" className="form-label">Pacientes / Clientes (Singular)</label>
                  <input
                    id="patient-singular"
                    type="text"
                    className="input"
                    value={patientLabelSingular}
                    onChange={e => setPatientLabelSingular(e.target.value)}
                    placeholder="Ej. Cliente"
                    disabled={guardando}
                  />
                </div>
                <div>
                  <label htmlFor="patient-plural" className="form-label">Pacientes / Clientes (Plural)</label>
                  <input
                    id="patient-plural"
                    type="text"
                    className="input"
                    value={patientLabelPlural}
                    onChange={e => setPatientLabelPlural(e.target.value)}
                    placeholder="Ej. Clientes"
                    disabled={guardando}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.5rem" }}>
                <div>
                  <label htmlFor="specialist-singular" className="form-label">Especialistas (Singular)</label>
                  <input
                    id="specialist-singular"
                    type="text"
                    className="input"
                    value={specialistLabelSingular}
                    onChange={e => setSpecialistLabelSingular(e.target.value)}
                    placeholder="Ej. Barbero"
                    disabled={guardando}
                  />
                </div>
                <div>
                  <label htmlFor="specialist-plural" className="form-label">Especialistas (Plural)</label>
                  <input
                    id="specialist-plural"
                    type="text"
                    className="input"
                    value={specialistLabelPlural}
                    onChange={e => setSpecialistLabelPlural(e.target.value)}
                    placeholder="Ej. Barberos"
                    disabled={guardando}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Sidebar Feature Toggles */}
          {activeTab === "modulos" && (() => {
            const parentModules = availableModules.filter(m => !m.parentKey);

            return (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "0 0 0.5rem 0" }}>
                  Selecciona qué secciones del menú lateral estarán disponibles para el personal de esta clínica.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
                  {parentModules.map((parent) => {
                    const children = availableModules.filter(m => m.parentKey === parent.key);
                    const isParentChecked = modules.includes(parent.key);

                    return (
                      <div key={parent.key} style={{
                        background: "rgba(255,255,255,0.01)",
                        border: isParentChecked ? "1px solid rgba(94, 80, 161, 0.2)" : "1px solid rgba(255,255,255,0.04)",
                        borderRadius: "12px",
                        padding: "1.25rem",
                        display: "flex",
                        flexDirection: "column",
                        gap: "1rem",
                        transition: "all 0.2s"
                      }}>
                        {/* Checkbox Padre */}
                        <label style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.8rem",
                          cursor: "pointer",
                          fontSize: "0.95rem",
                          fontWeight: "600",
                          color: isParentChecked ? "var(--text-main)" : "var(--text-muted)",
                          margin: 0
                        }}>
                          <input
                            type="checkbox"
                            checked={isParentChecked}
                            onChange={e => handleModuleCheckboxChange(parent.key, e.target.checked)}
                            disabled={guardando}
                            style={{ width: "20px", height: "20px", cursor: "pointer" }}
                          />
                          {parent.key === "pacientes" ? `Directorio de ${patientLabelPlural}` : parent.label}
                        </label>

                        {/* Checkboxes Hijos (solo si el padre tiene hijos y está marcado) */}
                        {children.length > 0 && isParentChecked && (
                          <div style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                            gap: "1rem",
                            paddingLeft: "1.8rem",
                            borderLeft: "2px solid rgba(94, 80, 161, 0.15)",
                            marginTop: "0.25rem",
                            animation: "fadeIn 0.2s ease-out"
                          }}>
                            {children.map((child) => {
                              const isChildChecked = modules.includes(child.key);

                              return (
                                <div key={child.key} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                  <label
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "0.7rem",
                                      cursor: "pointer",
                                      padding: "0.8rem",
                                      background: "rgba(255,255,255,0.02)",
                                      border: isChildChecked ? "1px solid rgba(94, 80, 161, 0.4)" : "1px solid rgba(255,255,255,0.05)",
                                      borderRadius: "8px",
                                      fontSize: "0.85rem",
                                      color: isChildChecked ? "var(--text-main)" : "var(--text-muted)",
                                      transition: "all 0.2s",
                                      margin: 0
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChildChecked}
                                      onChange={e => handleModuleCheckboxChange(child.key, e.target.checked)}
                                      disabled={guardando}
                                      style={{ width: "16px", height: "16px", cursor: "pointer" }}
                                    />
                                    {child.key === "pacientes" ? `Directorio de ${patientLabelPlural}` : child.label}
                                  </label>

                                  {child.key === "bloquear" && isChildChecked && (
                                    <div style={{
                                      paddingLeft: "0.5rem",
                                      marginTop: "0.25rem",
                                      marginBottom: "0.5rem"
                                    }}>
                                      <label style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "0.5rem",
                                        cursor: "pointer",
                                        fontSize: "0.82rem",
                                        color: "var(--text-main)",
                                        margin: 0
                                      }}>
                                        <input
                                          type="checkbox"
                                          checked={blockSundays}
                                          onChange={e => setBlockSundays(e.target.checked)}
                                          disabled={guardando}
                                          style={{ width: "15px", height: "15px", cursor: "pointer" }}
                                        />
                                        Bloquear domingos definitivamente
                                      </label>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Tab 4: Services and Emojis */}
          {activeTab === "servicios" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: 0 }}>
                  Declara el catálogo de servicios de este negocio con su respectivo emoji e identificador técnico.
                </p>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={handleAddService}
                  disabled={guardando}
                  style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "0.4rem 1rem", fontSize: "0.8rem" }}
                >
                  <FiPlus /> Añadir Servicio
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.2rem" }}>
                {services.map((service, index) => (
                  <div
                    key={index}
                    style={{
                      padding: "1.2rem",
                      borderRadius: "10px",
                      background: "rgba(255,255,255,0.015)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.75rem",
                      position: "relative"
                    }}
                  >
                    {services.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveService(index)}
                        style={{
                          position: "absolute",
                          top: "10px",
                          right: "10px",
                          background: "rgba(239, 68, 68, 0.15)",
                          color: "#ef4444",
                          border: "none",
                          width: "28px",
                          height: "28px",
                          borderRadius: "50%",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                        title="Eliminar servicio"
                        disabled={guardando}
                      >
                        <FiTrash2 size={13} />
                      </button>
                    )}

                    <div style={{ display: "grid", gridTemplateColumns: "55px 1fr", gap: "0.5rem" }}>
                      <div>
                        <label className="form-label" style={{ fontSize: "0.75rem" }}>Emoji</label>
                        <input
                          type="text"
                          className="input text-center"
                          value={service.icon}
                          onChange={e => handleServiceChange(index, "icon", e.target.value)}
                          placeholder="Icon"
                          disabled={guardando}
                          style={{ padding: "0.4rem" }}
                        />
                      </div>
                      <div>
                        <label className="form-label" style={{ fontSize: "0.75rem" }}>Nombre del Servicio *</label>
                        <input
                          type="text"
                          className="input"
                          value={service.name}
                          onChange={e => handleServiceChange(index, "name", e.target.value)}
                          placeholder="Ej. Corte de Cabello"
                          required
                          disabled={guardando}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="form-label" style={{ fontSize: "0.75rem" }}>Descripción corta</label>
                      <input
                        type="text"
                        className="input"
                        value={service.description}
                        onChange={e => handleServiceChange(index, "description", e.target.value)}
                        placeholder="Descripción visible al agendar"
                        disabled={guardando}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Form Actions Footer */}
          <div style={{ display: "flex", gap: "1rem", marginTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "1.5rem" }}>
            <button
              type="button"
              className="btn btn-outline w-100"
              onClick={() => navigate("/admin/clinicas")}
              disabled={guardando}
              style={{ height: "45px", maxWidth: "200px" }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary w-100"
              style={{ height: "45px" }}
              disabled={guardando}
            >
              {guardando ? (
                <div style={{ display: "flex", justifyContent: "center" }}><LoadingSpinner size="small" color="#fff" /></div>
              ) : id ? (
                "Guardar Cambios del Negocio"
              ) : (
                "Crear Nuevo Negocio"
              )}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
