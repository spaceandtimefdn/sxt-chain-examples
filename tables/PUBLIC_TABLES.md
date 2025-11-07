# Public/Permissionless Tables

PublicPermissionless tables allow anyone to insert data without requiring explicit permissions. The system automatically tracks who submitted each row using a `META_SUBMITTER` column, allowing for analytics.

## When to use PublicPermissionless Tables

- Open data collection (surveys, feedback, reports)
- Crowdsourced datasets
- Public registries and directories
- Community-driven data contributions
- Scenarios where you want open participation with accountability

# Example Use Case - Poll System

In this example we'll discuss a Poll System built on PublicPermissionless tables that allows users to vote on which movie will be the leader in box office earnings each week. To create the system, we will create a namespace and a table, then we'll show how users would 'vote' on the poll by inserting data into the table.

In this example we'll create the statements as if we are using the wallet address `0xABC8d709C80262965344f5240Ad123f5cBE51123`

So our namespace will be 

`MOVIES_ABC8d709C80262965344f5240Ad123f5cBE51123`

And we'll use the following statements:

```sql
CREATE SCHEMA IF NOT EXISTS MOVIES_ABC8d709C80262965344f5240Ad123f5cBE51123;
CREATE TABLE IF NOT EXISTS MOVIES_ABC8d709C80262965344f5240Ad123f5cBE51123.VOTES (
    MOVIE VARCHAR NOT NULL,
    WEEK BIGINT NOT NULL,
    PRIMARY_KEY(MOVIE, WEEK)
);
```
Which will, after being modified by the chain, result in a table like this;

| `MOVIE` (`VARCHAR`) | `WEEK` (`BIGINT`) | `META_SUBMITTER` (`BINARY`) |
|---------------------|-------------------| --------------------------- |
| Movie A             | 2                 | 0x000...user1address       |
| Movie A             | 2                 | 0x000...user2address       |
| Movie B             | 2                 | 0x000...user3address       |

It's worth noting here that the table schema and the data submitted **should not include** the `META_SUBMITTER` column.

You can follow along in the [PublicPermission Tables Tutorial](../tutorials/public_tutorial/PUBLIC_PERMISSIONLESS_TUTORIAL.md)
