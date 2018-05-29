Getting Started

Step 1 - Set up Aven Cloud Server

To get started, you can sign up to the aven.cloud service, or you can launch an open source server.

Option A (Easiest) - Join aven.cloud here: https://aven.cloud/join

Option B (Easy) - Run standalone cloud server `npx aven-cloud-server`

Option C (Also Easy) - Install local express server

```
Bpm I —save aven-cloud-server
SetupServer(app)
```

Step 2 - Users can create an Account and Log In

Step 3 - Read and write documents

Step 4 - Learn about advanced features

Read about document permissions and versioning.




Dispatching Actions

Actions can be sent to the server with a JSON-encoded POST request to https://aven.cloud/api


Authentication
There are several actions used to authenticate and verify the identity of an account.

All Actions
Here’s a list of all actions.

Authenticated actions are those which require a session. This is provided as `AuthAccount` `AuthSession` and `AuthDomain`


Working with Docs

Basic Doc Uploading

Each doc is scoped to a particular domain and “Owner” account.

For example, an account named “Sam” will be able to put a doc:

PutDoc

    AuthAccount: Sam
    AuthSession: ...
    AuthDomain: mydomain
    Owner: Sam
    ID: my-todo-doc
    Doc: {...document JSON}



At which point, she can retrieve the doc with GetDoc:


GetDoc

    AuthAccount: Sam
    AuthSession: ...
    AuthDomain: mydomain
    Owner: sam
    ID: my-todo-doc



Raw Document Access

It is sometimes convenient to access the raw document via a URL. The URL format is https://aven.cloud/doc/mydomain/Owner/DocID.format

Sam’s todo doc is available at the following URL:

Https://aven.cloud/doc/mydomain/sam/my-todo-doc.json

The extension will define the content-type of the data that the server will send. If it is an image, use an image extension. Unrecognized formats will be treated as a download request, so that arbitrary documents may be uploaded, and this raw link may be provided to download. To force a download, provide a ‘?download=1’ query

For non-public documents, an AuthAccount and AuthSession cookie must be provided to authenticate document access.

Raw Document Put

There should be an API to publish binary files like images. This should support direct uploading from browsers.

Listing docs

An owner can query for a list of docs that they own


User Accounts and Authentication


Authentication Tokens

To login, create an account, or reset your password, you will need an authentication token. The first step is to request a partial token.

Depending on the authentication method, the format of the token may vary.

AuthRequest

    Account
    Method: EmailAuth | TestEmailLoggingAuth | OAuth


This will return an incomplete authentication token. The “code” should be collected from the user or via the OAuth callback URL. The complete authentication token is:

{...authRequest, code: ‘asdf’ }


Creating a user account

AccountCreate

    Account: sam
    Password: ...
    Verification: [ {...AuthToken} ]


Once an account is created, there is a new “password” auth token that can be used, with the following format: {type: ‘password’, password: ‘abc123’ }

Logging in

SessionCreate

    Account: sam
    AuthToken


This will return a session string that can be used for the authenticated actions

Logging out

SessionDestroy

    Account: sam
    Session: session-id


Setting Authentication Methods

For users who are already logged in, additional forms of authentication can be added with the following action. This can also be used to change or reset a password. The type of the new authentication method is provided, and it will wipe out any existing authentication methods of that type.

AccountSetAuth

    AuthAccount
    AuthToken
    Method
    NewAuthToken


The NewAuthToken may be null if the user intends to remove an authentication method. If there is only one remaining authentication method, it cannot be set to null.


Configuring App Authentication

The app can be configured to provide several authentication methods.

    TestEmailLoggingAuth (for use in development only)
    EmailAuth
    OAuth


Destroying an Account

A user account can be destroyed by providing an AuthToken and the account ID

AccountDestroy

    AuthAccount
    AuthToken


When an account is destroyed, all docs Owned by the user will also be destroyed

Doc Permission and Privacy


Public Document Access

By default, all docs are private, and can only be read by the user who owns them. If Sam wants to let anyone read the doc, they can provide the optional “public” flag while putting the document. If a document is PUT without actual “doc” data, the “public” flag may still be sent, to toggle a doc between public and private ownership.


PutDoc

    AuthAccount: Sam
    AuthSession: ...
    AuthDomain: mydomain
    Owner: sam
    ID: my-todo-doc
    Public: true


At this point, the doc is publicly readable by anybody. To make it private again, Sam can send a put action with public=false


Document Permissions for other users

Documents can be configured to be read and written by a non-owner. When the owner sends a PUT action, they can include a list of permissions. If the permissions list is provided, it will overwrite all existing permissions (and the default list of permissions is empty).

Each permission entry contains:

    user: eg Jacob
    Allow: ‘read’ or ‘write’


PutDoc

    AuthAccount: Sam
    AuthSession: ...
    AuthDomain: mydomain
    Owner: Sam
    ID: my-todo-doc
    Public: false
    Permissions: [ { account: “Jacob”, allow: “write” } ]



Now, Jacob is allowed to read and write to the doc:

PutDoc

    AuthAccount: Jacob
    AuthSession: ...
    AuthDomain: mydomain
    Owner: Sam
    ID: my-todo-doc




Document Versions

Each document will automatically preserve a history of each version that gets put.

Get Document History

To query previous versions of a document:

DocGetHistory

    AuthAccount: Sam
    AuthSession: ...
    AuthDomain: mydomain
    Owner: sam
    ID: my-todo-doc


Any account with read access to the document will be able to see the history as well.

The returned history will contain many entries in the following format:

{
VersionID: checksum of doc
PutTime: timestamp
Writer: accountID
ID
Owner
LastVersion: checksum of the previous version. Null if this is the initial version of a doc
}

Get an old version of a document with the DocGet action, providing the version string:

GetDoc

    AuthAccount: Sam
    AuthSession: ...
    AuthDomain: mydomain
    Owner: sam
    ID: my-todo-doc
    Version



Truncated Version History

If the version history is too long, it may be truncated. To determine the full history, you can call GetDocHistory and provide a version string. This will show the history of that particular version

Version Transactions

To make sure that new versions of a document do not clobber other changes, provide a `lastVersion` string on DocPut. If the lastVersion specified is not the same as the current version of the document, the put will fail. This ensures that a client has seen all of the most recent changes to a document before it writes. If the lastVersion is specified as null, then the put will only succeed if the document does not already exist.

Destroying Previous Versions

To put a document and squash the previous version, and to avoid adding to the document’s history, specify destroyLastVersion: true. This is the equivalent of destroying a document and then re-putting it with ‘lastVersion: null`

Destroying old versions

When a document is destroyed, all previous versions of it are also cleared from the database

Old versions of a document can be destroyed by providing a version string to the destroy action. The versions will still be visible in history, but this can be used to reclaim the storage space of old versions.