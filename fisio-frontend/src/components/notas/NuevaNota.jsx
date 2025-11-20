import React, { useState, useEffect } from "react";
import api from "../../api.js";
import { showSuccess, showError } from "../../utils/alerts.js";

export default function CrearNota() {
  const [paciente, setPaciente] = useState(null);

  const [form, setForm] = useState({
    idNota: "",
    mesAñoNota: "",
    contenidoNota: "",
    S: "",
    O: "",
    A: "",
    P: "",
  });

  useEffect(() => {
    const datos = JSON.parse(localStorage.getItem("dataPaciente"));

    if (datos) {
      setPaciente(datos);
      setForm((prev) => ({
        ...prev,
        identificadorPaciente: datos.identificadorPaciente || "",
        idHistorialFK: datos.idHistorialFK || "",
      }));
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones básicas
    if (!form.idNota || !form.mesAñoNota || !form.contenidoNota) {
      return showError("Campos incompletos", "Es necesario llenar los datos obligatorios.");
    }

    try {
      await api.post("/notas", form);

      showSuccess("Nota creada", "La nota del paciente se guardó correctamente.");

      // limpiar formulario
      setForm({
        identificadorPaciente: paciente?.identificadorPaciente || "",
        idHistorialFK: paciente?.idHistorialFK || "",
        idNota: "",
        mesAñoNota: "",
        contenidoNota: "",
        S: "",
        O: "",
        A: "",
        P: "",
      });

    } catch (err) {
      console.error(err);
      showError("Error", "Error al crear la nota.");
    }
  };

  return (
    <div className="auth-wrapper-content">
        <div className="auth-card auth-card-detail" style={{ width: "900px" }}>
            <h2 className="title_card" style={{ marginTop: "-10px" }}>
                Crear Nota</h2>
            <hr />
            <form onSubmit={handleSubmit} className="form">
                <div className="form-row">
                    <div className="col">
                        <label className="form-label">ID Nota:</label>
                        <input
                            name="idNota"
                            className="input"
                            value={form.idNota}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="col">
                        <label className="form-label">Mes-Año (MM-YYYY):</label>
                        <input
                            name="mesAñoNota"
                            className="input"
                            value={form.mesAñoNota}
                            onChange={handleChange}
                        />
                    </div>
                </div>
                <div className="form-row">
                    <div className="col">
                        <label className="form-label">Contenido general:</label>
                        <textarea
                            name="contenidoNota"
                            className="input"
                            value={form.contenidoNota}
                            onChange={handleChange}
                        />
                    </div>
                </div>
                <h3 style={{ marginTop: "10px", color: "#6c757d" }}>Nota SOAP</h3>
                <div className="form-row">
                    <div className="col">
                        <label className="form-label">S (Subjetivo):</label>
                        <textarea
                            name="S"
                            className="input"
                            value={form.S}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="col">
                        <label className="form-label">O (Objetivo):</label>
                        <textarea
                            name="O"
                            className="input"
                            value={form.O}
                            onChange={handleChange}
                        />
                    </div>
                </div>
                <div className="form-row">
                    <div className="col">
                        <label className="form-label">A (Análisis):</label>
                        <textarea
                            name="A"
                            className="input"
                            value={form.A}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="col">
                        <label className="form-label">P (Plan):</label>
                        <textarea
                            name="P"
                            className="input"
                            value={form.P}
                            onChange={handleChange}
                        />
                    </div>
                </div>
                <button className="save-btn" type="submit" style={{ marginTop: "15px" }}>
                    Guardar Nota
                </button>
            </form>
        </div>
    </div>

  );
}
