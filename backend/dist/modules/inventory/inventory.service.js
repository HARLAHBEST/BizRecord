"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const inventory_item_entity_1 = require("./entities/inventory-item.entity");
const workspace_entity_1 = require("../workspace/entities/workspace.entity");
const user_entity_1 = require("../auth/entities/user.entity");
const transaction_entity_1 = require("../transactions/entities/transaction.entity");
let InventoryService = class InventoryService {
    itemsRepository;
    workspacesRepository;
    usersRepository;
    transactionsRepository;
    constructor(itemsRepository, workspacesRepository, usersRepository, transactionsRepository) {
        this.itemsRepository = itemsRepository;
        this.workspacesRepository = workspacesRepository;
        this.usersRepository = usersRepository;
        this.transactionsRepository = transactionsRepository;
    }
    async createItem(createItemDto, workspaceId, userId) {
        const workspace = await this.workspacesRepository.findOne({
            where: { id: workspaceId },
        });
        if (!workspace) {
            throw new common_1.NotFoundException('Workspace not found');
        }
        const user = await this.usersRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const item = this.itemsRepository.create({
            ...createItemDto,
            workspace: workspace,
            createdBy: user,
        });
        return this.itemsRepository.save(item);
    }
    async getItems(workspaceId, skip = 0, take = 20) {
        return this.itemsRepository.find({
            where: { workspace: { id: workspaceId } },
            skip,
            take,
            relations: ['workspace', 'createdBy'],
        });
    }
    async getItem(itemId) {
        const item = await this.itemsRepository.findOne({
            where: { id: itemId },
            relations: ['workspace', 'createdBy'],
        });
        if (!item) {
            throw new common_1.NotFoundException('Item not found');
        }
        return item;
    }
    async updateItem(itemId, updateItemDto) {
        const item = await this.getItem(itemId);
        Object.assign(item, updateItemDto);
        return this.itemsRepository.save(item);
    }
    async deleteItem(itemId) {
        const item = await this.getItem(itemId);
        await this.transactionsRepository.query('UPDATE transactions SET item_id = NULL WHERE item_id = $1', [itemId]);
        await this.itemsRepository.remove(item);
        return { message: 'Item deleted successfully' };
    }
    async searchItems(workspaceId, searchTerm) {
        return this.itemsRepository
            .createQueryBuilder('item')
            .where('item.workspace_id = :workspaceId', { workspaceId })
            .andWhere('(item.name ILIKE :searchTerm OR item.sku ILIKE :searchTerm)', { searchTerm: `%${searchTerm}%` })
            .getMany();
    }
};
exports.InventoryService = InventoryService;
exports.InventoryService = InventoryService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(inventory_item_entity_1.InventoryItem)),
    __param(1, (0, typeorm_1.InjectRepository)(workspace_entity_1.Workspace)),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(3, (0, typeorm_1.InjectRepository)(transaction_entity_1.Transaction)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], InventoryService);
//# sourceMappingURL=inventory.service.js.map