import { brand, fontSize, spacing } from '@taskflow/design-tokens';
import { APP_NAME } from '@taskflow/shared';
import { Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { fonts, makeStyles } from '../lib/theme';

export function Logo() {
  const styles = useStyles();
  return (
    <View style={styles.row} testID="app-title" accessible accessibilityRole="header">
      <Svg width={26} height={26} viewBox="0 0 32 32">
        <Rect width={32} height={32} rx={9} fill={brand.violet} />
        <Path
          d="M8 17l5.5 5.5L24 10"
          fill="none"
          stroke="#fff"
          strokeWidth={3.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Circle cx={24.5} cy={9.5} r={3} fill={brand.coral} />
      </Svg>
      <Text style={styles.name}>{APP_NAME}</Text>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  name: { color: colors.text, fontFamily: fonts.bold, fontSize: fontSize.lg },
}));
