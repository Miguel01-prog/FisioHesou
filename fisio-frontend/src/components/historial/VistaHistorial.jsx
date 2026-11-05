import { IoCaretDown, IoCaretUp } from "react-icons/io5";
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";

import api from "../../api";
import LoadingSpinner from "../layout/LoadingSpinner";
import { deobfuscateId } from "../../utils/utils";
import ArchivosExpediente from "../expediente/ArchivosExpediente";
import SignaturePad from "./SignaturePad";
import { showError, showSuccess } from "../../utils/alerts";
import {
  FaClipboardList,
  FaStethoscope,
  FaSearch,
  FaNotesMedical,
  FaXRay,
  FaFileSignature,
  FaLock,
  FaUnlock,
  FaSave,
  FaTimes,
  FaQuestionCircle,
  FaBullseye,
  FaRunning,
  FaCut,
  FaHeartbeat,
  FaExclamationTriangle,
  FaHands,
  FaBolt,
  FaMapMarkerAlt,
  FaFlask,
  FaUserMd,
  FaPlus,
  FaTrash
} from "react-icons/fa";

const getEvaTextDescription = (val) => {
  const v = Number(val);
  if (v === 0) return "Nada";
  if (v === 1 || v === 2 || v === 3) return "Poco";
  if (v === 4 || v === 5) return "Moderado";
  if (v === 6 || v === 7) return "Fuerte";
  if (v === 8 || v === 9) return "Muy fuerte";
  if (v === 10) return "Insoportable";
  return "";
};

const VistaHistorial = () => {
  const { id: rawId } = useParams();
  const id = deobfuscateId(rawId);
  const navigate = useNavigate();

  const [paciente, setPaciente] = useState(null);
  const [activeTab, setActiveTab] = useState("anamnesis");
  const [loading, setLoading] = useState(true);

  // Modo edición y guardado
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const backupRef = useRef(null);

  // Estados del historial
  const [formData, setFormData] = useState({});
  const [openLesiones, setOpenLesiones] = useState(false);

  const [lesiones, setLesiones] = useState({
    caidas: { activo: false, detalle: "" },
    accidentes: { activo: false, detalle: "" },
    esguince: { activo: false, detalle: "" },
    fractura: { activo: false, detalle: "" },
    otro: { activo: false, detalle: "" }
  });

  const [obser, setObser] = useState({
    edema: { activo: false, detalle: "" },
    enrojecimiento: { activo: false, detalle: "" },
    esguince: { activo: false, detalle: "" },
    hematoma: { activo: false, detalle: "" },
    marcha: { activo: false, detalle: "" },
    otro: { activo: false, detalle: "" }
  });

  const [antecedentesNoPatologicos, setAntecedentesNoPatologicos] = useState({
    actividadFisica: "",
    alimentacion: "",
    descanso: "",
    adicciones: {
      tabaquismo: false,
      alcohol: false,
      otro: false,
      otroDetalle: ""
    },
    estres: ""
  });

  const [itemsAntFam, setItemsAntFam] = useState([]);
  const [itemsAntMed, setItemsAntMed] = useState([]);

  // Variables auxiliares para agregar nuevos antecedentes en modo edición
  const [nuevoFamId, setNuevoFamId] = useState("");
  const [nuevoFamYear, setNuevoFamYear] = useState("");
  const [nuevoMedId, setNuevoMedId] = useState("");
  const [nuevoMedYear, setNuevoMedYear] = useState("");

  // Variables auxiliares para agregar zonas de dolor
  const [nuevaZona, setNuevaZona] = useState("");
  const [nuevaZonaEva, setNuevaZonaEva] = useState("5");
  const [nuevaZonaComentario, setNuevaZonaComentario] = useState("");

  const getValorAntFam = (id) => {
    if (!id) return "";
    let idStr = "";
    let year = "";
    if (typeof id === "string") {
      if (id.includes("|")) {
        const parts = id.split("|");
        idStr = parts[0];
        year = parts[1];
      } else {
        idStr = id;
      }
    } else if (typeof id === "object") {
      idStr = id._id ? id._id.toString() : id.toString();
    }

    const found = itemsAntFam.find(item => {
      if (!item || !item._id) return false;
      return item._id.toString() === idStr;
    });

    const label = found ? found.valor : (typeof id === "object" && id.valor ? id.valor : idStr);
    return year ? `${label} (${year})` : label;
  };

  const getValorAntMed = (id) => {
    if (!id) return "";
    let idStr = "";
    let year = "";
    if (typeof id === "string") {
      if (id.includes("|")) {
        const parts = id.split("|");
        idStr = parts[0];
        year = parts[1];
      } else {
        idStr = id;
      }
    } else if (typeof id === "object") {
      idStr = id._id ? id._id.toString() : id.toString();
    }

    const found = itemsAntMed.find(item => {
      if (!item || !item._id) return false;
      return item._id.toString() === idStr;
    });

    const label = found ? found.valor : (typeof id === "object" && id.valor ? id.valor : idStr);
    return year ? `${label} (${year})` : label;
  };

  useEffect(() => {
    const fetchHistorialAndConfig = async () => {
      try {
        // Cargar configuraciones de antecedentes
        try {
          const resFam = await api.get("/configuracion/item/AntFam");
          setItemsAntFam(resFam.data.items || []);
        } catch (err) {
          console.error("Error cargando antecedentes familiares", err);
        }

        try {
          const resMed = await api.get("/configuracion/item/AntMed");
          setItemsAntMed(resMed.data.items || []);
        } catch (err) {
          console.error("Error cargando antecedentes médicos", err);
        }

        // Cargar el historial clínico
        const { data } = await api.get(`/historial-notas/${id}`);
        if (data && data.ok) {
          const hData = data.historial || {};
          setFormData(hData);

          const lData = hData.lesiones || {
            caidas: { activo: false, detalle: "" },
            accidentes: { activo: false, detalle: "" },
            esguince: { activo: false, detalle: "" },
            fractura: { activo: false, detalle: "" },
            otro: { activo: false, detalle: "" }
          };
          setLesiones(lData);

          const oData = hData.obser || {
            edema: { activo: false, detalle: "" },
            enrojecimiento: { activo: false, detalle: "" },
            esguince: { activo: false, detalle: "" },
            hematoma: { activo: false, detalle: "" },
            marcha: { activo: false, detalle: "" },
            otro: { activo: false, detalle: "" }
          };
          setObser(oData);

          const npData = hData.antecedentesNoPatologicos || {
            actividadFisica: "",
            alimentacion: "",
            descanso: "",
            adicciones: { tabaquismo: false, alcohol: false, otro: false, otroDetalle: "" },
            estres: ""
          };
          setAntecedentesNoPatologicos(npData);

          // Guardar copia de seguridad para revertir al cancelar
          backupRef.current = {
            formData: JSON.parse(JSON.stringify(hData)),
            lesiones: JSON.parse(JSON.stringify(lData)),
            obser: JSON.parse(JSON.stringify(oData)),
            antecedentesNoPatologicos: JSON.parse(JSON.stringify(npData))
          };

          // Intentar obtener el paciente desde localStorage
          const datosPaciente = JSON.parse(localStorage.getItem("dataPaciente"));
          if (datosPaciente && datosPaciente.identificadorPaciente === hData.identificadorPaciente) {
            setPaciente(datosPaciente);
          } else {
            // Intentar cargarlo desde la API si no existe localmente
            try {
              const resPac = await api.get(`/pacientes`);
              const foundPac = resPac.data.find(p => p.identificadorPaciente === hData.identificadorPaciente);
              if (foundPac) {
                setPaciente({
                  nombres: foundPac.nombres,
                  apellidos: `${foundPac.apellidoPaterno || ""} ${foundPac.apellidoMaterno || ""}`.trim(),
                  edad: foundPac.edad,
                  telefono: foundPac.telefono,
                  identificadorPaciente: foundPac.identificadorPaciente
                });
              }
            } catch (err) {
              console.error("Error al obtener paciente de la API:", err);
            }
          }
        }
      } catch (error) {
        console.error("Error al obtener historial:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistorialAndConfig();
  }, [id]);

  // Manejo de guardar cambios
  const handleGuardarCambios = async () => {
    try {
      setSaving(true);

      const historialDataLimpio = {
        ...formData,
        lesiones,
        obser,
        antecedentesNoPatologicos
      };

      const res = await api.put(`/historial-notas/${formData._id || id}`, {
        historialData: historialDataLimpio,
        notaData: formData.soapFK
      });

      if (res.data && res.data.ok) {
        showSuccess("¡Historial Actualizado!", "Los datos del historial se guardaron correctamente.");
        const updatedHistorial = res.data.historial || historialDataLimpio;
        setFormData(updatedHistorial);
        if (updatedHistorial.lesiones) setLesiones(updatedHistorial.lesiones);
        if (updatedHistorial.obser) setObser(updatedHistorial.obser);
        if (updatedHistorial.antecedentesNoPatologicos) setAntecedentesNoPatologicos(updatedHistorial.antecedentesNoPatologicos);

        backupRef.current = {
          formData: JSON.parse(JSON.stringify(updatedHistorial)),
          lesiones: JSON.parse(JSON.stringify(updatedHistorial.lesiones || lesiones)),
          obser: JSON.parse(JSON.stringify(updatedHistorial.obser || obser)),
          antecedentesNoPatologicos: JSON.parse(JSON.stringify(updatedHistorial.antecedentesNoPatologicos || antecedentesNoPatologicos))
        };

        setIsEditing(false);
      } else {
        showError("Error al guardar", res.data?.msg || "No se pudo actualizar el historial.");
      }
    } catch (error) {
      console.error("Error al actualizar historial:", error);
      showError("Error al guardar", error.response?.data?.error || error.response?.data?.msg || "Ocurrió un error al guardar los cambios.");
    } finally {
      setSaving(false);
    }
  };

  // Manejo de cancelar cambios
  const handleCancelarEdicion = () => {
    if (backupRef.current) {
      setFormData(JSON.parse(JSON.stringify(backupRef.current.formData)));
      setLesiones(JSON.parse(JSON.stringify(backupRef.current.lesiones)));
      setObser(JSON.parse(JSON.stringify(backupRef.current.obser)));
      setAntecedentesNoPatologicos(JSON.parse(JSON.stringify(backupRef.current.antecedentesNoPatologicos)));
    }
    setIsEditing(false);
  };

  // Manejadores para antecedentes familiares
  const handleAddAntFam = () => {
    if (!nuevoFamId) return;
    const tag = nuevoFamYear.trim() ? `${nuevoFamId}|${nuevoFamYear.trim()}` : nuevoFamId;
    const actuales = Array.isArray(formData.antecedentesFamiliares) ? [...formData.antecedentesFamiliares] : [];
    if (!actuales.some(item => (typeof item === 'string' ? item.split('|')[0] : item) === nuevoFamId)) {
      setFormData({ ...formData, antecedentesFamiliares: [...actuales, tag] });
    }
    setNuevoFamId("");
    setNuevoFamYear("");
  };

  const handleRemoveAntFam = (idxToRemove) => {
    const actuales = Array.isArray(formData.antecedentesFamiliares) ? [...formData.antecedentesFamiliares] : [];
    setFormData({ ...formData, antecedentesFamiliares: actuales.filter((_, i) => i !== idxToRemove) });
  };

  // Manejadores para antecedentes médicos
  const handleAddAntMed = () => {
    if (!nuevoMedId) return;
    const tag = nuevoMedYear.trim() ? `${nuevoMedId}|${nuevoMedYear.trim()}` : nuevoMedId;
    const actuales = Array.isArray(formData.antecedentesMedicos) ? [...formData.antecedentesMedicos] : [];
    if (!actuales.some(item => (typeof item === 'string' ? item.split('|')[0] : item) === nuevoMedId)) {
      setFormData({ ...formData, antecedentesMedicos: [...actuales, tag] });
    }
    setNuevoMedId("");
    setNuevoMedYear("");
  };

  const handleRemoveAntMed = (idxToRemove) => {
    const actuales = Array.isArray(formData.antecedentesMedicos) ? [...formData.antecedentesMedicos] : [];
    setFormData({ ...formData, antecedentesMedicos: actuales.filter((_, i) => i !== idxToRemove) });
  };

  // Manejadores para zonas de dolor
  const handleAddDolorZona = () => {
    if (!nuevaZona.trim()) {
      showError("Campo requerido", "Por favor ingresa la zona de dolor.");
      return;
    }
    const currentZones = Array.isArray(formData.dolorZonas) ? [...formData.dolorZonas] : [];
    const newEntry = {
      zona: nuevaZona.trim(),
      eva: Number(nuevaZonaEva) || 0,
      comentario: nuevaZonaComentario.trim()
    };
    setFormData({ ...formData, dolorZonas: [...currentZones, newEntry] });
    setNuevaZona("");
    setNuevaZonaEva("5");
    setNuevaZonaComentario("");
  };

  const handleRemoveDolorZona = (idxToRemove) => {
    const currentZones = Array.isArray(formData.dolorZonas) ? [...formData.dolorZonas] : [];
    setFormData({ ...formData, dolorZonas: currentZones.filter((_, i) => i !== idxToRemove) });
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "2rem", height: "100vh", alignItems: "center" }}>
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!formData) {
    return <p>Error al cargar el historial.</p>;
  }

  return (
    <div className="auth-wrapper-content">
      <div className="cards-column" style={{ width: "100%", maxWidth: "1000px", margin: "0 auto" }}>


        <div className="auth-card auth-card-detail historial-main-card" style={{ marginTop: "1rem" }}>

          {/* Header con Candado / Botón de Edición */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <h2 className="title_card" style={{ margin: 0 }}>Historial Clínico</h2>
              {isEditing ? (
                <span style={{
                  fontSize: "0.82rem",
                  background: "rgba(245, 158, 11, 0.12)",
                  color: "#d97706",
                  border: "1px solid rgba(245, 158, 11, 0.3)",
                  padding: "4px 14px",
                  borderRadius: "20px",
                  fontWeight: "700",
                  letterSpacing: "0.3px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 2px 8px rgba(245, 158, 11, 0.12)"
                }}>
                  <FaUnlock size={11} /> Modo Edición Activo
                </span>
              ) : (
                <span style={{
                  fontSize: "0.82rem",
                  background: "rgba(99, 102, 241, 0.08)",
                  color: "var(--primary)",
                  border: "1px solid rgba(99, 102, 241, 0.18)",
                  padding: "4px 14px",
                  borderRadius: "20px",
                  fontWeight: "600",
                  letterSpacing: "0.3px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px"
                }}>
                  <FaLock size={11} /> Solo lectura
                </span>
              )}
            </div>

            {/* Acciones de Edición */}
            <div className="historial-header-actions" style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              {!isEditing ? (
                <button
                  type="button"
                  id="btn-activar-edicion"
                  onClick={() => setIsEditing(true)}
                  style={{
                    background: "var(--primary)",
                    color: "#ffffff",
                    border: "none",
                    padding: "8px 18px",
                    borderRadius: "8px",
                    fontWeight: "700",
                    fontSize: "0.88rem",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    boxShadow: "0 4px 12px rgba(99, 102, 241, 0.25)",
                    transition: "all 0.2s ease"
                  }}
                  className="hover-grow"
                  title="Desbloquear campos para editar"
                >
                  <FaUnlock size={13} /> Desbloquear / Editar
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    id="btn-cancelar-edicion"
                    onClick={handleCancelarEdicion}
                    disabled={saving}
                    style={{
                      background: "rgba(239, 68, 68, 0.1)",
                      color: "var(--danger)",
                      border: "1px solid rgba(239, 68, 68, 0.25)",
                      padding: "8px 16px",
                      borderRadius: "8px",
                      fontWeight: "700",
                      fontSize: "0.88rem",
                      cursor: saving ? "not-allowed" : "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "all 0.2s ease"
                    }}
                  >
                    <FaTimes size={13} /> Cancelar
                  </button>

                  <button
                    type="button"
                    id="btn-guardar-edicion"
                    onClick={handleGuardarCambios}
                    disabled={saving}
                    style={{
                      background: "var(--success)",
                      color: "#ffffff",
                      border: "none",
                      padding: "8px 20px",
                      borderRadius: "8px",
                      fontWeight: "700",
                      fontSize: "0.88rem",
                      cursor: saving ? "not-allowed" : "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      boxShadow: "0 4px 14px rgba(16, 185, 129, 0.25)",
                      transition: "all 0.2s ease"
                    }}
                    className="hover-grow"
                  >
                    {saving ? (
                      <>
                        <LoadingSpinner size="small" /> Guardando...
                      </>
                    ) : (
                      <>
                        <FaSave size={13} /> Guardar Cambios
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>

          <hr style={{ marginBottom: "1.5rem" }} />

          {/* Navegación por Pestañas */}
          <div className="tabs" style={{ marginBottom: "2rem" }}>
            <button type="button" className={`tab ${activeTab === "anamnesis" ? "active" : ""}`} onClick={() => setActiveTab("anamnesis")}>
              <FaClipboardList style={{ marginRight: "6px" }} /> Anamnesis
            </button>
            <button type="button" className={`tab ${activeTab === "antecedentes" ? "active" : ""}`} onClick={() => setActiveTab("antecedentes")}>
              <FaStethoscope style={{ marginRight: "6px" }} /> Antecedentes
            </button>
            <button type="button" className={`tab ${activeTab === "evaluacion" ? "active" : ""}`} onClick={() => setActiveTab("evaluacion")}>
              <FaSearch style={{ marginRight: "6px" }} /> Evaluación Física
            </button>
            <button type="button" className={`tab ${activeTab === "soap" ? "active" : ""}`} onClick={() => setActiveTab("soap")}>
              <FaNotesMedical style={{ marginRight: "6px" }} /> Notas SOAP
            </button>
            <button type="button" className={`tab ${activeTab === "archivos" ? "active" : ""}`} onClick={() => setActiveTab("archivos")}>
              <FaXRay style={{ marginRight: "6px" }} /> Radiografías y Recetas
            </button>
            <button type="button" className={`tab ${activeTab === "consentimiento" ? "active" : ""}`} onClick={() => setActiveTab("consentimiento")}>
              <FaFileSignature style={{ marginRight: "6px" }} /> Consentimiento Informado
            </button>
          </div>

          <form className="form" onSubmit={(e) => { e.preventDefault(); if (isEditing) handleGuardarCambios(); }}>

            {/* ==================== TAB: ANAMNESIS ==================== */}
            {activeTab === "anamnesis" && (
              <div className="tab-content">
                {paciente && (
                  <div className="clinical-form-section">
                    <h3 className="clinical-section-title"><FaClipboardList style={{ marginRight: "8px" }} /> Anamnesis y Datos Generales</h3>
                    <div className="clinical-grid-3">
                      <div className="col col-span-2">
                        <label className="form-label">Nombre completo</label>
                        <input type="text" className="input" value={`${paciente.nombres || ""} ${paciente.apellidos || ""}`.replace(/\s+/g, ' ').trim()} disabled />
                      </div>
                      <div className="col">
                        <label className="form-label">Edad (Años)</label>
                        <input type="text" className="input" value={paciente.edad || ""} disabled />
                      </div>
                      <div className="col">
                        <label className="form-label">Fecha de nacimiento</label>
                        <input
                          type={isEditing ? "date" : "text"}
                          className="input"
                          value={formData.fechaNacimiento || ""}
                          onChange={(e) => setFormData({ ...formData, fechaNacimiento: e.target.value })}
                          disabled={!isEditing}
                          placeholder={isEditing ? "" : "Sin especificar"}
                        />
                      </div>
                      <div className="col">
                        <label className="form-label">Sexo</label>
                        {isEditing ? (
                          <select
                            className="input"
                            value={formData.sexo || ""}
                            onChange={(e) => setFormData({ ...formData, sexo: e.target.value })}
                          >
                            <option value="">Sin especificar</option>
                            <option value="Masculino">Masculino</option>
                            <option value="Femenino">Femenino</option>
                            <option value="Otro">Otro</option>
                          </select>
                        ) : (
                          <input type="text" className="input" value={formData.sexo || "Sin especificar"} disabled />
                        )}
                      </div>
                      <div className="col">
                        <label className="form-label">Talla (cm)</label>
                        <input
                          type="text"
                          className="input"
                          value={formData.talla || ""}
                          onChange={(e) => setFormData({ ...formData, talla: e.target.value })}
                          placeholder={isEditing ? "Ej. 170" : "Sin especificar"}
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="col">
                        <label className="form-label">Peso (kg)</label>
                        <input
                          type="text"
                          className="input"
                          value={formData.peso || ""}
                          onChange={(e) => setFormData({ ...formData, peso: e.target.value })}
                          placeholder={isEditing ? "Ej. 70" : "Sin especificar"}
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="col">
                        <label className="form-label">Teléfono</label>
                        <input type="text" className="input" value={paciente.telefono || ""} disabled />
                      </div>
                      <div className="col col-span-2">
                        <label className="form-label">Dirección particular</label>
                        <input
                          type="text"
                          className="input"
                          value={formData.direccion || ""}
                          onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                          placeholder={isEditing ? "Dirección del paciente" : "Sin especificar"}
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="col">
                        <label className="form-label">Ocupación</label>
                        <input
                          type="text"
                          className="input"
                          value={formData.ocupacion || ""}
                          onChange={(e) => setFormData({ ...formData, ocupacion: e.target.value })}
                          placeholder={isEditing ? "Ocupación" : "Sin especificar"}
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="col col-span-3">
                        <label className="form-label">Correo electrónico</label>
                        <input
                          type="email"
                          className="input"
                          value={formData.correoElectronico || ""}
                          onChange={(e) => setFormData({ ...formData, correoElectronico: e.target.value })}
                          placeholder={isEditing ? "correo@ejemplo.com" : "Sin especificar"}
                          disabled={!isEditing}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="clinical-form-section">
                  <h3 className="clinical-section-title"><FaQuestionCircle style={{ marginRight: "8px" }} /> Motivo de Consulta y Diagnóstico</h3>
                  <div className="clinical-grid-2" style={{ marginBottom: "1.5rem" }}>
                    <div className="col" style={{ margin: 0 }}>
                      <label className="form-label">Motivo de consulta</label>
                      <textarea
                        className="textarea"
                        value={formData.motivoConsulta || ""}
                        onChange={(e) => setFormData({ ...formData, motivoConsulta: e.target.value })}
                        disabled={!isEditing}
                        placeholder={isEditing ? "Describa el motivo de consulta..." : "Ninguno registrado"}
                        style={{ height: "100px" }}
                      />
                    </div>
                    <div className="col" style={{ margin: 0 }}>
                      <label className="form-label">Diagnóstico médico</label>
                      <textarea
                        className="textarea"
                        value={formData.diagnosticoMedico || ""}
                        onChange={(e) => setFormData({ ...formData, diagnosticoMedico: e.target.value })}
                        disabled={!isEditing}
                        placeholder={isEditing ? "Describa el diagnóstico médico..." : "Ninguno registrado"}
                        style={{ height: "100px" }}
                      />
                    </div>
                  </div>
                  <div className="clinical-grid-1">
                    <div className="col" style={{ margin: 0 }}>
                      <label className="form-label">Indicaciones médicas</label>
                      <textarea
                        className="textarea"
                        value={formData.indicacionesMedicas || ""}
                        onChange={(e) => setFormData({ ...formData, indicacionesMedicas: e.target.value })}
                        disabled={!isEditing}
                        placeholder={isEditing ? "Indicaciones o prescripciones médicas..." : "Ninguno registrado"}
                        style={{ height: "80px" }}
                      />
                    </div>
                  </div>
                </div>

                <div className="clinical-form-section">
                  <h3 className="clinical-section-title"><FaBullseye style={{ marginRight: "8px" }} /> Plan de Tratamiento Proyectado</h3>
                  <div className="clinical-grid-2">
                    <div className="col">
                      <label className="form-label">Duración estimada del plan</label>
                      <input
                        type="text"
                        className="input"
                        value={formData.duracionPlan || ""}
                        onChange={(e) => setFormData({ ...formData, duracionPlan: e.target.value })}
                        disabled={!isEditing}
                        placeholder={isEditing ? "Ej. 4 semanas" : "Sin especificar"}
                      />
                    </div>
                    <div className="col">
                      <label className="form-label">Frecuencia de sesiones</label>
                      <input
                        type="text"
                        className="input"
                        value={formData.frecuenciaSesiones || ""}
                        onChange={(e) => setFormData({ ...formData, frecuenciaSesiones: e.target.value })}
                        disabled={!isEditing}
                        placeholder={isEditing ? "Ej. 2 veces por semana" : "Sin especificar"}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ==================== TAB: ANTECEDENTES ==================== */}
            {activeTab === "antecedentes" && (
              <div className="tab-content">
                <div className="clinical-form-section">
                  <h3 className="clinical-section-title"><FaRunning style={{ marginRight: "8px" }} /> Actividades y Participaciones con Deficiencia</h3>
                  <div className="clinical-grid-1">
                    <div className="col">
                      <textarea
                        className="textarea"
                        value={formData.actividadesDeficiencia || ""}
                        onChange={(e) => setFormData({ ...formData, actividadesDeficiencia: e.target.value })}
                        disabled={!isEditing}
                        placeholder={isEditing ? "Actividades de la vida diaria o deportivas con deficiencia..." : "Ninguno registrado"}
                        style={{ height: "80px" }}
                      />
                    </div>
                  </div>
                </div>

                <div className="clinical-form-section">
                  <h3 className="clinical-section-title"><FaStethoscope style={{ marginRight: "8px" }} /> Antecedentes Clínicos</h3>
                  <div className="clinical-grid-2" style={{ marginBottom: "1rem" }}>

                    {/* Antecedentes Familiares */}
                    <div className="col">
                      <label className="form-label">Antecedentes familiares</label>

                      {isEditing && (
                        <div style={{ display: "flex", gap: "8px", marginBottom: "0.75rem", flexWrap: "wrap" }}>
                          <select
                            className="input"
                            style={{ flex: "2", minWidth: "160px" }}
                            value={nuevoFamId}
                            onChange={(e) => setNuevoFamId(e.target.value)}
                          >
                            <option value="">Seleccionar antecedente...</option>
                            {itemsAntFam.map(item => (
                              <option key={item._id} value={item._id}>{item.valor}</option>
                            ))}
                          </select>
                          <input
                            type="text"
                            className="input"
                            style={{ flex: "1", minWidth: "90px" }}
                            placeholder="Año (opc)"
                            value={nuevoFamYear}
                            onChange={(e) => setNuevoFamYear(e.target.value)}
                          />
                          <button
                            type="button"
                            onClick={handleAddAntFam}
                            style={{
                              background: "var(--primary)",
                              color: "#fff",
                              border: "none",
                              borderRadius: "8px",
                              padding: "0 12px",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              fontSize: "0.85rem",
                              fontWeight: "600"
                            }}
                          >
                            <FaPlus /> Añadir
                          </button>
                        </div>
                      )}

                      <div className="selected-tags-container">
                        {Array.isArray(formData.antecedentesFamiliares) && formData.antecedentesFamiliares.filter(Boolean).length > 0 ? (
                          formData.antecedentesFamiliares.filter(Boolean).map((id, index) => (
                            <span key={index} className="glass-tag" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                              {getValorAntFam(id)}
                              {isEditing && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveAntFam(index)}
                                  style={{
                                    background: "none",
                                    border: "none",
                                    color: "var(--danger)",
                                    cursor: "pointer",
                                    padding: 0,
                                    marginLeft: "2px",
                                    display: "flex",
                                    alignItems: "center"
                                  }}
                                  title="Eliminar"
                                >
                                  <FaTimes size={10} />
                                </button>
                              )}
                            </span>
                          ))
                        ) : (
                          <span style={{ fontStyle: "italic", color: "var(--text-muted)", fontSize: "0.85rem" }}>Ninguno registrado</span>
                        )}
                      </div>
                    </div>

                    {/* Antecedentes Médicos */}
                    <div className="col">
                      <label className="form-label">Antecedentes médicos</label>

                      {isEditing && (
                        <div style={{ display: "flex", gap: "8px", marginBottom: "0.75rem", flexWrap: "wrap" }}>
                          <select
                            className="input"
                            style={{ flex: "2", minWidth: "160px" }}
                            value={nuevoMedId}
                            onChange={(e) => setNuevoMedId(e.target.value)}
                          >
                            <option value="">Seleccionar antecedente...</option>
                            {itemsAntMed.map(item => (
                              <option key={item._id} value={item._id}>{item.valor}</option>
                            ))}
                          </select>
                          <input
                            type="text"
                            className="input"
                            style={{ flex: "1", minWidth: "90px" }}
                            placeholder="Año (opc)"
                            value={nuevoMedYear}
                            onChange={(e) => setNuevoMedYear(e.target.value)}
                          />
                          <button
                            type="button"
                            onClick={handleAddAntMed}
                            style={{
                              background: "var(--primary)",
                              color: "#fff",
                              border: "none",
                              borderRadius: "8px",
                              padding: "0 12px",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              fontSize: "0.85rem",
                              fontWeight: "600"
                            }}
                          >
                            <FaPlus /> Añadir
                          </button>
                        </div>
                      )}

                      <div className="selected-tags-container">
                        {Array.isArray(formData.antecedentesMedicos) && formData.antecedentesMedicos.filter(Boolean).length > 0 ? (
                          formData.antecedentesMedicos.filter(Boolean).map((id, index) => (
                            <span key={index} className="glass-tag" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                              {getValorAntMed(id)}
                              {isEditing && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveAntMed(index)}
                                  style={{
                                    background: "none",
                                    border: "none",
                                    color: "var(--danger)",
                                    cursor: "pointer",
                                    padding: 0,
                                    marginLeft: "2px",
                                    display: "flex",
                                    alignItems: "center"
                                  }}
                                  title="Eliminar"
                                >
                                  <FaTimes size={10} />
                                </button>
                              )}
                            </span>
                          ))
                        ) : (
                          <span style={{ fontStyle: "italic", color: "var(--text-muted)", fontSize: "0.85rem" }}>Ninguno registrado</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="clinical-grid-2">
                    <div className="col" style={{ margin: 0 }}>
                      <label className="form-label">Medicación actual</label>
                      <textarea
                        className="textarea"
                        value={formData.medicacionActual || formData.medActual || ""}
                        onChange={(e) => setFormData({ ...formData, medicacionActual: e.target.value })}
                        disabled={!isEditing}
                        placeholder={isEditing ? "Medicamentos o tratamientos en curso..." : "Ninguno registrado"}
                        style={{ height: "100px" }}
                      />
                    </div>
                    <div className="col" style={{ margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
                      <div>
                        <label className="form-label"><FaCut style={{ marginRight: "6px" }} /> Antecedentes quirúrgicos</label>
                        <textarea
                          className="textarea"
                          value={Array.isArray(formData.antecedentesQuirurgicos) ? formData.antecedentesQuirurgicos.filter(Boolean).join(", ") : (formData.antecedentesQuirurgicos || "")}
                          onChange={(e) => setFormData({ ...formData, antecedentesQuirurgicos: e.target.value })}
                          disabled={!isEditing}
                          placeholder={isEditing ? "Cirugías previas..." : "Ninguno registrado"}
                          style={{ height: "60px" }}
                        />
                      </div>
                      <div>
                        <label className="form-label">Fecha / Año quirúrgico</label>
                        <input
                          type="text"
                          className="input"
                          value={formData.anioQuirurgico || ""}
                          onChange={(e) => setFormData({ ...formData, anioQuirurgico: e.target.value })}
                          disabled={!isEditing}
                          placeholder={isEditing ? "Ej. 2021" : "Sin fecha registrada"}
                          style={{ padding: "0.45rem 0.75rem", fontSize: "0.85rem" }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="clinical-form-section">
                  <h3 className="clinical-section-title"><FaHeartbeat style={{ marginRight: "8px" }} /> Estilo de Vida y Hábitos</h3>
                  <div className="clinical-grid-3" style={{ marginBottom: "1rem" }}>
                    <div className="col">
                      <label className="form-label">Actividad física</label>
                      {isEditing ? (
                        <select
                          className="input"
                          value={antecedentesNoPatologicos.actividadFisica || ""}
                          onChange={(e) => setAntecedentesNoPatologicos({ ...antecedentesNoPatologicos, actividadFisica: e.target.value })}
                        >
                          <option value="">Sin especificar</option>
                          <option value="ligera">Ligera</option>
                          <option value="moderada">Moderada</option>
                          <option value="fuerte">Fuerte</option>
                        </select>
                      ) : (
                        <input
                          type="text"
                          className="input"
                          value={
                            { ligera: "Ligera", moderada: "Moderada", fuerte: "Fuerte" }[antecedentesNoPatologicos.actividadFisica] ||
                            antecedentesNoPatologicos.actividadFisica || "Sin especificar"
                          }
                          disabled
                        />
                      )}
                    </div>
                    <div className="col">
                      <label className="form-label">Alimentación</label>
                      {isEditing ? (
                        <select
                          className="input"
                          value={antecedentesNoPatologicos.alimentacion || ""}
                          onChange={(e) => setAntecedentesNoPatologicos({ ...antecedentesNoPatologicos, alimentacion: e.target.value })}
                        >
                          <option value="">Sin especificar</option>
                          <option value="buena">Buena</option>
                          <option value="regular">Regular</option>
                          <option value="mala">Mala</option>
                        </select>
                      ) : (
                        <input
                          type="text"
                          className="input"
                          value={
                            { buena: "Buena", regular: "Regular", mala: "Mala" }[antecedentesNoPatologicos.alimentacion] ||
                            antecedentesNoPatologicos.alimentacion || "Sin especificar"
                          }
                          disabled
                        />
                      )}
                    </div>
                    <div className="col">
                      <label className="form-label">Descanso</label>
                      {isEditing ? (
                        <select
                          className="input"
                          value={antecedentesNoPatologicos.descanso || ""}
                          onChange={(e) => setAntecedentesNoPatologicos({ ...antecedentesNoPatologicos, descanso: e.target.value })}
                        >
                          <option value="">Sin especificar</option>
                          <option value="bueno">Bueno</option>
                          <option value="regular">Regular</option>
                          <option value="malo">Malo</option>
                        </select>
                      ) : (
                        <input
                          type="text"
                          className="input"
                          value={
                            { bueno: "Bueno", regular: "Regular", malo: "Malo" }[antecedentesNoPatologicos.descanso] ||
                            antecedentesNoPatologicos.descanso || "Sin especificar"
                          }
                          disabled
                        />
                      )}
                    </div>
                    <div className="col">
                      <label className="form-label">Nivel de estrés</label>
                      {isEditing ? (
                        <select
                          className="input"
                          value={antecedentesNoPatologicos.estres || ""}
                          onChange={(e) => setAntecedentesNoPatologicos({ ...antecedentesNoPatologicos, estres: e.target.value })}
                        >
                          <option value="">Sin especificar</option>
                          <option value="nada">Nada</option>
                          <option value="ligero">Ligero</option>
                          <option value="moderado">Moderado</option>
                          <option value="fuerte">Fuerte</option>
                        </select>
                      ) : (
                        <input
                          type="text"
                          className="input"
                          value={
                            { ligero: "Ligero", moderado: "Moderado", fuerte: "Fuerte", nada: "Nada" }[antecedentesNoPatologicos.estres] ||
                            antecedentesNoPatologicos.estres || "Sin especificar"
                          }
                          disabled
                        />
                      )}
                    </div>

                    <div className="col col-span-2">
                      <label className="form-label">Adicciones y sustancias</label>
                      <div style={{ display: "flex", gap: "1.5rem", marginTop: "0.6rem", flexWrap: "wrap", alignItems: "center" }}>
                        <label className="checkbox-label-modern" style={{ cursor: isEditing ? "pointer" : "default" }}>
                          <input
                            type="checkbox"
                            checked={antecedentesNoPatologicos.adicciones?.tabaquismo || false}
                            onChange={(e) => isEditing && setAntecedentesNoPatologicos({
                              ...antecedentesNoPatologicos,
                              adicciones: { ...antecedentesNoPatologicos.adicciones, tabaquismo: e.target.checked }
                            })}
                            disabled={!isEditing}
                          />
                          <span>Tabaquismo</span>
                        </label>
                        <label className="checkbox-label-modern" style={{ cursor: isEditing ? "pointer" : "default" }}>
                          <input
                            type="checkbox"
                            checked={antecedentesNoPatologicos.adicciones?.alcohol || false}
                            onChange={(e) => isEditing && setAntecedentesNoPatologicos({
                              ...antecedentesNoPatologicos,
                              adicciones: { ...antecedentesNoPatologicos.adicciones, alcohol: e.target.checked }
                            })}
                            disabled={!isEditing}
                          />
                          <span>Consumo de Alcohol</span>
                        </label>
                        <label className="checkbox-label-modern" style={{ cursor: isEditing ? "pointer" : "default" }}>
                          <input
                            type="checkbox"
                            checked={antecedentesNoPatologicos.adicciones?.otro || false}
                            onChange={(e) => isEditing && setAntecedentesNoPatologicos({
                              ...antecedentesNoPatologicos,
                              adicciones: { ...antecedentesNoPatologicos.adicciones, otro: e.target.checked }
                            })}
                            disabled={!isEditing}
                          />
                          <span>Otro</span>
                        </label>
                        {antecedentesNoPatologicos.adicciones?.otro && (
                          <input
                            type="text"
                            className="input"
                            style={{ flex: "1", minWidth: "140px", fontSize: "0.85rem", padding: "0.35rem 0.65rem" }}
                            placeholder="Especifique sustancia..."
                            value={antecedentesNoPatologicos.adicciones?.otroDetalle || ""}
                            onChange={(e) => isEditing && setAntecedentesNoPatologicos({
                              ...antecedentesNoPatologicos,
                              adicciones: { ...antecedentesNoPatologicos.adicciones, otroDetalle: e.target.value }
                            })}
                            disabled={!isEditing}
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="modern-accordion">
                    <button type="button" className={`modern-accordion-header ${openLesiones ? "open" : ""}`} onClick={() => setOpenLesiones(!openLesiones)}>
                      <span className="form-label" style={{ fontWeight: "700", color: "var(--primary)", display: "flex", alignItems: "center", gap: "6px" }}>
                        <FaExclamationTriangle /> Antecedentes de lesiones músculo-esqueléticas
                      </span>
                      <span className="accordion-icon" style={{ fontSize: "1.2rem" }}>{openLesiones ? <IoCaretUp /> : <IoCaretDown />}</span>
                    </button>

                    {openLesiones && (
                      <div className="modern-accordion-body" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        {[
                          { key: "caidas", label: "Caídas graves" },
                          { key: "accidentes", label: "Accidentes automovilísticos" },
                          { key: "esguince", label: "Esguinces anteriores" },
                          { key: "fractura", label: "Fracturas previas" },
                          { key: "otro", label: "Otras lesiones" }
                        ].map(({ key, label }) => (
                          <div key={key} className="lesion-row-grid">
                            <label className="checkbox-label-modern" style={{ cursor: isEditing ? "pointer" : "default" }}>
                              <input
                                type="checkbox"
                                checked={lesiones[key]?.activo || false}
                                onChange={(e) => isEditing && setLesiones({
                                  ...lesiones,
                                  [key]: { ...lesiones[key], activo: e.target.checked }
                                })}
                                disabled={!isEditing}
                              />
                              <span>{label}</span>
                            </label>

                            {lesiones[key]?.activo && (
                              <input
                                type="text"
                                className="input"
                                value={lesiones[key]?.detalle || ""}
                                onChange={(e) => isEditing && setLesiones({
                                  ...lesiones,
                                  [key]: { ...lesiones[key], detalle: e.target.value }
                                })}
                                placeholder={isEditing ? "Detalles de la lesión..." : ""}
                                disabled={!isEditing}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ==================== TAB: EVALUACIÓN FÍSICA ==================== */}
            {activeTab === "evaluacion" && (
              <div className="tab-content">
                <div className="clinical-form-section">
                  <h3 className="clinical-section-title"><FaSearch style={{ marginRight: "8px" }} /> Observación Física Inicial</h3>
                  <div className="clinical-grid-2" style={{ gap: "0.75rem" }}>
                    {[
                      { key: "edema", label: "Presencia de Edema" },
                      { key: "enrojecimiento", label: "Zonas de Enrojecimiento / Eritema" },
                      { key: "esguince", label: "Secuelas de Esguince" },
                      { key: "hematoma", label: "Presencia de Hematomas" },
                      { key: "marcha", label: "Alteraciones en la Marcha" },
                      { key: "otro", label: "Otro hallazgo visual" }
                    ].map(({ key, label }) => (
                      <div
                        key={key}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.25rem",
                          padding: "0.5rem 0.75rem",
                          borderRadius: "8px",
                          background: obser[key]?.activo ? "rgba(139, 92, 246, 0.04)" : "rgba(255, 255, 255, 0.01)",
                          border: "1px solid " + (obser[key]?.activo ? "rgba(139, 92, 246, 0.15)" : "rgba(255, 255, 255, 0.03)"),
                          transition: "all 0.2s"
                        }}
                      >
                        <label className="checkbox-label-modern" style={{ cursor: isEditing ? "pointer" : "default", margin: 0, fontSize: "0.85rem" }}>
                          <input
                            type="checkbox"
                            checked={obser[key]?.activo || false}
                            onChange={(e) => isEditing && setObser({
                              ...obser,
                              [key]: { ...obser[key], activo: e.target.checked }
                            })}
                            disabled={!isEditing}
                            style={{ width: "15px", height: "15px" }}
                          />
                          <span>{label}</span>
                        </label>

                        {obser[key]?.activo && (
                          <input
                            type="text"
                            className="input"
                            value={obser[key]?.detalle || ""}
                            onChange={(e) => isEditing && setObser({
                              ...obser,
                              [key]: { ...obser[key], detalle: e.target.value }
                            })}
                            placeholder={isEditing ? "Detalle o localización..." : ""}
                            disabled={!isEditing}
                            style={{ width: "100%", marginTop: "2px", fontSize: "0.8rem", padding: "0.35rem 0.55rem", height: "28px" }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="clinical-form-section">
                  <h3 className="clinical-section-title"><FaHands style={{ marginRight: "8px" }} /> Palpación Clínica</h3>
                  <div className="clinical-grid-2">
                    <div className="col">
                      <label className="form-label">Zonas de dolor a la palpación</label>
                      <textarea
                        className="textarea"
                        value={formData.dolorPalpacion || ""}
                        onChange={(e) => setFormData({ ...formData, dolorPalpacion: e.target.value })}
                        disabled={!isEditing}
                        placeholder={isEditing ? "Especifique zonas de dolor a la palpación..." : "Ninguno registrado"}
                        style={{ height: "100px" }}
                      />
                    </div>
                    <div className="col">
                      <label className="form-label">Zonas de espasmo muscular</label>
                      <textarea
                        className="textarea"
                        value={formData.espasmoPalpacion || ""}
                        onChange={(e) => setFormData({ ...formData, espasmoPalpacion: e.target.value })}
                        disabled={!isEditing}
                        placeholder={isEditing ? "Especifique zonas de espasmo o contracturas..." : "Ninguno registrado"}
                        style={{ height: "100px" }}
                      />
                    </div>
                  </div>
                </div>

                <div className="clinical-form-section">
                  <h3 className="clinical-section-title"><FaBolt style={{ marginRight: "8px" }} /> Evaluación del Dolor</h3>
                  <div className="clinical-grid-3">
                    <div className="col">
                      <label className="form-label">Escala EVA (0 - 10)</label>
                      {isEditing ? (
                        <div className="historial-header-actions" style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                          <input
                            type="range"
                            min="0"
                            max="10"
                            value={formData.eva !== undefined && formData.eva !== "" ? formData.eva : 0}
                            onChange={(e) => setFormData({ ...formData, eva: e.target.value })}
                            style={{ flex: "1", accentColor: "var(--primary)" }}
                          />
                          <span style={{ fontWeight: "800", color: "var(--primary)", minWidth: "90px", fontSize: "0.85rem" }}>
                            {formData.eva || 0} - {getEvaTextDescription(formData.eva || 0)}
                          </span>
                        </div>
                      ) : (
                        <input
                          type="text"
                          className="input"
                          value={
                            formData.eva !== undefined && formData.eva !== ""
                              ? `${formData.eva} - ${getEvaTextDescription(formData.eva)}`
                              : "Ninguno registrado"
                          }
                          disabled
                        />
                      )}
                    </div>

                    <div className="col">
                      <label className="form-label">Tipo de dolor</label>
                      {isEditing ? (
                        <select
                          className="input"
                          value={formData.tipo || ""}
                          onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                        >
                          <option value="">Sin registrar</option>
                          <option value="ardon">Ardor</option>
                          <option value="quemante">Quemante</option>
                          <option value="punzante">Punzante</option>
                          <option value="pellizco">Pellizco</option>
                          <option value="muscular">Muscular</option>
                          <option value="otra">Otra</option>
                        </select>
                      ) : (
                        <input
                          type="text"
                          className="input"
                          value={
                            { ardon: "Ardor", quemante: "Quemante", punzante: "Punzante", pellizco: "Pellizco", muscular: "Muscular", otra: "Otra" }[formData.tipo] ||
                            formData.tipo || "Ninguno registrado"
                          }
                          disabled
                        />
                      )}
                    </div>

                    <div className="col">
                      <label className="form-label">Sensación</label>
                      <input
                        type="text"
                        className="input"
                        value={formData.sensacion || ""}
                        onChange={(e) => setFormData({ ...formData, sensacion: e.target.value })}
                        disabled={!isEditing}
                        placeholder={isEditing ? "Ej. Hormigueo, Adormecimiento, Calambre..." : "Ninguno registrado"}
                      />
                    </div>
                  </div>

                  <div className="clinical-grid-2" style={{ marginTop: "1.5rem" }}>
                    <div className="col" style={{ margin: 0 }}>
                      <label className="form-label">Dolor últimas 24hrs</label>
                      <textarea
                        className="textarea"
                        value={formData.dolor24hrs || ""}
                        onChange={(e) => setFormData({ ...formData, dolor24hrs: e.target.value })}
                        disabled={!isEditing}
                        placeholder={isEditing ? "Comportamiento del dolor en las últimas 24 horas..." : "Ninguno registrado"}
                        style={{ height: "80px" }}
                      />
                    </div>
                    <div className="col" style={{ margin: 0 }}>
                      <label className="form-label">Factores que lo modifican</label>
                      <textarea
                        className="textarea"
                        value={formData.facModifica || ""}
                        onChange={(e) => setFormData({ ...formData, facModifica: e.target.value })}
                        disabled={!isEditing}
                        placeholder={isEditing ? "Qué agrava o alivia el dolor..." : "Ninguno registrado"}
                        style={{ height: "80px" }}
                      />
                    </div>
                  </div>

                  {/* Zonas de Dolor Detalladas */}
                  <div style={{ marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px dashed rgba(139, 92, 246, 0.15)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                      <h4 style={{ fontWeight: "700", fontSize: "0.95rem", color: "var(--primary)", margin: 0, display: "flex", alignItems: "center", gap: "6px" }}>
                        <FaMapMarkerAlt /> Zonas de Dolor Registradas
                      </h4>
                    </div>

                    {isEditing && (
                      <div style={{ background: "rgba(99, 102, 241, 0.03)", border: "1px dashed rgba(99, 102, 241, 0.2)", borderRadius: "10px", padding: "1rem", marginBottom: "1.25rem" }}>
                        <span style={{ fontSize: "0.82rem", fontWeight: "700", color: "var(--primary)", display: "block", marginBottom: "0.5rem" }}>
                          Añadir nueva zona de dolor:
                        </span>
                        <div className="pain-zone-add-grid">
                          <input
                            type="text"
                            className="input"
                            placeholder="Zona corporal (Ej. Lumbar)"
                            value={nuevaZona}
                            onChange={(e) => setNuevaZona(e.target.value)}
                            style={{ margin: 0 }}
                          />
                          <select
                            className="input"
                            value={nuevaZonaEva}
                            onChange={(e) => setNuevaZonaEva(e.target.value)}
                            style={{ margin: 0 }}
                          >
                            {[...Array(11).keys()].map(n => (
                              <option key={n} value={n}>EVA {n}</option>
                            ))}
                          </select>
                          <input
                            type="text"
                            className="input"
                            placeholder="Comentario o irradiación..."
                            value={nuevaZonaComentario}
                            onChange={(e) => setNuevaZonaComentario(e.target.value)}
                            style={{ margin: 0 }}
                          />
                          <button
                            type="button"
                            onClick={handleAddDolorZona}
                            style={{
                              background: "var(--primary)",
                              color: "#fff",
                              border: "none",
                              borderRadius: "8px",
                              padding: "0.6rem 1rem",
                              fontWeight: "700",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px"
                            }}
                          >
                            <FaPlus /> Añadir
                          </button>
                        </div>
                      </div>
                    )}

                    {(!formData.dolorZonas || formData.dolorZonas.length === 0) ? (
                      <span style={{ fontStyle: "italic", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                        Sin zonas de dolor específicas registradas.
                      </span>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                        {formData.dolorZonas.map((dz, idx) => {
                          const getEvaColor = (val) => {
                            if (val >= 7) return "rgba(239, 68, 68, 0.15)";
                            if (val >= 4) return "rgba(245, 158, 11, 0.15)";
                            return "rgba(16, 185, 129, 0.15)";
                          };
                          const getEvaTextColor = (val) => {
                            if (val >= 7) return "var(--danger)";
                            if (val >= 4) return "var(--warning)";
                            return "var(--success)";
                          };

                          return (
                            <div
                              key={idx}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                background: "rgba(255, 255, 255, 0.01)",
                                border: "1px solid var(--border-light)",
                                borderRadius: "8px",
                                padding: "0.6rem 1rem",
                                gap: "1rem",
                                justifyContent: "space-between"
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1, flexWrap: "wrap" }}>
                                <span style={{ fontWeight: "700", fontSize: "0.9rem", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "6px" }}>
                                  <FaMapMarkerAlt style={{ color: "var(--primary)" }} /> {dz.zona}
                                </span>
                                <span
                                  style={{
                                    background: getEvaColor(dz.eva),
                                    color: getEvaTextColor(dz.eva),
                                    fontWeight: "800",
                                    fontSize: "0.75rem",
                                    padding: "3px 8px",
                                    borderRadius: "12px",
                                    minWidth: "75px",
                                    textAlign: "center"
                                  }}
                                >
                                  EVA: {dz.eva} ({getEvaTextDescription(dz.eva)})
                                </span>
                                {dz.comentario && (
                                  <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontStyle: "italic", borderLeft: "2px solid rgba(139, 92, 246, 0.2)", paddingLeft: "10px" }}>
                                    {dz.comentario}
                                  </span>
                                )}
                              </div>

                              {isEditing && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveDolorZona(idx)}
                                  style={{
                                    background: "rgba(239, 68, 68, 0.1)",
                                    color: "var(--danger)",
                                    border: "none",
                                    borderRadius: "6px",
                                    padding: "6px 10px",
                                    cursor: "pointer",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    fontSize: "0.75rem",
                                    fontWeight: "600"
                                  }}
                                  title="Eliminar zona"
                                >
                                  <FaTrash /> Eliminar
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ==================== TAB: NOTAS SOAP ==================== */}
            {activeTab === "soap" && (
              <div className="tab-content">
                {!formData.soapFK && !isEditing ? (
                  <div className="clinical-form-section" style={{ padding: "3.5rem 2rem", textAlign: "center", background: "rgba(255, 255, 255, 0.02)", borderRadius: "16px", border: "1px dashed rgba(139, 92, 246, 0.2)" }}>
                    <div style={{ fontSize: "2.75rem", marginBottom: "0.75rem", color: "var(--text-muted)" }}><FaNotesMedical /></div>
                    <h3 style={{ color: "var(--primary)", fontSize: "1.25rem", fontWeight: "700", margin: "0 0 0.4rem 0" }}>
                      Sin primera nota SOAP
                    </h3>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", margin: 0 }}>
                      Este paciente aún no cuenta con su primera Nota SOAP registrada en el historial clínico. Desbloquee para redactarla.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="clinical-form-section">
                      <h3 className="clinical-section-title"><FaNotesMedical style={{ marginRight: "8px" }} /> Notas SOAP y Registro Diario</h3>
                      <div className="clinical-grid-3" style={{ marginBottom: "1rem" }}>
                        <div className="col">
                          <label className="form-label">ID Nota asignado</label>
                          <input type="text" className="input" value={formData.soapFK?.idHistoricoFk || formData.idHistorial || "Sin registrar"} disabled style={{ fontWeight: "600" }} />
                        </div>
                        <div className="col">
                          <label className="form-label">Mes-Año de atención</label>
                          <input
                            type="text"
                            className="input"
                            value={formData.soapFK?.mesAñoNota || ""}
                            onChange={(e) => setFormData({
                              ...formData,
                              soapFK: { ...(formData.soapFK || {}), mesAñoNota: e.target.value }
                            })}
                            disabled={!isEditing}
                            placeholder={isEditing ? "Ej. Octubre-2026" : "Sin registrar"}
                            style={{ fontWeight: "600" }}
                          />
                        </div>
                      </div>
                      <div className="clinical-grid-1">
                        <div className="col">
                          <label className="form-label">Contenido general de la sesión</label>
                          <textarea
                            className="textarea"
                            value={formData.soapFK?.contenidoNota || ""}
                            onChange={(e) => setFormData({
                              ...formData,
                              soapFK: { ...(formData.soapFK || {}), contenidoNota: e.target.value }
                            })}
                            disabled={!isEditing}
                            placeholder={isEditing ? "Descripción general de la sesión de tratamiento..." : "Sin primera nota SOAP"}
                            style={{ height: "100px" }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="clinical-form-section">
                      <h3 className="clinical-section-title"><FaFlask style={{ marginRight: "8px" }} /> Desglose de Metodología SOAP</h3>
                      <div className="soap-grid">
                        <div className="col">
                          <label className="form-label" style={{ fontWeight: "700", color: "var(--primary)" }}>Subjetivo (S)</label>
                          <textarea
                            className="textarea"
                            value={formData.soapFK?.S || ""}
                            onChange={(e) => setFormData({
                              ...formData,
                              soapFK: { ...(formData.soapFK || {}), S: e.target.value }
                            })}
                            disabled={!isEditing}
                            placeholder={isEditing ? "Lo que refiere el paciente..." : "Sin registrar"}
                            style={{ height: "120px" }}
                          />
                        </div>
                        <div className="col">
                          <label className="form-label" style={{ fontWeight: "700", color: "var(--primary)" }}>Objetivo (O)</label>
                          <textarea
                            className="textarea"
                            value={formData.soapFK?.O || ""}
                            onChange={(e) => setFormData({
                              ...formData,
                              soapFK: { ...(formData.soapFK || {}), O: e.target.value }
                            })}
                            disabled={!isEditing}
                            placeholder={isEditing ? "Hallazgos de la exploración y signos..." : "Sin registrar"}
                            style={{ height: "120px" }}
                          />
                        </div>
                        <div className="col">
                          <label className="form-label" style={{ fontWeight: "700", color: "var(--primary)" }}>Análisis (A)</label>
                          <textarea
                            className="textarea"
                            value={formData.soapFK?.A || ""}
                            onChange={(e) => setFormData({
                              ...formData,
                              soapFK: { ...(formData.soapFK || {}), A: e.target.value }
                            })}
                            disabled={!isEditing}
                            placeholder={isEditing ? "Diagnóstico y razonamiento clínico..." : "Sin registrar"}
                            style={{ height: "120px" }}
                          />
                        </div>
                        <div className="col">
                          <label className="form-label" style={{ fontWeight: "700", color: "var(--primary)" }}>Plan (P)</label>
                          <textarea
                            className="textarea"
                            value={formData.soapFK?.P || ""}
                            onChange={(e) => setFormData({
                              ...formData,
                              soapFK: { ...(formData.soapFK || {}), P: e.target.value }
                            })}
                            disabled={!isEditing}
                            placeholder={isEditing ? "Plan de intervención o tareas..." : "Sin registrar"}
                            style={{ height: "120px" }}
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ==================== TAB: CONSENTIMIENTO INFORMADO (CON FIRMAS) ==================== */}
            {activeTab === "consentimiento" && (
              <div className="tab-content">
                <div className="clinical-form-section consentimiento-card" style={{ background: "#ffffff", border: "1px solid var(--border-light)", boxShadow: "var(--shadow-md)", borderRadius: "16px", color: "#1e293b", fontFamily: "var(--font-family-display, inherit)", lineHeight: "1.6" }}>
                  <div style={{ textAlign: "center", marginBottom: "2.5rem", borderBottom: "2px double var(--primary-light)", paddingBottom: "1.5rem" }}>
                    <h2 style={{ textTransform: "uppercase", fontSize: "1.4rem", letterSpacing: "1px", fontWeight: "900", color: "var(--primary)", margin: "0 0 5px 0" }}>Consentimiento Informado</h2>
                    <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "600" }}>SERVICIO DE FISIOTERAPIA - HESOU</span>
                  </div>

                  <div style={{ marginBottom: "1.5rem" }}>
                    <h4 style={{ fontWeight: "800", color: "var(--primary)", borderBottom: "1px solid var(--border-light)", paddingBottom: "4px", marginBottom: "8px", fontSize: "1rem" }}>1. Información General</h4>
                    <p style={{ margin: 0, fontSize: "0.95rem", textAlign: "justify" }}>
                      Yo, <strong style={{ borderBottom: "1px solid #1e293b", padding: "0 5px", color: "var(--primary)" }}>{formData.nombrePacienteFirma || (paciente && (`${paciente.nombres} ${paciente.apellidos}`))}</strong> declaro que he sido debidamente informado/a sobre la naturaleza del tratamiento que recibiré en este consultorio, incluyendo los beneficios, riesgos y alternativas disponibles.
                    </p>
                  </div>

                  <div style={{ marginBottom: "1.5rem" }}>
                    <h4 style={{ fontWeight: "800", color: "var(--primary)", borderBottom: "1px solid var(--border-light)", paddingBottom: "4px", marginBottom: "8px", fontSize: "1rem" }}>2. Detalles del Tratamiento</h4>
                    <p style={{ margin: "0 0 6px 0", fontSize: "0.95rem" }}>
                      <strong>Tipo de tratamiento:</strong> Fisioterapia
                    </p>
                    <p style={{ margin: "0 0 10px 0", fontSize: "0.95rem" }}>
                      <strong>Profesional a cargo:</strong> <strong style={{ borderBottom: "1px solid #1e293b", padding: "0 5px", color: "var(--primary)" }}>{formData.nombreProfesionalFirma || "Fisioterapeuta"}</strong>
                    </p>
                    <p style={{ margin: "0 0 4px 0", fontSize: "0.95rem", fontWeight: "700" }}>
                      Descripción del procedimiento o intervención:
                    </p>
                    <p style={{ margin: 0, fontSize: "0.92rem", color: "#475569", background: "rgba(99, 102, 241, 0.03)", padding: "10px 15px", borderRadius: "8px", borderLeft: "3px solid var(--primary)", textAlign: "justify" }}>
                      Aplicación de técnicas manuales, ejercicios terapéuticos, electroterapia, termoterapia, aplicación de Kinesiotape, ultrasonido.
                    </p>
                  </div>

                  <div style={{ marginBottom: "1.5rem" }}>
                    <h4 style={{ fontWeight: "800", color: "var(--primary)", borderBottom: "1px solid var(--border-light)", paddingBottom: "4px", marginBottom: "8px", fontSize: "1rem" }}>3. Riesgos Potenciales</h4>
                    <p style={{ margin: 0, fontSize: "0.95rem", textAlign: "justify" }}>
                      Se me ha informado que, aunque el tratamiento está diseñado para mejorar mi condición, pueden existir riesgos o efectos secundarios, como:
                      <span style={{ display: "block", fontStyle: "italic", color: "#64748b", marginTop: "4px" }}>Molestias temporales, irritación en la piel, fatiga muscular, entre otros.</span>
                    </p>
                  </div>

                  <div style={{ marginBottom: "1.5rem" }}>
                    <h4 style={{ fontWeight: "800", color: "var(--primary)", borderBottom: "1px solid var(--border-light)", paddingBottom: "4px", marginBottom: "8px", fontSize: "1rem" }}>4. Derechos del Paciente</h4>
                    <p style={{ margin: "0 0 6px 0", fontSize: "0.95rem" }}>Declaro que:</p>
                    <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "0.92rem", color: "#334155" }}>
                      <li>Tengo derecho a realizar preguntas y recibir explicaciones claras sobre mi tratamiento.</li>
                      <li>Tengo derecho a detener el tratamiento en cualquier momento, informando al profesional a cargo.</li>
                      <li>Mis datos personales serán tratados de manera confidencial, conforme a la Ley General de Protección de Datos Personales.</li>
                    </ul>
                  </div>

                  <div style={{ marginBottom: "1.5rem" }}>
                    <h4 style={{ fontWeight: "800", color: "var(--primary)", borderBottom: "1px solid var(--border-light)", paddingBottom: "4px", marginBottom: "8px", fontSize: "1rem" }}>5. Consentimiento para el Tratamiento</h4>
                    <p style={{ margin: "0 0 6px 0", fontSize: "0.95rem" }}>Con pleno entendimiento de la información proporcionada:</p>
                    <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "0.92rem", color: "#334155" }}>
                      <li>Autorizo al profesional a realizar el tratamiento descrito y utilizar las técnicas y procedimientos necesarios.</li>
                      <li>Declaro que la información que he proporcionado sobre mi historia clínica es veraz y completa.</li>
                      <li>Acepto seguir las recomendaciones y pautas indicadas durante y después del tratamiento.</li>
                    </ul>
                  </div>

                  <div style={{ marginBottom: "1.5rem" }}>
                    <h4 style={{ fontWeight: "800", color: "var(--primary)", borderBottom: "1px solid var(--border-light)", paddingBottom: "4px", marginBottom: "8px", fontSize: "1rem" }}>6. Consentimiento para Uso de Información</h4>
                    <p style={{ margin: 0, fontSize: "0.95rem", textAlign: "justify" }}>
                      Autorizo el uso de mi información de forma anónima para fines educativos, estadísticos o de mejora de servicios.
                    </p>
                  </div>

                  <div style={{ marginBottom: "2.5rem" }}>
                    <h4 style={{ fontWeight: "800", color: "var(--primary)", borderBottom: "1px solid var(--border-light)", paddingBottom: "4px", marginBottom: "8px", fontSize: "1rem" }}>7. Declaración del Paciente</h4>
                    <p style={{ margin: "0 0 6px 0", fontSize: "0.95rem" }}>Declaro que:</p>
                    <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "0.92rem", color: "#334155" }}>
                      <li>He leído y comprendido el presente documento.</li>
                      <li>Todas mis preguntas han sido respondidas satisfactoriamente.</li>
                      <li>Firmo este documento de manera libre y consciente.</li>
                    </ul>
                  </div>

                  {/* Firmas Digitales con SignaturePad Interactivo */}
                  <div className="signatures-grid" style={{ borderTop: "1px dashed var(--border-light)", paddingTop: "2rem" }}>

                    {/* Firma Paciente */}
                    <SignaturePad
                      icon={<FaFileSignature />}
                      label="Firma del Paciente"
                      value={formData.firmaPaciente}
                      onChange={(val) => setFormData(prev => ({ ...prev, firmaPaciente: val }))}
                      placeholderName="Nombre del Paciente"
                      nameValue={formData.nombrePacienteFirma || (paciente ? `${paciente.nombres} ${paciente.apellidos}` : "")}
                      onNameChange={(val) => setFormData(prev => ({ ...prev, nombrePacienteFirma: val }))}
                      dateValue={formData.fechaFirmaPaciente}
                      onDateChange={(val) => setFormData(prev => ({ ...prev, fechaFirmaPaciente: val }))}
                      readOnly={!isEditing}
                    />

                    {/* Firma Profesional */}
                    <SignaturePad
                      icon={<FaUserMd />}
                      label="Firma del Profesional de la Salud"
                      value={formData.firmaProfesional}
                      onChange={(val) => setFormData(prev => ({ ...prev, firmaProfesional: val }))}
                      placeholderName="Nombre del Profesional"
                      nameValue={formData.nombreProfesionalFirma || "Fisioterapeuta"}
                      onNameChange={(val) => setFormData(prev => ({ ...prev, nombreProfesionalFirma: val }))}
                      dateValue={formData.fechaFirmaProfesional}
                      onDateChange={(val) => setFormData(prev => ({ ...prev, fechaFirmaProfesional: val }))}
                      readOnly={!isEditing}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ==================== TAB: ARCHIVOS ==================== */}
            {activeTab === "archivos" && (
              <div className="tab-content">
                <ArchivosExpediente
                  identificadorPaciente={formData.identificadorPaciente || paciente?.identificadorPaciente}
                />
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default VistaHistorial;
