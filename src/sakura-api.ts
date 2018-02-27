import {IRoutableLocals, SakuraApi} from '@sakuraapi/api';
import {SERVER_ERROR} from '@sakuraapi/api/lib/src/core/helpers/http-status';
import {
  addAuthAudience,
  AuthAudience,
  IAuthAudienceOptions
} from '@sakuraapi/auth-audience';
import {
  addAuthenticationAuthority,
  IAuthenticationAuthorityOptions
} from '@sakuraapi/auth-native-authority';
import {ICustomTokenResult} from '@sakuraapi/auth-native-authority/lib/src';
import {json} from 'body-parser';
import * as cors from 'cors';
import * as debugInit from 'debug';
import {
  NextFunction,
  Request,
  Response
} from 'express';
import * as helmet from 'helmet';
import {ConfigApi} from './api/config.api';
import {UserApi} from './api/user-api';
import {BootstrapIndexes} from './config/bootstrap/bootstrap-indexes';
import {dbs} from './config/bootstrap/db';
import {
  INVALID_BODY_PARAMETER,
  SERVICE_UNAVAILABLE
} from './lib/http-status';
import isValidEmail from './lib/verify-email';
import {UserModel} from './models/user-model';
import {
  EmailService,
  EmailServiceFactory
} from './services/email';
import {LogService} from './services/log-service';

const debug = debugInit('app:bootstrap');

export class Bootstrap {
  private emailService: EmailService;
  private log: LogService;
  private sapi: SakuraApi;
  private shuttingDown = false;

  async boot(): Promise<SakuraApi> {
    debug('boot called');
    console.log('ssssssssss============================');
    process.env.NODE_ENV = process.env.NODE_ENV || 'development';

    this.sapi = new SakuraApi({
      baseUrl: '/api',
      models: [UserModel],
      plugins: [
        {
          options: this.authNativeAuthorityOptions(),
          plugin: addAuthenticationAuthority
        },
        {
          options: this.authAudienceOptions(),
          order: 1,
          plugin: addAuthAudience
        }
      ],
      providers: [
        EmailService,
        EmailServiceFactory,
        LogService
      ],
      routables: [
        ConfigApi,
        UserApi
      ]
    });

    this.log = this.sapi.getProvider(LogService);
    this.emailService = this.sapi.getProvider(EmailService);

    // SakuraApi setup
    this.sapi.addMiddleware(cors(this.sapi.config.cors), 0);
    this.sapi.addMiddleware(helmet(), 0);
    this.sapi.addMiddleware(json());

    // Add debug tracing
    if (this.sapi.config.TRACE_REQ === 'true') {
      this.sapi.addMiddleware((req, res, next) => {
        this.log.info({
          body: req.body,
          method: req.method,
          url: req.url
        });
        next();
      });
    }

    await this.sapi.dbConnections.connectAll();

    // Bootstrap items
    const wait = [];
    wait.push(new BootstrapIndexes(this.sapi).run());
    await Promise.all(wait);

    process.once('SIGINT', () => this.shutdownServer.call(this, 'SIGINT'));
    process.once('SIGTERM', () => this.shutdownServer.call(this, 'SIGTERM'));
    process.once('SIGUSR1', () => this.shutdownServer.call(this, 'SIGUSR1'));
    process.once('SIGUSR2', () => this.shutdownServer.call(this, 'SIGUSR2'));

    return this.sapi;
  }

  authNativeAuthorityOptions(): IAuthenticationAuthorityOptions {
    return {
      authDbConfig: dbs.authentication,
      authenticator: AuthAudience,
      defaultDomain: 'default',
      endpoints: {create: 'users'},
      onBeforeUserCreate: this.onBeforeUserCreate.bind(this),
      onChangePasswordEmailRequest: this.onChangePasswordEmailRequest.bind(this),
      onForgotPasswordEmailRequest: this.onForgotPasswordEmailRequest.bind(this),
      onInjectCustomToken,
      onLoginSuccess: this.onLoginSuccess.bind(this),
      onResendEmailConfirmation: this.onResendEmailConfirmation.bind(this),
      onUserCreated: this.onUserCreated.bind(this),
      userDbConfig: dbs.user
    };
  }

  async onBeforeUserCreate(req: Request, res: Response, next: NextFunction) {
    debug('onBeforeUserCreate called');
    console.log('onBeforeUserCreate called -================');
    return next();
  }

  async onChangePasswordEmailRequest(user: any, req: Request, res: Response): Promise<any> {
    // (this.emailService as any).onChangePasswordEmailRequest(...arguments);
  }

  async onForgotPasswordEmailRequest(user: any, token: string, req: Request, res: Response): Promise<any> {
    // (this.emailService as any).onForgotPasswordEmailRequest(...arguments);
  }

  async onLoginSuccess(user: any, jwt: any, sa: SakuraApi, req: Request, res: Response): Promise<void> {
    debug('onLoginSuccess called');
    this.log.debug(`User ${user.id} login; JWT id: ${jwt.id}`);
  }

  async onResendEmailConfirmation(user: any, token: string, req: Request, res: Response): Promise<any> {
    debug('onResendEmailConfirmation called');
    // (this.emailService as any).onResendEmailConfirmation(...arguments);
  }

  async onUserCreated(user: any, token: string, req: Request, res: Response): Promise<any> {
    debug('onUserCreated called');

    // const resLocals = res.locals;

    const usr = Object.assign({}, user);
    usr._id = user.id;

    const userModel = UserModel.fromDb(usr);
    // userModel.salesForceId = resLocals.userMeta.salesForceId;
    // userModel.stripeCustomerId = resLocals.userMeta.stripeId;

    await userModel.save();
    res
      .status(200)
      .json({user: user, token: token});
    // await this.onUserCreatedSendWelcomeEmail(userModel, token, req, res)
    //   .catch((err) => this.log.error('SakuraApi.onUserCreated error when sending welcome email', err));
  }

  async onUserCreatedSendWelcomeEmail(user: any, token: string, req: Request, res: Response): Promise<void> {
    // (this.emailService as any).onUserCreated(...arguments);
    console.log('user created && email sented -================');
  }

  async shutdownServer(signal: string): Promise<void> {
    debug(`shutdownServer called by ${signal}`);

    if (this.shuttingDown) {
      return;
    }

    this.shuttingDown = true;

    this.log.info(`Shutting down Donation Server (signal: ${signal})`);

    await this.sapi
      .close()
      .catch((err) => this.log.error('Unable to shutdown SakuraApi', err));

    this.log.info('And now his watch is ended');
    process.exit(0);
  }

  private authAudienceOptions(): IAuthAudienceOptions {
    return {};
  }

}

export function onInjectCustomToken(token: any, key: string, issuer: string,
                                    expiration: string, payload: any, jwtId: string): Promise<ICustomTokenResult[]> {

  debug('onInjectCustomToken called');

  // NOTE THERE IS A DEPENDENCY PROBLEM THAT'S PREVENTING THIS FROM BEING LOADED FROM THE CONFIG
  // THIS COMMIT IS HAPPENING TO GET SOME TESTING DONE, THEN THAT ISSUE WILL BE RESOLVED, See TSCILB-172
  return Promise.resolve([{
    audience: 'score.seedconnect.com',
    token: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyIjoiNTgwOGJkNmQ4MTBjMGFjNGQ4OGFkYTQ1IiwiYXBpU2VjcmV0I' +
    'joiOGM1YmRhMDktOWI5MS02OGQ0LTk5OTMtZTA3YzNkMzQ1ZTYyIiwiaWF0IjoxNTAwOTE3MjE3fQ.iuxACmlvfevrZo5ja9ugRxkIwcb' +
    '8FSi32zcX8kcOC_8'
  }]);
}
