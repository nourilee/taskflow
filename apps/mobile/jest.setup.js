const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  dismissTo: jest.fn(),
  canDismiss: jest.fn(),
};
let mockParams = {};

jest.mock('expo-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  return {
    router: mockRouter,
    useLocalSearchParams: () => mockParams,
    useFocusEffect: (effect) => React.useEffect(effect, [effect]),
  };
});

globalThis.setRouteParams = (params) => {
  mockParams = params;
};
globalThis.mockRouter = mockRouter;

afterEach(() => {
  jest.clearAllMocks();
  mockParams = {};
});
