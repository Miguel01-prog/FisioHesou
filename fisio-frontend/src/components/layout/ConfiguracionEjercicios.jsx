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
  };

  return (
    <div className="auth-wrapper-content">
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
                <input 
                  type="file" 
                  accept="image/png, image/jpeg, image/jpg" 
                  onChange={handleImagenChange}
                  className="input"
                  style={{ padding: "8px" }}
                />
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px', marginTop: '15px' }}>
              {ejercicios.map((ej) => (
                <div key={ej._id} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '15px', position: 'relative' }}>
                  <button 
                    onClick={() => {
                        if(window.confirm("¿Seguro que deseas eliminar este ejercicio?")) {
                            eliminarEjercicio(ej._id);
                        }
                    }}
                    style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer' }}
                  >
                    <FaTrash />
                  </button>
                  <h4 style={{ margin: '0 0 10px 0', color: '#42133B' }}>{ej.nombre}</h4>
                  {ej.imagenUrl && (
                    <img 
                      src={`http://localhost:5000${ej.imagenUrl}`} 
                      alt={ej.nombre} 
                      style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '4px', marginBottom: '10px' }} 
                    />
                  )}
                  <p style={{ fontSize: '13px', color: '#555', margin: '0' }}>{ej.descripcion}</p>
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
