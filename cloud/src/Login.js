import React from 'react';
import { withA } from './aContext';
import { Page, Title, Form, FormInput, FormSubmit } from './common';

class LoginWithA extends React.Component {
  componentDidUpdate() {
    if (this.props.aven.state.isAuthenticated) {
      this.props.navigation.navigate('dashboard');
    }
  }
  render() {
    const { navigation, aven } = this.props;
    const { authRequestMethod } = aven.state;
    if (!authRequestMethod) {
      return (
        <Page>
          <Form
            title="Login"
            onSubmit={async a => {
              if (a.authName.match(/@/)) {
                await aven.requestEmailLogin(a.authName);
              } else if (
                a.authName.match(
                  /((?:\+|00)[17](?: |\-)?|(?:\+|00)[1-9]\d{0,2}(?: |\-)?|(?:\+|00)1\-\d{3}(?: |\-)?)?(0\d|\([0-9]{3}\)|[1-9]{0,3})(?:((?: |\-)[0-9]{2}){4}|((?:[0-9]{2}){4})|((?: |\-)[0-9]{3}(?: |\-)[0-9]{4})|([0-9]{7}))/,
                )
              ) {
                const phone = a.authName.replace(/\D/g, '');
                await aven.requestPhoneLogin(phone);
              } else {
                const authName = a.authName;
                await aven.requestAuthNameLogin(authName);
              }
            }}
            render={({ createField, submitForm, isSubmitting }) => (
              <React.Fragment>
                {isSubmitting && <Title>Sumitting..</Title>}

                <FormInput
                  label="Username or Phone or Email"
                  field={createField('authName')}
                />
                <FormSubmit submitForm={submitForm} />
              </React.Fragment>
            )}
          />
        </Page>
      );
    }

    return (
      <Page>
        <Form
          title="Login"
          onSubmit={async a => {
            await this.props.aven.verifyLoginCode(a.verificationCode);
          }}
          render={({ createField, submitForm, isSubmitting }) => (
            <React.Fragment>
              {isSubmitting && <Title>Sumitting..</Title>}

              <FormInput
                label="Verification Code"
                field={createField('verificationCode')}
              />
              <FormSubmit submitForm={submitForm} />
            </React.Fragment>
          )}
        />
      </Page>
    );
  }
}

const Login = withA(LoginWithA);

Login.title = 'Login';

export default Login;
