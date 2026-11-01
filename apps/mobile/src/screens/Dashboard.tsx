import {
  formatDate,
  isOverdue,
  LIST_DEFAULT_LIMIT,
  PRIORITY_LABELS,
  STATUS_LABELS,
  statusSlug,
  TASK_STATUSES,
  type Task,
  type TaskListResponse,
  type TaskStatus,
} from '@taskflow/shared';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Button } from '../components/Button';
import { LoadError, Loading } from '../components/states';
import { useServices } from '../lib/app-context';
import { colors, shared, statusColors } from '../lib/theme';
import { useLoad } from '../lib/use-load';

const SEARCH_DELAY_MS = 300;
const SUMMARY_KEYS = {
  PENDING: 'pending',
  IN_PROGRESS: 'inProgress',
  COMPLETED: 'completed',
} as const;

interface MorePages {
  listKey: string;
  page: number;
  items: Task[];
}

function StatusStrip({
  summary,
  active,
  onSelect,
}: {
  summary: TaskListResponse['summary'];
  active: TaskStatus | undefined;
  onSelect(status: TaskStatus | undefined): void;
}) {
  const options = [
    { key: 'all', label: 'All', count: summary.all, status: undefined, color: colors.ink },
    ...TASK_STATUSES.map((status) => ({
      key: statusSlug(status),
      label: STATUS_LABELS[status],
      count: summary[SUMMARY_KEYS[status]],
      status,
      color: statusColors[status],
    })),
  ];

  return (
    <View style={styles.strip} accessibilityLabel="Filter by status">
      {options.map((option) => {
        const selected = active === option.status;
        return (
          <Pressable
            key={option.key}
            testID={`status-filter-${option.key}`}
            accessibilityRole="button"
            accessibilityLabel={`${option.label}, ${option.count}`}
            accessibilityState={{ selected }}
            onPress={() => onSelect(option.status)}
            style={[
              styles.segment,
              { backgroundColor: option.color, flexGrow: Math.max(option.count, 1) },
              selected && styles.segmentSelected,
            ]}
          >
            <Text testID={`dashboard-summary-${option.key}`} style={styles.count}>
              {option.count}
            </Text>
            <Text style={styles.segmentLabel} numberOfLines={1}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function TaskRow({ task, today }: { task: Task; today: string }) {
  const overdue = isOverdue(task, today);
  const due = task.dueDate ? `Due ${formatDate(task.dueDate)}` : 'No due date';
  const meta = `${STATUS_LABELS[task.status]}. ${PRIORITY_LABELS[task.priority]} priority. ${due}.`;
  return (
    <Pressable
      testID={`task-card-${task.id}`}
      accessibilityRole="button"
      accessibilityLabel={`${task.title}. ${meta}${overdue ? ' Overdue.' : ''}`}
      onPress={() => router.push(`/tasks/${task.id}`)}
      style={[styles.row, { borderLeftColor: statusColors[task.status] }]}
    >
      <View style={styles.rowBody}>
        <Text style={styles.title}>{task.title}</Text>
        <Text style={styles.meta}>{meta}</Text>
      </View>
      {overdue && (
        <Text testID={`task-overdue-${task.id}`} style={styles.overdue}>
          Overdue
        </Text>
      )}
    </Pressable>
  );
}

export function Dashboard() {
  const { api, today } = useServices();
  const [status, setStatus] = useState<TaskStatus>();
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [more, setMore] = useState<MorePages>();
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState<unknown>();
  const hasFocused = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(input.trim()), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [input]);

  const query = {
    status,
    search: search || undefined,
    sort: 'dueDate',
    order,
    limit: LIST_DEFAULT_LIMIT,
  } as const;
  const listKey = JSON.stringify(query);
  const load = useCallback(
    () => api.listTasks({ ...(JSON.parse(listKey) as typeof query), page: 1 }),
    [api, listKey],
  );
  const { data, error, loading, retry } = useLoad(load);
  const extra = more?.listKey === listKey ? more : undefined;
  const items = [...(data?.items ?? []), ...(extra?.items ?? [])];

  const refresh = useCallback(() => {
    setMore(undefined);
    setMoreError(undefined);
    retry();
  }, [retry]);

  // Tasks may have changed on another screen.
  useFocusEffect(
    useCallback(() => {
      if (hasFocused.current) {
        refresh();
      }
      hasFocused.current = true;
    }, [refresh]),
  );

  async function loadMore() {
    const page = (extra?.page ?? 1) + 1;
    setLoadingMore(true);
    setMoreError(undefined);
    try {
      const next = await api.listTasks({ ...query, page });
      setMore({ listKey, page, items: [...(extra?.items ?? []), ...next.items] });
    } catch (failure) {
      setMoreError(failure);
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Button
          label="Create task"
          testID="create-task"
          onPress={() => router.push('/tasks/new')}
        />
      </View>

      {error !== undefined && <LoadError error={error} onRetry={refresh} />}
      {error === undefined && !data && <Loading label="Loading tasks" />}

      {error === undefined && data && (
        <>
          <StatusStrip summary={data.summary} active={status} onSelect={setStatus} />

          <View style={styles.controls}>
            <TextInput
              testID="task-search"
              accessibilityLabel="Search titles"
              placeholder="Search titles"
              placeholderTextColor={colors.inkSoft}
              autoCorrect={false}
              returnKeyType="search"
              value={input}
              onChangeText={setInput}
              style={[shared.input, styles.search]}
            />
            <Button
              label={order === 'asc' ? 'Soonest first' : 'Latest first'}
              testID="task-sort"
              variant="quiet"
              onPress={() => setOrder(order === 'asc' ? 'desc' : 'asc')}
            />
          </View>

          <FlatList
            testID="task-list"
            data={items}
            keyExtractor={(task) => task.id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => <TaskRow task={item} today={today()} />}
            refreshControl={<RefreshControl refreshing={false} onRefresh={refresh} />}
            ListEmptyComponent={
              data.summary.all === 0 ? (
                <View style={shared.notice} testID="empty-state">
                  <Text style={shared.heading}>No tasks yet</Text>
                  <Text style={shared.body}>Create your first task to get started.</Text>
                </View>
              ) : loading ? undefined : (
                <View style={shared.notice} testID="no-results">
                  <Text style={shared.heading}>No matching tasks</Text>
                  <Text style={shared.body}>Change your search or filter to see more tasks.</Text>
                  <Button
                    label="Clear filters"
                    testID="clear-filters"
                    variant="quiet"
                    onPress={() => {
                      setStatus(undefined);
                      setInput('');
                      setSearch('');
                    }}
                  />
                </View>
              )
            }
            ListFooterComponent={
              <View style={styles.footer}>
                {moreError !== undefined && (
                  <Text style={shared.error} testID="load-more-error" accessibilityRole="alert">
                    More tasks could not be loaded. Try again.
                  </Text>
                )}
                {items.length < data.total && (
                  <Button
                    label="Load more"
                    testID="load-more"
                    variant="quiet"
                    disabled={loadingMore}
                    onPress={() => void loadMore()}
                  />
                )}
              </View>
            }
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { padding: 16, paddingBottom: 12 },
  strip: { flexDirection: 'row', gap: 2, paddingHorizontal: 16 },
  segment: {
    flexBasis: 72,
    minHeight: 64,
    padding: 8,
    borderBottomWidth: 6,
    borderBottomColor: 'transparent',
  },
  segmentSelected: { borderBottomColor: colors.surface },
  count: { color: colors.surface, fontSize: 24, fontWeight: '700' },
  segmentLabel: { color: colors.surface, fontSize: 12 },
  controls: { flexDirection: 'row', gap: 8, padding: 16 },
  search: { flex: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    padding: 12,
    borderLeftWidth: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    backgroundColor: colors.surface,
  },
  rowBody: { flex: 1 },
  title: { color: colors.ink, fontSize: 16, fontWeight: '600' },
  meta: { color: colors.inkSoft, fontSize: 14 },
  overdue: { color: colors.danger, fontSize: 14, fontWeight: '700' },
  footer: { gap: 8, padding: 16 },
});
