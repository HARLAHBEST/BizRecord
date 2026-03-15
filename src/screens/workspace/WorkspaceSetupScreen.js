import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';

export default function WorkspaceSetupScreen({ navigation }) {
  const { theme } = useTheme();
  const { setWorkspaces, setCurrentWorkspaceId, refreshWorkspaces } = useWorkspace();
  const { logout } = useAuth();
  const { width } = useWindowDimensions();
  const isModal = navigation && navigation.canGoBack();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const compact = width < 380;
  const cardWidth = Math.min(width - (compact ? 24 : 36), 520);

  const handleCreateWorkspace = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Workspace name required', 'Please enter a workspace name.');
      return;
    }

    setLoading(true);
    try {
      const created = await api.post('/workspaces', {
        name: trimmedName,
        description: description.trim() || undefined,
      });

      const createdId = created?.id;
      if (createdId) {
        setWorkspaces((prev) => {
          const exists = prev.some((item) => item.id === createdId);
          if (exists) { return prev; }
          return [created, ...prev];
        });
        setCurrentWorkspaceId(createdId);
        if (isModal) { navigation.goBack(); }
        return;
      }

      await refreshWorkspaces();
      if (isModal) { navigation.goBack(); }
    } catch (err) {
      Alert.alert('Unable to create workspace', err?.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.card, { backgroundColor: theme.colors.card, width: cardWidth, borderColor: theme.colors.border }]}>
        {isModal && (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
            <MaterialIcons name="close" size={22} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        )}
        <View style={styles.iconWrap}>
          <MaterialIcons name="business" size={30} color={theme.colors.primary} />
        </View>
        <Text style={[styles.title, { color: theme.colors.textPrimary, fontSize: compact ? 21 : 24 }]}>Create your first workspace</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>You need at least one workspace before recording sales, inventory, and debts.</Text>

        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Workspace name *</Text>
        <TextInput
          style={[styles.input, { color: theme.colors.textPrimary, borderColor: theme.colors.border }]}
          placeholder="e.g. Main Store"
          placeholderTextColor={theme.colors.textSecondary}
          value={name}
          onChangeText={setName}
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
        />

        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: theme.colors.primary, opacity: loading ? 0.7 : 1 }]}
          disabled={loading}
          onPress={handleCreateWorkspace}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Create Workspace</Text>}
        </TouchableOpacity>

        {!isModal && (
          <TouchableOpacity style={styles.secondaryButton} onPress={logout}>
            <Text style={[styles.secondaryText, { color: theme.colors.textSecondary }]}>Sign out</Text>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
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
  primaryButton: {
    marginTop: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  primaryText: {
    color: '#fff',
    fontWeight: '700',
  },
  secondaryButton: {
    marginTop: 10,
    alignItems: 'center',
    paddingVertical: 8,
  },
  secondaryText: {
    fontWeight: '600',
  },
});
