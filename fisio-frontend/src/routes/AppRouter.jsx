import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import PrivateRoute from './PrivateRoutes.jsx';

// Layouts
import AdminLayout from '../components/layout/AdminLayout';
import FisioLayout from '../components/layout/FisioLayout';
import NutriologaLayout from '../components/layout/NutriologaLayout';

// Páginas
import Dashboard from '../pages/admin/Dashboard';
import AppointmentForm from '../pages/public/AppointmentForm.jsx';
import BloquearHorarioFisio from '../pages/fisioterapeuta/BloquearHorario.jsx';
import BloquearHorarioNutri from '../pages/nutriologa/BloquearHorario.jsx';
import AgendaCitas from '../components/layout/AgendarCitas.jsx';
// Componentes Pacientes
import PacienteDetalle from '../components/Pacientes/PacienteDetalle.jsx';
import ListaPacientes from '../components/Pacientes/Pacientes.jsx';

//Historiales
import FormularioHistorial from '../components/historial/FormularioHistorial.jsx';

// Notas
import Notas from '../components/notas/NuevaNota.jsx';
import NotaDetalle from '../components/notas/DetalleNota.jsx';

// Información clínica
import InformacionClinica from '../components/layout/InformacionClinica.jsx';


//configuraciones 
import Antecedentes from '../components/layout/Antecedentes.jsx';


export default function AppRouter() {
  return (
    <Routes>
      {/* Públicas */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/citas" element={<AppointmentForm />} />

      {/* Superadmin */}
      <Route
        path="/admin/*"
        element={
          <PrivateRoute allowedRoles={['superadmin']}>
            <AdminLayout />
          </PrivateRoute>
        }
      />

      {/* Fisioterapeuta */}
      <Route
        path="/fisioterapeuta/*"
        element={
          <PrivateRoute allowedRoles={['fisioterapeuta']}>
            <FisioLayout />
          </PrivateRoute>
        }
      >
        <Route path="agenda" element={<AgendaCitas/>} />
        <Route path="bloquear" element={<BloquearHorarioFisio/>} />
        <Route path="paciente/:id" element={<PacienteDetalle/>} />
        <Route path="pacientes" element={<ListaPacientes/>} />
        <Route path="creacion-historial" element={<FormularioHistorial/>} />
        <Route path="notas" element={<Notas/>} />
        <Route path="nota-detalle/:id" element={<NotaDetalle/>} />
        <Route path="informacion-clinica" element={<InformacionClinica/>}/>
        <Route path="antecedentes" element={<Antecedentes/>}/>
      </Route>

      {/* Nutrióloga */}
      <Route path="/nutriologa/*" 
        element={
          <PrivateRoute allowedRoles={['nutriologa']}>
            <NutriologaLayout />
          </PrivateRoute>
        }
      >
        <Route path="agenda" element={<AgendaCitas />} />
        <Route path="bloquear" element={<BloquearHorarioNutri />} />
        <Route path="paciente/:id" element={<PacienteDetalle />} />
        <Route path="pacientes" element={<ListaPacientes/>} />
      </Route>

      {/* Ruta no encontrada */}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}
