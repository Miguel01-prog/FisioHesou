import { capitalizeWords, formatDateDDMMYYYY } from "../../utils/utils.js";
import CardPaciente from "../pacientes/CardPaciente.jsx";
import { useNavigate } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api.js";

export default function PacienteDetalle() {
  const { id } = useParams();
  const [historial, setHistorial] = useState([]);
  const [paciente, setPaciente] = useState(null);
  const navigate = useNavigate();
  useEffect(() => {
    const fetchHistorial = async () => {
      try {
        const { data } = await api.get(`/citas/detalles-paciente/${id}`);
        setHistorial(data.historial || []);
   
        if (data.historial.length > 0) {
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
      {paciente && (
          <CardPaciente paciente={paciente} />
        )}
       
      <div className="auth-card auth-card-detail">
        <div>
          <h2 className="title_card" style={{marginTop: '-10px'}}>Historial</h2>
         <button className="save-btn" style={{marginTop: '-55px', marginRight: '-2px'}}
            onClick={() => {
              console.log("Paciente guardadoantes de navegar:", paciente);
              navigate(`/fisioterapeuta/creacion-historial`);
            }}
          >
            Crear historial
          </button>


        </div>
          <hr/>
      </div>
    </div>
</div>

);

}
