import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './src/theme/ThemeContext';
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

const Stack = createNativeStackNavigator();

function RootNavigator() {
  const { user, loading, requiresReAuth } = useAuth();
  const { workspaces, loading: loadingWorkspaces, workspaceAccessBlocked } = useWorkspace();

  if (loading || (user && loadingWorkspaces && !requiresReAuth)) {
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
