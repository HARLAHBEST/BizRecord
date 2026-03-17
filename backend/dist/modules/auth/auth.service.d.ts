import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from './entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthService {
    private usersRepository;
    private jwtService;
    constructor(usersRepository: Repository<User>, jwtService: JwtService);
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
    validateUser(userId: string): Promise<{
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
    getUserProfile(userId: string): Promise<{
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
