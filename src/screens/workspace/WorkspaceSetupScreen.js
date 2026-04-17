import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { Card, AppButton, SkeletonBlock } from '../../components/UI';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import * as offlineStore from '../../storage/offlineStore';
import UpgradeModal from '../../components/UpgradeModal';

export default function WorkspaceSetupScreen({ navigation }) {
  const { theme } = useTheme();
  const { setWorkspaces, setCurrentWorkspaceId, refreshWorkspaces } = useWorkspace();
  const { logout, user } = useAuth();
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [inviteCodes, setInviteCodes] = useState({});
  const [inviteLoading, setInviteLoading] = useState(false);
  const [acceptingInviteId, setAcceptingInviteId] = useState(null);
  const [activeMode, setActiveMode] = useState('create');

  React.useEffect(() => {
    if (user?.upgradeRequired) {
      setShowRenewalModal(true);
    }
  }, [user]);

  const { width } = useWindowDimensions();
  const isModal = navigation && navigation.canGoBack();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradePayload, setUpgradePayload] = useState(null);
  const [skeleton, setSkeleton] = useState(true);

  const compact = width < 380;
  const cardWidth = Math.min(width - (compact ? 24 : 36), 520);

  React.useEffect(() => {
    setSkeleton(true);
    const timer = setTimeout(() => setSkeleton(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const loadPendingInvites = React.useCallback(async () => {
    setInviteLoading(true);
    try {
      const invites = await api.get('/workspaces/invites/pending');
      setPendingInvites(Array.isArray(invites) ? invites : []);
    } catch (err) {
      setPendingInvites([]);
    } finally {
      setInviteLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadPendingInvites();
  }, [loadPendingInvites]);

  React.useEffect(() => {
    if (pendingInvites.length > 0) {
      setActiveMode((prev) => (prev === 'create' ? prev : 'invite'));
    } else {
      setActiveMode('create');
    }
  }, [pendingInvites.length]);

  const openUpgradeModal = (payload) => {
    setUpgradePayload(payload || null);
    setShowUpgradeModal(true);
  };

  const handleCreateWorkspace = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Workspace name required', 'Please enter a workspace name.');
      return;
    }

    setLoading(true);
    try {
      try {
        const created = await api.post('/workspaces', {
          name: trimmedName,
          description: description.trim() || undefined,
        });
        const createdId = created?.id;
        if (createdId) {
          setWorkspaces((prev) => {
            const exists = prev.some((item) => item.id === createdId);
            if (exists) return prev;
            return [created, ...prev];
          });
          setCurrentWorkspaceId(createdId);
          if (isModal) navigation.goBack();
          return;
        }
        await refreshWorkspaces();
        if (isModal) navigation.goBack();
        return;
      } catch (err) {
        // Check for business logic errors that should NOT create locally
        const status = err?.response?.status || err?.data?.statusCode;
        const errorCode = err?.data?.code;
        const isBusinessError = status === 403 || status === 400;
        
        if (isBusinessError) {
          // Don't create locally for business logic errors
          if (errorCode === 'SUBSCRIPTION_REQUIRED') {
            Alert.alert(
              'Subscription Required',
              'You need an active subscription to create a workspace. Please select and purchase a plan.',
              [{ text: 'OK', onPress: () => openUpgradeModal() }]
            );
            return;
          }
          if (errorCode === 'PLAN_LIMIT_REACHED') {
            openUpgradeModal(err.data);
            return;
          }
          // Generic business error
          Alert.alert('Unable to create workspace', err?.message || 'Please check your input and try again.');
          return;
        }
        
        // For true network errors only (no response or timeout), create locally
        const isNetworkError = !err?.response && (/network|offline|timeout|fetch/i.test(String(err?.message || '')));
        if (!isNetworkError) {
          // Not a network error and not a business error - show generic error
          Alert.alert('Unable to create workspace', err?.message || 'An unexpected error occurred.');
          return;
        }

        // Create locally for network errors
        const localId = `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;
        const localWorkspace = {
          local_id: localId,
          server_id: null,
          name: trimmedName,
          description: description.trim() || '',
          status: 'active',
          sync_status: 'pending_create',
          last_error: null,
          updated_at_local: Date.now(),
        };
        await offlineStore.executeSql(
          `INSERT OR REPLACE INTO local_workspaces (local_id, server_id, name, description, status, sync_status, last_error, updated_at_local)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            localWorkspace.local_id,
            null,
            localWorkspace.name,
            localWorkspace.description,
            localWorkspace.status,
            localWorkspace.sync_status,
            null,
            localWorkspace.updated_at_local,
          ],
        );
        setWorkspaces((prev) => [localWorkspace, ...prev]);
        setCurrentWorkspaceId(localId);
        await offlineStore.addSyncOutboxAction({
          action_id: `create_workspace_${localId}`,
          action_type: 'create_workspace',
          entity_type: 'workspace',
          entity_local_id: localId,
          workspace_ref: localId,
          payload: {
            name: trimmedName,
            description: description.trim() || '',
          },
          depends_on_action_id: null,
          retry_count: 0,
          next_retry_at: null,
          last_error: null,
          created_at: Date.now(),
          updated_at: Date.now(),
        });
        Alert.alert('Offline', 'Workspace created locally and will sync when online.', [
          { text: 'OK', onPress: () => { if (isModal) navigation.goBack(); } },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvite = async (invite) => {
    const code = String(inviteCodes[invite.id] || '').trim();
    if (!code) {
      Alert.alert('Invite code required', 'Enter the invite code from your email to join this workspace.');
      return;
    }

    setAcceptingInviteId(invite.id);
    try {
      await api.post('/workspaces/invites/accept', {
        inviteId: invite.id,
        code,
      });
      await refreshWorkspaces();
      await loadPendingInvites();
      setInviteCodes((prev) => ({ ...prev, [invite.id]: '' }));
      Alert.alert('Invite accepted', `You have joined ${invite.workspaceName}.`);
    } catch (err) {
      Alert.alert('Unable to accept invite', err?.message || 'Please check the code and try again.');
    } finally {
      setAcceptingInviteId(null);
    }
  };

  const formatInviteExpiry = (value) => {
    if (!value) return 'No expiry';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'No expiry';
    return `Expires ${date.toLocaleDateString()}`;
  };

  return (
    <>
      {showRenewalModal && (
        <UpgradeModal
          visible={showRenewalModal}
          onClose={() => setShowRenewalModal(false)}
          onUpgrade={() => {
            setShowRenewalModal(false);
            navigation.navigate('Subscription');
          }}
          title="Renewal required"
          message="Your subscription has expired or requires renewal. Please upgrade your plan to continue."
          plan={user?.plan}
          limit={null}
          current={null}
        />
      )}
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={{ width: '100%' }}
          contentContainerStyle={{ alignItems: 'center', paddingVertical: 18 }}
          keyboardShouldPersistTaps="handled"
        >
          <Card style={{ width: cardWidth }}>
            {isModal && (
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.closeButton}
                accessibilityLabel="Close setup"
                accessibilityRole="button"
              >
                <MaterialIcons name="close" size={22} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            )}
            <View style={styles.iconWrap}>
              <MaterialIcons name="business" size={30} color={theme.colors.primary} />
            </View>

            {skeleton ? (
              <>
                <SkeletonBlock height={28} width={180} style={{ marginBottom: 8 }} />
                <SkeletonBlock height={16} width={220} style={{ marginBottom: 18 }} />
                <SkeletonBlock height={14} width={120} style={{ marginBottom: 6 }} />
                <SkeletonBlock height={44} width="100%" style={{ marginBottom: 10 }} />
                <SkeletonBlock height={14} width={120} style={{ marginBottom: 6 }} />
                <SkeletonBlock height={44} width="100%" style={{ marginBottom: 18 }} />
                <SkeletonBlock height={44} width="100%" style={{ marginBottom: 10 }} />
              </>
            ) : (
              <>
                {pendingInvites.length > 0 ? (
                  <>
                    <Text
                      style={[styles.title, { color: theme.colors.textPrimary, fontSize: compact ? 21 : 24 }]}
                      accessibilityRole="header"
                    >
                      Get started
                    </Text>
                    <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                      Choose whether to join an invited workspace or start a new one.
                    </Text>
                    <View style={styles.modeRow}>
                      <TouchableOpacity
                        style={[
                          styles.modeButton,
                          {
                            borderColor: activeMode === 'invite' ? theme.colors.primary : theme.colors.border,
                            backgroundColor: activeMode === 'invite' ? `${theme.colors.primary}12` : theme.colors.background,
                          },
                        ]}
                        onPress={() => setActiveMode('invite')}
                      >
                        <Text style={[styles.modeTitle, { color: theme.colors.textPrimary }]}>Accept Workspace Invite</Text>
                        <Text style={[styles.modeSubtitle, { color: theme.colors.textSecondary }]}>
                          Join an existing workspace with your email invite code
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.modeButton,
                          {
                            borderColor: activeMode === 'create' ? theme.colors.primary : theme.colors.border,
                            backgroundColor: activeMode === 'create' ? `${theme.colors.primary}12` : theme.colors.background,
                          },
                        ]}
                        onPress={() => setActiveMode('create')}
                      >
                        <Text style={[styles.modeTitle, { color: theme.colors.textPrimary }]}>Create New Workspace</Text>
                        <Text style={[styles.modeSubtitle, { color: theme.colors.textSecondary }]}>
                          Start your own workspace for a new business setup
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </>
                ) : null}

                {pendingInvites.length > 0 && activeMode === 'invite' ? (
                  <>
                    <Text
                      style={[styles.title, { color: theme.colors.textPrimary, fontSize: compact ? 21 : 24 }]}
                      accessibilityRole="header"
                    >
                      Accept your workspace invite
                    </Text>
                    <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                      Enter the invite code from your email to join.
                    </Text>
                    {pendingInvites.map((invite) => (
                      <View
                        key={invite.id}
                        style={[
                          styles.inviteCard,
                          {
                            borderColor: theme.colors.border,
                            backgroundColor: theme.colors.background,
                          },
                        ]}
                      >
                        <Text style={[styles.inviteTitle, { color: theme.colors.textPrimary }]}>
                          {invite.workspaceName}
                        </Text>
                        <Text style={[styles.inviteMeta, { color: theme.colors.textSecondary }]}>
                          Role: {invite.role}
                        </Text>
                        <Text style={[styles.inviteMeta, { color: theme.colors.textSecondary }]}>
                          {formatInviteExpiry(invite.expiresAt)}
                        </Text>
                        <TextInput
                          style={[styles.input, { color: theme.colors.textPrimary, borderColor: theme.colors.border, marginTop: 10 }]}
                          placeholder="Enter invite code"
                          placeholderTextColor={theme.colors.textSecondary}
                          value={inviteCodes[invite.id] || ''}
                          onChangeText={(value) => setInviteCodes((prev) => ({ ...prev, [invite.id]: value }))}
                          keyboardType="number-pad"
                        />
                        <AppButton
                          title={acceptingInviteId === invite.id ? 'Accepting...' : 'Accept Invite'}
                          onPress={() => handleAcceptInvite(invite)}
                          loading={acceptingInviteId === invite.id}
                          disabled={acceptingInviteId === invite.id}
                          style={{ marginTop: 10 }}
                        />
                      </View>
                    ))}
                    <AppButton
                      title={inviteLoading ? 'Refreshing...' : 'Refresh Invites'}
                      onPress={loadPendingInvites}
                      variant="secondary"
                      loading={inviteLoading}
                      style={{ marginTop: 8 }}
                    />
                  </>
                ) : (
                  <>
                    <Text
                      style={[styles.title, { color: theme.colors.textPrimary, fontSize: compact ? 21 : 24 }]}
                      accessibilityRole="header"
                    >
                      {pendingInvites.length > 0 ? 'Create a new workspace' : 'Create your first workspace'}
                    </Text>
                    <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                      {pendingInvites.length > 0
                        ? 'If this account should start a separate business workspace, create it below.'
                        : 'You need at least one workspace before recording sales, inventory, and debts.'}
                    </Text>

                    <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Workspace name *</Text>
                    <TextInput
                      style={[styles.input, { color: theme.colors.textPrimary, borderColor: theme.colors.border }]}
                      placeholder="e.g. Main Store"
                      placeholderTextColor={theme.colors.textSecondary}
                      value={name}
                      onChangeText={setName}
                      accessibilityLabel="Workspace name"
                      accessibilityHint="Enter a name for your workspace"
                      returnKeyType="done"
                      autoFocus
                    />

                    <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Description (optional)</Text>
                    <TextInput
                      style={[styles.input, styles.textArea, { color: theme.colors.textPrimary, borderColor: theme.colors.border }]}
                      placeholder="Small note about this workspace"
                      placeholderTextColor={theme.colors.textSecondary}
                      value={description}
                      onChangeText={setDescription}
                      multiline
                      numberOfLines={3}
                      accessibilityLabel="Workspace description"
                      accessibilityHint="Enter a description for your workspace"
                    />

                    <AppButton
                      title="Create Workspace"
                      onPress={handleCreateWorkspace}
                      loading={loading}
                      disabled={loading}
                      style={{ marginTop: 14 }}
                      accessibilityLabel="Create workspace button"
                      accessibilityRole="button"
                    />
                  </>
                )}

                {!isModal && (
                  <AppButton
                    title="Sign out"
                    onPress={logout}
                    variant="secondary"
                    style={{ marginTop: 10 }}
                    accessibilityLabel="Sign out button"
                    accessibilityRole="button"
                  />
                )}
              </>
            )}
          </Card>
        </ScrollView>

        <UpgradeModal
          visible={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          onUpgrade={() => {
            setShowUpgradeModal(false);
            navigation.navigate('Subscription');
          }}
          title="Workspace limit reached"
          message={upgradePayload?.message || 'Your current plan workspace limit has been reached. Upgrade to continue.'}
          plan={upgradePayload?.meta?.plan || user?.plan}
          limit={upgradePayload?.meta?.limit}
          current={upgradePayload?.meta?.current}
        />
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 4,
    marginBottom: 4,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(59,130,246,0.12)',
    marginBottom: 12,
  },
  title: {
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    marginTop: 6,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  textArea: {
    minHeight: 86,
    textAlignVertical: 'top',
  },
  inviteCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  inviteTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  inviteMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  modeRow: {
    gap: 10,
    marginBottom: 18,
  },
  modeButton: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  modeTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  modeSubtitle: {
    fontSize: 12,
    lineHeight: 18,
  },
});
