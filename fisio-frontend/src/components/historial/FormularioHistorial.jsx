import { IoIosAddCircle } from "react-icons/io";
import { IoCaretDown } from "react-icons/io5";
import { IoCaretUp } from "react-icons/io5";
import { useState, useEffect, useRef } from "react";
import { TiDelete } from "react-icons/ti";
import InformacionClinica from "../layout/InformacionClinica";
import api from "../../api";
import { showError, showSuccess } from "../../utils/alerts";
import { useAuth } from "../../context/AuthContext";
import LoadingSpinner from "../layout/LoadingSpinner";
import { useNavigate } from "react-router-dom";

const SignaturePad = ({ label, value, onChange, placeholderName, nameValue, onNameChange, dateValue, onDateChange }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.strokeStyle = "#1e1b4b"; // Indigo stroke
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (value) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = value;
    }
  }, [value]);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;
    
    return { x, y };
  };

  const startDrawing = (e) => {
    if (e.type === "touchstart") {
      // Prevent scrolling on iOS when signing
      e.preventDefault();
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { x, y } = getCoordinates(e);
    const ctx = canvas.getContext("2d");

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    if (e.type === "touchmove") {
      e.preventDefault();
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { x, y } = getCoordinates(e);
    const ctx = canvas.getContext("2d");

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    onChange(dataUrl);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onChange("");
  };

  return (
    <div className="signature-pad-container" style={{ border: "1px solid rgba(139, 92, 246, 0.15)", borderRadius: "12px", padding: "1.25rem", background: "var(--card-bg)", boxShadow: "var(--shadow-sm)" }}>
      <label className="form-label" style={{ fontWeight: "700", color: "var(--primary)", marginBottom: "0.5rem", display: "block" }}>{label}</label>
      
      <div className="canvas-wrapper" style={{ position: "relative", background: "#ffffff", border: "1px dashed rgba(139, 92, 246, 0.25)", borderRadius: "8px", overflow: "hidden", height: "160px", marginBottom: "1rem" }}>
        <canvas
          ref={canvasRef}
          width={400}
          height={160}
          style={{ width: "100%", height: "100%", cursor: "crosshair", touchAction: "none" }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        <button
          type="button"
          onClick={clearCanvas}
          style={{
            position: "absolute",
            bottom: "10px",
            right: "10px",
            background: "rgba(239, 68, 68, 0.1)",
            color: "var(--danger)",
            border: "none",
            borderRadius: "6px",
            padding: "4px 10px",
            fontSize: "0.75rem",
            fontWeight: "700",
            cursor: "pointer"
          }}
        >
          Limpiar
        </button>
      </div>
      
      <div className="signature-fields" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <div>
          <label className="form-label" style={{ fontSize: "0.8rem", marginBottom: "4px", fontWeight: "600" }}>Nombre firma</label>
          <input
            type="text"
            className="input"
            style={{ padding: "0.45rem 0.75rem", fontSize: "0.85rem" }}
            placeholder={placeholderName}
            value={nameValue}
            onChange={(e) => onNameChange(e.target.value)}
          />
        </div>
        <div>
          <label className="form-label" style={{ fontSize: "0.8rem", marginBottom: "4px", fontWeight: "600" }}>Fecha firma</label>
          <input
            type="date"
            className="input"
            style={{ padding: "0.45rem 0.75rem", fontSize: "0.85rem" }}
            value={dateValue}
            onChange={(e) => onDateChange(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

const FormularioHistorial = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [paciente, setPaciente] = useState(null);
  const [isNewPatient, setIsNewPatient] = useState(false);
  const [newPatientData, setNewPatientData] = useState({
    nombres: "",
    apellidoPaterno: "",
    apellidoMaterno: "",
    edad: "",
    telefono: "",
    email: "",
    area: "fisioterapeuta"
  });

  const [activeTab, setActiveTab] = useState("datosPersonales");

  // Actualizar el área por defecto basada en el rol del terapeuta
  useEffect(() => {
    if (user?.role) {
      setNewPatientData(prev => ({
        ...prev,
        area: user.role === "nutriologa" ? "nutriologa" : "fisioterapeuta"
      }));
    }
  }, [user]);

  // Sincronizar el nombre del paciente para la firma
  useEffect(() => {
    if (isNewPatient) {
      const nombreCompleto = `${newPatientData.nombres} ${newPatientData.apellidoPaterno} ${newPatientData.apellidoMaterno}`.trim();
      setFormData(prev => ({
        ...prev,
        nombrePacienteFirma: nombreCompleto
      }));
    }
  }, [newPatientData.nombres, newPatientData.apellidoPaterno, newPatientData.apellidoMaterno, isNewPatient]);
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
    firmaPaciente: "",
    firmaProfesional: "",
    nombrePacienteFirma: "",
    nombreProfesionalFirma: user?.name || "",
    fechaFirmaPaciente: new Date().toISOString().split('T')[0],
    fechaFirmaProfesional: new Date().toISOString().split('T')[0],
  });

  const updateSignature = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

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

    const fecha = new Date();
    const mesAño = `${fecha.getMonth() + 1}-${fecha.getFullYear()}`;
    setMesAñoNota(mesAño);

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

    cargarAntecedentesFamiliares();
    cargarAntecedentesMedicos();

    if (!datosPaciente) {
      console.warn("dataPaciente es null — se activará el modo de creación manual");
      setIsNewPatient(true);
      setPaciente({
        nombres: "",
        apellidos: "",
        edad: "",
        telefono: "",
        identificadorPaciente: "NUEVO",
      });
      setFormData(prev => ({
        ...prev,
        mesAñoNota: mesAño,
        nombreProfesionalFirma: user?.name || "",
      }));
      return;
    }

    setIsNewPatient(false);
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
        nombrePacienteFirma: `${datosPaciente.nombres} ${datosPaciente.apellidos}`,
        nombreProfesionalFirma: user?.name || "",
      }));
    };

    cargarID();
  }, [user]);

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
      let pacienteObj = paciente;
      let finalPacienteId = paciente?.identificadorPaciente;
      let finalIdHistoricoFk = formData.idHistoricoFk;

      if (isNewPatient) {
        if (!newPatientData.nombres.trim() || !newPatientData.apellidoPaterno.trim() || !newPatientData.edad || !newPatientData.telefono.trim()) {
          showError("Datos del Paciente Incompletos", "Por favor, complete los campos obligatorios del paciente (Nombres, Apellido Paterno, Edad, Teléfono) en la pestaña Resumen.");
          setLoading(false);
          return;
        }

        try {
          const resPaciente = await api.post("/pacientes", {
            nombres: newPatientData.nombres,
            apellidoPaterno: newPatientData.apellidoPaterno,
            apellidoMaterno: newPatientData.apellidoMaterno,
            edad: parseInt(newPatientData.edad),
            telefono: newPatientData.telefono,
            email: formData.correoElectronico || newPatientData.email,
            area: newPatientData.area
          });
          pacienteObj = resPaciente.data.paciente;
          finalPacienteId = pacienteObj.identificadorPaciente;
        } catch (err) {
          console.error("Error al registrar paciente:", err);
          const errMsg = err.response?.data?.message || "No se pudo registrar al paciente antes de guardar el historial.";
          showError("Error al registrar paciente", errMsg);
          setLoading(false);
          return;
        }

        // Generar ID de nota
        const idGenerado = await generarIdNotaFront(pacienteObj, mesAñoNota);
        if (!idGenerado) {
          setLoading(false);
          return;
        }
        finalIdHistoricoFk = idGenerado;
      }

      if (!finalPacienteId) {
        showError("Error", "No hay datos del paciente");
        setLoading(false);
        return;
      }

      if (!formData.firmaPaciente || !formData.firmaProfesional) {
        showError("Firmas requeridas", "Por favor, complete las firmas del paciente y del profesional en la pestaña de Consentimiento Informado antes de guardar.");
        setLoading(false);
        return;
      }

      const historialData = {
        identificadorPaciente: finalPacienteId,
        idHistorial: finalIdHistoricoFk,
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
        obser: obser,
        firmaPaciente: formData.firmaPaciente || "",
        firmaProfesional: formData.firmaProfesional || "",
        nombrePacienteFirma: formData.nombrePacienteFirma || "",
        nombreProfesionalFirma: formData.nombreProfesionalFirma || "",
        fechaFirmaPaciente: formData.fechaFirmaPaciente || "",
        fechaFirmaProfesional: formData.fechaFirmaProfesional || "",
      };

      const notaData = {
        identificadorPaciente: finalPacienteId,
        idHistorialFk: "",
        idHistoricoFk: finalIdHistoricoFk,
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
      
      if (isNewPatient) {
        localStorage.removeItem("dataPaciente");
      }
      
      navigate(`/${user?.role || 'fisioterapeuta'}/pacientes`);
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
        {paciente && !isNewPatient && <InformacionClinica paciente={paciente} />}

        <div className="auth-card auth-card-detail" style={{ marginTop: "1rem", padding: "2.5rem" }}>
          <div className="card-header-split" style={{ marginBottom: "1.5rem" }}>
            <h2 className="title_card" style={{ margin: 0 }}>Crear Historial Clínico</h2>
            <span className="subtitle-card-badge">Expediente Digital</span>
          </div>
          <hr style={{ marginBottom: "1.5rem" }} />
          
          <div className="tabs" style={{ marginBottom: "2rem" }}>
            <button type="button" className={`tab ${activeTab === "datosPersonales" ? "active" : ""}`} onClick={() => setActiveTab("datosPersonales")}>Resumen</button>
            <button type="button" className={`tab ${activeTab === "AnaAnte" ? "active" : ""}`} onClick={() => setActiveTab("AnaAnte")}>Anamnesis y Antecedentes</button>
            <button type="button" className={`tab ${activeTab === "evaluacion" ? "active" : ""}`} onClick={() => setActiveTab("evaluacion")}>Evaluación Física</button>
            <button type="button" className={`tab ${activeTab === "soap" ? "active" : ""}`} onClick={() => setActiveTab("soap")}>Notas SOAP</button>
            <button type="button" className={`tab ${activeTab === "consentimiento" ? "active" : ""}`} onClick={() => setActiveTab("consentimiento")}>Consentimiento Informado</button>
          </div>

          <form className="form" onSubmit={handleSubmit}>
            {activeTab === "datosPersonales" && paciente && (
              <div className="tab-content">
                <div className="clinical-form-section">
                  <h3 className="clinical-section-title">👤 Información Básica</h3>
                  <div className="clinical-grid-3">
                    {isNewPatient ? (
                      <>
                        <div className="col" style={{ gridColumn: "span 2" }}>
                          <label className="form-label">Nombres *</label>
                          <input 
                            type="text" 
                            className="input" 
                            value={newPatientData.nombres} 
                            onChange={(e) => setNewPatientData(prev => ({ ...prev, nombres: e.target.value }))} 
                            required 
                            placeholder="Nombres"
                          />
                        </div>
                        <div className="col">
                          <label className="form-label">Apellido Paterno *</label>
                          <input 
                            type="text" 
                            className="input" 
                            value={newPatientData.apellidoPaterno} 
                            onChange={(e) => setNewPatientData(prev => ({ ...prev, apellidoPaterno: e.target.value }))} 
                            required 
                            placeholder="Apellido Paterno"
                          />
                        </div>
                        <div className="col">
                          <label className="form-label">Apellido Materno</label>
                          <input 
                            type="text" 
                            className="input" 
                            value={newPatientData.apellidoMaterno} 
                            onChange={(e) => setNewPatientData(prev => ({ ...prev, apellidoMaterno: e.target.value }))} 
                            placeholder="Apellido Materno"
                          />
                        </div>
                        <div className="col">
                          <label className="form-label">Edad *</label>
                          <input 
                            type="number" 
                            className="input" 
                            value={newPatientData.edad} 
                            onChange={(e) => setNewPatientData(prev => ({ ...prev, edad: e.target.value }))} 
                            required 
                            placeholder="Ej. 30"
                            min="1"
                          />
                        </div>
                        <div className="col">
                          <label className="form-label">Área / Especialidad *</label>
                          <select 
                            className="input" 
                            value={newPatientData.area} 
                            onChange={(e) => setNewPatientData(prev => ({ ...prev, area: e.target.value }))} 
                            required
                          >
                            <option value="fisioterapeuta">Fisioterapia</option>
                            <option value="nutriologa">Nutriología</option>
                          </select>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="col" style={{ gridColumn: "span 2" }}>
                          <label className="form-label">Nombre completo</label>
                          <input type="text" className="input" value={`${paciente.nombres} ${paciente.apellidos}`} readOnly style={{ background: "rgba(226, 232, 240, 0.4)" }} />
                        </div>
                        <div className="col">
                          <label className="form-label">Edad (Años)</label>
                          <input type="text" className="input" value={paciente.edad} readOnly style={{ background: "rgba(226, 232, 240, 0.4)" }} />
                        </div>
                      </>
                    )}
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
                      <label className="form-label">Teléfono *</label>
                      {isNewPatient ? (
                        <input 
                          type="text" 
                          className="input" 
                          value={newPatientData.telefono} 
                          onChange={(e) => setNewPatientData(prev => ({ ...prev, telefono: e.target.value }))} 
                          required 
                          placeholder="Ej. 5512345678"
                        />
                      ) : (
                        <input type="text" className="input" value={paciente.telefono} readOnly style={{ background: "rgba(226, 232, 240, 0.4)" }} />
                      )}
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

            {activeTab === "consentimiento" && paciente && (
              <div className="tab-content">
                <div className="clinical-form-section" style={{ background: "#ffffff", border: "1px solid var(--border-light)", boxShadow: "var(--shadow-md)", padding: "2.5rem", borderRadius: "16px", color: "#1e293b", fontFamily: "var(--font-family-display, inherit)", lineHeight: "1.6" }}>
                  
                  <div style={{ textAlign: "center", marginBottom: "2.5rem", borderBottom: "2px double var(--primary-light)", paddingBottom: "1.5rem" }}>
                    <h2 style={{ textTransform: "uppercase", fontSize: "1.4rem", letterSpacing: "1px", fontWeight: "900", color: "var(--primary)", margin: "0 0 5px 0" }}>Consentimiento Informado</h2>
                    <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "600" }}>SERVICIO DE FISIOTERAPIA - FISIOHESOU</span>
                  </div>

                  <div style={{ marginBottom: "1.5rem" }}>
                    <h4 style={{ fontWeight: "800", color: "var(--primary)", borderBottom: "1px solid var(--border-light)", paddingBottom: "4px", marginBottom: "8px", fontSize: "1rem" }}>1. Información General</h4>
                    <p style={{ margin: 0, fontSize: "0.95rem", textAlign: "justify" }}>
                      Yo, <input type="text" value={formData.nombrePacienteFirma} onChange={(e) => updateSignature("nombrePacienteFirma", e.target.value)} style={{ border: "none", borderBottom: "1px solid #1e293b", padding: "0 5px", fontWeight: "700", color: "var(--primary)", width: "320px", background: "transparent" }} placeholder="Nombre del paciente" /> declaro que he sido debidamente informado/a sobre la naturaleza del tratamiento que recibiré en este consultorio, incluyendo los beneficios, riesgos y alternativas disponibles.
                    </p>
                  </div>

                  <div style={{ marginBottom: "1.5rem" }}>
                    <h4 style={{ fontWeight: "800", color: "var(--primary)", borderBottom: "1px solid var(--border-light)", paddingBottom: "4px", marginBottom: "8px", fontSize: "1rem" }}>2. Detalles del Tratamiento</h4>
                    <p style={{ margin: "0 0 6px 0", fontSize: "0.95rem" }}>
                      <strong>Tipo de tratamiento:</strong> Fisioterapia
                    </p>
                    <p style={{ margin: "0 0 10px 0", fontSize: "0.95rem" }}>
                      <strong>Profesional a cargo:</strong> <input type="text" value={formData.nombreProfesionalFirma} onChange={(e) => updateSignature("nombreProfesionalFirma", e.target.value)} style={{ border: "none", borderBottom: "1px solid #1e293b", padding: "0 5px", fontWeight: "700", color: "var(--primary)", width: "320px", background: "transparent" }} placeholder="Nombre del profesional" />
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
                    <SignaturePad
                      label="✍️ Firma del Paciente"
                      value={formData.firmaPaciente}
                      onChange={(val) => updateSignature("firmaPaciente", val)}
                      placeholderName="Nombre del Paciente"
                      nameValue={formData.nombrePacienteFirma}
                      onNameChange={(val) => updateSignature("nombrePacienteFirma", val)}
                      dateValue={formData.fechaFirmaPaciente}
                      onDateChange={(val) => updateSignature("fechaFirmaPaciente", val)}
                    />

                    <SignaturePad
                      label="🩺 Firma del Profesional de la Salud"
                      value={formData.firmaProfesional}
                      onChange={(val) => updateSignature("firmaProfesional", val)}
                      placeholderName="Nombre del Fisioterapeuta"
                      nameValue={formData.nombreProfesionalFirma}
                      onNameChange={(val) => updateSignature("nombreProfesionalFirma", val)}
                      dateValue={formData.fechaFirmaProfesional}
                      onDateChange={(val) => updateSignature("fechaFirmaProfesional", val)}
                    />
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
