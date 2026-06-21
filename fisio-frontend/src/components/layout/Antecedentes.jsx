import { useEffect, useState } from "react";
import { FaEye, FaTrash } from "react-icons/fa";
import api from "../../api";
import { IoIosAddCircle } from "react-icons/io";
import { createPortal } from "react-dom";
import { showSuccess, showError } from "../../utils/alerts";

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
    setItems([]);

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
      const res = await api.post(`/configuracion/item/${categoriaActual._id}`, {
        valor: nuevoItem
      });

      if (res.data && res.data.data) {
        setItems(prev => [...prev, res.data.data]);
      } else {
        const resRefresh = await api.get(`/configuracion/item/${categoriaActual.clave}`);
        setItems(Array.isArray(resRefresh.data.items) ? resRefresh.data.items : []);
      }
      cerrarModal();
      showSuccess("Antecedente guardado", "El antecedente se guardó correctamente en la base de datos.");
    } catch (err) {
      console.error(err);
      showError("Error al guardar", "No se pudo guardar el antecedente en la base de datos.");
    }
  };

  const handleEliminarItem = async (itemId) => {
    try {
      await api.delete(`/configuracion/item/${itemId}`);
      setItems(prev => prev.filter(i => i._id !== itemId));
      cerrarModal();
      showSuccess("Antecedente eliminado", "El antecedente se eliminó correctamente de la base de datos.");
    } catch (err) {
      console.error("Error al eliminar antecedente:", err);
      showError("Error al eliminar", "No se pudo eliminar el antecedente de la base de datos.");
    }
  };

  return (
    <div className="container" style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
      <div style={{ width: '100%', maxWidth: '900px', padding: '1rem 0' }}>

        {/* Main interactive card */}
        <div className="auth-card auth-card-wide" style={{ width: '100%', marginTop: 0 }}>
          <div className="card-header-split" style={{ marginBottom: "1rem" }}>
            <h2 className="title_card" style={{ margin: 0 }}>Configuración de Antecedentes</h2>
          </div>
          <hr style={{ marginBottom: "1.5rem" }} />

          <div className="table-responsive-container">
            <table className="tabla-pacientes">
              <thead>
                <tr>
                  <th style={{ width: "50%" }}>Descripción</th>
                  <th style={{ textAlign: 'center', width: '50%' }}>Ver</th>
                </tr>
              </thead>
              <tbody>
                {categorias.map((c) => (
                  <tr key={c._id}>
                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                        {c.descripcion}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        className="patient-detail-action-btn btn-primary-action hover-grow"
                        style={{ width: "auto", padding: "0.4rem 0.8rem", fontSize: "0.8rem", borderRadius: "6px", display: "inline-flex", alignItems: "center", gap: "0.3rem", margin: 0 }}
                        onClick={() => abrirModal(c)}
                        title={`Ver antecedentes de ${c.descripcion}`}
                        aria-label={`Ver antecedentes de ${c.descripcion}`}
                      >
                        <FaEye />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Centered responsive modal portal using standard styles */}
      {mostrarModal && createPortal(
        <div className="modal-backdrop" onClick={cerrarModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "550px", width: "100%" }}>
            <button className="close-btn" onClick={cerrarModal} aria-label="Cerrar modal">✕</button>

            <h4 className="logo-agendar" style={{ marginBottom: "1.5rem" }}>
              {categoriaActual?.descripcion}
            </h4>
            <hr style={{ marginBottom: "1.5rem" }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxHeight: '320px', overflowY: 'auto', paddingRight: '4px', marginBottom: "1.5rem" }}>
              {items.length === 0 && (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem 0', fontSize: '0.9rem' }}>
                  No hay antecedentes registrados en esta categoría.
                </p>
              )}

              {items.length > 0 && items.map((i) => (
                <div key={i._id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    className="input"
                    value={i.valor}
                    readOnly
                    style={{ background: 'rgba(226, 232, 240, 0.4)', cursor: 'default', flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={() => handleEliminarItem(i._id)}
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      color: 'var(--danger, #ef4444)',
                      border: 'none',
                      borderRadius: '8px',
                      width: '40px',
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      transition: 'all 0.2s',
                      flexShrink: 0
                    }}
                    title="Eliminar antecedente"
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}
            </div>

            <hr style={{ marginBottom: "1.5rem" }} />

            {/* Input row to register a new entry */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                className="input"
                placeholder="Registrar nuevo antecedente..."
                value={nuevoItem}
                onChange={(e) => setNuevoItem(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') agregarItem();
                }}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className="patient-detail-action-btn btn-primary-action hover-grow"
                onClick={agregarItem}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  flexShrink: 0
                }}
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
