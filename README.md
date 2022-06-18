# immutable-x-snippets
Snippets for working with Immutable X API

See `main.ts`.

All functions are supposed to work for Gods Unchained assets. Other collections on Immutable are not touched. Although this code may be a starting point for working with other collections.

Function `fetchAndSaveAssets` fetches all user assets and saves assets to assets.json file. Images are not fetched, data only.

Function `calcAssetsTotalValue` accepts assets array as parameter and calculates total assets value based on current market prices. You can compare this number and collection value on tokentrove.com.
These numbers must be close to each other. Although numbers do not match exactly. Tokentrove implemented a bit different approach for calculating value. They use last sale price.
