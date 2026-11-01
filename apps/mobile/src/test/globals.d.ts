declare const mockRouter: {
  push: jest.Mock;
  replace: jest.Mock;
  back: jest.Mock;
  dismissTo: jest.Mock;
};
declare function setRouteParams(params: Record<string, string>): void;
