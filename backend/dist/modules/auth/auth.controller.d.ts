import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    register(registerDto: RegisterDto): Promise<{
        id: string;
        email: string;
        name: string;
        phone: string;
        role: "super_admin" | "admin" | "manager" | "user";
        isActive: boolean;
        workspaces: import("../workspace/entities/workspace.entity").Workspace[];
        createdAt: Date;
        updatedAt: Date;
    }>;
    login(loginDto: LoginDto): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
            name: string;
            phone: string;
            role: "super_admin" | "admin" | "manager" | "user";
            isActive: boolean;
            workspaces: import("../workspace/entities/workspace.entity").Workspace[];
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
    getProfile(req: any): Promise<{
        id: string;
        email: string;
        name: string;
        phone: string;
        role: "super_admin" | "admin" | "manager" | "user";
        isActive: boolean;
        workspaces: import("../workspace/entities/workspace.entity").Workspace[];
        createdAt: Date;
        updatedAt: Date;
    }>;
}
