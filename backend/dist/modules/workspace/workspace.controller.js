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
exports.WorkspaceController = void 0;
const common_1 = require("@nestjs/common");
const workspace_service_1 = require("./workspace.service");
const create_workspace_dto_1 = require("./dto/create-workspace.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let WorkspaceController = class WorkspaceController {
    workspaceService;
    constructor(workspaceService) {
        this.workspaceService = workspaceService;
    }
    async create(createWorkspaceDto, req) {
        return this.workspaceService.createWorkspace(createWorkspaceDto, req.user.sub);
    }
    async findAll(req) {
        return this.workspaceService.getWorkspaces(req.user.sub);
    }
    async findOne(id) {
        return this.workspaceService.getWorkspace(id);
    }
    async getBranches(id, req) {
        return this.workspaceService.getBranches(id, req.user.sub);
    }
    async findWorkspaceUserByEmail(id, req, email) {
        return this.workspaceService.findWorkspaceUserByEmail(id, req.user.sub, email);
    }
    async findWorkspaceUserByEmailPath(id, req, email) {
        return this.workspaceService.findWorkspaceUserByEmail(id, req.user.sub, email);
    }
    async update(id, updateData) {
        return this.workspaceService.updateWorkspace(id, updateData);
    }
    async addUser(id, userId) {
        return this.workspaceService.addUserToWorkspace(id, userId);
    }
    async removeUser(id, userId) {
        return this.workspaceService.removeUserFromWorkspace(id, userId);
    }
};
exports.WorkspaceController = WorkspaceController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_workspace_dto_1.CreateWorkspaceDto, Object]),
    __metadata("design:returntype", Promise)
], WorkspaceController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WorkspaceController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WorkspaceController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/branches'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WorkspaceController.prototype, "getBranches", null);
__decorate([
    (0, common_1.Get)(':id/users/search'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Query)('email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], WorkspaceController.prototype, "findWorkspaceUserByEmail", null);
__decorate([
    (0, common_1.Get)(':id/users/email/:email'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Param)('email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], WorkspaceController.prototype, "findWorkspaceUserByEmailPath", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WorkspaceController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/users/:userId'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], WorkspaceController.prototype, "addUser", null);
__decorate([
    (0, common_1.Delete)(':id/users/:userId'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], WorkspaceController.prototype, "removeUser", null);
exports.WorkspaceController = WorkspaceController = __decorate([
    (0, common_1.Controller)('workspaces'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [workspace_service_1.WorkspaceService])
], WorkspaceController);
//# sourceMappingURL=workspace.controller.js.map