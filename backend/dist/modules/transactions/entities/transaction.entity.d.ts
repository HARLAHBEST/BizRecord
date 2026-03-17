import { Workspace } from '../../workspace/entities/workspace.entity';
import { InventoryItem } from '../../inventory/entities/inventory-item.entity';
import { User } from '../../auth/entities/user.entity';
export declare class Transaction {
    id: string;
    type: 'sale' | 'expense' | 'purchase' | 'return' | 'adjustment' | 'debt';
    referenceNumber: string;
    item: InventoryItem | null;
    quantity: number;
    unitPrice: number;
    totalAmount: number;
    category: string;
    paymentMethod: 'cash' | 'card' | 'bank' | 'check' | 'credit';
    status: 'pending' | 'completed' | 'cancelled';
    customerName: string;
    phone: string;
    dueDate: Date;
    notes: string;
    workspace: Workspace;
    createdBy: User;
    createdAt: Date;
    updatedAt: Date;
}
