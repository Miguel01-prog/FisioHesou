import Horarios from "../models/horarios.model.js";
import Cita from "../models/cita.model.js";

// Convierte "YYYY-MM-DD" en Date sin errores de zona horaria
const toDate = (fechaStr) => new Date(fechaStr + "T00:00:00.000Z");

// ---- Crear o actualizar bloqueos manuales (días y horas) ----
export const crearOBloquear = async (req, res) => {
  const { area } = req.params;
  const { blockedDates = [], blockedHours = {} } = req.body;

  if (!Array.isArray(blockedDates)) {
    return res.status(400).json({ error: "blockedDates debe ser un arreglo" });
  }

  try {
    const results = [];

    for (const fechaStr of blockedDates) {
      if (typeof fechaStr !== "string") continue;
      const fecha = toDate(fechaStr);

      const horas = Array.isArray(blockedHours[fechaStr]) ? blockedHours[fechaStr] : [];

      const bloqueo = await Horarios.findOneAndUpdate(
        { area, fechaStr },
        { area, fecha, fechaStr, blockedHours: horas },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );

      results.push(bloqueo);
    }

    await Horarios.deleteMany({
      area,
      fechaStr: { $nin: blockedDates },
    });

    const actualizado = await Horarios.find({ area });
    res.status(200).json(actualizado);
  } catch (e) {
    console.error("Error al guardar bloqueos:", e);
    res.status(500).json({ error: e.message });
  }
};

// ---- Obtener bloqueos diferenciados (admin + citas) ----
export const obtenerBloqueos = async (req, res) => {
  const { area } = req.params;

  try {
    // 1️⃣ Bloqueos manuales (admin)
    const bloqueos = await Horarios.find({ area });
    const blockedHoursAdmin = {};
    const blockedDatesAdmin = [];

    bloqueos.forEach((b) => {
      blockedHoursAdmin[b.fechaStr] = b.blockedHours || [];
      blockedDatesAdmin.push(b.fechaStr);
    });

    // 2️⃣ Bloqueos por citas de pacientes
    const citas = await Cita.find({ area });
    const blockedHoursCitas = {};
    const blockedDatesPaciente = [];

    citas.forEach((cita) => {
      const fecha = cita.fechaCitaStr;
      const hora = cita.horaCita;

      if (!blockedHoursCitas[fecha]) blockedHoursCitas[fecha] = [];
      blockedHoursCitas[fecha].push(hora);
      blockedDatesPaciente.push(fecha);
    });

    // Quitar duplicados
    const blockedDatesPacienteUnique = [...new Set(blockedDatesPaciente)];

    res.status(200).json({
      blockedDatesAdmin,
      blockedHoursAdmin,
      blockedDatesPaciente: blockedDatesPacienteUnique,
      blockedHoursCitas,
    });
  } catch (e) {
    console.error("Error al obtener bloqueos:", e);
    res.status(500).json({ error: e.message });
  }
};
