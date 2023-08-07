# ZenStack SaaS Backend Template

SaaS Backend Template using express.js

## Features

-   Multi-tenant
-   Soft delete
-   Sharing by group

## Data Model

In `schema.zmodel,` there are 4 models, and their relationships are as below:
![data model](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/k9ajjn5eh3ekl2qviepg.png)

-   Organization is the top-level tenant. Any instance of User, post, and group belong to an organization.
-   One user could belong to multiple organizations and groups
-   One post belongs to a user and could belong to multiple groups.

## Permissions

Let’s take a look at all the permissions of the Post and how they could be expressed using ZenStack’s access policies.

💡 _You can find the detailed reference of access policies syntax below:
[https://zenstack.dev/docs/reference/zmodel-language#access-policy](https://zenstack.dev/docs/reference/zmodel-language#access-policy)_


-   Create
    
the owner must be set to the current user, and the organization must be set to one that the current user belongs to.
```tsx
@@allow('create', owner == auth() && org.members?[this == auth()])
```
-   Update

    only the owner can update it and is not allowed to change the organization or owner

    ```tsx
    @@allow('update', owner == auth() && org.future().members?[this == auth()] && future().owner == owner)
    ```
-   Read

    -   allow the owner to read
        ```tsx
        @@allow('read', owner == auth())
        ```
    -   allow the member of the organization to read it if it’s public
        ```tsx
        @@allow('read', isPublic && org.members?[this == auth()])
        ```
    -   allow the group members to read it
        ```tsx
        @@allow('read', groups?[users?[id == auth().id]])
        ```
-   Delete

    -   don’t allow delete
        The operation is not allowed by default if no rule is specified for it.
    -   The record is treated as deleted if `isDeleted` is true, aka soft delete.
        ```tsx
        @@deny('all', isDeleted == true)
        ```

You can see the complete data model together with the above access policies defined in the

```tsx
abstract model organizationBaseEntity {
    id String @id @default(uuid())
    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt
    isDeleted Boolean @default(false) @omit
    isPublic Boolean @default(false)
    owner User @relation(fields: [ownerId], references: [id], onDelete: Cascade)
    ownerId String
    org Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)
    orgId String
    groups Group[]

    // when create, owner must be set to current user, and user must be in the organization
    @@allow('create', owner == auth() && org.members?[this == auth()])
    // only the owner can update it and is not allowed to change the owner
    @@allow('update', owner == auth() && org.members?[this == auth()] && future().owner == owner)
    // allow owner to read
    @@allow('read', owner == auth())
    // allow shared group members to read it
    @@allow('read', groups?[users?[this == auth()]])
    // allow organization to access if public
    @@allow('read', isPublic && org.members?[this == auth()])
    // can not be read if deleted
    @@deny('all', isDeleted == true)
}

model Post extends organizationBaseEntity {
    title String
    content String
}
```

### Model Inheritance

You may be curious about why these rules are defined within the abstract `organizationBaseEntity` model rather than the specific **`Post`** model. That’s why I say it is **Scalable**. With ZenStack's model inheritance capability, all common permissions can be conveniently handled within the abstract base model.

Consider the scenario where a newly hired developer needs to add a new **`ToDo`** model. He can effortlessly achieve this by simply extending the `organizationBaseEntity` :

```tsx
model ToDo extends organizationBaseEntity {
    name String
    isCompleted Boolean @default(false)
}
```

All the multi-tenant, soft delete and sharing features will just work automatically. Additionally, if any specialized access control logic is required for **`ToDo`**, such as allowing shared individuals to update it, you can effortlessly add the corresponding policy rule within the **`ToDo`** model without concerns about breaking existing functionality:

```tsx
@@allow('update', groups?[users?[this== auth()]] )
```

## Running

1. Install dependencies

```bash
npm install
```

2. build

```bash
npm run build
```

3. seed data

```bash
npm run seed
```

4. start

```bash
npm run dev
```

## Testing
The seed data is like below:

![data](https://github.com/jiashengguo/my-blog-app/assets/16688722/6dfb2e8c-d1c3-4eec-8022-e03bf2dd42fd)

So in the Prisma team, each user created a post:

-   **Join Discord** is not shared, so it could only be seen by Robin
-   **Join Slack** is shared in the group to which Robin belongs so that it can be seen by both Robin and Bryan.
-   **Follow Twitter** is a public one so that it could be seen by Robin, Bryan, and Gavin

You could simply call the Post endpoint to see the result simulate different users:

```tsx
curl -H "X-USER-ID: robin@prisma.io" localhost:3000/api/post
```

💡 _It uses the plain text of the user id just for test convenience. In the real world, you should use a more secure way to pass IDs like JWT tokens._

Based on the sample data, each user should see a different count of posts from 0 to 3.

### Soft Delete

Since it’s soft delete, the actual operation is to update `isDeleted` to true. Let’s delete the “Join Salck” post of Robin by running below:

```tsx
curl -X PUT \
-H "X-USER-ID: robin@prisma.io" -H "Content-Type: application/json" \
-d '{"data":{ "type":"post", "attributes":{  "isDeleted": true } } }'\
localhost:3000/api/post/slack
```

After that, if you try to access the Post endpoint again, the result won’t contain the “Join Slack” post anymore. If you are interested in how it works under the hook, check out another post for it:

[Soft Delete: Implementation Issues in Prisma and Solution in Zenstack](https://zenstack.dev/blog/soft-delete)
