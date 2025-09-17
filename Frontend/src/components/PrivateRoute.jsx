import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AccessDeniedModal from "./AccessDeniedModal";

const PrivateRoute = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";

  // Proposal page is always allowed
  const isProposalPage = location.pathname === "/proposal";

  // Allowed screens
  let allowedScreens = [];
  const storedScreens = localStorage.getItem("allowedScreens");
  if (storedScreens && storedScreens !== "undefined" && storedScreens.startsWith("[")) {
    try {
      allowedScreens = JSON.parse(storedScreens);
    } catch (e) {
      console.error("Failed to parse allowedScreens:", e);
    }
  }

  const isAuthorized = allowedScreens.includes(location.pathname);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Block unauthorized access
  useEffect(() => {
    if (isAuthenticated && !isAuthorized && !isProposalPage) {
      setShowModal(true);
      navigate(-1); // Go back instead of opening blocked screen
    }
  }, [isAuthenticated, isAuthorized, isProposalPage, navigate]);

  if (!isAuthenticated) {
    return null; // render nothing until redirect
  }

  if (isProposalPage) {
    return children;
  }

  return (
    <>
      {showModal && (
        <AccessDeniedModal
          isOpen={true}
          onClose={() => setShowModal(false)}
        />
      )}
      {isAuthorized ? children : null}
    </>
  );
};

export default PrivateRoute;
