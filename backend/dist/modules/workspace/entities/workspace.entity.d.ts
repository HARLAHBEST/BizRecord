import { User } from '../../auth/entities/user.entity';
import { InventoryItem } from '../../inventory/entities/inventory-item.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';
export declare class Workspace {
    id: string;
    name: string;
    description: string;
    logo: string;
    status: 'active' | 'inactive' | 'archived';
    createdBy: User;
    managerUserId: string | null;
    managerUser: User | null;
    slug: string;
    parentWorkspaceId: string | null;
    parentWorkspace: Workspace | null;
    branches: Workspace[];
    users: User[];
    items: InventoryItem[];
    transactions: Transaction[];
    createdAt: Date;
    updatedAt: Date;
}
