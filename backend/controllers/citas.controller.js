import citaModel from "../models/cita.model.js";
import solicitarCitaModel from "../models/solicitarCita.model.js"; // ✅ ESTA LÍNEA ES CLAVE

export const obtenerCitas = async (req, res) => {
  try {
    const citas = await citaModel.find();
    res.json(citas);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener citas", error });
  }
};

export const ObtenerHorasDisponibles = async (req, res) => {
  try {
    const { fecha } = req.query;
    if (!fecha) {
      return res.status(400).json({ message: "La fecha es requerida" });
    }

    // Horas laborables
    const todasLasHoras = [
      "08:00", "08:30", "09:00", "09:30",
      "10:00", "10:30", "11:00", "11:30",
      "12:00", "12:30", "13:00", "13:30",
      "14:00", "14:30", "15:00", "15:30",
      "16:00", "16:30", "17:00", "17:30",
    ];

   
    const fechaStart = new Date(fecha);
    fechaStart.setHours(0, 0, 0, 0);  

    const fechaEnd = new Date(fecha);
    fechaEnd.setHours(23, 59, 59, 999);  

    const citas = await citaModel.find({ fecha: { $gte: fechaStart, $lte: fechaEnd } });
    const solicitudes = await solicitarCitaModel.find({ fecha: { $gte: fechaStart, $lte: fechaEnd } });

    const horasOcupadas = [
      ...citas.map(c => c.hora),
      ...solicitudes.map(s => s.hora)
    ];
    const horasDisponibles = todasLasHoras.filter(hora => !horasOcupadas.includes(hora));
    if (horasDisponibles.length === 0) {
      return res.status(404).json({ message: "No hay horas disponibles para esta fecha" });
    }
    res.json(horasDisponibles);
  } catch (error) {
    console.error('Error al obtener horas disponibles:', error.message);
    res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  }
};
