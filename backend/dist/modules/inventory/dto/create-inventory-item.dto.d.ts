export declare class CreateInventoryItemDto {
    name: string;
    sku?: string;
    description?: string;
    quantity: number;
    costPrice: number;
    sellingPrice?: number;
    reorderLevel?: number;
    category?: string;
    location?: string;
    supplier?: string;
}
