import { IoIosAddCircle } from "react-icons/io";
import { IoCaretDown } from "react-icons/io5";
import { IoCaretUp } from "react-icons/io5";
import { useState, useEffect } from "react";
import { TiDelete } from "react-icons/ti";
import InformacionClinica from "../layout/InformacionClinica";
import api from "../../api";
import { showError } from "../../utils/alerts";
import LoadingSpinner from "../layout/LoadingSpinner";

const FormularioHistorial = () => {
  const [paciente, setPaciente] = useState(null);
  const [activeTab, setActiveTab] = useState("datosPersonales");
  const [nuevoID, setNuevoID] = useState("");
  const [mesAñoNota, setMesAñoNota] = useState("");
  const [itemsAntFam, setItemsAntFam] = useState([]);
  const [antecedenteSeleccionado, setAntecedenteSeleccionado] = useState("");
  const [itemsAntMed, setItemsAntMed] = useState([]);
  const [antecedenteMedico, setAntecedenteMedico] = useState("");
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


  const [formData, setFormData] = useState({
    antecedentesFamiliares: [""],
    antecedentesMedicos: [""],
    antecedentesQuirurgicos: "",
    intervencionesPrevias: "",
    cualesIntervenciones: [""],
    duracionPlan: "",
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
    fechaNacimiento: "",
    sexo: "",
    talla: "",
    peso: "",
    direccion: "",
    ocupacion: "",
    correoElectronico: "",
    motivoConsulta: "",
    eva: "",
    dolor24hrs: "",
    tipo: "",
    tipoOtra: "",
    facModifica: "",
    sensacion: "",
    sensacionOtra: "",
    medActual: "",
    anioQuirurgico: "",
    diagnosticoMedico: "",
    indicacionesMedicas: "",
    dolorPalpacion: "",
    espasmoPalpacion: "",
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
      return;
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

    const cargarAntecedentesFamiliares = async () => {
      try {
        const { data } = await api.get("/configuracion/item/AntFam");
        setItemsAntFam(data.items || []);
      } catch (error) {
        console.error("Error cargando antecedentes familiares", error);
      }
    };

    const cargarAntecedentesMedicos = async () => {
      try {
        const { data } = await api.get("/configuracion/item/AntMed");
        setItemsAntMed(data.items || []);
      } catch (error) {
        console.error("Error cargando antecedentes médicos", error);
      }
    };

    cargarID();
    cargarAntecedentesFamiliares();
    cargarAntecedentesMedicos();
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
  const handleNoPatChange = (e) => {
    const { name, value } = e.target;
    setAntecedentesNoPatologicos(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const toggleAdiccion = (key) => {
    setAntecedentesNoPatologicos(prev => ({
      ...prev,
      adicciones: {
        ...prev.adicciones,
        [key]: !prev.adicciones[key]
      }
    }));
  };

  const toggleLesion = (key) => {
    setLesiones(prev => ({
      ...prev,
      [key]: {
        activo: !prev[key].activo,
        detalle: !prev[key].activo ? prev[key].detalle : ""
      }
    }));
  };

  const changeDetalle = (key, value) => {
    setLesiones(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        detalle: value
      }
    }));
  };

  const toggleObser = (key) => {
    setObser(prev => ({
      ...prev,
      [key]: {
        activo: !prev[key].activo,
        detalle: !prev[key].activo ? prev[key].detalle : ""
      }
    }));
  };

  const changeObser = (key, value) => {
    setObser(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        detalle: value
      }
    }));
  };




  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");

    const faltantes = [];
    if (!formData.motivoConsulta || formData.motivoConsulta.trim() === "") faltantes.push("Motivo de consulta");
    if (!formData.fechaNacimiento) faltantes.push("Fecha de nacimiento");
    if (!formData.sexo) faltantes.push("Sexo");
    if (!formData.contenidoNota || formData.contenidoNota.trim() === "") faltantes.push("Contenido general de la Nota SOAP");

    if (faltantes.length > 0) {
      showError("Faltan campos obligatorios", `Por favor completa los siguientes campos: ${faltantes.join(", ")}`);
      return;
    }

    setLoading(true);

    const limpiarEspacios = (obj) => {
      if (typeof obj === "string") return obj.trim();
      if (Array.isArray(obj)) return obj.map(item => limpiarEspacios(item));
      if (obj instanceof Date) return obj.toISOString();
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
        fechaEvaluacion: new Date().toISOString(),
        duracionPlan: formData.duracionPlan || "",
        frecuenciaSesiones: formData.frecuenciaSesiones || "",
        habitosDeEjercicio: formData.habitosDeEjercicio,
        consentimientoInformado: formData.consentimientoInformado,
        intervencionesPrevias: formData.intervencionesPrevias,
        cualesIntervenciones: formData.cualesIntervenciones,
        medicacionActual: formData.medActual || "Ninguna",
        objetivoCortoPlazo: formData.objetivoCortoPlazo,
        obserExploraciones: formData.obserExploraciones,
        pruebasEspeciales: formData.pruebasEspeciales,
        cualesPruebasEspeciales: formData.cualesPruebasEspeciales,
        resultadoPruebas: formData.resultadoPruebas,
        observacionesHistorial: formData.observacionesHistorial,
        // Nuevos campos
        fechaNacimiento: formData.fechaNacimiento,
        sexo: formData.sexo,
        talla: formData.talla,
        peso: formData.peso,
        direccion: formData.direccion,
        ocupacion: formData.ocupacion,
        correoElectronico: formData.correoElectronico,
        eva: formData.eva,
        dolor24hrs: formData.dolor24hrs,
        tipo: formData.tipo === "otra" ? formData.tipoOtra : formData.tipo,
        facModifica: formData.facModifica,
        sensacion: formData.sensacion === "otra" ? formData.sensacionOtra : formData.sensacion,
        anioQuirurgico: formData.anioQuirurgico,
        diagnosticoMedico: formData.diagnosticoMedico,
        indicacionesMedicas: formData.indicacionesMedicas,
        dolorPalpacion: formData.dolorPalpacion,
        espasmoPalpacion: formData.espasmoPalpacion,
        antecedentesNoPatologicos: antecedentesNoPatologicos,
        lesiones: lesiones,
        obser: obser
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

      showSuccess("¡Historial Guardado!", "El historial y la nota SOAP se han creado exitosamente.");
    } catch (err) {
      console.error(err);
      const errorMessage = err.response?.data?.error || err.response?.data?.message || "No se pudo guardar el historial. Revisa los datos.";
      showError("Error al guardar", errorMessage);
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="auth-wrapper-content">
      <div className="cards-column">
        {paciente && <InformacionClinica paciente={paciente} />}

        <div className="auth-card auth-card-detail">
          <h2 className="title_card">Crear Historial</h2>
          <hr />
          <div className="tabs">
            <button className={`tab ${activeTab === "datosPersonales" ? "active" : ""}`} onClick={() => setActiveTab("datosPersonales")}>Datos personales</button>
            <button className={`tab ${activeTab === "AnaAnte" ? "active" : ""}`} onClick={() => setActiveTab("AnaAnte")}>Anamnesis y Antecedentes</button>
            <button className={`tab ${activeTab === "evaluacion" ? "active" : ""}`} onClick={() => setActiveTab("evaluacion")}>Evaluación</button>
            <button className={`tab ${activeTab === "soap" ? "active" : ""}`} onClick={() => setActiveTab("soap")}>Notas SOAP</button>
          </div>

          <form className="form" onSubmit={handleSubmit}>
            {activeTab === "datosPersonales" && paciente && (
              <div className="tab-content">
                <div className="form-row">
                  <div className="form-col full-width">
                    <label className="form-label">Nombre completo:</label>
                    <input type="text" className="input" value={`${paciente.nombres} ${paciente.apellidos}`} readOnly />
                  </div>
                  <div className="form-col">
                    <label className="form-label">Fecha de nacimiento:</label>
                    <input type="date" name="fechaNacimiento" className="input" value={formData.fechaNacimiento}
                      onChange={handleInputChange} />
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
                    <input type="text" className="input" value={paciente.edad} readOnly />
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
                    <input type="text" className="input" value={paciente.telefono} readOnly />
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
                    <textarea name="motivoConsulta" className="textarea" value={formData.motivoConsulta}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-row" style={{ flexDirection: "row", gap: "12px" }}>
                    <div className="form-col" style={{ maxWidth: "150px" }}>
                      <label className="form-label">EVA:</label>
                      <select name="eva"
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
                      <textarea name="facModifica" className="textarea" style={{ maxWidth: "600px" }} value={formData.facModifica}
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

                    <div className="form-col" style={{ maxWidth: "280px" }}>
                      <label className="form-label">Antecedentes familiares:</label>
                      <select className="input" value={antecedenteSeleccionado}
                        onChange={(e) => {
                          const value = e.target.value; setAntecedenteSeleccionado(value);
                          setFormData(prev => ({ ...prev, antecedentesFamiliares: [...prev.antecedentesFamiliares, value] }));
                        }}>
                        <option value="">Seleccione una opción</option>
                        {itemsAntFam.map((item) => (
                          <option key={item._id} value={item._id}>
                            {item.valor}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-col" style={{ maxWidth: "280px" }}>
                      <label className="form-label">Antecedentes médicos:</label>
                      <select className="input" value={antecedenteMedico}
                        onChange={(e) => {
                          const value = e.target.value; setAntecedenteMedico(value);
                          setFormData(prev => ({ ...prev, antecedentesMedicos: [...prev.antecedentesMedicos, value] }));
                        }}>
                        <option value="">Seleccione una opción</option>
                        {itemsAntMed.map((item) => (
                          <option key={item._id} value={item._id}>
                            {item.valor}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-col" style={{ maxWidth: "230px" }}>
                      <label className="form-label">Medicacion actual:</label>
                      <textarea name="medActual" className="textarea" style={{ maxWidth: "300px" }} value={formData.medActual}
                        onChange={handleInputChange} />
                    </div>
                    <div className="form-col" style={{ maxWidth: "230px" }}>
                      <label className="form-label">Antecedentes quirúrgicos:</label>
                      <textarea name="antecedentesQuirurgicos" className="textarea" style={{ maxWidth: "400px" }} value={formData.antecedentesQuirurgicos}
                        onChange={handleInputChange} />
                    </div>
                    <div className="form-col" style={{ maxWidth: "130px" }}>
                      <label className="form-label">Año:</label>
                      <input type="date" style={{ maxWidth: "200px" }} name="anioQuirurgico" className="input" value={formData.anioQuirurgico}
                        onChange={handleInputChange} />
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
                                    <input
                                      type="checkbox"
                                      checked={lesiones[key].activo}
                                      onChange={() => toggleLesion(key)}
                                    />
                                    <span>{label}</span>
                                  </label>

                                  {lesiones[key].activo && (
                                    <input
                                      type="text"
                                      className="input lesion-input"
                                      placeholder="Describa"
                                      value={lesiones[key].detalle}
                                      onChange={(e) => changeDetalle(key, e.target.value)}
                                    />
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
                          <select name="actividadFisica" className="input" value={antecedentesNoPatologicos.actividadFisica}
                            onChange={handleNoPatChange}>
                            <option value="">Seleccione</option>
                            <option value="ligera">Ligera</option>
                            <option value="moderada">Moderada</option>
                            <option value="fuerte">Fuerte</option>
                          </select>
                        </div>

                        <div className="form-col" style={{ maxWidth: "350px" }}>
                          <label className="form-label">Alimentación</label>
                          <select name="alimentacion" className="input" value={antecedentesNoPatologicos.alimentacion}
                            onChange={handleNoPatChange}>
                            <option value="">Seleccione</option>
                            <option value="buena">Buena</option>
                            <option value="regular">Regular</option>
                            <option value="mala">Mala</option>
                          </select>
                        </div>
                        <div className="form-col" style={{ maxWidth: "350px" }}>
                          <label className="form-label">Descanso</label>
                          <select name="descanso" className="input" value={antecedentesNoPatologicos.descanso}
                            onChange={handleNoPatChange} >
                            <option value="">Seleccione</option>
                            <option value="bueno">Bueno</option>
                            <option value="regular">Regular</option>
                            <option value="malo">Malo</option>
                          </select>
                        </div>

                        <div className="form-col" style={{ maxWidth: "350px" }}>
                          <label className="form-label">Estrés</label>
                          <select name="estres" className="input" value={antecedentesNoPatologicos.estres}
                            onChange={handleNoPatChange}>
                            <option value="">Seleccione</option>
                            <option value="ligero">Ligero</option>
                            <option value="moderado">Moderado</option>
                            <option value="fuerte">Fuerte</option>
                          </select>
                        </div>
                        <div className="form-col">
                          <label className="form-label">Adicciones</label>
                          <br></br>
                          <label className="checkbox-label form-label">
                            <input type="checkbox" checked={antecedentesNoPatologicos.adicciones.tabaquismo}
                              onChange={() => toggleAdiccion("tabaquismo")} />Tabaquismo</label>
                          <label className="checkbox-label form-label form-label">
                            <input type="checkbox" checked={antecedentesNoPatologicos.adicciones.alcohol}
                              onChange={() => toggleAdiccion("alcohol")} />Alcohol</label>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="form-col" style={{ maxWidth: "700px" }}>
                    <label className="form-label">Diagnóstico médico:</label>
                    <textarea name="diagnosticoMedico" className="textarea" value={formData.diagnosticoMedico}
                      onChange={handleInputChange} />
                  </div>
                  <div className="form-col" style={{ maxWidth: "700px" }}>
                    <label className="form-label">Indicaciones médicas:</label>
                    <textarea name="indicacionesMedicas" className="textarea" value={formData.indicacionesMedicas}
                      onChange={handleInputChange} />
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
                          <input type="checkbox" checked={obser[key].activo} onChange={() => toggleObser(key)} />{label}
                        </label>

                        {obser[key].activo && (
                          <input type="text" className="input" placeholder="Lugar" value={obser[key].detalle}
                            onChange={(e) => changeObser(key, e.target.value)} style={{ maxWidth: "400px" }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-col">
                    <label className="form-label"><strong>Palpación</strong></label>
                    <br />
                    <div className="form-col" style={{ maxWidth: "300px" }}>
                      <label className="form-label">Dolor en:</label>
                      <textarea name="dolorPalpacion" className="textarea" value={formData.dolorPalpacion}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="form-col" style={{ maxWidth: "300px" }}>
                      <label className="form-label">Espasmo muscular en:</label>
                      <textarea name="espasmoPalpacion" className="textarea" value={formData.espasmoPalpacion}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "soap" && (
              <div className="tab-content">
                <div className="form-row">
                  <div className="form-col" style={{ maxWidth: "200px" }}>
                    <label className="form-label">ID Nota: <strong>{formData.idHistoricoFk}</strong></label>
                  </div>
                  <div className="form-col" style={{ maxWidth: "200px" }}>
                    <label className="form-label">Mes-Año: <strong>{formData.mesAñoNota}</strong></label>
                  </div>
                </div>

                <div className="form-row" style={{ flexDirection: "column", gap: "12px", marginTop: "10px" }}>
                  <div className="form-col" style={{ maxWidth: "700px" }}>
                    <label className="form-label">Contenido general:</label>
                    <textarea name="contenidoNota" className="textarea" value={formData.contenidoNota || ""}
                      onChange={handleInputChange} />
                  </div>
                </div>

                <h3 style={{ marginTop: "15px", marginBottom: "10px", color: "#6c757d", fontSize: "16px" }}>Desglose SOAP</h3>

                <div className="form-row" style={{ gap: "20px" }}>
                  <div className="form-col" style={{ flex: 1, maxWidth: "340px" }}>
                    <label className="form-label">Subjetivo (S):</label>
                    <textarea name="S" className="textarea" value={formData.S || ""}
                      onChange={handleInputChange} />
                  </div>
                  <div className="form-col" style={{ flex: 1, maxWidth: "340px" }}>
                    <label className="form-label">Objetivo (O):</label>
                    <textarea name="O" className="textarea" value={formData.O || ""}
                      onChange={handleInputChange} />
                  </div>
                </div>

                <div className="form-row" style={{ gap: "20px", marginTop: "10px" }}>
                  <div className="form-col" style={{ flex: 1, maxWidth: "340px" }}>
                    <label className="form-label">Análisis (A):</label>
                    <textarea name="A" className="textarea" value={formData.A || ""}
                      onChange={handleInputChange} />
                  </div>
                  <div className="form-col" style={{ flex: 1, maxWidth: "340px" }}>
                    <label className="form-label">Plan (P):</label>
                    <textarea name="P" className="textarea" value={formData.P || ""}
                      onChange={handleInputChange} />
                  </div>
                </div>
              </div>
            )}


            <button type="submit" className="save-btn" disabled={loading} style={{ marginTop: 20, minWidth: '160px', height: '45px' }}>
              {loading ? <LoadingSpinner size="small" color="#fff" /> : "Guardar historial"}
            </button>
          </form>

          {mensaje && <p style={{ marginTop: 15, fontWeight: "bold" }}>{mensaje}</p>}
        </div>
      </div>
    </div>
  );
};

export default FormularioHistorial;
