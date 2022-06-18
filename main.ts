import { ETHTokenType, ImmutableMethodParams, ImmutableOrderStatus, ImmutableXClient } from '@imtbl/imx-sdk';
import fs from 'fs';
import Web3 from 'web3';

const linkAddress = 'https://link.x.immutable.com';
const apiAddress = 'https://api.x.immutable.com/v1';

// Ropsten Testnet
//const linkAddress = 'https://link.ropsten.x.immutable.com';
//const apiAddress = 'https://api.ropsten.x.immutable.com/v1';


// Link SDK, in browser only
// const link = new Link(linkAddress);

// IMX Client

// const client = (async () => {
//     return await ImmutableXClient.build({ publicApiUrl: apiAddress });
// })();


const GUCollectionAddress = '0xacb3c6a43d15b907e8433077b6d38ae40936fe2c';

const ERC20TokenAddress = {
  GODS: '0xccc8cb5229b0ac8069c51fd58367fd1e622afd97',
  IMX: '0xf57e7e7c23978c3caec3c3548e3d615c346e79ff'
}

const myAddress = process.env.MY_WALLET_ADDRESS;
console.log('myAddress ' + myAddress);


function weiToEth(value: BigInt): string {
  return Web3.utils.fromWei(value.toString());
}


async function fetchAssets(client: ImmutableXClient, options: object): Promise<any[]> {
  let assetCursor
  let assets: any[] = []
  do {
    let assetRequest = await client.getAssets({ ...options, cursor: assetCursor })
    assets = assets.concat(assetRequest.result)
    assetCursor = assetRequest.cursor
  } while (assetCursor)

  return assets;
}


function saveAssets(assets: any[], path: string) {
  try {
    fs.writeFileSync(path, JSON.stringify(assets, null, ' '));
  } catch (err) {
    console.error(err);
  }
}


function loadAssetsFromFile(path: string) {
  return JSON.parse(fs.readFileSync(path).toString());
}


async function fetchAndSaveAssets(client: ImmutableXClient, user: string) {
  const assets = await fetchAssets(
    client, {
      collection: GUCollectionAddress,
      user: user
    }
  );
  saveAssets(assets, 'assets.json');
}


function groupAssetsByProtoQuality(assets) {
  const assetsUniq = {};
  for (let asset of assets) {
    const key = `${asset.metadata.proto}_${asset.metadata.quality}`;
    if (!assetsUniq[key]) {
      assetsUniq[key] = [];
    }
    assetsUniq[key].push(asset);
  }
  return assetsUniq;
}


async function calcAssetsTotalValue(assets: Array<any>) {
  console.log(`total assets: ${assets.length}`)
  
  const assetsUniq = groupAssetsByProtoQuality(assets);

  console.log(`total uniq assets: ${Object.keys(assetsUniq).length}`)

  const client = await ImmutableXClient.build({ publicApiUrl: apiAddress });

  let value = BigInt(0);

  for (let key in assetsUniq) {
    let asset = assetsUniq[key][0];
    let assetsNumber = assetsUniq[key].length;

    console.log(`Calculating asset price for ${asset.metadata.name}, quality=${asset.metadata.quality}, number=${assetsNumber}`);
    let assetPrice = await calcAssetPrice(client, asset);
    
    console.log(`Asset price: ${weiToEth(assetPrice)} Eth`);

    value += BigInt(assetsNumber) * assetPrice;
  }
  return value;
}


async function getBestBuyOrder(client: ImmutableXClient, asset) {
  const metadata = JSON.stringify({
    proto: [`${asset.metadata.proto}`],  // sic! Array must consist of strings
    quality: [asset.metadata.quality]
  });

  let params = {
    status: ImmutableOrderStatus.active,
    sell_token_address: GUCollectionAddress,
    sell_metadata: metadata,
    buy_token_address: '',
    buy_token_type: ETHTokenType.ETH,
    order_by: 'buy_quantity',
    direction: ImmutableMethodParams.ImmutableSortOrder.asc,
    page_size: 1
  };
  
  const ordersRequest = await client.getOrders(params)
  return ordersRequest.result[0];
}



async function calcAssetPrice(client: ImmutableXClient, asset): Promise<bigint> {
  const order = await getBestBuyOrder(client, asset);

  // Also api returns quantity_with_fees property in Decimal format
  // But this property is missing in type definitions
  return order.buy.data.quantity.toBigInt();
}


async function getAssetsByName(client: ImmutableXClient, name:string) {
  // Search by asset name works not by exact match, but as full-text search
  // Try 'Tavern Brawler' for example.
  // Use filtering by proto to get exact match

  const assetRequest = await client.getAssets({
    collection: GUCollectionAddress,
    name: name
  });

  return assetRequest.result;
}


async function main() {
  const client = await ImmutableXClient.build({ publicApiUrl: apiAddress });

  // fetchAndSaveAssets(client, myAddress);

  console.log('loading assets from file');
  const assets = loadAssetsFromFile('assets.json');

  console.log('getting assets value');
  const value = await calcAssetsTotalValue(assets);

  console.log(`Assets total value ${weiToEth(value)} Eth`);
}


main().catch(e => console.log(e));
