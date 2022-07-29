---
description: Deploying on an other environement
---

# Prerequisite

This graph is for traking People of Crypto Nft sales with primary and secondary market.
event are generated with

```shell
graph codegen
```

in folder:

```
./generated/RaffleSmartContract/RaffleSmartContract.ts
```

# Editable parameters

All editable parameters are located in

```shell
./contractsInfo.<env>.json
```

# Deploy command lines

Deployment must be done with theses command lines.

```shell

#regenerate Params and subgraph.yaml from contractsInfo.<environment name>.json
node ./scripts/generate.js <environment name>
#<environment name> can be mumbai, rinkeby, mainnet ...

#regerate ts events from abis in subgraph.yaml and schema.ts entities from schema.graphql
graph codegen

#rebuild graph
graph build

#authenticate on thegraph space
graph auth --product hosted-service <token id>

#deploy subgraph on its space
graph deploy --product hosted-service <github name>/<repository name>
#For example <github name>/<repository name> can be: pixowl/peopleofcrypto

```
