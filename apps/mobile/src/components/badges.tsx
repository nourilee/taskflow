import { fontSize, lineHeight, radius, spacing } from '@taskflow/design-tokens';
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  type TaskPriority,
  type TaskStatus,
} from '@taskflow/shared';
import {
  ChevronDown,
  ChevronsUp,
  Circle,
  CircleCheck,
  CircleDashed,
  Minus,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react-native';
import { Text, View } from 'react-native';
import { fonts, makeStyles, statusColors } from '../lib/theme';
import { useTheme } from '../lib/theme-context';

export const STATUS_ICONS: Record<TaskStatus, LucideIcon> = {
  PENDING: Circle,
  IN_PROGRESS: CircleDashed,
  COMPLETED: CircleCheck,
};

export const PRIORITY_ICONS: Record<TaskPriority, LucideIcon> = {
  LOW: ChevronDown,
  MEDIUM: Minus,
  HIGH: ChevronsUp,
};

function Badge({
  label,
  icon: Icon,
  color,
  tint,
  testID,
}: {
  label: string;
  icon: LucideIcon;
  color: string;
  tint: string;
  testID?: string;
}) {
  const styles = useStyles();
  return (
    <View style={[styles.badge, { backgroundColor: tint }]}>
      <Icon size={14} color={color} />
      <Text testID={testID} style={[styles.badgeText, { color }]}>
        {label}
      </Text>
    </View>
  );
}

export function StatusBadge({ status, testID }: { status: TaskStatus; testID?: string }) {
  const { colors } = useTheme();
  return (
    <Badge
      label={STATUS_LABELS[status]}
      icon={STATUS_ICONS[status]}
      testID={testID}
      {...statusColors(colors, status)}
    />
  );
}

export function OverdueBadge({ testID }: { testID: string }) {
  const { colors } = useTheme();
  return (
    <Badge
      label="Overdue"
      icon={TriangleAlert}
      color={colors.danger}
      tint={colors.dangerTint}
      testID={testID}
    />
  );
}

export function PriorityIndicator({
  priority,
  testID,
}: {
  priority: TaskPriority;
  testID?: string;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  const Icon = PRIORITY_ICONS[priority];
  const color = priority === 'HIGH' ? colors.danger : colors.textMuted;
  return (
    <View style={styles.priority}>
      <Icon size={16} color={color} />
      <Text testID={testID} style={[styles.priorityText, { color }]}>
        {PRIORITY_LABELS[priority]}
      </Text>
    </View>
  );
}

const useStyles = makeStyles(() => ({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  badgeText: { fontFamily: fonts.semibold, fontSize: fontSize.xs, lineHeight: lineHeight.xs + 2 },
  priority: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  priorityText: { fontFamily: fonts.medium, fontSize: fontSize.sm, lineHeight: lineHeight.sm },
}));
