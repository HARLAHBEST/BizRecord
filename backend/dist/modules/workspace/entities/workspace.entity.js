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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Workspace = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../auth/entities/user.entity");
const inventory_item_entity_1 = require("../../inventory/entities/inventory-item.entity");
const transaction_entity_1 = require("../../transactions/entities/transaction.entity");
let Workspace = class Workspace {
    id;
    name;
    description;
    logo;
    status;
    createdBy;
    managerUserId;
    managerUser;
    slug;
    parentWorkspaceId;
    parentWorkspace;
    branches;
    users;
    items;
    transactions;
    createdAt;
    updatedAt;
};
exports.Workspace = Workspace;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Workspace.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Workspace.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Workspace.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Workspace.prototype, "logo", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'active' }),
    __metadata("design:type", String)
], Workspace.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'created_by' }),
    __metadata("design:type", user_entity_1.User)
], Workspace.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'manager_user_id', nullable: true }),
    __metadata("design:type", Object)
], Workspace.prototype, "managerUserId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'manager_user_id' }),
    __metadata("design:type", Object)
], Workspace.prototype, "managerUser", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], Workspace.prototype, "slug", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'parent_workspace_id', nullable: true }),
    __metadata("design:type", Object)
], Workspace.prototype, "parentWorkspaceId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Workspace, (workspace) => workspace.branches, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'parent_workspace_id' }),
    __metadata("design:type", Object)
], Workspace.prototype, "parentWorkspace", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Workspace, (workspace) => workspace.parentWorkspace),
    __metadata("design:type", Array)
], Workspace.prototype, "branches", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => user_entity_1.User, (user) => user.workspaces),
    __metadata("design:type", Array)
], Workspace.prototype, "users", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => inventory_item_entity_1.InventoryItem, (item) => item.workspace),
    __metadata("design:type", Array)
], Workspace.prototype, "items", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => transaction_entity_1.Transaction, (transaction) => transaction.workspace),
    __metadata("design:type", Array)
], Workspace.prototype, "transactions", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Workspace.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Workspace.prototype, "updatedAt", void 0);
exports.Workspace = Workspace = __decorate([
    (0, typeorm_1.Entity)('workspaces')
], Workspace);
//# sourceMappingURL=workspace.entity.js.map