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
exports.TransactionsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const transaction_entity_1 = require("./entities/transaction.entity");
const workspace_entity_1 = require("../workspace/entities/workspace.entity");
const user_entity_1 = require("../auth/entities/user.entity");
const inventory_item_entity_1 = require("../inventory/entities/inventory-item.entity");
let TransactionsService = class TransactionsService {
    transactionsRepository;
    workspacesRepository;
    usersRepository;
    itemsRepository;
    constructor(transactionsRepository, workspacesRepository, usersRepository, itemsRepository) {
        this.transactionsRepository = transactionsRepository;
        this.workspacesRepository = workspacesRepository;
        this.usersRepository = usersRepository;
        this.itemsRepository = itemsRepository;
    }
    async createTransaction(createTransactionDto, workspaceId, userId) {
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
        let item = null;
        let quantity = Number(createTransactionDto.quantity || 0);
        let unitPrice = Number(createTransactionDto.unitPrice || 0);
        let totalAmount = Number(createTransactionDto.totalAmount || 0);
        if (createTransactionDto.type === 'sale') {
            if (!createTransactionDto.itemId) {
                throw new common_1.BadRequestException('itemId is required for sale transactions');
            }
            item = await this.itemsRepository.findOne({
                where: {
                    id: createTransactionDto.itemId,
                    workspace: { id: workspaceId },
                },
                relations: ['workspace'],
            });
            if (!item) {
                throw new common_1.NotFoundException('Selected item not found in this workspace');
            }
            quantity = Number(createTransactionDto.quantity || 0);
            if (!quantity || quantity <= 0) {
                throw new common_1.BadRequestException('quantity must be greater than zero');
            }
            const currentStock = Number(item.quantity || 0);
            if (quantity > currentStock) {
                throw new common_1.BadRequestException(`Insufficient stock. Available: ${currentStock}`);
            }
            unitPrice = Number(item.sellingPrice || 0);
            totalAmount = unitPrice * quantity;
            item.quantity = Number((currentStock - quantity).toFixed(2));
            await this.itemsRepository.save(item);
        }
        const transaction = this.transactionsRepository.create({
            type: createTransactionDto.type,
            referenceNumber: createTransactionDto.referenceNumber,
            item: item || undefined,
            quantity,
            unitPrice,
            totalAmount,
            category: createTransactionDto.category,
            paymentMethod: createTransactionDto.paymentMethod,
            status: createTransactionDto.status || 'pending',
            customerName: createTransactionDto.customerName,
            phone: createTransactionDto.phone,
            notes: createTransactionDto.notes,
            ...(createTransactionDto.dueDate && { dueDate: new Date(createTransactionDto.dueDate) }),
            workspace,
            createdBy: user,
        });
        return await this.transactionsRepository.save(transaction);
    }
    async getTransactions(workspaceId, skip = 0, take = 20, type) {
        const query = this.transactionsRepository
            .createQueryBuilder('transaction')
            .where('transaction.workspace_id = :workspaceId', { workspaceId });
        if (type) {
            query.andWhere('transaction.type = :type', { type });
        }
        return await query
            .orderBy('transaction.createdAt', 'DESC')
            .skip(skip)
            .take(take)
            .getMany();
    }
    async getTransaction(transactionId) {
        const transaction = await this.transactionsRepository.findOne({
            where: { id: transactionId },
            relations: ['workspace', 'createdBy', 'item'],
        });
        if (!transaction) {
            throw new common_1.NotFoundException('Transaction not found');
        }
        return transaction;
    }
    async updateTransactionStatus(transactionId, status) {
        const transaction = await this.getTransaction(transactionId);
        transaction.status = status;
        return await this.transactionsRepository.save(transaction);
    }
    async getSummary(workspaceId, startDate, endDate) {
        const transactions = await this.transactionsRepository.find({
            where: {
                workspace: { id: workspaceId },
            },
            relations: ['item'],
        });
        const filteredByDate = transactions.filter((t) => new Date(t.createdAt) >= startDate && new Date(t.createdAt) <= endDate);
        const sales = filteredByDate
            .filter((t) => t.type === 'sale')
            .reduce((sum, t) => sum + parseFloat(t.totalAmount.toString()), 0);
        const expenses = filteredByDate
            .filter((t) => t.type === 'expense')
            .reduce((sum, t) => sum + parseFloat(t.totalAmount.toString()), 0);
        const purchases = filteredByDate
            .filter((t) => t.type === 'purchase')
            .reduce((sum, t) => sum + parseFloat(t.totalAmount.toString()), 0);
        return {
            totalSales: sales,
            totalExpenses: expenses,
            totalPurchases: purchases,
            profit: sales - expenses - purchases,
            transactionCount: filteredByDate.length,
        };
    }
};
exports.TransactionsService = TransactionsService;
exports.TransactionsService = TransactionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(transaction_entity_1.Transaction)),
    __param(1, (0, typeorm_1.InjectRepository)(workspace_entity_1.Workspace)),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(3, (0, typeorm_1.InjectRepository)(inventory_item_entity_1.InventoryItem)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], TransactionsService);
//# sourceMappingURL=transactions.service.js.map