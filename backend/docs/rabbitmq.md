# Messaging — RabbitMQ

RabbitMQ is a transport layer for `@nestjs/microservices`. Use it for **cross-service events** — when an action in one app must trigger work in another.

> For in-process async jobs, use BullMQ. See [bullmq.md](./bullmq.md).
> For microservice setup, see [microservices.md](./microservices.md).

---

## Event Constants

Define all event patterns in one place:

```ts
// messaging/messaging.constants.ts
export const EVENTS = {
  XXX_CREATED: 'xxx.created',
  XXX_DELETED: 'xxx.deleted',
} as const;
```

---

## Emitting an Event (HTTP app)

```ts
@Injectable()
export class XxxService {
  constructor(@Inject('TARGET_SERVICE') private readonly client: ClientProxy) {}

  async create(dto: CreateXxxDto) {
    const item = await this.xxxRepository.create(dto);
    this.client.emit(EVENTS.XXX_CREATED, { id: item.id });
    return item;
  }
}
```

---

## Listening to an Event (microservice app)

```ts
@Controller()
export class XxxController {
  @EventPattern(EVENTS.XXX_CREATED)
  async onXxxCreated(@Payload() data: { id: string }) {
    await this.commandBus.execute(new HandleXxxCreatedCommand(data.id));
  }
}
```

---

## Setup

Microservice app bootstrap:

```ts
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
```

Client registration in the HTTP app:

```ts
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

---

## Config

```bash
RABBITMQ_URL=amqp://user:pass@localhost:5672
```

---

## Anti-Patterns

```ts
// ❌ inline event name strings             → ✅ EVENTS constants
// ❌ BullMQ for cross-service events       → ✅ NestJS microservices / RMQ transport
// ❌ app A queries app B's database        → ✅ emit an event, let the owner handle it
```
