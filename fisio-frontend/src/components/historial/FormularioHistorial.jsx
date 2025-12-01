import { IoIosAddCircle } from "react-icons/io";
import { useState, useEffect } from "react";
import { TiDelete } from "react-icons/ti";
import CardPaciente from "../pacientes/CardPaciente.jsx";
import api from "../../api";
import { showError } from "../../utils/alerts";

const FormularioHistorial = () => {
  const [paciente, setPaciente] = useState(null);
  const [activeTab, setActiveTab] = useState("antecedentes");
  const [nuevoID, setNuevoID] = useState("");
  const [mesAñoNota, setMesAñoNota] = useState("");

  const [formData, setFormData] = useState({
    antecedentesFamiliares: [""],
    antecedentesMedicos: [""],
    antecedentesQuirurgicos: [""],
    intervencionesPrevias: "",
    cualesIntervenciones: [""],
    duracionPlan: "",
    fechaNacimiento: "",
    fechaEvaluacion: "",
    frecuenciaSesiones: "",
    habitosDeEjercicio: [""],
    consentimientoInformado: "",
    objetivoCortoPlazo: "",
    obserExploraciones: "",
    pruebasEspeciales: "",
    cualesPruebasEspeciales: [""],
    resultadoPruebas: "",
    observacionesHistorial: "",
    notasSOAP: { S: "", O: "", A: "", P: "" },
    idHistoricoFk: "",
    mesAñoNota: "",
  });

  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const generarIdNotaFront = async (paciente, mesAñoNota) => {
    try {
      const response = await api.post("/notas/generar-id", {
        nombrePaciente: paciente.nombres,
        apellidoPaciente: paciente.apellidos,
        mesAñoNota,
        identificadorPaciente: paciente.identificadorPaciente,
      });
      return response.data.idHistoricoFk;
    } catch (err) {
      console.error("Error generando ID:", err);
      showError("Error", "No se pudo generar el ID de la nota");
      return "";
    }
  };

  useEffect(() => {
    const datosPaciente = JSON.parse(localStorage.getItem("dataPaciente"));
    if (!datosPaciente) return;

    const fecha = new Date();
    const mesAño = `${fecha.getMonth() + 1}-${fecha.getFullYear()}`;
    setMesAñoNota(mesAño);

    setPaciente({
      nombres: datosPaciente.nombres,
      apellidos: datosPaciente.apellidos,
      edad: datosPaciente.edad,
      telefono: datosPaciente.telefono,
      fechaRegistro: datosPaciente.fechaCitaStr,
      identificadorPaciente: datosPaciente.identificadorPaciente,
    });

    const cargarID = async () => {
      const idGenerado = await generarIdNotaFront(datosPaciente, mesAño);
      setNuevoID(idGenerado);
      setFormData((prev) => ({
        ...prev,
        idHistoricoFk: idGenerado,
        mesAñoNota: mesAño,
      }));
    };

    cargarID();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDynamicChange = (campo, index, value) => {
    const copia = [...formData[campo]];
    copia[index] = value;
    setFormData({ ...formData, [campo]: copia });
  };

  const agregarItem = (campo) => {
    setFormData({ ...formData, [campo]: [...formData[campo], ""] });
  };

  const eliminarItem = (campo, index) => {
    const copia = [...formData[campo]];
    copia.splice(index, 1);
    setFormData({ ...formData, [campo]: copia });
  };

  const handleSoapChange = (campo, value) => {
    setFormData((prev) => ({
      ...prev,
      notasSOAP: { ...prev.notasSOAP, [campo]: value },
    }));
  };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMensaje("");

        try {
            if (!paciente) {
            showError("Error", "No hay datos del paciente");
            setLoading(false);
            return;
            }

            // =============================
            //   ARMAR historialData
            // =============================
            const historialData = {
            identificadorPaciente: paciente.identificadorPaciente,
            idHistorial: formData.idHistoricoFk, // usamos el mismo ID de nota
            antecedentesFamiliares: formData.antecedentesFamiliares,
            antecedentesMedicos: formData.antecedentesMedicos,
            antecedentesQuirurgicos: formData.antecedentesQuirurgicos,
            motivoConsulta: formData.motivoConsulta || "Sin especificar",
            fechaEvaluacion: formData.fechaEvaluacion,
            duracionPlan: formData.duracionPlan,
            frecuenciaSesiones: formData.frecuenciaSesiones,
            habitosDeEjercicio: formData.habitosDeEjercicio,
            consentimientoInformado: formData.consentimientoInformado,
            intervencionesPrevias: formData.intervencionesPrevias,
            cualesIntervenciones: formData.cualesIntervenciones,
            medicacionActual: formData.medicacionActual || "Ninguna",
            objetivoCortoPlazo: formData.objetivoCortoPlazo,
            obserExploraciones: formData.obserExploraciones,
            pruebasEspeciales: formData.pruebasEspeciales,
            cualesPruebasEspeciales: formData.cualesPruebasEspeciales,
            resultadoPruebas: formData.resultadoPruebas,
            observacionesHistorial: formData.observacionesHistorial,
            };

            const notaData = {
            identificadorPaciente: paciente.identificadorPaciente,
            idHistorialFk: "", // Lo asigna el backend
            idHistoricoFk: formData.idHistoricoFk,
            mesAñoNota: formData.mesAñoNota,
            contenidoNota: formData.contenidoNota,
            S: formData.S,
            O: formData.O,
            A: formData.A,
            P: formData.P,
            };

            // ====================================
            //   POST usando axios (tu instancia api)
            // ====================================
            const { data } = await api.post("/historial-notas", { historialData, notaData });

            // data ya contiene la respuesta del backend
            setMensaje("Historial y Nota SOAP creados correctamente");
        } catch (err) {
            console.error(err);
            showError("Error", "No se pudo guardar el historial");
            setMensaje("Error al guardar el historial");
        } finally {
            setLoading(false);
        }
    };


  return (
    <div className="auth-wrapper-content">
      <div className="cards-column">
        {paciente && <CardPaciente paciente={paciente} />}

        <div className="auth-card auth-card-detail">
          <h2 className="title_card" style={{ marginTop: "-10px" }}>Crear Historial</h2>
          <hr />

          {/* Tabs */}
          <div className="tabs">
            <button
              className={`tab ${activeTab === "antecedentes" ? "active" : ""}`}
              onClick={() => setActiveTab("antecedentes")}
            >Antecedentes</button>

            <button
              className={`tab ${activeTab === "general" ? "active" : ""}`}
              onClick={() => setActiveTab("general")}
            >Información General</button>

            <button
              className={`tab ${activeTab === "soap" ? "active" : ""}`}
              onClick={() => setActiveTab("soap")}
            >Notas SOAP</button>
          </div>
          <form className="form" onSubmit={handleSubmit}>
            {activeTab === "antecedentes" && (
              <div className="tab-content">
                <div className="form-row mb-3">
                  <div className="col">
                    <label className="form-label">Antecedentes familiares:</label>
                    {formData.antecedentesFamiliares.map((valor, index) => (
                      <div key={index} className="input-dynamic d-flex align-items-center mb-1">
                        <input
                          type="text"
                          className="input flex-grow-1"
                          placeholder={`Antecedente Fam ${index + 1}`}
                          value={valor}
                          onChange={(e) =>
                            handleDynamicChange("antecedentesFamiliares", index, e.target.value)
                          }
                        />
                        {index > 0 && (
                          <button
                            type="button"
                            className="btn-icon-delete ms-1"
                            onClick={() => eliminarItem("antecedentesFamiliares", index)}
                          ><TiDelete /></button>
                        )}
                        {index === formData.antecedentesFamiliares.length - 1 && (
                          <button
                            type="button"
                            className="btn-add-icon ms-1"
                            onClick={() => agregarItem("antecedentesFamiliares")}
                          ><IoIosAddCircle /></button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="col">
                    <label className="form-label">Antecedentes médicos:</label>
                    {formData.antecedentesMedicos.map((valor, index) => (
                      <div key={index} className="input-dynamic d-flex align-items-center mb-1">
                        <input
                          type="text"
                          className="input flex-grow-1"
                          placeholder={`Antecedente Médico ${index + 1}`}
                          value={valor}
                          onChange={(e) =>
                            handleDynamicChange("antecedentesMedicos", index, e.target.value)
                          }
                        />
                        {index > 0 && (
                          <button
                            type="button"
                            className="btn-icon-delete ms-1"
                            onClick={() => eliminarItem("antecedentesMedicos", index)}
                          ><TiDelete /></button>
                        )}
                        {index === formData.antecedentesMedicos.length - 1 && (
                          <button
                            type="button"
                            className="btn-add-icon ms-1"
                            onClick={() => agregarItem("antecedentesMedicos")}
                          ><IoIosAddCircle /></button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

               

                {/* Antecedentes Quirúrgicos */}
                <div className="form-row mb-3">
                  <div className="col">
                        <label className="form-label">Antecedentes quirúrgicos:</label>
                        {formData.antecedentesQuirurgicos.map((valor, index) => (
                            <div key={index} className="input-dynamic d-flex align-items-center mb-1">
                                <input
                                type="text"
                                className="input flex-grow-1"
                                placeholder={`Antecedente Quirúrgico ${index + 1}`}
                                value={valor}
                                onChange={(e) =>
                                    handleDynamicChange("antecedentesQuirurgicos", index, e.target.value)
                                }
                                />
                                {index > 0 && (
                                <button
                                    type="button"
                                    className="btn-icon-delete ms-1"
                                    onClick={() => eliminarItem("antecedentesQuirurgicos", index)}
                                ><TiDelete /></button>
                                )}
                                {index === formData.antecedentesQuirurgicos.length - 1 && (
                                <button
                                    type="button"
                                    className="btn-add-icon ms-1"
                                    onClick={() => agregarItem("antecedentesQuirurgicos")}
                                ><IoIosAddCircle /></button>
                                )}
                            </div>
                        ))}
                  </div>
                     <div className="col">
                        <label className="form-label">Hábitos de ejercicio:</label>
                   {formData.habitosDeEjercicio.map((valor, index) => (
                      <div key={index} className="input-dynamic d-flex align-items-center mb-1">
                        <input
                          type="text"
                          className="input flex-grow-1"
                          placeholder={`Habitos de ejercicio ${index + 1}`}
                          value={valor}
                          onChange={(e) =>
                            handleDynamicChange("habitosDeEjercicio", index, e.target.value)
                          }
                        />
                        {index > 0 && (
                          <button
                            type="button"
                            className="btn-icon-delete ms-1"
                            onClick={() => eliminarItem("habitosDeEjercicio", index)}
                          ><TiDelete /></button>
                        )}
                        {index === formData.habitosDeEjercicio.length - 1 && (
                          <button
                            type="button"
                            className="btn-add-icon ms-1"
                            onClick={() => agregarItem("habitosDeEjercicio")}
                          ><IoIosAddCircle /></button>
                        )}
                      </div>
                    ))}
                     </div>
                  
                </div>

              </div>
            )}
            {activeTab === "general" && (
              <div className="tab-content">
                <div className="form-row mb-2">
                  <div className="col">
                    <label className="form-label">Fecha nacimiento:</label>
                    <input
                      type="date"
                      name="fechaNacimiento"
                      className="input"
                      value={formData.fechaNacimiento}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col">
                    <label className="form-label">Fecha evaluación:</label>
                    <input type="date" name="fechaEvaluacion" className="input"
                      value={formData.fechaEvaluacion}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="form-row mb-2">
                  <div className="col">
                    <label className="form-label">Duración del plan:</label>
                    <input type="text" name="duracionPlan" className="input"
                      value={formData.duracionPlan}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col">
                    <label className="form-label">Frecuencia sesiones:</label>
                    <input type="text" name="frecuenciaSesiones" className="input"
                      value={formData.frecuenciaSesiones}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="form-row mb-2">
                    <div className="col">
                        <label className="form-label">Intervenciones previas:</label>
                        <select name="intervencionesPrevias" className="input"
                            value={formData.intervencionesPrevias} onChange={handleInputChange}> 
                            <option value="">Seleccione</option>
                            <option value="Sí">Sí</option>
                            <option value="No">No</option>
                        </select>
                        {formData.intervencionesPrevias === "Sí" && (
                            <>
                                <label className="form-label">¿Cuáles?</label>
                                {formData.cualesIntervenciones.map((valor, index) => (
                                    <div key={index} className="input-dynamic d-flex align-items-center mb-1">
                                        <input type="text" className="input flex-grow-1" placeholder={`Intervención ${index + 1}`} value={valor}
                                            onChange={(e) => handleDynamicChange("cualesIntervenciones", index, e.target.value)}
                                        />
                                        {index > 0 && (
                                            <button type="button" className="btn-icon-delete ms-1"
                                                onClick={() => eliminarItem("cualesIntervenciones", index)}>
                                                <TiDelete />
                                            </button>
                                        )}
                                        {index === formData.cualesIntervenciones.length - 1 && (
                                            <button type="button" className="btn-add-icon ms-1"
                                                onClick={() => agregarItem("cualesIntervenciones")}>
                                                <IoIosAddCircle />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                    <div className="col">
                        <label className="form-label">Consentimiento informado:</label>
                        <select name="consentimientoInformado" className="input"
                            value={formData.consentimientoInformado} onChange={handleInputChange}> 
                            <option value="">Seleccione</option>
                            <option value="Sí">Sí</option>
                            <option value="No">No</option>
                        </select>
                    </div>
                    <div className="col">
                        <label className="form-label">Objetivo corto plazo:</label>
                        <input type="text" name="objetivoCortoPlazo" className="input"
                            value={formData.objetivoCortoPlazo}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="col">
                        <label className="form-label">Observación de exploracion:</label>
                        <input type="text" name="obserExploraciones" className="input"
                            value={formData.obserExploraciones}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="col">
                        <label className="form-label">¿Pruebas especiales?:</label>
                        <select name="pruebasEspeciales" className="input"
                            value={formData.pruebasEspeciales}
                            onChange={(e) => {handleInputChange(e);
                                if (e.target.value === "No") {
                                    setFormData((prev) => ({ ...prev, cualesPruebasEspeciales: [""] }));
                                }
                            }}
                        >
                            <option value="">Seleccione</option>
                            <option value="Sí">Sí</option>
                            <option value="No">No</option>
                        </select>
                        {formData.pruebasEspeciales === "Sí" && (
                            <>
                            <label className="form-label">¿Cuáles?</label>
                            {formData.cualesPruebasEspeciales.map((valor, index) => (
                                <div key={index} className="input-dynamic d-flex align-items-center mb-1">
                                <input type="text" className="input flex-grow-1" placeholder={`Prueba especial ${index + 1}`}
                                    value={valor} 
                                    onChange= {(e) =>handleDynamicChange("cualesPruebasEspeciales", index, e.target.value)}
                                />
                                {index > 0 && (
                                    <button type="button" className="btn-icon-delete ms-1"
                                        onClick={() => eliminarItem("cualesPruebasEspeciales", index)}>
                                        <TiDelete />
                                    </button>
                                )}
                                {index === formData.cualesPruebasEspeciales.length - 1 && (
                                    <button type="button" className="btn-add-icon ms-1"
                                        onClick={() => agregarItem("cualesPruebasEspeciales")}>
                                        <IoIosAddCircle />
                                    </button>
                                )}
                                </div>
                            ))}
                            </>
                        )}
                    </div>
                    <div className="col">
                        <label className="form-label">Resultado de pruebas:</label>
                        <input type="text" name="resultadoPruebas" className="input" placeholder="Ingresa resultado de pruebas"
                            value={formData.resultadoPruebas}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="col">
                        <label className="form-label">Observaciónes:</label>
                        <textarea type="text" name="observacionesHistorial" className="input" placeholder="Observaciones finales"
                            value={formData.observacionesHistorial}
                            onChange={handleInputChange}
                        />
                    </div>
                </div>
              </div>
            )}

            {activeTab === "soap" && (
              <div className="tab-content">
                <div className="form-row">
                    <div className="col">
                        <label className="form-label">ID Nota: <strong>{formData.idHistoricoFk}</strong></label>
                    </div>
                    <div className="col">
                        <label className="form-label">Mes-Año: <strong>{formData.mesAñoNota}</strong></label> 
                    </div>
                </div>

                <div className="form-row">
                    <div className="col">
                        <label className="form-label">Contenido general:</label>
                        <textarea
                        name="contenidoNota"
                        className="input"
                        value={formData.contenidoNota}
                        onChange={handleInputChange}
                        />
                    </div>
                </div>
                <div className="form-row">
                    <div className="col">
                        <label className="form-label">S (Subjetivo):</label>
                        <textarea
                        name="S"
                        className="input"
                        value={formData.S}
                        onChange={handleInputChange}
                        />
                    </div>

                    <div className="col">
                        <label className="form-label">O (Objetivo):</label>
                        <textarea
                        name="O"
                        className="input"
                        value={formData.O}
                        onChange={handleInputChange}
                        />
                    </div>
                    </div>

                    <div className="form-row">
                    <div className="col">
                        <label className="form-label">A (Análisis):</label>
                        <textarea
                        name="A"
                        className="input"
                        value={formData.A}
                        onChange={handleInputChange}
                        />
                    </div>

                    <div className="col">
                        <label className="form-label">P (Plan):</label>
                        <textarea
                        name="P"
                        className="input"
                        value={formData.P}
                        onChange={handleInputChange}
                        />
                    </div>
                </div>
              </div>
            )}
            <button
              type="submit"
              className="save-btn"
              style={{ marginTop: "20px" }}
              disabled={loading}
            >
              {loading ? "Guardando..." : "Guardar historial"}
            </button>

          </form>

          {mensaje && (
            <p style={{ marginTop: "15px", fontWeight: "bold" }}>{mensaje}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FormularioHistorial;
  