import {testSapi} from '../../spec/helpers/sakura-api';
import {UserModel} from './user-model';

describe('UserModel tests', () => {
  const sapi = testSapi({
    models: [UserModel]
  });

  it('UserModel', () => {
    pending('not implemented');
  });
});
