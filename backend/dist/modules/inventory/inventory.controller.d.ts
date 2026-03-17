import { InventoryService } from './inventory.service';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';
export declare class InventoryController {
    private inventoryService;
    constructor(inventoryService: InventoryService);
    create(workspaceId: string, createItemDto: CreateInventoryItemDto, req: any): Promise<import("./entities/inventory-item.entity").InventoryItem>;
    findAll(workspaceId: string, skip?: number, take?: number): Promise<import("./entities/inventory-item.entity").InventoryItem[]>;
    search(workspaceId: string, searchTerm: string): Promise<import("./entities/inventory-item.entity").InventoryItem[]>;
    findOne(id: string): Promise<import("./entities/inventory-item.entity").InventoryItem>;
    update(id: string, updateItemDto: UpdateInventoryItemDto): Promise<import("./entities/inventory-item.entity").InventoryItem>;
    delete(id: string): Promise<{
        message: string;
    }>;
}
