# Microservices — @nestjs/microservices

The backend is a NestJS monorepo. Each app inside `backend/apps/` can be an HTTP service, a pure microservice, or both (hybrid).

---

## App Structure

```
backend/
├── apps/
│   ├── [http-app]/       # Fastify HTTP service — CQRS, REST, Swagger
│   └── [service-name]/   # Microservice — message-based, no HTTP layer
└── libs/
    └── shared/           # @app/shared — shared across all apps
```

Each app has its own entry point, `AppModule`, and Prisma schema. Never share schemas between apps.

---

## Transport Options

| Transport         | Use case                                        |
| ----------------- | ----------------------------------------------- |
| `Transport.TCP`   | Simple internal communication, no broker needed |
| `Transport.RMQ`   | RabbitMQ — durable queues, fan-out, dead-letter |
| `Transport.REDIS` | Redis pub/sub — lightweight, fast               |
| `Transport.NATS`  | NATS — high-throughput, request/reply + events  |
| `Transport.GRPC`  | gRPC — typed contracts, streaming, polyglot     |

---

## Pure Microservice Bootstrap

```ts
// apps/[service-name]/src/main.ts
async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBITMQ_URL],
        queue: '[service-name]-queue',
        queueOptions: { durable: true },
      },
    }
  );
  await app.listen();
}
```

---

## Message Patterns — Request/Response

Use `@MessagePattern` when the caller needs a response:

```ts
// microservice controller
@MessagePattern({ cmd: 'get-xxx' })
getXxx(@Payload() data: { id: string }) {
  return this.queryBus.execute(new GetXxxByIdQuery(data.id));
}

// HTTP app — calling the microservice
getXxx(id: string) {
  return lastValueFrom(this.client.send<Xxx>({ cmd: 'get-xxx' }, { id }));
}
```

---

## Event Patterns — Fire and Forget

Use `@EventPattern` when no response is needed:

```ts
// microservice controller
@EventPattern('xxx.created')
async onXxxCreated(@Payload() data: { id: string }) {
  await this.commandBus.execute(new HandleXxxCreatedCommand(data.id));
}

// HTTP app — emitting the event
this.client.emit('xxx.created', { id: item.id });
```

Use constants for all pattern strings — never inline. See [rabbitmq.md](./rabbitmq.md).

---

## Registering the Client in the HTTP App

```ts
// app.module.ts
ClientsModule.register([{
  name: 'TARGET_SERVICE',
  transport: Transport.RMQ,
  options: {
    urls: [process.env.RABBITMQ_URL],
    queue: '[service-name]-queue',
    queueOptions: { durable: true },
  },
}]),
```

Inject via `@Inject('TARGET_SERVICE') private readonly client: ClientProxy`.

---

## Hybrid App — HTTP + Microservice

An app can handle both HTTP requests and microservice messages:

```ts
async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true })
  );

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: { urls: [process.env.RABBITMQ_URL], queue: '[app]-queue' },
  });

  await app.startAllMicroservices();
  await app.listen(3000, '0.0.0.0');
}
```

---

## Schema Ownership

Every table is owned by exactly one app. No app may query another app's tables.

- **Preferred**: subscribe to events and maintain a local read model
- **Acceptable**: `@MessagePattern` request to the owning app
- **Never**: direct Prisma/SQL access to another app's database

---

## Adding a New App

1. `nest generate app [service-name]` from inside `backend/`
2. Add its own Prisma setup under `apps/[service-name]/src/infra/`
3. Add scripts to `backend/package.json`
4. Add a `dev:[service-name]` script to the root `package.json`
