import '../../styles/globalStyles.css';


export default function AppointmentForm() {
  return (
    <div className="auth-wrapper-public">
      <div className="auth-card card" style={{ maxWidth: '600px', width: '100%' }}>
        <h2 className="logo-agendar mb-2">Agendar Cita</h2>
        <p className="text-muted text-center mb-2">Llena el formulario para agendar tu cita</p>
        <form className="form">
          <div className="form-row">
            <div className="col">
              <label htmlFor="name" className="form-label">Nombre(s)</label>
              <input id="name" type="text" className="input" placeholder="Nombre(s)" required/>
            </div>

            <div className="col">
              <label htmlFor="last-name" className="form-label">Apellido(s)</label>
              <input id="last-name" type="text" className="input" placeholder="Apellido(s)" required/>
            </div>
          </div>
          <div className="form-row">
            <div className="col">
              <label htmlFor="age" className="form-label">Edad</label>
              <input id="age" type="text" className="input" placeholder="Edad" required/>
            </div>
            <div className="col">
              <label htmlFor="phone" className="form-label">Teléfono</label>
              <input id="phone" type="text" className="input" placeholder="Teléfono" required/>
            </div>
          </div>
          <hr style={{ border: 'none', borderTop: '2px solid #b1b1b1ff', margin: '0.5px' }} />
          <h3 htmlFor="tipo-consulta" style={{color: '#6c757d', marginTop: '-10px'}}>Tipo de consulta</h3>
            <div className="form-row">
              <div className="col" style={{marginTop: '-10px'}}>
                <label htmlFor="fisio" className="checkbox">
                  <input id="fisio" type="radio" name="tipo-consulta-fisio" value="fisioterapia" required/>
                  <span style={{color: '#6c757d'}}>Fisioterapia</span>
                </label>
              </div>
              <div className="col" style={{marginTop: '-10px'}}>
                <label htmlFor="fisio" className="checkbox">
                  <input id="fisio" type="radio" name="tipo-consulta-fisio" value="nutriologa" required/>
                  <span style={{color: '#6c757d'}}>Nutrióloga</span>
                </label>
              </div>
            </div>
        </form>
      </div>
    </div>
  );
}
