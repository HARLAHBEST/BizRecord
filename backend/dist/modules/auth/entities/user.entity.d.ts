import { Workspace } from '../../workspace/entities/workspace.entity';
export declare class User {
    id: string;
    email: string;
    password: string;
    name: string;
    phone: string;
    role: 'super_admin' | 'admin' | 'manager' | 'user';
    isActive: boolean;
    workspaces: Workspace[];
    createdAt: Date;
    updatedAt: Date;
}
