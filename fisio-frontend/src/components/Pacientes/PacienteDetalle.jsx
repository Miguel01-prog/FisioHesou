import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api.js";
import { capitalizeWords, formatDateDDMMYYYY } from "../../utils/utils.js";

export default function PacienteDetalle() {
  const { id } = useParams();
  const [historial, setHistorial] = useState([]);
  const [paciente, setPaciente] = useState(null);

  useEffect(() => {
    const fetchHistorial = async () => {
      try {
        const { data } = await api.get(`/citas/detalles-paciente/${id}`);
        setHistorial(data.historial || []);

        if (data.historial.length > 0) {
            console.log(data.historial[0]);
          setPaciente({
            nombres: data.historial[0].nombres,
            apellidos: data.historial[0].apellidos,
            edad: data.historial[0].edad,
            telefono: data.historial[0].telefono,
            fechaRegistro: data.historial[0].fechaCreado,
          });
        }

      } catch (err) {
        console.error("Error al cargar historial:", err);
      }
    };

    fetchHistorial();
  }, [id]);

  return (
  <div className="auth-wrapper-content">
    <div className="cards-column">
        <div className="auth-card card" style={{marginTop: '-30%'}}>
            <h2 className="title_card">Detalle paciente</h2>
            <hr />
            {paciente && (
                <div className="card-split">
                    <div>
                        <span className="form-label">Nombre completo:
                            <strong> {capitalizeWords(paciente.nombres)} {capitalizeWords(paciente.apellidos)}</strong>
                        </span>
                    </div>

                    <div>
                        <span className="form-label">Teléfono:
                            <strong> {paciente.telefono}</strong>
                        </span>
                    </div>

                    <div>
                        <span className="form-label">Edad:
                            <strong> {paciente.edad}</strong>
                        </span>
                    </div>

                    <div>
                        <span className="form-label">Fecha primera cita:
                            <strong> {formatDateDDMMYYYY(paciente.fechaRegistro)}</strong>
                        </span>
                    </div>
                </div>
            )}
        </div>
        <div className="auth-card card" style={{marginTop: '-23px'}}>
            <h2 className="title_card">Historial</h2>
            <hr/>
        </div>
    </div>
</div>

);

}
