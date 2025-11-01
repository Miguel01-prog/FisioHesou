import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import api from "../../api";
import "../../styles/calendary.css";

const CalendarioBloqueo = ({ role }) => {
  const [blockedDates, setBlockedDates] = useState([]);

  useEffect(() => {
    const fetchBlockedDates = async () => {
      try {
        const { data } = await api.get(`/horarios/${role}`);
        setBlockedDates(data.blockedDates || []);
      } catch (err) {
        console.error("Error al obtener bloqueos:", err);
      }
    };
    fetchBlockedDates();
  }, [role]);

  const toggleBlock = async (date) => {
    if (!(date instanceof Date)) {
      console.error("Fecha inválida:", date);
      return;
    }

    const formatted = date.toISOString().split("T")[0]; 
    let updated;

    if (blockedDates.includes(formatted)) {
      updated = blockedDates.filter((d) => d !== formatted);
    } else {
      updated = [...blockedDates, formatted];
    }

    setBlockedDates(updated);

    try {
      await api.post(`/horarios/${role}`, { blockedDates: updated });
      console.log("Bloqueos actualizados:", updated);
    } catch (err) {
      console.error("Error al actualizar bloqueos:", err);
    }
  };

  return (
    <div className="auth-wrapper-content">
      <div className="auth-card card flex flex-col items-center justify-center p-6">
      <Calendar onClickDay={(value) => toggleBlock(value)}
          tileClassName={({ date }) =>
          blockedDates.includes(date.toISOString().split("T")[0])
            ? "blocked"
            : ""
        }
        />
      </div>
    </div>
  );
};

export default CalendarioBloqueo;
