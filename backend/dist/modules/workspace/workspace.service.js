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
exports.WorkspaceService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const workspace_entity_1 = require("./entities/workspace.entity");
const user_entity_1 = require("../auth/entities/user.entity");
let WorkspaceService = class WorkspaceService {
    workspacesRepository;
    usersRepository;
    constructor(workspacesRepository, usersRepository) {
        this.workspacesRepository = workspacesRepository;
        this.usersRepository = usersRepository;
    }
    async createWorkspace(createWorkspaceDto, userId) {
        const user = await this.usersRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        let managerUser = null;
        if (createWorkspaceDto.parentWorkspaceId) {
            const parentWorkspace = await this.workspacesRepository.findOne({
                where: { id: createWorkspaceDto.parentWorkspaceId },
                relations: ['users', 'createdBy'],
            });
            if (!parentWorkspace) {
                throw new common_1.NotFoundException('Parent workspace not found');
            }
            const canManageParent = parentWorkspace.createdBy?.id === userId ||
                user.role === 'admin' ||
                user.role === 'super_admin';
            if (!canManageParent) {
                throw new common_1.BadRequestException('You are not allowed to create a branch for this workspace');
            }
            if (createWorkspaceDto.managerUserId) {
                managerUser = await this.usersRepository.findOne({ where: { id: createWorkspaceDto.managerUserId } });
                if (!managerUser) {
                    throw new common_1.NotFoundException('Selected manager user not found');
                }
            }
        }
        const slug = createWorkspaceDto.name
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w-]/g, '');
        const existingWorkspace = await this.workspacesRepository.findOne({
            where: { slug },
        });
        if (existingWorkspace) {
            throw new common_1.BadRequestException('Workspace with this name already exists');
        }
        const workspace = this.workspacesRepository.create({
            ...createWorkspaceDto,
            slug,
            parentWorkspaceId: createWorkspaceDto.parentWorkspaceId || null,
            managerUserId: managerUser?.id || null,
            managerUser: managerUser || null,
            createdBy: user,
            users: managerUser && managerUser.id !== user.id ? [user, managerUser] : [user],
        });
        const saved = await this.workspacesRepository.save(workspace);
        if (user.role === 'user') {
            user.role = 'admin';
            await this.usersRepository.save(user);
        }
        return saved;
    }
    async getWorkspaces(userId) {
        const user = await this.usersRepository.findOne({
            where: { id: userId },
            relations: ['workspaces'],
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return user.workspaces || [];
    }
    async getWorkspace(workspaceId) {
        const workspace = await this.workspacesRepository.findOne({
            where: { id: workspaceId },
            relations: ['users', 'createdBy', 'parentWorkspace'],
        });
        if (!workspace) {
            throw new common_1.NotFoundException('Workspace not found');
        }
        return workspace;
    }
    async updateWorkspace(workspaceId, updateData) {
        const workspace = await this.getWorkspace(workspaceId);
        Object.assign(workspace, updateData);
        return await this.workspacesRepository.save(workspace);
    }
    async getBranches(workspaceId, userId) {
        const user = await this.usersRepository.findOne({
            where: { id: userId },
            relations: ['workspaces'],
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const hasAccess = user.workspaces?.some((workspace) => workspace.id === workspaceId);
        if (!hasAccess) {
            throw new common_1.NotFoundException('Workspace not found');
        }
        return this.workspacesRepository.find({
            where: { parentWorkspaceId: workspaceId },
            relations: ['createdBy', 'users', 'managerUser'],
            order: { createdAt: 'DESC' },
        });
    }
    async findWorkspaceUserByEmail(workspaceId, requesterId, email) {
        const normalizedEmail = email?.trim().toLowerCase();
        if (!normalizedEmail) {
            throw new common_1.BadRequestException('Email is required');
        }
        const workspace = await this.workspacesRepository.findOne({
            where: { id: workspaceId },
            relations: ['users', 'createdBy'],
        });
        if (!workspace) {
            throw new common_1.NotFoundException('Workspace not found');
        }
        const requester = await this.usersRepository.findOne({ where: { id: requesterId } });
        if (!requester) {
            throw new common_1.NotFoundException('Requester not found');
        }
        const canManageWorkspace = workspace.createdBy?.id === requesterId ||
            requester.role === 'admin' ||
            requester.role === 'super_admin';
        if (!canManageWorkspace) {
            throw new common_1.BadRequestException('You are not allowed to manage this workspace');
        }
        const foundUser = await this.usersRepository.findOne({
            where: { email: normalizedEmail },
        });
        if (!foundUser) {
            throw new common_1.NotFoundException('User not found');
        }
        const alreadyMember = workspace.users?.some((member) => member.id === foundUser.id) || false;
        return {
            id: foundUser.id,
            name: foundUser.name,
            email: foundUser.email,
            role: foundUser.role,
            alreadyMember,
        };
    }
    async addUserToWorkspace(workspaceId, userId) {
        const workspace = await this.getWorkspace(workspaceId);
        const user = await this.usersRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (!workspace.users) {
            workspace.users = [];
        }
        const userExists = workspace.users.some((u) => u.id === userId);
        if (userExists) {
            throw new common_1.BadRequestException('User already belongs to this workspace');
        }
        workspace.users.push(user);
        return await this.workspacesRepository.save(workspace);
    }
    async removeUserFromWorkspace(workspaceId, userId) {
        const workspace = await this.getWorkspace(workspaceId);
        workspace.users = workspace.users.filter((u) => u.id !== userId);
        return await this.workspacesRepository.save(workspace);
    }
};
exports.WorkspaceService = WorkspaceService;
exports.WorkspaceService = WorkspaceService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(workspace_entity_1.Workspace)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], WorkspaceService);
//# sourceMappingURL=workspace.service.js.map