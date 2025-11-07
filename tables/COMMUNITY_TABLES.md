# Community Tables

Community tables are user-owned tables with **controlled access**. Only the table creator and users who have been granted explicit permission can insert data into these tables, making them ideal for private data storage and scenarios where you need to control who can write to your tables.

## When to use Community Tables

- Private application data
- User management systems
- Controlled datasets
- Internal business data
- Scenarios where you need permission-based access control
- Multi-user applications with role-based data submission

# Example Use Case - User Management System

In this example we'll discuss a generic user management system built on Community tables that stores basic membership information. Only authorized submitters can insert or modify the user data. To create the system, we will create a namespace and a table, then we'll show how authorized submitters would add user records.

In this example we'll create the statements as if we are using the wallet address `0xABC8d709C80262965344f5240Ad123f5cBE51123`

So our namespace will be

`MYAPP_ABC8d709C80262965344f5240Ad123f5cBE51123`

And we'll use the following statements:

```sql
CREATE SCHEMA IF NOT EXISTS MYAPP_ABC8d709C80262965344f5240Ad123f5cBE51123;
CREATE TABLE IF NOT EXISTS MYAPP_ABC8d709C80262965344f5240Ad123f5cBE51123.USERS (
    USER_ID BIGINT NOT NULL,
    USERNAME VARCHAR NOT NULL,
    EMAIL VARCHAR NOT NULL,
    CREATED_AT BIGINT NOT NULL,
    PRIMARY_KEY(USER_ID)
);
```
Which will result in a table like this:

| `USER_ID` (`BIGINT`) | `USERNAME` (`VARCHAR`) | `EMAIL` (`VARCHAR`) | `CREATED_AT` (`BIGINT`) |
| -------------------- | ---------------------- | ------------------- | ----------------------- |
| 1                    | alice                  | alice@example.com   | 1700000000              |
| 2                    | bob                    | bob@example.com     | 1700000100              |
| 3                    | charlie                | charlie@example.com | 1700000200              |

It's worth noting here that the table schema only includes the columns you define. **Unlike PublicPermissionless tables, Community tables do NOT automatically add a `META_SUBMITTER` column.**

## Granting Insert Permissions

By default, only the table creator can insert data. To allow other addresses to insert data, you must explicitly grant them permission using the `permissions.addProxyPermission()` transaction with the `IndexingPallet.SubmitDataForPrivilegedQuorum` permission.

Scripts, examples, and a walkthrough for creating namespaces, tables, and permissioning users can be found in the [Community Tables Tutorial](../tutorials/community_tutorial/COMMUNITY_TABLE_TUTORIAL.md)
