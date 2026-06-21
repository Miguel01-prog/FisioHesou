import { IoIosAddCircle } from "react-icons/io";
import { IoCaretDown } from "react-icons/io5";
import { IoCaretUp } from "react-icons/io5";
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

  // Mock items list for dropdown consistency
  const [itemsAntFam, setItemsAntFam] = useState([]);
  const [itemsAntMed, setItemsAntMed] = useState([]);

  useEffect(() => {
    const fetchHistorial = async () => {
      try {
        const { data } = await api.get(`/historial-notas/${id}`);
        if (data && data.ok) {
          setFormData(data.historial);

          // Populate arrays or nested objects if they come from backend
          if (data.historial.lesiones) setLesiones(data.historial.lesiones);
          if (data.historial.obser) setObser(data.historial.obser);
          if (data.historial.antecedentesNoPatologicos) setAntecedentesNoPatologicos(data.historial.antecedentesNoPatologicos);

          // Intentar reconstruir información del paciente si está disponible
          const datosPaciente = JSON.parse(localStorage.getItem("dataPaciente"));
          if (datosPaciente && datosPaciente.identificadorPaciente === data.historial.identificadorPaciente) {
            setPaciente(datosPaciente);
          }
        }
      } catch (error) {
        console.error("Error al obtener historial:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistorial();
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
      <div className="cards-column">
        {paciente && <InformacionClinica paciente={paciente} />}

        <div className="auth-card auth-card-detail">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 className="title_card" style={{ marginTop: "-10px" }}>Historial Clínico </h2>
            <button className="save-btn" onClick={() => navigate(-1)} style={{ marginTop: "-20px" }}>
              ⬅ Volver
            </button>
          </div>
          <hr />

          <div className="tabs">
            <button type="button" className={`tab ${activeTab === "datosPersonales" ? "active" : ""}`} onClick={() => setActiveTab("datosPersonales")}>Resumen</button>
            <button type="button" className={`tab ${activeTab === "AnaAnte" ? "active" : ""}`} onClick={() => setActiveTab("AnaAnte")}>Anamnesis y Antecedentes</button>
            <button type="button" className={`tab ${activeTab === "evaluacion" ? "active" : ""}`} onClick={() => setActiveTab("evaluacion")}>Evaluación</button>
            <button type="button" className={`tab ${activeTab === "soap" ? "active" : ""}`} onClick={() => setActiveTab("soap")}>Notas SOAP</button>
            <button type="button" className={`tab ${activeTab === "consentimiento" ? "active" : ""}`} onClick={() => setActiveTab("consentimiento")}>Consentimiento Informado</button>
          </div>

          <form className="form">
            {activeTab === "datosPersonales" && paciente && (
              <div className="tab-content">
                <div className="form-row">
                  <div className="form-col full-width">
                    <label className="form-label">Nombre completo:</label>
                    <input type="text" className="input" value={`${paciente.nombres} ${paciente.apellidos}`} disabled />
                  </div>
                  <div className="form-col">
                    <label className="form-label">Fecha de nacimiento:</label>
                    <input type="date" className="input" value={formData.fechaNacimiento || ""} disabled />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-col small-width">
                    <label className="form-label">Sexo:</label>
                    <select className="input" value={formData.sexo || ""} disabled>
                      <option value="">Seleccione</option>
                      <option value="Hombre">Hombre</option>
                      <option value="Mujer">Mujer</option>
                    </select>
                  </div>
                  <div className="form-col small-width" style={{ flex: "1 1 80px", maxWidth: "150px" }}>
                    <label className="form-label">Edad:</label>
                    <input type="text" className="input" value={paciente.edad} disabled />
                  </div>
                  <div className="form-col small-width" style={{ flex: "1 1 80px", maxWidth: "150px" }}>
                    <label className="form-label">Talla (cm):</label>
                    <input type="number" className="input" value={formData.talla || ""} disabled />
                  </div>
                  <div className="form-col" style={{ flex: "1 1 80px", maxWidth: "125px" }}>
                    <label className="form-label">Peso (kg):</label>
                    <input type="number" className="input" value={formData.peso || ""} disabled />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-col" style={{ flex: "1 1 80px", maxWidth: "320px" }}>
                    <label className="form-label">Dirección:</label>
                    <input type="text" className="input" value={formData.direccion || ""} disabled />
                  </div>
                  <div className="form-col" style={{ flex: "1 1 80px", maxWidth: "325px" }}>
                    <label className="form-label">Ocupación:</label>
                    <input type="text" className="input" value={formData.ocupacion || ""} disabled />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-col small-width">
                    <label className="form-label">Correo electrónico:</label>
                    <input type="text" className="input" value={formData.correoElectronico || ""} disabled />
                  </div>
                  <div className="form-col small-width" style={{ flex: "1 1 80px", maxWidth: "325px" }}>
                    <label className="form-label">Teléfono:</label>
                    <input type="text" className="input" value={paciente.telefono} disabled />
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

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", borderTop: "1px dashed var(--border-light)", paddingTop: "2rem" }}>
                    <div style={{ border: "1px solid rgba(139, 92, 246, 0.15)", borderRadius: "12px", padding: "1.25rem", background: "var(--card-bg)" }}>
                      <label className="form-label" style={{ fontWeight: "700", color: "var(--primary)", marginBottom: "0.5rem", display: "block" }}>✍️ Firma del Paciente</label>
                      <div style={{ background: "#ffffff", border: "1px solid var(--border-light)", borderRadius: "8px", height: "160px", display: "flex", justifyContent: "center", alignItems: "center", overflow: "hidden", marginBottom: "1rem" }}>
                        {formData.firmaPaciente ? (
                          <img src={formData.firmaPaciente} alt="Firma del Paciente" style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
                        ) : (
                          <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Sin firma registrada</span>
                        )}
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
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
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
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

            {/*TAB 2 */}
            {activeTab === "AnaAnte" && (
              <div className="tab-content">
                <div className="form-row" style={{ flexDirection: "column", gap: "12px" }}>
                  <div className="form-col" style={{ maxWidth: "700px" }}>
                    <label className="form-label">Motivo de consulta:</label>
                    <textarea className="textarea" value={formData.motivoConsulta || ""} disabled />
                  </div>
                  <div className="form-row" style={{ flexDirection: "row", gap: "12px" }}>
                    <div className="form-col" style={{ maxWidth: "150px" }}>
                      <label className="form-label">EVA:</label>
                      <select className="input" value={formData.eva || ""} disabled>
                        <option value="">Seleccione</option>
                        {[...Array(11).keys()].map((num) => (
                          <option key={num} value={num}>{num}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-col" style={{ maxWidth: "300px" }}>
                      <label className="form-label">Dolor 24hrs:</label>
                      <textarea className="textarea" value={formData.dolor24hrs || ""} disabled />
                    </div>
                    <div className="form-col" style={{ maxWidth: "150px" }}>
                      <label className="form-label">Tipo:</label>
                      <select className="input" value={formData.tipo || ""} disabled>
                        <option value="">Seleccione</option>
                        <option value="ardon">Ardon</option>
                        <option value="quemante">Quemante</option>
                        <option value="punzante">Punzante</option>
                        <option value="pellizco">Pellizco</option>
                        <option value="muscular">Muscular</option>
                        <option value="otra">Otra</option>
                      </select>
                      {formData.tipo === "otra" && (
                        <input type="text" className="input mt-2" value={formData.tipoOtra || ""} disabled style={{ marginTop: "8px" }} />
                      )}
                    </div>
                    <div className="form-col">
                      <label className="form-label">Factores que lo modifican:</label>
                      <textarea className="textarea" style={{ maxWidth: "600px" }} value={formData.facModifica || ""} disabled />
                    </div>
                    <div className="form-col" style={{ maxWidth: "230px" }}>
                      <label className="form-label">Sensación:</label>
                      <select className="input" value={formData.sensacion || ""} disabled>
                        <option value="">Seleccione</option>
                        <option value="hormigueo">Hormigueo</option>
                        <option value="adormecimiento">Adormecimiento</option>
                        <option value="calambre">Calambre</option>
                        <option value="rigidez">Rigidez</option>
                        <option value="otra">Otra</option>
                      </select>
                      {formData.sensacion === "otra" && (
                        <input type="text" className="input mt-2" value={formData.tipoOtra || ""} disabled style={{ marginTop: "8px" }} />
                      )}
                    </div>

                    <div className="form-col" style={{ maxWidth: "280px" }}>
                      <label className="form-label">Antecedentes familiares:</label>
                      <textarea className="textarea" value={Array.isArray(formData.antecedentesFamiliares) ? formData.antecedentesFamiliares.join(", ") : formData.antecedentesFamiliares || ""} disabled />
                    </div>
                    <div className="form-col" style={{ maxWidth: "280px" }}>
                      <label className="form-label">Antecedentes médicos:</label>
                      <textarea className="textarea" value={Array.isArray(formData.antecedentesMedicos) ? formData.antecedentesMedicos.join(", ") : formData.antecedentesMedicos || ""} disabled />
                    </div>

                    <div className="form-col" style={{ maxWidth: "230px" }}>
                      <label className="form-label">Medicacion actual:</label>
                      <textarea className="textarea" style={{ maxWidth: "300px" }} value={formData.medicacionActual || formData.medActual || ""} disabled />
                    </div>
                    <div className="form-col" style={{ maxWidth: "230px" }}>
                      <label className="form-label">Antecedentes quirúrgicos:</label>
                      <textarea className="textarea" style={{ maxWidth: "400px" }} value={Array.isArray(formData.antecedentesQuirurgicos) ? formData.antecedentesQuirurgicos.join(", ") : formData.antecedentesQuirurgicos || ""} disabled />
                    </div>
                    <div className="form-col" style={{ maxWidth: "130px" }}>
                      <label className="form-label">Año:</label>
                      <input type="date" style={{ maxWidth: "200px" }} className="input" value={formData.anioQuirurgico || ""} disabled />
                    </div>
                    <div className="form-row" style={{ alignItems: "flex-end", gap: "12px" }}>
                      <div className="lesiones-block">
                        <div className="accordion">
                          <button type="button" className={`accordion-header ${openLesiones ? "open" : ""}`} onClick={() => setOpenLesiones(!openLesiones)}>
                            <span className="form-label">Antecedentes de lesiones músculo-esqueléticas</span>
                            <span className="accordion-icon">{openLesiones ? <IoCaretUp color="#808080ff" /> : <IoCaretDown color="#808080ff" />}</span>
                          </button>

                          {openLesiones && (
                            <div className="accordion-body">
                              {[
                                { key: "caidas", label: "Caídas" },
                                { key: "accidentes", label: "Accidentes automovilísticos" },
                                { key: "esguince", label: "Esguince" },
                                { key: "fractura", label: "Fractura" },
                                { key: "otro", label: "Otro" }
                              ].map(({ key, label }) => (
                                <div key={key} className="lesion-row">
                                  <label className="checkbox-label form-label">
                                    <input type="checkbox" checked={lesiones[key]?.activo || false} disabled />
                                    <span>{label}</span>
                                  </label>

                                  {lesiones[key]?.activo && (
                                    <input type="text" className="input lesion-input" value={lesiones[key]?.detalle || ""} disabled />
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="form-row" style={{ alignItems: "flex-end", gap: "12px" }}>
                        <div className="form-col" style={{ maxWidth: "350px" }}>
                          <label className="form-label">Actividad física</label>
                          <select className="input" value={antecedentesNoPatologicos.actividadFisica || ""} disabled>
                            <option value="">Seleccione</option>
                            <option value="ligera">Ligera</option>
                            <option value="moderada">Moderada</option>
                            <option value="fuerte">Fuerte</option>
                          </select>
                        </div>

                        <div className="form-col" style={{ maxWidth: "350px" }}>
                          <label className="form-label">Alimentación</label>
                          <select className="input" value={antecedentesNoPatologicos.alimentacion || ""} disabled>
                            <option value="">Seleccione</option>
                            <option value="buena">Buena</option>
                            <option value="regular">Regular</option>
                            <option value="mala">Mala</option>
                          </select>
                        </div>
                        <div className="form-col" style={{ maxWidth: "350px" }}>
                          <label className="form-label">Descanso</label>
                          <select className="input" value={antecedentesNoPatologicos.descanso || ""} disabled>
                            <option value="">Seleccione</option>
                            <option value="bueno">Bueno</option>
                            <option value="regular">Regular</option>
                            <option value="malo">Malo</option>
                          </select>
                        </div>

                        <div className="form-col" style={{ maxWidth: "350px" }}>
                          <label className="form-label">Estrés</label>
                          <select className="input" value={antecedentesNoPatologicos.estres || ""} disabled>
                            <option value="">Seleccione</option>
                            <option value="ligero">Ligero</option>
                            <option value="moderado">Moderado</option>
                            <option value="fuerte">Fuerte</option>
                          </select>
                        </div>
                        <div className="form-col">
                          <label className="form-label">Adicciones</label>
                          <br />
                          <label className="checkbox-label form-label">
                            <input type="checkbox" checked={antecedentesNoPatologicos.adicciones?.tabaquismo || false} disabled />Tabaquismo
                          </label>
                          <label className="checkbox-label form-label">
                            <input type="checkbox" checked={antecedentesNoPatologicos.adicciones?.alcohol || false} disabled />Alcohol
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="form-col" style={{ maxWidth: "700px" }}>
                    <label className="form-label">Diagnóstico médico:</label>
                    <textarea className="textarea" value={formData.diagnosticoMedico || ""} disabled />
                  </div>
                  <div className="form-col" style={{ maxWidth: "700px" }}>
                    <label className="form-label">Indicaciones médicas:</label>
                    <textarea className="textarea" value={formData.indicacionesMedicas || ""} disabled />
                  </div>
                </div>
              </div>
            )}

            {/*TAB 3*/}
            {activeTab === "evaluacion" && (
              <div className="tab-content">
                <div className="form-row">
                  <div className="form-col">
                    <label className="form-label"><strong>Observación</strong></label>
                    <br />
                    {[
                      { key: "edema", label: "Edema" },
                      { key: "enrojecimiento", label: "Enrojecimiento" },
                      { key: "esguince", label: "Esguince" },
                      { key: "hematoma", label: "Hematoma" },
                      { key: "marcha", label: "Marcha" },
                      { key: "otro", label: "Otro" }
                    ].map(({ key, label }) => (
                      <div key={key} style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                        <label className="checkbox-label form-label" style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: "260px" }}>
                          <input type="checkbox" checked={obser[key]?.activo || false} disabled />{label}
                        </label>

                        {obser[key]?.activo && (
                          <input type="text" className="input" value={obser[key]?.detalle || ""} disabled style={{ maxWidth: "400px" }} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-col">
                    <label className="form-label"><strong>Palpación</strong></label>
                    <br />
                    <div className="form-row" style={{ gap: "20px" }}>
                      <div className="form-col" style={{ maxWidth: "300px" }}>
                        <label className="form-label">Dolor en:</label>
                        <textarea className="textarea" value={formData.dolor24hrs || ""} disabled />
                      </div>
                      <div className="form-col" style={{ maxWidth: "300px" }}>
                        <label className="form-label">Observaciones generales:</label>
                        <textarea className="textarea" value={formData.observacionesHistorial || ""} disabled />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeTab === "soap" && (
              <div className="tab-content">
                <div className="form-row">
                  <div className="form-col" style={{ maxWidth: "200px" }}>
                    <label className="form-label">ID Nota: <strong>{formData.soapFK?.idHistoricoFk || formData.idHistorial}</strong></label>
                  </div>
                  <div className="form-col" style={{ maxWidth: "200px" }}>
                    <label className="form-label">Mes-Año: <strong>{formData.soapFK?.mesAñoNota || ""}</strong></label>
                  </div>
                </div>

                <div className="form-row" style={{ flexDirection: "column", gap: "12px", marginTop: "10px" }}>
                  <div className="form-col" style={{ maxWidth: "700px" }}>
                    <label className="form-label">Contenido general:</label>
                    <textarea className="textarea" value={formData.soapFK?.contenidoNota || ""} disabled />
                  </div>
                </div>

                <h3 style={{ marginTop: "15px", marginBottom: "10px", color: "#6c757d", fontSize: "16px" }}>Desglose SOAP</h3>

                <div className="form-row" style={{ gap: "20px" }}>
                  <div className="form-col" style={{ flex: 1, maxWidth: "340px" }}>
                    <label className="form-label">Subjetivo (S):</label>
                    <textarea className="textarea" value={formData.soapFK?.S || ""} disabled />
                  </div>
                  <div className="form-col" style={{ flex: 1, maxWidth: "340px" }}>
                    <label className="form-label">Objetivo (O):</label>
                    <textarea className="textarea" value={formData.soapFK?.O || ""} disabled />
                  </div>
                </div>

                <div className="form-row" style={{ gap: "20px", marginTop: "10px" }}>
                  <div className="form-col" style={{ flex: 1, maxWidth: "340px" }}>
                    <label className="form-label">Análisis (A):</label>
                    <textarea className="textarea" value={formData.soapFK?.A || ""} disabled />
                  </div>
                  <div className="form-col" style={{ flex: 1, maxWidth: "340px" }}>
                    <label className="form-label">Plan (P):</label>
                    <textarea className="textarea" value={formData.soapFK?.P || ""} disabled />
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
