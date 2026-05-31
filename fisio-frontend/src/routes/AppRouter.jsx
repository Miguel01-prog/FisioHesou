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
import UsersPage from '../pages/admin/UsersPage';
import AppointmentForm from '../pages/public/AppointmentForm.jsx';
import DashboardFisio from '../pages/fisioterapeuta/Dashboard-fisio.jsx';
import DashboardNutri from '../pages/nutriologa/Dashboard-nutri.jsx';
import BloquearHorarioFisio from '../pages/fisioterapeuta/BloquearHorario.jsx';
import BloquearHorarioNutri from '../pages/nutriologa/BloquearHorario.jsx';
import AgendaCitas from '../components/layout/AgendarCitas.jsx';
// Componentes Pacientes
import PacienteDetalle from '../components/Pacientes/PacienteDetalle.jsx';
import ListaPacientes from '../components/Pacientes/Pacientes.jsx';
import ConstructorPlan from '../components/pacientes/ConstructorPlan.jsx';
import PlanDocumento from '../components/pacientes/PlanDocumento.jsx';
import ListaPlanesPaciente from '../components/pacientes/ListaPlanesPaciente.jsx';

//Historiales
import FormularioHistorial from '../components/historial/FormularioHistorial.jsx';
import VistaHistorial from '../components/historial/VistaHistorial.jsx';

// Notas
import Notas from '../components/notas/NuevaNota.jsx';
import NotaDetalle from '../components/notas/DetalleNota.jsx';

// Información clínica
import InformacionClinica from '../components/layout/InformacionClinica.jsx';


//configuraciones 
import Antecedentes from '../components/layout/Antecedentes.jsx';
import ConfiguracionEjercicios from '../components/layout/ConfiguracionEjercicios.jsx';


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
      >
        <Route index element={<Dashboard />} />
        <Route path="users" element={<UsersPage />} />
      </Route>

      {/* Fisioterapeuta */}
      <Route
        path="/fisioterapeuta/*"
        element={
          <PrivateRoute allowedRoles={['fisioterapeuta']}>
            <FisioLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<DashboardFisio />} />
        <Route path="agenda" element={<AgendaCitas/>} />
        <Route path="bloquear" element={<BloquearHorarioFisio/>} />
        <Route path="paciente/:id" element={<PacienteDetalle/>} />
        <Route path="pacientes" element={<ListaPacientes/>} />
        <Route path="planes-paciente/:id" element={<ListaPlanesPaciente/>} />
        <Route path="crear-plan/:id" element={<ConstructorPlan/>} />
        <Route path="editar-plan/:idPlan" element={<ConstructorPlan/>} />
        <Route path="plan-documento/:id" element={<PlanDocumento/>} />
        <Route path="creacion-historial" element={<FormularioHistorial/>} />
        <Route path="historial-detalle/:id" element={<VistaHistorial/>} />
        <Route path="notas" element={<Notas/>} />
        <Route path="nota-detalle/:id" element={<NotaDetalle/>} />
        <Route path="informacion-clinica" element={<InformacionClinica/>}/>
        <Route path="antecedentes" element={<Antecedentes/>}/>
        <Route path="ejercicios" element={<ConfiguracionEjercicios/>}/>
      </Route>

      {/* Nutrióloga */}
      <Route path="/nutriologa/*" 
        element={
          <PrivateRoute allowedRoles={['nutriologa']}>
            <NutriologaLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<DashboardNutri />} />
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
