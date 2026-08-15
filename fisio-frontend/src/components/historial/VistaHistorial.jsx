import { IoCaretDown, IoCaretUp } from "react-icons/io5";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import InformacionClinica from "../layout/InformacionClinica";
import api from "../../api";
import LoadingSpinner from "../layout/LoadingSpinner";

const VistaHistorial = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [paciente, setPaciente] = useState(null);
  const [activeTab, setActiveTab] = useState("datosPersonales");
  const [loading, setLoading] = useState(true);

  // Estados similares al formulario pero solo para leer
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
      alcohol: false
    },
    estres: ""
  });

  const [itemsAntFam, setItemsAntFam] = useState([]);
  const [itemsAntMed, setItemsAntMed] = useState([]);

  const getValorAntFam = (id) => {
    if (!id) return "";

    // Normalize id to string ID and parse year
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

    // Try finding the item in config list
    const found = itemsAntFam.find(item => {
      if (!item || !item._id) return false;
      return item._id.toString() === idStr;
    });

    const label = found ? found.valor : (typeof id === "object" && id.valor ? id.valor : idStr);
    return year ? `${label} (${year})` : label;
  };

  const getValorAntMed = (id) => {
    if (!id) return "";

    // Normalize id to string ID and parse year
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

    // Try finding the item in config list
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
          setFormData(data.historial);

          // Rellenar datos anidados si existen
          if (data.historial.lesiones) setLesiones(data.historial.lesiones);
          if (data.historial.obser) setObser(data.historial.obser);
          if (data.historial.antecedentesNoPatologicos) setAntecedentesNoPatologicos(data.historial.antecedentesNoPatologicos);

          // Intentar obtener el paciente desde localStorage
          const datosPaciente = JSON.parse(localStorage.getItem("dataPaciente"));
          if (datosPaciente && datosPaciente.identificadorPaciente === data.historial.identificadorPaciente) {
            setPaciente(datosPaciente);
          } else {
            // Intentar cargarlo desde la API si no existe localmente
            try {
              const resPac = await api.get(`/pacientes`);
              const foundPac = resPac.data.find(p => p.identificadorPaciente === data.historial.identificadorPaciente);
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
        {paciente && <InformacionClinica paciente={paciente} />}

        <div className="auth-card auth-card-detail" style={{ marginTop: "1rem", padding: "2.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <h2 className="title_card" style={{ margin: 0 }}>Historial Clínico</h2>
              <span style={{
                fontSize: "0.8rem",
                background: "rgba(99, 102, 241, 0.08)",
                color: "var(--primary)",
                border: "1px solid rgba(99, 102, 241, 0.15)",
                padding: "4px 12px",
                borderRadius: "20px",
                fontWeight: "600",
                letterSpacing: "0.3px",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px"
              }}>
                🔒 Solo lectura
              </span>
            </div>
          </div>
          <hr style={{ marginBottom: "1.5rem" }} />

          <div className="tabs" style={{ marginBottom: "2rem" }}>
            <button type="button" className={`tab ${activeTab === "datosPersonales" ? "active" : ""}`} onClick={() => setActiveTab("datosPersonales")}>Resumen</button>
            <button type="button" className={`tab ${activeTab === "AnaAnte" ? "active" : ""}`} onClick={() => setActiveTab("AnaAnte")}>Anamnesis y Antecedentes</button>
            <button type="button" className={`tab ${activeTab === "evaluacion" ? "active" : ""}`} onClick={() => setActiveTab("evaluacion")}>Evaluación Física</button>
            <button type="button" className={`tab ${activeTab === "soap" ? "active" : ""}`} onClick={() => setActiveTab("soap")}>Notas SOAP</button>
            <button type="button" className={`tab ${activeTab === "consentimiento" ? "active" : ""}`} onClick={() => setActiveTab("consentimiento")}>Consentimiento Informado</button>
          </div>

          <form className="form">
            {activeTab === "datosPersonales" && paciente && (
              <div className="tab-content">
                <div className="clinical-form-section">
                  <h3 className="clinical-section-title">👤 Información Básica</h3>
                  <div className="clinical-grid-3">
                    <div className="col" style={{ gridColumn: "span 2" }}>
                      <label className="form-label">Nombre completo</label>
                      <input type="text" className="input" value={`${paciente.nombres || ""} ${paciente.apellidos || ""}`.replace(/\s+/g, ' ').trim()} disabled />
                    </div>
                    <div className="col">
                      <label className="form-label">Edad (Años)</label>
                      <input type="text" className="input" value={paciente.edad} disabled />
                    </div>
                    <div className="col">
                      <label className="form-label">Fecha de nacimiento</label>
                      <input type="date" className="input" value={formData.fechaNacimiento || ""} disabled />
                    </div>
                    <div className="col">
                      <label className="form-label">Sexo</label>
                      <input type="text" className="input" value={formData.sexo || "Sin especificar"} disabled />
                    </div>
                  </div>
                </div>

                <div className="clinical-form-section">
                  <h3 className="clinical-section-title">📞 Datos de Contacto y Medidas</h3>
                  <div className="clinical-grid-3">
                    <div className="col">
                      <label className="form-label">Talla (cm)</label>
                      <input type="number" className="input" value={formData.talla || ""} disabled />
                    </div>
                    <div className="col">
                      <label className="form-label">Peso (kg)</label>
                      <input type="number" className="input" value={formData.peso || ""} disabled />
                    </div>
                    <div className="col">
                      <label className="form-label">Teléfono</label>
                      <input type="text" className="input" value={paciente.telefono} disabled />
                    </div>
                    <div className="col" style={{ gridColumn: "span 2" }}>
                      <label className="form-label">Dirección particular</label>
                      <input type="text" className="input" value={formData.direccion || ""} disabled />
                    </div>
                    <div className="col">
                      <label className="form-label">Ocupación</label>
                      <input type="text" className="input" value={formData.ocupacion || ""} disabled />
                    </div>
                    <div className="col" style={{ gridColumn: "span 3" }}>
                      <label className="form-label">Correo electrónico</label>
                      <input type="email" className="input" value={formData.correoElectronico || ""} disabled />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "AnaAnte" && (
              <div className="tab-content">
                <div className="clinical-form-section">
                  <h3 className="clinical-section-title">🏥 Anamnesis General</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
                    <div className="col" style={{ margin: 0 }}>
                      <label className="form-label">Motivo de consulta</label>
                      <textarea className="textarea" value={formData.motivoConsulta || ""} disabled style={{ height: "100px" }} />
                    </div>
                    <div className="col" style={{ margin: 0 }}>
                      <label className="form-label">Diagnóstico médico</label>
                      <textarea className="textarea" value={formData.diagnosticoMedico || ""} disabled style={{ height: "100px" }} />
                    </div>
                  </div>
                  <div className="clinical-grid-1">
                    <div className="col" style={{ margin: 0 }}>
                      <label className="form-label">Indicaciones médicas</label>
                      <textarea className="textarea" value={formData.indicacionesMedicas || ""} disabled style={{ height: "80px" }} />
                    </div>
                  </div>
                </div>

                <div className="clinical-form-section">
                  <h3 className="clinical-section-title">⚡ Valoración del Dolor y Síntomas</h3>
                  <div className="clinical-grid-3">
                    <div className="col">
                      <label className="form-label">Escala EVA</label>
                      <input
                        type="text"
                        className="input"
                        value={
                          formData.eva !== undefined && formData.eva !== ""
                            ? `${formData.eva} - ${formData.eva === 0 || formData.eva === "0" ? "Sin Dolor" : formData.eva === 10 || formData.eva === "10" ? "Dolor Insoportable" : `Nivel ${formData.eva}`}`
                            : "Sin especificar"
                        }
                        disabled
                      />
                    </div>
                    <div className="col">
                      <label className="form-label">Tipo de dolor</label>
                      <input
                        type="text"
                        className="input"
                        value={
                          {
                            ardon: "Ardor",
                            quemante: "Quemante",
                            punzante: "Punzante",
                            pellizco: "Pellizco",
                            muscular: "Muscular",
                            otra: "Otra"
                          }[formData.tipo] || formData.tipo || "Sin especificar"
                        }
                        disabled
                      />
                    </div>
                    <div className="col">
                      <label className="form-label">Sensación</label>
                      <input
                        type="text"
                        className="input"
                        value={
                          formData.sensacion
                            ? formData.sensacion
                              .split(", ")
                              .map(item => {
                                const key = item.toLowerCase();
                                return {
                                  hormigueo: "Hormigueo",
                                  adormecimiento: "Adormecimiento",
                                  calambre: "Calambre",
                                  rigidez: "Rigidez",
                                  otra: "Otra"
                                }[key] || item;
                              })
                              .join(", ")
                            : "Sin especificar"
                        }
                        disabled
                      />
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginTop: "1.5rem" }}>
                    <div className="col" style={{ margin: 0 }}>
                      <label className="form-label">Dolor últimas 24hrs</label>
                      <textarea className="textarea" value={formData.dolor24hrs || ""} disabled style={{ height: "80px" }} />
                    </div>
                    <div className="col" style={{ margin: 0 }}>
                      <label className="form-label">Factores que lo modifican</label>
                      <textarea className="textarea" value={formData.facModifica || ""} disabled style={{ height: "80px" }} />
                    </div>
                  </div>

                  {/* Listado de Zonas de Dolor Registradas */}
                  {formData.dolorZonas && formData.dolorZonas.length > 0 && (
                    <div style={{ marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px dashed rgba(139, 92, 246, 0.15)" }}>
                      <h4 style={{ fontWeight: "700", fontSize: "0.95rem", color: "var(--primary)", marginBottom: "1rem" }}>
                        📍 Zonas de Dolor Detalladas
                      </h4>
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
                                gap: "1rem"
                              }}
                            >
                              <span style={{ fontWeight: "700", fontSize: "0.9rem", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "4px" }}>
                                📍 {dz.zona}
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
                                EVA: {dz.eva}/10
                              </span>
                              {dz.comentario && (
                                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontStyle: "italic", borderLeft: "2px solid rgba(139, 92, 246, 0.2)", paddingLeft: "10px" }}>
                                  {dz.comentario}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="clinical-form-section">
                  <h3 className="clinical-section-title">🏃 Actividades y Participaciones con Deficiencia</h3>
                  <div className="clinical-grid-1">
                    <div className="col">
                      <textarea
                        className="textarea"
                        value={formData.actividadesDeficiencia || "Ninguna especificada"}
                        disabled
                        style={{ height: "80px" }}
                      />
                    </div>
                  </div>
                </div>

                <div className="clinical-form-section">
                  <h3 className="clinical-section-title">🩺 Antecedentes Clínicos</h3>
                  <div className="clinical-grid-2" style={{ marginBottom: "1rem" }}>
                    <div className="col">
                      <label className="form-label">Antecedentes familiares</label>
                      <div className="selected-tags-container">
                        {Array.isArray(formData.antecedentesFamiliares) && formData.antecedentesFamiliares.filter(Boolean).length > 0 ? (
                          formData.antecedentesFamiliares.filter(Boolean).map((id, index) => (
                            <span key={index} className="glass-tag">
                              {getValorAntFam(id)}
                            </span>
                          ))
                        ) : (
                          <span style={{ fontStyle: "italic", color: "var(--text-muted)", fontSize: "0.85rem" }}>Ninguno registrado</span>
                        )}
                      </div>
                    </div>

                    <div className="col">
                      <label className="form-label">Antecedentes médicos</label>
                      <div className="selected-tags-container">
                        {Array.isArray(formData.antecedentesMedicos) && formData.antecedentesMedicos.filter(Boolean).length > 0 ? (
                          formData.antecedentesMedicos.filter(Boolean).map((id, index) => (
                            <span key={index} className="glass-tag">
                              {getValorAntMed(id)}
                            </span>
                          ))
                        ) : (
                          <span style={{ fontStyle: "italic", color: "var(--text-muted)", fontSize: "0.85rem" }}>Ninguno registrado</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                    <div className="col" style={{ margin: 0 }}>
                      <label className="form-label">Medicación actual</label>
                      <textarea className="textarea" value={formData.medicacionActual || formData.medActual || "Ninguna"} disabled style={{ height: "100px" }} />
                    </div>
                    <div className="col" style={{ margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
                      <div>
                        <label className="form-label">Antecedentes quirúrgicos</label>
                        <textarea className="textarea" value={Array.isArray(formData.antecedentesQuirurgicos) ? formData.antecedentesQuirurgicos.join(", ") : formData.antecedentesQuirurgicos || "Ninguno"} disabled style={{ height: "60px" }} />
                      </div>
                      {formData.anioQuirurgico && (
                        <div>
                          <label className="form-label">Año quirúrgico</label>
                          <input type="text" className="input" value={formData.anioQuirurgico} disabled style={{ padding: "0.45rem 0.75rem", fontSize: "0.85rem" }} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="clinical-form-section">
                  <h3 className="clinical-section-title">🤸 Estilo de Vida y Hábitos</h3>
                  <div className="clinical-grid-3" style={{ marginBottom: "1rem" }}>
                    <div className="col">
                      <label className="form-label">Actividad física</label>
                      <input
                        type="text"
                        className="input"
                        value={
                          {
                            ligera: "Ligera",
                            moderada: "Moderada",
                            fuerte: "Fuerte"
                          }[antecedentesNoPatologicos.actividadFisica] || antecedentesNoPatologicos.actividadFisica || "Sin especificar"
                        }
                        disabled
                      />
                    </div>
                    <div className="col">
                      <label className="form-label">Alimentación</label>
                      <input
                        type="text"
                        className="input"
                        value={
                          {
                            buena: "Buena",
                            regular: "Regular",
                            mala: "Mala"
                          }[antecedentesNoPatologicos.alimentacion] || antecedentesNoPatologicos.alimentacion || "Sin especificar"
                        }
                        disabled
                      />
                    </div>
                    <div className="col">
                      <label className="form-label">Descanso</label>
                      <input
                        type="text"
                        className="input"
                        value={
                          {
                            bueno: "Bueno",
                            regular: "Regular",
                            malo: "Malo"
                          }[antecedentesNoPatologicos.descanso] || antecedentesNoPatologicos.descanso || "Sin especificar"
                        }
                        disabled
                      />
                    </div>
                    <div className="col">
                      <label className="form-label">Nivel de estrés</label>
                      <input
                        type="text"
                        className="input"
                        value={
                          {
                            ligero: "Ligero",
                            moderado: "Moderado",
                            fuerte: "Fuerte",
                            nada: "Nada"
                          }[antecedentesNoPatologicos.estres] || antecedentesNoPatologicos.estres || "Sin especificar"
                        }
                        disabled
                      />
                    </div>
                    <div className="col" style={{ gridColumn: "span 2" }}>
                      <label className="form-label">Adicciones y sustancias</label>
                      <div style={{ display: "flex", gap: "1.5rem", marginTop: "0.6rem" }}>
                        <label className="checkbox-label-modern" style={{ cursor: "default" }}>
                          <input type="checkbox" checked={antecedentesNoPatologicos.adicciones?.tabaquismo || false} disabled />
                          <span>Tabaquismo</span>
                        </label>
                        <label className="checkbox-label-modern" style={{ cursor: "default" }}>
                          <input type="checkbox" checked={antecedentesNoPatologicos.adicciones?.alcohol || false} disabled />
                          <span>Consumo de Alcohol</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="modern-accordion">
                    <button type="button" className={`modern-accordion-header ${openLesiones ? "open" : ""}`} onClick={() => setOpenLesiones(!openLesiones)}>
                      <span className="form-label" style={{ fontWeight: "700", color: "var(--primary)" }}>⚠️ Antecedentes de lesiones músculo-esqueléticas</span>
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
                          <div key={key} style={{ display: "grid", gridTemplateColumns: "1fr 2fr", alignItems: "center", gap: "1rem" }}>
                            <label className="checkbox-label-modern" style={{ cursor: "default" }}>
                              <input type="checkbox" checked={lesiones[key]?.activo || false} disabled />
                              <span>{label}</span>
                            </label>

                            {lesiones[key]?.activo && (
                              <input type="text" className="input" value={lesiones[key]?.detalle || ""} disabled />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "evaluacion" && (
              <div className="tab-content">
                <div className="clinical-form-section">
                  <h3 className="clinical-section-title">🔍 Observación Física Inicial</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
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
                        <label className="checkbox-label-modern" style={{ cursor: "default", margin: 0, fontSize: "0.85rem" }}>
                          <input type="checkbox" checked={obser[key]?.activo || false} disabled style={{ width: "15px", height: "15px" }} />
                          <span>{label}</span>
                        </label>

                        {obser[key]?.activo && (
                          <input
                            type="text"
                            className="input"
                            value={obser[key]?.detalle || ""}
                            disabled
                            style={{ width: "100%", marginTop: "2px", fontSize: "0.8rem", padding: "0.35rem 0.55rem", height: "28px" }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="clinical-form-section">
                  <h3 className="clinical-section-title">👐 Palpación Clínica</h3>
                  <div className="clinical-grid-2">
                    <div className="col">
                      <label className="form-label">Zonas de dolor a la palpación</label>
                      <textarea className="textarea" value={formData.dolorPalpacion || ""} disabled style={{ height: "100px" }} />
                    </div>
                    <div className="col">
                      <label className="form-label">Zonas de espasmo muscular</label>
                      <textarea className="textarea" value={formData.espasmoPalpacion || ""} disabled style={{ height: "100px" }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "soap" && (
              <div className="tab-content">
                <div className="clinical-form-section">
                  <h3 className="clinical-section-title">📝 Notas SOAP y Registro Diario</h3>
                  <div className="clinical-grid-3" style={{ marginBottom: "1rem" }}>
                    <div className="col">
                      <label className="form-label">ID Nota asignado</label>
                      <input type="text" className="input" value={formData.soapFK?.idHistoricoFk || formData.idHistorial || ""} disabled style={{ fontWeight: "600" }} />
                    </div>
                    <div className="col">
                      <label className="form-label">Mes-Año de atención</label>
                      <input type="text" className="input" value={formData.soapFK?.mesAñoNota || ""} disabled style={{ fontWeight: "600" }} />
                    </div>
                  </div>
                  <div className="clinical-grid-1">
                    <div className="col">
                      <label className="form-label">Contenido general de la sesión</label>
                      <textarea className="textarea" value={formData.soapFK?.contenidoNota || ""} disabled style={{ height: "100px" }} />
                    </div>
                  </div>
                </div>

                <div className="clinical-form-section">
                  <h3 className="clinical-section-title">🧪 Desglose de Metodología SOAP</h3>
                  <div className="soap-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                    <div className="col">
                      <label className="form-label" style={{ fontWeight: "700", color: "var(--primary)" }}>Subjetivo (S)</label>
                      <textarea className="textarea" value={formData.soapFK?.S || ""} disabled style={{ height: "120px" }} />
                    </div>
                    <div className="col">
                      <label className="form-label" style={{ fontWeight: "700", color: "var(--primary)" }}>Objetivo (O)</label>
                      <textarea className="textarea" value={formData.soapFK?.O || ""} disabled style={{ height: "120px" }} />
                    </div>
                    <div className="col">
                      <label className="form-label" style={{ fontWeight: "700", color: "var(--primary)" }}>Análisis (A)</label>
                      <textarea className="textarea" value={formData.soapFK?.A || ""} disabled style={{ height: "120px" }} />
                    </div>
                    <div className="col">
                      <label className="form-label" style={{ fontWeight: "700", color: "var(--primary)" }}>Plan (P)</label>
                      <textarea className="textarea" value={formData.soapFK?.P || ""} disabled style={{ height: "120px" }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "consentimiento" && (
              <div className="tab-content">
                <div className="clinical-form-section" style={{ background: "#ffffff", border: "1px solid var(--border-light)", boxShadow: "var(--shadow-md)", padding: "2.5rem", borderRadius: "16px", color: "#1e293b", fontFamily: "var(--font-family-display, inherit)", lineHeight: "1.6" }}>
                  <div style={{ textAlign: "center", marginBottom: "2.5rem", borderBottom: "2px double var(--primary-light)", paddingBottom: "1.5rem" }}>
                    <h2 style={{ textTransform: "uppercase", fontSize: "1.4rem", letterSpacing: "1px", fontWeight: "900", color: "var(--primary)", margin: "0 0 5px 0" }}>Consentimiento Informado</h2>
                    <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "600" }}>SERVICIO DE FISIOTERAPIA - FISIOHESOU</span>
                  </div>

                  <div style={{ marginBottom: "1.5rem" }}>
                    <h4 style={{ fontWeight: "800", color: "var(--primary)", borderBottom: "1px solid var(--border-light)", paddingBottom: "4px", marginBottom: "8px", fontSize: "1rem" }}>1. Información General</h4>
                    <p style={{ margin: 0, fontSize: "0.95rem", textAlign: "justify" }}>
                      Yo, <strong style={{ borderBottom: "1px solid #1e293b", padding: "0 5px", color: "var(--primary)" }}>{formData.nombrePacienteFirma || (paciente && (paciente.nombres + " " + paciente.apellidos))}</strong> declaro que he sido debidamente informado/a sobre la naturaleza del tratamiento que recibiré en este consultorio, incluyendo los beneficios, riesgos y alternativas disponibles.
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

                  <div className="clinical-grid-2" style={{ borderTop: "1px dashed var(--border-light)", paddingTop: "2rem" }}>
                    <div style={{ border: "1px solid rgba(139, 92, 246, 0.15)", borderRadius: "12px", padding: "1.25rem", background: "var(--card-bg)" }}>
                      <label className="form-label" style={{ fontWeight: "700", color: "var(--primary)", marginBottom: "0.5rem", display: "block" }}>✍️ Firma del Paciente</label>
                      <div style={{ background: "#ffffff", border: "1px solid var(--border-light)", borderRadius: "8px", height: "160px", display: "flex", justifyContent: "center", alignItems: "center", overflow: "hidden", marginBottom: "1rem" }}>
                        {formData.firmaPaciente ? (
                          <img src={formData.firmaPaciente} alt="Firma del Paciente" style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
                        ) : (
                          <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Sin firma registrada</span>
                        )}
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px" }}>
                        <div>
                          <label className="form-label" style={{ fontSize: "0.8rem" }}>Nombre</label>
                          <input type="text" className="input" value={formData.nombrePacienteFirma || ""} disabled />
                        </div>
                        <div>
                          <label className="form-label" style={{ fontSize: "0.8rem" }}>Fecha</label>
                          <input type="text" className="input" value={formData.fechaFirmaPaciente || ""} disabled />
                        </div>
                      </div>
                    </div>

                    <div style={{ border: "1px solid rgba(139, 92, 246, 0.15)", borderRadius: "12px", padding: "1.25rem", background: "var(--card-bg)" }}>
                      <label className="form-label" style={{ fontWeight: "700", color: "var(--primary)", marginBottom: "0.5rem", display: "block" }}>🩺 Firma del Profesional de la Salud</label>
                      <div style={{ background: "#ffffff", border: "1px solid var(--border-light)", borderRadius: "8px", height: "160px", display: "flex", justifyContent: "center", alignItems: "center", overflow: "hidden", marginBottom: "1rem" }}>
                        {formData.firmaProfesional ? (
                          <img src={formData.firmaProfesional} alt="Firma del Profesional" style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
                        ) : (
                          <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Sin firma registrada</span>
                        )}
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px" }}>
                        <div>
                          <label className="form-label" style={{ fontSize: "0.8rem" }}>Nombre</label>
                          <input type="text" className="input" value={formData.nombreProfesionalFirma || ""} disabled />
                        </div>
                        <div>
                          <label className="form-label" style={{ fontSize: "0.8rem" }}>Fecha</label>
                          <input type="text" className="input" value={formData.fechaFirmaProfesional || ""} disabled />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default VistaHistorial;
