import { Platform } from 'react-native';
import {
  endConnection,
  fetchProducts,
  finishTransaction,
  getAvailablePurchases,
  initConnection,
  purchaseErrorListener,
  purchaseUpdatedListener,
  requestPurchase,
} from 'react-native-iap';

let connectionPromise = null;
let purchaseUpdateSub = null;
let purchaseErrorSub = null;

export function extractPurchaseToken(purchase) {
  return purchase?.purchaseToken || '';
}

export function isAvailable() {
  return Platform.OS === 'android';
}

async function ensureConnection() {
  if (!isAvailable()) {
    throw new Error('Google Play Billing is only available on Android.');
  }

  if (!connectionPromise) {
    connectionPromise = initConnection().catch((err) => {
      connectionPromise = null;
      throw err;
    });
  }

  await connectionPromise;
}

export async function initPurchaseListeners(onSuccess, onError) {
  await ensureConnection();
  removeListeners();

  purchaseUpdateSub = purchaseUpdatedListener(async (purchase) => {
    console.log('Purchase update:', purchase);

    try {
      await onSuccess(purchase);
    } catch (err) {
      console.error('Purchase handling failed:', err);
    }
  });

  purchaseErrorSub = purchaseErrorListener((error) => {
    console.error('Purchase error:', error);
    if (onError) onError(error);
  });
}

export function removeListeners() {
  purchaseUpdateSub?.remove();
  purchaseErrorSub?.remove();
  purchaseUpdateSub = null;
  purchaseErrorSub = null;
}

export async function getSkuDetails(productIds = []) {
  await ensureConnection();

  if (!productIds.length) {
    return [];
  }

  const response = await fetchProducts({
    skus: productIds,
    type: 'subs',
  });

  return Array.isArray(response) ? response : response?.products || [];
}

export async function getProductDetails(productIds = [], productType = 'subs') {
  await ensureConnection();

  if (!productIds.length) {
    return [];
  }

  const response = await fetchProducts({
    skus: productIds,
    type: productType,
  });

  return Array.isArray(response) ? response : response?.products || [];
}

export async function purchaseSubscription(productId) {
  await ensureConnection();

  await requestPurchase({
    request: {
      google: { skus: [productId] },
    },
    type: 'subs',
  });
}

export async function purchaseProduct(productId) {
  await ensureConnection();

  await requestPurchase({
    request: {
      google: { skus: [productId] },
    },
    type: 'in-app',
  });
}

export async function restorePurchases() {
  await ensureConnection();
  const purchases = await getAvailablePurchases();
  return Array.isArray(purchases) ? purchases : [];
}

export async function acknowledgePurchase(purchase, options = {}) {
  await ensureConnection();
  return finishTransaction({
    purchase,
    isConsumable: options?.isConsumable === true,
  });
}

export async function disconnect() {
  removeListeners();

  if (connectionPromise) {
    await connectionPromise.catch(() => null);
    connectionPromise = null;
  }

  if (isAvailable()) {
    await endConnection();
  }
}

export default {
  acknowledgePurchase,
  disconnect,
  extractPurchaseToken,
  getProductDetails,
  getSkuDetails,
  initPurchaseListeners,
  isAvailable,
  purchaseProduct,
  purchaseSubscription,
  removeListeners,
  restorePurchases,
};
