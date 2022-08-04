# immutable-x-snippets

## Goals of the project

The project provides some analytic features for assets on Immutable. Main reference is TokenTrove. There are features unavailable on TokenTrove yet. For example: tracking overall assets value history.

## Restrictions

All commands are supposed to work for Gods Unchained assets of Meteorite quality. Other collections on Immutable are not touched. Although this code may be a starting point for working with other collections.

## Add wallet

In order to start work you have to add Eth wallet to tracking. This could be done by command:

```
node dist/cli.js <wallet>
```

## Fetch assets

Following command iterates by tracked wallets and fetches assets for those wallets. You may pass specific wallet as an argument.
```
node dist/cli.js fetch-assets [wallet]
```

## Fetch prices

Following command accepts proto range as parameter and fetches current prices for assets of this range.

```
node dist/cli.js fetch-prices --from <proto> --to <proto>
```

## Further plans

It is possible to calculate total assets value based on current market prices. You can compare this number and collection value on tokentrove.com.
These numbers must be close to each other. Although numbers do not match exactly. Tokentrove implemented a bit different approach for calculating value. They use last sale price.
