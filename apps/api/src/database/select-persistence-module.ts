import databaseConfig from './config/database.config';
import { DatabaseConfig } from './config/database-config.type';

function isDocumentDatabase(): boolean {
  return (databaseConfig() as DatabaseConfig).isDocumentDatabase;
}

export function selectPersistenceModule<T>(
  documentModule: T,
  relationalModule: T,
): T {
  return isDocumentDatabase() ? documentModule : relationalModule;
}

export function selectIdType(): typeof String | typeof Number {
  return isDocumentDatabase() ? String : Number;
}
