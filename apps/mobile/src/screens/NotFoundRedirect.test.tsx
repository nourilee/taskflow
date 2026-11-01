import { renderScreen } from '../test/harness';
import { NotFoundRedirect } from './NotFoundRedirect';

describe('NotFoundRedirect', () => {
  it('returns to the existing dashboard instead of stacking another', async () => {
    mockRouter.canDismiss.mockReturnValue(true);

    await renderScreen(<NotFoundRedirect />);

    expect(mockRouter.dismissTo).toHaveBeenCalledWith('/');
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('replaces the route when nothing is underneath', async () => {
    mockRouter.canDismiss.mockReturnValue(false);

    await renderScreen(<NotFoundRedirect />);

    expect(mockRouter.replace).toHaveBeenCalledWith('/');
    expect(mockRouter.dismissTo).not.toHaveBeenCalled();
  });
});
