import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import RightSectionForgot from "../components/RightSectionForgot";
import Layout from "../components/Layout";
import LoginHeader from "../components/LoginHeader";

const Forgot = () => {
  return <Layout RightComponent={RightSectionForgot} CustomHeader={LoginHeader} />;
};

export default Forgot;