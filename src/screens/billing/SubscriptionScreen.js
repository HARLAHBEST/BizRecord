import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import * as GoogleBilling from '../../services/googleBilling';
import { useTheme } from '../../theme/ThemeContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useAuth } from '../../context/AuthContext';
import { Card, AppButton, Title } from '../../components/UI';
import { api } from '../../api/client';
import * as offlineStore from '../../storage/offlineStore';
import {
  getAndroidPackageName,
  getAddonSkuMap,
  getBillingSkuMap,
  resolveAddonSku,
  resolveSubscriptionSku,
} from '../../services/billingConfig';

const PLAN_ORDER = ['basic', 'pro'];
const PLAY_PRICE_MARKUP = 1.075;
const LAST_PURCHASE_TOKEN_STORAGE_KEY = 'lastPurchaseToken';
const PENDING_PURCHASE_FINISH_STORAGE_KEY = 'pendingGooglePurchaseFinish';
// Match the client.js offline detection: only if NO response (true offline)
const isLikelyOfflineError = (err) => !err?.response;
const DEFAULT_ADDONS = {
  workspaceSlot: { monthly: 1500, yearly: Math.round(1500 * 12 * 0.8) },
  staffSeat: { monthly: 500, yearly: Math.round(500 * 12 * 0.8) },
  whatsappBundle100: { monthly: 2000, yearly: Math.round(2000 * 12 * 0.8) },
};

function normalizePlansResponse(payload) {
  if (payload?.basic || payload?.pro) {
    return payload;
  }

  const normalized = {};
  for (const plan of payload?.plans || []) {
    normalized[plan.key] = {
      pricing: {
        monthly: Number(plan.monthly || 0),
        yearly: Number(plan.yearly || 0),
      },
      addons: DEFAULT_ADDONS,
    };
  }

  return {
    basic: normalized.basic || {
      pricing: { monthly: 2500, yearly: Math.round(2500 * 12 * 0.8) },
      addons: DEFAULT_ADDONS,
    },
    pro: normalized.pro || {
      pricing: { monthly: 7000, yearly: Math.round(7000 * 12 * 0.8) },
      addons: DEFAULT_ADDONS,
    },
  };
}

function getPurchaseToken(purchase) {
  return GoogleBilling.extractPurchaseToken(purchase);
}

function getPurchaseProductId(purchase, fallback = '') {
  return (
    purchase?.productId ||
    purchase?.productIds?.[0] ||
    purchase?.products?.[0] ||
    fallback
  );
}

function getTrialDaysLeft(subscription) {
  if (!subscription?.trialEndsAt) {
    return 0;
  }

  const diffMs = new Date(subscription.trialEndsAt).getTime() - Date.now();
  if (diffMs <= 0) {
    return 0;
  }

  return Math.ceil(diffMs / (24 * 60 * 60 * 1000));
}

function applyPlayMarkup(amount) {
  return Math.round(Number(amount || 0) * PLAY_PRICE_MARKUP);
}

export default function SubscriptionScreen({ navigation }) {
  const { theme } = useTheme();
  const [plans, setPlans] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [usage, setUsage] = useState(null);
  const [workspaceBilling, setWorkspaceBilling] = useState(null);
  const [playProducts, setPlayProducts] = useState({});
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('pro');
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [selectedAddons, setSelectedAddons] = useState({
    workspaceSlot: false,
    staffSeat: false,
    whatsappBundle: false,
  });
  const [lastReference, setLastReference] = useState(null);
  const [onlineRequired, setOnlineRequired] = useState(false);
  const [showAddonModal, setShowAddonModal] = useState(false);
  const [processingAddon, setProcessingAddon] = useState(false);
  const currentWorkspaceIdRef = useRef(null);
  const processedTokensRef = useRef(new Set());
  const processingTokensRef = useRef(new Set());
  const handlePurchaseRef = useRef(null);
  const handleRecoveredPurchasesRef = useRef(null);

  const workspace = useWorkspace();
  const { user, setPauseAutoLock } = useAuth();
  const currentWorkspace =
    workspace.currentWorkspace ||
    workspace.workspaces.find((w) => w.id === workspace.currentWorkspaceId);
  const userRole = currentWorkspace?.role || user?.role || 'user';
  const isWorkspaceOwner = userRole === 'owner';
  const addonsAllowed = subscription?.trial?.addonsAllowed !== false;
  const addonsSelectable = addonsAllowed && selectedPlan === 'pro';
  const workspaceCount = workspace.workspaces?.length || 0;
  const trialDaysLeft = getTrialDaysLeft(subscription);

  const getPurchaseVerificationMeta = (purchase) => {
    const productId = getPurchaseProductId(purchase);
    const addonSkus = getAddonSkuMap();
    let purchaseType = 'subscription';
    let purchaseKind;
    let purchaseBillingCycle;

    if (Object.values(addonSkus).includes(productId)) {
      purchaseType = 'product';
      purchaseBillingCycle = productId.includes('yearly') ? 'yearly' : 'monthly';

      if (productId === addonSkus.workspace_monthly || productId === addonSkus.workspace_yearly) {
        purchaseKind = 'addon_workspace_slot';
      } else if (productId === addonSkus.staff_monthly || productId === addonSkus.staff_yearly) {
        purchaseKind = 'addon_staff_seat';
      } else if (productId === addonSkus.whatsapp_monthly || productId === addonSkus.whatsapp_yearly) {
        purchaseKind = 'addon_whatsapp_bundle_100';
      }
    }

    return { productId, purchaseType, purchaseKind, purchaseBillingCycle };
  };

  const isCompletedAndroidPurchase = (purchase) => {
    if (!purchase?.purchaseToken) {
      return false;
    }

    if (
      Platform.OS === 'android' &&
      typeof purchase?.purchaseStateAndroid === 'number' &&
      purchase.purchaseStateAndroid !== 0
    ) {
      return false;
    }

    return true;
  };

  useEffect(() => {
    let mounted = true;

    const loadLastPurchaseToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem(LAST_PURCHASE_TOKEN_STORAGE_KEY);
        if (mounted && storedToken) {
          setLastReference(storedToken);
        }
      } catch {
        // ignore storage read errors
      }
    };

    loadLastPurchaseToken();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    currentWorkspaceIdRef.current = currentWorkspace?.id || null;
  }, [currentWorkspace?.id]);

  const loadPlayProducts = async () => {
    if (Platform.OS !== 'android' || !GoogleBilling.isAvailable()) {
      setPlayProducts({});
      return;
    }

    try {
      const subscriptionSkus = Object.values(getBillingSkuMap());
      const addonSkus = Object.values(getAddonSkuMap());
      const [subscriptionProducts, addonProducts] = await Promise.all([
        GoogleBilling.getSkuDetails(subscriptionSkus),
        GoogleBilling.getProductDetails(addonSkus, 'in-app'),
      ]);
      const products = [...subscriptionProducts, ...addonProducts];
      const next = {};
      for (const product of products) {
        const productId = getPurchaseProductId(product);
        if (!productId) continue;
        next[productId] = product;
      }
      setPlayProducts(next);
    } catch (error) {
      setPlayProducts({});
    }
  };

  const handleRecoveredPurchases = async (
    purchases,
    { acknowledge = true, showSuccessAlert = false } = {},
  ) => {
    const validPurchases = purchases.filter(isCompletedAndroidPurchase);

    for (const purchase of validPurchases) {
      try {
        await handlePurchase(purchase, { acknowledge, showSuccessAlert });
      } catch (err) {
        console.error('Failed to process recovered Google Play purchase:', err);
      }
    }
  };

  const finalizePurchase = async (purchase, purchaseType) => {
    const token = getPurchaseToken(purchase);
    const isConsumable = purchaseType === 'product';

    await AsyncStorage.setItem(
      PENDING_PURCHASE_FINISH_STORAGE_KEY,
      JSON.stringify({
        token,
        isConsumable,
      }),
    );

    try {
      await GoogleBilling.acknowledgePurchase(purchase, {
        isConsumable,
      });
    } finally {
      const pendingFinishRaw = await AsyncStorage.getItem(
        PENDING_PURCHASE_FINISH_STORAGE_KEY,
      );
      const pendingFinish = pendingFinishRaw ? JSON.parse(pendingFinishRaw) : null;
      if (pendingFinish?.token === token) {
        await AsyncStorage.removeItem(PENDING_PURCHASE_FINISH_STORAGE_KEY);
      }
    }
  };

  const handlePurchase = async (
    purchase,
    { acknowledge = true, showSuccessAlert = true } = {},
  ) => {
    const token = getPurchaseToken(purchase);

    if (!token) {
      console.warn('Missing Google Play purchase token:', purchase);
      return false;
    }

    if (!isCompletedAndroidPurchase(purchase)) {
      console.log('Purchase not completed yet:', purchase.purchaseStateAndroid, purchase);
      return false;
    }

    if (processedTokensRef.current.has(token) || processingTokensRef.current.has(token)) {
      return false;
    }

    processingTokensRef.current.add(token);
    setLastReference(token);

    try {
      await AsyncStorage.setItem(LAST_PURCHASE_TOKEN_STORAGE_KEY, token);

      const packageName = getAndroidPackageName();
      const { productId, purchaseType, purchaseKind, purchaseBillingCycle } =
        getPurchaseVerificationMeta(purchase);

      const result = await api.post('/billing/verify/google', {
        packageName,
        productId,
        purchaseToken: token,
        purchaseType,
        ...(purchaseType === 'product' && {
          purchaseKind,
          billingCycle: purchaseBillingCycle,
        }),
        workspaceId: currentWorkspaceIdRef.current,
      });

      if (!result?.verified) {
        throw new Error(result?.error || 'Google Play verification failed.');
      }

      await AsyncStorage.setItem(LAST_PURCHASE_TOKEN_STORAGE_KEY, token);
      await refreshBilling();

      if (acknowledge) {
        await finalizePurchase(purchase, purchaseType);
      }

      if (showSuccessAlert) {
        Alert.alert(
          'Success',
          purchaseType === 'product' ? 'Add-on activated' : 'Subscription activated',
        );
      }

      processingTokensRef.current.delete(token);
      processedTokensRef.current.add(token);
      return true;
    } catch (err) {
      processingTokensRef.current.delete(token);
      console.error('Google Play verification failed:', err);
      throw err;
    }
  };

  handlePurchaseRef.current = handlePurchase;
  handleRecoveredPurchasesRef.current = handleRecoveredPurchases;

  const refreshBilling = async () => {
    // If no current workspace, fetch user-level subscription and global plans
    let workspaceId = currentWorkspace?.id;
    
    try {
      const [plansResp, subRes] = await Promise.all([
        api.get('/billing/plans'),
        workspaceId 
          ? api.get(`/billing/workspaces/${workspaceId}/context`)
          : api.get('/billing/subscription'), // Get user-level subscription if no workspace
      ]);
      const normalizedPlans = normalizePlansResponse(plansResp);
      setOnlineRequired(false);
      setPlans(normalizedPlans);
      
      // For workspace context, use the fetched workspace billing
      // For user context, use subscription directly
      const billingCtx = workspaceId ? subRes : (subRes ? { plan: subRes.plan, billingCycle: subRes.billingCycle || 'monthly', ...subRes } : {});
      
      setSubscription(billingCtx);
      setWorkspaceBilling(billingCtx);
      setUsage({
        whatsappMessagesUsedThisMonth:
          billingCtx?.usage?.whatsappMessagesUsedThisMonth ?? 0,
        limits: billingCtx?.limits || {},
      });
      setSelectedPlan(billingCtx?.plan || 'pro');
      setBillingCycle(billingCtx?.billingCycle || 'monthly');
      
      if (workspaceId) {
        try {
          await offlineStore.cacheBillingContext(workspaceId, billingCtx);
        } catch {
          // ignore cache errors
        }
      }
      await loadPlayProducts();
    } catch (err) {
      throw err;
    }
  };

  const retryBillingLoad = async () => {
    try {
      setLoading(true);
      await refreshBilling();
    } catch (err) {
      if (isLikelyOfflineError(err)) {
        setOnlineRequired(true);
        return;
      }
      Alert.alert('Billing', err?.message || 'Unable to load billing details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      setLoading(true);
      try {
        await refreshBilling();
      } catch (err) {
        if (!mounted) return;
        if (isLikelyOfflineError(err)) {
          setOnlineRequired(true);
        } else {
          Alert.alert('Billing', err?.message || 'Unable to load billing details.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    run();

    return () => {
      mounted = false;
    };

  }, [currentWorkspace?.id]);

  useEffect(() => {
    if (!GoogleBilling.isAvailable()) {
      return undefined;
    }

    let active = true;

    const initializeGoogleBilling = async () => {
      try {
        await GoogleBilling.initPurchaseListeners(
          async (purchase) => {
            await handlePurchaseRef.current?.(purchase);
          },
          (error) => {
            Alert.alert('Purchase failed', error?.message);
          },
        );

        const purchases = await GoogleBilling.restorePurchases();
        if (!active) {
          return;
        }

        await handleRecoveredPurchasesRef.current?.(purchases, {
          acknowledge: true,
          showSuccessAlert: false,
        });
      } catch (err) {
        console.error('Failed to initialize Google Billing:', err);
      }
    };

    initializeGoogleBilling();

    return () => {
      active = false;
      GoogleBilling.removeListeners();
      GoogleBilling.disconnect().catch(() => null);
    };
  }, []);

  // When screen regains focus (e.g., after purchase), refresh subscription
  useEffect(() => {
    if (!navigation) return;

    const unsubscribe = navigation.addListener('focus', async () => {
      try {
        await refreshBilling();
      } catch (err) {
        console.error('Failed to refresh billing after focus:', err);
      }
    });

    return unsubscribe;
  }, [navigation, currentWorkspace?.id]);

  const totalAmount = useMemo(() => {
    if (!plans) return 0;
    const yearly = billingCycle === 'yearly';
    const planPrice = yearly
      ? selectedPlan === 'pro'
        ? plans?.pro?.pricing?.yearly || Math.round(7000 * 12 * 0.8)
        : plans?.basic?.pricing?.yearly || Math.round(2500 * 12 * 0.8)
      : selectedPlan === 'pro'
        ? plans?.pro?.pricing?.monthly || 7000
        : plans?.basic?.pricing?.monthly || 2500;

    return applyPlayMarkup(planPrice);
  }, [plans, selectedPlan, billingCycle]);

  const toggleAddon = (key) => {
    setSelectedAddons((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const notifyOwner = async () => {
    if (!currentWorkspace?.id) return;
    if (onlineRequired) {
      Alert.alert(
        'Internet required',
        'Connect to the internet to send a renewal reminder to the workspace owner.',
      );
      return;
    }

    try {
      setProcessing(true);
      await api.post(
        `/billing/workspaces/${currentWorkspace.id}/remind-owner`,
        {},
      );
      Alert.alert(
        'Reminder sent',
        'We emailed the workspace owner to renew this subscription.',
      );
    } catch (err) {
      Alert.alert(
        'Unable to send reminder',
        err?.message || 'Please try again later.',
      );
    } finally {
      setProcessing(false);
    }
  };

  const startCheckout = async () => {
    Alert.alert(
      'Free Testing Mode',
      'Billing is disabled for early testing. All features are available to everyone.'
    );
  };

  const startAddonCheckout = async () => {
    Alert.alert(
      'Free Testing Mode',
      'Billing is disabled for early testing. All features are available to everyone.'
    );
  };

  const verifyPayment = async () => {
    if (onlineRequired) {
      Alert.alert(
        'Internet required',
        'Billing requires internet connection. Come online to verify payment.',
      );
      return;
    }
    try {
      setProcessing(true);
      // Pause auto-lock while calling restorePurchases (may take time)
      setPauseAutoLock(true);
      const persistedReference =
        lastReference || (await AsyncStorage.getItem(LAST_PURCHASE_TOKEN_STORAGE_KEY));

      if (Platform.OS !== 'android' || !GoogleBilling.isAvailable()) {
        throw new Error(
          'Google Play Billing verification is only available on Android builds.',
        );
      }

      const preferredSku = resolveSubscriptionSku(selectedPlan, billingCycle);
      const purchases = (await GoogleBilling.restorePurchases()).filter(
        isCompletedAndroidPurchase,
      );

      if (!purchases.length && !persistedReference) {
        Alert.alert(
          'Verification',
          'No recent Google Play purchase was found yet. Start checkout first.',
        );
        return;
      }

      const matchedPurchase =
        purchases.find((purchase) => getPurchaseProductId(purchase) === preferredSku) ||
        purchases.find(
          (purchase) =>
            persistedReference && getPurchaseToken(purchase) === persistedReference,
        ) ||
        purchases[0];

      if (!matchedPurchase) {
        throw new Error('No Google Play subscription purchase was found to verify.');
      }

      if (persistedReference) {
        setLastReference(persistedReference);
        await AsyncStorage.setItem(LAST_PURCHASE_TOKEN_STORAGE_KEY, persistedReference);
      }

      const matchedProductId = getPurchaseProductId(matchedPurchase, preferredSku);
      await handlePurchase(
        {
          ...matchedPurchase,
          productId: matchedProductId,
        },
        {
          acknowledge: true,
          showSuccessAlert: false,
        },
      );

      Alert.alert('Success', 'Subscription verified and updated from Google Play.');
    } catch (err) {
      if (isLikelyOfflineError(err)) {
        setOnlineRequired(true);
      }
      Alert.alert(
        'Verification failed',
        err?.message || 'Unable to verify payment now.',
      );
    } finally {
      setProcessing(false);
      // Re-enable auto-lock after payment verification completes
      setPauseAutoLock(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  if (onlineRequired) {
    return (
      <View
        style={[
          styles.center,
          { backgroundColor: theme.colors.background, padding: 16 },
        ]}
      >
        <Card style={{ width: '100%', maxWidth: 520 }}>
          <Title>Subscription & Billing</Title>
          <Text
            style={[
              styles.onlineRequiredText,
              { color: theme.colors.textSecondary },
            ]}
          >
            Billing is online-only. Connect to the internet to renew, upgrade,
            verify payment, or view live usage for this workspace.
          </Text>
          <AppButton
            title="Try Again"
            onPress={retryBillingLoad}
            style={{ marginTop: 12 }}
          />
          <AppButton
            title="Back"
            variant="secondary"
            onPress={() => navigation.goBack()}
            style={{ marginTop: 10 }}
          />
        </Card>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={{ padding: 16 }}
    >
      <View style={styles.headerRow}>
        <Title>Subscription & Billing</Title>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons
            name="close"
            size={22}
            color={theme.colors.textPrimary}
          />
        </TouchableOpacity>
      </View>

      <Card>
        <Text
          style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}
        >
          Current status
        </Text>
        {subscription?.currentPeriodEndsAt ? (
          <>
            <Text style={[styles.meta, { color: theme.colors.textSecondary }]}>
              Plan: {(subscription?.plan || 'basic').toUpperCase()}
            </Text>
            <Text style={[styles.meta, { color: theme.colors.textSecondary }]}>
              Status: {(subscription?.status || 'active').toUpperCase()}
            </Text>
            <Text style={[styles.meta, { color: theme.colors.textSecondary }]}>
              Billing cycle: {(subscription?.billingCycle || billingCycle).toUpperCase()}
            </Text>
            {subscription?.status === 'trialing' && (
              <Text style={[styles.meta, { color: theme.colors.textSecondary }]}>
                Trial days left: {trialDaysLeft}
              </Text>
            )}
            <Text style={[styles.meta, { color: theme.colors.textSecondary }]}>
              Renews / ends:{' '}
              {new Date(subscription.currentPeriodEndsAt).toLocaleDateString()}
            </Text>
            <Text style={[styles.meta, { color: theme.colors.textSecondary }]}>
              Workspace usage: {workspaceCount}/{usage?.limits?.workspaceLimit ?? 0}
            </Text>
          </>
        ) : (
          <Text style={[styles.meta, { color: theme.colors.textSecondary }]}>
            No active subscription. Select a plan below to get started.
          </Text>
        )}
      </Card>

      <Card>
        <Text
          style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}
        >
          Choose plan
        </Text>
        <View style={styles.cycleSwitcher}>
          {['monthly', 'yearly'].map((cycle) => {
            const active = billingCycle === cycle;
            return (
              <TouchableOpacity
                key={cycle}
                style={[
                  styles.cycleChip,
                  {
                    backgroundColor: active
                      ? theme.colors.primary
                      : 'transparent',
                    borderColor: active
                      ? theme.colors.primary
                      : theme.colors.border,
                  },
                ]}
                onPress={() => setBillingCycle(cycle)}
              >
                <Text
                  style={{
                    color: active ? '#fff' : theme.colors.textPrimary,
                    fontWeight: '700',
                    fontSize: 12,
                  }}
                >
                  {cycle === 'yearly' ? 'Yearly (20% off)' : 'Monthly'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {PLAN_ORDER.map((planKey) => {
          const active = selectedPlan === planKey;
          const basePrice =
            billingCycle === 'yearly'
              ? planKey === 'pro'
                ? plans?.pro?.pricing?.yearly || Math.round(7000 * 12 * 0.8)
                : plans?.basic?.pricing?.yearly || Math.round(2500 * 12 * 0.8)
              : planKey === 'pro'
                ? plans?.pro?.pricing?.monthly || 7000
                : plans?.basic?.pricing?.monthly || 2500;
          const price = applyPlayMarkup(basePrice);
          const sku = resolveSubscriptionSku(planKey, billingCycle);
          const playProduct = playProducts[sku];
          const playPrice =
            playProduct?.displayPrice ||
            playProduct?.localizedPrice ||
            playProduct?.subscriptionOfferDetails?.[0]?.pricingPhases
              ?.pricingPhaseList?.[0]?.formattedPrice ||
            `NGN ${price.toLocaleString()}`;

          return (
            <TouchableOpacity
              key={planKey}
              style={[
                styles.planItem,
                {
                  borderColor: active
                    ? theme.colors.primary
                    : theme.colors.border,
                  backgroundColor: active
                    ? `${theme.colors.primary}15`
                    : 'transparent',
                },
              ]}
              onPress={() => setSelectedPlan(planKey)}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.planTitle, { color: theme.colors.textPrimary }]}
                >
                  {planKey.toUpperCase()}
                </Text>
                <Text
                  style={[styles.planPrice, { color: theme.colors.textSecondary }]}
                >
                  {playPrice}/{billingCycle === 'yearly' ? 'year' : 'month'}
                </Text>
              </View>
              {active ? (
                <MaterialIcons
                  name="check-circle"
                  size={20}
                  color={theme.colors.primary}
                />
              ) : null}
            </TouchableOpacity>
          );
        })}
      </Card>

      <Card>
        <Text
          style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}
        >
          Pro add-ons
        </Text>
        {selectedPlan !== 'pro' ? (
          <Text
            style={[
              styles.meta,
              { color: theme.colors.textSecondary, marginBottom: 8 },
            ]}
          >
            Upgrade to Pro plan to enable add-ons.
          </Text>
        ) : subscription?.status === 'trialing' && trialDaysLeft > 0 ? (
          <>
            <Text
              style={[
                styles.meta,
                { color: theme.colors.textSecondary, marginBottom: 12 },
              ]}
            >
              Add extra capacity to your Pro subscription. Each add-on is a separate purchase.
            </Text>
            <AppButton
              title="Browse Add-ons"
              variant="secondary"
              onPress={() => setShowAddonModal(true)}
              disabled={processing}
            />
          </>
        ) : (
          <Text
            style={[
              styles.meta,
              { color: theme.colors.textSecondary, marginBottom: 8 },
            ]}
          >
            Add-ons are available after purchasing a plan.
          </Text>
        )}
      </Card>

      <Card>
        <Text
          style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}
        >
          Usage dashboard
        </Text>
        <Text style={[styles.meta, { color: theme.colors.textSecondary }]}>
          Workspace: {workspaceCount}/{usage?.limits?.workspaceLimit ?? 0}
        </Text>
        <Text style={[styles.meta, { color: theme.colors.textSecondary }]}>
          Staff seats limit: {usage?.limits?.staffSeatLimit ?? 0}
        </Text>
        <Text style={[styles.meta, { color: theme.colors.textSecondary }]}>
          WhatsApp: {usage?.whatsappMessagesUsedThisMonth ?? 0}/
          {usage?.limits?.whatsappMonthlyQuota ?? 0}
        </Text>
        {usage?.automationPaused ? (
          <Text style={[styles.meta, { color: theme.colors.warning }]}>
            Automation paused: {usage?.reason}
          </Text>
        ) : null}
      </Card>

      <Card>
        <Text style={[styles.total, { color: theme.colors.textPrimary }]}>
          Total: NGN {totalAmount.toLocaleString()} /{' '}
          {billingCycle === 'yearly' ? 'year' : 'month'}
        </Text>
        <AppButton
          title={
            processing
              ? 'Processing...'
              : Platform.OS === 'android'
                ? 'Buy with Google Play'
                : 'Google Play required'
          }
          icon="payments"
          onPress={startCheckout}
          loading={processing}
          disabled={processing || !isWorkspaceOwner}
        />
        <AppButton
          title="Verify last purchase"
          variant="secondary"
          onPress={verifyPayment}
          disabled={processing || !isWorkspaceOwner}
          style={{ marginTop: 10 }}
        />
      </Card>

      {/* Addon Selection Modal */}
      {showAddonModal && (
        <View style={[styles.modal, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.colors.background },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text
                style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}
              >
                Add-ons for your Pro plan
              </Text>
              <TouchableOpacity onPress={() => setShowAddonModal(false)}>
                <MaterialIcons
                  name="close"
                  size={24}
                  color={theme.colors.textPrimary}
                />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16 }}>
              <Text
                style={[
                  styles.meta,
                  { color: theme.colors.textSecondary, marginBottom: 16 },
                ]}
              >
                Select the add-ons you'd like to purchase. Each add-on is a separate charge.
              </Text>

              {[
                { key: 'workspaceSlot', label: 'Extra workspace slot', unit: 1500 },
                { key: 'staffSeat', label: 'Extra staff seat', unit: 500 },
                {
                  key: 'whatsappBundle',
                  label: 'WhatsApp bundle (100 msgs)',
                  unit: 2000,
                },
              ].map((addon) => {
                const price = applyPlayMarkup(
                  billingCycle === 'yearly'
                    ? Math.round(addon.unit * 12 * 0.8)
                    : addon.unit,
                );
                const isSelected = selectedAddons[addon.key];
                return (
                  <TouchableOpacity
                    key={addon.key}
                    style={[
                      styles.addonCheckbox,
                      {
                        borderColor: isSelected
                          ? theme.colors.primary
                          : theme.colors.border,
                        backgroundColor: isSelected
                          ? `${theme.colors.primary}15`
                          : 'transparent',
                      },
                    ]}
                    onPress={() => toggleAddon(addon.key)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.meta,
                          { color: theme.colors.textPrimary, fontWeight: '600' },
                        ]}
                      >
                        {addon.label}
                      </Text>
                      <Text
                        style={[
                          styles.meta,
                          { color: theme.colors.textSecondary },
                        ]}
                      >
                        NGN {price.toLocaleString()} /{' '}
                        {billingCycle === 'yearly' ? 'year' : 'month'}
                      </Text>
                    </View>
                    <MaterialIcons
                      name={isSelected ? 'check-circle' : 'radio-button-unchecked'}
                      size={24}
                      color={
                        isSelected ? theme.colors.primary : theme.colors.border
                      }
                    />
                  </TouchableOpacity>
                );
              })}

              <View style={{ marginTop: 20, gap: 10 }}>
                <AppButton
                  title={processingAddon ? 'Purchasing...' : 'Continue with selected'}
                  onPress={startAddonCheckout}
                  loading={processingAddon}
                  disabled={
                    processingAddon ||
                    !Object.values(selectedAddons).some((v) => v)
                  }
                />
                <AppButton
                  title="Skip add-ons"
                  variant="secondary"
                  onPress={() => setShowAddonModal(false)}
                  disabled={processingAddon}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  onlineRequiredText: { fontSize: 14, lineHeight: 22, marginTop: 10 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  meta: { fontSize: 13, marginBottom: 4 },
  planItem: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  planTitle: { fontSize: 14, fontWeight: '700' },
  planPrice: { fontSize: 12 },
  cycleSwitcher: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  cycleChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  addonRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  counter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  counterValue: {
    minWidth: 24,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
  },
  total: { fontSize: 18, fontWeight: '800', marginBottom: 10 },
  modal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  addonCheckbox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
});
