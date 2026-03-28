import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { api } from '../../api/client';
import * as offlineStore from '../../storage/offlineStore';
import { Card, Title, AppButton } from '../../components/UI';
import UpgradeModal from '../../components/UpgradeModal';
import { MaterialIcons } from '@expo/vector-icons';

export default function BranchCreateScreen({ navigation }) {
  const themeContext = useTheme();
  const theme = themeContext.theme;
  const { currentWorkspaceId, setWorkspaces } = useWorkspace();

  const [branchName, setBranchName] = useState('');
  const [location, setLocation] = useState('');
  const [managerEmail, setManagerEmail] = useState('');
  const [selectedManager, setSelectedManager] = useState(null);
  const [managerSearchMessage, setManagerSearchMessage] = useState('');
  const [managerSearchState, setManagerSearchState] = useState('idle');
  const [managerSearchLoading, setManagerSearchLoading] = useState(false);
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradePayload, setUpgradePayload] = useState(null);

  const getErrorMessage = (err, fallback) => {
    const raw = err?.message ?? fallback;
    if (Array.isArray(raw)) return raw.join(', ');
    if (typeof raw === 'string') return raw;
    return fallback;
  };

  const handleFindManager = async () => {
    const email = managerEmail.trim().toLowerCase();
    if (!email) {
      Alert.alert('Validation Error', 'Enter manager email first');
      return;
    }

    if (!currentWorkspaceId) {
      Alert.alert('Workspace required', 'Please select a workspace before assigning manager');
      return;
    }

    setManagerSearchLoading(true);
    setManagerSearchMessage('');
    setManagerSearchState('idle');
    try {
      let user;
      try {
        user = await api.get(`/workspaces/${currentWorkspaceId}/users/search`, { email });
      } catch (searchErr) {
        // Backward-compatible fallback route
        user = await api.get(`/workspaces/${currentWorkspaceId}/users/email/${encodeURIComponent(email)}`);
      }
      setSelectedManager(user);
      setManagerSearchState('success');
      setManagerSearchMessage(`Manager selected: ${user.name} (${user.email})`);
    } catch (err) {
      setSelectedManager(null);
      setManagerSearchState('error');
      setManagerSearchMessage(getErrorMessage(err, 'No user found with this email'));
    } finally {
      setManagerSearchLoading(false);
    }
  };

  const handleCreateBranch = async () => {
    if (!branchName || !location) {
      Alert.alert('Validation Error', 'Please fill in branch name and location');
      return;
    }

    if (!currentWorkspaceId) {
      Alert.alert('Workspace required', 'Please select a workspace before creating a branch');
      return;
    }

    setLoading(true);
    try {
      if (managerEmail.trim() && !selectedManager) {
        Alert.alert('Manager required', 'Please find and select a valid manager account before creating the branch');
        setLoading(false);
        return;
      }

      await api.post('/workspaces', {
        name: branchName.trim(),
        description: [location, phone, address].filter(Boolean).join(' | '),
        parentWorkspaceId: currentWorkspaceId,
        managerUserId: selectedManager?.id,
      });

      Alert.alert('Branch Created', `${branchName} - ${location}`, [
        {
          text: 'OK',
          onPress: () => {
            navigation.goBack();
          },
        },
      ]);
    } catch (err) {
      if (err?.data?.code === 'PLAN_LIMIT_REACHED') {
        setUpgradePayload(err.data);
        setShowUpgradeModal(true);
        return;
      }
      if (!err?.response) {
        if (managerEmail.trim() && !selectedManager) {
          Alert.alert('Manager required', 'Manager lookup needs internet. Clear the manager field or reconnect first.');
          return;
        }

        const localId = `local_branch_${Date.now()}_${Math.random().toString(16).slice(2)}`;
        const localBranch = {
          id: localId,
          local_id: localId,
          server_id: null,
          name: branchName.trim(),
          description: [location, phone, address].filter(Boolean).join(' | '),
          parentWorkspaceId: currentWorkspaceId,
          managerUser: selectedManager
            ? {
                name: selectedManager.name,
                email: selectedManager.email,
              }
            : null,
          status: 'active',
          role: 'manager',
          sync_status: 'pending_create',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await offlineStore.executeSql(
          `INSERT OR REPLACE INTO local_workspaces (local_id, server_id, name, description, parent_workspace_id, role, manager_user_name, manager_user_email, status, sync_status, last_error, updated_at_local)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            localId,
            null,
            localBranch.name,
            localBranch.description,
            currentWorkspaceId,
            localBranch.role,
            localBranch.managerUser?.name || null,
            localBranch.managerUser?.email || null,
            localBranch.status,
            localBranch.sync_status,
            null,
            Date.now(),
          ],
        );
        setWorkspaces((prev) => [localBranch, ...(prev || [])]);
        await offlineStore.addSyncOutboxAction({
          action_id: `create_workspace_${localId}`,
          action_type: 'create_workspace',
          entity_type: 'workspace',
          entity_local_id: localId,
          workspace_ref: localId,
          payload: {
            name: localBranch.name,
            description: localBranch.description,
            parentWorkspaceId: currentWorkspaceId,
            managerUserId: selectedManager?.id || undefined,
          },
          created_at: Date.now(),
          updated_at: Date.now(),
        });

        Alert.alert('Offline', 'Branch saved locally and will sync when you come back online.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
        return;
      }
      Alert.alert('Error', getErrorMessage(err, 'Unable to create branch'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={{ padding: 16 }}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <Title>Create Branch</Title>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name="close" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Branch Details Card */}
        <Card style={{ marginBottom: 16 }}>
          <Text style={{ color: theme.colors.textSecondary, fontSize: 12, marginBottom: 8 }}>Branch Name *</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.card,
                color: theme.colors.textPrimary,
                borderColor: theme.colors.border,
              },
            ]}
            placeholder="e.g., Downtown Store"
            placeholderTextColor={theme.colors.textSecondary}
            value={branchName}
            onChangeText={setBranchName}
          />

          <Text style={{ color: theme.colors.textSecondary, fontSize: 12, marginBottom: 8, marginTop: 12 }}>Location *</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.card,
                color: theme.colors.textPrimary,
                borderColor: theme.colors.border,
              },
            ]}
            placeholder="e.g., Main City"
            placeholderTextColor={theme.colors.textSecondary}
            value={location}
            onChangeText={setLocation}
          />

          <Text style={{ color: theme.colors.textSecondary, fontSize: 12, marginBottom: 8, marginTop: 12 }}>Branch Manager Email</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.card,
                color: theme.colors.textPrimary,
                borderColor: theme.colors.border,
              },
            ]}
            placeholder="manager@email.com"
            placeholderTextColor={theme.colors.textSecondary}
            value={managerEmail}
            onChangeText={(value) => {
              setManagerEmail(value);
              setSelectedManager(null);
              setManagerSearchMessage('');
              setManagerSearchState('idle');
            }}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <AppButton
            title={managerSearchLoading ? 'Checking…' : 'Find Manager'}
            icon="person-search"
            variant="secondary"
            onPress={handleFindManager}
            loading={managerSearchLoading}
            style={styles.findManagerButton}
          />
          {managerSearchMessage ? (
            <View style={[
              styles.searchStatus,
              {
                borderColor: managerSearchState === 'success' ? theme.colors.success : theme.colors.error,
                backgroundColor: managerSearchState === 'success' ? `${theme.colors.success}15` : `${theme.colors.error}15`,
              },
            ]}>
              <MaterialIcons
                name={managerSearchState === 'success' ? 'check-circle' : 'error'}
                size={16}
                color={managerSearchState === 'success' ? theme.colors.success : theme.colors.error}
              />
              <Text style={{
                flex: 1,
                marginLeft: 8,
                color: managerSearchState === 'success' ? theme.colors.success : theme.colors.error,
                fontSize: 12,
                fontWeight: '600',
              }}>
                {managerSearchMessage}
              </Text>
            </View>
          ) : null}
          {selectedManager ? (
            <View style={[styles.managerCard, { borderColor: theme.colors.border, backgroundColor: theme.colors.card }]}> 
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.colors.textPrimary, fontWeight: '700' }}>{selectedManager.name}</Text>
                  <Text style={{ color: theme.colors.textSecondary }}>{selectedManager.email}</Text>
                </View>
                <View style={{
                  borderRadius: 999,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  backgroundColor: selectedManager.alreadyMember ? `${theme.colors.success}20` : `${theme.colors.warning}20`,
                }}>
                  <Text style={{
                    color: selectedManager.alreadyMember ? theme.colors.success : theme.colors.warning,
                    fontSize: 11,
                    fontWeight: '700',
                  }}>
                    {selectedManager.alreadyMember ? 'Member' : 'Will be added'}
                  </Text>
                </View>
              </View>
            </View>
          ) : null}
          <Text style={{ color: theme.colors.textSecondary, fontSize: 11, marginTop: 6 }}>
            Manager should already have a BizRecord account and will sign in with their own email and password.
          </Text>
        </Card>

        {/* Contact Information Card */}
        <Card style={{ marginBottom: 16 }}>
          <Text style={{ color: theme.colors.textSecondary, fontSize: 12, marginBottom: 8 }}>Phone Number</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.card,
                color: theme.colors.textPrimary,
                borderColor: theme.colors.border,
              },
            ]}
            placeholder="+1 (555) 000-0000"
            placeholderTextColor={theme.colors.textSecondary}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />

          <Text style={{ color: theme.colors.textSecondary, fontSize: 12, marginBottom: 8, marginTop: 12 }}>Address</Text>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              {
                backgroundColor: theme.colors.card,
                color: theme.colors.textPrimary,
                borderColor: theme.colors.border,
              },
            ]}
            placeholder="Full address"
            placeholderTextColor={theme.colors.textSecondary}
            value={address}
            onChangeText={setAddress}
            multiline
            numberOfLines={3}
          />
        </Card>

        {/* Submit Button */}
        <AppButton
          title={loading ? 'Creating…' : 'Create Branch'}
          icon="add-location-alt"
          variant="primary"
          onPress={handleCreateBranch}
          loading={loading}
          style={styles.submitButton}
        />

        <UpgradeModal
          visible={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          onUpgrade={() => {
            setShowUpgradeModal(false);
            navigation.navigate('Subscription');
          }}
          title="Branch limit reached"
          message={upgradePayload?.message || 'Your plan limit has been reached. Upgrade to create more branches.'}
          plan={upgradePayload?.meta?.plan}
          limit={upgradePayload?.meta?.limit}
          current={upgradePayload?.meta?.current}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  findManagerButton: {
    marginTop: 10,
  },
  managerCard: {
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
  },
  searchStatus: {
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitButton: {
    marginTop: 8,
  },
});
