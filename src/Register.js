import React from 'react';
import { withA } from './aContext';
import { Page, Title, Form, FormInput, FormSubmit } from './common';

class RegisterWithA extends React.Component {
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
            title="Register"
            onSubmit={async (a, { setSubmitting }) => {
              if (a.authInput.match(/@/)) {
                console.log('email', a.authInput);
                await aven.authRequest('email', { email: a.authInput });
                setSubmitting(false);
              } else if (
                a.authInput.match(
                  /((?:\+|00)[17](?: |\-)?|(?:\+|00)[1-9]\d{0,2}(?: |\-)?|(?:\+|00)1\-\d{3}(?: |\-)?)?(0\d|\([0-9]{3}\)|[1-9]{0,3})(?:((?: |\-)[0-9]{2}){4}|((?:[0-9]{2}){4})|((?: |\-)[0-9]{3}(?: |\-)[0-9]{4})|([0-9]{7}))/,
                )
              ) {
                const phone = a.authInput.replace(/\D/g, '');
                await aven.authRequest('phone', { phone });
                setSubmitting(false);
                console.log('phone', phone);
              } else {
                setSubmitting(false);
                alert('woah your input is whack ' + a.authInput);
              }
            }}
            render={({ createField, submitForm, isSubmitting }) => (
              <React.Fragment>
                {isSubmitting && <Title>Sumitting..</Title>}
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

    return (
      <Page>
        <Form
          title="Register"
          onSubmit={async (a, { setSubmitting, setErrors }) => {
            try {
              await aven.accountCreate({
                authName: a.authName,
                authResponse: { verificationCode: a.verificationCode },
              });
              setSubmitting(false);
            } catch (e) {
              setSubmitting(false);
              setErrors({ authName: e.error });
            }
          }}
          render={({ createField, submitForm, isSubmitting }) => (
            <React.Fragment>
              {isSubmitting && <Title>Sumitting..</Title>}
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

const Register = withA(RegisterWithA);

Register.title = 'Register';

export default Register;
