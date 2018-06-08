
# Doc Permission and Privacy


## Public Document Access

By default, all docs are private, and can only be read by the user who owns them. If Sam wants to let anyone read the doc, they can provide the optional “public” flag while putting the document. If a document is PUT without actual “doc” data, the “public” flag may still be sent, to toggle a doc between public and private ownership.

```
PutDoc

    AuthAccount: Sam
    AuthSession: ...
    AuthDomain: mydomain
    Owner: sam
    ID: my-todo-doc
    Public: true
```

At this point, the doc is publicly readable by anybody. To make it private again, Sam can send a put action with public=false


## Permissions for non-owners

Documents can be configured to be read and written by a non-owner. When the owner sends a PUT action, they can include a list of permissions. If the permissions list is provided, it will overwrite all existing permissions (and the default list of permissions is empty).

Each permission entry contains:

    user: eg Jacob
    Allow: ‘read’ or ‘write’


```
PutDoc
    AuthAccount: Sam
    AuthSession: ...
    AuthDomain: mydomain
    Owner: Sam
    ID: my-todo-doc
    Public: false
    Permissions: [ { account: “Jacob”, allow: “write” } ]
```


Now, Jacob is allowed to read and write to the doc:

```
PutDoc
    AuthAccount: Jacob
    AuthSession: ...
    AuthDomain: mydomain
    Owner: Sam
    ID: my-todo-doc
```