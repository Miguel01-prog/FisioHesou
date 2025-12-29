
import configuracion from "../models/configuracion.model.js";
import confItemSchema from "../models/conf-item.model.js";

// Crear nueva configuración
export const crearConfiguracion = async (req, res) => {
    console.log("crearConfiguracion: Inciiando creación de configuración");
    try {
        const nuevaConfiguracion = new configuracion(req.body);
        const configuracionGuardada = await nuevaConfiguracion.save();
        res.status(201).json({ ok: true, configuracion: configuracionGuardada });
        console.log("crearConfiguracion: Configuración creada con éxito");
    } catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }       
};

// Obtener todas las configuraciones
export const obtenerConfiguraciones = async (req, res) => {
    console.log("obtenerConfiguraciones: Obteniendo configuraciones");
    try {
        const configuraciones = await configuracion.find();
        res.json({ ok: true, configuraciones });
        console.log("obtenerConfiguraciones: Configuraciones obtenidas con éxito");
    } catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
};
// Crear nuevo ítem de configuración

export const crearItem = async (req, res) => {
  try {
    console.log("crearItem: Iniciando creación de ítem");

    const { configId } = req.params;
    const { valor } = req.body;

    console.log(`configId: ${configId}, valor: ${valor}`);

    if (!configId || !valor) {
      return res.status(400).json({
        ok: false,
        message: "Datos incompletos"
      });
    }

    const nuevo = await confItemSchema.create({
      configuracion: configId,
      valor
    });

    res.status(201).json({ ok: true, data: nuevo });
    if(res.status(201)){
      console.log("crearItem: Ítem creado con éxito");
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      ok: false,
      message: "Error al crear antecedente"
    });
  }
};
