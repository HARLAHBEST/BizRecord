// --- Sync Coordinator Worker ---
let syncWorkerActive = false;
const BACKOFF_BASE_MS = 1500;
const MAX_RETRIES = 5;

async function syncCoordinatorWorker({ token, currentWorkspaceId }) {
  if (syncWorkerActive) return;
  syncWorkerActive = true;
  try {
    const outboxRes = await offlineStore.getSyncOutboxActions();
    const rows = outboxRes?.rows || { length: 0 };
    for (let i = 0; i < rows.length; i++) {
      const action = rows.item(i);
      // Skip if not due for retry yet
      if (action.next_retry_at && Date.now() < action.next_retry_at) continue;
      // Dependency check: skip if parent action still exists
      if (action.depends_on_action_id) {
        let parentExists = false;
        for (let j = 0; j < rows.length; j++) {
          if (rows.item(j).action_id === action.depends_on_action_id) {
            parentExists = true;
            break;
          }
        }
        if (parentExists) continue;
      }
      // Map workspace_ref if needed
      let workspaceId = action.workspace_ref;
      if (workspaceId && workspaceId.startsWith('local_')) {
        const mapped = await offlineStore.getServerId('workspace', workspaceId);
        if (!mapped) {
          // Can't sync child until workspace is mapped
          continue;
        }
        workspaceId = mapped;
      }
      try {
        const payload = action.payload ? JSON.parse(action.payload) : undefined;
        let apiRes = null;
        // --- Conflict detection for update/delete ---
        let entityType = null;
        let serverId = null;
        let localRow = null;
        let remoteRow = null;
        let localUpdated = null;
        let remoteUpdated = null;
        let conflict = false;
        if (action.action_type.startsWith('update_') || action.action_type.startsWith('delete_')) {
          if (action.action_type.includes('inventory')) entityType = 'inventory';
          if (action.action_type.includes('transaction')) entityType = 'transaction';
          if (action.action_type.includes('debt')) entityType = 'debt';
          serverId = await offlineStore.getServerId(entityType, action.entity_local_id);
          if (!serverId) throw new Error('No serverId for ' + entityType);
          // Get local row
          localRow = await offlineStore.getLocalRow(entityType, action.entity_local_id);
          localUpdated = localRow?.updated_at_local || localRow?.updatedAt || 0;
          // Fetch remote row (if online)
          try {
            if (entityType === 'inventory') {
              remoteRow = await api.get(`/workspaces/${workspaceId}/inventory/${serverId}`);
            } else if (entityType === 'transaction' || entityType === 'debt') {
              remoteRow = await api.get(`/workspaces/${workspaceId}/transactions/${serverId}`);
            }
            remoteUpdated = new Date(remoteRow?.updatedAt || remoteRow?.updated_at || 0).getTime();
            // If both changed since last sync, mark conflict
            if (remoteUpdated && localUpdated && Math.abs(remoteUpdated - localUpdated) > 1000) {
              conflict = true;
            }
          } catch (e) {
            // If offline or fetch fails, skip conflict check (best effort)
          }
        }
        if (conflict) {
          // Mark as conflict in outbox and local row
          await offlineStore.markConflict(entityType, action.entity_local_id, action.action_id);
          continue; // Skip this action until resolved
        }
        // --- Normal sync logic ---
        if (action.action_type === 'create_workspace') {
          apiRes = await api.post('/workspaces', payload);
          if (apiRes?.id) {
            await offlineStore.setIdMapping('workspace', action.entity_local_id, apiRes.id);
          }
        } else if (action.action_type === 'create_inventory') {
          apiRes = await api.post(`/workspaces/${workspaceId}/inventory`, payload);
          if (apiRes?.id) {
            await offlineStore.setIdMapping('inventory', action.entity_local_id, apiRes.id);
          }
        } else if (action.action_type === 'update_inventory') {
          apiRes = await api.put(`/workspaces/${workspaceId}/inventory/${serverId}`, payload);
        } else if (action.action_type === 'delete_inventory') {
          apiRes = await api.delete(`/workspaces/${workspaceId}/inventory/${serverId}`);
        } else if (action.action_type === 'create_transaction') {
          apiRes = await api.post(`/workspaces/${workspaceId}/transactions`, payload);
          if (apiRes?.id) {
            await offlineStore.setIdMapping('transaction', action.entity_local_id, apiRes.id);
          }
        } else if (action.action_type === 'update_transaction') {
          apiRes = await api.put(`/workspaces/${workspaceId}/transactions/${serverId}`, payload);
        } else if (action.action_type === 'delete_transaction') {
          apiRes = await api.delete(`/workspaces/${workspaceId}/transactions/${serverId}`);
        } else if (action.action_type === 'create_debt') {
          apiRes = await api.post(`/workspaces/${workspaceId}/transactions`, payload);
          if (apiRes?.id) {
            await offlineStore.setIdMapping('debt', action.entity_local_id, apiRes.id);
          }
        } else if (action.action_type === 'update_debt') {
          apiRes = await api.put(`/workspaces/${workspaceId}/transactions/${serverId}`, payload);
        } else if (action.action_type === 'delete_debt') {
          apiRes = await api.delete(`/workspaces/${workspaceId}/transactions/${serverId}`);
        }
        // On success: remove from outbox
        await offlineStore.executeSql('DELETE FROM sync_outbox WHERE action_id = ?', [action.action_id]);
        // TODO: update local row status to synced if needed
      } catch (err) {
        // On failure: increment retry_count, set next_retry_at (exponential backoff), update last_error
        const retryCount = (action.retry_count || 0) + 1;
        const backoff = Math.min(BACKOFF_BASE_MS * Math.pow(2, retryCount - 1), 60000);
        const nextRetry = Date.now() + backoff;
        if (retryCount > MAX_RETRIES) {
          // Give up: leave in outbox with error
          await offlineStore.executeSql(
            'UPDATE sync_outbox SET last_error = ?, retry_count = ?, next_retry_at = ? WHERE action_id = ?',
            [err.message, retryCount, null, action.action_id]
          );
        } else {
          await offlineStore.executeSql(
            'UPDATE sync_outbox SET last_error = ?, retry_count = ?, next_retry_at = ? WHERE action_id = ?',
            [err.message, retryCount, nextRetry, action.action_id]
          );
        }
      }
    }
  } finally {
    syncWorkerActive = false;
  }
}
import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { api } from '../api/client';
import * as offlineStore from '../storage/offlineStore';

const WorkspaceContext = createContext();
const WORKSPACE_STORAGE_KEY = '@booker:currentWorkspace';
const OFFLINE_QUEUE_KEY = '@booker:queuedActions';
const LAST_SYNC_STORAGE_KEY = '@booker:lastSyncAt';

const generateId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const WorkspaceProvider = function({ children }) {
  const { token } = useAuth();

  const [workspaces, setWorkspaces] = useState([]);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingActions, setPendingActions] = useState([]);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const persistWorkspaceId = async (id) => {
    try {
      await AsyncStorage.setItem(WORKSPACE_STORAGE_KEY, id || '');
    } catch (err) {
      // ignore
    }
  };

  const loadStoredWorkspaceId = async () => {
    try {
      const stored = await AsyncStorage.getItem(WORKSPACE_STORAGE_KEY);
      if (stored) {
        setCurrentWorkspaceId(stored);
      }
    } catch (err) {
      // ignore
    }
  };

  const persistPendingActions = async (actions) => {
    try {
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(actions || []));
    } catch (err) {
      // ignore
    }
  };

  const loadPendingActions = async () => {
    try {
      const stored = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
      if (stored) {
        setPendingActions(JSON.parse(stored));
      }
    } catch (err) {
      // ignore
    }
  };

  const persistLastSyncedAt = async (date) => {
    try {
      await AsyncStorage.setItem(LAST_SYNC_STORAGE_KEY, String(date?.getTime() ?? ''));
    } catch (err) {
      // ignore
    }
  };

  const loadLastSyncedAt = async () => {
    try {
      const lastSync = await AsyncStorage.getItem(LAST_SYNC_STORAGE_KEY);
      if (lastSync) {
        setLastSyncedAt(new Date(parseInt(lastSync, 10)));
      }
    } catch (err) {
      // ignore
    }
  };

  const enqueueOfflineAction = async (action) => {
    const queued = { id: generateId(), createdAt: Date.now(), ...action };
    setPendingActions((prev) => {
      const next = [...prev, queued];
      persistPendingActions(next);
      return next;
    });
  };

  const processPendingActions = useCallback(async () => {
    if (!token || !currentWorkspaceId || pendingActions.length === 0) {
      return;
    }

    setIsSyncing(true);

    const remaining = [];

    for (const action of pendingActions) {
      try {
        if (action.method === 'post') {
          await api.post(action.path, action.body);
        } else if (action.method === 'put') {
          await api.put(action.path, action.body);
        } else if (action.method === 'delete') {
          await api.delete(action.path);
        }
      } catch (err) {
        remaining.push(action);
      }
    }

    const now = new Date();
    setLastSyncedAt(now);
    persistLastSyncedAt(now);

    setPendingActions(remaining);
    persistPendingActions(remaining);
    setIsSyncing(false);
  }, [currentWorkspaceId, pendingActions, token]);

  // Updated: queueAction now triggers syncCoordinatorWorker
  const queueAction = async (action) => {
    await enqueueOfflineAction(action);
    syncCoordinatorWorker({ token, currentWorkspaceId });
  };

  const syncInfo = useMemo(
    () => ({
      pendingCount: pendingActions.length,
      isSyncing,
      lastSyncedAt,
      status: isSyncing ? 'syncing' : pendingActions.length > 0 ? 'pending' : 'synced',
    }),
    [pendingActions.length, isSyncing, lastSyncedAt],
  );

  // Applies the offline workspace list from SQLite.  If the table is empty
  // (e.g. first launch after an old code version that never populated it),
  // synthesises a minimal workspace entry from the persisted workspace ID so
  // App.js navigates to MainTabs instead of WorkspaceSetupScreen.
  const applyOfflineWorkspacesFallback = useCallback(async () => {
    const localWorkspaces = await offlineStore.getOfflineWorkspacesForUi();
    if (localWorkspaces.length > 0) {
      setWorkspaces(localWorkspaces);
      setCurrentWorkspaceId((prev) => {
        if (prev && localWorkspaces.some((w) => String(w.id) === String(prev))) {
          return prev;
        }
        return localWorkspaces[0]?.id || prev || null;
      });
    } else {
      // local_workspaces table is empty — fall back to the stored workspace ID
      // so the user can still navigate to MainTabs and see any cached screen data.
      const storedId = await AsyncStorage.getItem(WORKSPACE_STORAGE_KEY);
      if (storedId) {
        setWorkspaces([{ id: storedId, name: 'My Workspace' }]);
        setCurrentWorkspaceId(storedId);
      }
      // If no stored ID, workspaces stays empty → WorkspaceSetupScreen is correct
    }
  }, []); // useState setters are stable; no reactive deps needed

  const loadWorkspaces = useCallback(async () => {
    if (!token) {
      setWorkspaces([]);
      setCurrentWorkspaceId(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await api.get('/workspaces');
      const list = Array.isArray(data) ? data : [];

      if (list.length > 0) {
        setWorkspaces(list);
        await offlineStore.cacheWorkspaces(list);
        setCurrentWorkspaceId((prev) => {
          if (prev && list.some((w) => String(w.id) === String(prev))) {
            return prev;
          }
          return list[0].id;
        });
        return;
      }

      await applyOfflineWorkspacesFallback();
    } catch (err) {
      await applyOfflineWorkspacesFallback();
    } finally {
      setLoading(false);
    }
  }, [token, applyOfflineWorkspacesFallback]);

  useEffect(() => {
    loadStoredWorkspaceId();
    loadPendingActions();
    loadLastSyncedAt();
  }, []);

  useEffect(() => {
    loadWorkspaces();
  }, [loadWorkspaces]);

  useEffect(() => {
    // Attempt to sync queued work whenever the auth token or workspace changes
    if (token && currentWorkspaceId) {
      syncCoordinatorWorker({ token, currentWorkspaceId });
    }
  }, [token, currentWorkspaceId]);

  useEffect(() => {
    persistWorkspaceId(currentWorkspaceId);
  }, [currentWorkspaceId]);

  // --- Workspace-scoped repository abstraction ---
  // All local entity access must use currentWorkspaceId (local)
  const repo = useMemo(() => ({
    getInventory: () => offlineStore.getLocalInventory(currentWorkspaceId),
    getTransactions: () => offlineStore.getLocalTransactions(currentWorkspaceId),
    getDebts: () => offlineStore.getLocalDebts(currentWorkspaceId),
    upsertInventory: (item) => offlineStore.upsertLocalInventory(item, currentWorkspaceId),
    upsertTransaction: (item) => offlineStore.upsertLocalTransaction(item, currentWorkspaceId),
    upsertDebt: (item) => offlineStore.upsertLocalDebt(item, currentWorkspaceId),
    deleteInventory: (localId) => offlineStore.deleteLocalInventory(localId, currentWorkspaceId),
    deleteTransaction: (localId) => offlineStore.deleteLocalTransaction(localId, currentWorkspaceId),
    deleteDebt: (localId) => offlineStore.deleteLocalDebt(localId, currentWorkspaceId),
  }), [currentWorkspaceId]);

  const value = useMemo(
    () => ({
      workspaces,
      setWorkspaces,
      currentWorkspaceId,
      setCurrentWorkspaceId,
      loading,
      syncInfo,
      queueAction,
      processPendingActions,
      refreshWorkspaces: loadWorkspaces,
      repo, // workspace-scoped repository
    }),
    [
      workspaces,
      currentWorkspaceId,
      loading,
      syncInfo,
      queueAction,
      processPendingActions,
      loadWorkspaces,
      repo,
    ],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
};

export const useWorkspace = function() {
  return useContext(WorkspaceContext);
};

export default WorkspaceContext;
