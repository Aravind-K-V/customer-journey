import React from "react";
import Layout from "../components/Layout";
import FINScreen from "../components/RightSectionFIN";
import { useEffect } from "react";
import useNextStep from "../hooks/useNextStep";

const FIN = () => {
  useEffect(() => {
    localStorage.setItem('pendingSteps', JSON.stringify(['FIN', 'MERT', 'MC']));
  }, []);
  return <Layout RightComponent={FINScreen} />;
};

export default FIN;