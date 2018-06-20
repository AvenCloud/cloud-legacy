import { DocPage, P, SubTitle, Link } from './components';

import React from 'react';

export default class Doc extends React.Component {
  static navigationOptions = {
    routeName: 'GettingStarted',
    title: 'Getting Started',
  };
  render() {
    return (
      <DocPage title={Doc.navigationOptions.title}>
        <SubTitle>Get Started</SubTitle>
        <P>
          Welcome to Aven Cloud, the free and easy-to-use database for apps and
          websites.
        </P>
        <SubTitle>Step 1: Choose a server</SubTitle>
        <P>
          Easiest option: Sign up for the Aven Cloud service, which includes a
          free tier for small apps.
        </P>
        <SubTitle>Step 2: Authenticate</SubTitle>
        <P>You can log into the Aven server via the website or API</P>
        <P>
          <Link toDoc="UserAuth">Learn about the authentication API flow</Link>
        </P>
        <SubTitle>Step 2: Connect your app</SubTitle>
        <P>
          Use the `putDoc` and `getDoc` actions to save data from your app and
          read it later.{' '}
          <Link toDoc="StoringDocs">Get started with document saving here</Link>
        </P>
      </DocPage>
    );
  }
}

// Getting Started

// Step 1 - Set up Aven Cloud Server

// To get started, you can sign up to the aven.cloud service, or you can launch an open source server.

// Option A (Easiest) - Join aven.cloud here: https://aven.cloud/join

// Option B (Easy) - Run standalone cloud server `npx aven-cloud-server`

// Option C (Also Easy) - Install local express server

// ```
// Bpm I —save aven-cloud-server
// SetupServer(app)
// ```

// Step 2 - Users can create an Account and Log In

// Step 3 - Read and write documents

// Step 4 - Learn about advanced features

// Read about document permissions and versioning.
