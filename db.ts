import { Sequelize } from 'sequelize';
import { logger } from './logger';


const transaction = async (func, args) => {
    const t = await sequelize.transaction();
    try {
        await func(...args);
        await t.commit();
    } catch (e) {
        await t.rollback();
        throw e;
    }
}


const createSequelize = () => {
    const database = process.env.PGDATABASE || '';
    const user = process.env.PGUSER || '';
    const host = process.env.PGHOST || '';
    const password = process.env.PGPASSWORD || '';
    const port = parseInt(process.env.PGPORT || '5432');

    return new Sequelize(
        database,
        user,
        password, {
            host: host,
            port: port,
            dialect: 'postgres',
            logging: msg => logger.debug(msg)
        }
    )
}

const sequelize = createSequelize();


export { transaction, sequelize };
