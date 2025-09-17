import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import Forgot from "./pages/Forgot";
import Proposal from "./pages/Proposal";
import STPAccept from "./pages/STPAccept";
import STPReject from "./pages/STPReject";
import FIN from "./pages/FIN";
import MC from "./pages/MC";
import Tele from "./pages/Tele";
import PrivateRoute from "./components/PrivateRoute";
import UnderReview from "./pages/UnderReview";
import Rules from "./pages/Rules";

const App = () => {
  const location = useLocation();

  React.useEffect(() => {
    const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";

    if (isAuthenticated && location.pathname !== "/login") {
      // Prevent back navigation
      window.history.pushState(null, "", window.location.href);
      const handlePopState = () => {
        window.history.pushState(null, "", window.location.href);
      };
      window.addEventListener("popstate", handlePopState);

      return () => {
        window.removeEventListener("popstate", handlePopState);
      };
    }
  }, [location]);

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot" element={<Forgot />} />

      <Route
        path="/proposal"
        element={
          <PrivateRoute>
            <Proposal />
          </PrivateRoute>
        }
      />
      <Route
        path="/STPAccept"
        element={
          <PrivateRoute>
            <STPAccept />
          </PrivateRoute>
        }
      />
      <Route
        path="/STPReject"
        element={
          <PrivateRoute>
            <STPReject />
          </PrivateRoute>
        }
      />
      <Route
        path="/Rules"
        element={
          <PrivateRoute>
            <Rules />
          </PrivateRoute>
        }
      />
      <Route
        path="/FIN"
        element={
          <PrivateRoute>
            <FIN />
          </PrivateRoute>
        }
      />
      <Route
        path="/MC"
        element={
          // <PrivateRoute>
            <MC />
          // </PrivateRoute>
        }
      />
      <Route
        path="/Tele"
        element={
          <PrivateRoute>
            <Tele />
          </PrivateRoute>
        }
      />
      <Route
        path="/UnderReview"
        element={
          <PrivateRoute>
            <UnderReview />
          </PrivateRoute>
        }
      />

      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
};

export default App;