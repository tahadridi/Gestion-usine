import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "../src/lib/lightbox/css/lightbox.min.css";
import "./App.css";
import { useAuthStore } from "./store/useAuthStore";
import Home from "./components/Home";
import Production from "./components/Production/production";
import Fabrication from "./components/Fabrication";
import Adminpage from "./components/Adminpage";
import StockManagement from "./components/StockManagement";
import Dashboard from "./components/Production/dashboard";
import SignIn from "./components/Signin";
import SignUp from "./components/Signup";
import ProfilePage from "./components/ProfilePage";
import Admin from "./components/Adminuser";
import Autoliv from "./components/Autoliv";
import Reclamation from "./components/reclamation";
import Reporting from "./components/Reporting";

import { Toaster } from "react-hot-toast";
import Layout from "./layout.js";
import ProtectedRoute from "./components/ProtectedRoutes";

function App() {
  const { authUser, checkAuth, isCheckingAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isCheckingAuth) {
    return (
      <div className="d-flex vh-100 justify-content-center align-items-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Toaster position="top-center" />
      <div className="App">
        <Routes>
          {/* Protected routes (require authUser) */}
          <Route
            path="/fabrication"
            element={
              <ProtectedRoute allowedRoles={['admin', 'manager', 'operator', 'technician', 'supervisor']}>
                <Layout>
                  <Fabrication />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/production"
            element={
              <ProtectedRoute allowedRoles={['admin', 'manager']}>
                <Layout>
                  <Production />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/adminpage"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Layout>
                  <Adminpage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/stockmanagement"
            element={
              <ProtectedRoute allowedRoles={['admin', 'manager']}>
                <Layout>
                  <StockManagement />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/Home"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Layout>
                  <Home />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Layout>
                  <Admin />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/autoliv"
            element={
              authUser ? (
                <Layout>
                  <Autoliv />
                </Layout>
              ) : (
                <Autoliv />
              )
            }
          />
          <Route
            path="/reclamation"
            element={
              <ProtectedRoute>
                <Layout>
                  <Reclamation />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/reporting"
            element={
              <ProtectedRoute>
                <Layout>
                  <Reporting />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Public routes */}
          <Route path="/signin" element={!authUser ? <SignIn /> : <Navigate to="/" />} />
          <Route path="/signup" element={!authUser ? <SignUp /> : <Navigate to="/" />} />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/autoliv" />} />
          <Route path="*" element={<Navigate to="/autoliv" />} />
        </Routes>
           
      </div>
    </Router>
  );
}

export default App;
