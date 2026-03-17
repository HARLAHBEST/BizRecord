import { Workspace } from '../../workspace/entities/workspace.entity';
import { User } from '../../auth/entities/user.entity';
export declare class InventoryItem {
    id: string;
    name: string;
    sku: string;
    description: string;
    quantity: number;
    costPrice: number;
    sellingPrice: number;
    reorderLevel: number;
    category: string;
    location: string;
    supplier: string;
    status: 'available' | 'out_of_stock' | 'discontinued';
    workspace: Workspace;
    createdBy: User;
    createdAt: Date;
    updatedAt: Date;
}
