import Constants from 'expo-constants';

function readExpoConfig(path) {
  let current = Constants?.expoConfig || Constants?.manifest2?.extra?.expoClient;
  for (const key of path) {
    if (!current || typeof current !== 'object') return null;
    current = current[key];
  }
  return current ?? null;
}

function readEnv(name, fallback = '') {
  const value = process.env?.[name];
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }
  return fallback;
}

export function getAndroidPackageName() {
  return (
    readEnv('EXPO_PUBLIC_ANDROID_PACKAGE') ||
    readExpoConfig(['android', 'package']) ||
    ''
  );
}

export function getBillingSkuMap() {
  return {
    pro_monthly: readEnv(
      'EXPO_PUBLIC_BILLING_SKU_PRO_MONTHLY',
      'bizrecord_pro_monthly',
    ),
    pro_yearly: readEnv(
      'EXPO_PUBLIC_BILLING_SKU_PRO_YEARLY',
      'bizrecord_pro_yearly',
    ),
    basic_monthly: readEnv(
      'EXPO_PUBLIC_BILLING_SKU_BASIC_MONTHLY',
      'bizrecord_basic_monthly',
    ),
    basic_yearly: readEnv(
      'EXPO_PUBLIC_BILLING_SKU_BASIC_YEARLY',
      'bizrecord_basic_yearly',
    ),
  };
}

export function getAddonSkuMap() {
  return {
    workspace_monthly: readEnv(
      'EXPO_PUBLIC_BILLING_SKU_ADDON_WORKSPACE_MONTHLY',
      'bizrecord_addon_workspace_monthly',
    ),
    workspace_yearly: readEnv(
      'EXPO_PUBLIC_BILLING_SKU_ADDON_WORKSPACE_YEARLY',
      'bizrecord_addon_workspace_yearly',
    ),
    staff_monthly: readEnv(
      'EXPO_PUBLIC_BILLING_SKU_ADDON_STAFF_MONTHLY',
      'bizrecord_addon_staff_monthly',
    ),
    staff_yearly: readEnv(
      'EXPO_PUBLIC_BILLING_SKU_ADDON_STAFF_YEARLY',
      'bizrecord_addon_staff_yearly',
    ),
    whatsapp_monthly: readEnv(
      'EXPO_PUBLIC_BILLING_SKU_ADDON_WHATSAPP100_MONTHLY',
      'bizrecord_addon_whatsapp100_monthly',
    ),
    whatsapp_yearly: readEnv(
      'EXPO_PUBLIC_BILLING_SKU_ADDON_WHATSAPP100_YEARLY',
      'bizrecord_addon_whatsapp100_yearly',
    ),
  };
}

export function resolveSubscriptionSku(plan, billingCycle) {
  const skuMap = getBillingSkuMap();
  const preferredKey = `${plan}_${billingCycle}`;
  return skuMap[preferredKey] || skuMap.pro_monthly;
}

export function resolveAddonSku(addonType, billingCycle) {
  const addonSkuMap = getAddonSkuMap();
  const normalizedType =
    addonType === 'workspaceSlots'
      ? 'workspace'
      : addonType === 'staffSeats'
        ? 'staff'
        : addonType === 'whatsappBundles'
          ? 'whatsapp'
          : addonType;
  const preferredKey = `${normalizedType}_${billingCycle}`;
  return addonSkuMap[preferredKey] || '';
}
