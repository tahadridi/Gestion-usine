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
              authUser ? (
                <Layout>
                  <Fabrication />
                </Layout>
              ) : (
                <Navigate to="/signin" />
              )
            }
          />
          <Route
            path="/production"
            element={
              authUser ? (
                <Layout>
                  <Production />
                </Layout>
              ) : (
                <Navigate to="/signin" />
              )
            }
          />
          <Route
            path="/adminpage"
            element={
              authUser ? (
                <Layout>
                  <Adminpage />
                </Layout>
              ) : (
                <Navigate to="/signin" />
              )
            }
          />
          <Route
            path="/stockmanagement"
            element={
              authUser ? (
                <Layout>
                  <StockManagement />
                </Layout>
              ) : (
                <Navigate to="/signin" />
              )
            }
          />
          <Route
            path="/Home"
            element={
              authUser ? (
                <Layout>
                  <Home />
                </Layout>
              ) : (
                <Navigate to="/signin" />
              )
            }
          />
          <Route
            path="/profile"
            element={authUser ? <ProfilePage /> : <Navigate to="/signin" />}
          />
          <Route
            path="/admin"
            element={
              authUser ? (
                <Layout>
                  <Admin />
                </Layout>
              ) : (
                <Navigate to="/signin" />
              )
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
                <Navigate to="/signin" />
              )
            }
          />
          <Route
            path="/reclamation"
            element={
              authUser ? (
                <Layout>
                  <Reclamation />
                </Layout>
              ) : (
                <Navigate to="/signin" />
              )
            }
          />

          {/* Public routes */}
           <Route path="/autoliv" element={<Autoliv />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/autoliv" />} />

          <Route path="/reporting" element={<Reporting />} />
        </Routes>
           
      </div>
    </Router>
  );
}

export default App;
