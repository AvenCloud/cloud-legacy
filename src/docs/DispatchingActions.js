import { DocPage, P, SubTitle, ExampleAction, Link } from './components';
import React from 'react';

export default class Doc extends React.Component {
  static info = {
    routeName: 'DispatchingActions',
    title: 'Dispatching Actions',
  };
  render() {
    return (
      <DocPage title={Doc.info.title}>
        <P>
          Actions can be sent to the server with a JSON-encoded POST request to
          https://aven.cloud/api .
        </P>
        <P>
          Each request must contain a `type` field to specify what action to
          take.
        </P>
        <P>
          For servers that support many apps, such as `aven.cloud`, the `domain`
          field must be specified for each dispatched action. This will ensure
          that you are accessing your own user accounts and documents.
        </P>
        <SubTitle>Authentication Actions</SubTitle>
        <P>
          There are several actions used to authenticate and verify the identity
          of an account.
        </P>
        <Link toDoc="DispatchingActions">authPut</Link>
        <Link toDoc="DispatchingActions">authRequest</Link>
        <Link toDoc="DispatchingActions">accountCreate</Link>
        <Link toDoc="DispatchingActions">accountPut</Link>
        <Link toDoc="DispatchingActions">accountDestroy</Link>
        <Link toDoc="DispatchingActions">sessionCreate</Link>
        <Link toDoc="DispatchingActions">sessionDestroy</Link>
        <SubTitle>Logged in Actions</SubTitle>
        <P>
          The following actions must include authentication info. The
          `authName`, `authSession` and `authKey` must be included. These fields
          can be retrieved from the `accountCreate` or `sessionCreate` actions.
        </P>
        <Link toDoc="DispatchingActions">accountGet</Link>
        <Link toDoc="DispatchingActions">docPut</Link>
        <Link toDoc="DispatchingActions">docGet</Link>
        <Link toDoc="DispatchingActions">docGetHistory</Link>
        <Link toDoc="DispatchingActions">account</Link>

        <SubTitle>Anonymous Actions</SubTitle>
        <P>
          Authentication is not required for the following doc actions, when the
          doc is currently set to `isPublic`.{' '}
          <Link toDoc="Permissions">
            Learn more about doc permissions here.
          </Link>
        </P>
        <Link toDoc="DispatchingActions">docGet</Link>
        <Link toDoc="DispatchingActions">docGetHistory</Link>
      </DocPage>
    );
  }
}
