# Queues — BullMQ

BullMQ handles **in-process async jobs** backed by Redis. Use it for work within a single service — sending emails, generating embeddings, processing uploads.

> For cross-service communication, use NestJS microservices instead. See [microservices.md](./microservices.md).

---

## Queue Constants

Define all queue names in one place:

```ts
// queue/queue.constants.ts
export const QUEUES = {
  EMAIL: 'email',
  EMBEDDING: 'embedding',
} as const;
```

---

## Producer

Inject the queue in a command handler and call `.add()`. Always set `attempts` and `backoff`:

```ts
@CommandHandler(CreateXxxCommand)
export class CreateXxxHandler implements ICommandHandler<CreateXxxCommand> {
  constructor(
    private readonly xxxRepository: XxxRepository,
    @InjectQueue(QUEUES.EMAIL) private readonly emailQueue: Queue
  ) {}

  async execute(command: CreateXxxCommand): Promise<Xxx> {
    const item = await this.xxxRepository.create(command.dto);

    await this.emailQueue.add(
      'send-notification',
      { id: item.id },
      { attempts: 3, backoff: { type: 'exponential', delay: 1000 } }
    );

    return item;
  }
}
```

---

## Consumer

```ts
// modules/[feature]/[feature].consumer.ts
@Processor(QUEUES.EMAIL)
export class XxxConsumer {
  @Process('send-notification')
  async handle(job: Job<{ id: string }>) {
    // process job
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error) {
    // log or alert
  }
}
```

---

## Module Registration

```ts
// modules/[feature]/[feature].module.ts
@Module({
  imports: [BullModule.registerQueue({ name: QUEUES.EMAIL })],
  providers: [XxxConsumer],
})
export class XxxModule {}

// app.module.ts — global Redis connection, registered once
BullModule.forRoot({
  connection: { host: config.redis.host, port: config.redis.port },
});
```

---

## Config

```ts
// config/redis.config.ts
export const redisConfig = registerAs('redis', () => ({
  host: process.env.REDIS_HOST ?? 'localhost',
  port: parseInt(process.env.REDIS_PORT ?? '6379'),
}));
```

```bash
REDIS_HOST=localhost
REDIS_PORT=6379
```

---

## Anti-Patterns

```ts
// ❌ inline queue name strings             → ✅ QUEUES constants
// ❌ .add() without attempts/backoff       → ✅ always set retry options
// ❌ BullMQ for cross-service events       → ✅ NestJS microservices transport
```
