import { getUsuarioRol, formatDateDDMMYYYY, toLocalISODate, isHourPassed, capitalizeWords, getHoursUntilAppointment } from "../../utils/utils";
import { useNavigate } from "react-router-dom";
import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import "react-calendar/dist/Calendar.css";
import Calendar from "react-calendar";
import "../../styles/calendary.css";
import api from "../../api";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  FaPlus,
  FaClock,
  FaStar,
  FaStickyNote,
  FaLock,
  FaCalendarAlt,
  FaCalendarDay,
  FaCalendarWeek,
  FaCalendarCheck,
  FaCalendarTimes,
  FaRedoAlt,
  FaTimesCircle,
  FaFolderOpen,
  FaSearch,
  FaPhoneAlt,
  FaChevronDown,
  FaChevronUp,
  FaChevronLeft,
  FaChevronRight,
  FaExclamationCircle,
  FaMoneyBillWave,
  FaCheck
} from "react-icons/fa";
import { showConfirm, showSuccess, showError } from "../../utils/alerts.js";

import ModalAgendarManual from "./ModalAgendarManual.jsx";
import ModalAgendarCita from "./ModalAgendarCita.jsx";
import ModalCancelarCita from "./ModalCancelarCita.jsx";
import CalendarLegend from "./CalendarLegend.jsx";
import LoadingSpinner from "./LoadingSpinner.jsx";

export default function AgendaCitas() {
  const { user: authUser } = useAuth();
  const [citas, setCitas] = useState([]);
  const [loadingCitas, setLoadingCitas] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);
  const [citasDelDia, setCitasDelDia] = useState([]);
  const [blockedDatesAdmin, setBlockedDatesAdmin] = useState([]);
  const [blockedHoursAdmin, setBlockedHoursAdmin] = useState({});
  const [blockedNotesAdmin, setBlockedNotesAdmin] = useState({});
  const [blockedDatesPaciente, setBlockedDatesPaciente] = useState([]);
  const [showAgendarManualModal, setShowAgendarManualModal] = useState(false);

  // Pestaña principal activa: "citas" (calendario programado) | "canceladas" (control de cancelaciones)
  const [mainTab, setMainTab] = useState("citas");
  // Sub-vista de calendario: "dia" | "semana" | "calendario" (mes)
  const [activeView, setActiveView] = useState("dia");
  const [weekDate, setWeekDate] = useState(() => new Date());
  const [searchCanceladas, setSearchCanceladas] = useState("");
  const [fechaFiltroCanceladas, setFechaFiltroCanceladas] = useState("");
  const [currentPageCanceladas, setCurrentPageCanceladas] = useState(1);
  const itemsPerPageCanceladas = 6;

  // Estado de acordeón desplegable y panel emergente (Bottom Sheet) para citas en modo responsivo
  const [expandedCitaId, setExpandedCitaId] = useState(null);
  const [expandedCanceladaId, setExpandedCanceladaId] = useState(null);
  const [showMobileDaySheet, setShowMobileDaySheet] = useState(false);

  // Modales de Cancelar y Reagendar
  const [citaParaCancelar, setCitaParaCancelar] = useState(null);
  const [citaParaReagendar, setCitaParaReagendar] = useState(null);
  const [esCancelacionPorReagendar, setEsCancelacionPorReagendar] = useState(false);

  // Iniciar flujo de reagendar aplicando la política de cancelación (< 24 hrs)
  const handleIniciarReagendar = (cita) => {
    if (!cita) return;
    const fecha = cita.fechaCitaStr || cita.fechaCita;
    const hora = cita.horaCita || cita.hour;
    const hoursRemaining = getHoursUntilAppointment(fecha, hora);
    const isLessThan24h = hoursRemaining < 24;

    // Si la cita aún está ACTIVA (no cancelada) y se intenta reagendar con < 24 horas:
    // Política: no se puede reagendar directamente; solo se podrá cancelar y marcar como cobro/adeudo.
    if (cita.estado !== "Cancelado" && isLessThan24h) {
      setEsCancelacionPorReagendar(true);
      setCitaParaCancelar(cita);
      return;
    }

    setEsCancelacionPorReagendar(false);
    setCitaParaReagendar(cita);
  };

  const storedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  })();
  const user = authUser || storedUser;
  const rolUsuario = getUsuarioRol(user);
  const rolePath = user?.role || user?.rol || "fisioterapeuta";
  const clientId = user?.client?._id || (typeof user?.client === "string" ? user.client : "");
  const hoyStr = toLocalISODate(new Date());
  const navigate = useNavigate();

  const fetchCitas = async () => {
    try {
      setLoadingCitas(true);
      const endpoint = rolUsuario ? `/citas?area=${rolUsuario}` : "/citas";
      const { data } = await api.get(endpoint);
      setCitas(data || []);

      const query = clientId ? `?clientId=${clientId}` : "";

      let adminDays = [];
      let adminHours = {};
      let adminNotes = {};
      let pacienteDays = [
        ...new Set((data || []).filter((c) => c.area !== "administrador" && c.estado !== "Cancelado").map((c) => c.fechaCitaStr))
      ];

      if (rolUsuario) {
        try {
          const { data: horariosData } = await api.get(`/horarios/${rolUsuario}${query}`);
          adminDays = horariosData.blockedDatesAdmin || [];
          adminHours = horariosData.blockedHoursAdmin || {};
          adminNotes = horariosData.blockedNotesAdmin || {};
        } catch (errHorarios) {
          console.error("Error al obtener bloqueos de horario en agenda:", errHorarios);
        }
      }

      setBlockedDatesAdmin(adminDays);
      setBlockedHoursAdmin(adminHours);
      setBlockedNotesAdmin(adminNotes);
      setBlockedDatesPaciente(pacienteDays);

      const targetDay = selectedDay || hoyStr;
      let citasDia = (data || []).filter((c) => c.fechaCitaStr === targetDay && c.estado !== "Cancelado");

      // Quitar de la lista las citas de hoy cuya hora ya transcurrió
      if (targetDay === hoyStr) {
        citasDia = citasDia.filter((c) => !isHourPassed(c.horaCita, targetDay));
      }

      citasDia.sort((a, b) => (a.horaCita > b.horaCita ? 1 : -1));

      if (!selectedDay) {
        setSelectedDay(hoyStr);
      }
      setCitasDelDia(citasDia);
    } catch (err) {
      console.error("Error al cargar citas:", err);
    } finally {
      setLoadingCitas(false);
    }
  };

  useEffect(() => {
    fetchCitas();
  }, [rolUsuario, clientId, selectedDay]);

  const handleDayClick = (date) => {
    const iso = toLocalISODate(date);
    const hoy = toLocalISODate(new Date());
    if (iso < hoy) return;

    setSelectedDay(iso);
    setExpandedCitaId(null);
    if (typeof window !== "undefined" && window.innerWidth <= 960) {
      setShowMobileDaySheet(true);
    }
  };

  const toggleExpandCita = (id) => {
    setExpandedCitaId((prev) => (prev === id ? null : id));
  };

  const toggleExpandCancelada = (id) => {
    setExpandedCanceladaId((prev) => (prev === id ? null : id));
  };

  const handleCobrarAdeudo = async (cita) => {
    const pacienteNombre = `${cita.nombres || ""} ${cita.apellidos || cita.apellidoPaterno || ""}`.trim();
    const confirmed = await showConfirm(
      "¿Marcar Adeudo como Cobrado?",
      `¿Confirmas que se recibió el pago del adeudo por cancelación tardía de ${pacienteNombre}?`
    );
    if (!confirmed) return;

    try {
      await api.put(`/citas/${cita._id}/adeudo/pagar`);
      showSuccess("Adeudo Cobrado", `Se registró el cobro del adeudo de ${pacienteNombre}.`);
      fetchCitas();
    } catch (err) {
      console.error("Error al cobrar adeudo:", err);
      const msg = err?.response?.data?.message || "No se pudo registrar el cobro del adeudo.";
      showError("Error", msg);
    }
  };

  const selectedDayBlockedHours = selectedDay ? blockedHoursAdmin[selectedDay] || [] : [];
  const selectedDayBlockNote = selectedDay ? blockedNotesAdmin[selectedDay] || "" : "";
  const isSelectedDayFullyBlocked = selectedDay
    ? (blockedDatesAdmin.includes(selectedDay) && (selectedDayBlockedHours.length === 0 || selectedDayBlockedHours.length >= 12)) ||
    (user?.client?.blockSundays && new Date(selectedDay + "T00:00:00").getDay() === 0)
    : false;

  // Lista de citas canceladas ordenadas de la más reciente a la más antigua
  const citasCanceladas = useMemo(() => {
    return (citas || [])
      .filter((c) => c.estado === "Cancelado")
      .sort((a, b) => {
        const dateA = a.fechaCancelacion ? new Date(a.fechaCancelacion).getTime() : new Date(`${a.fechaCitaStr}T${a.horaCita || "00:00"}`).getTime();
        const dateB = b.fechaCancelacion ? new Date(b.fechaCancelacion).getTime() : new Date(`${b.fechaCitaStr}T${b.horaCita || "00:00"}`).getTime();
        return dateB - dateA;
      });
  }, [citas]);

  const citasCanceladasFiltradas = useMemo(() => {
    return citasCanceladas.filter((c) => {
      const nombreCompleto = `${c.nombres || ""} ${c.apellidos || c.apellidoPaterno || ""}`.toLowerCase();
      const tel = String(c.telefono || "").toLowerCase();
      const motivo = String(c.motivoCancelacion || "").toLowerCase();
      const exp = String(c.identificadorPaciente || "").toLowerCase();
      const q = searchCanceladas.trim().toLowerCase();

      const matchesSearch = !q || nombreCompleto.includes(q) || tel.includes(q) || motivo.includes(q) || exp.includes(q);
      const matchesDate = !fechaFiltroCanceladas || c.fechaCitaStr === fechaFiltroCanceladas;
      return matchesSearch && matchesDate;
    });
  }, [citasCanceladas, searchCanceladas, fechaFiltroCanceladas]);

  useEffect(() => {
    setCurrentPageCanceladas(1);
    setExpandedCanceladaId(null);
  }, [searchCanceladas, fechaFiltroCanceladas]);

  const totalPagesCanceladas = Math.max(1, Math.ceil(citasCanceladasFiltradas.length / itemsPerPageCanceladas));
  const safePageCanceladas = Math.min(currentPageCanceladas, totalPagesCanceladas);
  const startIndexCanceladas = (safePageCanceladas - 1) * itemsPerPageCanceladas;
  const endIndexCanceladas = Math.min(startIndexCanceladas + itemsPerPageCanceladas, citasCanceladasFiltradas.length);

  const citasCanceladasPaginadas = useMemo(() => {
    return citasCanceladasFiltradas.slice(startIndexCanceladas, startIndexCanceladas + itemsPerPageCanceladas);
  }, [citasCanceladasFiltradas, startIndexCanceladas, itemsPerPageCanceladas]);

  const canceladasHoyCount = useMemo(() => {
    return citasCanceladas.filter((c) => {
      if (c.fechaCancelacion) {
        return toLocalISODate(new Date(c.fechaCancelacion)) === hoyStr;
      }
      return c.fechaCitaStr === hoyStr;
    }).length;
  }, [citasCanceladas, hoyStr]);

  const adeudosPendientesCount = useMemo(() => {
    return citasCanceladas.filter((c) => c.tieneAdeudo && !c.adeudoPagado).length;
  }, [citasCanceladas]);

  const citasActivasCount = useMemo(() => {
    return (citas || []).filter((c) => c.estado !== "Cancelado").length;
  }, [citas]);

  // Cálculos y navegación para la Vista por Semana
  const getStartOfWeek = (d) => {
    const date = new Date(d);
    const day = date.getDay(); // 0 es Domingo
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Ajustar a Lunes
    const monday = new Date(date.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  };

  const weekStart = useMemo(() => getStartOfWeek(weekDate), [weekDate]);

  const weekEnd = useMemo(() => {
    const end = new Date(weekStart);
    end.setDate(weekStart.getDate() + 6);
    return end;
  }, [weekStart]);

  const weekDays = useMemo(() => {
    const names = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
    const shortNames = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      const iso = toLocalISODate(d);
      const isPast = iso < hoyStr;
      const isToday = iso === hoyStr;
      const isSunday = i === 6;
      const isBlocked =
        (user?.client?.blockSundays && isSunday) ||
        (blockedDatesAdmin.includes(iso) && ((blockedHoursAdmin[iso] || []).length === 0 || (blockedHoursAdmin[iso] || []).length >= 12));
      days.push({
        date: d,
        iso,
        name: names[i],
        shortName: shortNames[i],
        dayNumber: d.getDate(),
        isPast,
        isToday,
        isBlocked
      });
    }
    return days;
  }, [weekStart, hoyStr, blockedHoursAdmin, blockedDatesAdmin, user?.client?.blockSundays]);

  // Mapa de citas por fecha para acceso O(1) en la vista semanal
  const citasPorFecha = useMemo(() => {
    const map = {};
    (citas || []).forEach((c) => {
      if (c.estado === "Cancelado") return;
      if (!map[c.fechaCitaStr]) {
        map[c.fechaCitaStr] = [];
      }
      map[c.fechaCitaStr].push(c);
    });
    Object.keys(map).forEach((dateKey) => {
      map[dateKey].sort((a, b) => (a.horaCita > b.horaCita ? 1 : -1));
    });
    return map;
  }, [citas]);

  const handlePrevWeek = () => {
    setWeekDate((prev) => new Date(prev.getTime() - 7 * 24 * 60 * 60 * 1000));
  };

  const handleNextWeek = () => {
    setWeekDate((prev) => new Date(prev.getTime() + 7 * 24 * 60 * 60 * 1000));
  };

  const handleCurrentWeek = () => {
    const today = new Date();
    setWeekDate(today);
    setSelectedDay(hoyStr);
    const citasDia = (citas || []).filter((c) => c.fechaCitaStr === hoyStr && c.estado !== "Cancelado");
    citasDia.sort((a, b) => (a.horaCita > b.horaCita ? 1 : -1));
    setCitasDelDia(citasDia);
    setActiveView("dia");
  };

  const getDayNameFromIso = (iso) => {
    if (!iso) return "";
    const [year, month, day] = iso.split("-").map(Number);
    const d = new Date(year, month - 1, day);
    const diasSemana = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    return diasSemana[d.getDay()];
  };

  const getDayViewTitle = (dateIso) => {
    if (!dateIso) return "";
    const [year, month, day] = dateIso.split("-").map(Number);
    const d = new Date(year, month - 1, day);
    const diasSemana = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const meses = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    const nombreDia = diasSemana[d.getDay()];
    const nombreMes = meses[d.getMonth()];

    if (dateIso === hoyStr) {
      return `Hoy, ${nombreDia} ${day} de ${nombreMes} ${year}`;
    }
    return `${nombreDia}, ${day} de ${nombreMes} ${year}`;
  };

  const handlePrev = () => {
    if (activeView === "dia") {
      const current = selectedDay ? new Date(selectedDay + "T00:00:00") : new Date();
      current.setDate(current.getDate() - 1);
      const newIso = toLocalISODate(current);
      setSelectedDay(newIso);
      setWeekDate(current);
      const citasDia = (citas || []).filter((c) => c.fechaCitaStr === newIso && c.estado !== "Cancelado");
      citasDia.sort((a, b) => (a.horaCita > b.horaCita ? 1 : -1));
      setCitasDelDia(citasDia);
    } else {
      handlePrevWeek();
    }
  };

  const handleNext = () => {
    if (activeView === "dia") {
      const current = selectedDay ? new Date(selectedDay + "T00:00:00") : new Date();
      current.setDate(current.getDate() + 1);
      const newIso = toLocalISODate(current);
      setSelectedDay(newIso);
      setWeekDate(current);
      const citasDia = (citas || []).filter((c) => c.fechaCitaStr === newIso && c.estado !== "Cancelado");
      citasDia.sort((a, b) => (a.horaCita > b.horaCita ? 1 : -1));
      setCitasDelDia(citasDia);
    } else {
      handleNextWeek();
    }
  };

  const getWeekRangeTitle = (start, end) => {
    if (!start || !end) return "";
    const meses = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    const mesesCortos = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

    const today = new Date();
    const todayIso = toLocalISODate(today);
    const startIso = toLocalISODate(start);
    const endIso = toLocalISODate(end);

    // Cuando la semana visualizada sea la actual (contenga hoy), mostrar solo el día de hoy
    if (todayIso >= startIso && todayIso <= endIso) {
      const diaNum = today.getDate();
      const mesNombre = meses[today.getMonth()];
      const anio = today.getFullYear();
      return `Hoy, ${diaNum} de ${mesNombre} ${anio}`;
    }

    const startDay = start.getDate();
    const endDay = end.getDate();
    const startMonth = start.getMonth();
    const endMonth = end.getMonth();
    const startYear = start.getFullYear();
    const endYear = end.getFullYear();

    if (startYear !== endYear) {
      return `${startDay} ${mesesCortos[startMonth]} ${startYear} – ${endDay} ${mesesCortos[endMonth]} ${endYear}`;
    }
    if (startMonth !== endMonth) {
      return `${startDay} ${mesesCortos[startMonth]} – ${endDay} ${mesesCortos[endMonth]} ${startYear}`;
    }
    return `${startDay} – ${endDay} de ${meses[startMonth]} ${startYear}`;
  };

  // Estado y constantes para la cuadrícula estilo Google Calendar
  const [citaSeleccionadaGcal, setCitaSeleccionadaGcal] = useState(null);

  const HORAS_GCAL = [
    "08:00", "09:00", "10:00", "11:00", "12:00",
    "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"
  ];

  const getCitasEnSlot = (fechaIso, horaBase) => {
    const diaCitas = citasPorFecha[fechaIso] || [];
    const targetHour = parseInt(horaBase.split(":")[0], 10);
    return diaCitas.filter((c) => {
      if (!c.horaCita) return false;
      const citaHour = parseInt(c.horaCita.split(":")[0], 10);
      return citaHour === targetHour;
    });
  };

  // Helper robusto para comparar horas (ej. "8:00" === "08:00", "8:00 AM" === "08:00")
  const isHourMatch = (list = [], targetHour) => {
    if (!Array.isArray(list) || !targetHour) return false;
    const targetClean = targetHour.trim();
    const targetHourNum = parseInt(targetClean.split(":")[0], 10);
    const targetMinNum = parseInt(targetClean.split(":")[1] || "0", 10);

    return list.some((h) => {
      if (!h) return false;
      const clean = String(h).trim();
      if (clean === targetClean) return true;
      const match = clean.match(/^(\d{1,2}):(\d{2})/);
      if (!match) return false;
      let hNum = parseInt(match[1], 10);
      const mNum = parseInt(match[2], 10);
      const upper = clean.toUpperCase();
      if (upper.includes("PM") && hNum < 12) hNum += 12;
      if (upper.includes("AM") && hNum === 12) hNum = 0;
      return hNum === targetHourNum && mNum === targetMinNum;
    });
  };

  const checkIsSlotBlocked = (dateIso, hora, citasEnHora = []) => {
    // Si ya existe una cita programada en esta hora, no es un slot bloqueado sino una cita activa
    if (citasEnHora.length > 0) return false;

    // 1. Domingo bloqueado por configuración de cliente
    const isSunday = new Date(dateIso + "T00:00:00").getDay() === 0;
    if (user?.client?.blockSundays && isSunday) return true;

    const horasBloqueadas = blockedHoursAdmin[dateIso] || [];
    const esDiaEnAdmin = blockedDatesAdmin.includes(dateIso);

    // 2. Si el día está registrado en blockedDatesAdmin y no tiene horas específicas (o tiene >= 12 horas), el día entero está bloqueado
    if (esDiaEnAdmin && (horasBloqueadas.length === 0 || horasBloqueadas.length >= 12)) {
      return true;
    }

    // 3. Si la hora específica coincide con la lista de horas bloqueadas del día
    if (isHourMatch(horasBloqueadas, hora)) {
      return true;
    }

    return false;
  };

  const getCurrentTimeOffsetPercent = () => {
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();
    if (h < 8 || h >= 20) return null;
    const minutesSince8 = (h - 8) * 60 + m;
    const totalMinutes = 12 * 60; // 8:00 a 20:00 = 720 min
    return (minutesSince8 / totalMinutes) * 100;
  };

  return (
    <div className="auth-wrapper-content">
      <style>{`
        /* Toolbar Unificada Estilo Google Calendar */
        .agenda-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.85rem;
          margin-bottom: 1.25rem;
          padding-bottom: 0.85rem;
          border-bottom: 1px solid var(--border-light, rgba(148, 163, 184, 0.2));
        }
        .agenda-toolbar-left {
          display: flex;
          align-items: center;
          gap: 1.15rem;
          flex-wrap: wrap;
        }
        .agenda-nav-group {
          display: flex;
          align-items: center;
          gap: 0.65rem;
        }
        .btn-toolbar-today {
          padding: 6px 14px;
          border-radius: 8px;
          border: 1px solid var(--border-light, rgba(148, 163, 184, 0.35));
          background: var(--card-bg, #ffffff);
          color: var(--text-main);
          font-weight: 700;
          font-size: 0.82rem;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .btn-toolbar-today:hover {
          background: rgba(99, 102, 241, 0.08);
          border-color: var(--primary, #6366f1);
          color: var(--primary, #6366f1);
        }
        .agenda-nav-chevrons {
          display: inline-flex;
          align-items: center;
          background: rgba(148, 163, 184, 0.1);
          border-radius: 8px;
          padding: 2px;
        }
        .btn-toolbar-chevron {
          width: 30px;
          height: 30px;
          border-radius: 6px;
          border: none;
          background: transparent;
          color: var(--text-main);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .btn-toolbar-chevron:hover {
          background: var(--card-bg, #ffffff);
          color: var(--primary, #6366f1);
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
        }
        .agenda-nav-title {
          font-weight: 700;
          font-size: 0.95rem;
          color: var(--text-main);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-align: center;
        }

        .agenda-toolbar-right {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
        }
        .agenda-segmented-views {
          display: inline-flex;
          background: rgba(148, 163, 184, 0.12);
          padding: 3px;
          border-radius: 10px;
          gap: 2px;
        }
        .segmented-view-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 6px 12px;
          border-radius: 7px;
          border: none;
          font-weight: 600;
          font-size: 0.8rem;
          color: var(--text-muted);
          background: transparent;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .segmented-view-btn:hover {
          color: var(--text-main);
        }
        .segmented-view-btn.active {
          background: var(--primary, #6366f1);
          color: #ffffff;
          font-weight: 700;
          box-shadow: 0 1px 4px rgba(99, 102, 241, 0.3);
        }
        /* ==================== PESTAÑAS PRINCIPALES (TABS) ==================== */
        .agenda-main-tabs-bar {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: var(--card-bg, #ffffff);
          padding: 0.4rem 0.5rem;
          border-radius: 12px;
          border: 1px solid var(--border-light, rgba(148, 163, 184, 0.22));
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
          margin-bottom: 1.15rem;
        }
        .agenda-main-tab-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.55rem;
          padding: 0.65rem 1.25rem;
          border-radius: 9px;
          border: none;
          background: transparent;
          color: var(--text-muted, #64748b);
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);
          white-space: nowrap;
          user-select: none;
        }
        .agenda-main-tab-btn:hover {
          background: rgba(148, 163, 184, 0.08);
          color: var(--text-main, #1e293b);
        }
        .agenda-main-tab-btn.active {
          background: var(--primary, #6366f1);
          color: #ffffff;
          font-weight: 700;
          box-shadow: 0 2px 6px rgba(99, 102, 241, 0.28);
        }
        .agenda-main-tab-btn.canceladas:hover {
          background: rgba(239, 68, 68, 0.08);
          color: #dc2626;
        }
        .agenda-main-tab-btn.canceladas.active {
          background: #ef4444;
          color: #ffffff;
          box-shadow: 0 2px 6px rgba(239, 68, 68, 0.3);
        }
        .agenda-tab-badge {
          padding: 2px 8px;
          border-radius: 999px;
          font-size: 0.72rem;
          font-weight: 800;
          display: inline-flex;
          align-items: center;
          gap: 3px;
          transition: all 0.15s ease;
        }
        .agenda-main-tab-btn .agenda-tab-badge.primary {
          background: rgba(99, 102, 241, 0.12);
          color: var(--primary, #6366f1);
        }
        .agenda-main-tab-btn.active .agenda-tab-badge.primary {
          background: rgba(255, 255, 255, 0.25);
          color: #ffffff;
        }
        .agenda-main-tab-btn .agenda-tab-badge.danger {
          background: rgba(239, 68, 68, 0.12);
          color: #dc2626;
        }
        .agenda-main-tab-btn.active.canceladas .agenda-tab-badge.danger {
          background: rgba(255, 255, 255, 0.25);
          color: #ffffff;
        }
        .agenda-main-tab-btn .agenda-tab-badge.warning {
          background: rgba(245, 158, 11, 0.16);
          color: #b45309;
        }
        .agenda-main-tab-btn.active.canceladas .agenda-tab-badge.warning {
          background: rgba(254, 243, 199, 0.95);
          color: #92400e;
        }
        .canceladas-tab-toolbar {
          margin-bottom: 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          gap: 0.75rem;
        }
        .canceladas-tab-toolbar .agenda-toolbar-left {
          display: flex;
          align-items: center;
          width: auto;
          flex: 1 1 auto;
          min-width: 0;
        }
        .canceladas-tab-toolbar .agenda-toolbar-right {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          margin-left: auto;
          width: auto;
          flex-shrink: 0;
        }
        .canceladas-tab-toolbar .agenda-btn-agendar {
          width: auto;
          margin-left: auto;
          white-space: nowrap;
        }
        .agenda-btn-agendar {
          height: 36px;
          padding: 0 14px;
          font-size: 0.82rem;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
          border-radius: 8px;
        }
        .btn-text-full {
          display: inline;
        }
        .btn-text-short {
          display: none;
        }

        /* Estilos Vista por Semana - Google Calendar Style */
        .gcal-wrapper {
          display: flex;
          flex-direction: column;
          background: #ffffff;
          border: 1px solid #dadce0;
          border-radius: 12px;
          overflow-x: auto;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
          width: 100%;
          -webkit-overflow-scrolling: touch;
        }
        .gcal-header-row {
          display: grid;
          grid-template-columns: 56px repeat(7, minmax(95px, 1fr));
          min-width: 720px;
          background: #ffffff;
          border-bottom: 1px solid #dadce0;
          position: sticky;
          top: 0;
          z-index: 10;
        }
        .gcal-header-gutter {
          border-right: 1px solid #dadce0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.7rem;
          color: #70757a;
          font-weight: 600;
        }
        .gcal-header-day {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 0.6rem 0.2rem;
          border-right: 1px solid #dadce0;
          user-select: none;
        }
        .gcal-header-day:last-child {
          border-right: none;
        }
        .gcal-day-name {
          font-size: 0.72rem;
          text-transform: uppercase;
          font-weight: 600;
          color: #70757a;
          margin-bottom: 3px;
          letter-spacing: 0.03em;
        }
        .gcal-day-circle {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          font-size: 1.05rem;
          font-weight: 600;
          color: #3c4043;
          transition: all 0.15s ease;
        }
        .gcal-header-day.today .gcal-day-name {
          color: var(--primary, #6366f1);
          font-weight: 700;
        }
        .gcal-header-day.today .gcal-day-circle {
          background: var(--primary, #6366f1);
          color: #ffffff;
          font-weight: 700;
        }

        .gcal-grid-scroll {
          display: grid;
          grid-template-columns: 56px repeat(7, minmax(95px, 1fr));
          min-width: 720px;
          position: relative;
          max-height: 600px;
          overflow-y: auto;
        }
        .gcal-time-column {
          display: flex;
          flex-direction: column;
          border-right: 1px solid #dadce0;
          background: #fafafa;
        }
        .gcal-time-cell {
          height: 52px;
          border-bottom: 1px solid #edf2f7;
          display: flex;
          justify-content: flex-end;
          padding-right: 6px;
          font-size: 0.68rem;
          color: #70757a;
          font-weight: 500;
          box-sizing: border-box;
        }
        .gcal-time-cell span {
          transform: translateY(-8px);
        }
        .gcal-time-column .gcal-time-cell:first-child span {
          transform: translateY(2px);
        }

        .gcal-day-column {
          display: flex;
          flex-direction: column;
          border-right: 1px solid #dadce0;
          position: relative;
          background: #ffffff;
        }
        .gcal-day-column:last-child {
          border-right: none;
        }
        .gcal-day-column.today {
          background: rgba(99, 102, 241, 0.02);
        }
        .gcal-slot {
          height: 52px;
          border-bottom: 1px solid #f1f3f4;
          box-sizing: border-box;
          position: relative;
          cursor: pointer;
          transition: background 0.15s ease;
          padding: 2px 3px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .gcal-slot:hover {
          background: rgba(99, 102, 241, 0.06);
        }
        .gcal-slot.past-slot {
          background: rgba(241, 245, 249, 0.65);
          cursor: not-allowed;
          opacity: 0.7;
        }
        .gcal-slot.blocked {
          background: repeating-linear-gradient(
            45deg,
            rgba(241, 245, 249, 0.7),
            rgba(241, 245, 249, 0.7) 10px,
            rgba(226, 232, 240, 0.45) 10px,
            rgba(226, 232, 240, 0.45) 20px
          );
          cursor: not-allowed;
        }
        .gcal-slot.blocked:hover {
          background: repeating-linear-gradient(
            45deg,
            rgba(241, 245, 249, 0.9),
            rgba(241, 245, 249, 0.9) 10px,
            rgba(226, 232, 240, 0.65) 10px,
            rgba(226, 232, 240, 0.65) 20px
          );
        }
        .gcal-slot-dia.blocked {
          border-left: 3px solid rgba(239, 68, 68, 0.35);
        }
        .gcal-slot-blocked-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
          height: 100%;
          padding: 0 8px;
          color: #94a3b8;
          font-size: 0.75rem;
          font-weight: 500;
          pointer-events: none;
        }
        .gcal-slot-blocked-indicator svg {
          color: #ef4444;
          opacity: 0.75;
        }
        .gcal-slot-blocked-note {
          font-size: 0.7rem;
          font-weight: normal;
          color: #64748b;
          font-style: italic;
          margin-left: 2px;
        }

        .gcal-event-chip {
          background: rgba(99, 102, 241, 0.12);
          border-left: 3.5px solid var(--primary, #6366f1);
          border-radius: 4px;
          padding: 3px 5px;
          font-size: 0.72rem;
          color: #3730a3;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          cursor: pointer;
          box-shadow: 0 1px 2px rgba(0,0,0,0.06);
          transition: all 0.15s ease;
          display: flex;
          flex-direction: column;
          gap: 1px;
        }
        .gcal-event-chip:hover {
          background: rgba(99, 102, 241, 0.22);
          box-shadow: 0 2px 6px rgba(0,0,0,0.12);
          transform: translateY(-1px);
        }
        .gcal-event-chip.nuevo {
          border-left-color: #f59e0b;
        }

        /* Línea roja de hora actual */
        .gcal-current-line {
          position: absolute;
          left: 0;
          right: 0;
          height: 2px;
          background: #ef4444;
          z-index: 5;
          pointer-events: none;
        }
        .gcal-current-dot {
          position: absolute;
          left: -4px;
          top: -4px;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #ef4444;
        }

        /* Estilos Vista de Día - Google Calendar Day View */
        .gcal-day-view-wrapper {
          display: flex;
          flex-direction: column;
          background: #ffffff;
          border: 1px solid #dadce0;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
          width: 100%;
        }
        .gcal-day-view-header {
          display: grid;
          grid-template-columns: 56px 1fr;
          background: #ffffff;
          border-bottom: 1px solid #dadce0;
          position: sticky;
          top: 0;
          z-index: 10;
        }
        .gcal-day-view-title-col {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.65rem 1rem;
        }
        .gcal-day-view-title-col.today .gcal-day-name {
          color: var(--primary, #6366f1);
          font-weight: 700;
        }
        .gcal-day-view-title-col.today .gcal-day-circle {
          background: var(--primary, #6366f1);
          color: #ffffff;
          font-weight: 700;
        }
        .gcal-day-count-badge {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-muted);
          background: rgba(148, 163, 184, 0.12);
          padding: 2px 8px;
          border-radius: 999px;
        }
        .gcal-day-view-grid {
          display: grid;
          grid-template-columns: 56px 1fr;
          position: relative;
          max-height: 620px;
          overflow-y: auto;
        }
        .gcal-slot-dia {
          min-height: 58px;
          height: auto;
          padding: 4px 8px;
          gap: 4px;
        }
        .gcal-slot-empty-hint {
          display: none;
          font-size: 0.72rem;
          color: var(--primary, #6366f1);
          font-weight: 600;
          padding: 4px 6px;
        }
        .gcal-slot-dia:hover .gcal-slot-empty-hint {
          display: flex;
          align-items: center;
        }
        .gcal-day-event-card {
          background: rgba(99, 102, 241, 0.1);
          border-left: 4.5px solid var(--primary, #6366f1);
          border-radius: 6px;
          padding: 6px 10px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          cursor: pointer;
          transition: all 0.15s ease;
          width: 100%;
          box-sizing: border-box;
        }
        .gcal-day-event-card:hover {
          background: rgba(99, 102, 241, 0.18);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
          transform: translateY(-1px);
        }
        .gcal-day-event-card.nuevo {
          border-left-color: #f59e0b;
        }
        .gcal-day-event-left {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          flex-wrap: wrap;
          min-width: 0;
        }
        .gcal-event-time-badge {
          font-size: 0.78rem;
          font-weight: 800;
          color: var(--primary, #6366f1);
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .gcal-event-patient-name {
          font-size: 0.88rem;
          color: var(--text-main);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .tag-nuevo-mini {
          font-size: 0.66rem;
          font-weight: 700;
          color: #d97706;
          background: rgba(245, 158, 11, 0.15);
          padding: 1px 5px;
          border-radius: 4px;
          display: inline-flex;
          align-items: center;
          gap: 3px;
        }
        .tag-exp-mini {
          font-size: 0.66rem;
          color: var(--text-muted);
          background: rgba(148, 163, 184, 0.15);
          padding: 1px 5px;
          border-radius: 4px;
        }
        .gcal-event-phone {
          font-size: 0.76rem;
          color: var(--text-muted);
        }
        .gcal-day-event-right {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }
        .btn-gcal-mini {
          padding: 4px 8px;
          border-radius: 6px;
          border: 1px solid rgba(148, 163, 184, 0.3);
          background: var(--card-bg, #ffffff);
          color: var(--text-main);
          font-size: 0.72rem;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          transition: all 0.15s ease;
        }
        .btn-gcal-mini:hover {
          border-color: var(--primary, #6366f1);
          color: var(--primary, #6366f1);
        }
        .btn-gcal-mini.primary {
          background: var(--primary, #6366f1);
          color: #ffffff;
          border-color: var(--primary, #6366f1);
        }
        .btn-gcal-mini.primary:hover {
          opacity: 0.9;
        }
        .btn-gcal-mini.danger {
          background: rgba(239, 68, 68, 0.08);
          color: #ef4444;
          border-color: rgba(239, 68, 68, 0.3);
        }
        .btn-gcal-mini.danger:hover {
          background: #ef4444;
          color: #ffffff;
          border-color: #ef4444;
        }

        /* Vistas escritorio vs responsivo para Citas del Día y Citas Canceladas */
        .citas-dia-desktop {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
          width: 100%;
        }
        .citas-dia-mobile-accordion {
          display: none;
        }
        .mobile-day-quickbar {
          display: none;
        }
        .canceladas-desktop-table {
          display: block;
          width: 100%;
          overflow-x: auto;
        }
        .canceladas-mobile-cards {
          display: none;
        }
        .canceladas-kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 0.85rem;
        }
        .canceladas-filter-bar {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
          align-items: center;
          background: rgba(255, 255, 255, 0.02);
          padding: 0.75rem;
          border-radius: 12px;
          border: 1px solid var(--border-light, rgba(148, 163, 184, 0.2));
        }
        .canceladas-filter-search {
          position: relative;
          flex: 1 1 240px;
        }
        .canceladas-filter-dates {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .canceladas-pagination-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.75rem;
          margin-top: 1.25rem;
          padding-top: 0.9rem;
          border-top: 1px solid var(--border-light, rgba(148, 163, 184, 0.2));
        }
        .canceladas-pagination-controls {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .pagination-badge-page {
          font-size: 0.82rem;
          font-weight: 700;
          color: var(--text-main);
          padding: 4px 10px;
          border-radius: 6px;
          background: rgba(99, 102, 241, 0.08);
          border: 1px solid rgba(99, 102, 241, 0.2);
        }

        @keyframes slideUpSheet {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @media (max-width: 1080px) {
          .agenda-toolbar {
            flex-direction: column;
            align-items: stretch;
            gap: 0.85rem;
          }
          .agenda-toolbar-left {
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;
            flex-wrap: wrap;
            gap: 0.75rem;
          }
          .agenda-toolbar-right {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            margin-left: auto;
            width: 100%;
            gap: 0.75rem;
          }
          .canceladas-tab-toolbar {
            flex-direction: row !important;
            justify-content: space-between !important;
            align-items: center !important;
            width: 100% !important;
            flex-wrap: nowrap !important;
          }
          .canceladas-tab-toolbar .agenda-toolbar-left {
            width: auto !important;
            flex: 1 1 auto !important;
          }
          .canceladas-tab-toolbar .agenda-toolbar-right {
            width: auto !important;
            margin-left: auto !important;
            justify-content: flex-end !important;
          }
          .canceladas-tab-toolbar .agenda-btn-agendar {
            width: auto !important;
            margin-left: auto !important;
          }
          .agenda-segmented-views {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            flex: 0 0 auto;
            min-width: 240px;
          }
          .segmented-view-btn {
            justify-content: center;
            padding: 7px 12px;
            font-size: 0.78rem;
          }
          .agenda-toolbar-actions-row {
            display: flex;
            align-items: center;
            gap: 0.65rem;
          }
          .agenda-right-citas {
            display: none !important;
          }
          .mobile-day-quickbar {
            display: flex !important;
            align-items: center;
            justify-content: space-between;
            gap: 0.6rem;
            flex-wrap: wrap;
            width: 100%;
            background: rgba(99, 102, 241, 0.08);
            border: 1px solid rgba(99, 102, 241, 0.22);
            border-radius: 12px;
            padding: 0.7rem 0.9rem;
            margin-bottom: 0.85rem;
          }
          .citas-dia-desktop {
            display: none !important;
          }
          .citas-dia-mobile-accordion {
            display: flex !important;
            flex-direction: column;
            gap: 0.65rem;
            width: 100%;
          }
          .canceladas-desktop-table {
            display: none !important;
          }
          .canceladas-mobile-cards {
            display: flex !important;
            flex-direction: column;
            gap: 0.35rem;
            width: 100%;
          }
        }
        @media (max-width: 640px) {
          .agenda-toolbar-left {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.65rem;
            width: 100%;
          }
          .agenda-nav-group {
            width: 100%;
            justify-content: space-between;
            background: rgba(148, 163, 184, 0.08);
            padding: 4px 8px;
            border-radius: 8px;
          }
          .agenda-nav-title {
            font-size: 0.82rem;
            text-align: center;
            justify-content: center;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            flex: 1;
          }
          .agenda-toolbar-right {
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: flex-end;
            margin-left: auto;
            gap: 0.65rem;
            width: 100%;
          }
          .agenda-segmented-views {
            width: 100%;
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 2px;
          }
          .segmented-view-btn {
            justify-content: center;
            padding: 7px 4px;
            font-size: 0.75rem;
            gap: 4px;
          }
          .agenda-main-tabs-bar {
            width: 100%;
            display: grid;
            grid-template-columns: 1fr 1fr;
            padding: 0.35rem;
            gap: 0.35rem;
          }
          .agenda-main-tab-btn {
            justify-content: center;
            padding: 0.55rem 0.5rem;
            font-size: 0.8rem;
            gap: 0.4rem;
          }
          .agenda-btn-agendar {
            width: auto;
            margin-left: auto;
            align-self: flex-end;
            justify-content: center;
            height: 38px;
            font-size: 0.84rem;
          }
          .canceladas-tab-toolbar {
            flex-direction: row !important;
            justify-content: space-between !important;
            align-items: center !important;
            width: 100% !important;
            flex-wrap: nowrap !important;
            gap: 0.5rem !important;
          }
          .canceladas-tab-toolbar .agenda-toolbar-left {
            width: auto !important;
            flex: 1 1 auto !important;
            min-width: 0 !important;
          }
          .canceladas-tab-toolbar .agenda-toolbar-left h2 {
            font-size: 1.05rem !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
          }
          .canceladas-tab-toolbar .agenda-toolbar-right {
            width: auto !important;
            margin-left: auto !important;
            justify-content: flex-end !important;
            flex-shrink: 0 !important;
          }
          .canceladas-tab-toolbar .agenda-btn-agendar {
            width: auto !important;
            margin-left: auto !important;
            align-self: flex-end !important;
            padding: 0 10px !important;
            font-size: 0.8rem !important;
          }
          .gcal-day-event-card {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.45rem;
            padding: 6px 8px;
          }
          .gcal-day-event-right {
            width: 100%;
            justify-content: flex-end;
          }
        }
        @media (max-width: 420px) {
          .agenda-main-tab-btn {
            font-size: 0.74rem;
            padding: 0.45rem 0.25rem;
            gap: 0.25rem;
          }
          .agenda-tab-label {
            font-size: 0.75rem;
          }
          .agenda-tab-badge {
            padding: 1px 5px;
            font-size: 0.65rem;
          }
          .segmented-view-btn {
            padding: 6px 2px;
            font-size: 0.7rem;
            gap: 2px;
          }
          .segmented-view-btn svg {
            display: none;
          }
        }
        @media (max-width: 640px) {
          .view-switcher-group {
            width: 100% !important;
            display: grid !important;
            grid-template-columns: 1fr 1fr 1fr !important;
            gap: 3px !important;
          }
          .view-switcher-group button {
            justify-content: center !important;
            padding: 7px 4px !important;
            font-size: 0.74rem !important;
          }
          .canceladas-kpi-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 0.5rem !important;
          }
          .canceladas-filter-bar {
            flex-direction: column;
            align-items: stretch;
            padding: 0.6rem;
            gap: 0.5rem;
          }
          .canceladas-filter-search {
            width: 100% !important;
            flex: 1 1 100% !important;
          }
          .canceladas-filter-dates {
            width: 100% !important;
            display: flex;
            gap: 6px;
          }
          .canceladas-filter-dates input[type="date"] {
            flex: 1;
            width: 100% !important;
          }
          .canceladas-pagination-container {
            flex-direction: column;
            align-items: center;
            gap: 0.6rem;
          }
        }
      `}</style>

      <div className="auth-card">
        {/* ==================== PESTAÑAS PRINCIPALES: CITAS PROGRAMADAS VS CITAS CANCELADAS ==================== */}
        <div className="agenda-main-tabs-bar">
          <button
            type="button"
            className={`agenda-main-tab-btn ${mainTab === "citas" ? "active" : ""}`}
            onClick={() => setMainTab("citas")}
          >
            <FaCalendarCheck size={16} />
            <span className="agenda-tab-label">Citas Programadas</span>
          </button>

          <button
            type="button"
            className={`agenda-main-tab-btn canceladas ${mainTab === "canceladas" ? "active" : ""}`}
            onClick={() => setMainTab("canceladas")}
          >
            <FaCalendarTimes size={16} />
            <span className="agenda-tab-label">Citas Canceladas</span>
            {canceladasHoyCount > 0 && (
              <span className="agenda-tab-badge warning" title="Canceladas hoy">
                {canceladasHoyCount} hoy
              </span>
            )}
          </button>
        </div>

        {mainTab === "citas" ? (
          <>
            {/* Header Toolbar Unificada Estilo Google Calendar */}
            <div className="agenda-toolbar">
              <div className="agenda-toolbar-left">
                <h2 className="title_card" style={{ margin: 0 }}>
                  Agenda de Citas
                </h2>
                <div className="agenda-segmented-views">
                  <button
                    type="button"
                    className={`segmented-view-btn ${activeView === "dia" ? "active" : ""}`}
                    onClick={() => {
                      if (!selectedDay) setSelectedDay(hoyStr);
                      const citasDia = (citas || []).filter((c) => c.fechaCitaStr === (selectedDay || hoyStr) && c.estado !== "Cancelado");
                      citasDia.sort((a, b) => (a.horaCita > b.horaCita ? 1 : -1));
                      setCitasDelDia(citasDia);
                      setActiveView("dia");
                    }}
                  >
                    <FaCalendarDay size={12} /> <span>Día</span>
                  </button>

                  <button
                    type="button"
                    className={`segmented-view-btn ${activeView === "semana" ? "active" : ""}`}
                    onClick={() => setActiveView("semana")}
                  >
                    <FaCalendarWeek size={12} /> <span>Semana</span>
                  </button>

                  <button
                    type="button"
                    className={`segmented-view-btn ${activeView === "calendario" ? "active" : ""}`}
                    onClick={() => setActiveView("calendario")}
                  >
                    <FaCalendarAlt size={12} /> <span>Mes</span>
                  </button>
                </div>
              </div>

              <div className="agenda-toolbar-right" style={{ marginLeft: "auto" }}>
                <button
                  type="button"
                  className="btn btn-primary agenda-btn-agendar"
                  onClick={() => {
                    if (!selectedDay || selectedDay < hoyStr) {
                      setSelectedDay(hoyStr);
                    }
                    setShowAgendarManualModal(true);
                  }}
                >
                  <FaPlus size={11} /> <span>Agendar Cita</span>
                </button>
              </div>
            </div>

            <div className="agenda-date-nav-bar" style={{ marginBottom: 10, display: "flex", justifyContent: "center", alignItems: "center" }}>
              {/* Segmented Control Unificado: Día | Semana | Mes */}
              {(activeView === "dia" || activeView === "semana") && (
                <div className="agenda-nav-group" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                  <button
                    type="button"
                    className="btn-toolbar-today"
                    onClick={handleCurrentWeek}
                    title="Ir al día de hoy"
                  >
                    Hoy
                  </button>

                  <div className="agenda-nav-chevrons">
                    <button
                      type="button"
                      className="btn-toolbar-chevron"
                      onClick={handlePrev}
                      title={activeView === "dia" ? "Día anterior" : "Semana anterior"}
                    >
                      <FaChevronLeft size={11} />
                    </button>
                    <button
                      type="button"
                      className="btn-toolbar-chevron"
                      onClick={handleNext}
                      title={activeView === "dia" ? "Día siguiente" : "Semana siguiente"}
                    >
                      <FaChevronRight size={11} />
                    </button>
                  </div>

                  <span
                    className="agenda-nav-title"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      textAlign: "center",
                      alignSelf: "center",
                      color: "var(--primary-color)",
                    }}
                  >
                    {activeView === "dia"
                      ? getDayViewTitle(selectedDay || hoyStr)
                      : getWeekRangeTitle(weekStart, weekEnd)}
                  </span>
                </div>
              )}

            </div>

            {/* ==================== VISTA DÍA (ESTILO GOOGLE CALENDAR DÍA) ==================== */}
            {activeView === "dia" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {loadingCitas ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "220px" }}>
                    <LoadingSpinner text="Cargando citas..." />
                  </div>
                ) : (
                  <>
                    {/* Banner de aviso si el día tiene horas bloqueadas o notas de administración */}
                    {(() => {
                      const activeIso = selectedDay || hoyStr;
                      const activeBlockedHours = blockedHoursAdmin[activeIso] || [];
                      const activeNote = blockedNotesAdmin[activeIso] || "";
                      const isSunday = new Date(activeIso + "T00:00:00").getDay() === 0;
                      const isFullyBlocked =
                        (blockedDatesAdmin.includes(activeIso) && (activeBlockedHours.length === 0 || activeBlockedHours.length >= 12)) ||
                        (user?.client?.blockSundays && isSunday);

                      if (!isFullyBlocked && activeBlockedHours.length === 0 && !activeNote) return null;

                      return (
                        <div
                          style={{
                            background: "rgba(239, 68, 68, 0.08)",
                            border: "1px solid rgba(239, 68, 68, 0.25)",
                            borderRadius: "8px",
                            padding: "0.65rem 0.85rem",
                            color: "var(--danger, #ef4444)",
                            fontSize: "0.82rem",
                            textAlign: "left",
                            display: "flex",
                            flexDirection: "column",
                            gap: "4px"
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 600 }}>
                            <FaLock size={12} />
                            <span>
                              {isFullyBlocked
                                ? isSunday && user?.client?.blockSundays
                                  ? "Domingo bloqueado por configuración de la clínica"
                                  : "Día completo bloqueado por administración"
                                : `${activeBlockedHours.length} horario${activeBlockedHours.length === 1 ? "" : "s"} bloqueado${activeBlockedHours.length === 1 ? "" : "s"} por administración:`}
                            </span>
                          </div>
                          {!isFullyBlocked && activeBlockedHours.length > 0 && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "2px" }}>
                              {activeBlockedHours.map((h) => (
                                <span
                                  key={h}
                                  style={{
                                    background: "rgba(239, 68, 68, 0.12)",
                                    color: "#b91c1c",
                                    padding: "1px 6px",
                                    borderRadius: "4px",
                                    fontSize: "0.74rem",
                                    fontWeight: 700
                                  }}
                                >
                                  {h}
                                </span>
                              ))}
                            </div>
                          )}
                          {activeNote && (
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-main)" }}>
                              <FaStickyNote size={12} style={{ color: "var(--danger, #ef4444)" }} />
                              <span>
                                <strong>Nota:</strong> {activeNote}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    <div className="gcal-wrapper gcal-day-view-wrapper">
                      {/* Encabezado del día estilo Google Calendar Día */}
                      <div className="gcal-day-view-header">
                        <div className="gcal-header-gutter">
                          <span>GMT-6</span>
                        </div>
                        <div className={`gcal-day-view-title-col ${(selectedDay || hoyStr) === hoyStr ? "today" : ""}`}>
                          <span className="gcal-day-name">
                            {getDayNameFromIso(selectedDay || hoyStr)}
                          </span>
                          <div className="gcal-day-circle">
                            {new Date((selectedDay || hoyStr) + "T00:00:00").getDate()}
                          </div>
                          <span className="gcal-day-count-badge">
                            {(citasPorFecha[selectedDay || hoyStr] || []).length} cita{(citasPorFecha[selectedDay || hoyStr] || []).length === 1 ? "" : "s"}
                          </span>
                        </div>
                      </div>

                      {/* Cuadrícula horaria de 1 día (Google Calendar Día) */}
                      <div className="gcal-day-view-grid">
                        {/* Columna de Horas */}
                        <div className="gcal-time-column">
                          {HORAS_GCAL.map((hora) => (
                            <div key={hora} className="gcal-time-cell">
                              <span>{hora}</span>
                            </div>
                          ))}
                        </div>

                        {/* Columna única del día seleccionado (ancho completo, citas en grande) */}
                        <div className={`gcal-day-column ${(selectedDay || hoyStr) === hoyStr ? "today" : ""}`} style={{ position: "relative" }}>
                          {/* Línea roja indicadora de la hora actual de Google Calendar */}
                          {(selectedDay || hoyStr) === hoyStr && getCurrentTimeOffsetPercent() !== null && (
                            <div
                              className="gcal-current-line"
                              style={{ top: `${getCurrentTimeOffsetPercent()}%` }}
                            >
                              <div className="gcal-current-dot" />
                            </div>
                          )}

                          {/* 12 Slots por hora (08:00 a 19:00) */}
                          {HORAS_GCAL.map((hora) => {
                            const activeDateIso = selectedDay || hoyStr;
                            const citasEnHora = getCitasEnSlot(activeDateIso, hora);
                            const isSlotBlocked = checkIsSlotBlocked(activeDateIso, hora, citasEnHora);
                            const isPastSlot = activeDateIso < hoyStr || (activeDateIso === hoyStr && isHourPassed(hora, activeDateIso));

                            return (
                              <div
                                key={hora}
                                className={`gcal-slot gcal-slot-dia ${isSlotBlocked ? "blocked" : isPastSlot ? "past-slot" : ""}`}
                                onClick={() => {
                                  if (isSlotBlocked || isPastSlot) return;
                                  setSelectedDay(activeDateIso);
                                  setShowAgendarManualModal(true);
                                }}
                                title={
                                  isSlotBlocked
                                    ? `Horario bloqueado por administración${blockedNotesAdmin[activeDateIso] ? ` (${blockedNotesAdmin[activeDateIso]})` : ""}`
                                    : isPastSlot
                                      ? "Horario no disponible (hora pasada)"
                                      : citasEnHora.length === 0
                                        ? `Clic para agendar a las ${hora}`
                                        : ""
                                }
                              >
                                {isSlotBlocked && citasEnHora.length === 0 && (
                                  <div className="gcal-slot-blocked-indicator">
                                    <FaLock size={11} />
                                    <span>Bloqueado</span>
                                    {blockedNotesAdmin[activeDateIso] && (
                                      <span className="gcal-slot-blocked-note">
                                        • {blockedNotesAdmin[activeDateIso]}
                                      </span>
                                    )}
                                  </div>
                                )}

                                {citasEnHora.length === 0 && !isSlotBlocked && !isPastSlot && (
                                  <div className="gcal-slot-empty-hint">
                                    <span>+ Agendar a las {hora}</span>
                                  </div>
                                )}

                                {citasEnHora.map((cita) => {
                                  const nombreCompleto = `${capitalizeWords(cita.nombres || "")} ${capitalizeWords(cita.apellidos || cita.apellidoPaterno || "")}`.trim();

                                  return (
                                    <div
                                      key={cita._id}
                                      className={`gcal-day-event-card ${cita.esNuevoPaciente ? "nuevo" : ""}`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setCitaSeleccionadaGcal(cita);
                                      }}
                                    >
                                      <div className="gcal-day-event-left">
                                        <div className="gcal-event-time-badge">
                                          <FaClock size={12} /> {cita.horaCita} hrs
                                        </div>
                                        <strong className="gcal-event-patient-name">
                                          {nombreCompleto}
                                        </strong>
                                        {cita.esNuevoPaciente && (
                                          <span className="tag-nuevo-mini">
                                            <FaStar size={9} /> Nuevo
                                          </span>
                                        )}
                                      </div>

                                      <div className="gcal-day-event-right">
                                        <button
                                          type="button"
                                          className="btn-gcal-mini"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/${rolePath}/paciente/${cita.identificadorPaciente}`);
                                          }}
                                          title="Ver expediente"
                                        >
                                          <FaFolderOpen size={11} /> Expediente
                                        </button>
                                        <button
                                          type="button"
                                          className="btn-gcal-mini primary"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleIniciarReagendar(cita);
                                          }}
                                          title="Reagendar"
                                        >
                                          <FaRedoAlt size={11} /> Reagendar
                                        </button>
                                        <button
                                          type="button"
                                          className="btn-gcal-mini danger"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setCitaParaCancelar(cita);
                                          }}
                                          title="Cancelar cita"
                                        >
                                          <FaTimesCircle size={11} /> Cancelar
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : activeView === "semana" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {loadingCitas ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "200px" }}>
                    <LoadingSpinner text="Cargando agenda semanal..." />
                  </div>
                ) : (
                  <>
                    {/* 1. VISTA ESCRITORIO / TABLET (>= 960px): Cuadrícula Horaria Estilo Google Calendar */}
                    <div className="gcal-wrapper">
                      {/* Fila superior fija de días estilo Google Calendar */}
                      <div className="gcal-header-row">
                        <div className="gcal-header-gutter">
                          <span>GMT-6</span>
                        </div>

                        {weekDays.map((day) => (
                          <div
                            key={day.iso}
                            className={`gcal-header-day ${day.isToday ? "today" : ""}`}
                            style={{ cursor: "pointer" }}
                            onClick={() => {
                              setSelectedDay(day.iso);
                              const citasDia = (citas || []).filter((c) => c.fechaCitaStr === day.iso && c.estado !== "Cancelado");
                              citasDia.sort((a, b) => (a.horaCita > b.horaCita ? 1 : -1));
                              setCitasDelDia(citasDia);
                              setActiveView("dia");
                            }}
                            title={`Ver citas del ${day.name} en Google Calendar Día`}
                          >
                            <span className="gcal-day-name">{day.shortName}</span>
                            <div className="gcal-day-circle">
                              {day.dayNumber}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Cuerpo scrollable con columna de horas y 7 columnas de días */}
                      <div className="gcal-grid-scroll">
                        {/* Columna izquierda de horas */}
                        <div className="gcal-time-column">
                          {HORAS_GCAL.map((hora) => (
                            <div key={hora} className="gcal-time-cell">
                              <span>{hora}</span>
                            </div>
                          ))}
                        </div>

                        {/* 7 Columnas de días */}
                        {weekDays.map((day) => {
                          const currentPercent = day.isToday ? getCurrentTimeOffsetPercent() : null;

                          return (
                            <div
                              key={day.iso}
                              className={`gcal-day-column ${day.isToday ? "today" : ""}`}
                            >
                              {/* Línea roja indicadora de la hora actual de Google Calendar */}
                              {day.isToday && currentPercent !== null && (
                                <div
                                  className="gcal-current-line"
                                  style={{ top: `${currentPercent}%` }}
                                >
                                  <div className="gcal-current-dot" />
                                </div>
                              )}

                              {/* 12 Slots por hora (08:00 a 19:00) */}
                              {HORAS_GCAL.map((hora) => {
                                const citasEnHora = getCitasEnSlot(day.iso, hora);
                                const isSlotBlocked = checkIsSlotBlocked(day.iso, hora, citasEnHora);
                                const isPastSlot = day.isPast || (day.isToday && isHourPassed(hora, day.iso));

                                return (
                                  <div
                                    key={hora}
                                    className={`gcal-slot ${isSlotBlocked ? "blocked" : isPastSlot ? "past-slot" : ""}`}
                                    onClick={() => {
                                      // Respetar reglas: no agendar en horario bloqueado ni pasado
                                      if (isSlotBlocked || isPastSlot) return;
                                      setSelectedDay(day.iso);
                                      setShowAgendarManualModal(true);
                                    }}
                                    title={
                                      isSlotBlocked
                                        ? `Horario bloqueado por administración${blockedNotesAdmin[day.iso] ? ` (${blockedNotesAdmin[day.iso]})` : ""}`
                                        : isPastSlot
                                          ? "Horario no disponible (hora pasada)"
                                          : citasEnHora.length === 0
                                            ? `Clic para agendar el ${day.name} a las ${hora}`
                                            : ""
                                    }
                                  >
                                    {citasEnHora.map((cita) => {
                                      const nombreCompleto = `${capitalizeWords(cita.nombres || "")} ${capitalizeWords(cita.apellidos || cita.apellidoPaterno || "")}`.trim();

                                      return (
                                        <div
                                          key={cita._id}
                                          className={`gcal-event-chip ${cita.esNuevoPaciente ? "nuevo" : ""}`}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setCitaSeleccionadaGcal(cita);
                                          }}
                                          title={`${cita.horaCita} • ${nombreCompleto}`}
                                        >
                                          <div style={{ fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {cita.horaCita} • {nombreCompleto}
                                          </div>
                                          {cita.telefono && (
                                            <div style={{ fontSize: "0.66rem", opacity: 0.85, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                              📞 {cita.telefono}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="agenda-columns">
                {/* Calendario */}
                <div className="agenda-left">
                  {/* Barra rápida superior en móvil para ver citas o agendar sin tener que bajar */}
                  <div className="mobile-day-quickbar">
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                      <span
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "8px",
                          background: "var(--primary, #6366f1)",
                          color: "#ffffff",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0
                        }}
                      >
                        <FaCalendarAlt size={14} />
                      </span>
                      <div style={{ display: "flex", flexDirection: "column", textAlign: "left" }}>
                        <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600 }}>
                          {selectedDay === hoyStr ? "Citas de Hoy" : "Día seleccionado"}
                        </span>
                        <strong style={{ fontSize: "0.88rem", color: "var(--text-main)" }}>
                          {selectedDay ? formatDateDDMMYYYY(selectedDay) : formatDateDDMMYYYY(hoyStr)} ({citasDelDia.length})
                        </strong>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <button
                        type="button"
                        onClick={() => setShowMobileDaySheet(true)}
                        style={{
                          padding: "6px 12px",
                          borderRadius: "8px",
                          border: "1px solid var(--primary, #6366f1)",
                          background: "var(--primary, #6366f1)",
                          color: "#ffffff",
                          fontSize: "0.78rem",
                          fontWeight: 700,
                          cursor: "pointer"
                        }}
                      >
                        Ver Citas ({citasDelDia.length})
                      </button>
                      {selectedDay && (
                        <button
                          type="button"
                          onClick={() => setShowAgendarManualModal(true)}
                          style={{
                            padding: "6px 10px",
                            borderRadius: "8px",
                            border: "1px solid rgba(99, 102, 241, 0.35)",
                            background: "rgba(255, 255, 255, 0.85)",
                            color: "var(--primary, #6366f1)",
                            fontSize: "0.78rem",
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px"
                          }}
                        >
                          <FaPlus size={10} /> Agendar
                        </button>
                      )}
                    </div>
                  </div>

                  <Calendar
                    onClickDay={handleDayClick}
                    tileDisabled={({ date }) => {
                      const iso = toLocalISODate(date);
                      const hoy = toLocalISODate(new Date());
                      if (user?.client?.blockSundays && date.getDay() === 0) return true;
                      return iso < hoy;
                    }}
                    tileClassName={({ date }) => {
                      const iso = toLocalISODate(date);
                      const hoy = toLocalISODate(new Date());
                      if (user?.client?.blockSundays && date.getDay() === 0) return "sunday-blocked";
                      if (iso < hoy) return "past-day";
                      if (blockedDatesPaciente.includes(iso)) return "blocked-paciente";
                      if (blockedDatesAdmin.includes(iso)) return "blocked-admin";
                      return null;
                    }}
                  />
                  <CalendarLegend showSundays={!!user?.client?.blockSundays} />
                </div>

                {/* Citas del día */}
                <div className="agenda-right-citas" style={{ marginTop: "20px" }}>
                  <div
                    className="text-muted text-center"
                    style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}
                  >
                    <h4>
                      {selectedDay
                        ? selectedDay === hoyStr
                          ? `Citas para hoy (${formatDateDDMMYYYY(selectedDay)})`
                          : `Citas para ${formatDateDDMMYYYY(selectedDay)}`
                        : "Selecciona un día"}
                    </h4>

                    {(selectedDayBlockedHours.length > 0 || selectedDayBlockNote || isSelectedDayFullyBlocked) && (
                      <div
                        style={{
                          width: "100%",
                          background: "rgba(239, 68, 68, 0.08)",
                          border: "1px solid rgba(239, 68, 68, 0.25)",
                          borderRadius: "8px",
                          padding: "0.65rem 0.85rem",
                          color: "var(--danger, #ef4444)",
                          fontSize: "0.82rem",
                          textAlign: "left",
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px"
                        }}
                      >
                        {(selectedDayBlockedHours.length > 0 || isSelectedDayFullyBlocked) && (
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 600 }}>
                            <FaLock size={12} />
                            <span>
                              {isSelectedDayFullyBlocked
                                ? "Día completo bloqueado por administración"
                                : `Horas bloqueadas: ${selectedDayBlockedHours.join(", ")}`}
                            </span>
                          </div>
                        )}
                        {selectedDayBlockNote && (
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-main)" }}>
                            <FaStickyNote size={12} style={{ color: "var(--danger, #ef4444)" }} />
                            <span>
                              <strong>Nota:</strong> {selectedDayBlockNote}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {selectedDay && (
                      <button
                        type="button"
                        className="btn-primary-action hover-grow"
                        onClick={() => setShowAgendarManualModal(true)}
                        style={{
                          padding: "0.5rem 1rem",
                          fontSize: "0.9rem",
                          borderRadius: "6px",
                          border: "none",
                          background: "var(--primary, #5e50a1)",
                          color: "#ffffff",
                          fontWeight: "600",
                          cursor: "pointer",
                          width: "auto"
                        }}
                      >
                        <FaPlus size={12} style={{ marginRight: "6px" }} /> Agendar Cita Manual
                      </button>
                    )}
                  </div>

                  <div className="right-body">
                    {loadingCitas ? (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "100%",
                          minHeight: "160px",
                          padding: "1.5rem 0"
                        }}
                      >
                        <LoadingSpinner text="Cargando citas..." />
                      </div>
                    ) : selectedDay ? (
                      citasDelDia.length > 0 ? (
                        <>
                          {/* 1. VISTA ESCRITORIO (> 960px): Tarjeta completa alineada */}
                          <div className="citas-dia-desktop">
                            {citasDelDia.map((cita, i) => {
                              const esNuevo = cita.esNuevoPaciente;
                              const nombreCompleto = `${capitalizeWords(cita.nombres || "")} ${capitalizeWords(cita.apellidos || cita.apellidoPaterno || "")}`.trim();

                              return (
                                <div
                                  key={cita._id || i}
                                  className={`appointment-card ${esNuevo ? "nuevo-paciente-card" : ""}`}
                                  style={{ display: "flex", flexDirection: "column", alignItems: "stretch", gap: "0.65rem" }}
                                >
                                  <div
                                    style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.85rem", cursor: "pointer" }}
                                    onClick={() => navigate(`/${rolePath}/paciente/${cita.identificadorPaciente}`)}
                                  >
                                    <div
                                      style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "5px",
                                        background: "rgba(99, 102, 241, 0.1)",
                                        color: "var(--primary)",
                                        padding: "5px 10px",
                                        borderRadius: "8px",
                                        fontWeight: 800,
                                        fontSize: "0.92rem",
                                        flexShrink: 0
                                      }}
                                    >
                                      <FaClock size={12} /> {cita.horaCita}
                                    </div>

                                    <div style={{ flex: 1, textAlign: "left", display: "flex", flexDirection: "column", gap: "2px" }}>
                                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", flexWrap: "wrap" }}>
                                        <strong style={{ color: "var(--text-main)", fontSize: "0.95rem" }}>
                                          {nombreCompleto}
                                        </strong>
                                        {esNuevo && (
                                          <span className="nuevo-paciente" style={{ margin: 0, display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                            <FaStar size={10} /> Nuevo
                                          </span>
                                        )}
                                      </div>

                                      <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                                        {cita.telefono && (
                                          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                            <FaPhoneAlt size={10} style={{ color: "var(--primary)" }} /> {cita.telefono}
                                          </span>
                                        )}
                                        <span style={{ textTransform: "capitalize" }}>
                                          Área: <strong style={{ color: "var(--primary)" }}>{cita.area}</strong>
                                        </span>
                                      </div>

                                      {cita.especialistaNombre && (
                                        <div style={{ fontSize: "0.75rem", color: "var(--primary)", fontWeight: "600" }}>
                                          Atiende: {cita.especialistaNombre}
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div
                                    style={{
                                      display: "grid",
                                      gridTemplateColumns: "repeat(3, 1fr)",
                                      gap: "6px",
                                      borderTop: "1px solid var(--border-light, rgba(148,163,184,0.18))",
                                      paddingTop: "0.55rem"
                                    }}
                                  >
                                    <button
                                      type="button"
                                      onClick={() => navigate(`/${rolePath}/paciente/${cita.identificadorPaciente}`)}
                                      style={{
                                        padding: "5px 8px",
                                        borderRadius: "6px",
                                        border: "1px solid rgba(99, 102, 241, 0.25)",
                                        background: "rgba(99, 102, 241, 0.1)",
                                        color: "var(--primary)",
                                        fontSize: "0.76rem",
                                        fontWeight: 600,
                                        cursor: "pointer",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: "4px"
                                      }}
                                    >
                                      <FaFolderOpen size={11} /> Expediente
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleIniciarReagendar(cita)}
                                      style={{
                                        padding: "5px 8px",
                                        borderRadius: "6px",
                                        border: "1px solid rgba(16, 185, 129, 0.3)",
                                        background: "rgba(16, 185, 129, 0.1)",
                                        color: "#10b981",
                                        fontSize: "0.76rem",
                                        fontWeight: 600,
                                        cursor: "pointer",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: "4px"
                                      }}
                                    >
                                      <FaRedoAlt size={11} /> Reagendar
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => setCitaParaCancelar(cita)}
                                      style={{
                                        padding: "5px 8px",
                                        borderRadius: "6px",
                                        border: "1px solid rgba(239, 68, 68, 0.3)",
                                        background: "rgba(239, 68, 68, 0.1)",
                                        color: "#ef4444",
                                        fontSize: "0.76rem",
                                        fontWeight: 600,
                                        cursor: "pointer",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: "4px"
                                      }}
                                    >
                                      <FaTimesCircle size={11} /> Cancelar
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                            <div style={{ height: "15px" }}></div>
                          </div>

                          {/* 2. VISTA RESPONSIVA (<= 960px): Acordeón desplegable compacto */}
                          <div className="citas-dia-mobile-accordion">
                            {citasDelDia.map((cita, i) => {
                              const citaKey = cita._id || `cita-${i}`;
                              const isExpanded = expandedCitaId === citaKey;
                              const esNuevo = cita.esNuevoPaciente;
                              const nombreCompleto = `${capitalizeWords(cita.nombres || "")} ${capitalizeWords(cita.apellidos || cita.apellidoPaterno || "")}`.trim();

                              return (
                                <div
                                  key={citaKey}
                                  className={`appointment-card ${esNuevo ? "nuevo-paciente-card" : ""}`}
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "stretch",
                                    padding: "0.85rem 1rem",
                                    borderRadius: "12px",
                                    border: isExpanded ? "1.5px solid var(--primary)" : "1px solid var(--card-border)",
                                    transition: "all 0.2s ease"
                                  }}
                                >
                                  {/* Cabecera compacta (siempre visible): Hora + Nombre + Chevron */}
                                  <div
                                    onClick={() => toggleExpandCita(citaKey)}
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "space-between",
                                      gap: "0.65rem",
                                      cursor: "pointer",
                                      userSelect: "none"
                                    }}
                                  >
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", minWidth: 0, flex: 1 }}>
                                      <span
                                        style={{
                                          display: "inline-flex",
                                          alignItems: "center",
                                          gap: "4px",
                                          background: "rgba(99, 102, 241, 0.12)",
                                          color: "var(--primary)",
                                          padding: "4px 9px",
                                          borderRadius: "8px",
                                          fontWeight: 800,
                                          fontSize: "0.85rem",
                                          flexShrink: 0
                                        }}
                                      >
                                        <FaClock size={11} /> {cita.horaCita}
                                      </span>

                                      <strong
                                        style={{
                                          color: "var(--text-main)",
                                          fontSize: "0.92rem",
                                          whiteSpace: "nowrap",
                                          overflow: "hidden",
                                          textOverflow: "ellipsis"
                                        }}
                                      >
                                        {nombreCompleto}
                                      </strong>
                                    </div>

                                    <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                                      {esNuevo && (
                                        <span className="nuevo-paciente" style={{ margin: 0, display: "inline-flex", alignItems: "center", gap: "3px" }}>
                                          <FaStar size={9} /> Nuevo
                                        </span>
                                      )}
                                      <span
                                        style={{
                                          width: "26px",
                                          height: "26px",
                                          borderRadius: "50%",
                                          background: isExpanded ? "var(--primary)" : "rgba(99, 102, 241, 0.08)",
                                          color: isExpanded ? "#fff" : "var(--primary)",
                                          display: "inline-flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          transition: "all 0.2s ease"
                                        }}
                                      >
                                        {isExpanded ? <FaChevronUp size={11} /> : <FaChevronDown size={11} />}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Contenido desplegable al tocar la cita */}
                                  {isExpanded && (
                                    <div
                                      style={{
                                        marginTop: "0.75rem",
                                        paddingTop: "0.75rem",
                                        borderTop: "1px dashed var(--border-light, rgba(148,163,184,0.25))",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "0.75rem"
                                      }}
                                    >
                                      <div
                                        style={{
                                          display: "grid",
                                          gridTemplateColumns: "1fr 1fr",
                                          gap: "0.5rem",
                                          background: "rgba(99, 102, 241, 0.04)",
                                          padding: "0.65rem 0.75rem",
                                          borderRadius: "8px",
                                          fontSize: "0.82rem",
                                          textAlign: "left"
                                        }}
                                      >
                                        <div>
                                          <span style={{ color: "var(--text-muted)", fontSize: "0.72rem", fontWeight: 600, display: "block" }}>
                                            Teléfono
                                          </span>
                                          <strong style={{ color: "var(--text-main)", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                            <FaPhoneAlt size={10} style={{ color: "var(--primary)" }} />
                                            {cita.telefono || "No registrado"}
                                          </strong>
                                        </div>

                                        <div>
                                          <span style={{ color: "var(--text-muted)", fontSize: "0.72rem", fontWeight: 600, display: "block" }}>
                                            Área
                                          </span>
                                          <strong style={{ color: "var(--primary)", textTransform: "capitalize" }}>
                                            {cita.area}
                                          </strong>
                                        </div>

                                        {cita.especialistaNombre && (
                                          <div style={{ gridColumn: "1 / -1" }}>
                                            <span style={{ color: "var(--text-muted)", fontSize: "0.72rem", fontWeight: 600, display: "block" }}>
                                              Especialista
                                            </span>
                                            <strong style={{ color: "var(--text-main)" }}>{cita.especialistaNombre}</strong>
                                          </div>
                                        )}
                                      </div>

                                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px" }}>
                                        <button
                                          type="button"
                                          onClick={() => navigate(`/${rolePath}/paciente/${cita.identificadorPaciente}`)}
                                          style={{
                                            padding: "7px 6px",
                                            borderRadius: "8px",
                                            border: "1px solid rgba(99, 102, 241, 0.3)",
                                            background: "rgba(99, 102, 241, 0.1)",
                                            color: "var(--primary)",
                                            fontSize: "0.78rem",
                                            fontWeight: 700,
                                            cursor: "pointer",
                                            display: "inline-flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            gap: "4px"
                                          }}
                                        >
                                          <FaFolderOpen size={11} /> Expediente
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => handleIniciarReagendar(cita)}
                                          style={{
                                            padding: "7px 6px",
                                            borderRadius: "8px",
                                            border: "1px solid rgba(16, 185, 129, 0.35)",
                                            background: "rgba(16, 185, 129, 0.1)",
                                            color: "#10b981",
                                            fontSize: "0.78rem",
                                            fontWeight: 700,
                                            cursor: "pointer",
                                            display: "inline-flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            gap: "4px"
                                          }}
                                        >
                                          <FaRedoAlt size={11} /> Reagendar
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => setCitaParaCancelar(cita)}
                                          style={{
                                            padding: "7px 6px",
                                            borderRadius: "8px",
                                            border: "1px solid rgba(239, 68, 68, 0.35)",
                                            background: "rgba(239, 68, 68, 0.1)",
                                            color: "#ef4444",
                                            fontSize: "0.78rem",
                                            fontWeight: 700,
                                            cursor: "pointer",
                                            display: "inline-flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            gap: "4px"
                                          }}
                                        >
                                          <FaTimesCircle size={11} /> Cancelar
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </>
                      ) : (
                        <p className="no-appointments">No hay citas programadas para este día.</p>
                      )
                    ) : (
                      <p className="no-appointments">Selecciona un día del calendario para ver sus citas.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          /* ==================== PESTAÑA: CITAS CANCELADAS ==================== */
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {/* Header Toolbar Específico para Citas Canceladas */}
            <div className="agenda-toolbar canceladas-tab-toolbar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div className="agenda-toolbar-left">
                <h2 className="title_card" style={{ margin: 0, fontSize: "1.2rem" }}>
                  Control de Citas Canceladas
                </h2>
              </div>

              <div className="agenda-toolbar-right" style={{ marginLeft: "auto" }}>
                <button
                  type="button"
                  className="btn btn-primary agenda-btn-agendar"
                  onClick={() => {
                    if (!selectedDay || selectedDay < hoyStr) {
                      setSelectedDay(hoyStr);
                    }
                    setShowAgendarManualModal(true);
                  }}
                >
                  <FaPlus size={11} /> <span>Agendar Cita</span>
                </button>
              </div>
            </div>

            {/* Resumen KPIs de Cancelaciones: solo métricas esenciales y responsivas */}
            <div className="canceladas-kpi-grid">
              <div
                className="canceladas-kpi-card"
                style={{
                  background: "rgba(239, 68, 68, 0.06)",
                  border: "1px solid rgba(239, 68, 68, 0.2)",
                  borderRadius: "12px",
                  padding: "0.9rem 1.15rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between"
                }}
              >
                <div>
                  <span style={{ fontSize: "0.76rem", color: "var(--text-muted)", fontWeight: 600, display: "block" }}>
                    Total Citas Canceladas
                  </span>
                  <strong style={{ fontSize: "1.5rem", color: "#ef4444" }}>{citasCanceladas.length}</strong>
                </div>
                <FaCalendarTimes size={24} style={{ color: "#ef4444", opacity: 0.8 }} />
              </div>
            </div>

            {/* Buscador y filtro de fecha */}
            <div className="canceladas-filter-bar">
              <div className="canceladas-filter-search">
                <FaSearch
                  size={13}
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--text-muted)"
                  }}
                />
                <input
                  type="text"
                  className="input"
                  placeholder="Buscar paciente, teléfono o motivo..."
                  value={searchCanceladas}
                  onChange={(e) => setSearchCanceladas(e.target.value)}
                  style={{ paddingLeft: "34px", margin: 0, width: "100%", fontSize: "0.85rem" }}
                />
              </div>

              <div className="canceladas-filter-dates">
                <input
                  type="date"
                  className="input"
                  title="Filtrar por fecha original de la cita"
                  value={fechaFiltroCanceladas}
                  onChange={(e) => setFechaFiltroCanceladas(e.target.value)}
                  style={{ margin: 0, padding: "0.45rem 0.65rem", fontSize: "0.82rem" }}
                />
                {(searchCanceladas || fechaFiltroCanceladas) && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setSearchCanceladas("");
                      setFechaFiltroCanceladas("");
                    }}
                    style={{ height: "36px", padding: "0 12px", fontSize: "0.78rem", whiteSpace: "nowrap" }}
                  >
                    Limpiar
                  </button>
                )}
              </div>
            </div>

            {loadingCitas ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "100%",
                  minHeight: "180px",
                  padding: "2rem 0"
                }}
              >
                <LoadingSpinner text="Cargando citas canceladas..." />
              </div>
            ) : citasCanceladasFiltradas.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "2.5rem 1.25rem",
                  borderRadius: "12px",
                  border: "1px dashed var(--border-light, rgba(148,163,184,0.3))",
                  color: "var(--text-muted)"
                }}
              >
                <FaCalendarTimes size={34} style={{ color: "var(--text-muted)", opacity: 0.5, marginBottom: "0.6rem" }} />
                <p style={{ margin: "0 0 4px 0", fontWeight: 700, color: "var(--text-main)", fontSize: "0.95rem" }}>
                  No hay citas canceladas para mostrar
                </p>
                <span style={{ fontSize: "0.82rem" }}>
                  Todas las citas canceladas se registran aquí para su seguimiento y reprogramación.
                </span>
              </div>
            ) : (
              <>
                {/* 1. TABLA DE ESCRITORIO (>= 900px) */}
                <div className="canceladas-desktop-table">
                  <table className="clinical-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <th>Paciente</th>
                        <th>Cita Cancelada</th>
                        <th>Motivo / Adeudo</th>
                        <th>Cancelada el</th>
                        <th style={{ textAlign: "right" }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {citasCanceladasPaginadas.map((cita) => {
                        const nombreCompleto = `${capitalizeWords(cita.nombres || "")} ${capitalizeWords(cita.apellidos || cita.apellidoPaterno || "")}`.trim();
                        const fechaCancelStr = cita.fechaCancelacion
                          ? `${formatDateDDMMYYYY(cita.fechaCancelacion)} • ${new Date(cita.fechaCancelacion).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                          : formatDateDDMMYYYY(cita.fechaCitaStr);
                        const motivoTexto = cita.motivoCancelacion || "Cancelación registrada en sistema";
                        const tieneAdeudoPendiente = cita.tieneAdeudo && !cita.adeudoPagado;
                        const adeudoCobrado = cita.tieneAdeudo && cita.adeudoPagado;

                        return (
                          <tr key={cita._id} style={{ background: tieneAdeudoPendiente ? "rgba(239, 68, 68, 0.03)" : "transparent" }}>
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <div
                                  className="identity-avatar"
                                  style={{ cursor: "pointer", flexShrink: 0 }}
                                  onClick={() => navigate(`/${rolePath}/paciente/${cita.identificadorPaciente}`)}
                                >
                                  {(cita.nombres || "P").charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <strong
                                    style={{ color: "var(--text-main)", display: "block", fontSize: "0.9rem", cursor: "pointer" }}
                                    onClick={() => navigate(`/${rolePath}/paciente/${cita.identificadorPaciente}`)}
                                  >
                                    {nombreCompleto}
                                  </strong>
                                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", fontSize: "0.74rem" }}>
                                    {cita.telefono && (
                                      <a
                                        href={`tel:${cita.telefono}`}
                                        style={{
                                          color: "var(--primary, #6366f1)",
                                          textDecoration: "none",
                                          display: "inline-flex",
                                          alignItems: "center",
                                          gap: "3px",
                                          fontWeight: 600
                                        }}
                                      >
                                        <FaPhoneAlt size={9} /> {cita.telefono}
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td>
                              <div style={{ fontWeight: 700, color: "var(--text-main)", fontSize: "0.86rem" }}>
                                {formatDateDDMMYYYY(cita.fechaCitaStr)}
                              </div>
                              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                                <FaClock size={11} /> {cita.horaCita} hrs
                              </div>
                            </td>

                            <td style={{ maxWidth: "260px" }}>
                              {tieneAdeudoPendiente && (
                                <div
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    padding: "2px 7px",
                                    borderRadius: "6px",
                                    background: "rgba(239, 68, 68, 0.15)",
                                    color: "#dc2626",
                                    fontSize: "0.72rem",
                                    fontWeight: 800,
                                    marginBottom: "4px"
                                  }}
                                  title="Cancelada con menos de 24 hrs. Cobrar en su próxima cita"
                                >
                                  <FaExclamationCircle size={10} /> Adeudo Pendiente (&lt;24h)
                                </div>
                              )}
                              <div style={{ fontSize: "0.82rem", color: "var(--text-main)", fontWeight: 500, wordBreak: "break-word" }}>
                                {motivoTexto}
                              </div>
                              {adeudoCobrado && (
                                <div
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    padding: "2px 7px",
                                    borderRadius: "6px",
                                    background: "rgba(16, 185, 129, 0.12)",
                                    color: "#059669",
                                    fontSize: "0.72rem",
                                    fontWeight: 700,
                                    marginBottom: "4px"
                                  }}
                                >
                                  <FaCheck size={9} /> Adeudo Cobrado
                                </div>
                              )}
                            </td>

                            <td>
                              <span
                                style={{
                                  display: "inline-block",
                                  padding: "3px 8px",
                                  borderRadius: "6px",
                                  background: "rgba(239, 68, 68, 0.08)",
                                  color: "#dc2626",
                                  fontWeight: 600,
                                  fontSize: "0.76rem"
                                }}
                              >
                                {fechaCancelStr}
                              </span>
                            </td>

                            <td style={{ textAlign: "right" }}>
                              <div style={{ display: "inline-flex", gap: "6px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                                {tieneAdeudoPendiente && (
                                  <button
                                    type="button"
                                    className="btn"
                                    onClick={() => handleCobrarAdeudo(cita)}
                                    style={{
                                      height: "32px",
                                      padding: "0 10px",
                                      fontSize: "0.76rem",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "5px",
                                      width: "auto",
                                      background: "rgba(16, 185, 129, 0.15)",
                                      color: "#059669",
                                      border: "1px solid rgba(16, 185, 129, 0.35)",
                                      fontWeight: 700
                                    }}
                                    title="Marcar adeudo como cobrado"
                                  >
                                    <FaMoneyBillWave size={12} /> Cobrar
                                  </button>
                                )}
                                <button
                                  type="button"
                                  className="btn btn-primary"
                                  onClick={() => handleIniciarReagendar(cita)}
                                  style={{
                                    height: "32px",
                                    padding: "0 10px",
                                    fontSize: "0.76rem",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "5px",
                                    width: "auto"
                                  }}
                                  title="Reprogramar esta cita"
                                >
                                  <FaRedoAlt size={11} /> Reagendar
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-secondary"
                                  onClick={() => navigate(`/${rolePath}/paciente/${cita.identificadorPaciente}`)}
                                  style={{
                                    height: "32px",
                                    padding: "0 9px",
                                    fontSize: "0.76rem",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "5px",
                                    width: "auto"
                                  }}
                                  title="Abrir expediente"
                                >
                                  <FaFolderOpen size={11} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* 2. TARJETAS MÓVILES RESPONSIVAS DIRECTAS (< 900px) */}
                <div className="canceladas-mobile-cards">
                  {citasCanceladasPaginadas.map((cita, idx) => {
                    const cancelKey = cita._id || `canc-${idx}`;
                    const nombreCompleto = `${capitalizeWords(cita.nombres || "")} ${capitalizeWords(cita.apellidos || cita.apellidoPaterno || "")}`.trim();
                    const fechaCancelStr = cita.fechaCancelacion
                      ? `${formatDateDDMMYYYY(cita.fechaCancelacion)} • ${new Date(cita.fechaCancelacion).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                      : formatDateDDMMYYYY(cita.fechaCitaStr);
                    const motivoTexto = cita.motivoCancelacion || "Cancelación registrada en sistema";
                    const tieneAdeudoPendiente = cita.tieneAdeudo && !cita.adeudoPagado;
                    const adeudoCobrado = cita.tieneAdeudo && cita.adeudoPagado;

                    const isExpanded = expandedCanceladaId === cancelKey;
                    const toggleExpand = () => setExpandedCanceladaId(isExpanded ? null : cancelKey);

                    return (
                      <div
                        key={cancelKey}
                        className={`glass-card ${isExpanded ? "open" : ""}`}
                        style={{
                          border: tieneAdeudoPendiente
                            ? isExpanded
                              ? "1.5px solid #ef4444"
                              : "1.5px solid rgba(239, 68, 68, 0.45)"
                            : isExpanded
                              ? "1.5px solid var(--primary, #6366f1)"
                              : "1px solid rgba(148, 163, 184, 0.22)",
                          borderLeft: tieneAdeudoPendiente
                            ? "5px solid #ef4444"
                            : isExpanded
                              ? "5px solid var(--primary, #6366f1)"
                              : "1px solid rgba(148, 163, 184, 0.22)",
                          background: tieneAdeudoPendiente
                            ? isExpanded
                              ? "rgba(254, 242, 242, 0.75)"
                              : "rgba(254, 242, 242, 0.45)"
                            : "var(--card-bg, #ffffff)",
                          borderRadius: "10px",
                          padding: isExpanded ? "0.6rem 0.8rem" : "0.35rem 0.65rem",
                          display: "flex",
                          flexDirection: "column",
                          gap: isExpanded ? "0.55rem" : "0",
                          boxShadow: isExpanded
                            ? "0 4px 12px rgba(0, 0, 0, 0.08)"
                            : "0 1px 2px rgba(0, 0, 0, 0.03)",
                          transition: "all 0.18s ease"
                        }}
                      >
                        {/* Cabecera / Trigger de Acordeón: Paciente, Motivo, Fecha y Chevron */}
                        <div
                          onClick={toggleExpand}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: "8px",
                            cursor: "pointer",
                            userSelect: "none"
                          }}
                        >
                          {/* Izquierda: Avatar + (Nombre y Motivo juntos) */}
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0, flex: 1 }}>
                            <div
                              className="identity-avatar"
                              style={{
                                flexShrink: 0,
                                width: "30px",
                                height: "30px",
                                fontSize: "0.8rem",
                                background: tieneAdeudoPendiente ? "rgba(239, 68, 68, 0.15)" : undefined,
                                color: tieneAdeudoPendiente ? "#dc2626" : undefined
                              }}
                            >
                              {(cita.nombres || "P").charAt(0).toUpperCase()}
                            </div>
                            <div style={{ minWidth: 0, flex: 1, display: "flex", flexDirection: "column", gap: "1px" }}>
                              <strong
                                style={{
                                  color: "var(--text-main)",
                                  fontSize: "0.86rem",
                                  display: "block",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  lineHeight: 1.2
                                }}
                              >
                                {nombreCompleto}
                              </strong>
                              {!isExpanded && (
                                <span
                                  style={{
                                    fontSize: "0.72rem",
                                    color: "var(--text-muted)",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    display: "block",
                                    lineHeight: 1.15
                                  }}
                                >
                                  <strong style={{ color: "var(--text-main)", fontWeight: 600 }}>Motivo:</strong> {motivoTexto}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Derecha: Fecha + Hora y Botón Chevron */}
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                            <div
                              style={{
                                textAlign: "right",
                                background: "rgba(239, 68, 68, 0.08)",
                                padding: "2px 6px",
                                borderRadius: "6px",
                                border: "1px solid rgba(239, 68, 68, 0.18)"
                              }}
                            >
                              <div style={{ fontSize: "0.74rem", fontWeight: 700, color: "#dc2626", lineHeight: 1.15 }}>
                                {formatDateDDMMYYYY(cita.fechaCitaStr)}
                              </div>
                              <div style={{ fontSize: "0.66rem", color: "var(--text-muted)", lineHeight: 1.15 }}>
                                {cita.horaCita} hrs
                              </div>
                            </div>

                            <div
                              style={{
                                width: "24px",
                                height: "24px",
                                borderRadius: "50%",
                                background: isExpanded
                                  ? tieneAdeudoPendiente ? "#ef4444" : "var(--primary, #6366f1)"
                                  : tieneAdeudoPendiente
                                    ? "rgba(239, 68, 68, 0.14)"
                                    : "rgba(148, 163, 184, 0.14)",
                                color: isExpanded ? "#ffffff" : tieneAdeudoPendiente ? "#dc2626" : "var(--text-main)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "transform 0.2s ease, background 0.2s ease, color 0.2s ease",
                                transform: isExpanded ? "rotate(180deg)" : "none",
                                flexShrink: 0
                              }}
                              title={isExpanded ? "Contraer" : "Ver detalles"}
                            >
                              <FaChevronDown size={10} />
                            </div>
                          </div>
                        </div>

                        {/* Cuerpo Desplegable del Acordeón (Detalles y Acciones) */}
                        {isExpanded && (
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "0.65rem",
                              paddingTop: "0.55rem",
                              borderTop: "1px solid rgba(148, 163, 184, 0.14)"
                            }}
                          >
                            {/* Banner de Adeudo si aplica */}
                            {tieneAdeudoPendiente && (
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  padding: "6px 10px",
                                  borderRadius: "8px",
                                  background: "rgba(239, 68, 68, 0.12)",
                                  border: "1px solid rgba(239, 68, 68, 0.28)",
                                  color: "#dc2626",
                                  fontSize: "0.75rem",
                                  fontWeight: 700
                                }}
                              >
                                <FaExclamationCircle size={13} style={{ flexShrink: 0 }} />
                                <span>Adeudo Pendiente • Cobrar en próxima cita</span>
                              </div>
                            )}

                            {adeudoCobrado && (
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "5px",
                                  padding: "5px 9px",
                                  borderRadius: "6px",
                                  background: "rgba(16, 185, 129, 0.1)",
                                  color: "#059669",
                                  fontSize: "0.73rem",
                                  fontWeight: 600
                                }}
                              >
                                <FaCheck size={11} /> Adeudo cobrado
                              </div>
                            )}

                            {/* Motivo de cancelación y fecha exacta */}
                            <div
                              style={{
                                padding: "0.6rem 0.75rem",
                                borderRadius: "8px",
                                background: "rgba(241, 245, 249, 0.75)",
                                border: "1px solid rgba(226, 232, 240, 0.8)",
                                fontSize: "0.8rem"
                              }}
                            >
                              <div style={{ color: "var(--text-main)", fontWeight: 500, marginBottom: "3px", wordBreak: "break-word" }}>
                                <span style={{ color: "var(--text-muted)", fontSize: "0.72rem", fontWeight: 700, display: "block" }}>
                                  Motivo de cancelación:
                                </span>
                                {motivoTexto}
                              </div>
                              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                                Cancelada el {fechaCancelStr}
                              </span>
                            </div>

                            {/* Teléfono y Acciones directas */}
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", flexWrap: "wrap", marginTop: "2px" }}>
                              {cita.telefono ? (
                                <a
                                  href={`tel:${cita.telefono}`}
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "5px",
                                    fontSize: "0.82rem",
                                    fontWeight: 600,
                                    color: "var(--primary, #6366f1)",
                                    textDecoration: "none"
                                  }}
                                >
                                  <FaPhoneAlt size={11} /> {cita.telefono}
                                </a>
                              ) : (
                                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Sin teléfono</span>
                              )}

                              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                                {tieneAdeudoPendiente && (
                                  <button
                                    type="button"
                                    className="btn"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCobrarAdeudo(cita);
                                    }}
                                    style={{
                                      height: "34px",
                                      padding: "0 10px",
                                      fontSize: "0.76rem",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "4px",
                                      background: "rgba(16, 185, 129, 0.15)",
                                      color: "#059669",
                                      border: "1px solid rgba(16, 185, 129, 0.35)",
                                      fontWeight: 700,
                                      borderRadius: "8px",
                                      cursor: "pointer"
                                    }}
                                  >
                                    <FaMoneyBillWave size={11} /> Cobrar
                                  </button>
                                )}
                                <button
                                  type="button"
                                  className="btn btn-primary"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleIniciarReagendar(cita);
                                  }}
                                  style={{
                                    height: "34px",
                                    padding: "0 11px",
                                    fontSize: "0.76rem",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "5px",
                                    borderRadius: "8px",
                                    cursor: "pointer"
                                  }}
                                >
                                  <FaRedoAlt size={11} /> Reagendar
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-secondary"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/${rolePath}/paciente/${cita.identificadorPaciente}`);
                                  }}
                                  style={{
                                    height: "34px",
                                    padding: "0 10px",
                                    fontSize: "0.76rem",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "5px",
                                    borderRadius: "8px",
                                    cursor: "pointer"
                                  }}
                                  title="Ver expediente"
                                >
                                  <FaFolderOpen size={11} /> Expediente
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Controles de Paginación Responsivos */}
                <div className="canceladas-pagination-container">
                  <span className="pagination-stats">
                    {citasCanceladasFiltradas.length > 0 ? (
                      <>
                        Mostrando <strong>{startIndexCanceladas + 1}</strong>-<strong>{endIndexCanceladas}</strong> de <strong>{citasCanceladasFiltradas.length}</strong> canceladas
                      </>
                    ) : (
                      "0 citas"
                    )}
                  </span>

                  <div className="canceladas-pagination-controls">
                    <button
                      type="button"
                      className="pagination-btn"
                      disabled={safePageCanceladas <= 1}
                      onClick={() => setCurrentPageCanceladas((prev) => Math.max(1, prev - 1))}
                      style={{ gap: "4px" }}
                    >
                      <FaChevronLeft size={10} /> Anterior
                    </button>

                    <span className="pagination-badge-page">
                      {safePageCanceladas} / {totalPagesCanceladas}
                    </span>

                    <button
                      type="button"
                      className="pagination-btn"
                      disabled={safePageCanceladas >= totalPagesCanceladas}
                      onClick={() => setCurrentPageCanceladas((prev) => Math.min(totalPagesCanceladas, prev + 1))}
                      style={{ gap: "4px" }}
                    >
                      Siguiente <FaChevronRight size={10} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Panel Emergente (Modal centrado en pantalla) para Citas del Día en Móvil (<= 960px) */}
      {showMobileDaySheet && !showAgendarManualModal && !citaParaCancelar && !citaParaReagendar &&
        createPortal(
          <div
            className="mobile-day-modal-overlay"
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15, 23, 42, 0.55)",
              backdropFilter: "blur(4px)",
              WebkitBackdropFilter: "blur(4px)",
              zIndex: 9990,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "1rem"
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%",
                maxWidth: "520px",
                maxHeight: "82vh",
                background: "var(--card-bg, #ffffff)",
                borderRadius: "20px",
                border: "1px solid var(--card-border, rgba(148,163,184,0.25))",
                boxShadow: "0 20px 50px rgba(15, 23, 42, 0.32)",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                animation: "slideUpSheet 0.2s cubic-bezier(0.16, 1, 0.3, 1)"
              }}
            >
              {/* Cabecera fija del Modal */}
              <div
                style={{
                  padding: "1rem 1.15rem 0.9rem",
                  borderBottom: "1px solid var(--border-light, rgba(148,163,184,0.2))",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.65rem"
                }}
              >

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem" }}>
                  <div style={{ display: "flex", flexDirection: "column", textAlign: "left" }}>
                    <span style={{ fontSize: "0.74rem", color: "var(--text-muted)", fontWeight: 600 }}>
                      {selectedDay === hoyStr ? "Agenda de Hoy" : "Agenda del Día"}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <h4 style={{ margin: 0, fontSize: "1.05rem", color: "var(--text-main)" }}>
                        {selectedDay ? formatDateDDMMYYYY(selectedDay) : "Selecciona un día"}
                      </h4>
                      <span
                        style={{
                          background: "rgba(99, 102, 241, 0.12)",
                          color: "var(--primary, #6366f1)",
                          padding: "2px 9px",
                          borderRadius: "999px",
                          fontSize: "0.75rem",
                          fontWeight: 800
                        }}
                      >
                        {citasDelDia.length} {citasDelDia.length === 1 ? "cita" : "citas"}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {selectedDay && (
                      <button
                        type="button"
                        onClick={() => setShowAgendarManualModal(true)}
                        style={{
                          padding: "7px 12px",
                          borderRadius: "9px",
                          border: "none",
                          background: "var(--primary, #5e50a1)",
                          color: "#ffffff",
                          fontSize: "0.8rem",
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px"
                        }}
                      >
                        <FaPlus size={11} /> Agendar
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setShowMobileDaySheet(false)}
                      aria-label="Cerrar panel de citas"
                      style={{
                        width: "34px",
                        height: "34px",
                        borderRadius: "50%",
                        border: "1px solid var(--border-light, rgba(148,163,184,0.3))",
                        background: "rgba(148, 163, 184, 0.12)",
                        color: "var(--text-main)",
                        fontWeight: 700,
                        fontSize: "0.95rem",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {(selectedDayBlockedHours.length > 0 || selectedDayBlockNote) && (
                  <div
                    style={{
                      width: "100%",
                      background: "rgba(239, 68, 68, 0.08)",
                      border: "1px solid rgba(239, 68, 68, 0.25)",
                      borderRadius: "8px",
                      padding: "0.55rem 0.75rem",
                      color: "var(--danger, #ef4444)",
                      fontSize: "0.78rem",
                      textAlign: "left",
                      display: "flex",
                      flexDirection: "column",
                      gap: "3px"
                    }}
                  >
                    {selectedDayBlockedHours.length > 0 && (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 600 }}>
                        <FaLock size={11} />
                        <span>
                          {selectedDayBlockedHours.length >= 12
                            ? "Día completo bloqueado"
                            : `Horas bloqueadas: ${selectedDayBlockedHours.join(", ")}`}
                        </span>
                      </div>
                    )}
                    {selectedDayBlockNote && (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-main)" }}>
                        <FaStickyNote size={11} style={{ color: "var(--danger, #ef4444)" }} />
                        <span>
                          <strong>Nota:</strong> {selectedDayBlockNote}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Cuerpo desplazable con el acordeón compacto de citas */}
              <div
                style={{
                  padding: "1rem 1.15rem 1.5rem",
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.65rem"
                }}
              >
                {loadingCitas ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "100%",
                      minHeight: "150px",
                      padding: "1.5rem 0"
                    }}
                  >
                    <LoadingSpinner text="Cargando citas..." />
                  </div>
                ) : citasDelDia.length > 0 ? (
                  citasDelDia.map((cita, i) => {
                    const citaKey = cita._id || `sheet-cita-${i}`;
                    const isExpanded = expandedCitaId === citaKey;
                    const esNuevo = cita.esNuevoPaciente;
                    const nombreCompleto = `${capitalizeWords(cita.nombres || "")} ${capitalizeWords(cita.apellidos || cita.apellidoPaterno || "")}`.trim();

                    return (
                      <div
                        key={citaKey}
                        className={`appointment-card ${esNuevo ? "nuevo-paciente-card" : ""}`}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "stretch",
                          padding: "0.85rem 1rem",
                          borderRadius: "12px",
                          border: isExpanded ? "1.5px solid var(--primary)" : "1px solid var(--card-border)",
                          transition: "all 0.2s ease"
                        }}
                      >
                        {/* Cabecera compacta: Hora + Nombre + Insignia Nuevo + Chevron */}
                        <div
                          onClick={() => toggleExpandCita(citaKey)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "0.65rem",
                            cursor: "pointer",
                            userSelect: "none"
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", minWidth: 0, flex: 1 }}>
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                background: "rgba(99, 102, 241, 0.12)",
                                color: "var(--primary)",
                                padding: "4px 9px",
                                borderRadius: "8px",
                                fontWeight: 800,
                                fontSize: "0.85rem",
                                flexShrink: 0
                              }}
                            >
                              <FaClock size={11} /> {cita.horaCita}
                            </span>

                            <strong
                              style={{
                                color: "var(--text-main)",
                                fontSize: "0.92rem",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis"
                              }}
                            >
                              {nombreCompleto}
                            </strong>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                            {esNuevo && (
                              <span className="nuevo-paciente" style={{ margin: 0, display: "inline-flex", alignItems: "center", gap: "3px" }}>
                                <FaStar size={9} /> Nuevo
                              </span>
                            )}
                            <span
                              style={{
                                width: "26px",
                                height: "26px",
                                borderRadius: "50%",
                                background: isExpanded ? "var(--primary)" : "rgba(99, 102, 241, 0.08)",
                                color: isExpanded ? "#fff" : "var(--primary)",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "all 0.2s ease"
                              }}
                            >
                              {isExpanded ? <FaChevronUp size={11} /> : <FaChevronDown size={11} />}
                            </span>
                          </div>
                        </div>

                        {/* Contenido desplegable */}
                        {isExpanded && (
                          <div
                            style={{
                              marginTop: "0.75rem",
                              paddingTop: "0.75rem",
                              borderTop: "1px dashed var(--border-light, rgba(148,163,184,0.25))",
                              display: "flex",
                              flexDirection: "column",
                              gap: "0.75rem"
                            }}
                          >
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gap: "0.5rem",
                                background: "rgba(99, 102, 241, 0.04)",
                                padding: "0.65rem 0.75rem",
                                borderRadius: "8px",
                                fontSize: "0.82rem",
                                textAlign: "left"
                              }}
                            >
                              <div>
                                <span style={{ color: "var(--text-muted)", fontSize: "0.72rem", fontWeight: 600, display: "block" }}>
                                  Teléfono
                                </span>
                                <strong style={{ color: "var(--text-main)", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                  <FaPhoneAlt size={10} style={{ color: "var(--primary)" }} />
                                  {cita.telefono || "No registrado"}
                                </strong>
                              </div>

                              <div>
                                <span style={{ color: "var(--text-muted)", fontSize: "0.72rem", fontWeight: 600, display: "block" }}>
                                  Área
                                </span>
                                <strong style={{ color: "var(--primary)", textTransform: "capitalize" }}>
                                  {cita.area}
                                </strong>
                              </div>

                              {cita.especialistaNombre && (
                                <div style={{ gridColumn: "1 / -1" }}>
                                  <span style={{ color: "var(--text-muted)", fontSize: "0.72rem", fontWeight: 600, display: "block" }}>
                                    Especialista
                                  </span>
                                  <strong style={{ color: "var(--text-main)" }}>{cita.especialistaNombre}</strong>
                                </div>
                              )}
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px" }}>
                              <button
                                type="button"
                                onClick={() => {
                                  setShowMobileDaySheet(false);
                                  navigate(`/${rolePath}/paciente/${cita.identificadorPaciente}`);
                                }}
                                style={{
                                  padding: "7px 6px",
                                  borderRadius: "8px",
                                  border: "1px solid rgba(99, 102, 241, 0.3)",
                                  background: "rgba(99, 102, 241, 0.1)",
                                  color: "var(--primary)",
                                  fontSize: "0.78rem",
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: "4px"
                                }}
                              >
                                <FaFolderOpen size={11} /> Expediente
                              </button>

                              <button
                                type="button"
                                onClick={() => handleIniciarReagendar(cita)}
                                style={{
                                  padding: "7px 6px",
                                  borderRadius: "8px",
                                  border: "1px solid rgba(16, 185, 129, 0.35)",
                                  background: "rgba(16, 185, 129, 0.1)",
                                  color: "#10b981",
                                  fontSize: "0.78rem",
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: "4px"
                                }}
                              >
                                <FaRedoAlt size={11} /> Reagendar
                              </button>

                              <button
                                type="button"
                                onClick={() => setCitaParaCancelar(cita)}
                                style={{
                                  padding: "7px 6px",
                                  borderRadius: "8px",
                                  border: "1px solid rgba(239, 68, 68, 0.35)",
                                  background: "rgba(239, 68, 68, 0.1)",
                                  color: "#ef4444",
                                  fontSize: "0.78rem",
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: "4px"
                                }}
                              >
                                <FaTimesCircle size={11} /> Cancelar
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div style={{ textAlign: "center", padding: "1.5rem 1rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                    No hay citas programadas para este día.
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Modal de Detalle de Cita Estilo Google Calendar (Disponible para Día y Semana) */}
      {citaSeleccionadaGcal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "1rem"
          }}
          onClick={() => setCitaSeleccionadaGcal(null)}
        >
          <div
            className="glass-card"
            style={{
              background: "#ffffff",
              borderRadius: "14px",
              width: "100%",
              maxWidth: "420px",
              overflow: "hidden",
              boxShadow: "0 10px 25px rgba(0,0,0,0.18)",
              border: "1px solid rgba(0,0,0,0.08)",
              animation: "slideUpSheet 0.2s ease"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Encabezado con paleta del sistema */}
            <div
              style={{
                background: "var(--primary)",
                color: "#ffffff",
                padding: "1rem 1.25rem",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: "10px"
              }}
            >
              <div>
                <span style={{ fontSize: "0.78rem", opacity: 0.9, fontWeight: 600 }}>
                  {formatDateDDMMYYYY(citaSeleccionadaGcal.fechaCitaStr)}
                </span>
                <h3 style={{ margin: "2px 0 0 0", color: "#ffffff", fontSize: "1.12rem", fontWeight: 700 }}>
                  {`${capitalizeWords(citaSeleccionadaGcal.nombres || "")} ${capitalizeWords(citaSeleccionadaGcal.apellidos || citaSeleccionadaGcal.apellidoPaterno || "")}`.trim()}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCitaSeleccionadaGcal(null)}
                style={{
                  background: "rgba(255,255,255,0.2)",
                  border: "none",
                  color: "#ffffff",
                  borderRadius: "50%",
                  width: "28px",
                  height: "28px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  fontSize: "0.9rem"
                }}
              >
                ✕
              </button>
            </div>

            {/* Cuerpo del detalle */}
            <div style={{ padding: "1.2rem", display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.88rem" }}>
                <FaClock size={15} style={{ color: "#1a73e8" }} />
                <span>
                  <strong>Horario:</strong> {citaSeleccionadaGcal.horaCita} hrs
                </span>
              </div>
              {citaSeleccionadaGcal.telefono && (
                <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.88rem" }}>
                  <FaPhoneAlt size={14} style={{ color: "#1a73e8" }} />
                  <span
                    style={{ color: "#1a73e8", fontWeight: 600, textDecoration: "none" }}
                  >
                    {citaSeleccionadaGcal.telefono}
                  </span>
                </div>
              )}

              <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.88rem" }}>
                <span style={{ fontSize: "0.82rem", color: "var(--text-muted)", textTransform: "capitalize" }}>
                  Área: <strong>{citaSeleccionadaGcal.area}</strong> {citaSeleccionadaGcal.especialistaNombre ? `• ${citaSeleccionadaGcal.especialistaNombre}` : ""}
                </span>
              </div>

              {/* Acciones */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "0.5rem", paddingTop: "0.75rem", borderTop: "1px solid #edf2f7" }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    const c = citaSeleccionadaGcal;
                    setCitaSeleccionadaGcal(null);
                    handleIniciarReagendar(c);
                  }}
                  style={{ height: "36px", fontSize: "0.82rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                >
                  <FaRedoAlt size={11} /> Reagendar
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    const c = citaSeleccionadaGcal;
                    setCitaSeleccionadaGcal(null);
                    navigate(`/${rolePath}/paciente/${c.identificadorPaciente}`);
                  }}
                  style={{ height: "36px", fontSize: "0.82rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                >
                  <FaFolderOpen size={11} /> Expediente
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    const c = citaSeleccionadaGcal;
                    setCitaSeleccionadaGcal(null);
                    setCitaParaCancelar(c);
                  }}
                  style={{
                    gridColumn: "1 / -1",
                    height: "36px",
                    fontSize: "0.82rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    background: "rgba(239, 68, 68, 0.1)",
                    color: "#dc2626",
                    border: "1px solid rgba(239, 68, 68, 0.25)",
                    fontWeight: 700
                  }}
                >
                  <FaTimesCircle size={12} /> Cancelar Cita
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Agendar Manual */}
      {showAgendarManualModal && (
        <ModalAgendarManual
          selectedDateInitial={selectedDay}
          onClose={() => setShowAgendarManualModal(false)}
          onSaveSuccess={() => {
            setShowMobileDaySheet(false);
            setShowAgendarManualModal(false);
            fetchCitas();
          }}
        />
      )}

      {/* Modal Cancelar Cita (con validación de 24 hrs y vista de cancelada) */}
      {citaParaCancelar && (
        <ModalCancelarCita
          cita={citaParaCancelar}
          intentoReagendar={esCancelacionPorReagendar}
          onClose={() => {
            setCitaParaCancelar(null);
            setEsCancelacionPorReagendar(false);
          }}
          onCancelSuccess={() => {
            setShowMobileDaySheet(false);
            fetchCitas();
          }}
          onReagendar={(citaCancelada) => {
            setCitaParaCancelar(null);
            setEsCancelacionPorReagendar(false);
            setCitaParaReagendar(citaCancelada);
          }}
        />
      )}

      {/* Modal Reagendar Cita */}
      {citaParaReagendar && (
        <ModalAgendarCita
          paciente={{
            identificadorPaciente: citaParaReagendar.identificadorPaciente,
            nombres: citaParaReagendar.nombres,
            apellidoPaterno: citaParaReagendar.apellidoPaterno || "",
            apellidoMaterno: citaParaReagendar.apellidoMaterno || "",
            apellidos: citaParaReagendar.apellidos || "",
            telefono: citaParaReagendar.telefono || "",
            edad: citaParaReagendar.edad || 0,
            email: citaParaReagendar.email || "",
            area: citaParaReagendar.area || rolUsuario || rolePath
          }}
          citaAReagendar={citaParaReagendar}
          onCancelarYCobrar={(cita) => {
            setCitaParaReagendar(null);
            setEsCancelacionPorReagendar(true);
            setCitaParaCancelar(cita);
          }}
          onSaveSuccess={() => {
            setShowMobileDaySheet(false);
            setCitaParaReagendar(null);
          }}
          onClose={() => {
            setCitaParaReagendar(null);
            fetchCitas();
          }}
        />
      )}
    </div>
  );
}
