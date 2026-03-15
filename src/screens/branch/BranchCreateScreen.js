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
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { Card, Title } from '../../components/UI';
import { MaterialIcons } from '@expo/vector-icons';

export default function BranchCreateScreen({ navigation }) {
  const themeContext = useTheme();
  const theme = themeContext.theme;
  const { user } = useAuth();

  const [branchName, setBranchName] = useState('');
  const [location, setLocation] = useState('');
  const [manager, setManager] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);

  const userRole = user?.role || 'user';
  const canCreateWorkspace = userRole === 'super_admin' || userRole === 'admin';

  const handleCreateBranch = async () => {
    if (!branchName || !location) {
      Alert.alert('Validation Error', 'Please fill in branch name and location');
      return;
    }

    setLoading(true);
    try {
      await api.post('/workspaces', {
        name: branchName.trim(),
        description: [location, manager, phone, address].filter(Boolean).join(' | '),
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
      Alert.alert('Error', err?.message || 'Unable to create branch');
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

        {/* Permission Check */}
        {!canCreateWorkspace && (
          <Card style={{ backgroundColor: theme.colors.warning + '20', borderLeftWidth: 4, borderLeftColor: theme.colors.warning, marginBottom: 16 }}>
            <View style={{ flexDirection: 'row' }}>
              <MaterialIcons name="lock" size={20} color={theme.colors.warning} style={{ marginRight: 8 }} />
              <Text style={{ color: theme.colors.warning, flex: 1 }}>
                Only workspace admins can create branches
              </Text>
            </View>
          </Card>
        )}

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
            editable={canCreateWorkspace}
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
            editable={canCreateWorkspace}
          />

          <Text style={{ color: theme.colors.textSecondary, fontSize: 12, marginBottom: 8, marginTop: 12 }}>Branch Manager</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.card,
                color: theme.colors.textPrimary,
                borderColor: theme.colors.border,
              },
            ]}
            placeholder="Manager name"
            placeholderTextColor={theme.colors.textSecondary}
            value={manager}
            onChangeText={setManager}
            editable={canCreateWorkspace}
          />
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
            editable={canCreateWorkspace}
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
            editable={canCreateWorkspace}
          />
        </Card>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            {
              backgroundColor: canCreateWorkspace ? theme.colors.primary : theme.colors.border,
              opacity: loading ? 0.7 : 1,
            },
          ]}
          onPress={handleCreateBranch}
          disabled={!canCreateWorkspace || loading}
        >
          <MaterialIcons name="add-location-alt" size={20} color={canCreateWorkspace ? '#fff' : theme.colors.textSecondary} />
          <Text
            style={{
              color: canCreateWorkspace ? '#fff' : theme.colors.textSecondary,
              fontWeight: '600',
              marginLeft: 8,
            }}
          >
            {loading ? 'Creating…' : 'Create Branch'}
          </Text>
        </TouchableOpacity>
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
  submitButton: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
});
