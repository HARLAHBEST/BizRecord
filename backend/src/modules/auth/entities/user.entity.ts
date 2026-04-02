import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Workspace } from '../../workspace/entities/workspace.entity';
import { WorkspaceMembership } from '../../workspace/entities/workspace-membership.entity';
import { UserPushToken } from '../../notifications/entities/user-push-token.entity';

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

  @Column({ default: false })
  emailVerified: boolean;

  @Column({ type: 'varchar', nullable: true })
  emailVerificationCode: string | null;

  @Column({ type: 'timestamp', nullable: true })
  emailVerificationExpiresAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  emailVerificationLastSentAt: Date | null;

  @Column({ type: 'varchar', nullable: true })
  passwordResetCode: string | null;

  @Column({ type: 'timestamp', nullable: true })
  passwordResetExpiresAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  passwordResetLastSentAt: Date | null;

  @OneToMany(() => WorkspaceMembership, (membership) => membership.user)
  memberships: WorkspaceMembership[];

  @OneToMany(() => UserPushToken, (pushToken) => pushToken.user)
  pushTokens: UserPushToken[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
