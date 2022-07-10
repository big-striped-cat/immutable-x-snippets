import { Pool } from 'pg';

const pool = new Pool();

const exit = async () => {
    return await pool.end();
}

const query = async (text, params) => {
    return await pool.query(text, params)
}

export { query, exit };
