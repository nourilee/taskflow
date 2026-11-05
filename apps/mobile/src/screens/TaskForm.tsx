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
import { radius, spacing, touchTarget, fontSize } from '@taskflow/design-tokens';
import { router, useLocalSearchParams } from 'expo-router';
import { Calendar, CircleAlert, type LucideIcon } from 'lucide-react-native';
import { useCallback, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { PRIORITY_ICONS } from '../components/badges';
import { Button } from '../components/Button';
import { LoadError, Loading, TaskNotFound } from '../components/states';
import { useServices } from '../lib/app-context';
import { fonts, makeStyles, useSharedStyles } from '../lib/theme';
import { useTheme } from '../lib/theme-context';
import { useLoad } from '../lib/use-load';

function toDate(value: string): Date {
  const [year = 0, month = 1, day = 1] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function FieldError({ field, errors }: { field: TaskField; errors: TaskFieldErrors }) {
  const { colors } = useTheme();
  const shared = useSharedStyles();
  const styles = useStyles();
  if (!errors[field]) {
    return null;
  }
  return (
    <View style={styles.errorRow}>
      <CircleAlert size={16} color={colors.danger} />
      <Text
        style={[shared.error, styles.errorText]}
        testID={`field-${field}-error`}
        accessibilityLiveRegion="polite"
      >
        {errors[field]}
      </Text>
    </View>
  );
}

// The marker is hidden from screen readers, so each field keeps its plain name.
function FieldLabel({ label, marker }: { label: string; marker?: string }) {
  const shared = useSharedStyles();
  const styles = useStyles();
  return (
    <View style={styles.labelRow}>
      <Text style={shared.label}>{label}</Text>
      {marker && (
        <Text
          style={shared.muted}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          {marker}
        </Text>
      )}
    </View>
  );
}

function Choice<T extends string>({
  label,
  field,
  value,
  options,
  labels,
  icons,
  onChange,
}: {
  label: string;
  field: TaskField;
  value: T;
  options: readonly T[];
  labels: Record<T, string>;
  icons?: Record<T, LucideIcon>;
  onChange(value: T): void;
}) {
  const { colors } = useTheme();
  const shared = useSharedStyles();
  const styles = useStyles();
  return (
    <View style={styles.field}>
      <Text style={shared.label}>{label}</Text>
      <View style={styles.choices} accessibilityRole="radiogroup" accessibilityLabel={label}>
        {options.map((option) => {
          const selected = option === value;
          const Icon: LucideIcon | undefined = icons?.[option];
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
              {Icon && <Icon size={16} color={selected ? colors.primaryText : colors.text} />}
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
  const { colors, theme } = useTheme();
  const shared = useSharedStyles();
  const styles = useStyles();
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
          <FieldLabel label="Title" marker="Required" />
          <TextInput
            testID="field-title"
            accessibilityLabel="Title"
            placeholder="What needs doing?"
            placeholderTextColor={colors.textMuted}
            value={title}
            onChangeText={setTitle}
            style={[shared.input, errors.title && styles.invalid]}
          />
          <FieldError field="title" errors={errors} />
        </View>

        <View style={styles.field}>
          <FieldLabel label="Description" marker="Optional" />
          <TextInput
            testID="field-description"
            accessibilityLabel="Description"
            multiline
            placeholder="Add any details that will help later"
            placeholderTextColor={colors.textMuted}
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
          icons={PRIORITY_ICONS}
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
          <FieldLabel label="Due date" marker="Optional" />
          <View style={styles.dateRow}>
            <Pressable
              testID="field-dueDate"
              accessibilityRole="button"
              accessibilityLabel={`Due date: ${dueDate ? formatDate(dueDate) : 'Not set'}`}
              onPress={() => setPickingDate(true)}
              style={[shared.input, styles.dateButton, errors.dueDate && styles.invalid]}
            >
              <Calendar size={18} color={colors.textMuted} />
              <Text style={dueDate ? shared.body : styles.datePlaceholder}>
                {dueDate ? formatDate(dueDate) : 'Choose a date'}
              </Text>
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
              themeVariant={theme}
              accentColor={colors.primary}
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
          busy={saving}
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

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1 },
  content: { gap: spacing.lg, padding: spacing.lg },
  field: { gap: spacing.xs },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  errorText: { flex: 1 },
  invalid: { borderWidth: 2, borderColor: colors.danger },
  multiline: { minHeight: 96, paddingTop: 10, textAlignVertical: 'top' },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  choice: {
    flexGrow: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    minHeight: touchTarget,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderControl,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
  },
  choiceSelected: {
    borderWidth: 2,
    backgroundColor: colors.primaryTint,
    borderColor: colors.primary,
  },
  choiceText: { color: colors.text, fontFamily: fonts.regular, fontSize: fontSize.md },
  choiceTextSelected: { color: colors.primaryText, fontFamily: fonts.bold },
  dateRow: { flexDirection: 'row', gap: spacing.sm },
  dateButton: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  datePlaceholder: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: fontSize.md },
}));
