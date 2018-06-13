import { DocPage, P, SubTitle, List } from './components';
import React from 'react';

export default class Doc extends React.Component {
  static info = {
    routeName: 'Websockets',
    title: 'Websocket Connections',
  };
  render() {
    return (
      <DocPage title={Doc.info.title}>
        <SubTitle>Connecting to the server</SubTitle>

        <P>
          Each Aven server provides realtime capability with websockets. You can
          connect to the socket server by connecting a WebSocket client to
          `wss://aven.cloud`
        </P>

        <P>
          Messages in each direction are always JSON-encoded, with a `type`
          specified
        </P>

        <SubTitle>Client ID</SubTitle>
        <P>
          Upon initial connection, the Aven server will send an ID to the client
          with a `clientId` action. This ID will be required to subscribe later.
        </P>
        <P>{"{type: 'clientId', clientId: '12345'}"}</P>

        <SubTitle>Additional Websocket Actions</SubTitle>
        <P>
          In addition to all of the standard Aven actions, the following actions
          are supported on websockets:
        </P>
        <List
          items={[
            <P>docSubscribe</P>,
            <P>docUnsubscribe</P>,
            <P>accountSubscribe</P>,
            <P>accountUnsubscribe</P>,
            <P>clientReset</P>,
          ]}
        />

        <SubTitle>Action Dispatching</SubTitle>
        <P>
          All actions can be dispatched via Websockets for a streamlined
          networking interface. As usual, authenticated actions must include
          `authName`, `authSession` and `authKey`. For shared Aven servers, the
          `domain` must also be provided.
        </P>
        <SubTitle>Doc Subscriptions</SubTitle>
        <P>docSubscribe</P>
        <P>docUnsubscribe</P>
        <P>
          After subscribing, each put to this doc will result in the following
          event to be sent from the server:
        </P>
        <P>{"{clientId: '12345', type: 'docPut', event: {...} }"}</P>
        <SubTitle>Account Subscriptions</SubTitle>
        <P>accountSubscribe</P>
        <P>accountUnsubscribe</P>
      </DocPage>
    );
  }
}
