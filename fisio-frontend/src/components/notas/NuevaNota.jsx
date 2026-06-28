import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ModalAgendarCita from "../layout/ModalAgendarCita.jsx";
import api from "../../api.js";
import { showSuccess, showError } from "../../utils/alerts.js";
import { IoCaretDown, IoCaretUp } from "react-icons/io5";

export default function CrearNota() {
  const navigate = useNavigate();
  const [paciente, setPaciente] = useState(null);
  const [ultimaNota, setUltimaNota] = useState(null);
  const [openUltimaNota, setOpenUltimaNota] = useState(false);
  const [showModalCita, setShowModalCita] = useState(false);

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
    try {
      const response = await api.post("/notas/generar-id", {
        nombrePaciente: paciente.nombres,
        apellidoPaciente: paciente.apellidos,
        mesAñoNota: mesAñoNota,
        identificadorPaciente: paciente.identificadorPaciente,
      });
      // El backend devuelve idHistoricoFk
      return response.data.idHistoricoFk;
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

      // Obtener las notas previas para mostrar la última
      try {
        const { data } = await api.get(`/notas/paciente/${datos.identificadorPaciente}`);
        if (data && data.length > 0) {
          // Ordenar las notas por fecha de creación descendente (la más reciente primero)
          const notasOrdenadas = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setUltimaNota(notasOrdenadas[0]);
        }
      } catch (err) {
        console.error("Error al obtener notas previas:", err);
      }
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
      // El backend espera idHistoricoFk en vez de idNota, lo adaptamos:
      const payload = {
        ...form,
        idHistoricoFk: form.idNota
      };

      const { data } = await api.post("/notas", payload);
      showSuccess("Nota creada", "La nota del paciente se guardó correctamente.");

      // La nota recién creada se convierte en la última nota
      setUltimaNota(data.nota || payload);

      // Actualizar ID para la siguiente nota
      const nuevoID = await generarIdNotaFront(paciente, form.mesAñoNota);

      // Limpiar formulario y preparar la siguiente nota
      setForm((prev) => ({
        ...prev,
        idNota: nuevoID,
        contenidoNota: "",
        S: "",
        O: "",
        A: "",
        P: "",
      }));
    } catch (err) {
      console.error(err);
      showError("Error", "Error al crear la nota.");
    }
  };

  return (
    <div className="auth-wrapper-content fade-in-up">
      <div className="cards-column">

        {ultimaNota && (
          <div className={`auth-card auth-card-detail accordion mb-4 ${!openUltimaNota ? "pulse-expand-hint" : ""}`}>
            <button
              type="button"
              className={`accordion-header ${openUltimaNota ? "open" : ""}`}
              onClick={() => setOpenUltimaNota(!openUltimaNota)}
            >
              <span className="form-label" style={{ margin: 0, fontWeight: "bold" }}>
                Última Nota: {ultimaNota.idHistoricoFk || ultimaNota.idNota}
              </span>
              <span className="accordion-icon">
                {openUltimaNota ? <IoCaretUp /> : <IoCaretDown />}
              </span>
            </button>

            {openUltimaNota && (
              <div className="accordion-body form mt-3">
                <div className="form-row">
                  <div className="col">
                    <label className="form-label">Contenido general:</label>
                    <textarea className="textarea" value={ultimaNota.contenidoNota || ""} disabled />
                  </div>
                </div>

                <div className="form-row">
                  <div className="col">
                    <label className="form-label">S (Subjetivo):</label>
                    <textarea className="textarea" value={ultimaNota.S || ""} disabled />
                  </div>
                  <div className="col">
                    <label className="form-label">O (Objetivo):</label>
                    <textarea className="textarea" value={ultimaNota.O || ""} disabled />
                  </div>
                </div>

                <div className="form-row">
                  <div className="col">
                    <label className="form-label">A (Análisis):</label>
                    <textarea className="textarea" value={ultimaNota.A || ""} disabled />
                  </div>
                  <div className="col">
                    <label className="form-label">P (Plan):</label>
                    <textarea className="textarea" value={ultimaNota.P || ""} disabled />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="auth-card auth-card-detail">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
            <h2 className="title_card" style={{ margin: 0 }}>Añadir Nueva Nota</h2>
            <button 
              type="button" 
              className="btn btn-primary btn-size-sm hover-grow glow-pulse-purple" 
              onClick={() => setShowModalCita(true)}
            >
              📅 Agendar Cita
            </button>
          </div>
          <hr className="mb-4" />
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
                  className="textarea"
                  value={form.contenidoNota}
                  onChange={handleChange}
                />
              </div>
            </div>

            <h3 className="mt-3 text-muted">Nota SOAP</h3>

            <div className="form-row">
              <div className="col">
                <label className="form-label">S (Subjetivo):</label>
                <textarea
                  name="S"
                  className="textarea"
                  value={form.S}
                  onChange={handleChange}
                />
              </div>

              <div className="col">
                <label className="form-label">O (Objetivo):</label>
                <textarea
                  name="O"
                  className="textarea"
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
                  className="textarea"
                  value={form.A}
                  onChange={handleChange}
                />
              </div>

              <div className="col">
                <label className="form-label">P (Plan):</label>
                <textarea
                  name="P"
                  className="textarea"
                  value={form.P}
                  onChange={handleChange}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-size-lg hover-grow glow-pulse-purple mt-3">
              Guardar Nota
            </button>
          </form>
        </div>
      </div>
      
      {showModalCita && paciente && (
        <ModalAgendarCita 
          paciente={paciente} 
          onClose={() => setShowModalCita(false)} 
        />
      )}
    </div>
  );
}
