import React from "react";
import { capitalizeWords, formatDateDDMMYYYY } from "../../utils/utils";

const CardPaciente = ({ paciente }) => {

    if (!paciente) return null; 

    return (
    
            <div className="cards-column">
                <div className="auth-card card" style={{ marginTop: "-30%" }}>
                    <h2 className="title_card" style={{ marginTop: "-10px" }}>
                        Detalle paciente
                    </h2>
                    <hr />

                    <div className="card-split">

                        <div>
                            <span className="form-label">
                                Nombre completo:{" "}
                                <strong>
                                    {capitalizeWords(paciente.nombres)}{" "}
                                    {capitalizeWords(paciente.apellidos)}
                                </strong>
                            </span>
                        </div>

                        <div>
                            <span className="form-label">
                                Teléfono: <strong>{paciente.telefono}</strong>
                            </span>
                        </div>

                        <div>
                            <span className="form-label">
                                Edad: <strong>{paciente.edad}</strong>
                            </span>
                        </div>

                        <div>
                            <span className="form-label">
                                Fecha primera cita:{" "}
                                <strong>
                                    {formatDateDDMMYYYY(paciente.fechaRegistro)}
                                </strong>
                            </span>
                        </div>

                    </div>
                </div>
            </div>
 
    );

};
export default CardPaciente;