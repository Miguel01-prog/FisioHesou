import { IoIosAddCircle } from "react-icons/io";
import { useState, useEffect } from "react";
import { TiDelete } from "react-icons/ti";
import CardPaciente from "../pacientes/CardPaciente.jsx";

const FormularioHistorial = () => {

  const [paciente, setPaciente] = useState(null);

  const [formData, setFormData] = useState({
    antecedentesFamiliares: [""],
    antecedentesMedicos: [""],
    antecedentesQuirurgicos: [""],
    intervencionesPrevias: [""],
    duracionPlan: "",
    fechaNacimiento: "",
    frecuenciaSesiones: "",
    habitosDeEjercicio: ""
  });

  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");

  
    useEffect(() => {
    const datosPaciente = JSON.parse(localStorage.getItem("dataPaciente"));
    console.log("esto trae:", datosPaciente);

    if (!datosPaciente) return;

    setPaciente({
        nombres: datosPaciente.nombres,
        apellidos: datosPaciente.apellidos,
        edad: datosPaciente.edad,
        telefono: datosPaciente.telefono,
        fechaRegistro: datosPaciente.fechaCreado,
    });
    }, []);


  // Manejo de inputs normales
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Cambiar un valor dentro del arreglo dinámico
  const handleDynamicChange = (campo, index, value) => {
    const copia = [...formData[campo]];
    copia[index] = value;
    setFormData({ ...formData, [campo]: copia });
  };

  // Agregar item genérico
  const agregarItem = (campo) => {
    setFormData({
      ...formData,
      [campo]: [...formData[campo], ""]
    });
  };

  // Eliminar item genérico
  const eliminarItem = (campo, index) => {
    const copia = [...formData[campo]];
    copia.splice(index, 1);
    setFormData({ ...formData, [campo]: copia });
  };

  // Enviar datos al backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensaje("");

    try {
      const response = await fetch("http://localhost:3000/api/historial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error("Error en el servidor");

      setMensaje("Historial guardado correctamente");

      setFormData({
        antecedentesFamiliares: [""],
        antecedentesMedicos: [""],
        antecedentesQuirurgicos: [""],
        duracionPlan: "",
        fechaNacimiento: "",
        frecuenciaSesiones: "",
        habitosDeEjercicio: ""
      });

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
                <h2 className="title_card" style={{ marginTop: "-10px" }}>
                    Creación historial
                </h2>
                <hr />

                <form className="form" onSubmit={handleSubmit}>
                <div className="form-row">
                    <div className="col">
                        <label className="form-label">Fecha nacimiento:</label>
                        <input type="date"name="fechaNacimiento" className="input"
                            value={formData.fechaNacimiento} onChange={handleInputChange}
                        />
                    </div>
                    <div className="col">
                        <label className="form-label">Fecha evaluación:</label>
                        <input type="date"name="fechaEvaluacion" className="input"
                            value={formData.fechaEvaluacion} onChange={handleInputChange}
                        />
                    </div>
                    <div className="col">
                        <label className="form-label">Antecedentes familiares:</label>
                        {formData.antecedentesFamiliares.map((valor, index) => (
                            <div key={index} className="input-dynamic">
                                <input type="text" className="input dynamic-input" placeholder={`Antecedente Fam: ${index + 1}`}
                                    value={valor} onChange={(e) => handleDynamicChange("antecedentesFamiliares", index, e.target.value)}                       
                                />
                            {index > 0 && index !== formData.antecedentesFamiliares.length - 1 && (
                                <button type="button" className="btn-icon-delete" onClick={() => eliminarItem("antecedentesFamiliares", index)}>
                                    <TiDelete />
                                </button>
                            )}
                            {index === formData.antecedentesFamiliares.length - 1 && (
                                <button type="button" className="btn-add-icon"onClick={() => agregarItem("antecedentesFamiliares")}>
                                    <IoIosAddCircle />
                                </button>
                            )}
                            </div>
                        ))}
                    </div>
                    <div className="col">
                        <label className="form-label">Antecedentes quirúrgicos:</label>
                        {formData.antecedentesQuirurgicos.map((valor, index) => (
                            <div key={index} className="input-dynamic">
                                <input type="text" className="input dynamic-input" placeholder={`Antecedente ${index + 1}`}
                                    value={valor} onChange={(e) => handleDynamicChange("antecedentesQuirurgicos", index, e.target.value)}
                                />
                                {index > 0 && index !== formData.antecedentesQuirurgicos.length - 1 && (
                                    <button type="button" className="btn-icon-delete" onClick={() => eliminarItem("antecedentesQuirurgicos", index)}>
                                        <TiDelete />
                                    </button>
                                )}
                                {index === formData.antecedentesQuirurgicos.length - 1 && (
                                    <button type="button" className="btn-add-icon" onClick={() => agregarItem("antecedentesQuirurgicos")}>
                                        <IoIosAddCircle/>
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
                <div className="form-row">
                    <div className="col">
                        <label className="form-label">Antecedentes médicos:</label>
                        {formData.antecedentesMedicos.map((valor, index) => (
                            <div key={index} className="input-dynamic">
                                <input type="text" className="input dynamic-input" placeholder={`Antecedente médico ${index + 1}`}
                                    value={valor} onChange={(e) => handleDynamicChange("antecedentesMedicos", index, e.target.value)}
                                />
                            {index > 0 && index !== formData.antecedentesMedicos.length - 1 && (
                                <button type="button" className="btn-icon-delete" onClick={() => eliminarItem("antecedentesMedicos", index)}>
                                    <TiDelete />
                                </button>
                            )}
                            {index === formData.antecedentesMedicos.length - 1 && (
                                <button
                                type="button"
                                className="btn-add-icon"
                                onClick={() => agregarItem("antecedentesMedicos")}
                                >
                                <IoIosAddCircle />
                                </button>
                            )}

                            </div>
                        ))}
                        </div>

                        {/* ===================== OTROS CAMPOS ===================== */}
                        <div className="col">
                        <label className="form-label">Duración del plan:</label>
                        <input
                            type="text"
                            name="duracionPlan"
                            className="input"
                            placeholder="Duración del plan"
                            value={formData.duracionPlan}
                            onChange={handleInputChange}
                        />
                        </div>

                        <div className="col">
                        <label className="form-label">Frecuencia de sesiones:</label>
                        <input
                            type="text"
                            name="frecuenciaSesiones"
                            className="input"
                            placeholder="Frecuencia de sesiones"
                            value={formData.frecuenciaSesiones}
                            onChange={handleInputChange}
                        />
                        </div>

                        <div className="col">
                        <label className="form-label">Hábitos de ejercicio:</label>
                        <input
                            type="text"
                            name="habitosDeEjercicio"
                            className="input"
                            placeholder="Hábitos de ejercicio"
                            value={formData.habitosDeEjercicio}
                            onChange={handleInputChange}
                        />
                        </div>
                        <div className="col">
                        <label className="form-label">Concentimiento informado:</label>
                        <input
                            type="text"
                            name="habitosDeEjercicio"
                            className="input"
                            placeholder="Hábitos de ejercicio"
                            value={formData.habitosDeEjercicio}
                            onChange={handleInputChange}
                        />
                        </div>

                    </div>

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
                <p style={{ marginTop: "15px", fontWeight: "bold" }}>
                    {mensaje}
                </p>
                )}

            </div>
        </div>
    </div>
  );
};

export default FormularioHistorial;
