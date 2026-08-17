import Notification from "../models/notification.model.js";
import Cita from "../models/cita.model.js";
import Paciente from "../models/pacientes.model.js";
import Nota from "../models/notas.model.js";

// Helper function to check and generate notifications for upcoming appointments today
const checkAndGenerateUpcomingNotifications = async (area, clientId) => {
  try {
    const hoyStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    
    // Unify area name strings
    const areasABuscar = area === "fisioterapeuta" ? ["fisioterapia", "fisioterapeuta"] : ["nutriologa", "nutricion", "nutriología"];
    
    // Find all today's active appointments for these areas
    const citasHoy = await Cita.find({
      area: { $in: areasABuscar },
      fechaCitaStr: hoyStr,
      estado: { $ne: "Cancelado" },
      clientId
    });

    for (const cita of citasHoy) {
      // Check if an upcoming notification already exists for this appointment
      const exists = await Notification.findOne({
        citaId: cita._id,
        type: "upcoming_appointment",
        clientId
      });

      if (!exists) {
        // Create upcoming notification
        await Notification.create({
          title: "Consulta Próxima",
          description: `La cita de ${cita.nombres} ${cita.apellidoPaterno} es hoy a las ${cita.horaCita}.`,
          area: area,
          type: "upcoming_appointment",
          citaId: cita._id,
          identificadorPaciente: cita.identificadorPaciente,
          clientId
        });
      }
    }
  } catch (err) {
    console.error("Error al generar notificaciones de citas próximas:", err);
  }
};

// Helper function to check and generate notifications for patients without a SOAP note
const checkAndGeneratePendingSoapNotifications = async (area, clientId) => {
  try {
    const areasABuscar = area === "fisioterapeuta" ? ["fisioterapia", "fisioterapeuta"] : ["nutriologa", "nutricion", "nutriología"];

    // Buscar todos los pacientes registrados del área
    const pacientes = await Paciente.find({
      area: { $in: areasABuscar },
      clientId
    });

    for (const pac of pacientes) {
      // Verificar si el paciente tiene alguna nota registrada
      const notaExiste = await Nota.findOne({
        identificadorPaciente: pac.identificadorPaciente,
        clientId
      });

      if (!notaExiste) {
        // Si no tiene nota, verificar si ya se le notificó
        const notifExiste = await Notification.findOne({
          identificadorPaciente: pac.identificadorPaciente,
          type: "pending_soap",
          clientId
        });

        if (!notifExiste) {
          const nombreCompleto = `${pac.nombres} ${pac.apellidoPaterno || ""}`.trim();
          await Notification.create({
            title: "Nota SOAP Pendiente",
            description: `El paciente ${nombreCompleto} aún no cuenta con su primera Nota SOAP.`,
            area: area,
            type: "pending_soap",
            identificadorPaciente: pac.identificadorPaciente,
            clientId
          });
        }
      } else {
        // Si ya cuenta con nota, limpiar notificaciones pendientes si existieran
        await Notification.deleteMany({
          identificadorPaciente: pac.identificadorPaciente,
          type: "pending_soap",
          clientId
        });
      }
    }
  } catch (err) {
    console.error("Error al generar notificaciones de notas SOAP pendientes:", err);
  }
};

// Fetch notifications for a given user role/area
export const obtenerNotificaciones = async (req, res) => {
  const { area } = req.params; // "fisioterapeuta" o "nutriologa"
  const clientId = req.user.clientId;

  try {
    // Generate upcoming appointment & pending SOAP alerts on demand
    await checkAndGenerateUpcomingNotifications(area, clientId);
    await checkAndGeneratePendingSoapNotifications(area, clientId);

    // Fetch active notifications sorted by newest first
    const notifications = await Notification.find({ area, clientId }).sort({ createdAt: -1 });
    res.status(200).json({ ok: true, notifications });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

// Delete notification on click
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
