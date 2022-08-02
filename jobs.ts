import { ImmutableXClient } from '@imtbl/imx-sdk';
import _ from 'underscore';

import { AsyncIndependentJob, AsyncJobSequence, RetryOptions, AsyncJob } from './etl';
import { Wallet } from './models';
import { fetchAndSaveProtoPrice, fetchAndSaveAssets } from './service';


function defaultRetryOptions(): RetryOptions {
    return {
        maxRetries: 5
    };
}


function createFetchPriceJob(
    client: ImmutableXClient,
    proto: number
): AsyncJob {
    return new AsyncIndependentJob(
        _.partial(fetchAndSaveProtoPrice, client, proto),
        defaultRetryOptions()
    );
}


function createFetchProtoRangePriceJob(
    client: ImmutableXClient,
    range: { from: number, to: number }
): AsyncJobSequence {
    const deps: AsyncJob[] = [];

    for (let proto = range.from; proto < range.to; proto++) {
        deps.push(createFetchPriceJob(client, proto));
    }

    return new AsyncJobSequence(deps, defaultRetryOptions());
}


function createFetchAndSaveAssetsJob(
    client: ImmutableXClient,
    wallet: Wallet
) {
    return new AsyncIndependentJob(
        _.partial(fetchAndSaveAssets, client, wallet),
        defaultRetryOptions()
    );
}

export {
    createFetchProtoRangePriceJob,
    createFetchAndSaveAssetsJob
};
