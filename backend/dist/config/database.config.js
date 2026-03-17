"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jwtConfig = exports.databaseConfig = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../modules/auth/entities/user.entity");
const workspace_entity_1 = require("../modules/workspace/entities/workspace.entity");
const inventory_item_entity_1 = require("../modules/inventory/entities/inventory-item.entity");
const transaction_entity_1 = require("../modules/transactions/entities/transaction.entity");
const databaseConfig = () => {
    const shared = {
        type: 'postgres',
        entities: [user_entity_1.User, workspace_entity_1.Workspace, inventory_item_entity_1.InventoryItem, transaction_entity_1.Transaction],
        synchronize: process.env.NODE_ENV !== 'production',
        migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
        migrationsRun: true,
        logging: process.env.NODE_ENV === 'development',
    };
    if (process.env.DATABASE_URL) {
        return { ...shared, url: process.env.DATABASE_URL };
    }
    return {
        ...shared,
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'password',
        database: process.env.DB_NAME || 'booker_db',
    };
};
exports.databaseConfig = databaseConfig;
const entities = [user_entity_1.User, workspace_entity_1.Workspace, inventory_item_entity_1.InventoryItem, transaction_entity_1.Transaction];
const migrations = [__dirname + '/../database/migrations/*{.ts,.js}'];
const dataSourceOptions = process.env.DATABASE_URL
    ? {
        type: 'postgres',
        url: process.env.DATABASE_URL,
        entities,
        migrations,
        synchronize: false,
    }
    : {
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'password',
        database: process.env.DB_NAME || 'booker_db',
        entities,
        migrations,
        synchronize: false,
    };
exports.default = new typeorm_1.DataSource(dataSourceOptions);
const jwtConfig = () => ({
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
});
exports.jwtConfig = jwtConfig;
//# sourceMappingURL=database.config.js.map