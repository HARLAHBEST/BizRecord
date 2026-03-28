import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useAuth } from '../../context/AuthContext';
import { AppButton } from '../../components/UI';

const normalizeStatusLabel = (status) => {
  const value = String(status || 'inactive').replace(/_/g, ' ').trim();
  return value.charAt(0).toUpperCase() + value.slice(1);
};

export default function WorkspaceAccessBlockedScreen({ navigation }) {
  const { theme } = useTheme();
  const { currentWorkspace } = useWorkspace();
  const { logout } = useAuth();
  const workspaceName = currentWorkspace?.name || 'This workspace';
  const statusLabel = normalizeStatusLabel(currentWorkspace?.status);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <View style={[styles.iconWrap, { backgroundColor: `${theme.colors.warning}18` }]}>
          <MaterialIcons name="lock-clock" size={28} color={theme.colors.warning} />
        </View>
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Workspace access paused</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          {workspaceName} is currently {statusLabel.toLowerCase()}. Connect to the internet and renew the workspace billing to continue using sales, inventory, debt, branch, and analytics screens.
        </Text>
        <AppButton title="Open Settings" onPress={() => navigation.navigate('Settings')} style={{ marginTop: 8 }} />
        <AppButton title="Open Billing" onPress={() => navigation.navigate('Subscription')} variant="secondary" style={{ marginTop: 10 }} />
        <AppButton title="Sign Out" onPress={logout} variant="ghost" style={{ marginTop: 10 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    borderWidth: 1,
    borderRadius: 20,
    padding: 24,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 8,
  },
});
