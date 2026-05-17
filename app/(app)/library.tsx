/**
 * ============================================================
 *  LIBRARY SCREEN
 *  Shows saved videos, analyses, and notes from local DB.
 * ============================================================
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Linking, Alert,
} from 'react-native';
import { dbService, type LibraryItem } from '../../src/db/db.service';
import { FEATURES } from '../../src/config/features';

const TYPE_ICONS: Record<string, string> = {
  video: '▶️', analysis: '🔍', note: '📝', link: '🔗',
};

function LibraryCard({
  item,
  onDelete,
}: {
  item: LibraryItem;
  onDelete: (id: number) => void;
}) {
  let content: Record<string, unknown> = {};
  try { content = JSON.parse(item.content); } catch {}

  const handleOpen = () => {
    const url = (content.url ?? content.link) as string | undefined;
    if (url) Linking.openURL(url);
  };

  const handleDelete = () => {
    Alert.alert('Delete', `Delete "${item.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete(item.id!) },
    ]);
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardIcon}>{TYPE_ICONS[item.type] ?? '📄'}</Text>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.cardDate}>
            {new Date(item.createdAt).toLocaleDateString()}
            {item.tags ? ` · ${item.tags}` : ''}
          </Text>
        </View>
      </View>
      <View style={styles.cardActions}>
        {(content.url || content.link) && (
          <TouchableOpacity onPress={handleOpen} style={styles.actionBtn}>
            <Text style={styles.actionBtnText}>Open</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={handleDelete} style={[styles.actionBtn, styles.actionBtnDanger]}>
          <Text style={styles.actionBtnDangerText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function LibraryScreen() {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string | undefined>(undefined);

  const load = useCallback(async () => {
    setIsLoading(true);
    const data = await dbService.getItems({ type: filter, limit: 50 });
    setItems(data);
    setIsLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = useCallback(async (id: number) => {
    await dbService.deleteItem(id);
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  if (!FEATURES.localDatabase) {
    return (
      <View style={styles.center}>
        <Text style={styles.offText}>Local database is disabled in features.ts</Text>
      </View>
    );
  }

  const filters = [undefined, 'video', 'analysis', 'note', 'link'] as const;
  const filterLabels: Record<string, string> = {
    undefined: 'All', video: '▶ Videos', analysis: '🔍 Analyses', note: '📝 Notes', link: '🔗 Links',
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Library</Text>
      </View>

      {/* Filter pills */}
      <View style={styles.filters}>
        {filters.map(f => (
          <TouchableOpacity
            key={String(f)}
            style={[styles.pill, filter === f && styles.pillActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.pillText, filter === f && styles.pillTextActive]}>
              {filterLabels[String(f)]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading
        ? <ActivityIndicator style={{ marginTop: 40 }} color="#6366f1" />
        : (
          <FlatList
            data={items}
            keyExtractor={i => String(i.id)}
            renderItem={({ item }) => <LibraryCard item={item} onDelete={handleDelete} />}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.center}>
                <Text style={styles.emptyText}>Nothing saved yet.</Text>
                <Text style={styles.emptySubText}>Ask the agent to save something!</Text>
              </View>
            }
          />
        )
      }
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    paddingTop: 56, paddingBottom: 12, paddingHorizontal: 16,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  filters: { flexDirection: 'row', padding: 12, gap: 8, flexWrap: 'wrap' },
  pill: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, backgroundColor: '#f3f4f6',
    borderWidth: 1, borderColor: '#e5e7eb',
  },
  pillActive: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  pillText: { fontSize: 12, color: '#374151' },
  pillTextActive: { color: '#fff', fontWeight: '600' },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#e5e7eb', gap: 10,
  },
  cardHeader: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  cardIcon: { fontSize: 24, marginTop: 2 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: '600', color: '#111827' },
  cardDate: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  cardActions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 8, backgroundColor: '#f3f4f6',
  },
  actionBtnText: { fontSize: 12, color: '#374151', fontWeight: '500' },
  actionBtnDanger: { backgroundColor: '#fef2f2' },
  actionBtnDangerText: { fontSize: 12, color: '#dc2626', fontWeight: '500' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  offText: { color: '#6b7280', fontSize: 14, textAlign: 'center', padding: 20 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#111827' },
  emptySubText: { fontSize: 13, color: '#6b7280', marginTop: 4 },
});
