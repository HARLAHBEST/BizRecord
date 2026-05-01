import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ unique: true })
  reference!: string;

  @Column({ default: 'pending' })
  status!: 'pending' | 'success' | 'failed';

  @Column({ type: 'int', default: 0 })
  amount!: number;

  @Column({ default: 'NGN' })
  currency!: string;

  @Column({ name: 'purchase_type', default: 'plan_upgrade' })
  purchaseType!: 'plan_upgrade' | 'addon_purchase' | 'one_time';

  @Column({ default: 'monthly', name: 'billing_cycle' })
  billingCycle!: 'monthly' | 'yearly';

  @Column({ type: 'varchar', nullable: true, name: 'target_plan' })
  targetPlan!: 'basic' | 'pro' | null;

  @Column({ default: 0, name: 'addon_workspace_slots' })
  addonWorkspaceSlots!: number;

  @Column({ default: 0, name: 'addon_staff_seats' })
  addonStaffSeats!: number;

  @Column({ default: 0, name: 'addon_whatsapp_bundles' })
  addonWhatsappBundles!: number;

  @Column({ type: 'varchar', nullable: true, name: 'paystack_transaction_id' })
  paystackTransactionId!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true, name: 'raw_response' })
  rawResponse!: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
