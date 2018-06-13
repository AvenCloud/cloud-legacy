import { DocPage, P, SubTitle, ExampleAction, List } from './components';
import React from 'react';

export default class Doc extends React.Component {
  static info = {
    routeName: 'Permissions',
    title: 'Doc Permission and Privacy',
  };
  render() {
    return (
      <DocPage title={Doc.info.title}>
        <SubTitle>Default Doc Privacy</SubTitle>
        <P>
          All uploaded docs are private by default. Each doc can only be read by
          the account as specified by the owner field.
        </P>
        <SubTitle>Public Docs</SubTitle>
        <P>
          The `isPublic` flag may be provided when a document is initially
          uploaded. This enables anybody to read the doc, without requiring
          authentication.
        </P>
        <ExampleAction
          action={{
            type: 'putDoc',
            doc: { todos: [] },
            owner: 'jane',
            docId: 'todos',
            isPublic: true,
          }}
          response={{ docId: 'todos', isPublic: true }}
          authentication="jane"
        />
        <P>
          The `isPublic` field of existing docs may also be modified using the
          `putDoc` action:
        </P>
        <ExampleAction
          action={{
            type: 'putDoc',
            owner: 'jane',
            docId: 'todos',
            isPublic: false,
          }}
          response={{ docId: 'todos', isPublic: false }}
          authentication="jane"
        />
        <P>Now this example `todos` doc is not available for public reading</P>
        <SubTitle>Granting permissions to authenticated users</SubTitle>
        <P>
          Documents can be configured to be read and written by a non-owner.
          When the owner sends a `putDoc` action, they can include a list of
          permissions. If the permissions list is provided, it will overwrite
          all existing permissions. By default, a document will have no
          permissions.
        </P>
        <P>
          Each permission entry must contain an `account`, referring to the
          `authName` of a user. Each entry must also define a `role`:
        </P>
        <List
          items={[
            <P>`read` - This account will be allowed to read this doc</P>,
            <P>
              `write` - This account will be allowed to replace the data of this
              doc
            </P>,
            <P>
              `admin` - This account will be allowed to change `isPublic` and
              `permissions` of the doc
            </P>,
            // todo.. support permissions for versioning and doc deletion?
          ]}
        />
        <P>
          In this example, `jane` already owns the `todo` doc, and she is
          granting write access to `jack`'s account:
        </P>
        <ExampleAction
          action={{
            type: 'putDoc',
            owner: 'jane',
            docId: 'todos',
            permissions: [{ account: 'jack', role: 'write' }],
          }}
          response={{ docId: 'todos', isPublic: false, permissions: [] }}
          authentication="jane"
        />
        <P>Now, `jack` is allowed to read and write to the `todo` doc.</P>
      </DocPage>
    );
  }
}
