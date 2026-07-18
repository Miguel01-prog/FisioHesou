import Module from "../models/module.model.js";

// Obtener todos los módulos
export const obtenerModulos = async (req, res) => {
  try {
    const modules = await Module.find().sort({ createdAt: 1 });
    res.status(200).json({ ok: true, modules });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

// Crear un nuevo módulo (solo superadmin)
export const crearModulo = async (req, res) => {
  try {
    const { key, label, path, icon, parentKey, active } = req.body;
    if (!key || !label || !path || !icon) {
      return res.status(400).json({ ok: false, message: "Todos los campos obligatorios son requeridos" });
    }

    const cleanKey = key.toLowerCase().replace(/[^a-z0-9_]/g, "_");
    
    // Verificar si ya existe
    const existing = await Module.findOne({ key: cleanKey });
    if (existing) {
      return res.status(400).json({ ok: false, message: `El módulo con identificador '${cleanKey}' ya existe.` });
    }

    const newModule = new Module({
      key: cleanKey,
      label,
      path,
      icon,
      parentKey: parentKey || null,
      active: active !== undefined ? active : true
    });

    await newModule.save();
    res.status(201).json({ ok: true, module: newModule });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

// Actualizar módulo (solo superadmin)
export const actualizarModulo = async (req, res) => {
  try {
    const { id } = req.params;
    const { key, label, path, icon, parentKey, active } = req.body;

    const existing = await Module.findById(id);
    if (!existing) {
      return res.status(404).json({ ok: false, message: "Módulo no encontrado" });
    }

    if (key) {
      const cleanKey = key.toLowerCase().replace(/[^a-z0-9_]/g, "_");
      if (cleanKey !== existing.key) {
        const dup = await Module.findOne({ key: cleanKey });
        if (dup) {
          return res.status(400).json({ ok: false, message: "El identificador del módulo ya existe" });
        }
        existing.key = cleanKey;
      }
    }

    if (label !== undefined) existing.label = label;
    if (path !== undefined) existing.path = path;
    if (icon !== undefined) existing.icon = icon;
    if (parentKey !== undefined) existing.parentKey = parentKey || null;
    if (active !== undefined) existing.active = active;

    await existing.save();
    res.status(200).json({ ok: true, module: existing });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

// Eliminar módulo (solo superadmin)
export const eliminarModulo = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await Module.findById(id);
    if (!existing) {
      return res.status(404).json({ ok: false, message: "Módulo no encontrado" });
    }

    await Module.findByIdAndDelete(id);
    res.status(200).json({ ok: true, message: "Módulo eliminado correctamente" });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};
