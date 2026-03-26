# BullMQ — In-Process Async Jobs

Use BullMQ for async work within a single service — sending emails, generating embeddings, processing uploads. For cross-service events between separate apps, use RabbitMQ instead (see [rabbitmq.md](./rabbitmq.md)).

---

## Adding a Queue — Step by Step

The example below: a command handler enqueues a notification email after creating an order; a processor picks it up asynchronously.

---

### Step 1 — Install dependencies

```bash
pnpm --filter backend add @nestjs/bullmq bullmq
```

---

### Step 2 — Define queue and job name constants

All queue and job name strings live in one file. Never use inline strings.

```ts
// apps/[app-name]/src/queue/queue.constants.ts
export const QUEUES = {
  EMAIL: 'email',
  EMBEDDING: 'embedding',
} as const;

export const JOBS = {
  SEND_NOTIFICATION: 'send-notification',
  GENERATE_EMBEDDING: 'generate-embedding',
} as const;
```

---

### Step 3 — Register BullMQ globally in AppModule

Register the Redis connection once at the root. Each feature module then registers only its own queues.

```ts
// apps/[app-name]/src/app.module.ts
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST ?? 'localhost',
        port: parseInt(process.env.REDIS_PORT ?? '6379'),
      },
    }),
    OrdersModule,
  ],
})
export class AppModule {}
```

For typed config use `BullModule.forRootAsync` with `ConfigService` — see [config.md](./config.md).

---

### Step 4 — Register the queue in the feature module

```ts
// apps/[app-name]/src/modules/orders/orders.module.ts
import { BullModule } from '@nestjs/bullmq';
import { QUEUES } from '../../queue/queue.constants';

@Module({
  imports: [BullModule.registerQueue({ name: QUEUES.EMAIL })],
  providers: [CreateOrderHandler, OrderNotificationProcessor],
})
export class OrdersModule {}
```

---

### Step 5 — Add a job from a command handler (producer)

Inject the queue with `@InjectQueue`. Always set `attempts` and `backoff` — never enqueue without retry options.

```ts
// apps/[app-name]/src/modules/orders/commands/create-order.handler.ts
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { CreateOrderCommand } from './create-order.command';
import { OrdersRepository } from '../../../infra/repositories';
import { QUEUES, JOBS } from '../../../queue/queue.constants';

@CommandHandler(CreateOrderCommand)
export class CreateOrderHandler implements ICommandHandler<CreateOrderCommand> {
  constructor(
    private readonly ordersRepository: OrdersRepository,
    @InjectQueue(QUEUES.EMAIL) private readonly emailQueue: Queue
  ) {}

  async execute(command: CreateOrderCommand) {
    const order = await this.ordersRepository.create(command.dto);

    await this.emailQueue.add(
      JOBS.SEND_NOTIFICATION,
      { orderId: order.id },
      { attempts: 3, backoff: { type: 'exponential', delay: 1000 } }
    );

    return order;
  }
}
```

---

### Step 6 — Create the processor (consumer)

Use `@Processor` with the queue name and `@OnWorkerEvent` for lifecycle hooks.

```ts
// apps/[app-name]/src/modules/orders/order-notification.processor.ts
import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { QUEUES, JOBS } from '../../queue/queue.constants';

@Processor(QUEUES.EMAIL)
export class OrderNotificationProcessor extends WorkerHost {
  async process(job: Job) {
    switch (job.name) {
      case JOBS.SEND_NOTIFICATION:
        return this.sendNotification(job.data as { orderId: string });
      default:
        throw new Error(`Unknown job: ${job.name}`);
    }
  }

  private async sendNotification(data: { orderId: string }) {
    // send email logic
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    // log or alert — job.attemptsMade has the retry count
    console.error(
      `Job ${job.id} failed after ${job.attemptsMade} attempts`,
      error
    );
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    console.log(`Job ${job.id} completed`);
  }
}
```

Register the processor as a provider in the feature module (Step 4 above).

---

### Step 7 — Environment variables

```bash
# .env
REDIS_HOST=localhost
REDIS_PORT=6379
```

Local Docker Compose:

```yaml
redis:
  image: redis:7-alpine
  ports:
    - '6379:6379'
```

---

## Typed Config (forRootAsync)

When the Redis connection config comes from `ConfigService`:

```ts
// app.module.ts
BullModule.forRootAsync({
  useFactory: (configService: ConfigService) => ({
    connection: {
      host: configService.get<string>('redis.host'),
      port: configService.get<number>('redis.port'),
    },
  }),
  inject: [ConfigService],
}),
```

Define the `redis` config factory in `libs/shared/src/config/redis.config.ts` and load it in `ConfigModule`. See [config.md](./config.md).

---

## Rules

- Queue and job name strings always come from `QUEUES` / `JOBS` constants — never inline.
- Always set `attempts` and `backoff` when calling `.add()` — unretried jobs silently disappear on failure.
- Processors extend `WorkerHost` and implement `process()` — do not use the legacy `@Process()` decorator.
- `BullModule.forRoot` is registered once in `AppModule` — individual modules register only their queues with `registerQueue`.
- BullMQ is for in-process async work; use RabbitMQ for events that cross service boundaries.

---

## Anti-Patterns

```ts
// ❌ inline queue or job name strings
await this.queue.add('send-notification', data);
// ✅ await this.queue.add(JOBS.SEND_NOTIFICATION, data, { attempts: 3, ... })

// ❌ .add() without retry options — job is lost on first failure
await this.emailQueue.add(JOBS.SEND_NOTIFICATION, data);
// ✅ always include { attempts: 3, backoff: { type: 'exponential', delay: 1000 } }

// ❌ business logic directly in the handler instead of a processor
@CommandHandler(CreateOrderCommand)
async execute() {
  await this.ordersRepository.create(command.dto);
  await this.emailService.send(order.email); // ← synchronous, blocks the response
}
// ✅ enqueue the job and let the processor handle it asynchronously

// ❌ BullMQ for cross-service events
await this.queue.add('order-created', { id });
// ✅ this.client.emit(EVENTS.ORDER_CREATED, { id })  — RabbitMQ via ClientProxy
```
