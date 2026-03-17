import { Repository } from 'typeorm';
import { InventoryItem } from './entities/inventory-item.entity';
import { Workspace } from '../workspace/entities/workspace.entity';
import { User } from '../auth/entities/user.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';
export declare class InventoryService {
    private itemsRepository;
    private workspacesRepository;
    private usersRepository;
    private transactionsRepository;
    constructor(itemsRepository: Repository<InventoryItem>, workspacesRepository: Repository<Workspace>, usersRepository: Repository<User>, transactionsRepository: Repository<Transaction>);
    createItem(createItemDto: CreateInventoryItemDto, workspaceId: string, userId: string): Promise<InventoryItem>;
    getItems(workspaceId: string, skip?: number, take?: number): Promise<InventoryItem[]>;
    getItem(itemId: string): Promise<InventoryItem>;
    updateItem(itemId: string, updateItemDto: UpdateInventoryItemDto): Promise<InventoryItem>;
    deleteItem(itemId: string): Promise<{
        message: string;
    }>;
    searchItems(workspaceId: string, searchTerm: string): Promise<InventoryItem[]>;
}
