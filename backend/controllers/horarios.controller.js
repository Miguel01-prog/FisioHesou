import Horarios from "../models/horarios.model.js";

// Convierte "YYYY-MM-DD" en Date sin errores de zona horaria
const toDate = (fechaStr) => new Date(fechaStr + "T00:00:00.000Z");

// ---- Crear o actualizar bloqueos (días y horas) ----
export const crearOBloquear = async (req, res) => {
  const { area } = req.params;
  const { blockedDates = [], blockedHours = {} } = req.body;

  if (!Array.isArray(blockedDates)) {
    return res.status(400).json({ error: "blockedDates debe ser un arreglo" });
  }

  try {
    const results = [];

    // 1. Crear o actualizar cada fecha bloqueada
    for (const fechaStr of blockedDates) {
      if (typeof fechaStr !== "string") continue;
      const fecha = toDate(fechaStr);

      const horas = Array.isArray(blockedHours[fechaStr])
        ? blockedHours[fechaStr]
        : [];

      const bloqueo = await Horarios.findOneAndUpdate(
        { area, fechaStr },
        { area, fecha, fechaStr, blockedHours: horas },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );

      results.push(bloqueo);
    }

    // 2. Eliminar las fechas que ya no están bloqueadas
    await Horarios.deleteMany({
      area,
      fechaStr: { $nin: blockedDates },
    });

    // 3. Obtener todos los bloqueos actualizados
    const actualizado = await Horarios.find({ area });
    res.status(200).json(actualizado);
  } catch (e) {
    console.error("Error al guardar bloqueos:", e);
    res.status(500).json({ error: e.message });
  }
};

// ---- Obtener bloqueos (días y horas) ----
export const obtenerBloqueos = async (req, res) => {
  const { area } = req.params;

  try {
    const bloqueos = await Horarios.find({ area });

    const blockedDates = bloqueos.map((b) => b.fechaStr);
    const blockedHours = {};
    for (const b of bloqueos) {
      blockedHours[b.fechaStr] = b.blockedHours || [];
    }

    res.status(200).json({ blockedDates, blockedHours });
  } catch (e) {
    console.error("Error al obtener bloqueos:", e);
    res.status(500).json({ error: e.message });
  }
};
