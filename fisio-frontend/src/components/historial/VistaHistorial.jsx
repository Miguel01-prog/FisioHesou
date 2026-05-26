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
            <button type="button" className={`tab ${activeTab === "datosPersonales" ? "active" : ""}`} onClick={() => setActiveTab("datosPersonales")}>Datos personales</button>
            <button type="button" className={`tab ${activeTab === "AnaAnte" ? "active" : ""}`} onClick={() => setActiveTab("AnaAnte")}>Anamnesis y Antecedentes</button>
            <button type="button" className={`tab ${activeTab === "evaluacion" ? "active" : ""}`} onClick={() => setActiveTab("evaluacion")}>Evaluación</button>
            <button type="button" className={`tab ${activeTab === "soap" ? "active" : ""}`} onClick={() => setActiveTab("soap")}>Notas SOAP</button>
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
