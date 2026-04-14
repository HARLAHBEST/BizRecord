import { IsOptional, IsString, IsIn } from 'class-validator';

export class VerifyGooglePurchaseDto {
  @IsString()
  packageName!: string;

  @IsString()
  productId!: string;

  @IsString()
  purchaseToken!: string;

  @IsOptional()
  @IsIn(['subscription', 'product'])
  purchaseType?: 'subscription' | 'product';

  @IsOptional()
  @IsIn([
    'plan',
    'addon_workspace_slot',
    'addon_staff_seat',
    'addon_whatsapp_bundle_100',
  ])
  purchaseKind?:
    | 'plan'
    | 'addon_workspace_slot'
    | 'addon_staff_seat'
    | 'addon_whatsapp_bundle_100';

  @IsOptional()
  @IsIn(['monthly', 'yearly'])
  billingCycle?: 'monthly' | 'yearly';

  @IsOptional()
  @IsString()
  // If provided, the purchase will be applied to this workspace (owner only)
  workspaceId?: string;
}
