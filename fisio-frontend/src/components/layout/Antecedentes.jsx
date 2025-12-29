import { useEffect, useState } from "react";
import { FaEye } from "react-icons/fa";
import api from "../../api";
import { IoIosAddCircle } from "react-icons/io";

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
      const res = await api.get(
        `/configuracion/items/${categoria.clave}`
      );
      setItems(res.data || []);
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

      setItems([...items, { valor: nuevoItem }]);
      setNuevoItem("");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="auth-wrapper-content">
      <div className="cards-column">
        <div className="auth-card auth-card-detail">
          <h2 className="title_card">Antecedentes</h2>
          <hr />

          {categorias.map((c) => (
            <div key={c._id} className="input-dynamic">
              <input
                className="input dynamic-input"
                value={c.descripcion}
                readOnly
              />

              <button
                className="btn-eye"
                onClick={() => abrirModal(c)}
                title="Ver antecedentes"
              >
                <FaEye />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL */}
      {mostrarModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <button className="close-btn" onClick={cerrarModal}>
              ✕
            </button>

            <h2 className="title_card">
              {categoriaActual.descripcion}
            </h2>
            <hr />

            {items.length === 0 && (
              <p className="text-muted">
                No hay antecedentes registrados
              </p>
            )}

            {items.map((i, idx) => (
              <div key={idx} className="input-dynamic">
                <input
                  className="input dynamic-input"
                  value={i.valor}
                  readOnly
                />
              </div>
            ))}

            <div className="input-dynamic d-flex align-items-center mb-1">
              <input
                className="input flex-grow-1"
                placeholder="Nuevo antecedente"
                value={nuevoItem}
                onChange={(e) => setNuevoItem(e.target.value)}
              />

              <button
                className="btn-add-icon ms-1"
                onClick={agregarItem}
                title="Agregar"
              >
                <IoIosAddCircle/>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Antecedentes;
