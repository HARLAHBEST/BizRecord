import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
export declare const databaseConfig: () => TypeOrmModuleOptions;
declare const _default: DataSource;
export default _default;
export declare const jwtConfig: () => {
    secret: string;
    expiresIn: string;
};
