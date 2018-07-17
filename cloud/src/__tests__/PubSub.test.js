import { publish, subscribe } from '../pubsub';

test('publishes and subscribes', () => {
  const mockCallback = jest.fn();
  const { remove } = subscribe('foo', mockCallback);
  publish('foo', { great: 'news, everybody!' });
  expect(mockCallback.mock.calls.length).toBe(1);
  expect(mockCallback.mock.calls[0][0].great).toBe('news, everybody!');
  remove();
  publish('foo', { great: 'news, everybody!' });
  expect(mockCallback.mock.calls.length).toBe(1);
});
