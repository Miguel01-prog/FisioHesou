
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
        // Asegurar que existan los antecedentes médicos iniciales
        const medExists = await configuracion.findOne({ clave: "AntMed" });
        if (!medExists) {
            await configuracion.create({ clave: "AntMed", descripcion: "Antecedentes Médicos" });
            console.log("obtenerConfiguraciones: Creada configuración inicial AntMed");
        }

        // Asegurar que existan los antecedentes familiares iniciales
        const famExists = await configuracion.findOne({ clave: "AntFam" });
        if (!famExists) {
            await configuracion.create({ clave: "AntFam", descripcion: "Antecedentes Familiares" });
            console.log("obtenerConfiguraciones: Creada configuración inicial AntFam");
        }

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


export const obtenerItemsPorClave = async (req, res) => {
  console.log("PARAMS RECIBIDOS:", req.params);

  try {
    const { clave } = req.params;
    console.log("Clave recibida:", clave);

    let config = await configuracion.findOne({ clave });

    if (!config) {
      if (clave === "AntMed") {
        config = await configuracion.create({ clave: "AntMed", descripcion: "Antecedentes Médicos" });
        console.log("obtenerItemsPorClave: Auto-creada configuración inicial AntMed");
      } else if (clave === "AntFam") {
        config = await configuracion.create({ clave: "AntFam", descripcion: "Antecedentes Familiares" });
        console.log("obtenerItemsPorClave: Auto-creada configuración inicial AntFam");
      } else {
        return res.json({ ok: true, items: [] });
      }
    }

    const items = await confItemSchema.find({
      configuracion: config._id
    }).sort({ consecutivo: 1 });

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
    const itemEliminado = await confItemSchema.findByIdAndDelete(itemId);
    if (!itemEliminado) {
      return res.status(404).json({ ok: false, message: "Ítem no encontrado" });
    }
    res.json({ ok: true, message: "Ítem eliminado con éxito" });
  } catch (error) {
    console.error("Error al eliminar ítem:", error);
    res.status(500).json({ ok: false, message: "Error al eliminar ítem" });
  }
};
