/* eslint-disable @typescript-eslint/no-require-imports */
const {
  AndroidConfig,
  withAndroidColors,
  withAndroidColorsNight,
  withAndroidStyles,
} = require('expo/config-plugins');

const { Colors, Styles } = AndroidConfig;
const ACCENT = 'colorAccent';

function setAccent(config, value) {
  config.modResults = Colors.assignColorValue(config.modResults, { name: ACCENT, value });
  return config;
}

// Native dialogs read colorAccent, and Expo has no app.json setting for it.
module.exports = function withAndroidAccent(config, { light, dark }) {
  config = withAndroidColors(config, (next) => setAccent(next, light));
  config = withAndroidColorsNight(config, (next) => setAccent(next, dark));
  return withAndroidStyles(config, (next) => {
    next.modResults = Styles.assignStylesValue(next.modResults, {
      add: true,
      parent: Styles.getAppThemeGroup(),
      name: ACCENT,
      value: `@color/${ACCENT}`,
    });
    return next;
  });
};
