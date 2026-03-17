export declare class CreateTransactionDto {
    type: 'sale' | 'expense' | 'purchase' | 'return' | 'adjustment' | 'debt';
    referenceNumber?: string;
    itemId?: string;
    quantity: number;
    unitPrice?: number;
    totalAmount?: number;
    category?: string;
    paymentMethod: 'cash' | 'card' | 'bank' | 'check' | 'credit';
    status?: 'pending' | 'completed' | 'cancelled';
    customerName?: string;
    phone?: string;
    notes?: string;
    dueDate?: string;
}
