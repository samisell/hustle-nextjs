function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} must be set`);
  }
  return value;
}

export function getDatabaseUrl(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const host = process.env.DB_HOST;
  const database = process.env.DB_NAME;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;

  if (!host || !database || !user || password === undefined) {
    throw new Error(
      'DATABASE_URL must be set, or DB_HOST, DB_NAME, DB_USER, and DB_PASSWORD must all be provided'
    );
  }

  const port = process.env.DB_PORT || '3306';

  return `mysql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
}

export function getRequiredDatabaseUrl(): string {
  return getDatabaseUrl() || getRequiredEnv('DATABASE_URL');
}
