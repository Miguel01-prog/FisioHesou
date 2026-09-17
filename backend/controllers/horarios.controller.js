import Horarios from "../models/horarios.model.js";
import Cita from "../models/cita.model.js";

// Convierte "YYYY-MM-DD" en Date sin errores de zona horaria
const toDate = (fechaStr) => new Date(fechaStr + "T00:00:00.000Z");

// Helper para determinar si una cita ya transcurrió según la hora local
const hasAppointmentPassed = (fechaCitaStr, horaCita) => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hoyStr = `${year}-${month}-${day}`;

  if (fechaCitaStr < hoyStr) return true;
  if (fechaCitaStr > hoyStr) return false;

  if (!horaCita) return false;
  const match = horaCita.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return false;

  let apptHour = parseInt(match[1], 10);
  const apptMin = parseInt(match[2], 10);
  const upper = horaCita.toUpperCase();
  if (upper.includes("PM") && apptHour < 12) apptHour += 12;
  if (upper.includes("AM") && apptHour === 12) apptHour = 0;

  const currentMinutes = d.getHours() * 60 + d.getMinutes();
  const apptMinutes = apptHour * 60 + apptMin;
  return currentMinutes >= apptMinutes;
};

// ---- Crear o actualizar bloqueos manuales (días y horas) ----
export const crearOBloquear = async (req, res) => {
  const { area } = req.params;
  const { blockedDates = [], blockedHours = {}, blockedNotes = {} } = req.body;

  if (!Array.isArray(blockedDates)) {
    return res.status(400).json({ error: "blockedDates debe ser un arreglo" });
  }

  try {
    const results = [];

    for (const fechaStr of blockedDates) {
      if (typeof fechaStr !== "string") continue;
      const fecha = toDate(fechaStr);

      const horas = Array.isArray(blockedHours[fechaStr]) ? blockedHours[fechaStr] : [];
      const note = typeof blockedNotes[fechaStr] === "string" ? blockedNotes[fechaStr] : "";

      const bloqueo = await Horarios.findOneAndUpdate(
        { area, fechaStr, clientId: req.user.clientId },
        { area, fecha, fechaStr, blockedHours: horas, note, clientId: req.user.clientId },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );

      results.push(bloqueo);
    }

    await Horarios.deleteMany({
      area,
      fechaStr: { $nin: blockedDates },
      clientId: req.user.clientId
    });

    const actualizado = await Horarios.find({ area, clientId: req.user.clientId });
    res.status(200).json(actualizado);
  } catch (e) {
    console.error("Error al guardar bloqueos:", e);
    res.status(500).json({ error: e.message });
  }
};

export const obtenerBloqueos = async (req, res) => {
  const { area } = req.params;
  const clientId = req.user?.clientId || req.query.clientId;

  if (!clientId) {
    return res.status(400).json({ error: "clientId es requerido para esta consulta" });
  }

  const areasABuscar = [area];
  if (area === "fisioterapia" || area === "fisioterapeuta") {
    areasABuscar.push("fisioterapia", "fisioterapeuta");
  } else if (area === "nutriologa" || area === "nutricion" || area === "nutriología") {
    areasABuscar.push("nutriologa", "nutricion", "nutriología");
  }

  try {
    // 1️⃣ Bloqueos manuales (admin)
    const bloqueos = await Horarios.find({ area: { $in: areasABuscar }, clientId });
    const blockedHoursAdmin = {};
    const blockedNotesAdmin = {};
    const blockedDatesAdmin = [];

    bloqueos.forEach((b) => {
      blockedHoursAdmin[b.fechaStr] = b.blockedHours || [];
      blockedNotesAdmin[b.fechaStr] = b.note || "";
      blockedDatesAdmin.push(b.fechaStr);
    });

    // 2️⃣ Bloqueos por citas de pacientes (excluyendo canceladas y citas pasadas)
    const citas = await Cita.find({ 
      area: { $in: areasABuscar },
      estado: { $ne: "Cancelado" },
      clientId
    });
    const blockedHoursCitas = {};
    const blockedDatesPaciente = [];

    citas.forEach((cita) => {
      const fecha = cita.fechaCitaStr;
      const hora = cita.horaCita;

      if (!hasAppointmentPassed(fecha, hora)) {
        if (!blockedHoursCitas[fecha]) blockedHoursCitas[fecha] = [];
        blockedHoursCitas[fecha].push(hora);
        blockedDatesPaciente.push(fecha);
      }
    });

    const blockedDatesPacienteUnique = [...new Set(blockedDatesPaciente)];

    res.status(200).json({
      blockedDatesAdmin,
      blockedHoursAdmin,
      blockedNotesAdmin,
      blockedDatesPaciente: blockedDatesPacienteUnique,
      blockedHoursCitas,
    });
  } catch (e) {
    console.error("Error al obtener bloqueos:", error);
    res.status(500).json({ error: e.message });
  }
};