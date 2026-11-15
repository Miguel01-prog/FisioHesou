import PlanCosto from "../models/plaes-costos.models.js";

// Obtener todos los planes y costos de la clínica
export const obtenerPlanesCostos = async (req, res) => {
  try {
    const clientId = req.user.clientId;
    const { area, activo, tipo } = req.query;

    const filtro = { clientId };

    if (area && area !== "todos") {
      filtro.$or = [
        { area },
        { area: "general" }
      ];
    }

    if (activo !== undefined && activo !== "todos") {
      filtro.activo = activo === "true" || activo === true;
    }

    if (tipo && tipo !== "todos") {
      filtro.tipo = tipo;
    }

    const planes = await PlanCosto.find(filtro).sort({ activo: -1, createdAt: -1 });

    res.status(200).json({
      ok: true,
      planes,
      total: planes.length
    });
  } catch (error) {
    console.error("Error al obtener planes y costos:", error);
    res.status(500).json({
      ok: false,
      message: "Error al obtener planes y costos",
      error: error.message
    });
  }
};

// Obtener un plan específico por ID
export const obtenerPlanCostoPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const clientId = req.user.clientId;

    const plan = await PlanCosto.findOne({ _id: id, clientId });
    if (!plan) {
      return res.status(404).json({ ok: false, message: "Plan o costo no encontrado" });
    }

    res.status(200).json({ ok: true, plan });
  } catch (error) {
    console.error("Error al obtener plan por ID:", error);
    res.status(500).json({
      ok: false,
      message: "Error al obtener el plan",
      error: error.message
    });
  }
};

// Crear un nuevo plan o costo
export const crearPlanCosto = async (req, res) => {
  try {
    const clientId = req.user.clientId;
    const { nombre, descripcion, costo, sesiones, tipo, area, activo } = req.body;

    if (!nombre || nombre.trim().length === 0) {
      return res.status(400).json({ ok: false, message: "El nombre del plan o servicio es obligatorio" });
    }

    if (costo === undefined || costo === null || isNaN(Number(costo))) {
      return res.status(400).json({ ok: false, message: "El costo o precio debe ser un número válido" });
    }

    const nuevoPlan = new PlanCosto({
      clientId,
      nombre: nombre.trim(),
      descripcion: (descripcion || "").trim(),
      costo: Math.max(0, Number(costo)),
      sesiones: sesiones ? Math.max(1, parseInt(sesiones, 10)) : 1,
      tipo: tipo || "sesion",
      area: area || "general",
      activo: activo !== undefined ? Boolean(activo) : true
    });

    const guardado = await nuevoPlan.save();

    res.status(201).json({
      ok: true,
      message: "Plan o costo creado exitosamente",
      plan: guardado
    });
  } catch (error) {
    console.error("Error al crear plan o costo:", error);
    res.status(500).json({
      ok: false,
      message: "Error al crear el plan o costo",
      error: error.message
    });
  }
};

// Actualizar un plan o costo existente
export const actualizarPlanCosto = async (req, res) => {
  try {
    const { id } = req.params;
    const clientId = req.user.clientId;
    const { nombre, descripcion, costo, sesiones, tipo, area, activo } = req.body;

    const plan = await PlanCosto.findOne({ _id: id, clientId });
    if (!plan) {
      return res.status(404).json({ ok: false, message: "Plan o costo no encontrado" });
    }

    if (nombre !== undefined) plan.nombre = nombre.trim();
    if (descripcion !== undefined) plan.descripcion = descripcion.trim();
    if (costo !== undefined) plan.costo = Math.max(0, Number(costo));
    if (sesiones !== undefined) plan.sesiones = Math.max(1, parseInt(sesiones, 10));
    if (tipo !== undefined) plan.tipo = tipo;
    if (area !== undefined) plan.area = area;
    if (activo !== undefined) plan.activo = Boolean(activo);

    const actualizado = await plan.save();

    res.status(200).json({
      ok: true,
      message: "Plan o costo actualizado correctamente",
      plan: actualizado
    });
  } catch (error) {
    console.error("Error al actualizar plan o costo:", error);
    res.status(500).json({
      ok: false,
      message: "Error al actualizar el plan o costo",
      error: error.message
    });
  }
};

// Alternar estado activo/inactivo
export const toggleEstadoPlanCosto = async (req, res) => {
  try {
    const { id } = req.params;
    const clientId = req.user.clientId;

    const plan = await PlanCosto.findOne({ _id: id, clientId });
    if (!plan) {
      return res.status(404).json({ ok: false, message: "Plan o costo no encontrado" });
    }

    plan.activo = !plan.activo;
    await plan.save();

    res.status(200).json({
      ok: true,
      message: `Plan ${plan.activo ? "activado" : "desactivado"} correctamente`,
      plan
    });
  } catch (error) {
    console.error("Error al cambiar estado de plan:", error);
    res.status(500).json({
      ok: false,
      message: "Error al cambiar estado del plan",
      error: error.message
    });
  }
};

// Eliminar un plan o costo
export const eliminarPlanCosto = async (req, res) => {
  try {
    const { id } = req.params;
    const clientId = req.user.clientId;

    const plan = await PlanCosto.findOneAndDelete({ _id: id, clientId });
    if (!plan) {
      return res.status(404).json({ ok: false, message: "Plan o costo no encontrado" });
    }

    res.status(200).json({
      ok: true,
      message: "Plan o costo eliminado correctamente"
    });
  } catch (error) {
    console.error("Error al eliminar plan o costo:", error);
    res.status(500).json({
      ok: false,
      message: "Error al eliminar el plan o costo",
      error: error.message
    });
  }
};

