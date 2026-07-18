import Notification from "../models/notification.model.js";
import Cita from "../models/cita.model.js";

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

// Fetch notifications for a given user role/area
export const obtenerNotificaciones = async (req, res) => {
  const { area } = req.params; // "fisioterapeuta" o "nutriologa"
  const clientId = req.user.clientId;

  try {
    // Generate upcoming appointment alerts on demand
    await checkAndGenerateUpcomingNotifications(area, clientId);

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
