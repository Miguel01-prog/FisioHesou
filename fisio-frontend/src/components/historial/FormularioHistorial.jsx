import { IoIosAddCircle } from "react-icons/io";
import { useState, useEffect } from "react";
import { TiDelete } from "react-icons/ti";
import InformacionClinica from "../layout/InformacionClinica";
import api from "../../api";
import { showError } from "../../utils/alerts";

const FormularioHistorial = () => {
  const [paciente, setPaciente] = useState(null);
  const [activeTab, setActiveTab] = useState("datosPersonales");
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
    if (!paciente || !paciente.nombres) {
      console.warn("Paciente inválido al generar ID:", paciente);
      return "";
    }

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
    let datosPaciente = null;

    try {
      datosPaciente = JSON.parse(localStorage.getItem("dataPaciente"));
    } catch (e) {
      console.warn("Error leyendo dataPaciente:", e);
    }

    if (!datosPaciente) {
      console.warn("dataPaciente es null — se detiene useEffect");
      return; // ⛔ EVITA QUE SE EJECUTE cargarID()
    }

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
      setFormData(prev => ({
        ...prev,
        idHistoricoFk: idGenerado,
        mesAñoNota: mesAño,
      }));
    };

    cargarID();
  }, []);

  // ============================
  //  HANDLERS MISC
  // ============================
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

  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setMensaje("");

  // Función para limpiar espacios en strings y arrays de strings
  const limpiarEspacios = (obj) => {
    if (typeof obj === "string") return obj.trim();
    if (Array.isArray(obj)) return obj.map(item => limpiarEspacios(item));
    if (typeof obj === "object" && obj !== null) {
      const nuevo = {};
      for (const key in obj) {
        nuevo[key] = limpiarEspacios(obj[key]);
      }
      return nuevo;
    }
    return obj;
  };

  try {
    if (!paciente) {
      showError("Error", "No hay datos del paciente");
      setLoading(false);
      return;
    }

    const historialData = {
      identificadorPaciente: paciente.identificadorPaciente,
      idHistorial: formData.idHistoricoFk,
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
      idHistorialFk: "",
      idHistoricoFk: formData.idHistoricoFk,
      mesAñoNota: formData.mesAñoNota,
      contenidoNota: formData.contenidoNota,
      S: formData.S,
      O: formData.O,
      A: formData.A,
      P: formData.P,
    };

    // Limpiar espacios antes de enviar
    const historialDataLimpio = limpiarEspacios(historialData);
    const notaDataLimpio = limpiarEspacios(notaData);

    await api.post("/historial-notas", { 
      historialData: historialDataLimpio, 
      notaData: notaDataLimpio 
    });

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
        {paciente && <InformacionClinica paciente={paciente} />}

        <div className="auth-card auth-card-detail">
          <h2 className="title_card" style={{ marginTop: "-10px" }}>Crear Historial</h2>
          <hr />
          <div className="tabs">
            <button className={`tab ${activeTab === "datosPersonales" ? "active" : ""}`} onClick={() => setActiveTab("datosPersonales")}>Datos personales</button>
            <button className={`tab ${activeTab === "AnaAnte" ? "active" : ""}`} onClick={() => setActiveTab("AnaAnte")}>Anamnesis y Antecedentes</button>
            <button className={`tab ${activeTab === "soap" ? "active" : ""}`} onClick={() => setActiveTab("soap")}>Notas SOAP</button>
          </div>

          <form className="form" onSubmit={handleSubmit}>
            {activeTab === "datosPersonales" && paciente && (
              <div className="tab-content">
                <div className="form-row">
                  <div className="form-col full-width">
                    <label className="form-label">Nombre completo:</label>
                    <input type="text" className="input"value={`${paciente.nombres} ${paciente.apellidos}`} readOnly/>
                  </div>
                  <div className="form-col">
                    <label className="form-label">Fecha de nacimiento:</label>
                    <input type="date" name="fechaNacimiento" className="input" value={formData.fechaNacimiento}
                    onChange={handleInputChange}/>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-col small-width">
                    <label className="form-label">Sexo:</label>
                    <select name="sexo" className="input" value={formData.sexo}
                      onChange={handleInputChange}
                    >
                      <option value="">Seleccione</option>
                      <option value="Hombre">Hombre</option>
                      <option value="Mujer">Mujer</option>
                    </select>
                  </div>
                  <div className="form-col small-width" style={{ flex: "1 1 80px", maxWidth: "150px" }}>
                    <label className="form-label">Edad:</label>
                    <input type="text" className="input" value={paciente.edad} readOnly/>
                  </div>
                  <div className="form-col small-width" style={{ flex: "1 1 80px", maxWidth: "150px" }}>
                    <label className="form-label">Talla (cm):</label>
                    <input type="number" name="talla" className="input" step="0.01" min="0" value={formData.talla}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-col" style={{ flex: "1 1 80px", maxWidth: "125px" }}>
                    <label className="form-label">Peso (kg):</label>
                    <input type="number" name="peso" className="input" step="0.01" min="0" value={formData.peso}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-col" style={{ flex: "1 1 80px", maxWidth: "320px" }}>
                    <label className="form-label">Dirección:</label>
                    <input type="text" name="direccion" className="input" value={formData.direccion}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-col" style={{ flex: "1 1 80px", maxWidth: "325px" }}>
                    <label className="form-label">Ocupación:</label>
                    <input type="text" name="ocupacion" className="input" value={formData.ocupacion}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-col small-width" >
                    <label className="form-label">Correo electrónico:</label>
                    <input type="text" name="correo" className="input" value={formData.correoElectronico}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-col small-width" style={{ flex: "1 1 80px", maxWidth: "325px" }}>
                    <label className="form-label">Teléfono:</label>
                    <input type="text" className="input" value={paciente.telefono} readOnly/>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2 */}
            {activeTab === "AnaAnte" && (
              <div className="tab-content">
                <div className="form-row" style={{ flexDirection: "column", gap: "12px" }}>
                  <div className="form-col" style={{ maxWidth: "700px" }}>
                    <label className="form-label">Motivo de consulta:</label>
                    <textarea
                      name="motivoConsulta"
                      className="textarea"
                      value={formData.motivoConsulta}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-row" style={{ flexDirection: "row", gap: "12px" }}>

                    <div className="form-col" style={{ maxWidth: "150px" }}>
                      <label className="form-label">EVA:</label>
                      <select   name="eva"
                        className="input"
                        value={formData.eva}
                        onChange={handleInputChange}
                      >
                        <option value="">Seleccione</option>
                        {[...Array(11).keys()].map((num) => (
                          <option key={num} value={num}>{num}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-col" style={{ maxWidth: "300px" }}>
                      <label className="form-label">Dolor 24hrs:</label>
                      <textarea name="dolor24hrs" className="textarea" value={formData.dolor24hrs}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="form-col" style={{ maxWidth: "150px" }}>
                      <label className="form-label">Tipo:</label>
                      <select name="tipo" className="input" value={formData.tipo}
                        onChange={handleInputChange}>
                        <option value="">Seleccione</option>
                        <option value="ardon">Ardon</option>
                        <option value="quemante">Quemante</option>
                        <option value="punzante">Punzante</option>
                        <option value="pellizco">Pellizco</option>
                        <option value="muscular">Muscular</option>
                        <option value="otra">Otra</option>
                      </select>
                      {formData.tipo === "otra" && (
                        <input type="text" className="input mt-2"
                          value={formData.tipoOtra || ""}
                          onChange={(e) => setFormData({ ...formData, tipoOtra: e.target.value })}
                          placeholder="Especifique" style={{ marginTop: "8px" }}
                        />
                      )}
                    </div>
                    <div className="form-col">
                      <label className="form-label">Factores que lo modifican:</label>
                      <textarea name="facModifica" className="textarea" style={{maxWidth: "600px"}} value={formData.facModifica}
                        onChange={handleInputChange}
                      />
                    </div>
                     <div className="form-col" style={{ maxWidth: "230px" }}>
                      <label className="form-label">Sensación:</label>
                      <select name="sensacion" className="input" value={formData.sensacion}
                        onChange={handleInputChange}>
                        <option value="">Seleccione</option>
                        <option value="hormigueo">Hormigueo</option>
                        <option value="adormecimiento">Adormecimiento</option>
                        <option value="calambre">Calambre</option>
                        <option value="rigidez">Rigidez</option>
                        <option value="otra">Otra</option>
                      </select>
                      {formData.sensacion === "otra" && (
                        <input type="text" className="input mt-2"
                          value={formData.tipoOtra || ""}
                          onChange={(e) => setFormData({ ...formData, tipoOtra: e.target.value })}
                          placeholder="Especifique" style={{ marginTop: "8px" }}
                        />
                      )}
                    </div>
                     <div className="form-col">
                        <label className="form-label">Antecedentes quirúrgicos:</label>
                        {formData.antecedentesQuirurgicos.map((valor, index) => (
                            <div key={index} className="input-dynamic d-flex align-items-center mb-1">
                                <input type="text" className="input flex-grow-1"
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
                     <div className="form-col" style={{ maxWidth: "230px" }}>
                         <label className="form-label">Antecedentes médicos:</label>
                          
                     </div>




                  </div>
                </div>
              </div>


            )}

            {/* TAB 3 (SOAP) */}
            {activeTab === "soap" && (
              <div className="tab-content">
                <div className="form-row">
                  <div className="col">
                    <label>ID Nota: <strong>{formData.idHistoricoFk}</strong></label>
                  </div>
                  <div className="col">
                    <label>Mes-Año: <strong>{formData.mesAñoNota}</strong></label>
                  </div>
                </div>

                {/* resto de la UI SOAP */}
              </div>
            )}

            <button type="submit" className="save-btn" disabled={loading} style={{ marginTop: 20 }}>
              {loading ? "Guardando..." : "Guardar historial"}
            </button>
          </form>

          {mensaje && <p style={{ marginTop: 15, fontWeight: "bold" }}>{mensaje}</p>}
        </div>
      </div>
    </div>
  );
};

export default FormularioHistorial;
