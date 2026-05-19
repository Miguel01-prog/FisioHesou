


const InformacionClinica = () => {
  return (
    <div className="cards-column">
        <div className="auth-card card" style={{ marginTop: "-30%" }}>
            <h2 className="title_card" style={{ marginTop: "-10px" }}>
                Datos de la clínica
            </h2>
            <hr />
                <div>
                    <span className="form-label">
                        Responsable sanitario: <strong>Diana Laura Blanco Negrete 12245636</strong>
                    </span>
                    <br></br>
                    <span className="form-label">
                        Ubicación: <strong>Catalina 416 A, Ex Hacienda el Tintero, 76134, Querétaro, Qro. Mex</strong>
                    </span>
                    <br></br>
                    <span className="form-label">
                        Correo electrico: <strong>admin@hesouclinica.com</strong>
                    </span>
                    <br></br>
                    <span className="form-label">
                        Teléfono: <strong>442-610-6666</strong>
                    </span>
                </div>
            </div>
        </div>
    
    );
}


export default InformacionClinica;