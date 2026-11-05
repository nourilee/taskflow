import { ApiClientError, errorMessage, isNotFound } from '@taskflow/api-client';
import {
  formatDate,
  isOverdue,
  nextStatuses,
  PRIORITY_LABELS,
  STATUS_ACTIONS,
  STATUS_LABELS,
  statusSlug,
  type TaskStatus,
} from '@taskflow/shared';
import { fontSize, lineHeight, radius, spacing } from '@taskflow/design-tokens';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  CircleCheck,
  Pencil,
  Play,
  RotateCcw,
  Trash2,
  type LucideIcon,
} from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useCallback, useRef, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { OverdueBadge, PriorityIndicator, StatusBadge } from '../components/badges';
import { Button } from '../components/Button';
import { LoadError, Loading, TaskNotFound } from '../components/states';
import { useServices } from '../lib/app-context';
import { cardShadow, fonts, makeStyles, useSharedStyles } from '../lib/theme';
import { useLoad } from '../lib/use-load';

const ACTION_ICONS: Record<TaskStatus, LucideIcon> = {
  PENDING: RotateCcw,
  IN_PROGRESS: Play,
  COMPLETED: CircleCheck,
};

function Field({ label, value, children }: { label: string; value: string; children: ReactNode }) {
  const styles = useStyles();
  return (
    <View accessible accessibilityLabel={`${label}: ${value}`} style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function TextField({ label, value, testID }: { label: string; value: string; testID: string }) {
  const styles = useStyles();
  return (
    <Field label={label} value={value}>
      <Text style={styles.fieldValue} testID={testID}>
        {value}
      </Text>
    </Field>
  );
}

export function TaskDetails() {
  const { taskId = '' } = useLocalSearchParams<{ taskId: string }>();
  const { api, today } = useServices();
  const styles = useStyles();
  const shared = useSharedStyles();
  const load = useCallback(() => api.getTask(taskId), [api, taskId]);
  const { data: task, error, retry, setData } = useLoad(load);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<unknown>();
  const hasFocused = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (hasFocused.current) {
        retry();
      }
      hasFocused.current = true;
    }, [retry]),
  );

  if (isNotFound(error)) {
    return <TaskNotFound />;
  }
  if (error !== undefined) {
    return <LoadError error={error} onRetry={retry} />;
  }
  if (!task || task.id !== taskId) {
    return <Loading label="Loading task" />;
  }

  async function changeStatus(status: TaskStatus) {
    setBusy(true);
    setActionError(undefined);
    try {
      setData(await api.changeTaskStatus(taskId, status));
    } catch (failure) {
      setActionError(failure);
      if (failure instanceof ApiClientError && failure.code === 'INVALID_STATUS_TRANSITION') {
        retry();
      }
    } finally {
      setBusy(false);
    }
  }

  async function deleteTask() {
    setBusy(true);
    setActionError(undefined);
    try {
      await api.deleteTask(taskId);
      router.dismissTo('/');
    } catch (failure) {
      setActionError(failure);
      setBusy(false);
    }
  }

  function confirmDelete(title: string) {
    Alert.alert('Delete this task?', `This permanently deletes “${title}”.`, [
      { text: 'Keep task', style: 'cancel' },
      { text: 'Delete task', style: 'destructive', onPress: () => void deleteTask() },
    ]);
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text testID="task-title" style={styles.title} accessibilityRole="header">
          {task.title}
        </Text>
        {isOverdue(task, today()) && <OverdueBadge testID={`task-overdue-${task.id}`} />}

        <Field label="Status" value={STATUS_LABELS[task.status]}>
          <StatusBadge status={task.status} testID="task-status" />
        </Field>
        <Field label="Priority" value={PRIORITY_LABELS[task.priority]}>
          <PriorityIndicator priority={task.priority} testID="task-priority" />
        </Field>
        <TextField
          label="Due date"
          value={task.dueDate ? formatDate(task.dueDate) : 'No due date'}
          testID="task-due-date"
        />
        <TextField
          label="Description"
          value={task.description || 'No description'}
          testID="task-description"
        />
        <TextField
          label="Created"
          value={new Date(task.createdAt).toLocaleString()}
          testID="task-created-at"
        />
        <TextField
          label="Updated"
          value={new Date(task.updatedAt).toLocaleString()}
          testID="task-updated-at"
        />

        {actionError !== undefined && (
          <Text style={shared.error} testID="action-error" accessibilityRole="alert">
            {errorMessage(actionError)}
          </Text>
        )}

        <View style={styles.actions}>
          {nextStatuses(task.status).map((status) => (
            <Button
              key={status}
              label={STATUS_ACTIONS[status]}
              testID={`status-action-${statusSlug(status)}`}
              icon={ACTION_ICONS[status]}
              disabled={busy}
              onPress={() => void changeStatus(status)}
            />
          ))}
          <Button
            label="Edit task"
            testID="edit-task"
            icon={Pencil}
            variant="quiet"
            onPress={() => router.push(`/tasks/${task.id}/edit`)}
          />
          <Button
            label="Delete task"
            testID="delete-task"
            icon={Trash2}
            variant="danger"
            disabled={busy}
            onPress={() => confirmDelete(task.title)}
          />
          <Button
            label="Back to dashboard"
            testID="back-to-dashboard"
            icon={ArrowLeft}
            variant="quiet"
            onPress={() => router.dismissTo('/')}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const useStyles = makeStyles((colors, theme) => ({
  content: { padding: spacing.lg },
  card: {
    gap: spacing.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    ...cardShadow(theme),
  },
  title: {
    color: colors.text,
    fontFamily: fonts.bold,
    fontSize: fontSize.xl,
    lineHeight: lineHeight.xl,
  },
  field: { gap: spacing.xs },
  fieldLabel: {
    color: colors.textMuted,
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    lineHeight: lineHeight.sm,
  },
  fieldValue: {
    color: colors.text,
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    lineHeight: lineHeight.md,
  },
  actions: { gap: spacing.sm },
}));
