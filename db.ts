import { Pool } from 'pg';

const pool = new Pool();

const exit = async () => {
    return await pool.end();
}

const query = async (text, params) => {
    return await pool.query(text, params)
}

const transaction = async (func, args) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await func(...args);
    } catch (e) {
        await client.query('ROLLBACK')
        throw e;
    } finally {
        client.release()
    }
}

export { query, exit, transaction };
