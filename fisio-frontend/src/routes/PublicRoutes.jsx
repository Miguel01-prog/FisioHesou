import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from '../pages/public/Home.jsx';
import AppointmentForm from '../pages/public/AppointmentForm.jsx';

export default function PublicRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="appointment" element={<AppointmentForm />} />
    </Routes>
  );
}
