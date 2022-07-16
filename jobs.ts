import { ImmutableXClient } from '@imtbl/imx-sdk';
import _ from 'underscore';

import { AsyncIndependentJob, AsyncJobSequence, RetryOptions, AsyncJob } from './etl';
import { fetchProtoPrice, fetchAndSaveAssets } from './service';


function defaultRetryOptions(): RetryOptions {
    return {
        maxRetries: 5
    };
}


function createFetchProtoPriceJob(
    client: ImmutableXClient,
    proto: number
): AsyncJob {
    return new AsyncIndependentJob(
        _.partial(fetchProtoPrice, client, proto),
        defaultRetryOptions()
    );
}


function createFetchProtoRangePriceJob(
    client: ImmutableXClient,
    range: { from: number, to: number }
): AsyncJobSequence {
    const deps: AsyncJob[] = [];

    for (let proto = range.from; proto < range.to; proto++) {
        deps.push(createFetchProtoPriceJob(client, proto));
    }

    return new AsyncJobSequence(deps, defaultRetryOptions());
}


function createFetchAndSaveAssetsJob(
    client: ImmutableXClient,
    wallet: string
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
