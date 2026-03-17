import { Repository } from 'typeorm';
import { Workspace } from './entities/workspace.entity';
import { User } from '../auth/entities/user.entity';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
export declare class WorkspaceService {
    private workspacesRepository;
    private usersRepository;
    constructor(workspacesRepository: Repository<Workspace>, usersRepository: Repository<User>);
    createWorkspace(createWorkspaceDto: CreateWorkspaceDto, userId: string): Promise<Workspace>;
    getWorkspaces(userId: string): Promise<Workspace[]>;
    getWorkspace(workspaceId: string): Promise<Workspace>;
    updateWorkspace(workspaceId: string, updateData: Partial<Workspace>): Promise<Workspace>;
    getBranches(workspaceId: string, userId: string): Promise<Workspace[]>;
    findWorkspaceUserByEmail(workspaceId: string, requesterId: string, email: string): Promise<{
        id: string;
        name: string;
        email: string;
        role: "user" | "super_admin" | "admin" | "manager";
        alreadyMember: boolean;
    }>;
    addUserToWorkspace(workspaceId: string, userId: string): Promise<Workspace>;
    removeUserFromWorkspace(workspaceId: string, userId: string): Promise<Workspace>;
}
