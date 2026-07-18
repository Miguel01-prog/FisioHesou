
import configuracion from "../models/configuracion.model.js";
import confItemSchema from "../models/conf-item.model.js";

// Crear nueva configuración
export const crearConfiguracion = async (req, res) => {
    console.log("crearConfiguracion: Iniciando creación de configuración");
    try {
        const nuevaConfiguracion = new configuracion({
            ...req.body,
            clientId: req.user.clientId
        });
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
        const clientId = req.user.clientId;
        // Asegurar que existan los antecedentes médicos iniciales
        const medExists = await configuracion.findOne({ clave: "AntMed", clientId });
        if (!medExists) {
            await configuracion.create({ clave: "AntMed", descripcion: "Antecedentes Médicos", clientId });
            console.log("obtenerConfiguraciones: Creada configuración inicial AntMed para cliente:", clientId);
        }

        // Asegurar que existan los antecedentes familiares iniciales
        const famExists = await configuracion.findOne({ clave: "AntFam", clientId });
        if (!famExists) {
            await configuracion.create({ clave: "AntFam", descripcion: "Antecedentes Familiares", clientId });
            console.log("obtenerConfiguraciones: Creada configuración inicial AntFam para cliente:", clientId);
        }

        const configuraciones = await configuracion.find({ clientId });
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

    if (!configId || !valor) {
      return res.status(400).json({
        ok: false,
        message: "Datos incompletos"
      });
    }

    const nuevo = await confItemSchema.create({
      configuracion: configId,
      valor,
      clientId: req.user.clientId
    });

    res.status(201).json({ ok: true, data: nuevo });
    console.log("crearItem: Ítem creado con éxito");
  } catch (error) {
    console.error(error);
    res.status(500).json({
      ok: false,
      message: "Error al crear antecedente"
    });
  }
};

export const obtenerItemsPorClave = async (req, res) => {
  console.log("PARAMS RECIBIDOS:", req.params);

  try {
    const { clave } = req.params;
    const clientId = req.user.clientId;
    console.log("Clave recibida:", clave, "para cliente:", clientId);

    let config = await configuracion.findOne({ clave, clientId });

    if (!config) {
      if (clave === "AntMed") {
        config = await configuracion.create({ clave: "AntMed", descripcion: "Antecedentes Médicos", clientId });
        console.log("obtenerItemsPorClave: Auto-creada configuración inicial AntMed");
      } else if (clave === "AntFam") {
        config = await configuracion.create({ clave: "AntFam", descripcion: "Antecedentes Familiares", clientId });
        console.log("obtenerItemsPorClave: Auto-creada configuración inicial AntFam");
      } else {
        return res.json({ ok: true, items: [] });
      }
    }

    const items = await confItemSchema.find({
      configuracion: config._id,
      clientId
    });

    res.json({ ok: true, items });
  } catch (error) {
    console.error("ERROR REAL:", error);
    res.status(500).json({
      ok: false,
      message: "Error al obtener items"
    });
  }
};

// Eliminar un ítem de configuración
export const eliminarItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const itemEliminado = await confItemSchema.findOneAndDelete({
      _id: itemId,
      clientId: req.user.clientId
    });
    if (!itemEliminado) {
      return res.status(404).json({ ok: false, message: "Ítem no encontrado" });
    }
    res.json({ ok: true, message: "Ítem eliminado con éxito" });
  } catch (error) {
    console.error("Error al eliminar ítem:", error);
    res.status(500).json({ ok: false, message: "Error al eliminar ítem" });
  }
};
