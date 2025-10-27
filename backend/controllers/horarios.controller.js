// controllers/horarios.controller.js
import mongoose from 'mongoose';
import Horarios from "../models/horarios.model.js";

const normalizeDia = (dia) =>
  String(dia).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

// intenta obtener documento por id o por nombre (case-insensitive)
const findDocByIdentificador = async (ident) => {
  if (!ident) return null;
  // probar como ObjectId
  if (mongoose.Types.ObjectId.isValid(ident)) {
    const docById = await Horarios.findById(ident);
    if (docById) return docById;
  }
  // buscar por nombre (case-insensitive, exact match)
  const escaped = ident.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`^${escaped}$`, 'i');
  return await Horarios.findOne({ nombre: re });
};

// GET /api/horarios/:identificador/disp?fecha=YYYY-MM-DD
export const obtenerDisponibilidad = async (req, res) => {
  try {
    const { identificador } = req.params; // puede ser _id o nombre
    const { fecha } = req.query;
    if (!fecha) return res.status(400).json({ message: "La fecha es requerida" });

    const fechaObj = new Date(fecha);
    if (isNaN(fechaObj)) return res.status(400).json({ message: "Fecha inválida" });

    const diaSemana = fechaObj.toLocaleDateString('es-ES', { weekday: 'long' });

    const doc = await findDocByIdentificador(identificador);
    if (!doc) return res.status(404).json({ message: "Doctora no encontrada" });

    const dia = doc.disponibilidad.find(d => normalizeDia(d.dia) === normalizeDia(diaSemana));
    if (!dia) return res.status(200).json({ nombre: doc.nombre, dia: diaSemana, disponibles: [] });

    let disponibles = Array.isArray(dia.horarios) ? [...dia.horarios] : [];

    if (Array.isArray(dia.bloques) && dia.bloques.length) {
      dia.bloques.forEach(b => {
        disponibles = disponibles.filter(h => (h < b.inicio) || (h >= b.fin));
      });
    }

    return res.json({ nombre: doc.nombre, dia: diaSemana, disponibles });

  } catch (error) {
    console.error("Error obtenerDisponibilidad:", error);
    return res.status(500).json({ message: "Error interno del servidor", error: error.message });
  }
};

// POST /api/horarios/:identificador/bloquear-horas
export const bloquearHoras = async (req, res) => {
  try {
    const { identificador } = req.params;
    const { dia, inicio, fin } = req.body;
    if (!dia || !inicio || !fin) return res.status(400).json({ message: "dia, inicio y fin son requeridos" });

    const doc = await findDocByIdentificador(identificador);
    if (!doc) return res.status(404).json({ message: "Registro no encontrado" });

    const diaObj = doc.disponibilidad.find(d => normalizeDia(d.dia) === normalizeDia(dia));
    if (!diaObj) return res.status(404).json({ message: "Día no encontrado en disponibilidad" });

    const exists = (diaObj.bloques || []).some(b => b.inicio === inicio && b.fin === fin);
    if (exists) return res.status(400).json({ message: "Ese bloque ya existe" });

    diaObj.bloques.push({ inicio, fin });
    await doc.save();

    return res.json({ message: `Bloque agregado para ${dia}`, bloques: diaObj.bloques });

  } catch (error) {
    console.error("Error bloquearHoras:", error);
    return res.status(500).json({ message: "Error interno del servidor", error: error.message });
  }
};

// POST /api/horarios/:identificador/bloquear-dia
export const bloquearDia = async (req, res) => {
  try {
    const { identificador } = req.params;
    const { dia } = req.body;
    if (!dia) return res.status(400).json({ message: "Día es requerido" });

    const doc = await findDocByIdentificador(identificador);
    if (!doc) return res.status(404).json({ message: "Registro no encontrado" });

    const diaObj = doc.disponibilidad.find(d => normalizeDia(d.dia) === normalizeDia(dia));
    if (!diaObj) return res.status(404).json({ message: "Día no encontrado en disponibilidad" });

    diaObj.horarios = [];
    diaObj.bloques = [];
    await doc.save();

    return res.json({ message: `${dia} ha sido bloqueado completamente` });

  } catch (error) {
    console.error("Error bloquearDia:", error);
    return res.status(500).json({ message: "Error interno del servidor", error: error.message });
  }
};

// POST /api/horarios/:identificador/eliminar-bloque
export const eliminarBloque = async (req, res) => {
  try {
    const { identificador } = req.params;
    const { dia, inicio, fin } = req.body;
    if (!dia || !inicio || !fin) return res.status(400).json({ message: "dia, inicio y fin son requeridos" });

    const doc = await findDocByIdentificador(identificador);
    if (!doc) return res.status(404).json({ message: "Registro no encontrado" });

    const diaObj = doc.disponibilidad.find(d => normalizeDia(d.dia) === normalizeDia(dia));
    if (!diaObj) return res.status(404).json({ message: "Día no encontrado en disponibilidad" });

    diaObj.bloques = (diaObj.bloques || []).filter(b => !(b.inicio === inicio && b.fin === fin));
    await doc.save();

    return res.json({ message: `Bloque eliminado para ${dia}`, bloques: diaObj.bloques });

  } catch (error) {
    console.error("Error eliminarBloque:", error);
    return res.status(500).json({ message: "Error interno del servidor", error: error.message });
  }
};
