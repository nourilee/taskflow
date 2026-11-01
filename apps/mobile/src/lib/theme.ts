import type { TaskStatus } from '@taskflow/shared';
import { StyleSheet } from 'react-native';

export const colors = {
  ink: '#16243a',
  inkSoft: '#4b5c73',
  paper: '#e9eff4',
  surface: '#fbfcfd',
  line: '#bccad6',
  danger: '#ad1038',
};

export const statusColors: Record<TaskStatus, string> = {
  PENDING: '#a14a06',
  IN_PROGRESS: '#1a56c4',
  COMPLETED: '#16704a',
};

export const shared = StyleSheet.create({
  button: {
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 4,
    backgroundColor: colors.ink,
  },
  buttonText: { color: colors.surface, fontSize: 16, fontWeight: '600' },
  quiet: { backgroundColor: 'transparent' },
  quietText: { color: colors.ink },
  dangerQuiet: { backgroundColor: 'transparent', borderColor: colors.danger },
  dangerText: { color: colors.danger },
  disabled: { opacity: 0.55 },
  notice: {
    gap: 12,
    alignItems: 'flex-start',
    margin: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  heading: { color: colors.ink, fontSize: 20, fontWeight: '700' },
  body: { color: colors.ink, fontSize: 16 },
  error: { color: colors.danger, fontSize: 14, fontWeight: '600' },
  input: {
    minHeight: 44,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: colors.inkSoft,
    borderRadius: 4,
    backgroundColor: colors.surface,
    color: colors.ink,
    fontSize: 16,
  },
  label: { color: colors.ink, fontSize: 16, fontWeight: '600' },
});
