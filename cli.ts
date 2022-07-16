import { Command } from 'commander';

import { createImmutableXClient } from './service';
import { createFetchAndSaveAssetsJob, createFetchProtoRangePriceJob } from './jobs';

import { logger } from './logger';


const program = new Command();

program.command('fetch-prices')
    .option('--from <number>', 'proto range start', (value) => parseInt(value, 10))
    .option('--to <number>', 'proto range (semi-interval) end', (value) => parseInt(value, 10))
    .action(async (options) => {
        logger.debug('options');
        logger.debug(JSON.stringify(options, null, '  '));

        const protoMax = 1800;

        const from = options.from || 1;
        const to = options.to || protoMax;

        const client = await createImmutableXClient();

        logger.info(`start fetch prices from ${from} to ${to}`);

        const pricesList = await createFetchProtoRangePriceJob(
            client, 
            {from: from, to: to}
        ).exec();

        logger.info('command finished');
    });


program.command('fetch-assets')
    .argument('<string>', 'wallet')
    .action(async (wallet) => {
        const client = await createImmutableXClient();
        await createFetchAndSaveAssetsJob(client, wallet).exec();
    });

    
(async () => {
    try {
        await program.parseAsync();
    } catch (err) {
        logger.error(err);
        
    }
    
})();
