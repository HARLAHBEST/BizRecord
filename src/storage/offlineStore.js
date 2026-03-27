import { executeSql } from './sqlite';

export { executeSql };

const parseRowData = (row) => {
  if (!row?.data) return {};
  try {
    return JSON.parse(row.data);
  } catch {
    return {};
  }
};

const localWorkspaceId = (workspaceId) => (workspaceId == null ? '' : String(workspaceId));

const resolveWorkspaceIdFromRow = (row) => row.server_id || row.local_id;

// Mark a row and outbox action as conflict
export async function markConflict(entityType, localId, actionId) {
  let table = null;
  if (entityType === 'inventory') table = 'local_inventory';
  if (entityType === 'transaction') table = 'local_transactions';
  if (entityType === 'debt') table = 'local_debts';
  if (!table) return;
  await executeSql(`UPDATE ${table} SET sync_status = 'conflict' WHERE local_id = ?`, [localId]);
  await executeSql('UPDATE sync_outbox SET last_error = ?, sync_status = ? WHERE action_id = ?', ['conflict', 'conflict', actionId]);
}

// Get a local row by entity type and localId
export async function getLocalRow(entityType, localId) {
  let table = null;
  if (entityType === 'inventory') table = 'local_inventory';
  if (entityType === 'transaction') table = 'local_transactions';
  if (entityType === 'debt') table = 'local_debts';
  if (!table) return null;
  const res = await executeSql(`SELECT * FROM ${table} WHERE local_id = ?`, [localId]);
  if (res.rows.length > 0) return res.rows.item(0);
  return null;
}

// --- Workspace-isolated local tables ---
export async function getLocalWorkspaces() {
  return executeSql('SELECT * FROM local_workspaces ORDER BY updated_at_local DESC');
}

export async function cacheWorkspaces(workspaces) {
  try {
    const now = Date.now();
    const list = Array.isArray(workspaces) ? workspaces : [];
    for (const workspace of list) {
      const id = workspace?.id != null ? String(workspace.id) : null;
      if (!id) continue;
      await executeSql(
        `INSERT OR REPLACE INTO local_workspaces (local_id, server_id, name, description, status, sync_status, last_error, updated_at_local)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          id,
          workspace?.name || 'Workspace',
          workspace?.description || '',
          workspace?.status || 'active',
          'synced',
          null,
          now,
        ]
      );
    }
  } catch {
    // ignore cache errors
  }
}

export async function getLocalInventory(workspaceLocalId) {
  if (!workspaceLocalId) throw new Error('workspaceLocalId required');
  return executeSql(
    'SELECT * FROM local_inventory WHERE workspace_local_id = ? OR workspace_server_id = ?',
    [workspaceLocalId, workspaceLocalId]
  );
}

export async function getLocalTransactions(workspaceLocalId) {
  if (!workspaceLocalId) throw new Error('workspaceLocalId required');
  return executeSql(
    'SELECT * FROM local_transactions WHERE workspace_local_id = ? OR workspace_server_id = ?',
    [workspaceLocalId, workspaceLocalId]
  );
}

export async function getLocalDebts(workspaceLocalId) {
  if (!workspaceLocalId) throw new Error('workspaceLocalId required');
  return executeSql(
    'SELECT * FROM local_debts WHERE workspace_local_id = ? OR workspace_server_id = ?',
    [workspaceLocalId, workspaceLocalId]
  );
}

// Insert/update/delete helpers for local entities (always workspace-scoped)
export async function upsertLocalInventory(item, workspaceLocalId) {
  if (!workspaceLocalId) throw new Error('workspaceLocalId required');
  return executeSql(
    `INSERT OR REPLACE INTO local_inventory (local_id, server_id, workspace_local_id, workspace_server_id, data, sync_status, last_error, updated_at_local)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      item.local_id,
      item.server_id || null,
      workspaceLocalId,
      item.workspace_server_id || workspaceLocalId,
      JSON.stringify(item.data),
      item.sync_status || 'pending_create',
      item.last_error || null,
      item.updated_at_local || Date.now(),
    ]
  );
}

export async function upsertLocalTransaction(item, workspaceLocalId) {
  if (!workspaceLocalId) throw new Error('workspaceLocalId required');
  return executeSql(
    `INSERT OR REPLACE INTO local_transactions (local_id, server_id, workspace_local_id, workspace_server_id, data, sync_status, last_error, updated_at_local)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      item.local_id,
      item.server_id || null,
      workspaceLocalId,
      item.workspace_server_id || workspaceLocalId,
      JSON.stringify(item.data),
      item.sync_status || 'pending_create',
      item.last_error || null,
      item.updated_at_local || Date.now(),
    ]
  );
}

export async function upsertLocalDebt(item, workspaceLocalId) {
  if (!workspaceLocalId) throw new Error('workspaceLocalId required');
  return executeSql(
    `INSERT OR REPLACE INTO local_debts (local_id, server_id, workspace_local_id, workspace_server_id, data, sync_status, last_error, updated_at_local)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      item.local_id,
      item.server_id || null,
      workspaceLocalId,
      item.workspace_server_id || workspaceLocalId,
      JSON.stringify(item.data),
      item.sync_status || 'pending_create',
      item.last_error || null,
      item.updated_at_local || Date.now(),
    ]
  );
}

export async function deleteLocalInventory(localId, workspaceLocalId) {
  if (!workspaceLocalId) throw new Error('workspaceLocalId required');
  return executeSql('DELETE FROM local_inventory WHERE local_id = ? AND (workspace_local_id = ? OR workspace_server_id = ?)', [localId, workspaceLocalId, workspaceLocalId]);
}

export async function deleteLocalTransaction(localId, workspaceLocalId) {
  if (!workspaceLocalId) throw new Error('workspaceLocalId required');
  return executeSql('DELETE FROM local_transactions WHERE local_id = ? AND (workspace_local_id = ? OR workspace_server_id = ?)', [localId, workspaceLocalId, workspaceLocalId]);
}

export async function deleteLocalDebt(localId, workspaceLocalId) {
  if (!workspaceLocalId) throw new Error('workspaceLocalId required');
  return executeSql('DELETE FROM local_debts WHERE local_id = ? AND (workspace_local_id = ? OR workspace_server_id = ?)', [localId, workspaceLocalId, workspaceLocalId]);
}

// --- Structured outbox ---
export async function addSyncOutboxAction(action) {
  return executeSql(
    `INSERT OR REPLACE INTO sync_outbox (action_id, action_type, entity_type, entity_local_id, workspace_ref, payload, depends_on_action_id, retry_count, next_retry_at, last_error, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      action.action_id,
      action.action_type,
      action.entity_type,
      action.entity_local_id,
      action.workspace_ref,
      JSON.stringify(action.payload),
      action.depends_on_action_id,
      action.retry_count || 0,
      action.next_retry_at || null,
      action.last_error || null,
      action.created_at || Date.now(),
      action.updated_at || Date.now(),
    ]
  );
}

export async function getSyncOutboxActions() {
  return executeSql('SELECT * FROM sync_outbox ORDER BY next_retry_at ASC, created_at ASC');
}

// --- ID mapping helpers ---
export async function setIdMapping(entityType, localId, serverId) {
  return executeSql(
    'INSERT OR REPLACE INTO id_mapping (entity_type, local_id, server_id) VALUES (?, ?, ?)',
    [entityType, localId, serverId]
  );
}

export async function getServerId(entityType, localId) {
  const res = await executeSql('SELECT server_id FROM id_mapping WHERE entity_type = ? AND local_id = ?', [entityType, localId]);
  if (res.rows.length > 0) {
    return res.rows.item(0).server_id;
  }
  return null;
}

export async function cacheInventory(workspaceId, items) {
  try {
    const now = Date.now();
    const workspaceRef = localWorkspaceId(workspaceId);
    const list = Array.isArray(items) ? items : [];

    await executeSql('DELETE FROM local_inventory WHERE workspace_local_id = ? OR workspace_server_id = ?', [workspaceRef, workspaceRef]);

    for (const item of list) {
      const serverId = item?.id != null ? String(item.id) : null;
      const localId = item?.local_id || (serverId ? `inventory_${workspaceRef}_${serverId}` : `inventory_${workspaceRef}_${now}_${Math.random().toString(16).slice(2)}`);
      await executeSql(
        `INSERT OR REPLACE INTO local_inventory (local_id, server_id, workspace_local_id, workspace_server_id, data, sync_status, last_error, updated_at_local)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          localId,
          serverId,
          workspaceRef,
          workspaceRef,
          JSON.stringify(item),
          'synced',
          null,
          now,
        ]
      );
    }
  } catch {
    // ignore
  }
}

export async function getCachedInventory(workspaceId) {
  try {
    const workspaceRef = localWorkspaceId(workspaceId);
    const rows = await executeSql(
      'SELECT * FROM local_inventory WHERE workspace_local_id = ? OR workspace_server_id = ? ORDER BY updated_at_local DESC',
      [workspaceRef, workspaceRef]
    );
    const results = [];
    for (let i = 0; i < rows.rows.length; i += 1) {
      const row = rows.rows.item(i);
      const data = parseRowData(row);
      results.push({ ...data, id: data.id ?? row.server_id ?? row.local_id, local_id: row.local_id, sync_status: row.sync_status });
    }
    return results;
  } catch {
    return [];
  }
}

export async function cacheDebts(workspaceId, debts) {
  try {
    const now = Date.now();
    const workspaceRef = localWorkspaceId(workspaceId);
    const list = Array.isArray(debts) ? debts : [];

    await executeSql('DELETE FROM local_debts WHERE workspace_local_id = ? OR workspace_server_id = ?', [workspaceRef, workspaceRef]);

    for (const item of list) {
      const serverId = item?.id != null ? String(item.id) : null;
      const localId = item?.local_id || (serverId ? `debt_${workspaceRef}_${serverId}` : `debt_${workspaceRef}_${now}_${Math.random().toString(16).slice(2)}`);
      await executeSql(
        `INSERT OR REPLACE INTO local_debts (local_id, server_id, workspace_local_id, workspace_server_id, data, sync_status, last_error, updated_at_local)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          localId,
          serverId,
          workspaceRef,
          workspaceRef,
          JSON.stringify(item),
          'synced',
          null,
          now,
        ]
      );
    }
  } catch {
    // ignore
  }
}

export async function getCachedDebts(workspaceId) {
  try {
    const workspaceRef = localWorkspaceId(workspaceId);
    const rows = await executeSql(
      'SELECT * FROM local_debts WHERE workspace_local_id = ? OR workspace_server_id = ? ORDER BY updated_at_local DESC',
      [workspaceRef, workspaceRef]
    );
    const results = [];
    for (let i = 0; i < rows.rows.length; i += 1) {
      const row = rows.rows.item(i);
      const data = parseRowData(row);
      results.push({ ...data, id: data.id ?? row.server_id ?? row.local_id, local_id: row.local_id, sync_status: row.sync_status });
    }
    return results;
  } catch {
    return [];
  }
}

export async function cacheTransactions(workspaceId, type, transactions) {
  try {
    const now = Date.now();
    const workspaceRef = localWorkspaceId(workspaceId);
    const list = Array.isArray(transactions) ? transactions : [];

    for (const item of list) {
      const transactionType = (item?.type || type || '').toLowerCase();
      const serverId = item?.id != null ? String(item.id) : null;
      const localId = item?.local_id || (serverId ? `transaction_${workspaceRef}_${transactionType || 'any'}_${serverId}` : `transaction_${workspaceRef}_${now}_${Math.random().toString(16).slice(2)}`);
      await executeSql(
        `INSERT OR REPLACE INTO local_transactions (local_id, server_id, workspace_local_id, workspace_server_id, data, sync_status, last_error, updated_at_local)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          localId,
          serverId,
          workspaceRef,
          workspaceRef,
          JSON.stringify(item),
          'synced',
          null,
          now,
        ]
      );
    }
  } catch {
    // ignore
  }
}

export async function getCachedTransactions(workspaceId, type) {
  try {
    const workspaceRef = localWorkspaceId(workspaceId);
    const rows = await executeSql(
      'SELECT * FROM local_transactions WHERE workspace_local_id = ? OR workspace_server_id = ? ORDER BY updated_at_local DESC',
      [workspaceRef, workspaceRef]
    );

    const normalizedType = type ? String(type).toLowerCase() : null;
    const results = [];
    for (let i = 0; i < rows.rows.length; i += 1) {
      const row = rows.rows.item(i);
      const data = parseRowData(row);
      if (normalizedType && String(data?.type || '').toLowerCase() !== normalizedType) {
        continue;
      }
      results.push({ ...data, id: data.id ?? row.server_id ?? row.local_id, local_id: row.local_id, sync_status: row.sync_status });
    }
    return results;
  } catch {
    return [];
  }
}

export async function getOfflineWorkspacesForUi() {
  try {
    const rows = await getLocalWorkspaces();
    const result = [];
    for (let i = 0; i < rows.rows.length; i += 1) {
      const row = rows.rows.item(i);
      const id = resolveWorkspaceIdFromRow(row);
      if (!id) continue;
      result.push({
        id,
        local_id: row.local_id,
        server_id: row.server_id,
        name: row.name || 'Workspace',
        description: row.description || '',
        status: row.status || 'active',
      });
    }
    return result;
  } catch {
    return [];
  }
}
