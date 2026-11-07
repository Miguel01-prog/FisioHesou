import Notification from "../models/notification.model.js";
import Cita from "../models/cita.model.js";
import Paciente from "../models/pacientes.model.js";
import Nota from "../models/notas.model.js";
import HistorialPacientes from "../models/historial-pacientes.model.js";

const getMexicoNow = () => {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(now);

  const map = {};
  for (const p of parts) {
    map[p.type] = p.value;
  }
  const year = map.year;
  const month = map.month;
  const day = map.day;
  const hour = parseInt(map.hour, 10) % 24;
  const minute = parseInt(map.minute, 10);

  return {
    hoyStr: `${year}-${month}-${day}`,
    currentMinutes: hour * 60 + minute
  };
};

const getTodayLocalString = () => getMexicoNow().hoyStr;

const hasAppointmentPassed = (fechaCitaStr, horaCita) => {
  const { hoyStr, currentMinutes } = getMexicoNow();

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

  const apptMinutes = apptHour * 60 + apptMin;
  return currentMinutes >= apptMinutes;
};

const isNotaValida = (n) => {
  if (!n) return false;
  const hasContenido = Boolean(
    n.contenidoNota &&
      n.contenidoNota.trim() !== "" &&
      n.contenidoNota !== "Nota de evolución y seguimiento clínico" &&
      n.contenidoNota !== "Nota de seguimiento clínico sin observaciones"
  );
  const hasSOAP = Boolean(
    (n.S && n.S.trim() !== "") ||
      (n.O && n.O.trim() !== "") ||
      (n.A && n.A.trim() !== "") ||
      (n.P && n.P.trim() !== "")
  );
  return hasContenido || hasSOAP;
};

const checkAndGenerateUpcomingNotifications = async (area, clientId) => {
  try {
    const hoyStr = getTodayLocalString();
    const areasABuscar = area === "fisioterapeuta" ? ["fisioterapia", "fisioterapeuta"] : ["nutriologa", "nutricion", "nutriología"];

    // 1. Limpiar notificaciones de "Cita Hoy" (upcoming_appointment) que ya no correspondan estrictamente a hoy o ya hayan pasado/concluido
    const existingUpcomingNotifs = await Notification.find({
      type: "upcoming_appointment",
      area: area,
      clientId
    });

    for (const notif of existingUpcomingNotifs) {
      if (notif.citaId) {
        const cita = await Cita.findById(notif.citaId);
        if (
          !cita ||
          cita.estado === "Cancelado" ||
          cita.estado === "Completado" ||
          cita.estado === "Asistió" ||
          cita.fechaCitaStr !== hoyStr ||
          hasAppointmentPassed(cita.fechaCitaStr, cita.horaCita)
        ) {
          await Notification.deleteOne({ _id: notif._id });
        } else {
          const expectedDesc = `La cita de ${cita.nombres} ${cita.apellidoPaterno || ""}`.trim() + ` es hoy a las ${cita.horaCita}.`;
          if (notif.description !== expectedDesc) {
            notif.description = expectedDesc;
            await notif.save();
          }
        }
      } else {
        await Notification.deleteOne({ _id: notif._id });
      }
    }

    // 2. Limpiar notificaciones de "Nueva Cita" (new_appointment) si la cita fue eliminada, cancelada, completada, ya pasó, o si ya es hoy (para no duplicar con "Cita Hoy")
    const existingNewApptNotifs = await Notification.find({
      type: "new_appointment",
      area: area,
      clientId
    });

    for (const notif of existingNewApptNotifs) {
      if (notif.citaId) {
        const cita = await Cita.findById(notif.citaId);
        if (
          !cita ||
          cita.estado === "Cancelado" ||
          cita.estado === "Completado" ||
          cita.estado === "Asistió" ||
          cita.fechaCitaStr === hoyStr ||
          hasAppointmentPassed(cita.fechaCitaStr, cita.horaCita)
        ) {
          await Notification.deleteOne({ _id: notif._id });
        }
      } else {
        await Notification.deleteOne({ _id: notif._id });
      }
    }

    // 3. Generar notificaciones únicamente para las citas pendientes del día de HOY
    const citasHoy = await Cita.find({
      area: { $in: areasABuscar },
      fechaCitaStr: hoyStr,
      estado: { $nin: ["Cancelado", "Completado", "Asistió"] },
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
    const clientMatch = {
      $or: [
        { clientId },
        { clientId: { $exists: false } },
        { clientId: null }
      ]
    };

    const pacientes = await Paciente.find({
      ...clientMatch,
      area: { $in: areasABuscar }
    });

    const historiales = await HistorialPacientes.find(clientMatch, { identificadorPaciente: 1 });
    const historialesSet = new Set(
      historiales
        .map((h) => h.identificadorPaciente)
        .filter((id) => id && String(id).trim() !== "")
        .map((id) => String(id).trim())
    );

    const notas = await Nota.find(clientMatch);
    const notasValidasSet = new Set();
    notas.forEach((n) => {
      if (n.identificadorPaciente && isNotaValida(n)) {
        notasValidasSet.add(String(n.identificadorPaciente).trim());
      }
    });

    const idsSinNota = new Set();

    for (const pac of pacientes) {
      if (!pac.identificadorPaciente) continue;
      const idStr = String(pac.identificadorPaciente).trim();
      const tieneHistorial = historialesSet.has(idStr);
      const tieneNotaValida = notasValidasSet.has(idStr);

      if (tieneHistorial && !tieneNotaValida) {
        idsSinNota.add(idStr);
        const nombreCompleto = `${pac.nombres || ""} ${pac.apellidoPaterno || pac.apellidos || ""}`.trim();
        const expectedDesc = `El paciente ${nombreCompleto} cuenta con expediente pero aún no tiene nota SOAP.`;

        const notifExiste = await Notification.findOne({
          identificadorPaciente: idStr,
          type: "pending_soap",
          area,
          clientId
        });

        if (!notifExiste) {
          await Notification.create({
            title: "Nota SOAP Pendiente",
            description: expectedDesc,
            area: area,
            type: "pending_soap",
            identificadorPaciente: idStr,
            clientId
          });
        } else if (notifExiste.description !== expectedDesc) {
          notifExiste.description = expectedDesc;
          await notifExiste.save();
        }
      } else {
        await Notification.deleteMany({
          identificadorPaciente: idStr,
          type: "pending_soap",
          clientId
        });
      }
    }

    // Limpiar notificaciones pending_soap huérfanas de pacientes ya eliminados o que ya tienen nota
    const existingSoapNotifs = await Notification.find({
      type: "pending_soap",
      area,
      clientId
    });

    for (const notif of existingSoapNotifs) {
      const idStr = notif.identificadorPaciente ? String(notif.identificadorPaciente).trim() : "";
      if (!idStr || !idsSinNota.has(idStr)) {
        await Notification.deleteOne({ _id: notif._id });
      }
    }
  } catch (err) {
    console.error("Error al generar notificaciones de notas SOAP pendientes:", err);
  }
};

const parseHourToMinutes = (text = "") => {
  const match = String(text).match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) return 9999;
  let hour = parseInt(match[1], 10);
  const min = parseInt(match[2], 10);
  const period = (match[3] || "").toUpperCase();
  if (period === "PM" && hour < 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;
  return hour * 60 + min;
};

export const obtenerNotificaciones = async (req, res) => {
  const { area } = req.params;
  const clientId = req.user.clientId;
  try {
    await checkAndGenerateUpcomingNotifications(area, clientId);
    await checkAndGeneratePendingSoapNotifications(area, clientId);
    const rawNotifications = await Notification.find({ area, clientId }).sort({ createdAt: -1 });

    // Ordenar: primero las citas de hoy (upcoming_appointment) de la más cercana a la más lejana por hora
    const typePriority = (type) => {
      if (type === "upcoming_appointment") return 0;
      if (type === "new_appointment") return 1;
      return 2;
    };

    const notifications = [...rawNotifications].sort((a, b) => {
      const prioA = typePriority(a.type);
      const prioB = typePriority(b.type);
      if (prioA !== prioB) return prioA - prioB;

      if (a.type === "upcoming_appointment" && b.type === "upcoming_appointment") {
        return parseHourToMinutes(a.description) - parseHourToMinutes(b.description);
      }

      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    res.status(200).json({ ok: true, notifications });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

export const eliminarNotificacion = async (req, res) => {
  const { id } = req.params;
  const clientId = req.user.clientId;
  try {
    const notif = await Notification.findOne({ _id: id, clientId });
    if (!notif) {
      return res.status(404).json({ ok: false, message: "Notificación no encontrada" });
    }

    // Si es una notificación de Nota SOAP Pendiente, debe permanecer fija hasta que el paciente tenga una nota SOAP válida
    if (notif.type === "pending_soap" && notif.identificadorPaciente) {
      const notasPaciente = await Nota.find({
        identificadorPaciente: notif.identificadorPaciente,
        $or: [{ clientId }, { clientId: { $exists: false } }, { clientId: null }]
      });
      const yaTieneNota = notasPaciente.some((n) => isNotaValida(n));
      if (!yaTieneNota) {
        return res.status(200).json({
          ok: true,
          fixed: true,
          message: "La notificación de Nota SOAP Pendiente permanece fija hasta que se registre la nota."
        });
      }
    }

    await Notification.deleteOne({ _id: id, clientId });
    res.status(200).json({ ok: true, message: "Notificación eliminada correctamente" });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};
