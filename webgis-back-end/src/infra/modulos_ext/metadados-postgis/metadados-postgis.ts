import { Pool } from 'pg';

export class MetadadosPostgis {
  async listarTabelasPostGIS(config): Promise<string[]> {
    const pool = new Pool({
      user: config.user,
      host: config.host,
      database: config.database,
      password: config.password,
      port: config.port,
    });

    const query = `
      SELECT tablename as table_name 
      FROM pg_tables 
      WHERE schemaname = '${config.schema}'
      UNION
      SELECT viewname as table_name 
      FROM pg_views 
      WHERE schemaname = '${config.schema}'
      ORDER BY table_name
    `;

    try {
      const res = await pool.query(query);
      await pool.end();
      return res.rows.map((row) => row.table_name);
    } catch (err) {
      console.error('Erro ao consultar o banco de dados:', err);
      throw err;
    }
  }

  async getTableColumns(config): Promise<any[]> {
    const pool = new Pool({
      user: config.user,
      host: config.host,
      database: config.database,
      password: config.password,
      port: config.port,
    });

    const query = `SELECT column_name, data_type, character_maximum_length FROM information_schema.columns WHERE table_name=$1`;

    try {
      const res = await pool.query(query, [config.tableName]);
      await pool.end();
      return res.rows;
    } catch (err) {
      console.error('Erro ao consultar o banco de dados:', err);
      throw err;
    }
  }
}
