RedCube
=======

# Technical Structure :

The solution is based on redis, and useing the following separation : 

MAIN -> META (OPTIONS)

Redis Instances (when dealing with a specified datawarehouse) :
- DATAWARE HOUSE (FACTS)
- DIMENSIONS (INDEXES
- CUBES (AGGREGATES)


Each instance could be on a dedicated server, or on the same server 
with a dedicated database number, or on the same server & the same database.

# Data structures :

```
MAIN
 |
 `- GROUPS
 `- USERS
 `- ACL
 `- WAREHOUSES (OPTIONS)
     `- WAREHOUSE INSTANCE
        `- DATAMARTS
           `- FACTS
        `- DIMENSIONS
        `- CUBES
           `- MEASURES
           `- (FACTS REFERENCES)
           `- (DIMENSION REFERENCES)
```

# The Meta Options (and storage notions) :

## Dataware House :

This solution can be used with one or more dataware houses (DWH). Each DWH
is a redis database en you can not make requests accross dataware houses.

The DWH Contains a collection of Datamarts (DM). The DM is just a security option
to avoid users to retrieve restricted data. Each DM contains a collection of 
fact tables.

The DWH also contains a collection of cubes and dimensions (across datamarts), and
also a user management system.

## Facts :

A fact is a plain row based information that contains data (prices for example)
and aggregation axis (categories, dates...)

You must define on each fact the list of dimensions that the fact contains.

## Dimensions :

A dimension is a list of values (that can be referenced by facts) and are used 
in cubes to aggregate measures.

## Measures :

A measure is a raw field into a fact or a formula involving fields into a fact.
The measure is aggregated from each dimension, and the result is stored into a
chunk of cache.

## Users & Privileges :

Each user needs an account in order to connect to a datawarehouse. The account 
option are :

Fact sys.users :

- username (key)
- password (md5 hash)
- created (date)
- updated (date)
- login (date)
- su (boolean) (is the user a super administrator)
- enabled (boolean)
- groups (array)

Fact sys.groups :

- name (key)
- enabled (boolean)
- users (array)

Each notion have a related security object linked to user or group and are stored
into sys.acl_users and sys.acl_groups. Security options are :

- write (boolean)
- read (boolean)
- config (boolean)
(and extra depending on object type)

Example with a datamart : 

Datamart : sales
User : john can read and bob can import, and configure

```
Records :
sys.acl_users.dm.sales.* = false; // do not inherit from parent 
sys.acl_users.dm.sales.john = { read: true }
sys.acl_users.dm.sales.bob = { read: true, write: true, config: true }
```

# Caching technique

## Low Memory Usage :

Each dimension entry has a numeric auto-increment key associated with his value.
The fact entries contains dimensions keys (and not their contents).

## Efficient drill down :

To improve lookups, each dimension contains all keys on each fact entry :

```
Lets say you have the following fact :

sales.events :
#; Region; Amount
1; A; 10
2; B; 20
3; C; 25
4; B; 22

So the dimensions will be :

$region = {
  A : 1, B : 2, C : 3
}

And their lookup :

$region.sales.events.region:1 = [1];    // A (first line)
$region.sales.events.region:2 = [2, 4]; // B (...)
$region.sales.events.region:3 = [3];    // C

```

## Measures & Cubes :

The predicate of each cube are calculates on the fly when the data is requested.

The cache is build on a basis of tuples chunks, and use union on dimensions 
lookups and map reduce algorithms on facts.

Example :

```

We have the following fact sales.events :
#; Country, Region; Amount; 
1; US, A; 10
2; US, B; 20
3; FR, C; 25
4; US, B; 22

$country = { US: 1, FR: 2 }
$region = { A : 1, B : 2, C : 3 }

$region.sales.events.region:1 = [1];    // A (first line)
$region.sales.events.region:2 = [2, 4]; // B (...)
$region.sales.events.region:3 = [3];    // C
$region.sales.events.country:1 = [1,2,4];
$region.sales.events.country:2 = [3];

Our cube 'sales' contains the measure : sum(amount)

The request is get the measure for country US :

So if the chunk with all filtering measures does not exists, we check
an intersection of the dimensions that are in filters : 

$region.sales.events.country:1

Then we execute the request on the fact.

%sales.country:1 = {
  sum(amount) : 52
};

```

NB : using pre-agregated items we could resolve functions like (min, max, sum)
without using the fact