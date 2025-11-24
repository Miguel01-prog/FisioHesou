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

  const generarIdNotaFront = async (paciente, mesAñoNota) => {
    console.log("Generando ID para paciente:", paciente);
    try {
      const response = await api.post("/notas/generar-id", {
        nombrePaciente: paciente.nombres,
        apellidoPaciente: paciente.apellidos,
        mesAñoNota: mesAñoNota,
        identificadorPaciente: paciente.identificadorPaciente,
      });
      return response.data.idNota;
    } catch (err) {
      console.error("Error generando ID en front:", err);
      showError("Error", "No se pudo generar el ID de la nota");
      return "";
    }
  };

 
  useEffect(() => {
    const init = async () => {
      const datos = JSON.parse(localStorage.getItem("dataPaciente"));
      if (!datos) return;

      setPaciente(datos);

      // Obtener mes-año actual
      const fecha = new Date();
      const mes = (fecha.getMonth() + 1).toString().padStart(2, "0");
      const año = fecha.getFullYear();
      const mesAñoNota = `${mes}-${año}`;

      // Generar ID automáticamente
      const nuevoID = await generarIdNotaFront(datos, mesAñoNota);

      setForm({
        identificadorPaciente: datos.identificadorPaciente || "",
        idHistorialFK: datos.idHistorialFK || "",
        idNota: nuevoID,
        mesAñoNota: mesAñoNota,
        contenidoNota: "",
        S: "",
        O: "",
        A: "",
        P: "",
      });
    };

    init();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

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
    <div className="auth-card auth-card-detail">
      <form onSubmit={handleSubmit} className="form">
        <div className="form-row">
          <div className="col">
            <label className="form-label">ID Nota: <strong>{form.idNota}</strong></label>
          </div>

          <div className="col">
            <label className="form-label">Mes-Año: <strong>{form.mesAñoNota}</strong></label> 
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
      </form>
    </div>
  );
}
