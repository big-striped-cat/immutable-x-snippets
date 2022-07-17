import { ETHTokenType, ImmutableMethodParams, ImmutableOrderStatus, ImmutableTransactionStatus, ImmutableXClient, valueOrThrow } from '@imtbl/imx-sdk';
import fs from 'fs';
import Web3 from 'web3-utils';
import _ from 'underscore';
import moment from 'moment';
import * as db from './db';
import { ProtoPrice, Asset } from './models';

import { logger } from './logger';


const apiAddress = 'https://api.x.immutable.com/v1';
 
const GUCollectionAddress = '0xacb3c6a43d15b907e8433077b6d38ae40936fe2c';

const ERC20TokenAddress = {
    GODS: '0xccc8cb5229b0ac8069c51fd58367fd1e622afd97',
    IMX: '0xf57e7e7c23978c3caec3c3548e3d615c346e79ff'
}


function weiToEth(value: bigint): string {
    return Web3.fromWei(value.toString());
}


function weiToGwei(value: bigint): bigint {
    return value / BigInt(10) ** BigInt(9);
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

async function clearAssets(
    date: string,
    wallet: string
) {    
    await Asset.destroy({
        where: {
            date: date,
            wallet: wallet,
        }
    });
}


async function saveAssets(
    assetsUniq: AssetsUniq,
    date: string,
    wallet: string
) {
    let values: any[] = [];

    for (let [[proto, _], assets] of assetsUniq) {
        values.push({
            date: date,
            wallet: wallet,
            proto: proto,
            quantity: assets.length,
        });
    }

    await Asset.bulkCreate(values);
}


async function fetchAndSaveAssets(client: ImmutableXClient, wallet: string) {
    const assets = await fetchAssets(
        client, {
            collection: GUCollectionAddress,
            user: wallet
        }
    );
    const assetsUniq = new AssetsUniq(assets);
    const dateStr = moment().format('YYYY-MM-DD');

    db.transaction(async (wallet) => {
        await clearAssets(dateStr, wallet);
        await saveAssets(assetsUniq, dateStr, wallet);
    }, [wallet]);
}


class AssetsUniq {
    // AssetsUniq class simulates Map<[number, string], any[]>
    // Maps keyed by arrays do not work as expected.

    private _assets: Map<string, any[]>

    constructor (assets: any[]) {
        this._assets = new Map();

        for (let asset of assets) {
            const key = this._makeKey(asset.metadata.proto, asset.metadata.quality);
    
            if (!this._assets.get(key)) {
                this._assets.set(key, []);
            }
            this._assets.get(key)?.push(asset);
        }
    }

    _makeKey(proto: number, quality: string): string {
        return `${proto}_${quality}`;
    }

    get(proto: number, quality?: string): any[] {
        quality = quality || 'Meteorite';
        return this._assets.get(this._makeKey(proto, quality)) || [];
    }

    *[Symbol.iterator]() {
        for (let [key, value] of this._assets) {
            let [proto, quality] = key.split('_');
            yield [[proto, quality], value];
        }
    }
}


async function getBestSellOrder(client: ImmutableXClient, asset) {
    const metadata = JSON.stringify({
        proto: [`${asset.metadata.proto}`],    // sic! Array must consist of strings
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
        logger.warn('no sell orders');
        return BigInt(0);
    }

    // Also api returns quantity_with_fees property in Decimal format
    // But this property is missing in type definitions
    return order.buy.data.quantity.toBigInt();
}


async function fetchAndSaveProtoPrice(
    client: ImmutableXClient, 
    proto: number
): Promise<{
    proto: number, 
    price?: BigInt
}> {
    logger.info(`fetch price for proto ${proto}`);

    const price = await calcAssetPrice(client, {
        metadata: {
            proto: proto,
            quality: 'Meteorite'
        }
    });

    const dateStr = moment().format('YYYY-MM-DD');
    const priceGwei = weiToGwei(price);

    db.transaction(async () => {
        await ProtoPrice.destroy({
            where: {
                date: dateStr,
                proto: proto,
            }
        })
        await ProtoPrice.create({
            date: dateStr,
            proto: proto,
            price: priceGwei,
        });
    }, []);

    
    return {
        proto: proto,
        price: price
    };
}


export {
    createImmutableXClient,
    fetchAndSaveProtoPrice,
    fetchAndSaveAssets
};
