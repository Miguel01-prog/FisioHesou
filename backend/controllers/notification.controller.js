import Notification from "../models/notification.model.js";
import Cita from "../models/cita.model.js";
import Paciente from "../models/pacientes.model.js";
import Nota from "../models/notas.model.js";
import HistorialPacientes from "../models/historial-pacientes.model.js";

const getTodayLocalString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

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

const checkAndGenerateUpcomingNotifications = async (area, clientId) => {
  try {
    const hoyStr = getTodayLocalString();
    const areasABuscar = area === "fisioterapeuta" ? ["fisioterapia", "fisioterapeuta"] : ["nutriologa", "nutricion", "nutriología"];

    const existingUpcomingNotifs = await Notification.find({
      type: "upcoming_appointment",
      area: area,
      clientId
    });

    for (const notif of existingUpcomingNotifs) {
      if (notif.citaId) {
        const cita = await Cita.findById(notif.citaId);
        if (!cita || cita.estado === "Cancelado" || hasAppointmentPassed(cita.fechaCitaStr, cita.horaCita)) {
          await Notification.deleteOne({ _id: notif._id });
        }
      } else {
        await Notification.deleteOne({ _id: notif._id });
      }
    }

    const citasHoy = await Cita.find({
      area: { $in: areasABuscar },
      fechaCitaStr: hoyStr,
      estado: { $ne: "Cancelado" },
      clientId
    });

    for (const cita of citasHoy) {
      if (!hasAppointmentPassed(cita.fechaCitaStr, cita.horaCita)) {
        const exists = await Notification.findOne({
          citaId: cita._id,
          type: "upcoming_appointment",
          clientId
        });

        if (!exists) {
          await Notification.create({
            title: "Consulta Próxima",
            description: `La cita de ${cita.nombres} ${cita.apellidoPaterno || ""}`.trim() + ` es hoy a las ${cita.horaCita}.`,
            area: area,
            type: "upcoming_appointment",
            citaId: cita._id,
            identificadorPaciente: cita.identificadorPaciente,
            clientId
          });
        }
      }
    }
  } catch (err) {
    console.error("Error al generar notificaciones de citas próximas:", err);
  }
};

const checkAndGeneratePendingSoapNotifications = async (area, clientId) => {
  try {
    const areasABuscar = area === "fisioterapeuta" ? ["fisioterapia", "fisioterapeuta"] : ["nutriologa", "nutricion", "nutriología"];
    const pacientes = await Paciente.find({ area: { $in: areasABuscar }, clientId });

    for (const pac of pacientes) {
      if (!pac.identificadorPaciente) continue;
      const historialExiste = await HistorialPacientes.findOne({ identificadorPaciente: pac.identificadorPaciente, clientId });
      if (!historialExiste) {
        await Notification.deleteMany({ identificadorPaciente: pac.identificadorPaciente, type: "pending_soap", clientId });
        continue;
      }
      const notaExiste = await Nota.findOne({ identificadorPaciente: pac.identificadorPaciente, clientId });
      if (!notaExiste) {
        const notifExiste = await Notification.findOne({ identificadorPaciente: pac.identificadorPaciente, type: "pending_soap", clientId });
        if (!notifExiste) {
          const nombreCompleto = `${pac.nombres} ${pac.apellidoPaterno || ""}`.trim();
          await Notification.create({
            title: "Nota SOAP Pendiente",
            description: `El paciente ${nombreCompleto} cuenta con expediente pero aún no tiene nota SOAP.`,
            area: area,
            type: "pending_soap",
            identificadorPaciente: pac.identificadorPaciente,
            clientId
          });
        }
      } else {
        await Notification.deleteMany({ identificadorPaciente: pac.identificadorPaciente, type: "pending_soap", clientId });
      }
    }
  } catch (err) {
    console.error("Error al generar notificaciones de notas SOAP pendientes:", err);
  }
};

export const obtenerNotificaciones = async (req, res) => {
  const { area } = req.params;
  const clientId = req.user.clientId;
  try {
    await checkAndGenerateUpcomingNotifications(area, clientId);
    await checkAndGeneratePendingSoapNotifications(area, clientId);
    const notifications = await Notification.find({ area, clientId }).sort({ createdAt: -1 });
    res.status(200).json({ ok: true, notifications });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

export const eliminarNotificacion = async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await Notification.findOneAndDelete({ _id: id, clientId: req.user.clientId });
    if (!deleted) {
      return res.status(404).json({ ok: false, message: "Notificación no encontrada" });
    }
    res.status(200).json({ ok: true, message: "Notificación eliminada correctamente" });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};