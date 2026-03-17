import { Repository } from 'typeorm';
import { Transaction } from './entities/transaction.entity';
import { Workspace } from '../workspace/entities/workspace.entity';
import { User } from '../auth/entities/user.entity';
import { InventoryItem } from '../inventory/entities/inventory-item.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
export declare class TransactionsService {
    private transactionsRepository;
    private workspacesRepository;
    private usersRepository;
    private itemsRepository;
    constructor(transactionsRepository: Repository<Transaction>, workspacesRepository: Repository<Workspace>, usersRepository: Repository<User>, itemsRepository: Repository<InventoryItem>);
    createTransaction(createTransactionDto: CreateTransactionDto, workspaceId: string, userId: string): Promise<Transaction>;
    getTransactions(workspaceId: string, skip?: number, take?: number, type?: string): Promise<Transaction[]>;
    getTransaction(transactionId: string): Promise<Transaction>;
    updateTransactionStatus(transactionId: string, status: 'pending' | 'completed' | 'cancelled'): Promise<Transaction>;
    getSummary(workspaceId: string, startDate: Date, endDate: Date): Promise<{
        totalSales: number;
        totalExpenses: number;
        totalPurchases: number;
        profit: number;
        transactionCount: number;
    }>;
}
