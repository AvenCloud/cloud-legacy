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
