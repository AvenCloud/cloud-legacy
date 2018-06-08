
# Document Versions

Each document will automatically preserve a history of each version that gets put.

## Get Document History

To query previous versions of a document:

```
DocGetHistory
    AuthAccount: Sam
    AuthSession: ...
    AuthDomain: mydomain
    Owner: sam
    ID: my-todo-doc
```

Any account with read access to the document will be able to see the history as well.

The returned history will contain many entries in the following format:

```
{
VersionID: checksum of doc
PutTime: timestamp
Writer: accountID
ID
Owner
LastVersion: checksum of the previous version. Null if this is the initial version of a doc
}
```

Get an old version of a document with the DocGet action, providing the version string:

```
GetDoc
    AuthAccount: Sam
    AuthSession: ...
    AuthDomain: mydomain
    Owner: sam
    ID: my-todo-doc
    Version
```


## Truncated Version History

If the version history is too long, it may be truncated. To determine the full history, you can call GetDocHistory and provide a version string. This will show the history of that particular version

## Version Transactions

To make sure that new versions of a document do not clobber other changes, provide a `lastVersion` string on DocPut. If the lastVersion specified is not the same as the current version of the document, the put will fail. This ensures that a client has seen all of the most recent changes to a document before it writes. If the lastVersion is specified as null, then the put will only succeed if the document does not already exist.

## Destroying Previous Versions

To put a document and squash the previous version, and to avoid adding to the document’s history, specify destroyLastVersion: true. This is the equivalent of destroying a document and then re-putting it with ‘lastVersion: null`

## Destroying old versions

When a document is destroyed, all previous versions of it are also cleared from the database

Old versions of a document can be destroyed by providing a version string to the destroy action. The versions will still be visible in history, but this can be used to reclaim the storage space of old versions.