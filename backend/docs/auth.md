# Auth — JWT

Auth is configured per-app using `@nestjs/passport` + `passport-jwt`. The guard is registered globally — all routes are protected by default and opt out with `@Public()`.

---

## Guard Registration

```ts
// app.module.ts
@Module({
  providers: [{ provide: APP_GUARD, useClass: JwtAuthGuard }],
})
export class AppModule {}
```

---

## Decorators

```ts
// @Public() — opt a route out of the global guard
export const Public = () => SetMetadata('isPublic', true);

// @CurrentUser() — extract validated JWT payload from request
export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext) => ctx.switchToHttp().getRequest().user
);
```

---

## Usage in Controllers

```ts
// protected by default — no decorator needed
@Get('me')
getMe(@CurrentUser() user: JwtPayload) {
  return this.queryBus.execute(new GetCurrentUserQuery(user.sub));
}

// public — skip the guard
@Public()
@Get('health')
health() {
  return { status: 'ok' };
}
```

---

## JWT Strategy (Auth0)

Validates signature (JWKS), `aud`, and `iss` claims:

```ts
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(@Inject(authConfig.KEY) config: ConfigType<typeof authConfig>) {
    super({
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: config.jwksUri,
      }),
      audience: config.audience,
      issuer: `https://${config.domain}/`,
      algorithms: ['RS256'],
    });
  }

  validate(payload: JwtPayload) {
    return payload; // set as request.user
  }
}
```

---

## Config

```ts
// config/auth.config.ts
export const authConfig = registerAs('auth', () => ({
  domain: process.env.AUTH0_DOMAIN,
  audience: process.env.AUTH0_AUDIENCE,
  jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
}));
```

```bash
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_AUDIENCE=https://your-api-identifier
```

---

## Rules

- Never decode the JWT manually — let `JwtAuthGuard` and `JwtStrategy` handle it
- Always use `@CurrentUser()` to access the user — never read from `request.user` directly
- Only use `@Public()` on routes that are genuinely public (health checks, webhooks, etc.)
