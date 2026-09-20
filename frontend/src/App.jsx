import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import Landing from './pages/Landing/Landing';
import Login from './pages/Student/Login';
import Register from './pages/Student/Register';
import ForgotPassword from './pages/Student/ForgotPassword';
import ResetPassword from './pages/Student/ResetPassword';
import Welcome from './pages/Student/Welcome/Welcome';
import HealthProfile from './pages/Student/HealthProfile/HealthProfile';
import Dashboard from './pages/Student/Dashboard/Dashboard';
import Appointments from './pages/Student/Appointments/Appointments';
import QR from './pages/Student/QR/QR';
import Profile from './pages/Student/Profile/Profile';
import ProfileEdit from './pages/Student/ProfileEdit/ProfileEdit';
import Alerts from './pages/Student/Alerts/Alerts';
import Announcements from './pages/Student/Announcements/Announcements';
import HealthRecords from './pages/Student/HealthRecords/HealthRecords';
import Settings from './pages/Student/Settings/Settings';
import Help from './pages/Student/Help/Help';
import About from './pages/Student/About/About';
import StudentLayout from './layouts/StudentLayout';
import NurseLogin from './pages/Admin/Login/NurseLogin';
import NurseDashboard from './pages/Admin/Dashboard/NurseDashboard';
import NurseAppointments from './pages/Admin/Appointments/NurseAppointments';
import NurseStudents from './pages/Admin/Students/NurseStudents';
import NurseConsultation from './pages/Admin/Consultation/NurseConsultation';
import NurseMedicine from './pages/Admin/Medicine/NurseMedicine';
import NurseRecords from './pages/Admin/Records/NurseRecords';
import NurseNotifications from './pages/Admin/Notifications/NurseNotifications';
import NurseAnnouncements from './pages/Admin/Announcements/NurseAnnouncements';
import NurseSettings from './pages/Admin/Settings/NurseSettings';
import AdminLayout from './layouts/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';
import KioskPage from './pages/Kiosk/KioskPage';
import AppErrorBoundary from './components/AppErrorBoundary';

function App() {
  return (
    <AppErrorBoundary>
      <BrowserRouter>
        <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route path="/kiosk" element={<KioskPage />} />

        {/* Hidden Nurse portal; direktang URL ang gamit, walang public link. */}
        <Route path="/carelink-portal" element={<NurseLogin />} />

        <Route path="/student" element={<ProtectedRoute role="student"><StudentLayout><Outlet /></StudentLayout></ProtectedRoute>}>
          <Route path="welcome" element={<Welcome />} />
          <Route path="health-profile" element={<HealthProfile />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="appointments" element={<Appointments />} />
          <Route path="qr" element={<QR />} />
          <Route path="profile" element={<Profile />} />
          <Route path="profile/edit" element={<ProfileEdit />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="announcements" element={<Announcements />} />
          <Route path="health-records" element={<HealthRecords />} />
          <Route path="settings" element={<Settings />} />
          <Route path="help" element={<Help />} />
          <Route path="about" element={<About />} />
        </Route>

        <Route path="/nurse" element={<ProtectedRoute role="nurse"><AdminLayout><Outlet /></AdminLayout></ProtectedRoute>}>
          <Route path="dashboard" element={<NurseDashboard />} />
          <Route path="appointments" element={<NurseAppointments />} />
          <Route path="students" element={<NurseStudents />} />
          <Route path="consultation" element={<NurseConsultation />} />
          <Route path="medicines" element={<NurseMedicine />} />
          <Route path="records" element={<NurseRecords />} />
          <Route path="notifications" element={<NurseNotifications />} />
          <Route path="announcements" element={<NurseAnnouncements />} />
          <Route path="settings" element={<NurseSettings />} />
        </Route>

        <Route path="*" element={
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <h1 className="text-6xl font-bold text-gray-300">404</h1>
              <p className="text-gray-500 mt-4">Page not found</p>
              <a href="/" className="text-maroon-700 hover:text-maroon-900 mt-4 inline-block">Go Home</a>
            </div>
          </div>
        } />
        </Routes>
      </BrowserRouter>
    </AppErrorBoundary>
  );
}

export default App;