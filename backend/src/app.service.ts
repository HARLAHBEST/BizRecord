import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class AppService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  getPing() {
    return {
      status: 'ok',
      message: 'pong',
      timestamp: new Date().toISOString(),
    };
  }

  async getHealth() {
    const now = new Date().toISOString();
    const uptimeSeconds = Math.round(process.uptime());

    try {
      await this.dataSource.query('SELECT 1');
      return {
        status: 'ok',
        timestamp: now,
        uptimeSeconds,
        database: 'up',
      };
    } catch (error) {
      throw new ServiceUnavailableException({
        status: 'error',
        timestamp: now,
        uptimeSeconds,
        database: 'down',
      });
    }
  }
}
