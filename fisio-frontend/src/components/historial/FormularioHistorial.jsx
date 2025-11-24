import { IoIosAddCircle } from "react-icons/io";
import { useState, useEffect } from "react";
import { TiDelete } from "react-icons/ti";
import CardPaciente from "../pacientes/CardPaciente.jsx";
import CrearNota from "../notas/NuevaNota.jsx";

const FormularioHistorial = () => {
  const [paciente, setPaciente] = useState(null);
  const [activeTab, setActiveTab] = useState("antecedentes");

  const [formData, setFormData] = useState({
    antecedentesFamiliares: [""],
    antecedentesMedicos: [""],
    antecedentesQuirurgicos: [""],
    intervencionesPrevias: [""],
    duracionPlan: "",
    fechaNacimiento: "",
    fechaEvaluacion: "",
    frecuenciaSesiones: "",
    habitosDeEjercicio: "",
    consentimientoInformado: "",
    notasSOAP: { subjetivo: "", objetivo: "", valoracion: "", plan: "" }
  });

  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");

  // Cargar datos del paciente
  useEffect(() => {
    const datosPaciente = JSON.parse(localStorage.getItem("dataPaciente"));
    if (!datosPaciente) return;

    setPaciente({
      nombres: datosPaciente.nombres,
      apellidos: datosPaciente.apellidos,
      edad: datosPaciente.edad,
      telefono: datosPaciente.telefono,
      fechaRegistro: datosPaciente.fechaCitaStr
    });
  }, []);

  // Manejo de Inputs
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
    setFormData(prev => ({
      ...prev,
      notasSOAP: { ...prev.notasSOAP, [campo]: value }
    }));
  };

  // Enviar datos
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensaje("");

    try {
      const response = await fetch("http://localhost:3000/api/historial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Error en el servidor");
      setMensaje("Historial guardado correctamente");
    } catch (error) {
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
                </div>

              </div>
            )}

            {/* TAB 2: INFORMACIÓN GENERAL */}
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
                    <input
                      type="date"
                      name="fechaEvaluacion"
                      className="input"
                      value={formData.fechaEvaluacion}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="form-row mb-2">
                  <div className="col">
                    <label className="form-label">Duración del plan:</label>
                    <input
                      type="text"
                      name="duracionPlan"
                      className="input"
                      value={formData.duracionPlan}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col">
                    <label className="form-label">Frecuencia sesiones:</label>
                    <input
                      type="text"
                      name="frecuenciaSesiones"
                      className="input"
                      value={formData.frecuenciaSesiones}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="form-row mb-2">
                  <div className="col">
                    <label className="form-label">Hábitos de ejercicio:</label>
                    <input
                      type="text"
                      name="habitosDeEjercicio"
                      className="input"
                      value={formData.habitosDeEjercicio}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col">
                    <label className="form-label">Consentimiento informado:</label>
                    <input
                      type="text"
                      name="consentimientoInformado"
                      className="input"
                      value={formData.consentimientoInformado}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>
            )}

          
            {activeTab === "soap" && (
              <div className="tab-content">
                <CrearNota />
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
  