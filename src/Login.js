import React from 'react';
import { withA } from './aContext';
import { Page, Title, Form, FormInput, FormSubmit } from './common';

const LoginWithA = ({ navigation, aven }) => (
  <Page>
    <Title>Login</Title>
    <Form
      onSubmit={() => {
        debugger;
      }}
      render={() => (
        <React.Fragment>
          <FormInput />
          <FormInput />
          <FormSubmit />
        </React.Fragment>
      )}
    />
  </Page>
);

const Login = withA(LoginWithA);

Login.title = 'Login';

export default Login;
