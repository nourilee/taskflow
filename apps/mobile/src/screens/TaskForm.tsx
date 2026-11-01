import { errorMessage, isNotFound, taskFieldErrors } from '@taskflow/api-client';
import {
  formatDate,
  localToday,
  nextStatuses,
  PRIORITY_LABELS,
  STATUS_LABELS,
  TASK_PRIORITIES,
  TASK_STATUSES,
  validateTaskForm,
  type Task,
  type TaskField,
  type TaskFieldErrors,
  type TaskPriority,
  type TaskStatus,
} from '@taskflow/shared';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Button } from '../components/Button';
import { LoadError, Loading, TaskNotFound } from '../components/states';
import { useServices } from '../lib/app-context';
import { colors, shared } from '../lib/theme';
import { useLoad } from '../lib/use-load';

function toDate(value: string): Date {
  const [year = 0, month = 1, day = 1] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function FieldError({ field, errors }: { field: TaskField; errors: TaskFieldErrors }) {
  if (!errors[field]) {
    return null;
  }
  return (
    <Text style={shared.error} testID={`field-${field}-error`} accessibilityLiveRegion="polite">
      {errors[field]}
    </Text>
  );
}

function Choice<T extends string>({
  label,
  field,
  value,
  options,
  labels,
  onChange,
}: {
  label: string;
  field: TaskField;
  value: T;
  options: readonly T[];
  labels: Record<T, string>;
  onChange(value: T): void;
}) {
  return (
    <View style={styles.field}>
      <Text style={shared.label}>{label}</Text>
      <View style={styles.choices} accessibilityRole="radiogroup" accessibilityLabel={label}>
        {options.map((option) => {
          const selected = option === value;
          return (
            <Pressable
              key={option}
              testID={`field-${field}-${option}`}
              accessibilityRole="radio"
              accessibilityLabel={labels[option]}
              accessibilityState={{ selected }}
              onPress={() => onChange(option)}
              style={[styles.choice, selected && styles.choiceSelected]}
            >
              <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>
                {labels[option]}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function Form({ task }: { task?: Task }) {
  const { api, today } = useServices();
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? 'MEDIUM');
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? 'PENDING');
  const [dueDate, setDueDate] = useState(task?.dueDate ?? '');
  const [pickingDate, setPickingDate] = useState(false);
  const [errors, setErrors] = useState<TaskFieldErrors>({});
  const [formError, setFormError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const submitting = useRef(false);

  const statusOptions = task ? [task.status, ...nextStatuses(task.status)] : TASK_STATUSES;

  async function save() {
    if (submitting.current) {
      return;
    }
    const result = validateTaskForm(
      { title, description, priority, status, dueDate },
      today(),
      task,
    );
    setErrors(result.valid ? {} : result.errors);
    setFormError(undefined);
    if (!result.valid) {
      return;
    }

    submitting.current = true;
    setSaving(true);
    try {
      if (task) {
        await api.updateTask(task.id, result.data);
        router.dismissTo(`/tasks/${task.id}`);
      } else {
        const created = await api.createTask(result.data);
        router.replace(`/tasks/${created.id}`);
      }
    } catch (failure) {
      const fieldErrors = taskFieldErrors(failure);
      setErrors(fieldErrors);
      if (Object.keys(fieldErrors).length === 0) {
        setFormError(errorMessage(failure));
      }
      submitting.current = false;
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        testID="task-form"
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {formError && (
          <Text style={shared.error} testID="form-error" accessibilityRole="alert">
            {formError}
          </Text>
        )}

        <View style={styles.field}>
          <Text style={shared.label}>Title</Text>
          <TextInput
            testID="field-title"
            accessibilityLabel="Title"
            value={title}
            onChangeText={setTitle}
            style={[shared.input, errors.title && styles.invalid]}
          />
          <FieldError field="title" errors={errors} />
        </View>

        <View style={styles.field}>
          <Text style={shared.label}>Description</Text>
          <TextInput
            testID="field-description"
            accessibilityLabel="Description"
            multiline
            value={description}
            onChangeText={setDescription}
            style={[shared.input, styles.multiline, errors.description && styles.invalid]}
          />
          <FieldError field="description" errors={errors} />
        </View>

        <Choice
          label="Priority"
          field="priority"
          value={priority}
          options={TASK_PRIORITIES}
          labels={PRIORITY_LABELS}
          onChange={setPriority}
        />
        <FieldError field="priority" errors={errors} />

        <Choice
          label="Status"
          field="status"
          value={status}
          options={statusOptions}
          labels={STATUS_LABELS}
          onChange={setStatus}
        />
        <FieldError field="status" errors={errors} />

        <View style={styles.field}>
          <Text style={shared.label}>Due date</Text>
          <View style={styles.dateRow}>
            <Pressable
              testID="field-dueDate"
              accessibilityRole="button"
              accessibilityLabel={`Due date: ${dueDate ? formatDate(dueDate) : 'Not set'}`}
              onPress={() => setPickingDate(true)}
              style={[shared.input, styles.dateButton, errors.dueDate && styles.invalid]}
            >
              <Text style={shared.body}>{dueDate ? formatDate(dueDate) : 'Choose a date'}</Text>
            </Pressable>
            {dueDate !== '' && (
              <Button
                label="Clear"
                testID="clear-due-date"
                variant="quiet"
                onPress={() => {
                  setDueDate('');
                  setPickingDate(false);
                }}
              />
            )}
          </View>
          <FieldError field="dueDate" errors={errors} />
          {pickingDate && (
            <DateTimePicker
              testID="due-date-picker"
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              value={dueDate ? toDate(dueDate) : toDate(today())}
              onValueChange={(_event, date) => {
                setDueDate(localToday(date));
                setPickingDate(Platform.OS === 'ios');
              }}
              onDismiss={() => setPickingDate(false)}
            />
          )}
        </View>

        <Button
          label={saving ? 'Saving' : task ? 'Save changes' : 'Create task'}
          testID="save-task"
          disabled={saving}
          onPress={() => void save()}
        />
        <Button label="Cancel" testID="cancel-form" variant="quiet" onPress={() => router.back()} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function CreateTask() {
  return <Form />;
}

export function EditTask() {
  const { taskId = '' } = useLocalSearchParams<{ taskId: string }>();
  const { api } = useServices();
  const load = useCallback(() => api.getTask(taskId), [api, taskId]);
  const { data: task, error, retry } = useLoad(load);

  if (isNotFound(error)) {
    return <TaskNotFound />;
  }
  if (error !== undefined) {
    return <LoadError error={error} onRetry={retry} />;
  }
  if (!task) {
    return <Loading label="Loading task" />;
  }
  return <Form key={task.id} task={task} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { gap: 16, padding: 16 },
  field: { gap: 4 },
  invalid: { borderWidth: 2, borderColor: colors.danger },
  multiline: { minHeight: 96, paddingTop: 10, textAlignVertical: 'top' },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.inkSoft,
    borderRadius: 4,
    backgroundColor: colors.surface,
  },
  choiceSelected: { backgroundColor: colors.ink, borderColor: colors.ink },
  choiceText: { color: colors.ink, fontSize: 16 },
  choiceTextSelected: { color: colors.surface, fontWeight: '600' },
  dateRow: { flexDirection: 'row', gap: 8 },
  dateButton: { flex: 1, justifyContent: 'center' },
});
