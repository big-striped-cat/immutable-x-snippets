import { Command } from 'commander';

import { calcAssetsValueHistory, createImmutableXClient, findOrCreateWallet, findWalletByAddress, findWalletsByAddress } from './service';
import { createFetchAndSaveAssetsJob, createFetchProtoRangePriceJob } from './jobs';

import { logger } from './logger';
import { sequelize } from './db';
import { Wallet } from './models';


const program = new Command();

program.command('migrate')
    .action(async () => {
        await sequelize.sync();
    });


program.command('add-wallet')
    .argument('<string>', 'address')
    .action(async (address) => {
        const [wallet, created] = await findOrCreateWallet(address);
        if (!created) {
            logger.info('Wallet already exists')
        }
        // typescript complains about wallet.id
        logger.info(`Wallet id = ${wallet.get('id')}`);
    });


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
    .argument('[string...]', 'wallets')
    .action(async (wallets) => {
        logger.info(`wallets ${wallets}`);
        
        wallets = await findWalletsByAddress(wallets);
        
        const client = await createImmutableXClient();

        for (let wallet of wallets) {
            logger.info(`Fetching assets for wallet ${wallet.get('address')}`);
            await createFetchAndSaveAssetsJob(client, wallet).exec();
        }
    });


program.command('history')
    .argument('<string>', 'wallet')
    .argument('<string>', 'date_from')
    .argument('<string>', 'date_to')
    .action(async (wallet, date_from, date_to) => {
        wallet = await findWalletByAddress(wallet);

        const history = await calcAssetsValueHistory({
            wallet_id: wallet.get('id'),
            date_from: date_from,
            date_to: date_to
        }, null);
        console.table(history);
    });


(async () => {
    try {
        await program.parseAsync();
    } catch (err) {
        logger.error(err);
        
    }
    
})();
