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
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { LoadError, Loading, TaskNotFound } from '../components/states';
import { useServices } from '../lib/app-context';
import { colors, shared, statusColors } from '../lib/theme';
import { useLoad } from '../lib/use-load';

function Field({ label, value, testID }: { label: string; value: string; testID: string }) {
  return (
    <View accessible accessibilityLabel={`${label}: ${value}`}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue} testID={testID}>
        {value}
      </Text>
    </View>
  );
}

export function TaskDetails() {
  const { taskId = '' } = useLocalSearchParams<{ taskId: string }>();
  const { api, today } = useServices();
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
      <View style={[styles.card, { borderTopColor: statusColors[task.status] }]}>
        <Text testID="task-title" style={styles.title} accessibilityRole="header">
          {task.title}
        </Text>
        {isOverdue(task, today()) && (
          <Text testID={`task-overdue-${task.id}`} style={styles.overdue}>
            Overdue
          </Text>
        )}

        <Field label="Status" value={STATUS_LABELS[task.status]} testID="task-status" />
        <Field label="Priority" value={PRIORITY_LABELS[task.priority]} testID="task-priority" />
        <Field
          label="Due date"
          value={task.dueDate ? formatDate(task.dueDate) : 'No due date'}
          testID="task-due-date"
        />
        <Field
          label="Description"
          value={task.description || 'No description'}
          testID="task-description"
        />
        <Field
          label="Created"
          value={new Date(task.createdAt).toLocaleString()}
          testID="task-created-at"
        />
        <Field
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
              disabled={busy}
              onPress={() => void changeStatus(status)}
            />
          ))}
          <Button
            label="Edit task"
            testID="edit-task"
            variant="quiet"
            onPress={() => router.push(`/tasks/${task.id}/edit`)}
          />
          <Button
            label="Delete task"
            testID="delete-task"
            variant="danger"
            disabled={busy}
            onPress={() => confirmDelete(task.title)}
          />
          <Button
            label="Back to dashboard"
            testID="back-to-dashboard"
            variant="quiet"
            onPress={() => router.dismissTo('/')}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16 },
  card: {
    gap: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.line,
    borderTopWidth: 6,
    backgroundColor: colors.surface,
  },
  title: { color: colors.ink, fontSize: 26, fontWeight: '700' },
  overdue: { color: colors.danger, fontSize: 14, fontWeight: '700' },
  fieldLabel: { color: colors.inkSoft, fontSize: 14 },
  fieldValue: { color: colors.ink, fontSize: 16, fontWeight: '600' },
  actions: { gap: 8 },
});
