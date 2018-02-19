import {
  Injectable,
  SakuraApi,
  SapiInjectableMixin
} from '@sakuraapi/api';
import * as debugInit from 'debug';
import * as Email from 'email-templates';
import {
  Request,
  Response
} from 'express';
import {createTransport} from 'nodemailer';
import {join} from 'path';

export {SakuraApi};

const debug = debugInit('profile:email');

@Injectable()
export class EmailServiceFactory extends SapiInjectableMixin() {

  private email: Email;

  constructor() {
    super();

    const send = ((this.sapiConfig.smtpOptions || {} as any).send === undefined)
      ? false
      : this.sapiConfig.smtpOptions.send;

    const preview = ((this.sapiConfig.smtpOptions || {} as any).preview === undefined)
      ? true
      : this.sapiConfig.smtpOptions.preview;

    const root = join(__dirname, '../', (this.sapi.config.smtpOptions || {} as any).templates || 'config/templates/email');
    debug(`email template path %s`, root);

    this.email = new Email({
      message: {
        from: (this.sapi.config.smtpOptions || {} as any).from || '---set env smtpOptions.from---'
      },
      preview,
      send,
      transport: createTransport(this.sapi.config.smtp),
      views: {
        options: {
          extension: 'ejs'
        },
        root
      }
    });
  }

  getEmailTemplateService(): Email {
    return this.email;
  }
}

@Injectable()
export class EmailService extends SapiInjectableMixin() {

  private disabled = false;
  private email: Email;
  private emailOptions = {
    forgotPasswordTokenUrl: '',
    newUserTokenUrl: ''
  };

  constructor(private emailServiceFactory: EmailServiceFactory) {
    super();

    this.emailOptions.forgotPasswordTokenUrl = (this.sapi.config.smtpOptions || {} as any).forgotPasswordTokenUrl
      || '---set env smtpOptions.forgotPasswordTokenUrl---';

    this.emailOptions.newUserTokenUrl = (this.sapi.config.smtpOptions || {}  as any).newUserTokenUrl
      || '---set env smtpOptions.newUserTokenUrl---';

    this.email = this.emailServiceFactory.getEmailTemplateService();

    this.disabled = this.sapi.config.EMAIL_DISABLED === 'true';
  }

  /**
   * Triggered when a user's password has been changed to notify them of the change.
   */
  async onChangePasswordEmailRequest(user: any, req: Request, res: Response): Promise<void> {
    debug('.onChangePasswordEmailRequest called');

    if (!user || this.disabled) {
      return;
    }

    try {
      await this.email.send({
        locals: {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName
        },
        message: {
          to: `${user.firstName}${user.firstName ? ' ' : ''}${user.lastName}<${user.email}>`
        },
        template: 'change-password'
      });
    } catch (err) {
      console.log('unable to send password changed email', err);
      return Promise.reject(err);
    }

    res
      .locals
      .send(200, {ok: `email sent`});
  }

  /**
   * Triggered when a user has requested a forgot password email
   */
  async onForgotPasswordEmailRequest(user: any, token: string, req: Request, res: Response): Promise<void> {
    debug('.onForgotPasswordEmailRequest');

    if (!user || !token || this.disabled) {
      return;
    }

    try {
      await this.email.send({
        locals: {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          tokenUrl: `${this.emailOptions.forgotPasswordTokenUrl}?token=${token}`
        },
        message: {
          to: `${user.firstName}${user.firstName ? ' ' : ''}${user.lastName}<${user.email}>`
        },
        template: 'forgot-password'
      });
    } catch (err) {
      console.log('unable to send forgot password email', err);
      return Promise.reject(err);
    }

    res
      .locals
      .send(200, {ok: `email sent`});
  }

  /**
   * Triggered when a user requests that email confirmation be resent
   */
  async onResendEmailConfirmation(user: any, token: string, req: Request, res: Response): Promise<void> {
    debug('.onResendEmailConfirmation called');

    if (!user || !token || this.disabled) {
      return;
    }

    try {
      await this.email.send({
        locals: {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          tokenUrl: `${this.emailOptions.newUserTokenUrl}?token=${token}`
        },
        message: {
          to: `${user.firstName}${user.firstName ? ' ' : ''}${user.lastName}<${user.email}>`
        },
        template: 'welcome-resend'
      });
    } catch (err) {
      console.log('unable to resend email confirmation', err);
      return Promise.reject(err);
    }

    res
      .locals
      .send(200, {ok: `email sent`});
  }

  /**
   * Triggered when a user is created
   */
  async onUserCreated(user: any, token: string, req: Request, res: Response): Promise<void> {
    debug('.onUserCreated called');
    console.log('onUserCreated called====');
    if (!user || !token || this.disabled) {
      console.log('user not found==', user);
      console.log('token not created==', token);
      return;
    }

    try {
      await this.email.send({
        locals: {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          tokenUrl: `${this.emailOptions.newUserTokenUrl}?token=${token}`
        },
        message: {
          to: `${user.firstName}${user.firstName ? ' ' : ''}${user.lastName}<${user.email}>`
        },
        template: 'welcome'
      });
    } catch (err) {
      console.log('unable to send user created email', err);
      return Promise.reject(err);
    }

    res
      .locals
      .send(200, {ok: `email sent`});
  }
}
