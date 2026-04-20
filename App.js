import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, Text, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { WorkspaceProvider, useWorkspace } from './src/context/WorkspaceContext';
import MainTabs from './src/navigation/MainTabs';
import AuthStack from './src/navigation/AuthStack';
import ReAuthStack from './src/navigation/ReAuthStack';
import WorkspaceSetupScreen from './src/screens/workspace/WorkspaceSetupScreen';
import WorkspaceAccessBlockedScreen from './src/screens/workspace/WorkspaceAccessBlockedScreen';
import WorkspaceInvitesScreen from './src/screens/workspace/WorkspaceInvitesScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import SubscriptionScreen from './src/screens/billing/SubscriptionScreen';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { CustomerSelectProvider } from './src/context/CustomerSelectContext';
import { initDb } from './src/storage/sqlite';
import { api } from './src/api/client';

const Stack = createNativeStackNavigator();

// Screen for staff/managers to contact owner for subscription renewal
function SubscriptionContactOwnerScreen({ navigation }) {
  const { theme } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <View style={{ alignItems: 'center' }}>
        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: theme.colors.primary + '20', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <Text style={{ fontSize: 40 }}>📧</Text>
        </View>
        <Text style={{ fontSize: 18, fontWeight: '700', color: theme.colors.textPrimary, marginBottom: 8, textAlign: 'center' }}>
          Workspace Subscription Expired
        </Text>
        <Text style={{ fontSize: 14, color: theme.colors.textSecondary, marginBottom: 16, textAlign: 'center' }}>
          The workspace subscription has expired. Please contact the workspace owner to renew it.
        </Text>
        <TouchableOpacity
          onPress={() => navigation.replace('Main')}
          style={{ paddingVertical: 12, paddingHorizontal: 24, backgroundColor: theme.colors.primary, borderRadius: 8 }}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function RootNavigator() {
  const { user, loading, requiresReAuth } = useAuth();
  const { workspaces, loading: loadingWorkspaces, workspaceAccessBlocked } = useWorkspace();
  const [subscription, setSubscription] = useState(null);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [loadingSubscription, setLoadingSubscription] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Expose refresh function for SubscriptionScreen to call after purchase
  const refreshSubscription = async () => {
    setLoadingSubscription(true);
    try {
      const subRes = await api.get('/billing/subscription').catch(() => null);
      setSubscription(subRes);
      // Trigger re-render of this component to update routing
      setRefreshKey((k) => k + 1);
    } catch (err) {
      // Fallback
    } finally {
      setLoadingSubscription(false);
    }
  };

  // Load subscription and pending invites when user logs in
  useEffect(() => {
    if (!user || requiresReAuth || loading) {
      setSubscription(null);
      setPendingInvites([]);
      return;
    }

    const loadSubAndInvites = async () => {
      setLoadingSubscription(true);
      try {
        const [subRes, invitesRes] = await Promise.all([
          api.get('/billing/subscription').catch(() => null),
          api.get('/workspaces/invites/pending').catch(() => []),
        ]);
        setSubscription(subRes);
        setPendingInvites(Array.isArray(invitesRes) ? invitesRes : []);
      } catch (err) {
        // Fallback if backend errors
      } finally {
        setLoadingSubscription(false);
      }
    };

    loadSubAndInvites();
  }, [user, requiresReAuth, loading]);

  // Determine if subscription is active (trialing or active)
  const isSubscriptionActive = subscription?.status === 'active' || subscription?.status === 'trialing';
  const isWorkspaceOwner = user?.role === 'owner' || subscription?.plan; // Owner has plan info

  if (loading || (user && (loadingWorkspaces || loadingSubscription) && !requiresReAuth)) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <Stack.Screen name="Auth" component={AuthStack} />
      ) : requiresReAuth ? (
        <Stack.Screen name="ReAuthFlow" component={ReAuthStack} />
      ) : pendingInvites.length > 0 && workspaces.length === 0 ? (
        // Priority: If user has pending invites and no workspaces, show invite acceptance
        <Stack.Screen name="JoinWorkspace" component={WorkspaceInvitesScreen} />
      ) : !isSubscriptionActive && workspaces.length === 0 ? (
        // Subscription expired and no workspaces
        isWorkspaceOwner ? (
          <Stack.Screen name="Subscription" component={SubscriptionScreen} />
        ) : (
          <Stack.Screen name="SubscriptionContactOwner" component={SubscriptionContactOwnerScreen} />
        )
      ) : workspaces.length === 0 ? (
        <Stack.Screen name="WorkspaceSetup" component={WorkspaceSetupScreen} />
      ) : workspaceAccessBlocked ? (
        <>
          <Stack.Screen name="WorkspaceAccessBlocked" component={WorkspaceAccessBlockedScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} options={{ presentation: 'modal' }} />
          <Stack.Screen name="Subscription" component={SubscriptionScreen} options={{ presentation: 'modal' }} />
          <Stack.Screen name="CreateWorkspace" component={WorkspaceSetupScreen} options={{ presentation: 'modal' }} />
          <Stack.Screen name="JoinWorkspace" component={WorkspaceInvitesScreen} options={{ presentation: 'modal' }} />
        </>
      ) : (
        <Stack.Screen name="Main" component={MainTabs} />
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  useEffect(() => {
    initDb().catch(() => {
      // Keep app boot resilient if local SQLite is temporarily unavailable.
    });
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeProvider>
          <WorkspaceProvider>
            <CustomerSelectProvider>
              <NavigationContainer>
                <RootNavigator />
              </NavigationContainer>
            </CustomerSelectProvider>
          </WorkspaceProvider>
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
