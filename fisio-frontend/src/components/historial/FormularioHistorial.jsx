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

  const getValorAntFam = (id) => {
    const found = itemsAntFam.find(item => item._id === id);
    return found ? found.valor : id;
  };

  const getValorAntMed = (id) => {
    const found = itemsAntMed.find(item => item._id === id);
    return found ? found.valor : id;
  };
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
    antecedentesFamiliares: [],
    antecedentesMedicos: [],
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
    contenidoNota: "",
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
    <div className="auth-wrapper-content fade-in-up">
      <div className="cards-column" style={{ width: "100%", maxWidth: "1000px", margin: "0 auto" }}>
        {paciente && <InformacionClinica paciente={paciente} />}

        <div className="auth-card auth-card-detail" style={{ marginTop: "1rem", padding: "2.5rem" }}>
          <div className="card-header-split" style={{ marginBottom: "1.5rem" }}>
            <h2 className="title_card" style={{ margin: 0 }}>Crear Historial Clínico</h2>
            <span className="subtitle-card-badge">Expediente Digital</span>
          </div>
          <hr style={{ marginBottom: "1.5rem" }} />
          
          <div className="tabs" style={{ marginBottom: "2rem" }}>
            <button type="button" className={`tab ${activeTab === "datosPersonales" ? "active" : ""}`} onClick={() => setActiveTab("datosPersonales")}>Datos Personales</button>
            <button type="button" className={`tab ${activeTab === "AnaAnte" ? "active" : ""}`} onClick={() => setActiveTab("AnaAnte")}>Anamnesis y Antecedentes</button>
            <button type="button" className={`tab ${activeTab === "evaluacion" ? "active" : ""}`} onClick={() => setActiveTab("evaluacion")}>Evaluación Física</button>
            <button type="button" className={`tab ${activeTab === "soap" ? "active" : ""}`} onClick={() => setActiveTab("soap")}>Notas SOAP</button>
          </div>

          <form className="form" onSubmit={handleSubmit}>
            {activeTab === "datosPersonales" && paciente && (
              <div className="tab-content">
                <div className="clinical-form-section">
                  <h3 className="clinical-section-title">👤 Información Básica</h3>
                  <div className="clinical-grid-3">
                    <div className="col" style={{ gridColumn: "span 2" }}>
                      <label className="form-label">Nombre completo</label>
                      <input type="text" className="input" value={`${paciente.nombres} ${paciente.apellidos}`} readOnly style={{ background: "rgba(226, 232, 240, 0.4)" }} />
                    </div>
                    <div className="col">
                      <label className="form-label">Fecha de nacimiento *</label>
                      <input type="date" name="fechaNacimiento" className="input" value={formData.fechaNacimiento} onChange={handleInputChange} required />
                    </div>
                    <div className="col">
                      <label className="form-label">Sexo *</label>
                      <select name="sexo" className="input" value={formData.sexo} onChange={handleInputChange} required>
                        <option value="">Seleccione</option>
                        <option value="Hombre">Hombre</option>
                        <option value="Mujer">Mujer</option>
                      </select>
                    </div>
                    <div className="col">
                      <label className="form-label">Edad (Años)</label>
                      <input type="text" className="input" value={paciente.edad} readOnly style={{ background: "rgba(226, 232, 240, 0.4)" }} />
                    </div>
                  </div>
                </div>

                <div className="clinical-form-section">
                  <h3 className="clinical-section-title">📞 Datos de Contacto y Medidas</h3>
                  <div className="clinical-grid-3">
                    <div className="col">
                      <label className="form-label">Talla (cm)</label>
                      <input type="number" name="talla" className="input" step="0.01" min="0" value={formData.talla} onChange={handleInputChange} placeholder="Ej. 175" />
                    </div>
                    <div className="col">
                      <label className="form-label">Peso (kg)</label>
                      <input type="number" name="peso" className="input" step="0.01" min="0" value={formData.peso} onChange={handleInputChange} placeholder="Ej. 70" />
                    </div>
                    <div className="col">
                      <label className="form-label">Teléfono</label>
                      <input type="text" className="input" value={paciente.telefono} readOnly style={{ background: "rgba(226, 232, 240, 0.4)" }} />
                    </div>
                    <div className="col" style={{ gridColumn: "span 2" }}>
                      <label className="form-label">Dirección particular</label>
                      <input type="text" name="direccion" className="input" value={formData.direccion} onChange={handleInputChange} placeholder="Ej. Av. Universidad 120" />
                    </div>
                    <div className="col">
                      <label className="form-label">Ocupación</label>
                      <input type="text" name="ocupacion" className="input" value={formData.ocupacion} onChange={handleInputChange} placeholder="Ej. Ingeniero" />
                    </div>
                    <div className="col" style={{ gridColumn: "span 3" }}>
                      <label className="form-label">Correo electrónico</label>
                      <input type="email" name="correoElectronico" className="input" value={formData.correoElectronico} onChange={handleInputChange} placeholder="Ej. correo@paciente.com" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "AnaAnte" && (
              <div className="tab-content">
                <div className="clinical-form-section">
                  <h3 className="clinical-section-title">🏥 Anamnesis General</h3>
                  <div className="clinical-grid-1">
                    <div className="col">
                      <label className="form-label">Motivo de consulta *</label>
                      <textarea name="motivoConsulta" className="textarea" placeholder="Describa a detalle el motivo de la consulta..." value={formData.motivoConsulta} onChange={handleInputChange} required />
                    </div>
                    <div className="col">
                      <label className="form-label">Diagnóstico médico</label>
                      <textarea name="diagnosticoMedico" className="textarea" placeholder="Diagnóstico oficial emitido por especialista..." value={formData.diagnosticoMedico} onChange={handleInputChange} />
                    </div>
                    <div className="col">
                      <label className="form-label">Indicaciones médicas</label>
                      <textarea name="indicacionesMedicas" className="textarea" placeholder="Indicaciones particulares dadas por el médico..." value={formData.indicacionesMedicas} onChange={handleInputChange} />
                    </div>
                  </div>
                </div>

                <div className="clinical-form-section">
                  <h3 className="clinical-section-title">⚡ Valoración del Dolor y Síntomas</h3>
                  <div className="clinical-grid-3">
                    <div className="col">
                      <label className="form-label">Escala EVA *</label>
                      <select name="eva" className="input" value={formData.eva} onChange={handleInputChange} required>
                        <option value="">Seleccione EVA</option>
                        {[...Array(11).keys()].map((num) => (
                          <option key={num} value={num}>{num} - {num === 0 ? "Sin Dolor" : num === 10 ? "Dolor Insoportable" : `Nivel ${num}`}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col">
                      <label className="form-label">Tipo de dolor</label>
                      <select name="tipo" className="input" value={formData.tipo} onChange={handleInputChange}>
                        <option value="">Seleccione</option>
                        <option value="ardon">Ardor</option>
                        <option value="quemante">Quemante</option>
                        <option value="punzante">Punzante</option>
                        <option value="pellizco">Pellizco</option>
                        <option value="muscular">Muscular</option>
                        <option value="otra">Otra</option>
                      </select>
                      {formData.tipo === "otra" && (
                        <input type="text" className="input mt-2" value={formData.tipoOtra || ""} onChange={(e) => setFormData({ ...formData, tipoOtra: e.target.value })} placeholder="Especifique tipo..." style={{ marginTop: "8px" }} />
                      )}
                    </div>
                    <div className="col">
                      <label className="form-label">Sensación</label>
                      <select name="sensacion" className="input" value={formData.sensacion} onChange={handleInputChange}>
                        <option value="">Seleccione</option>
                        <option value="hormigueo">Hormigueo</option>
                        <option value="adormecimiento">Adormecimiento</option>
                        <option value="calambre">Calambre</option>
                        <option value="rigidez">Rigidez</option>
                        <option value="otra">Otra</option>
                      </select>
                      {formData.sensacion === "otra" && (
                        <input type="text" className="input mt-2" value={formData.sensacionOtra || ""} onChange={(e) => setFormData({ ...formData, sensacionOtra: e.target.value })} placeholder="Especifique sensación..." style={{ marginTop: "8px" }} />
                      )}
                    </div>
                    <div className="col" style={{ gridColumn: "span 2" }}>
                      <label className="form-label">Dolor últimas 24hrs</label>
                      <textarea name="dolor24hrs" className="textarea" placeholder="Describa el comportamiento del dolor en las últimas 24 horas..." value={formData.dolor24hrs} onChange={handleInputChange} style={{ height: "80px" }} />
                    </div>
                    <div className="col">
                      <label className="form-label">Factores que lo modifican</label>
                      <textarea name="facModifica" className="textarea" placeholder="¿Qué aumenta o disminuye el malestar?" value={formData.facModifica} onChange={handleInputChange} style={{ height: "80px" }} />
                    </div>
                  </div>
                </div>

                <div className="clinical-form-section">
                  <h3 className="clinical-section-title">🩺 Antecedentes Clínicos</h3>
                  <div className="clinical-grid-2" style={{ marginBottom: "1rem" }}>
                    <div className="col">
                      <label className="form-label">Seleccionar Antecedentes familiares</label>
                      <select className="input" value={antecedenteSeleccionado} onChange={(e) => {
                        const val = e.target.value;
                        if (val && !formData.antecedentesFamiliares.includes(val)) {
                          setFormData(prev => ({ ...prev, antecedentesFamiliares: [...prev.antecedentesFamiliares.filter(Boolean), val] }));
                        }
                        setAntecedenteSeleccionado("");
                      }}>
                        <option value="">Añadir antecedente familiar...</option>
                        {itemsAntFam.map((item) => (
                          <option key={item._id} value={item._id}>{item.valor}</option>
                        ))}
                      </select>
                      <div className="selected-tags-container">
                        {formData.antecedentesFamiliares.filter(Boolean).map((id, index) => (
                          <span key={index} className="glass-tag">
                            {getValorAntFam(id)}
                            <button type="button" className="tag-remove-btn" onClick={() => {
                              setFormData({ ...formData, antecedentesFamiliares: formData.antecedentesFamiliares.filter(x => x !== id) });
                            }}>×</button>
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="col">
                      <label className="form-label">Seleccionar Antecedentes médicos</label>
                      <select className="input" value={antecedenteMedico} onChange={(e) => {
                        const val = e.target.value;
                        if (val && !formData.antecedentesMedicos.includes(val)) {
                          setFormData(prev => ({ ...prev, antecedentesMedicos: [...prev.antecedentesMedicos.filter(Boolean), val] }));
                        }
                        setAntecedenteMedico("");
                      }}>
                        <option value="">Añadir antecedente médico...</option>
                        {itemsAntMed.map((item) => (
                          <option key={item._id} value={item._id}>{item.valor}</option>
                        ))}
                      </select>
                      <div className="selected-tags-container">
                        {formData.antecedentesMedicos.filter(Boolean).map((id, index) => (
                          <span key={index} className="glass-tag">
                            {getValorAntMed(id)}
                            <button type="button" className="tag-remove-btn" onClick={() => {
                              setFormData({ ...formData, antecedentesMedicos: formData.antecedentesMedicos.filter(x => x !== id) });
                            }}>×</button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="clinical-grid-3">
                    <div className="col" style={{ gridColumn: "span 2" }}>
                      <label className="form-label">Medicación actual</label>
                      <textarea name="medActual" className="textarea" placeholder="Listado de fármacos y dosis..." value={formData.medActual} onChange={handleInputChange} style={{ height: "60px" }} />
                    </div>
                    <div className="col">
                      <label className="form-label">Antecedentes quirúrgicos</label>
                      <textarea name="antecedentesQuirurgicos" className="textarea" placeholder="Cirugías previas..." value={formData.antecedentesQuirurgicos} onChange={handleInputChange} style={{ height: "60px" }} />
                    </div>
                    <div className="col">
                      <label className="form-label">Año quirúrgico</label>
                      <input type="date" name="anioQuirurgico" className="input" value={formData.anioQuirurgico} onChange={handleInputChange} />
                    </div>
                  </div>
                </div>

                <div className="clinical-form-section">
                  <h3 className="clinical-section-title">🤸 Estilo de Vida y Hábitos</h3>
                  <div className="clinical-grid-3" style={{ marginBottom: "1rem" }}>
                    <div className="col">
                      <label className="form-label">Actividad física</label>
                      <select name="actividadFisica" className="input" value={antecedentesNoPatologicos.actividadFisica} onChange={handleNoPatChange}>
                        <option value="">Seleccione</option>
                        <option value="ligera">Ligera</option>
                        <option value="moderada">Moderada</option>
                        <option value="fuerte">Fuerte</option>
                      </select>
                    </div>
                    <div className="col">
                      <label className="form-label">Alimentación</label>
                      <select name="alimentacion" className="input" value={antecedentesNoPatologicos.alimentacion} onChange={handleNoPatChange}>
                        <option value="">Seleccione</option>
                        <option value="buena">Buena</option>
                        <option value="regular">Regular</option>
                        <option value="mala">Mala</option>
                      </select>
                    </div>
                    <div className="col">
                      <label className="form-label">Descanso</label>
                      <select name="descanso" className="input" value={antecedentesNoPatologicos.descanso} onChange={handleNoPatChange}>
                        <option value="">Seleccione</option>
                        <option value="bueno">Bueno</option>
                        <option value="regular">Regular</option>
                        <option value="malo">Malo</option>
                      </select>
                    </div>
                    <div className="col">
                      <label className="form-label">Nivel de estrés</label>
                      <select name="estres" className="input" value={antecedentesNoPatologicos.estres} onChange={handleNoPatChange}>
                        <option value="">Seleccione</option>
                        <option value="ligero">Ligero</option>
                        <option value="moderado">Moderado</option>
                        <option value="fuerte">Fuerte</option>
                      </select>
                    </div>
                    <div className="col" style={{ gridColumn: "span 2" }}>
                      <label className="form-label">Adicciones y sustancias</label>
                      <div style={{ display: "flex", gap: "1.5rem", marginTop: "0.6rem" }}>
                        <label className="checkbox-label-modern">
                          <input type="checkbox" checked={antecedentesNoPatologicos.adicciones.tabaquismo} onChange={() => toggleAdiccion("tabaquismo")} />
                          <span>Tabaquismo</span>
                        </label>
                        <label className="checkbox-label-modern">
                          <input type="checkbox" checked={antecedentesNoPatologicos.adicciones.alcohol} onChange={() => toggleAdiccion("alcohol")} />
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
                            <label className="checkbox-label-modern">
                              <input type="checkbox" checked={lesiones[key].activo} onChange={() => toggleLesion(key)} />
                              <span>{label}</span>
                            </label>

                            {lesiones[key].activo && (
                              <input type="text" className="input" placeholder="Especifique lugar, fecha o detalles..." value={lesiones[key].detalle} onChange={(e) => changeDetalle(key, e.target.value)} />
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
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {[
                      { key: "edema", label: "Presencia de Edema" },
                      { key: "enrojecimiento", label: "Zonas de Enrojecimiento / Eritema" },
                      { key: "esguince", label: "Secuelas de Esguince" },
                      { key: "hematoma", label: "Presencia de Hematomas" },
                      { key: "marcha", label: "Alteraciones en la Marcha" },
                      { key: "otro", label: "Otro hallazgo visual" }
                    ].map(({ key, label }) => (
                      <div key={key} style={{ display: "grid", gridTemplateColumns: "1fr 2fr", alignItems: "center", gap: "1rem" }}>
                        <label className="checkbox-label-modern">
                          <input type="checkbox" checked={obser[key].activo} onChange={() => toggleObser(key)} />
                          <span>{label}</span>
                        </label>

                        {obser[key].activo && (
                          <input type="text" className="input" placeholder="Lugar corporal, intensidad o detalles..." value={obser[key].detalle} onChange={(e) => changeObser(key, e.target.value)} />
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
                      <textarea name="dolorPalpacion" className="textarea" placeholder="Describa las regiones musculares o articulares donde el paciente refiere dolor al contacto..." value={formData.dolorPalpacion} onChange={handleInputChange} style={{ height: "100px" }} />
                    </div>
                    <div className="col">
                      <label className="form-label">Zonas de espasmo muscular</label>
                      <textarea name="espasmoPalpacion" className="textarea" placeholder="Describa contracturas, puntos gatillo o espasmos musculares detectados..." value={formData.espasmoPalpacion} onChange={handleInputChange} style={{ height: "100px" }} />
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
                      <input type="text" className="input" value={formData.idHistoricoFk} readOnly style={{ background: "rgba(226, 232, 240, 0.4)", fontWeight: "600" }} />
                    </div>
                    <div className="col">
                      <label className="form-label">Mes-Año de atención</label>
                      <input type="text" className="input" value={formData.mesAñoNota} readOnly style={{ background: "rgba(226, 232, 240, 0.4)", fontWeight: "600" }} />
                    </div>
                  </div>
                  <div className="clinical-grid-1">
                    <div className="col">
                      <label className="form-label">Contenido general de la sesión *</label>
                      <textarea name="contenidoNota" className="textarea" placeholder="Escriba un resumen global del estado del paciente en la sesión actual..." value={formData.contenidoNota || ""} onChange={handleInputChange} required style={{ height: "100px" }} />
                    </div>
                  </div>
                </div>

                <div className="clinical-form-section">
                  <h3 className="clinical-section-title">🧪 Desglose de Metodología SOAP</h3>
                  <div className="soap-grid">
                    <div className="col">
                      <label className="form-label" style={{ fontWeight: "700", color: "#4f46e5" }}>Subjetivo (S)</label>
                      <textarea name="S" className="textarea" placeholder="Subjetivo: Síntomas referidos, sensaciones y comentarios expresados por el paciente..." value={formData.S || ""} onChange={handleInputChange} style={{ height: "120px" }} />
                    </div>
                    <div className="col">
                      <label className="form-label" style={{ fontWeight: "700", color: "#06b6d4" }}>Objetivo (O)</label>
                      <textarea name="O" className="textarea" placeholder="Objetivo: Hallazgos clínicos medibles, arcos de movilidad, reflejos, postura observada..." value={formData.O || ""} onChange={handleInputChange} style={{ height: "120px" }} />
                    </div>
                    <div className="col">
                      <label className="form-label" style={{ fontWeight: "700", color: "#eab308" }}>Análisis (A)</label>
                      <textarea name="A" className="textarea" placeholder="Análisis: Juicio clínico del fisioterapeuta, evolución, hipótesis diagnóstica de la sesión..." value={formData.A || ""} onChange={handleInputChange} style={{ height: "120px" }} />
                    </div>
                    <div className="col">
                      <label className="form-label" style={{ fontWeight: "700", color: "#10b981" }}>Plan (P)</label>
                      <textarea name="P" className="textarea" placeholder="Plan: Tratamiento a seguir, número de sesiones, ejercicios en casa, derivaciones..." value={formData.P || ""} onChange={handleInputChange} style={{ height: "120px" }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "2rem" }}>
              <button type="submit" className="btn btn-primary btn-size-lg hover-grow glow-pulse-purple" disabled={loading} style={{ height: "50px", minWidth: "220px", fontSize: "1.05rem" }}>
                {loading ? <LoadingSpinner size="small" color="#fff" /> : "💾 Guardar expediente clínico"}
              </button>
            </div>
          </form>

          {mensaje && <p style={{ marginTop: 15, fontWeight: "bold", textAlign: "center", color: "var(--primary)" }}>{mensaje}</p>}
        </div>
      </div>
    </div>
  );
};

export default FormularioHistorial;
