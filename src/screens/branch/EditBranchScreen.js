import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { api } from '../../api/client';

export default function EditBranchScreen({ navigation, route }) {
  const themeContext = useTheme();
  const theme = themeContext.theme;
  const branch = route?.params?.branch;
  const [name, setName] = useState(branch?.name || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!branch?.id || !name.trim()) {
      Alert.alert('Validation', 'Branch name is required');
      return;
    }

    setLoading(true);
    try {
      await api.put(`/workspaces/${branch.id}`, { name: name.trim() });
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err?.message || 'Unable to update branch');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background, padding: 12 }]}>
      <Text style={{ color: theme.colors.textPrimary, fontWeight: '700' }}>Create / Edit Branch</Text>
      <TextInput value={name} onChangeText={setName} placeholder="Branch name" placeholderTextColor={theme.colors.textSecondary} style={[styles.input, { backgroundColor: theme.colors.card, color: theme.colors.textPrimary }]} />
      <TouchableOpacity style={[styles.button, { backgroundColor: theme.colors.primary, opacity: loading ? 0.7 : 1 }]} onPress={handleSave}>
        <Text style={{ color: '#fff' }}>{loading ? 'Saving…' : 'Save'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1 }, input: { marginTop: 12, padding: 12, borderRadius: 10 }, button: { marginTop: 12, padding: 12, borderRadius: 10, alignItems: 'center' } });
