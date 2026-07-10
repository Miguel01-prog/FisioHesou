import React, { useState } from "react";
import { createPortal } from "react-dom";
import api from "../../api.js";
import { showSuccess, showError } from "../../utils/alerts.js";

export default function ModalAgregarPaciente({ onClose, onPatientAdded }) {
  const [formData, setFormData] = useState({
    nombres: "",
    apellidoPaterno: "",
    apellidoMaterno: "",
    edad: "",
    telefono: "",
    email: "",
    area: "fisioterapeuta"
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones
    if (!formData.nombres.trim() || !formData.apellidoPaterno.trim() || !formData.edad || !formData.telefono.trim() || !formData.area) {
      showError("Campos obligatorios", "Por favor complete todos los campos requeridos.");
      return;
    }

    if (isNaN(formData.edad) || parseInt(formData.edad) <= 0) {
      showError("Edad inválida", "La edad debe ser un número positivo mayor que cero.");
      return;
    }

    setLoading(false);
    try {
      setLoading(true);
      const res = await api.post("/pacientes", formData);
      if (res.status === 201) {
        showSuccess("Paciente registrado", "El paciente ha sido registrado correctamente.");
        if (onPatientAdded) {
          onPatientAdded(res.data.paciente);
        }
        onClose();
      }
    } catch (err) {
      console.error("Error al registrar paciente:", err);
      const errMsg = err.response?.data?.message || "No se pudo registrar al paciente.";
      showError("Error", errMsg);
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "550px" }}>
        <button 
          type="button"
          className="close-btn" 
          onClick={onClose} 
          aria-label="Cerrar modal"
        >
          ✕
        </button>
        
        <h4 className="logo-agendar" style={{ marginBottom: "1.5rem" }}>
          Registrar Nuevo Paciente
        </h4>

        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1rem" }}>
            <div>
              <label className="form-label" style={{ fontWeight: "600" }}>Nombres *</label>
              <input
                type="text"
                name="nombres"
                value={formData.nombres}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Nombre del paciente"
                required
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label className="form-label" style={{ fontWeight: "600" }}>Apellido Paterno *</label>
                <input
                  type="text"
                  name="apellidoPaterno"
                  value={formData.apellidoPaterno}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Apellido paterno"
                  required
                />
              </div>
              <div>
                <label className="form-label" style={{ fontWeight: "600" }}>Apellido Materno</label>
                <input
                  type="text"
                  name="apellidoMaterno"
                  value={formData.apellidoMaterno}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Apellido materno"
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label className="form-label" style={{ fontWeight: "600" }}>Edad *</label>
                <input
                  type="number"
                  name="edad"
                  value={formData.edad}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Edad"
                  required
                  min="1"
                />
              </div>
              <div>
                <label className="form-label" style={{ fontWeight: "600" }}>Teléfono *</label>
                <input
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Teléfono"
                  required
                />
              </div>
            </div>

            <div>
              <label className="form-label" style={{ fontWeight: "600" }}>Correo Electrónico</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="form-input"
                placeholder="correo@ejemplo.com"
              />
            </div>

            <div>
              <label className="form-label" style={{ fontWeight: "600" }}>Área de Especialidad *</label>
              <select
                name="area"
                value={formData.area}
                onChange={handleInputChange}
                className="form-input"
                required
                style={{ textTransform: "capitalize" }}
              >
                <option value="fisioterapeuta">Fisioterapeuta</option>
                <option value="nutriologo">Nutriólogo</option>
                <option value="psicologo">Psicólogo</option>
              </select>
            </div>
          </div>

          <div style={{ marginTop: "2rem", display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
            <button 
              type="button" 
              className="save-btn" 
              style={{ background: "#64748b", margin: 0 }} 
              onClick={onClose}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="save-btn" 
              disabled={loading}
              style={{ margin: 0 }}
            >
              {loading ? "Registrando..." : "Registrar Paciente"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
