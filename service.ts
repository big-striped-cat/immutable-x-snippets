import { ETHTokenType, ImmutableMethodParams, ImmutableOrderStatus, ImmutableTransactionStatus, ImmutableXClient } from '@imtbl/imx-sdk';
import fs from 'fs';
import Web3 from 'web3-utils';
import _ from 'underscore';
import moment from 'moment';
import { Client as PGClient } from 'pg';

import { AsyncIndependentJob, AsyncChordJob, RetryOptions, AsyncJob } from './etl';


const apiAddress = 'https://api.x.immutable.com/v1';
 
const GUCollectionAddress = '0xacb3c6a43d15b907e8433077b6d38ae40936fe2c';

const ERC20TokenAddress = {
  GODS: '0xccc8cb5229b0ac8069c51fd58367fd1e622afd97',
  IMX: '0xf57e7e7c23978c3caec3c3548e3d615c346e79ff'
}

const myAddress = process.env.MY_WALLET_ADDRESS;
console.log('myAddress ' + myAddress);


function weiToEth(value: BigInt): string {
  return Web3.fromWei(value.toString());
}


async function createImmutableXClient(): Promise<ImmutableXClient> {
  return await ImmutableXClient.build({ publicApiUrl: apiAddress });
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


async function getBestSellOrder(client: ImmutableXClient, asset) {
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
  // There is no buy-limit orders on Tokentrove
  // Use best sell price as "market" price
  const order = await getBestSellOrder(client, asset);

  if (!order) {
    console.warn('no sell orders');
    return BigInt(0);
  }

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


async function loadAssetsFromFileAndCalcValue(client: ImmutableXClient) {
  // You can run once to fetch assets:
  // fetchAndSaveAssets(client, myAddress);
  // And use 'assets.json' then.

  console.log('loading assets from file');
  const assets = loadAssetsFromFile('assets.json');

  console.log('getting assets value');
  const value = await calcAssetsTotalValue(assets);

  console.log(`Assets total value ${weiToEth(value)} Eth`);
}


async function fetchTrades(client: ImmutableXClient, options) {
  // About 1k trades per hour for Gods Unchained
  // 
  // Example trade
  // {
  //   "transaction_id": 81718923,
  //   "status": "success",
  //   "a": {
  //     "order_id": 202884374,
  //     "token_type": "ETH",
  //     "sold": "961000000000000"
  //   },
  //   "b": {
  //     "order_id": 197261661,
  //     "token_type": "ERC721",
  //     "token_id": "54575984",
  //     "token_address": "0xacb3c6a43d15b907e8433077b6d38ae40936fe2c",
  //     "sold": "1"
  //   },
  //   "timestamp": "2022-05-27T00:10:17.476Z"
  // }

  let tradeCursor;
  let trades: any[] = [];
  let pageNum = 1;  

  do {
    console.debug('requesting page ', pageNum);

    let tradeRequest = await client.getTrades({
      ...options,
      status: ImmutableTransactionStatus.success,
      party_a_token_type: ETHTokenType.ETH,
      party_b_token_address: GUCollectionAddress,

      cursor: tradeCursor
    });
    trades = trades.concat(tradeRequest.result)
    tradeCursor = tradeRequest.cursor
    pageNum++;

    console.debug(`${tradeRequest.result.length} items on page`);
  } while (tradeCursor)
  
  // console.log('Trades:');
  // console.log(JSON.stringify(trades, null, '  '));
  return trades;
}


async function fetchTradesExample(client: ImmutableXClient) {
  // about 1k trades per hour for Gods Unchained
  const params = {
    min_timestamp: "2022-05-27T00:00:00Z",
    max_timestamp: "2022-05-27T01:00:00Z"
  };
  const trades = await fetchTrades(client, params);
  console.log('total trades: ', trades.length);
}



async function fetchProtoPrice(
  client: ImmutableXClient, 
  proto: number
): Promise<{
  proto: number, 
  price?: BigInt
}> {
  console.log(`fetch price for proto ${proto}`);

  const price = await calcAssetPrice(client, {
    metadata: {
      proto: proto,
      quality: 'Meteorite'
    }
  });

  return {
    proto: proto,
    price: price
  };
}


function defaultRetryOptions(): RetryOptions {
  return {
    maxRetries: 5
  };
}


function createFetchProtoPriceJob (
  client: ImmutableXClient, 
  proto: number
): AsyncJob {
  return new AsyncIndependentJob(
    _.partial(fetchProtoPrice, client, proto), 
    defaultRetryOptions()
  );
}


type ProtoPriceResult = {
  price: BigInt, 
  proto: number
};


async function reduceProtoPriceResults(results: ProtoPriceResult[]) {
  const pricesObj = _.reduce(
    results, 
    function(memo, item) {
      memo[item.proto] = item.price.toString(); 
      return memo;
    },
    {}
  );

  const dateStr = moment().format('YYYY-MM-DD');
  const pricesJson = JSON.stringify(pricesObj, null, '');

  const client = new PGClient();
  await client.connect();

  const query = 'INSERT INTO price(date, values) VALUES ' + 
    `('${dateStr}', '${pricesJson}') ` +
    `ON CONFLICT (date) DO UPDATE SET values = price.values || '${pricesJson}'::jsonb`;
  console.debug(query);

  try {
    const res = await client.query(
      query
    );
  } catch (err: any) {
    console.log(err.stack);
  }

  await client.end();
}


function createFetchProtoRangePriceJob(
  client: ImmutableXClient, 
  range: {from: number, to: number}
): AsyncChordJob {
  const deps: AsyncJob[] = []; 

  for (let proto=range.from; proto < range.to; proto++) {
    deps.push(createFetchProtoPriceJob(client, proto));
  }

  return new AsyncChordJob(reduceProtoPriceResults, deps, defaultRetryOptions());
}


export {
  createImmutableXClient,
  createFetchProtoRangePriceJob
};
