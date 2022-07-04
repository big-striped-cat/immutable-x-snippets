import { Command } from 'commander';

import { createFetchProtoRangePriceJob, createImmutableXClient } from './service';


const program = new Command();

program.command('fetch-prices')
    .option('--from <number>', 'proto range start', (value) => parseInt(value, 10))
    .option('--to <number>', 'proto range (semi-interval) end', (value) => parseInt(value, 10))
    .action(async (options) => {
        console.debug('options');
        console.debug(JSON.stringify(options, null, '  '));

        const protoMax = 1800;

        const from = options.from || 1;
        const to = options.to || protoMax;

        const client = await createImmutableXClient();

        console.log(`start fetch prices from ${from} to ${to}`);

        const pricesList = await createFetchProtoRangePriceJob(
            client, 
            {from: from, to: to}
        ).exec();
    });


(async () => {
    await program.parseAsync();
})();
