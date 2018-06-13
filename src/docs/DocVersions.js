import { DocPage, P, SubTitle, ExampleAction } from './components';
import React from 'react';

export default class Doc extends React.Component {
  static info = {
    routeName: 'DocVersions',
    title: 'Doc Versions',
  };
  render() {
    return (
      <DocPage title={Doc.info.title}>
        <SubTitle>Document versions</SubTitle>
        <P>
          Each document will automatically preserve a history of each version
          that gets updated with `putDoc`.
        </P>
        <ExampleAction
          action={{ type: 'getDocHistory', docId: 'todos' }}
          response={{
            updates: [
              { versionId: 'baskjdfnasdj', writer: 'jane', putTime: 1111 },
              { versionId: '2enaskjjakle', writer: 'jane', putTime: 1234 },
            ],
          }}
          authentication="jane"
        />
        <SubTitle>Get Older Versions</SubTitle>
        <P>
          You can retrieve an old version of a document with the DocGet action,
          providing the `versionId`:
        </P>
        <ExampleAction
          action={{ type: 'getDoc', docId: 'todos', versionId: 'baskjdfnasdj' }}
          response={{
            thisData: 'is old data',
          }}
          authentication="jane"
        />

        <SubTitle>Truncated Version History</SubTitle>
        <P>
          If the version history is too long, it may be truncated. To determine
          the full history, you can call GetDocHistory and provide a version
          string. This will show the history of that particular version
        </P>
        <SubTitle>Version Transactions</SubTitle>
        <P>
          To make sure that new versions of a document do not clobber other
          changes, provide a `lastVersion` string on DocPut. If the lastVersion
          specified is not the same as the current version of the document, the
          put will fail. This ensures that a client has seen all of the most
          recent changes to a document before it writes. If the lastVersion is
          specified as null, then the put will only succeed if the document does
          not already exist.
        </P>
        <SubTitle>Destroying Previous Versions</SubTitle>
        <P>
          To put a document and squash the previous version, and to avoid adding
          to the document’s history, specify destroyLastVersion: true. This is
          the equivalent of destroying a document and then re-putting it with
          ‘lastVersion: null`
        </P>
        <SubTitle>Destroying old versions</SubTitle>
        <P>
          When a document is destroyed, all previous versions of it are also
          cleared from the database
        </P>
        <P>
          Old versions of a document can be destroyed by providing a version
          string to the destroy action. The versions will still be visible in
          history, but this can be used to reclaim the storage space of old
          versions.
        </P>
      </DocPage>
    );
  }
}
