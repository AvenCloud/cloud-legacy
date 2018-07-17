import dispatch from '../dispatch';

test('dispatch errors with bad action name', () => {
  return dispatch({
    type: 'Bad',
  }).catch(e => {
    expect(e.message).toBe('Action type "Bad" not found');
  });
});
