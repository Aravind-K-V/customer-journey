import React from 'react';
import Layout from '../components/Layout';
import LoginHeader from '../components/LoginHeader';
import RightSectionlogin from '../components/RightSectionLogin';

const LoginPage = () => {
  return <Layout RightComponent={RightSectionlogin} CustomHeader={LoginHeader} />;
};

export default LoginPage;