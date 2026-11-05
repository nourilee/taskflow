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
import { brand, fontSize, lineHeight, radius, spacing, themes } from '@taskflow/design-tokens';
import { router, useFocusEffect } from 'expo-router';
import { ArrowUpDown, Calendar, ListTodo, Plus, SearchX } from 'lucide-react-native';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, TextInput, View } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { OverdueBadge, PriorityIndicator, STATUS_ICONS, StatusBadge } from '../components/badges';
import { Button } from '../components/Button';
import { LoadError, Loading } from '../components/states';
import { useServices } from '../lib/app-context';
import { cardShadow, fonts, makeStyles, statusColors, useSharedStyles } from '../lib/theme';
import { useTheme } from '../lib/theme-context';
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

function SummaryCards({
  summary,
  active,
  onSelect,
}: {
  summary: TaskListResponse['summary'];
  active: TaskStatus | undefined;
  onSelect(status: TaskStatus | undefined): void;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  const options = [
    {
      key: 'all',
      label: 'Total tasks',
      count: summary.all,
      status: undefined,
      icon: ListTodo,
      color: colors.primaryText,
    },
    ...TASK_STATUSES.map((status) => ({
      key: statusSlug(status),
      label: STATUS_LABELS[status],
      count: summary[SUMMARY_KEYS[status]],
      status,
      icon: STATUS_ICONS[status],
      color: statusColors(colors, status).color,
    })),
  ];

  return (
    <View style={styles.summary}>
      <View style={styles.cards} accessibilityLabel="Filter by status">
        {options.map(({ key, label, count, status, icon: Icon, color }) => {
          const selected = active === status;
          return (
            <Pressable
              key={key}
              testID={`status-filter-${key}`}
              accessibilityRole="button"
              accessibilityLabel={`${label}, ${count}`}
              accessibilityState={{ selected }}
              onPress={() => onSelect(status)}
              style={[styles.card, selected && styles.cardSelected]}
            >
              <Text testID={`dashboard-summary-${key}`} style={styles.count}>
                {count}
              </Text>
              <Icon size={14} color={color} />
              <Text
                style={[styles.cardLabel, selected && styles.cardLabelSelected]}
                numberOfLines={2}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View
        style={styles.flow}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <View style={{ flex: summary.pending, backgroundColor: brand.amber }} />
        <View style={{ flex: summary.inProgress, backgroundColor: brand.blue }} />
        <View style={{ flex: summary.completed, backgroundColor: brand.teal }} />
      </View>
    </View>
  );
}

function TaskRow({ task, today }: { task: Task; today: string }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const shared = useSharedStyles();
  const overdue = isOverdue(task, today);
  const due = task.dueDate ? `Due ${formatDate(task.dueDate)}` : 'No due date';
  const meta = `${STATUS_LABELS[task.status]}. ${PRIORITY_LABELS[task.priority]} priority. ${due}.`;
  return (
    <Pressable
      testID={`task-card-${task.id}`}
      accessibilityRole="button"
      accessibilityLabel={`${task.title}. ${meta}${overdue ? ' Overdue.' : ''}`}
      onPress={() => router.push(`/tasks/${task.id}`)}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <Text style={styles.title}>{task.title}</Text>
      <View style={styles.rowMeta}>
        <StatusBadge status={task.status} />
        <PriorityIndicator priority={task.priority} />
      </View>
      <View style={styles.rowMeta}>
        <View style={styles.due}>
          <Calendar size={14} color={colors.textMuted} />
          <Text style={shared.muted}>{due}</Text>
        </View>
        {overdue && <OverdueBadge testID={`task-overdue-${task.id}`} />}
      </View>
    </Pressable>
  );
}

export function Dashboard() {
  const { api, today } = useServices();
  const { colors } = useTheme();
  const styles = useStyles();
  const shared = useSharedStyles();
  const bottomInset = useContext(SafeAreaInsetsContext)?.bottom ?? 0;
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
      <Text style={styles.heading} accessibilityRole="header">
        Tasks
      </Text>

      {error !== undefined && <LoadError error={error} onRetry={refresh} />}
      {error === undefined && !data && <Loading label="Loading tasks" />}

      {error === undefined && data && (
        <>
          <SummaryCards summary={data.summary} active={status} onSelect={setStatus} />

          <View style={styles.controls}>
            <TextInput
              testID="task-search"
              accessibilityLabel="Search titles"
              placeholder="Search titles"
              placeholderTextColor={colors.textMuted}
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
              icon={ArrowUpDown}
              onPress={() => setOrder(order === 'asc' ? 'desc' : 'asc')}
            />
          </View>

          <FlatList
            testID="task-list"
            data={items}
            keyExtractor={(task) => task.id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => <TaskRow task={item} today={today()} />}
            refreshControl={
              <RefreshControl
                refreshing={false}
                onRefresh={refresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
                progressBackgroundColor={colors.surface}
              />
            }
            ListEmptyComponent={
              data.summary.all === 0 ? (
                <View style={shared.notice} testID="empty-state">
                  <ListTodo size={28} color={colors.primaryText} />
                  <Text style={shared.heading}>No tasks yet</Text>
                  <Text style={shared.body}>Create your first task to get started.</Text>
                </View>
              ) : loading ? undefined : (
                <View style={shared.notice} testID="no-results">
                  <SearchX size={28} color={colors.primaryText} />
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

      <Pressable
        testID="create-task"
        accessibilityRole="button"
        accessibilityLabel="Create task"
        onPress={() => router.push('/tasks/new')}
        style={({ pressed }) => [
          styles.create,
          { bottom: spacing.lg + bottomInset },
          pressed && styles.createPressed,
        ]}
      >
        <Plus size={20} color={colors.onPrimary} />
        <Text style={styles.createText}>Create task</Text>
      </Pressable>
    </View>
  );
}

// Leaves the last row clear of the floating Create task button.
const CREATE_BUTTON_CLEARANCE = 88;

const useStyles = makeStyles((colors, theme) => ({
  screen: { flex: 1 },
  heading: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    color: colors.text,
    fontFamily: fonts.bold,
    fontSize: fontSize.xl,
    lineHeight: lineHeight.xl,
  },
  summary: { gap: spacing.sm, paddingHorizontal: spacing.lg },
  cards: { flexDirection: 'row', gap: spacing.sm },
  card: {
    flex: 1,
    minHeight: 92,
    gap: 2,
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    ...cardShadow(theme),
  },
  cardSelected: { borderWidth: 2, borderColor: colors.primary },
  count: { color: colors.text, fontFamily: fonts.bold, fontSize: fontSize.lg },
  cardLabel: {
    color: colors.textMuted,
    fontFamily: fonts.medium,
    fontSize: fontSize.xs,
    lineHeight: lineHeight.xs,
    textAlign: 'center',
  },
  cardLabelSelected: { color: colors.text, fontFamily: fonts.semibold },
  flow: {
    flexDirection: 'row',
    gap: 3,
    height: 6,
    borderRadius: radius.pill,
    overflow: 'hidden',
    backgroundColor: colors.border,
  },
  controls: { flexDirection: 'row', gap: spacing.sm, padding: spacing.lg },
  search: { flex: 1 },
  row: {
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    ...cardShadow(theme),
  },
  rowPressed: { backgroundColor: colors.surfaceHover },
  rowMeta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm },
  due: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  title: { color: colors.text, fontFamily: fonts.semibold, fontSize: fontSize.md },
  footer: { gap: spacing.sm, padding: spacing.lg, paddingBottom: CREATE_BUTTON_CLEARANCE },
  create: {
    position: 'absolute',
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    shadowColor: themes.dark.background,
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  createPressed: { backgroundColor: colors.primaryHover },
  createText: { color: colors.onPrimary, fontFamily: fonts.semibold, fontSize: fontSize.md },
}));
