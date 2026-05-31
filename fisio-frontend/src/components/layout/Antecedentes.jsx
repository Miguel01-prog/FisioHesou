import { useEffect, useState } from "react";
import { FaEye } from "react-icons/fa";
import api from "../../api";
import { IoIosAddCircle } from "react-icons/io";
import { createPortal } from "react-dom";

const Antecedentes = () => {
  const [categorias, setCategorias] = useState([]);
  const [items, setItems] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [categoriaActual, setCategoriaActual] = useState(null);
  const [nuevoItem, setNuevoItem] = useState("");

  useEffect(() => {
    cargarCategorias();
  }, []);

  const cargarCategorias = async () => {
    try {
      const res = await api.get("/configuracion/confGen");
      setCategorias(res.data?.configuraciones || []);
    } catch (err) {
      console.error(err);
    }
  };

  const abrirModal = async (categoria) => {
    setCategoriaActual(categoria);
    setNuevoItem("");
    setMostrarModal(true);

    try {
      const res = await api.get(`/configuracion/item/${categoria.clave}`);
      setItems(Array.isArray(res.data.items) ? res.data.items : []);
    } catch (err) {
      console.error(err);
      setItems([]);
    }
  };

  const cerrarModal = () => {
    setMostrarModal(false);
    setCategoriaActual(null);
    setItems([]);
  };

  const agregarItem = async () => {
    if (!nuevoItem.trim()) return;

    try {
      await api.post(`/configuracion/item/${categoriaActual._id}`, {
        valor: nuevoItem
      });

      setItems(prev => [...prev, { valor: nuevoItem }]);
      setNuevoItem("");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="container" style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
      <div style={{ width: '100%', maxWidth: '900px', padding: '1rem 0' }}>
        
        {/* Main interactive glass card */}
        <div className="glass-card" style={{ width: '100%' }}>
          <div className="glass-card-header">
            <h2 className="glass-card-title">Configuración de Antecedentes</h2>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {categorias.length} categorías de registro
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
            {categorias.map((c) => (
              <div key={c._id} className="input-dynamic">
                <input
                  className="dynamic-input"
                  value={c.descripcion}
                  readOnly
                  style={{ cursor: 'default', fontWeight: 600 }}
                />
                <button 
                  className="btn-eye" 
                  onClick={() => abrirModal(c)}
                  title={`Ver antecedentes de ${c.descripcion}`}
                  aria-label={`Ver antecedentes de ${c.descripcion}`}
                >
                  <FaEye />
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Centered responsive modal portal */}
      {mostrarModal && createPortal(
        <div className="hesou-modal-overlay" onClick={cerrarModal}>
          <div className="hesou-modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={cerrarModal} aria-label="Cerrar modal">✕</button>

            <div className="glass-card-header" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem', marginBottom: '0.5rem' }}>
              <h2 className="title_card">{categoriaActual?.descripcion}</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxHeight: '320px', overflowY: 'auto', paddingRight: '4px' }}>
              {items.length === 0 && (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem 0', fontSize: '0.9rem' }}>
                  No hay antecedentes registrados en esta categoría.
                </p>
              )}

              {items.length > 0 && items.map((i, idx) => (
                <div key={idx} className="input-dynamic">
                  <input 
                    className="dynamic-input" 
                    value={i.valor} 
                    readOnly 
                    style={{ background: 'rgba(94, 80, 161, 0.02)', cursor: 'default' }}
                  />
                </div>
              ))}
            </div>

            <hr />

            {/* Input row to register a new entry */}
            <div className="input-dynamic" style={{ marginTop: '0.5rem' }}>
              <input
                className="dynamic-input"
                placeholder="Registrar nuevo antecedente..."
                value={nuevoItem}
                onChange={(e) => setNuevoItem(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') agregarItem();
                }}
              />
              <button 
                className="btn-add-icon" 
                onClick={agregarItem}
                title="Agregar antecedente"
                aria-label="Agregar antecedente"
              >
                <IoIosAddCircle />
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Antecedentes;
