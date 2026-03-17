import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Workspace } from '../../workspace/entities/workspace.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ default: 'user' })
  role: 'super_admin' | 'admin' | 'owner' | 'manager' | 'staff' | 'user';

  @Column({ default: 'pro' })
  plan: 'basic' | 'pro';

  @Column({ type: 'timestamp', nullable: true })
  trialStartAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  trialEndsAt: Date | null;

  @Column({ default: 'active' })
  trialStatus: 'active' | 'expired' | 'converted';

  @Column({ default: true })
  isActive: boolean;

  @ManyToMany(() => Workspace, (workspace) => workspace.users)
  @JoinTable({
    name: 'workspace_users',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'workspace_id', referencedColumnName: 'id' },
  })
  workspaces: Workspace[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
