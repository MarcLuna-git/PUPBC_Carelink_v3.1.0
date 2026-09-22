import {
  BrowserRouter,
  Routes,
  Route,
  Outlet,
  Navigate,
} from 'react-router-dom';

import Landing from './pages/Landing/Landing';

import Login from './pages/Student/Login';
import Register from './pages/Student/Register';
import ForgotPassword from './pages/Student/ForgotPassword';
import ResetPassword from './pages/Student/ResetPassword';

import Welcome from './pages/Student/Welcome/Welcome';
import HealthProfile from './pages/Student/HealthProfile/HealthProfile';
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

/*
 * Safely read the currently stored student.
 *
 * Login already saves the authenticated user in localStorage.
 * HealthProfile also updates health_profile_completed after
 * successful completion.
 */
const getStoredStudent = () => {
  try {
    const storedUser = localStorage.getItem('user');

    if (!storedUser) {
      return null;
    }

    return JSON.parse(storedUser);
  } catch {
    return null;
  }
};

const hasCompletedHealthProfile = (user) => {
  const value =
    user?.profile?.health_profile_completed;

  return value === true || value === 1 || value === '1';
};

/*
 * Main student landing decision.
 *
 * Incomplete Health Profile:
 *   /student/health-profile
 *
 * Completed Health Profile:
 *   /student/appointments
 */
const StudentHomeRedirect = () => {
  const user = getStoredStudent();

  const healthProfileCompleted =
    hasCompletedHealthProfile(user);

  return (
    <Navigate
      to={
        healthProfileCompleted
          ? '/student/appointments'
          : '/student/health-profile'
      }
      replace
    />
  );
};

/*
 * Prevent students from opening clinic-service pages
 * until their Health Profile is complete.
 *
 * This is a UX/access gate only.
 * Backend validation should still remain as the
 * final security/business-rule protection.
 */
const HealthProfileRequired = ({ children }) => {
  const user = getStoredStudent();

  const healthProfileCompleted =
    hasCompletedHealthProfile(user);

  if (!healthProfileCompleted) {
    return (
      <Navigate
        to="/student/health-profile"
        replace
      />
    );
  }

  return children;
};

function App() {
  return (
    <AppErrorBoundary>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route
            path="/"
            element={<Landing />}
          />

          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/register"
            element={<Register />}
          />

          <Route
            path="/forgot-password"
            element={<ForgotPassword />}
          />

          <Route
            path="/reset-password"
            element={<ResetPassword />}
          />

          {/* Kiosk */}
          <Route
            path="/kiosk"
            element={<KioskPage />}
          />

          {/* Hidden Nurse portal */}
          <Route
            path="/carelink-portal"
            element={<NurseLogin />}
          />

          {/* Student */}
          <Route
            path="/student"
            element={
              <ProtectedRoute role="student">
                <StudentLayout>
                  <Outlet />
                </StudentLayout>
              </ProtectedRoute>
            }
          >
            {/*
              Opening /student automatically decides
              whether the student should continue their
              Health Profile or proceed to Appointments.
            */}
            <Route
              index
              element={<StudentHomeRedirect />}
            />

            <Route
              path="welcome"
              element={<Welcome />}
            />

            <Route
              path="health-profile"
              element={<HealthProfile />}
            />

            {/*
              Dashboard is no longer part of the
              Student Portal experience.

              Old links/bookmarks remain safe because
              they are redirected instead of returning 404.
            */}
            <Route
              path="dashboard"
              element={<StudentHomeRedirect />}
            />

            {/* Requires completed Health Profile */}
            <Route
              path="appointments"
              element={
                <HealthProfileRequired>
                  <Appointments />
                </HealthProfileRequired>
              }
            />

            {/* Requires completed Health Profile */}
            <Route
              path="qr"
              element={
                <HealthProfileRequired>
                  <QR />
                </HealthProfileRequired>
              }
            />

            {/* Student account */}
            <Route
              path="profile"
              element={<Profile />}
            />

            <Route
              path="profile/edit"
              element={<ProfileEdit />}
            />

            {/* Notification bell destination */}
            <Route
              path="alerts"
              element={<Alerts />}
            />

            {/*
              Kept temporarily while client decides
              whether in-system announcements remain.
            */}
            <Route
              path="announcements"
              element={<Announcements />}
            />

            {/* Clinic history */}
            <Route
              path="health-records"
              element={<HealthRecords />}
            />

            {/*
              These remain available while we build
              the consolidated Profile / Account area.
            */}
            <Route
              path="settings"
              element={<Settings />}
            />

            <Route
              path="help"
              element={<Help />}
            />

            <Route
              path="about"
              element={<About />}
            />
          </Route>

          {/* Nurse */}
          <Route
            path="/nurse"
            element={
              <ProtectedRoute role="nurse">
                <AdminLayout>
                  <Outlet />
                </AdminLayout>
              </ProtectedRoute>
            }
          >
            <Route
              path="dashboard"
              element={<NurseDashboard />}
            />

            <Route
              path="appointments"
              element={<NurseAppointments />}
            />

            <Route
              path="students"
              element={<NurseStudents />}
            />

            <Route
              path="consultation"
              element={<NurseConsultation />}
            />

            <Route
              path="medicines"
              element={<NurseMedicine />}
            />

            <Route
              path="records"
              element={<NurseRecords />}
            />

            <Route
              path="notifications"
              element={<NurseNotifications />}
            />

            <Route
              path="announcements"
              element={<NurseAnnouncements />}
            />

            <Route
              path="settings"
              element={<NurseSettings />}
            />
          </Route>

          {/* 404 */}
          <Route
            path="*"
            element={
              <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
                <div className="text-center px-4">
                  <h1 className="text-6xl font-bold text-gray-300 dark:text-gray-700">
                    404
                  </h1>

                  <p className="text-gray-600 dark:text-gray-300 mt-4">
                    Page not found
                  </p>

                  <a
                    href="/"
                    className="text-maroon-700 dark:text-maroon-300 hover:text-maroon-900 dark:hover:text-maroon-200 mt-4 inline-block font-medium"
                  >
                    Go Home
                  </a>
                </div>
              </div>
            }
          />
        </Routes>
      </BrowserRouter>
    </AppErrorBoundary>
  );
}

export default App;
