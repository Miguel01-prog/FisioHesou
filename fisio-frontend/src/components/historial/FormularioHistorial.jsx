import { IoIosAddCircle } from "react-icons/io";
import { FiTrash2 } from "react-icons/fi";
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

const SignaturePad = ({ label, value, onChange, placeholderName, nameValue, onNameChange, dateValue, onDateChange, readOnly }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  console.log("SignaturePad rendering [" + label + "], value length:", value ? value.length : 0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.log("SignaturePad canvas is null for label:", label);
      return;
    }
    console.log("SignaturePad drawing image for label:", label, "value length:", value ? value.length : 0);
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
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
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
    if (readOnly) return;
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
    if (readOnly || !isDrawing) return;
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
    if (readOnly || !isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    onChange(dataUrl);
  };

  const clearCanvas = () => {
    if (readOnly) return;
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
          style={{ width: "100%", height: "100%", cursor: readOnly ? "default" : "crosshair", touchAction: "none" }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {!readOnly && (
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
        )}
      </div>

      <div className="signature-fields" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px" }}>
        <div>
          <label className="form-label" style={{ fontSize: "0.8rem", marginBottom: "4px", fontWeight: "600" }}>Nombre firma</label>
          <input
            type="text"
            className="input"
            style={{ padding: "0.45rem 0.75rem", fontSize: "0.85rem", background: "rgba(226, 232, 240, 0.45)", fontWeight: "600" }}
            placeholder={placeholderName}
            value={nameValue}
            onChange={(e) => !readOnly && onNameChange(e.target.value)}
            readOnly={true}
          />
        </div>
        <div>
          <label className="form-label" style={{ fontSize: "0.8rem", marginBottom: "4px", fontWeight: "600" }}>Fecha firma</label>
          <input
            type="date"
            className="input"
            style={{ padding: "0.45rem 0.75rem", fontSize: "0.85rem", background: "rgba(226, 232, 240, 0.45)", fontWeight: "600" }}
            value={dateValue}
            onChange={(e) => !readOnly && onDateChange(e.target.value)}
            readOnly={true}
          />
        </div>
      </div>
    </div>
  );
};

const FormularioHistorial = () => {
  const { user } = useAuth();
  console.log("FormularioHistorial render. user signature length:", user?.signature ? user.signature.length : 0);
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
  const [itemsAntFam, setItemsAntFam] = useState([]);
  const [antecedenteSeleccionado, setAntecedenteSeleccionado] = useState("");
  const [familiarSeleccionado, setFamiliarSeleccionado] = useState("");
  const [itemsAntMed, setItemsAntMed] = useState([]);
  const [antecedenteMedico, setAntecedenteMedico] = useState("");
  const [anioSeleccionado, setAnioSeleccionado] = useState("");
  const [edadEditable, setEdadEditable] = useState("");
  const [hasDraft, setHasDraft] = useState(false);


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
    dolorZonas: [],
    actividadesDeficiencia: "",
    firmaPaciente: "",
    firmaProfesional: user?.signature || "",
    nombrePacienteFirma: "",
    nombreProfesionalFirma: user?.name || "",
    fechaFirmaPaciente: new Date().toISOString().split('T')[0],
    fechaFirmaProfesional: new Date().toISOString().split('T')[0],
  });

  const [aplicaFam, setAplicaFam] = useState(false);
  const [aplicaMed, setAplicaMed] = useState(false);

  // States for adding multiple pain zones
  const [nuevaZona, setNuevaZona] = useState("");
  const [nuevaZonaEva, setNuevaZonaEva] = useState("");
  const [nuevaZonaComentario, setNuevaZonaComentario] = useState("");
  const [nuevaZonaOtra, setNuevaZonaOtra] = useState("");

  const agregarDolorZona = () => {
    const zonaFinal = nuevaZona === "otra" ? nuevaZonaOtra : nuevaZona;
    if (!zonaFinal || zonaFinal.trim() === "") {
      showError("Datos faltantes", "Por favor seleccione o escriba la zona que duele.");
      return;
    }
    if (nuevaZonaEva === "") {
      showError("Datos faltantes", "Por favor seleccione el nivel de dolor (EVA) para esta zona.");
      return;
    }

    const nuevaZonaObj = {
      zona: zonaFinal.trim(),
      eva: Number(nuevaZonaEva),
      comentario: nuevaZonaComentario.trim()
    };

    setFormData(prev => ({
      ...prev,
      dolorZonas: [...(prev.dolorZonas || []), nuevaZonaObj]
    }));

    // Reset local inputs
    setNuevaZona("");
    setNuevaZonaEva("");
    setNuevaZonaComentario("");
    setNuevaZonaOtra("");
  };

  const eliminarDolorZona = (index) => {
    setFormData(prev => {
      const copia = [...(prev.dolorZonas || [])];
      copia.splice(index, 1);
      return { ...prev, dolorZonas: copia };
    });
  };
  const [selectedSensaciones, setSelectedSensaciones] = useState([]);
  const [sensacionOtra, setSensacionOtra] = useState("");

  const handleSensacionCheckboxChange = (option, checked) => {
    setSelectedSensaciones(prev => {
      let updated = [...prev];
      if (checked) {
        if (!updated.includes(option)) updated.push(option);
      } else {
        updated = updated.filter(item => item !== option);
      }

      // Sync with formData
      let finalSensaciones = [...updated];
      const index = finalSensaciones.indexOf("otra");
      if (index !== -1) {
        if (sensacionOtra.trim() !== "") {
          finalSensaciones[index] = sensacionOtra.trim();
        } else {
          finalSensaciones.splice(index, 1);
        }
      }
      setFormData(prevForm => ({
        ...prevForm,
        sensacion: finalSensaciones.join(", ")
      }));

      return updated;
    });
  };

  const handleSensacionOtraChange = (val) => {
    setSensacionOtra(val);

    // Sync with formData
    let finalSensaciones = [...selectedSensaciones];
    const index = finalSensaciones.indexOf("otra");
    if (index !== -1) {
      if (val.trim() !== "") {
        finalSensaciones[index] = val.trim();
      } else {
        finalSensaciones.splice(index, 1);
      }
    }
    setFormData(prev => ({
      ...prev,
      sensacion: finalSensaciones.join(", ")
    }));
  };

  useEffect(() => {
    if (formData.antecedentesFamiliares && formData.antecedentesFamiliares.length > 0) {
      setAplicaFam(true);
    }
    if (formData.antecedentesMedicos && formData.antecedentesMedicos.length > 0) {
      setAplicaMed(true);
    }
  }, [formData.antecedentesFamiliares, formData.antecedentesMedicos]);

  const toggleAplicaFam = (checked) => {
    setAplicaFam(checked);
    if (!checked) {
      setFormData(prev => ({ ...prev, antecedentesFamiliares: [] }));
    }
  };

  const toggleAplicaMed = (checked) => {
    setAplicaMed(checked);
    if (!checked) {
      setFormData(prev => ({ ...prev, antecedentesMedicos: [] }));
    }
  };

  const getValorAntFam = (id) => {
    if (!id) return "";
    const [cleanId, year] = id.split("|");
    const found = itemsAntFam.find(item => item._id === cleanId);
    const label = found ? found.valor : cleanId;
    return year ? `${label} (${year})` : label;
  };

  const getValorAntMed = (id) => {
    if (!id) return "";
    const [cleanId, year] = id.split("|");
    const found = itemsAntMed.find(item => item._id === cleanId);
    const label = found ? found.valor : cleanId;
    return year ? `${label} (${year})` : label;
  };

  const handleSelectAntecedent = (val, isFamily) => {
    const listKey = isFamily ? "antecedentesFamiliares" : "antecedentesMedicos";
    const currentList = formData[listKey] || [];
    const cleanVal = val.split("|")[0];
    if (val && !currentList.some(x => x && x.split("|")[0] === cleanVal)) {
      setFormData(prev => ({
        ...prev,
        [listKey]: [...currentList.filter(Boolean), `${cleanVal}|`]
      }));
    }
  };

  const handleRemoveAntecedent = (cleanId, isFamily) => {
    const listKey = isFamily ? "antecedentesFamiliares" : "antecedentesMedicos";
    const currentList = formData[listKey] || [];
    setFormData(prev => ({
      ...prev,
      [listKey]: currentList.filter(x => x && x.split("|")[0] !== cleanId)
    }));
  };

  const handleTagYearChange = (cleanId, yearVal, isFamily) => {
    const listKey = isFamily ? "antecedentesFamiliares" : "antecedentesMedicos";
    const currentList = formData[listKey] || [];
    setFormData(prev => ({
      ...prev,
      [listKey]: currentList.map(x => {
        if (x && x.split("|")[0] === cleanId) {
          return `${cleanId}|${yearVal.trim()}`;
        }
        return x;
      })
    }));
  };

  const [aplicaMedActual, setAplicaMedActual] = useState(false);

  useEffect(() => {
    if (formData.medActual && formData.medActual !== "Ninguna" && formData.medActual.trim() !== "") {
      setAplicaMedActual(true);
    } else {
      setAplicaMedActual(false);
    }
  }, [formData.medActual]);

  const toggleAplicaMedActual = (checked) => {
    setAplicaMedActual(checked);
    setFormData(prev => ({
      ...prev,
      medActual: checked ? "" : "Ninguna"
    }));
  };

  const [aplicaQuirurgico, setAplicaQuirurgico] = useState(false);
  const [surgicalEntries, setSurgicalEntries] = useState([{ id: 1, name: "", date: "" }]);

  useEffect(() => {
    if (formData.antecedentesQuirurgicos && formData.antecedentesQuirurgicos !== "Ninguno" && formData.antecedentesQuirurgicos.trim() !== "") {
      setAplicaQuirurgico(true);

      const parts = formData.antecedentesQuirurgicos.split(", ");
      const parsed = parts.map((part, index) => {
        const match = part.match(/(.*)\s*\((.*)\)/);
        if (match) {
          return { id: index + 1, name: match[1].trim(), date: match[2].trim() };
        }
        return { id: index + 1, name: part.trim(), date: "" };
      });
      if (parsed.length > 0) {
        setSurgicalEntries(parsed);
      }
    } else {
      setAplicaQuirurgico(false);
    }
  }, [formData.antecedentesQuirurgicos]);

  useEffect(() => {
    if (!aplicaQuirurgico) {
      if (formData.antecedentesQuirurgicos !== "Ninguno") {
        setFormData(prev => ({ ...prev, antecedentesQuirurgicos: "Ninguno", anioQuirurgico: "" }));
      }
      return;
    }

    const formatted = surgicalEntries
      .filter(e => e.name.trim())
      .map(e => e.date ? `${e.name.trim()} (${e.date})` : e.name.trim())
      .join(", ");

    const firstDate = surgicalEntries.find(e => e.date)?.date || "";

    if (formData.antecedentesQuirurgicos !== formatted || formData.anioQuirurgico !== firstDate) {
      setFormData(prev => ({
        ...prev,
        antecedentesQuirurgicos: formatted || "Ninguno",
        anioQuirurgico: firstDate
      }));
    }
  }, [surgicalEntries, aplicaQuirurgico]);

  const addSurgicalEntry = () => {
    setSurgicalEntries(prev => [...prev, { id: Date.now() + Math.random(), name: "", date: "" }]);
  };

  const removeSurgicalEntry = (id) => {
    setSurgicalEntries(prev => {
      const filtered = prev.filter(e => e.id !== id);
      return filtered.length > 0 ? filtered : [{ id: Date.now(), name: "", date: "" }];
    });
  };

  const updateSurgicalEntry = (id, field, value) => {
    setSurgicalEntries(prev => prev.map(e => {
      if (e.id === id) {
        return { ...e, [field]: value };
      }
      return e;
    }));
  };

  const [nuevoID, setNuevoID] = useState("");
  const [mesAñoNota, setMesAñoNota] = useState("");

  // Generar ID de nota de forma automática cuando se ingresen nombres y apellidos para pacientes nuevos manuales
  useEffect(() => {
    if (!isNewPatient) return;

    const name = newPatientData.nombres?.trim();
    const paterno = newPatientData.apellidoPaterno?.trim();

    if (!name || !paterno || !mesAñoNota) {
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const fakePaciente = {
          nombres: name,
          apellidos: `${paterno} ${newPatientData.apellidoMaterno || ""}`.trim(),
          identificadorPaciente: "NUEVO"
        };
        const idGenerado = await generarIdNotaFront(fakePaciente, mesAñoNota);
        if (idGenerado) {
          setNuevoID(idGenerado);
          setFormData(prev => ({
            ...prev,
            idHistoricoFk: idGenerado
          }));
        }
      } catch (err) {
        console.error("Error generando ID para paciente manual:", err);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [newPatientData.nombres, newPatientData.apellidoPaterno, newPatientData.apellidoMaterno, isNewPatient, mesAñoNota]);

  // Pre-fill professional signature when user profile data loads
  useEffect(() => {
    console.log("Pre-fill effect triggered. user signature:", !!user?.signature, "formData.firmaProfesional:", !!formData.firmaProfesional);
    if (user?.signature && !formData.firmaProfesional) {
      console.log("Pre-filling professional signature into formData with length:", user.signature.length);
      setFormData(prev => ({
        ...prev,
        firmaProfesional: user.signature
      }));
    }
  }, [user?.signature, formData.firmaProfesional]);

  // Auto-save draft on form input changes
  useEffect(() => {
    // Avoid saving initial empty states
    if (!formData.motivoConsulta && !formData.ocupacion && !newPatientData.nombres && !formData.contenidoNota) {
      return;
    }
    const draft = {
      formData,
      lesiones,
      obser,
      antecedentesNoPatologicos,
      isNewPatient,
      newPatientData,
      paciente
    };
    localStorage.setItem("historial_clinico_borrador", JSON.stringify(draft));
  }, [formData, lesiones, obser, antecedentesNoPatologicos, isNewPatient, newPatientData, paciente]);

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

    // Check for draft and load it if exists
    const savedDraft = localStorage.getItem("historial_clinico_borrador");
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        if (draft.formData) {
          setFormData(draft.formData);
          if (draft.formData.sensacion) {
            const list = draft.formData.sensacion.split(", ").map(s => s.trim());
            const predefined = ["hormigueo", "adormecimiento", "calambre", "rigidez"];
            const currentSelected = list.filter(item => predefined.includes(item.toLowerCase()));
            const customList = list.filter(item => !predefined.includes(item.toLowerCase()));
            if (customList.length > 0) {
              currentSelected.push("otra");
              setSensacionOtra(customList.join(", "));
            }
            setSelectedSensaciones(currentSelected);
          }
        }
        if (draft.lesiones) setLesiones(draft.lesiones);
        if (draft.obser) setObser(draft.obser);
        if (draft.antecedentesNoPatologicos) setAntecedentesNoPatologicos(draft.antecedentesNoPatologicos);
        if (draft.isNewPatient !== undefined) setIsNewPatient(draft.isNewPatient);
        if (draft.newPatientData) setNewPatientData(draft.newPatientData);
        if (draft.paciente) setPaciente(draft.paciente);
        setHasDraft(true);
        return; // Skip loading normal patient data to preserve draft!
      } catch (err) {
        console.error("Error cargando borrador:", err);
      }
    }

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
    setEdadEditable(datosPaciente.edad || "");

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
    let cleaned = value;
    if (typeof value === "string") {
      if (value.endsWith(" ")) {
        cleaned = value.replace(/\s+/g, " ");
      } else {
        cleaned = value.replace(/\s+/g, " ").trimStart();
      }
    }
    setFormData((prev) => ({ ...prev, [name]: cleaned }));
  };

  const handleInputBlur = (e) => {
    const { name, value } = e.target;
    if (!name) return;

    if (typeof value === "string") {
      const cleaned = value.replace(/\s+/g, " ").trim();

      // If it is one of the new patient fields, update newPatientData
      if (["nombres", "apellidoPaterno", "apellidoMaterno", "edad", "telefono"].includes(name)) {
        setNewPatientData(prev => ({
          ...prev,
          [name]: cleaned
        }));
      } else {
        // Otherwise update formData
        setFormData((prev) => ({
          ...prev,
          [name]: cleaned
        }));
      }
    }
  };

  const handleNewPatientChange = (field, value) => {
    let cleaned = value;
    if (typeof value === "string") {
      if (value.endsWith(" ")) {
        cleaned = value.replace(/\s+/g, " ");
      } else {
        cleaned = value.replace(/\s+/g, " ").trimStart();
      }
    }
    setNewPatientData(prev => ({ ...prev, [field]: cleaned }));
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
        edad: edadEditable ? Number(edadEditable) : undefined,
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
        dolorZonas: formData.dolorZonas || [],
        actividadesDeficiencia: formData.actividadesDeficiencia || "",
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

      showSuccess("¡Historial Guardado!", "El historial se ha creado exitosamente.");

      // Clear draft locally
      localStorage.removeItem("historial_clinico_borrador");
      setHasDraft(false);

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
          </div>
          <hr style={{ marginBottom: "1.5rem" }} />

          {hasDraft && (
            <div style={{
              background: "rgba(245, 158, 11, 0.1)",
              border: "1px solid rgba(245, 158, 11, 0.25)",
              color: "#f59e0b",
              padding: "0.85rem 1.25rem",
              borderRadius: "10px",
              fontSize: "0.85rem",
              marginBottom: "1.5rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}>
              <span>
                ⚠️ <strong>Borrador local cargado:</strong> Tienes cambios sin guardar localmente en este navegador. Recuerda presionar "Guardar Historial" al final para registrarlos en el servidor.
              </span>
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem("historial_clinico_borrador");
                  setHasDraft(false);
                  window.location.reload();
                }}
                className="btn btn-outline"
                style={{ padding: "4px 8px", fontSize: "0.75rem", height: "26px", borderColor: "rgba(245,158,11,0.3)", color: "#f59e0b" }}
              >
                Descartar Borrador
              </button>
            </div>
          )}

          <div className="tabs" style={{ marginBottom: "2rem" }}>
            <button type="button" className={`tab ${activeTab === "datosPersonales" ? "active" : ""}`} onClick={() => setActiveTab("datosPersonales")}>👤 Resumen</button>
            <button type="button" className={`tab ${activeTab === "AnaAnte" ? "active" : ""}`} onClick={() => setActiveTab("AnaAnte")}>🏥 Anamnesis y Antecedentes</button>
            <button type="button" className={`tab ${activeTab === "evaluacion" ? "active" : ""}`} onClick={() => setActiveTab("evaluacion")}>🔍 Evaluación Física</button>
            <button type="button" className={`tab ${activeTab === "soap" ? "active" : ""}`} onClick={() => setActiveTab("soap")}>
              📝 Notas SOAP {!formData.contenidoNota?.trim() && <span style={{ color: "#ef4444", fontSize: "0.8rem", marginLeft: "4px" }} title="Nota SOAP pendiente de registrar">⚠️</span>}
            </button>
            <button type="button" className={`tab ${activeTab === "consentimiento" ? "active" : ""}`} onClick={() => setActiveTab("consentimiento")}>✍️ Consentimiento</button>
          </div>

          <form className="form" onSubmit={handleSubmit} onBlur={handleInputBlur}>
            {activeTab === "datosPersonales" && paciente && (
              <div className="tab-content">
                <div className="clinical-form-section">
                  <h3 className="clinical-section-title">👤 Información Básica</h3>
                  <div className="clinical-grid-3">
                    {isNewPatient ? (
                      <>
                        <div className="col col-span-2">
                          <label className="form-label">Nombres *</label>
                          <input
                            type="text"
                            name="nombres"
                            className="input"
                            value={newPatientData.nombres}
                            onChange={(e) => handleNewPatientChange("nombres", e.target.value)}
                            required
                            placeholder="Nombres"
                          />
                        </div>
                        <div className="col">
                          <label className="form-label">Apellido Paterno *</label>
                          <input
                            type="text"
                            name="apellidoPaterno"
                            className="input"
                            value={newPatientData.apellidoPaterno}
                            onChange={(e) => handleNewPatientChange("apellidoPaterno", e.target.value)}
                            required
                            placeholder="Apellido Paterno"
                          />
                        </div>
                        <div className="col">
                          <label className="form-label">Apellido Materno</label>
                          <input
                            type="text"
                            name="apellidoMaterno"
                            className="input"
                            value={newPatientData.apellidoMaterno}
                            onChange={(e) => handleNewPatientChange("apellidoMaterno", e.target.value)}
                            placeholder="Apellido Materno"
                          />
                        </div>
                        <div className="col">
                          <label className="form-label">Edad *</label>
                          <input
                            type="number"
                            name="edad"
                            className="input"
                            value={newPatientData.edad}
                            onChange={(e) => handleNewPatientChange("edad", e.target.value)}
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
                        <div className="col col-span-2">
                          <label className="form-label">Nombre completo</label>
                          <input type="text" className="input" value={`${paciente.nombres || ""} ${paciente.apellidos || ""}`.replace(/\s+/g, ' ').trim()} readOnly style={{ background: "rgba(226, 232, 240, 0.4)" }} />
                        </div>
                        <div className="col">
                          <label className="form-label">Edad (Años)</label>
                          {!paciente.edad || paciente.edad === 0 || paciente.edad === "0" || paciente.edad === "No especificada" ? (
                            <input
                              type="number"
                              className="input"
                              value={edadEditable}
                              onChange={(e) => setEdadEditable(e.target.value)}
                              placeholder="Ej. 30"
                              min="1"
                            />
                          ) : (
                            <input type="text" className="input" value={paciente.edad} readOnly style={{ background: "rgba(226, 232, 240, 0.4)" }} />
                          )}
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
                          name="telefono"
                          className="input"
                          value={newPatientData.telefono}
                          onChange={(e) => handleNewPatientChange("telefono", e.target.value)}
                          required
                          placeholder="Ej. 5512345678"
                        />
                      ) : (
                        <input type="text" className="input" value={paciente.telefono} readOnly style={{ background: "rgba(226, 232, 240, 0.4)" }} />
                      )}
                    </div>
                    <div className="col col-span-2">
                      <label className="form-label">Dirección particular</label>
                      <input type="text" name="direccion" className="input" value={formData.direccion} onChange={handleInputChange} placeholder="Ej. Av. Universidad 120" />
                    </div>
                    <div className="col">
                      <label className="form-label">Ocupación</label>
                      <input type="text" name="ocupacion" className="input" value={formData.ocupacion} onChange={handleInputChange} placeholder="Ej. Ingeniero" />
                    </div>
                    <div className="col col-span-3">
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
                      Yo, <strong style={{ borderBottom: "1px solid #1e293b", padding: "0 5px", fontWeight: "700", color: "var(--primary)" }}>{formData.nombrePacienteFirma || (paciente && `${paciente.nombres} ${paciente.apellidoPaterno} ${paciente.apellidoMaterno || ""}`.trim())}</strong> declaro que he sido debidamente informado/a sobre la naturaleza del tratamiento que recibiré en este consultorio, incluyendo los beneficios, riesgos y alternativas disponibles.
                    </p>
                  </div>

                  <div style={{ marginBottom: "1.5rem" }}>
                    <h4 style={{ fontWeight: "800", color: "var(--primary)", borderBottom: "1px solid var(--border-light)", paddingBottom: "4px", marginBottom: "8px", fontSize: "1rem" }}>2. Detalles del Tratamiento</h4>
                    <p style={{ margin: "0 0 6px 0", fontSize: "0.95rem" }}>
                      <strong>Tipo de tratamiento:</strong> Fisioterapia
                    </p>
                    <p style={{ margin: "0 0 10px 0", fontSize: "0.95rem" }}>
                      <strong>Profesional a cargo:</strong> <strong style={{ borderBottom: "1px solid #1e293b", padding: "0 5px", fontWeight: "700", color: "var(--primary)" }}>{formData.nombreProfesionalFirma || user?.name || ""}</strong>
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

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "2rem", borderTop: "1px dashed var(--border-light)", paddingTop: "2rem" }}>
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
                      readOnly={true}
                    />
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
                      <label className="form-label">Motivo de consulta *</label>
                      <textarea name="motivoConsulta" className="textarea" placeholder="Describa a detalle el motivo de la consulta..." value={formData.motivoConsulta} onChange={handleInputChange} required style={{ height: "100px" }} />
                    </div>
                    <div className="col" style={{ margin: 0 }}>
                      <label className="form-label">Diagnóstico médico</label>
                      <textarea name="diagnosticoMedico" className="textarea" placeholder="Diagnóstico oficial emitido por especialista..." value={formData.diagnosticoMedico} onChange={handleInputChange} style={{ height: "100px" }} />
                    </div>
                  </div>
                  <div className="clinical-grid-1">
                    <div className="col" style={{ margin: 0 }}>
                      <label className="form-label">Indicaciones médicas</label>
                      <textarea name="indicacionesMedicas" className="textarea" placeholder="Indicaciones particulares dadas por el médico..." value={formData.indicacionesMedicas} onChange={handleInputChange} style={{ height: "80px" }} />
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
                    <div className="col" style={{ gridColumn: "1 / -1" }}>
                      <label className="form-label" style={{ marginBottom: "0.75rem" }}>Sensación (Seleccione varias si aplica)</label>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem", padding: "0.5rem 0" }}>
                        {[
                          { key: "hormigueo", label: "Hormigueo" },
                          { key: "adormecimiento", label: "Adormecimiento" },
                          { key: "calambre", label: "Calambre" },
                          { key: "rigidez", label: "Rigidez" },
                          { key: "otra", label: "Otra" }
                        ].map((opt) => (
                          <label
                            key={opt.key}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              cursor: "pointer",
                              fontSize: "0.9rem",
                              color: "var(--text-main)",
                              fontWeight: "600"
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={selectedSensaciones.includes(opt.key)}
                              onChange={(e) => handleSensacionCheckboxChange(opt.key, e.target.checked)}
                              style={{
                                width: "17px",
                                height: "17px",
                                accentColor: "var(--primary)",
                                cursor: "pointer"
                              }}
                            />
                            {opt.label}
                          </label>
                        ))}
                      </div>

                      {selectedSensaciones.includes("otra") && (
                        <input
                          type="text"
                          className="input"
                          value={sensacionOtra}
                          onChange={(e) => handleSensacionOtraChange(e.target.value)}
                          placeholder="Especifique otra sensación..."
                          style={{ marginTop: "10px", width: "100%", maxWidth: "350px" }}
                        />
                      )}
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginTop: "1.5rem" }}>
                    <div className="col" style={{ margin: 0 }}>
                      <label className="form-label">Dolor últimas 24hrs</label>
                      <textarea name="dolor24hrs" className="textarea" placeholder="Describa el comportamiento del dolor en las últimas 24 horas..." value={formData.dolor24hrs} onChange={handleInputChange} style={{ height: "80px" }} />
                    </div>
                    <div className="col" style={{ margin: 0 }}>
                      <label className="form-label">Factores que lo modifican</label>
                      <textarea name="facModifica" className="textarea" placeholder="¿Qué aumenta o disminuye el malestar?" value={formData.facModifica} onChange={handleInputChange} style={{ height: "80px" }} />
                    </div>
                  </div>

                  {/* Selector de Múltiples Zonas de Dolor */}
                  <div style={{ marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px dashed rgba(139, 92, 246, 0.15)" }}>
                    <h4 style={{ fontWeight: "700", fontSize: "0.95rem", color: "var(--primary)", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      📍 Detallar Zonas Específicas de Dolor (Múltiples)
                    </h4>

                    <div style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "1rem",
                      alignItems: "flex-end",
                      background: "rgba(139, 92, 246, 0.03)",
                      padding: "1.25rem",
                      borderRadius: "10px",
                      border: "1px solid rgba(139, 92, 246, 0.08)"
                    }}>
                      <div className="col" style={{ margin: 0, flex: "1 1 200px" }}>
                        <label className="form-label" style={{ fontSize: "0.82rem", marginBottom: "4px" }}>Seleccionar Zona</label>
                        <select
                          className="input"
                          value={nuevaZona}
                          onChange={(e) => setNuevaZona(e.target.value)}
                          style={{ padding: "0.45rem 0.75rem", fontSize: "0.85rem" }}
                        >
                          <option value="">-- Seleccionar --</option>
                          <option value="Cervical">Cervical</option>
                          <option value="Dorsal">Dorsal</option>
                          <option value="Lumbar">Lumbar</option>
                          <option value="Hombro Izquierdo">Hombro Izquierdo</option>
                          <option value="Hombro Derecho">Hombro Derecho</option>
                          <option value="Codo Izquierdo">Codo Izquierdo</option>
                          <option value="Codo Derecho">Codo Derecho</option>
                          <option value="Muñeca Izquierda">Muñeca Izquierda</option>
                          <option value="Muñeca Derecha">Muñeca Derecha</option>
                          <option value="Cadera Izquierda">Cadera Izquierda</option>
                          <option value="Cadera Derecha">Cadera Derecha</option>
                          <option value="Rodilla Izquierda">Rodilla Izquierda</option>
                          <option value="Rodilla Derecha">Rodilla Derecha</option>
                          <option value="Tobillo Izquierdo">Tobillo Izquierdo</option>
                          <option value="Tobillo Derecho">Tobillo Derecho</option>
                          <option value="Cabeza">Cabeza</option>
                          <option value="Pecho">Pecho</option>
                          <option value="Abdomen">Abdomen</option>
                          <option value="otra">Otra zona (Especificar)...</option>
                        </select>
                        {nuevaZona === "otra" && (
                          <input
                            type="text"
                            className="input"
                            value={nuevaZonaOtra}
                            onChange={(e) => setNuevaZonaOtra(e.target.value)}
                            placeholder="Escriba la zona..."
                            style={{ marginTop: "8px", padding: "0.45rem 0.75rem", fontSize: "0.85rem" }}
                          />
                        )}
                      </div>

                      <div className="col" style={{ margin: 0, flex: "1 1 120px" }}>
                        <label className="form-label" style={{ fontSize: "0.82rem", marginBottom: "4px" }}>Dolor EVA</label>
                        <select
                          className="input"
                          value={nuevaZonaEva}
                          onChange={(e) => setNuevaZonaEva(e.target.value)}
                          style={{ padding: "0.45rem 0.75rem", fontSize: "0.85rem" }}
                        >
                          <option value="">-- EVA --</option>
                          {[...Array(11).keys()].map((num) => (
                            <option key={num} value={num}>{num} {num === 0 ? "(Sin dolor)" : num === 10 ? "(Máximo)" : ""}</option>
                          ))}
                        </select>
                      </div>

                      <div className="col" style={{ margin: 0, flex: "2 1 250px" }}>
                        <label className="form-label" style={{ fontSize: "0.82rem", marginBottom: "4px" }}>Detalle / Comentario de la zona</label>
                        <input
                          type="text"
                          className="input"
                          value={nuevaZonaComentario}
                          onChange={(e) => setNuevaZonaComentario(e.target.value)}
                          placeholder="Ej: Dolor agudo al flexionar o rotar..."
                          style={{ padding: "0.45rem 0.75rem", fontSize: "0.85rem" }}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={agregarDolorZona}
                        className="save-btn"
                        style={{ margin: 0, padding: "0.55rem", width: "42px", height: "42px", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "1.1rem", borderRadius: "8px", flexShrink: 0 }}
                        title="Agregar zona de dolor"
                      >
                        ➕
                      </button>
                    </div>

                    {/* Mostrar lista de zonas añadidas */}
                    <div style={{ marginTop: "1.25rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                      {formData.dolorZonas && formData.dolorZonas.length > 0 ? (
                        formData.dolorZonas.map((dz, idx) => {
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
                                justifyContent: "space-between",
                                background: "rgba(255, 255, 255, 0.02)",
                                border: "1px solid var(--border-light)",
                                borderRadius: "8px",
                                padding: "0.6rem 1rem",
                                gap: "1rem"
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: "1rem", flex: 1 }}>
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
                              <button
                                type="button"
                                onClick={() => eliminarDolorZona(idx)}
                                style={{
                                  background: "transparent",
                                  border: "none",
                                  color: "var(--danger)",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  padding: "4px",
                                  borderRadius: "6px"
                                }}
                                title="Eliminar zona"
                              >
                                <FiTrash2 size={15} />
                              </button>
                            </div>
                          );
                        })
                      ) : (
                        <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                          No se han detallado zonas de dolor adicionales.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="clinical-form-section">
                  <h3 className="clinical-section-title">🏃 Actividades y Participaciones con Deficiencia</h3>
                  <div className="clinical-grid-1">
                    <div className="col">
                      <label className="form-label">Describa las limitaciones en actividades y participación (de la vida diaria, laboral, deportiva, etc.)</label>
                      <textarea
                        name="actividadesDeficiencia"
                        className="textarea"
                        placeholder="Ej: Dificultad para agacharse, limitaciones al estar sentado más de 30 minutos, imposibilidad de cargar objetos pesados, limitación en la práctica de running..."
                        value={formData.actividadesDeficiencia}
                        onChange={handleInputChange}
                        style={{ height: "100px" }}
                      />
                    </div>
                  </div>
                </div>

                <div className="clinical-form-section">
                  <h3 className="clinical-section-title">🩺 Antecedentes Clínicos</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", marginBottom: "1rem" }}>

                    {/* Antecedentes Familiares */}
                    <div className="col" style={{ background: "rgba(255,255,255,0.01)", padding: "1.25rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontWeight: "700", fontSize: "0.95rem", color: "var(--primary)", margin: "0 0 1rem 0" }}>
                        <input
                          type="checkbox"
                          checked={aplicaFam}
                          onChange={(e) => toggleAplicaFam(e.target.checked)}
                          style={{ width: "16px", height: "16px", accentColor: "var(--primary)" }}
                        />
                        <span>👨‍👩‍👧‍👦 ¿Aplica antecedentes familiares?</span>
                      </label>

                      {aplicaFam && (
                        <div className="fade-in-up" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                          <label className="form-label" style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "4px" }}>Seleccionar Antecedente y Familiar</label>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center" }}>
                            <select
                              className="input"
                              value={antecedenteSeleccionado}
                              onChange={(e) => setAntecedenteSeleccionado(e.target.value)}
                              style={{ flex: "2 1 200px", minWidth: "150px", padding: "0.45rem 0.75rem", fontSize: "0.85rem" }}
                            >
                              <option value="">Añadir antecedente familiar...</option>
                              {itemsAntFam.map((item) => (
                                <option key={item._id} value={item._id}>{item.valor}</option>
                              ))}
                            </select>
                            
                            <select
                              className="input"
                              value={familiarSeleccionado}
                              onChange={(e) => setFamiliarSeleccionado(e.target.value)}
                              style={{ flex: "1 1 150px", minWidth: "120px", padding: "0.45rem 0.75rem", fontSize: "0.85rem" }}
                            >
                              <option value="">Familiar...</option>
                              <option value="Papá">Papá</option>
                              <option value="Mamá">Mamá</option>
                              <option value="Abuelo materno">Abuelo materno</option>
                              <option value="Abuela materna">Abuela materna</option>
                              <option value="Abuelo paterno">Abuelo paterno</option>
                              <option value="Abuela paterna">Abuela paterna</option>
                            </select>

                            <button
                              type="button"
                              className="save-btn"
                              onClick={() => {
                                if (!antecedenteSeleccionado) return;
                                const cleanVal = antecedenteSeleccionado.split("|")[0];
                                const currentList = formData.antecedentesFamiliares || [];
                                if (!currentList.some(x => x && x.split("|")[0] === cleanVal)) {
                                  const valWithRelation = familiarSeleccionado ? `${cleanVal}|${familiarSeleccionado}` : `${cleanVal}|`;
                                  setFormData(prev => ({
                                    ...prev,
                                    antecedentesFamiliares: [...currentList.filter(Boolean), valWithRelation]
                                  }));
                                }
                                setAntecedenteSeleccionado("");
                                setFamiliarSeleccionado("");
                              }}
                              disabled={!antecedenteSeleccionado}
                              style={{
                                margin: 0,
                                padding: "0.55rem",
                                width: "36px",
                                height: "36px",
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                fontSize: "1rem",
                                borderRadius: "8px",
                                flexShrink: 0,
                                opacity: antecedenteSeleccionado ? 1 : 0.4,
                                cursor: antecedenteSeleccionado ? "pointer" : "not-allowed",
                                background: antecedenteSeleccionado ? "var(--primary)" : "rgba(255,255,255,0.05)",
                                border: antecedenteSeleccionado ? "none" : "1px solid rgba(255,255,255,0.1)",
                                color: antecedenteSeleccionado ? "#ffffff" : "var(--text-muted)",
                                transition: "all 0.2s"
                              }}
                              title="Agregar antecedente"
                            >
                              ➕
                            </button>
                          </div>

                          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "1rem" }}>
                            {formData.antecedentesFamiliares?.filter(Boolean).map((id, index) => {
                              const [cleanId, relation] = id.split("|");
                              const label = itemsAntFam.find(x => x._id === cleanId)?.valor || cleanId;
                              return (
                                <span key={index} className="glass-tag" style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  padding: "6px 12px",
                                  borderRadius: "20px",
                                  background: "rgba(99, 102, 241, 0.08)",
                                  border: "1px solid rgba(99, 102, 241, 0.15)",
                                  fontSize: "0.85rem",
                                  color: "var(--text-main)",
                                  wordBreak: "break-word"
                                }}>
                                  <span>{label} {relation ? `(${relation})` : ""}</span>
                                  <button
                                    type="button"
                                    className="tag-remove-btn"
                                    onClick={() => handleRemoveAntecedent(cleanId, true)}
                                    style={{ fontSize: "1rem", lineHeight: "1", padding: 0, background: "none", border: "none", color: "var(--danger)", cursor: "pointer", marginLeft: "4px" }}
                                    title="Eliminar"
                                  >
                                    ×
                                  </button>
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Antecedentes Médicos */}
                    <div className="col" style={{ background: "rgba(255,255,255,0.01)", padding: "1.25rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontWeight: "700", fontSize: "0.95rem", color: "var(--primary)", margin: "0 0 1rem 0" }}>
                        <input
                          type="checkbox"
                          checked={aplicaMed}
                          onChange={(e) => toggleAplicaMed(e.target.checked)}
                          style={{ width: "16px", height: "16px", accentColor: "var(--primary)" }}
                        />
                        <span>🏥 ¿Aplica antecedentes médicos?</span>
                      </label>

                      {aplicaMed && (
                        <div className="fade-in-up" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                          <label className="form-label" style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "4px" }}>Seleccionar Antecedente y Año</label>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center" }}>
                            <select
                              className="input"
                              value={antecedenteMedico}
                              onChange={(e) => setAntecedenteMedico(e.target.value)}
                              style={{ flex: "2 1 200px", minWidth: "150px", padding: "0.45rem 0.75rem", fontSize: "0.85rem" }}
                            >
                              <option value="">Añadir antecedente médico...</option>
                              {itemsAntMed.map((item) => (
                                <option key={item._id} value={item._id}>{item.valor}</option>
                              ))}
                            </select>

                            <input
                              type="text"
                              className="input"
                              placeholder="Año (ej. 2018)"
                              value={anioSeleccionado}
                              onChange={(e) => setAnioSeleccionado(e.target.value)}
                              style={{ flex: "1 1 100px", minWidth: "80px", padding: "0.45rem 0.75rem", fontSize: "0.85rem" }}
                            />

                            <button
                              type="button"
                              className="save-btn"
                              onClick={() => {
                                if (!antecedenteMedico) return;
                                const cleanVal = antecedenteMedico.split("|")[0];
                                const currentList = formData.antecedentesMedicos || [];
                                if (!currentList.some(x => x && x.split("|")[0] === cleanVal)) {
                                  const valWithYear = anioSeleccionado ? `${cleanVal}|${anioSeleccionado}` : `${cleanVal}|`;
                                  setFormData(prev => ({
                                    ...prev,
                                    antecedentesMedicos: [...currentList.filter(Boolean), valWithYear]
                                  }));
                                }
                                setAntecedenteMedico("");
                                setAnioSeleccionado("");
                              }}
                              disabled={!antecedenteMedico}
                              style={{
                                margin: 0,
                                padding: "0.55rem",
                                width: "36px",
                                height: "36px",
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                fontSize: "1rem",
                                borderRadius: "8px",
                                flexShrink: 0,
                                opacity: antecedenteMedico ? 1 : 0.4,
                                cursor: antecedenteMedico ? "pointer" : "not-allowed",
                                background: antecedenteMedico ? "var(--primary)" : "rgba(255,255,255,0.05)",
                                border: antecedenteMedico ? "none" : "1px solid rgba(255,255,255,0.1)",
                                color: antecedenteMedico ? "#ffffff" : "var(--text-muted)",
                                transition: "all 0.2s"
                              }}
                              title="Agregar antecedente"
                            >
                              ➕
                            </button>
                          </div>

                          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "1rem" }}>
                            {formData.antecedentesMedicos?.filter(Boolean).map((id, index) => {
                              const [cleanId, year] = id.split("|");
                              const label = itemsAntMed.find(x => x._id === cleanId)?.valor || cleanId;
                              return (
                                <span key={index} className="glass-tag" style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  padding: "6px 12px",
                                  borderRadius: "20px",
                                  background: "rgba(99, 102, 241, 0.08)",
                                  border: "1px solid rgba(99, 102, 241, 0.15)",
                                  fontSize: "0.85rem",
                                  color: "var(--text-main)",
                                  wordBreak: "break-word"
                                }}>
                                  <span>{label} {year ? `(${year})` : ""}</span>
                                  <button
                                    type="button"
                                    className="tag-remove-btn"
                                    onClick={() => handleRemoveAntecedent(cleanId, false)}
                                    style={{ fontSize: "1rem", lineHeight: "1", padding: 0, background: "none", border: "none", color: "var(--danger)", cursor: "pointer", marginLeft: "4px" }}
                                    title="Eliminar"
                                  >
                                    ×
                                  </button>
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
                    <div className="col" style={{ background: "rgba(255,255,255,0.01)", padding: "1.25rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)", margin: 0 }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontWeight: "700", fontSize: "0.95rem", color: "var(--primary)", margin: "0 0 1rem 0" }}>
                        <input
                          type="checkbox"
                          checked={aplicaMedActual}
                          onChange={(e) => toggleAplicaMedActual(e.target.checked)}
                          style={{ width: "16px", height: "16px", accentColor: "var(--primary)" }}
                        />
                        <span>💊 ¿Lleva medicación actual?</span>
                      </label>

                      {aplicaMedActual && (
                        <div className="fade-in-up">
                          <label className="form-label" style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "4px" }}>Especifique fármacos y dosis</label>
                          <textarea name="medActual" className="textarea" placeholder="Listado de fármacos y dosis..." value={formData.medActual === "Ninguna" ? "" : formData.medActual} onChange={handleInputChange} style={{ height: "60px" }} />
                        </div>
                      )}
                    </div>
                    <div className="col" style={{ background: "rgba(255,255,255,0.01)", padding: "1.25rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)", margin: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", margin: "0 0 1rem 0" }}>
                        <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontWeight: "700", fontSize: "0.95rem", color: "var(--primary)", margin: 0 }}>
                          <input
                            type="checkbox"
                            checked={aplicaQuirurgico}
                            onChange={(e) => {
                              setAplicaQuirurgico(e.target.checked);
                              if (!e.target.checked) {
                                setFormData(prev => ({ ...prev, antecedentesQuirurgicos: "Ninguno", anioQuirurgico: "" }));
                              }
                            }}
                            style={{ width: "16px", height: "16px", accentColor: "var(--primary)" }}
                          />
                          <span>🔪 ¿Tiene antecedentes quirúrgicos?</span>
                        </label>
                        {aplicaQuirurgico && (
                          <button
                            type="button"
                            className="save-btn"
                            onClick={addSurgicalEntry}
                            style={{
                              margin: 0,
                              padding: "0.55rem",
                              width: "36px",
                              height: "36px",
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                              fontSize: "1rem",
                              borderRadius: "8px",
                              flexShrink: 0,
                              background: "var(--primary)",
                              border: "none",
                              color: "#ffffff",
                              cursor: "pointer",
                              transition: "all 0.2s"
                            }}
                            title="Agregar cirugía"
                          >
                            ➕
                          </button>
                        )}
                      </div>

                      {aplicaQuirurgico && (
                        <div className="fade-in-up" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                          {surgicalEntries.map((entry) => (
                            <div key={entry.id} style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "end" }}>
                              <div style={{ flex: "2 1 200px" }}>
                                <label className="form-label" style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "4px" }}>Cirugía / Procedimiento</label>
                                <input
                                  type="text"
                                  className="input"
                                  placeholder="Ej. Apendicectomía"
                                  value={entry.name}
                                  onChange={(e) => updateSurgicalEntry(entry.id, "name", e.target.value)}
                                  style={{ padding: "0.45rem 0.75rem", fontSize: "0.85rem" }}
                                />
                              </div>
                              <div style={{ flex: "1 1 150px" }}>
                                <label className="form-label" style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "4px" }}>Fecha de cirugía</label>
                                <input
                                  type="date"
                                  className="input"
                                  value={entry.date}
                                  onChange={(e) => updateSurgicalEntry(entry.id, "date", e.target.value)}
                                  style={{ padding: "0.45rem 0.75rem", fontSize: "0.85rem" }}
                                />
                              </div>
                              <div style={{ flexShrink: 0 }}>
                                <button
                                  type="button"
                                  className="btn btn-outline"
                                  onClick={() => removeSurgicalEntry(entry.id)}
                                  style={{
                                    borderColor: "rgba(239, 68, 68, 0.2)",
                                    color: "var(--danger)",
                                    height: "36px",
                                    padding: "0 12px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center"
                                  }}
                                  title="Eliminar cirugía"
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>
                          ))}
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
                        <option value="nada">Nada</option>
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
                          background: obser[key].activo ? "rgba(139, 92, 246, 0.04)" : "rgba(255, 255, 255, 0.01)",
                          border: "1px solid " + (obser[key].activo ? "rgba(139, 92, 246, 0.15)" : "rgba(255, 255, 255, 0.03)"),
                          transition: "all 0.2s"
                        }}
                      >
                        <label className="checkbox-label-modern" style={{ margin: 0, fontSize: "0.85rem" }}>
                          <input type="checkbox" checked={obser[key].activo} onChange={() => toggleObser(key)} style={{ width: "15px", height: "15px" }} />
                          <span>{label}</span>
                        </label>

                        {obser[key].activo && (
                          <input
                            type="text"
                            className="input fade-in-up"
                            placeholder="Detalles..."
                            value={obser[key].detalle}
                            onChange={(e) => changeObser(key, e.target.value)}
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
                      <label className="form-label">Diagnóstico de fisioterapia *</label>
                      <textarea name="contenidoNota" className="textarea" placeholder="Escriba un resumen global del estado del paciente en la sesión actual..." value={formData.contenidoNota || ""} onChange={handleInputChange} required style={{ height: "100px" }} />
                    </div>
                  </div>
                </div>

                <div className="clinical-form-section">
                  <h3 className="clinical-section-title">🧪 Desglose de Metodología SOAP</h3>
                  <div className="soap-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                    <div className="col">
                      <label className="form-label" style={{ fontWeight: "700", color: "var(--primary)" }}>Subjetivo (S)</label>
                      <textarea name="S" className="textarea" placeholder="Subjetivo: Síntomas referidos, sensaciones y comentarios expresados por el paciente..." value={formData.S || ""} onChange={handleInputChange} style={{ height: "120px" }} />
                    </div>
                    <div className="col">
                      <label className="form-label" style={{ fontWeight: "700", color: "var(--primary)" }}>Objetivo (O)</label>
                      <textarea name="O" className="textarea" placeholder="Objetivo: Hallazgos clínicos medibles, arcos de movilidad, reflejos, postura observada..." value={formData.O || ""} onChange={handleInputChange} style={{ height: "120px" }} />
                    </div>
                    <div className="col">
                      <label className="form-label" style={{ fontWeight: "700", color: "var(--primary)" }}>Análisis (A)</label>
                      <textarea name="A" className="textarea" placeholder="Análisis: Juicio clínico del fisioterapeuta, evolución, hipótesis diagnóstica de la sesión..." value={formData.A || ""} onChange={handleInputChange} style={{ height: "120px" }} />
                    </div>
                    <div className="col">
                      <label className="form-label" style={{ fontWeight: "700", color: "var(--primary)" }}>Plan (P)</label>
                      <textarea name="P" className="textarea" placeholder="Plan: Tratamiento a seguir, número de sesiones, ejercicios en casa, derivaciones..." value={formData.P || ""} onChange={handleInputChange} style={{ height: "120px" }} />
                    </div>
                  </div>
                </div>
              </div>
            )}



            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "3rem", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "1.5rem" }}>
              <div>
                {activeTab !== "datosPersonales" && (
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => {
                      const tabs = ["datosPersonales", "AnaAnte", "evaluacion", "soap", "consentimiento"];
                      const prevIndex = tabs.indexOf(activeTab) - 1;
                      if (prevIndex >= 0) setActiveTab(tabs[prevIndex]);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    style={{ height: "46px", width: "auto", padding: "0 20px", display: "flex", alignItems: "center", gap: "6px" }}
                  >
                    ⬅️ Anterior
                  </button>
                )}
              </div>

              <div style={{ display: "flex", gap: "1rem" }}>
                {activeTab !== "consentimiento" ? (
                  <button
                    type="button"
                    className="btn btn-primary hover-grow"
                    onClick={() => {
                      const tabs = ["datosPersonales", "AnaAnte", "evaluacion", "soap", "consentimiento"];
                      const nextIndex = tabs.indexOf(activeTab) + 1;
                      if (nextIndex < tabs.length) setActiveTab(tabs[nextIndex]);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    style={{ height: "46px", width: "auto", padding: "0 20px", display: "flex", alignItems: "center", gap: "6px" }}
                  >
                    Siguiente ➡️
                  </button>
                ) : (
                  <button type="submit" className="btn btn-primary btn-size-lg hover-grow glow-pulse-purple" disabled={loading} style={{ height: "46px", minWidth: "220px", fontSize: "1rem", display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }}>
                    {loading ? <LoadingSpinner size="small" color="#fff" /> : <>💾 Guardar expediente clínico</>}
                  </button>
                )}
              </div>
            </div>
          </form>

          {mensaje && <p style={{ marginTop: 15, fontWeight: "bold", textAlign: "center", color: "var(--primary)" }}>{mensaje}</p>}
        </div>
      </div>
    </div>
  );
};

export default FormularioHistorial;
