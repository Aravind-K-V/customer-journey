// RegisterPage.jsx
import React from 'react';
import Layout from '../components/Layout';
import LoginHeader from '../components/LoginHeader';
import RightSectionregister from '../components/RightSectionregister';

const RegisterPage = () => {
  return <Layout RightComponent={RightSectionregister} CustomHeader={LoginHeader} />;
};

export default RegisterPage;