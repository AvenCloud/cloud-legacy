import React from 'react';
import { withA } from './aContext';
import { Page, Title, Form, FormInput, FormSubmit } from './common';

class RegisterWithA extends React.Component {
  state = { step: 0 };
  render() {
    const { navigation, aven } = this.props;
    const { step } = this.state;
    if (step === 0) {
      return (
        <Page>
          <Title>Register</Title>
          <Form
            onSubmit={async a => {
              if (a.authInput.match(/@/)) {
                console.log('email', a.authInput);
                await aven.authRequest('email', { email: a.authInput });
                this.setState({ step: 1 });
              } else if (
                a.authInput.match(
                  /((?:\+|00)[17](?: |\-)?|(?:\+|00)[1-9]\d{0,2}(?: |\-)?|(?:\+|00)1\-\d{3}(?: |\-)?)?(0\d|\([0-9]{3}\)|[1-9]{0,3})(?:((?: |\-)[0-9]{2}){4}|((?:[0-9]{2}){4})|((?: |\-)[0-9]{3}(?: |\-)[0-9]{4})|([0-9]{7}))/,
                )
              ) {
                const phone = a.authInput.replace(/\D/g, '');
                await aven.authRequest('phone', { phone });
                console.log('phone', phone);
              } else {
                alert('woah your input is whack ' + a.authInput);
              }
            }}
            render={({ createField, submitForm }) => (
              <React.Fragment>
                <FormInput
                  label="Email or Phone Number"
                  field={createField('authInput')}
                />
                <FormSubmit submitForm={submitForm} />
              </React.Fragment>
            )}
          />
        </Page>
      );
    }

    if (step === 1) {
      return (
        <Page>
          <Title>Register</Title>
          <Form
            onSubmit={async a => {
              await aven.accountCreate({
                authName: a.authName,
                authResponse: { verificationCode: a.verificationCode },
              });
            }}
            render={({ createField, submitForm }) => (
              <React.Fragment>
                <FormInput
                  label="Your New Username"
                  field={createField('authName')}
                />
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
}

const Register = withA(RegisterWithA);

Register.title = 'Register';

export default Register;
