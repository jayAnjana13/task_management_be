import { Pool, PoolClient, QueryResult } from "pg";
declare const pool: Pool;
export declare function query(text: string, params?: any[]): Promise<QueryResult>;
export declare function getClient(): Promise<PoolClient>;
export declare function withTransaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T>;
export declare function checkDatabaseHealth(): Promise<boolean>;
export declare function closePool(): Promise<void>;
export { pool };
//# sourceMappingURL=connection.d.ts.map