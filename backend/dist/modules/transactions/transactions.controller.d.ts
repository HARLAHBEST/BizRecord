import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
export declare class TransactionsController {
    private transactionsService;
    constructor(transactionsService: TransactionsService);
    create(workspaceId: string, createTransactionDto: CreateTransactionDto, req: any): Promise<import("./entities/transaction.entity").Transaction>;
    findAll(workspaceId: string, skip?: number, take?: number, type?: string): Promise<import("./entities/transaction.entity").Transaction[]>;
    getSummary(workspaceId: string, startDate: string, endDate: string): Promise<{
        totalSales: number;
        totalExpenses: number;
        totalPurchases: number;
        profit: number;
        transactionCount: number;
    }>;
    findOne(id: string): Promise<import("./entities/transaction.entity").Transaction>;
    updateStatus(id: string, body: {
        status: 'pending' | 'completed' | 'cancelled';
    }): Promise<import("./entities/transaction.entity").Transaction>;
}
