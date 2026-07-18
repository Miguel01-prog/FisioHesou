import PlanTratamiento from "../models/plan-tratamiento.model.js";

export const crearPlan = async (req, res) => {
    try {
        const { identificadorPaciente, notasGenerales, ejercicios } = req.body;
        
        const nuevoPlan = new PlanTratamiento({
            identificadorPaciente,
            notasGenerales,
            ejercicios,
            clientId: req.user.clientId
        });

        const planGuardado = await nuevoPlan.save();
        res.status(201).json({ ok: true, plan: planGuardado });
    } catch (error) {
        console.error("Error al crear plan:", error);
        res.status(500).json({ ok: false, error: "Error al crear el plan de tratamiento" });
    }
};

export const obtenerPlanesPorPaciente = async (req, res) => {
    try {
        const { idPaciente } = req.params;
        const planes = await PlanTratamiento.find({ identificadorPaciente: idPaciente, estado: "Activo", clientId: req.user.clientId })
            .populate("ejercicios.ejercicio")
            .sort({ fechaCreacion: -1 });
            
        res.json({ ok: true, planes });
    } catch (error) {
        console.error("Error al obtener planes:", error);
        res.status(500).json({ ok: false, error: "Error al obtener planes de tratamiento" });
    }
};

export const obtenerPlanPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const plan = await PlanTratamiento.findOne({ _id: id, clientId: req.user.clientId }).populate("ejercicios.ejercicio");
        
        if (!plan) {
            return res.status(404).json({ ok: false, msg: "Plan no encontrado" });
        }
        
        res.json({ ok: true, plan });
    } catch (error) {
        console.error("Error al obtener the plan:", error);
        res.status(500).json({ ok: false, error: "Error al obtener el plan de tratamiento" });
    }
};

export const actualizarPlan = async (req, res) => {
    try {
        const { id } = req.params;
        const { notasGenerales, ejercicios } = req.body;
        
        const planActualizado = await PlanTratamiento.findOneAndUpdate(
            { _id: id, clientId: req.user.clientId },
            { notasGenerales, ejercicios },
            { new: true }
        ).populate("ejercicios.ejercicio");
        
        if (!planActualizado) {
            return res.status(404).json({ ok: false, msg: "Plan no encontrado" });
        }
        
        res.json({ ok: true, plan: planActualizado });
    } catch (error) {
        console.error("Error al actualizar el plan:", error);
        res.status(500).json({ ok: false, error: "Error al actualizar el plan de tratamiento" });
    }
};
