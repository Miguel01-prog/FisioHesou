import Horarios from "../models/horarios.model.js";

// Función auxiliar: convierte "YYYY-MM-DD" en Date sin errores de zona horaria
const toDate = (fechaStr) => new Date(fechaStr + "T00:00:00.000Z");

// ---- Controlador para crear o bloquear días ----
export const crearOBloquear = async (req, res) => {
  const { area } = req.params;
  const { blockedDates } = req.body; // array de strings "YYYY-MM-DD"

  if (!Array.isArray(blockedDates)) {
    return res.status(400).json({ error: "blockedDates debe ser un arreglo" });
  }

  try {
    const results = [];

    // 1. Crear o actualizar bloqueos existentes
    for (const fechaStr of blockedDates) {
      if (typeof fechaStr !== "string") continue;

      const fecha = toDate(fechaStr);

      const bloqueo = await Horarios.findOneAndUpdate(
        { area, fechaStr },            // busca por área y fecha en string
        { area, fecha, fechaStr },     // actualiza o crea
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );

      results.push(bloqueo);
    }

    // 2. Eliminar los bloqueos que ya no estén en la lista actual
    await Horarios.deleteMany({
      area,
      fechaStr: { $nin: blockedDates },
    });

    // 3. Retornar la lista actualizada
    const actualizado = await Horarios.find({ area });
    res.status(200).json(actualizado);
  } catch (e) {
    console.error("Error al guardar bloqueos:", e);
    res.status(500).json({ error: e.message });
  }
};

// ---- Controlador para obtener bloqueos ----
export const obtenerBloqueos = async (req, res) => {
  const { area } = req.params;

  try {
    const bloqueos = await Horarios.find({ area });
    res.status(200).json(bloqueos);
  } catch (e) {
    console.error("Error al obtener bloqueos:", e);
    res.status(500).json({ error: e.message });
  }
};
