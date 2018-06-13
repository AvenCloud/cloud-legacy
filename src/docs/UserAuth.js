import { DocPage, P, SubTitle, ExampleAction } from './components';
import React from 'react';

export default class Doc extends React.Component {
  static info = {
    routeName: 'UserAuth',
    title: 'User Accounts and Authentication',
  };
  render() {
    return (
      <DocPage title={Doc.info.title}>
        <SubTitle>Authentication Tokens</SubTitle>

        <P>
          To login, create an account, or reset your password, you will need an
          authentication token. The first step is to request a partial token.
        </P>

        <P>
          Depending on the authentication method, the format of the token may
          vary.
        </P>
      </DocPage>
    );
  }
}

// # User Accounts and Authentication

// ##

// ```
// AuthRequest
//     Account
//     Method: EmailAuth | TestEmailLoggingAuth | OAuth
// ```

// This will return an incomplete authentication token. The “code” should be collected from the user or via the OAuth callback URL. The complete authentication token is:

// ```
// {...authRequest, code: ‘asdf’ }
// ```

// ## Creating a user account

// ```
// AccountCreate
//     Account: sam
//     Password: ...
//     Verification: [ {...AuthToken} ]
// ```

// Once an account is created, there is a new “password” auth token that can be used, with the following format: {type: ‘password’, password: ‘abc123’ }

// ## Logging in

// ```
// SessionCreate
//     Account: sam
//     AuthToken
// ```

// This will return a session string that can be used for the authenticated actions

// ## Logging out

// ```
// SessionDestroy
//     Account: sam
//     Session: session-id
// ```

// ## Setting Authentication Methods

// For users who are already logged in, additional forms of authentication can be added with the following action. This can also be used to change or reset a password. The type of the new authentication method is provided, and it will wipe out any existing authentication methods of that type.

// AccountSetAuth
//     AuthAccount
//     AuthToken
//     Method
//     NewAuthToken

// The NewAuthToken may be null if the user intends to remove an authentication method. If there is only one remaining authentication method, it cannot be set to null.

// ## Configuring App Authentication

// The app can be configured to provide several authentication methods.

// - TestEmailLoggingAuth (for use in development only)
// - EmailAuth
// - OAuth

// ## Destroying an Account

// A user account can be destroyed by providing an AuthToken and the account ID

// ```
// AccountDestroy
//     AuthAccount
//     AuthToken
// ```

// When an account is destroyed, all docs Owned by the user will also be destroyed
