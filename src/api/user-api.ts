import {
  IRoutableLocals,
  Routable,
  Route,
  SakuraApi,
  SapiRoutableMixin
} from '@sakuraapi/api';
import {
  getRouteHandler,
  putRouteHandler
} from '@sakuraapi/api/lib/src/handlers';
import {AuthAudience} from '@sakuraapi/auth-audience';
import {
  NextFunction,
  Request,
  Response
} from 'express';
import {
  FORBIDDEN,
  SERVER_ERROR
} from '../lib/http-status';
import {JsonWebToken} from '../models/json-web-token';
import {UserModel} from '../models/user-model';

export {SakuraApi};

@Routable({
  authenticator: AuthAudience,
  baseUrl: 'users',
  model: UserModel,
  suppressApi: true
})
export class UserApi extends SapiRoutableMixin() {
  /*
   *  post /user (user creation) is implemented by auth-native-authority... see sakura-api.ts for config
   */

  constructor() {
    super();
  }

  // @Route({
  //   after: [getRouteHandler],
  //   method: 'get',
  //   path: ':id'
  // })
  // getUserById(req: Request, res: Response, next: NextFunction) {
  //
  //   try {
  //     const jwt = (res.locals.jwt) ? JsonWebToken.fromJson(res.locals.jwt) : null;
  //     const id = req.params.id;
  //
  //     if (id !== jwt.id) {
  //       res
  //         .status(FORBIDDEN)
  //         .json({error: 'FORBIDDEN'});
  //     }
  //   } catch (err) {
  //     res
  //       .status(SERVER_ERROR)
  //       .json({error: 'SERVER_ERROR'});
  //   }
  //
  //   next();
  // }
  //
  // @Route({
  //   after: [putRouteHandler],
  //   method: 'put',
  //   path: ':id'
  // })
  // saveUser(req: Request, res: Response, next: NextFunction) {
  //   const id = req.params.id;
  //   const jwt = res.locals.jwt || {};
  //   const resLocals = res.locals as IRoutableLocals;
  //
  //   // make sure the user can only update him/her self
  //   if (jwt.id !== id) {
  //     res
  //       .status(FORBIDDEN)
  //       .json({error: 'FORBIDDEN'});
  //     return next();
  //   }
  //
  //   // Check to see if the address has been modified,
  //   // if it has, update stripe and salesforce... otherwise,
  //   // skip directly to updating the user using the [putRouteHandler]
  //   UserModel
  //     .getById(id)
  //     .then((user) => {
  //       res
  //         .status(200)
  //         .json(user);
  //       return next();
  //     })
  //     .then(() => next())
  //     .catch((err) => {
  //       res
  //         .status(SERVER_ERROR)
  //         .json({error: 'SERVER_ERROR'});
  //       return next();
  //     });
  // }
}
