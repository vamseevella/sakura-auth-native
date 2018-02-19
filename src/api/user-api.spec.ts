import {testSapi} from '../../spec/helpers/sakura-api';
import {UserApi} from './user-api';

describe('UserApi tests', () => {
  const sapi = testSapi({
    routables: [UserApi]
  });

  it('UserApi', () => {
    pending('not implemented');
  });
});
