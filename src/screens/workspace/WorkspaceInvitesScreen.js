import React, { useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Card, AppButton, EmptyState, Subtle, Title } from '../../components/UI';
import { useTheme } from '../../theme/ThemeContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { api } from '../../api/client';

export default function WorkspaceInvitesScreen({ navigation }) {
  const { theme } = useTheme();
  const { refreshWorkspaces } = useWorkspace();
  const [pendingInvites, setPendingInvites] = useState([]);
  const [inviteCodes, setInviteCodes] = useState({});
  const [loading, setLoading] = useState(false);
  const [acceptingInviteId, setAcceptingInviteId] = useState(null);

  const loadInvites = React.useCallback(async () => {
    setLoading(true);
    try {
      const invites = await api.get('/workspaces/invites/pending');
      setPendingInvites(Array.isArray(invites) ? invites : []);
    } catch (err) {
      setPendingInvites([]);
      Alert.alert('Workspace invites', err?.message || 'Unable to load pending invites.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadInvites();
  }, [loadInvites]);

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
      await loadInvites();
      setInviteCodes((prev) => ({ ...prev, [invite.id]: '' }));
      Alert.alert('Invite accepted', `You have joined ${invite.workspaceName}.`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
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
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={loadInvites} />}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Title>Join Workspace</Title>
          <Subtle>Accept a pending workspace invite using the code from your email.</Subtle>
        </View>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="close" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <Card>
        {pendingInvites.length > 0 ? pendingInvites.map((invite) => (
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
              style={[styles.input, { color: theme.colors.textPrimary, borderColor: theme.colors.border }]}
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
              style={{ marginTop: 8 }}
            />
          </View>
        )) : (
          <EmptyState
            icon="mail-outline"
            title="No pending invites"
            subtitle="Any workspace invite sent to your email will appear here."
          />
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
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
    marginBottom: 2,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 10,
  },
});
