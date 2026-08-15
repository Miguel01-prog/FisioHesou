import React, { useState, useEffect } from "react";
import api from "../../api";
import LoadingSpinner from "./LoadingSpinner";
import { showError, showSuccess } from "../../utils/alerts";
import { FaTrash } from "react-icons/fa";

const ConfiguracionEjercicios = () => {
  const [ejercicios, setEjercicios] = useState([]);
  const [cargando, setCargando] = useState(true);
  
  // Estado para el formulario
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [imagen, setImagen] = useState(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargarEjercicios();
  }, []);

  const cargarEjercicios = async () => {
    try {
      const res = await api.get("/ejercicios");
      setEjercicios(res.data.ejercicios || []);
    } catch (err) {
      console.error(err);
      showError("Error", "No se pudieron cargar los ejercicios.");
    } finally {
      setCargando(false);
    }
  };

  const handleImagenChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImagen(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!nombre.trim()) {
      showError("Faltan campos", "El nombre del ejercicio es obligatorio.");
      return;
    }

    setGuardando(true);
    
    // Usamos FormData porque estamos enviando un archivo
    const formData = new FormData();
    formData.append("nombre", nombre);
    formData.append("descripcion", descripcion);
    if (imagen) {
      formData.append("imagen", imagen);
    }

    try {
      await api.post("/ejercicios", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
      
      showSuccess("¡Éxito!", "Ejercicio guardado correctamente en el catálogo.");
      
      // Limpiar formulario
      setNombre("");
      setDescripcion("");
      setImagen(null);
      // Recargar lista
      cargarEjercicios();
    } catch (err) {
      console.error(err);
      showError("Error", "Hubo un problema al guardar el ejercicio.");
    } finally {
      setGuardando(false);
    }
  };

  const eliminarEjercicio = async (id) => {
    try {
      await api.delete(`/ejercicios/${id}`);
      cargarEjercicios();
    } catch (err) {
      console.error(err);
      showError("Error", "No se pudo eliminar el ejercicio.");
    }
  };  const backendUrl = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api$/, "");

  const customStyles = `
    .exercise-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-md);
      border-color: rgba(139, 92, 246, 0.25) !important;
    }
    .exercise-card:hover .exercise-card-img {
      transform: scale(1.05);
    }
    .delete-exercise-btn:hover {
      background: #ef4444 !important;
      color: white !important;
      transform: scale(1.1);
    }
    .file-upload-zone:hover {
      border-color: var(--primary) !important;
      background: rgba(139, 92, 246, 0.05) !important;
    }
  `;

  return (
    <div className="auth-wrapper-content">
      <style>{customStyles}</style>
      <div className="cards-column">
        <div className="auth-card auth-card-detail">
          <h2 className="title_card">Catálogo de Ejercicios</h2>
          <hr />
          
          <form onSubmit={handleSubmit} className="form">
            <div className="form-row">
              <div className="form-col full-width">
                <label className="form-label">Nombre del Ejercicio:</label>
                <input 
                  type="text" 
                  className="input" 
                  value={nombre} 
                  onChange={(e) => setNombre(e.target.value)} 
                  placeholder="Ej. Estiramiento de isquiotibiales" 
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-col full-width">
                <label className="form-label">Instrucciones / Descripción:</label>
                <textarea 
                  className="textarea" 
                  value={descripcion} 
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Describe cómo se debe realizar el ejercicio..."
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-col full-width">
                <label className="form-label">Imagen descriptiva (PNG/JPG):</label>
                <label style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '1.5rem',
                  border: '2px dashed rgba(139, 92, 246, 0.2)',
                  borderRadius: '10px',
                  background: 'rgba(139, 92, 246, 0.02)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'center'
                }} className="file-upload-zone">
                  <span style={{ fontSize: '1.75rem', marginBottom: '8px' }}>📤</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)' }}>
                    {imagen ? imagen.name : "Seleccionar archivo de imagen"}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Suelte un archivo aquí o haga clic para buscar
                  </span>
                  <input 
                    type="file" 
                    accept="image/png, image/jpeg, image/jpg" 
                    onChange={handleImagenChange}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            </div>
            
            <button type="submit" className="save-btn" disabled={guardando} style={{ marginTop: '15px' }}>
              {guardando ? <LoadingSpinner size="small" color="#fff" /> : "Añadir al catálogo"}
            </button>
          </form>
        </div>

        {/* Lista de Ejercicios */}
        <div className="auth-card auth-card-detail" style={{ marginTop: '20px' }}>
          <h3 className="title_card" style={{ fontSize: '18px' }}>Ejercicios Registrados</h3>
          <hr />
          
          {cargando ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
              <LoadingSpinner size="large" color="#42133B"/>
            </div>
          ) : ejercicios.length === 0 ? (
            <p className="text-muted">No hay ejercicios en el catálogo. Agrega uno arriba.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginTop: '15px' }}>
              {ejercicios.map((ej) => (
                <div
                  key={ej._id}
                  className="exercise-card"
                  style={{
                    background: "var(--card-bg, rgba(255,255,255,0.02))",
                    border: "1px solid var(--border-light, rgba(255,255,255,0.08))",
                    borderRadius: "12px",
                    overflow: "hidden",
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    boxShadow: "var(--shadow-sm)"
                  }}
                >
                  <button 
                    onClick={() => {
                        if(window.confirm("¿Seguro que deseas eliminar este ejercicio?")) {
                            eliminarEjercicio(ej._id);
                        }
                    }}
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: 'none',
                      color: '#ef4444',
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      zIndex: 10,
                      transition: 'all 0.2s'
                    }}
                    className="delete-exercise-btn"
                    title="Eliminar del catálogo"
                  >
                    <FaTrash size={12} />
                  </button>

                  {ej.imagenUrl ? (
                    <div style={{ position: 'relative', width: '100%', height: '160px', overflow: 'hidden', background: '#000' }}>
                      <img 
                        src={`${backendUrl}${ej.imagenUrl}`} 
                        alt={ej.nombre} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }} 
                        className="exercise-card-img"
                      />
                    </div>
                  ) : (
                    <div style={{ width: '100%', height: '160px', background: 'rgba(139, 92, 246, 0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '2rem' }}>🧘</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sin imagen descriptiva</span>
                    </div>
                  )}

                  <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <h4 style={{ margin: '0', color: 'var(--primary)', fontWeight: '700', fontSize: '1.05rem', lineHeight: '1.4' }}>{ej.nombre}</h4>
                    {ej.descripcion && (
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0', lineHeight: '1.5', textAlign: 'justify', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {ej.descripcion}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConfiguracionEjercicios;
