import Joi from 'joi';

import config from 'config';
import { authService } from 'services';
import { validateMiddleware } from 'middlewares';
import { AppKoaContext, Next, AppRouter } from 'types';
import { userService, User } from 'resources/user';

const schema = Joi.object({
  id: Joi.string()
    .required()
    .messages({
      'any.required': 'Id is required',
    }),
});

type ValidatedData = {
  id: string;
  user: User;
};

async function validator(ctx: AppKoaContext<ValidatedData>, next: Next) {
  const { id } = ctx.validatedData;

  const user = await userService.findOne({ _id: id });

  ctx.assertClientError(user, {
    id: 'User does not exist',
  });

  ctx.validatedData.user = user;
  await next();
}

async function handler(ctx: AppKoaContext<ValidatedData>) {
  const { user } = ctx.validatedData;

  await authService.setTokens(ctx, user._id, true);

  ctx.redirect(config.webUrl);
}

export default (router: AppRouter) => {
  router.post('/shadow-login', validateMiddleware(schema), validator, handler);
};
