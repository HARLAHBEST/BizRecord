import { WorkspaceService } from './workspace.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
export declare class WorkspaceController {
    private workspaceService;
    constructor(workspaceService: WorkspaceService);
    create(createWorkspaceDto: CreateWorkspaceDto, req: any): Promise<import("./entities/workspace.entity").Workspace>;
    findAll(req: any): Promise<import("./entities/workspace.entity").Workspace[]>;
    findOne(id: string): Promise<import("./entities/workspace.entity").Workspace>;
    getBranches(id: string, req: any): Promise<import("./entities/workspace.entity").Workspace[]>;
    findWorkspaceUserByEmail(id: string, req: any, email: string): Promise<{
        id: string;
        name: string;
        email: string;
        role: "user" | "super_admin" | "admin" | "manager";
        alreadyMember: boolean;
    }>;
    findWorkspaceUserByEmailPath(id: string, req: any, email: string): Promise<{
        id: string;
        name: string;
        email: string;
        role: "user" | "super_admin" | "admin" | "manager";
        alreadyMember: boolean;
    }>;
    update(id: string, updateData: Partial<CreateWorkspaceDto>): Promise<import("./entities/workspace.entity").Workspace>;
    addUser(id: string, userId: string): Promise<import("./entities/workspace.entity").Workspace>;
    removeUser(id: string, userId: string): Promise<import("./entities/workspace.entity").Workspace>;
}
