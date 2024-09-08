import { POSTGRES_DB, POSTGRES_HOST, POSTGRES_PASSWORD, POSTGRES_PORT, POSTGRES_USER } from '$env/static/private';
import { getTimeStampStr } from '$lib/utils';
import {type PoolClient, type QueryResult} from 'pg';
import pg from 'pg';
const {Pool} = pg;

export type QResult = {error: string|null, rows: any[]};
export type Pool = InstanceType<typeof Pool>

function getPool(): Pool {
    if(!globalThis.dbPool) {
        globalThis.dbPool = new Pool({
            user: POSTGRES_USER,
            password: POSTGRES_PASSWORD,
            database: POSTGRES_DB,
            host: POSTGRES_HOST,
            port: parseInt(POSTGRES_PORT),
            ssl: true
        });
        globalThis.dbPool.on('error', (err, client) => {
            console.error('Unexpected error on idle client', err);
        });
    }
    return globalThis.dbPool;
}
async function getClient(): Promise<PoolClient> {
    return getPool().connect();
}

export async function select(query: string, params: string[]):Promise<QResult> {
    const client = await getClient();
    let rows:any[] = [];
    let error:string | null = null;
    try {
        //console.log(query + ": " + params.join(", "))
        let result = await client.query(query, params);
        rows = result.rows;
    } catch(err) {
        console.error('Unexpected error', err);
        if (err instanceof Error) {
            error = err.message;
        }
    } finally {
        client.release();
    }
    return {error: error, rows: rows};
}
export async function insert(tableName: string, record: object):Promise<QResult>  {
    let sql = "INSERT INTO " + pg.escapeIdentifier(tableName) + "(";
	let valSql = " VALUES(";
	let idx = 1;

    const params:string[] = [];
	Object.entries(record).forEach(([key, value]) => {
        if(key && value){
            sql = sql + key + ", ";
            valSql = valSql + "$" + idx + ", "; idx++;
            params.push(value);    
        }
	});
    sql = sql.slice(0, sql.length - 2) + ")";
    valSql =valSql.slice(0, valSql.length - 2) + ") RETURNING *";
    const statement = sql + valSql;

    const client = await getClient();
    let rows:any[] = [];
    let error:string | null = null;
    try {
        await client.query('BEGIN');
        //console.log(statement);
        //console.log(params.join(", "))
        let result = await client.query(statement, params);
        rows = result.rows;
        await client.query('COMMIT')
    } catch(err) {
        console.error('Unexpected error, roll back ', err);
        await client.query('ROLLBACK')
        if (err instanceof Error) {
            error = err.message;
        }
    } finally {
        client.release();
    }
    return {error: error, rows: rows};
}
export async function update(tableName: string, record: object, where: object):Promise<QResult>  {

    let sql = "UPDATE \"" + tableName + "\" SET \"updatedAt\" = '" + getTimeStampStr(new Date()) + "'";

	Object.entries(record).forEach(([key, value]) => {
        if(key && value != undefined) {
            if(value == null) {
                value = "NULL";
            } else if(typeof value !== "string" ){
                value = value.toString();
            }
            sql = sql + ", \"" + key + "\" = " + pg.escapeLiteral(value);
        }
	});
    sql = sql + " WHERE ";
	Object.entries(where).forEach(([key, value]) => {
        if(key && value != undefined) {
            if(value == null) {
                value = "NULL";
            } else if(typeof value !== "string" ){
                value = value.toString();
            }
            sql = sql + "\"" + key + "\" = " + pg.escapeLiteral(value) + " AND ";
        }
	});
    sql = sql.slice(0, sql.length - 5) + " RETURNING *";

    
    const statement = sql;
    console.log(statement);

    const client = await getClient();
    let rows:any[] = [];
    let error:string | null = null;
    try {
        await client.query('BEGIN');
        let result = await client.query(statement);
        rows = result.rows;
        await client.query('COMMIT')
    } catch(err) {
        console.error('Unexpected error, roll back ', err);
        await client.query('ROLLBACK')
        if (err instanceof Error) {
            error = err.message;
        }
    } finally {
        client.release();
    }
    console.log(rows);
    return {error: error, rows: rows};
}


