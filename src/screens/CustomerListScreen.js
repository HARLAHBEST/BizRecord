import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Alert } from 'react-native';
import { SkeletonBlock, EmptyState } from '../components/UI';
import { useTheme } from '../theme/ThemeContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { api } from '../api/client';
import { cacheCustomers, getCachedCustomers } from '../storage/offlineStore';
import { MaterialIcons } from '@expo/vector-icons';
import { useCustomerSelect } from '../context/CustomerSelectContext';
import { useFocusEffect, useRoute } from '@react-navigation/native';

const isPendingSyncStatus = (status) => {
  const value = String(status || '').toLowerCase();
  return value === 'pending_create' || value === 'pending_update' || value === 'failed' || value === 'conflict';
};

const mergeByIdentity = (primary = [], secondary = []) => {
  const map = new Map();
  [...(Array.isArray(primary) ? primary : []), ...(Array.isArray(secondary) ? secondary : [])].forEach((item) => {
    const key = String(item?.id ?? item?.server_id ?? item?.local_id ?? '');
    if (!key || key === 'undefined' || key === 'null') return;

    const existing = map.get(key);
    if (!existing) {
      map.set(key, item);
      return;
    }

    const existingPending = isPendingSyncStatus(existing?.sync_status);
    const incomingPending = isPendingSyncStatus(item?.sync_status);
    if (incomingPending && !existingPending) {
      map.set(key, item);
      return;
    }
    if (existingPending && !incomingPending) {
      return;
    }

    const existingTime = new Date(existing?.updatedAt || existing?.updated_at || existing?.createdAt || 0).getTime();
    const incomingTime = new Date(item?.updatedAt || item?.updated_at || item?.createdAt || 0).getTime();
    if (incomingTime >= existingTime) {
      map.set(key, item);
    }
  });
  return Array.from(map.values()).sort((left, right) => {
    const leftTime = new Date(left?.createdAt || left?.updatedAt || left?.updated_at || 0).getTime();
    const rightTime = new Date(right?.createdAt || right?.updatedAt || right?.updated_at || 0).getTime();
    return rightTime - leftTime;
  });
};


export default function CustomerListScreen({ navigation }) {
  const { theme } = useTheme();
  const { currentWorkspaceId, activeBranchId, queueAction } = useWorkspace();
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const { setSelectedCustomer } = useCustomerSelect();
  const route = useRoute();
  const selectMode = route.params?.selectMode;
  const customerPath = activeBranchId
    ? `/workspaces/${currentWorkspaceId}/branches/${activeBranchId}/customers`
    : `/workspaces/${currentWorkspaceId}/customers`;
  const customerScopeId = activeBranchId || currentWorkspaceId;

  const loadCustomers = async () => {
    if (!currentWorkspaceId) return;
    setLoading(true);
    try {
      const cached = await getCachedCustomers(customerScopeId, search);
      const data = await api.get(customerPath, search ? { search } : undefined);
      const list = Array.isArray(data) ? data : [];
      setCustomers(mergeByIdentity(list, cached));
      cacheCustomers(customerScopeId, list).catch(() => null);
    } catch (err) {
      const cached = await getCachedCustomers(customerScopeId, search);
      setCustomers(Array.isArray(cached) ? cached : []);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadCustomers();
    }, [currentWorkspaceId, customerPath, customerScopeId, search]),
  );

  const handleDelete = async (id) => {
    if (!currentWorkspaceId) return;
    try {
      await api.delete(`${customerPath}/${id}`);
      loadCustomers();
    } catch (err) {
      if (!err?.response && queueAction) {
        await queueAction({
          method: 'delete',
          path: `${customerPath}/${id}`,
        });
        loadCustomers();
      } else {
        Alert.alert('Error', err.message || 'Failed to delete customer');
      }
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{ flexDirection: 'row', padding: 12 }}>
        <TextInput
          style={[styles.input, { color: theme.colors.textPrimary, borderColor: theme.colors.border }]}
          placeholder="Search customers"
          value={search}
          onChangeText={setSearch}
          accessibilityLabel="Search customers"
        />
        <TouchableOpacity
          onPress={() => navigation.navigate('AddCustomerScreen', { selectAfterCreate: !!selectMode })}
          style={{ marginLeft: 8 }}
          accessibilityLabel="Add customer"
          activeOpacity={0.7}
        >
          <MaterialIcons name="person-add" size={28} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>
      {loading ? (
        <View style={{ padding: 16 }}>
          <SkeletonBlock height={28} width="60%" style={{ marginBottom: 18, borderRadius: 8 }} />
          <SkeletonBlock height={60} style={{ marginBottom: 18, borderRadius: 16 }} />
          <SkeletonBlock height={60} style={{ marginBottom: 18, borderRadius: 16 }} />
          <SkeletonBlock height={60} style={{ marginBottom: 18, borderRadius: 16 }} />
        </View>
      ) : (
        <FlatList
          data={customers}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={[styles.row, { borderColor: theme.colors.border, marginBottom: 6, borderRadius: 10, backgroundColor: theme.colors.card }]}> 
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.colors.textPrimary, fontWeight: '600', fontSize: 16 }}>{item.name}</Text>
                <Text style={{ color: theme.colors.textSecondary }}>{item.email || item.phone}</Text>
              </View>
              <TouchableOpacity
                  onPress={() => {
                     if (selectMode) {
                         setSelectedCustomer(item);
                         navigation.goBack();
                      } else {
                        navigation.navigate('EditCustomerScreen', { customer: item });
                      }
                   }}
                  accessibilityLabel={selectMode ? `Select ${item.name}` : `Edit ${item.name}`}
                  activeOpacity={0.7}
               >
                 <MaterialIcons name={selectMode ? 'check-circle' : 'edit'} size={22} color={theme.colors.primary} />
              </TouchableOpacity>
              
              <TouchableOpacity onPress={() => handleDelete(item.id)} style={{ marginLeft: 12 }} accessibilityLabel={`Delete ${item.name}`} activeOpacity={0.7}>
                <MaterialIcons name="delete" size={22} color={theme.colors.error} />
              </TouchableOpacity>
            </View>
          )}
          refreshing={loading}
          onRefresh={loadCustomers}
          ListEmptyComponent={
            <EmptyState
              icon="person"
              title="No customers found"
              subtitle="Add customers to your workspace."
              style={{ marginTop: 32 }}
              ctaLabel="Add Customer"
              onCtaPress={() => navigation.navigate('AddCustomerScreen', { selectAfterCreate: !!selectMode })}
              accessibilityLabel="No customers found. Add a customer."
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  input: { flex: 1, borderWidth: 1, borderRadius: 8, padding: 8, fontSize: 16 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1 },
});

