# RabbitMQ — Cross-Service Messaging

Use RabbitMQ when an action in one app must trigger work in another. For in-process async jobs within a single service, use BullMQ instead (see [bullmq.md](./bullmq.md)).

---

## Adding RabbitMQ — Step by Step

The example below: an HTTP app emits `order.created`; a separate microservice listens and reacts.

---

### Step 1 — Install dependencies

Run once per app that needs messaging:

```bash
pnpm --filter backend add @nestjs/microservices amqplib amqp-connection-manager
```

---

### Step 2 — Define event constants

All event pattern strings live in one file. Never use inline strings.

```ts
// apps/[http-app]/src/messaging/messaging.constants.ts
export const EVENTS = {
  ORDER_CREATED: 'order.created',
  ORDER_CANCELLED: 'order.cancelled',
} as const;
```

Export this file from the shared library (`@app/shared`) if the same constants are needed in more than one app.

---

### Step 3 — Register the client in the HTTP app

Add `ClientsModule` to the feature module (or `AppModule`) of the app that will **emit** events:

```ts
// apps/[http-app]/src/modules/orders/orders.module.ts
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { OrdersController } from './orders.controller';
import { CreateOrderHandler } from './commands';
import { OrdersRepository } from '../../infra/repositories';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'ORDERS_SERVICE', // injection token
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL ?? 'amqp://localhost:5672'],
          queue: 'orders-queue',
          queueOptions: { durable: true },
        },
      },
    ]),
  ],
  controllers: [OrdersController],
  providers: [CreateOrderHandler, OrdersRepository],
})
export class OrdersModule {}
```

---

### Step 4 — Emit an event from a command handler

Inject `ClientProxy` using the token name from Step 3. Call `.emit()` — fire-and-forget, no response expected.

```ts
// apps/[http-app]/src/modules/orders/commands/create-order.handler.ts
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CreateOrderCommand } from './create-order.command';
import { OrdersRepository } from '../../../infra/repositories';
import { EVENTS } from '../../../messaging/messaging.constants';

@CommandHandler(CreateOrderCommand)
export class CreateOrderHandler implements ICommandHandler<CreateOrderCommand> {
  constructor(
    private readonly ordersRepository: OrdersRepository,
    @Inject('ORDERS_SERVICE') private readonly client: ClientProxy
  ) {}

  async execute(command: CreateOrderCommand) {
    const order = await this.ordersRepository.create(command.dto);

    this.client.emit(EVENTS.ORDER_CREATED, { id: order.id });

    return order;
  }
}
```

`.emit()` returns an Observable — do **not** await it. The broker guarantees delivery.

---

### Step 5 — Bootstrap the microservice

The app that **listens** starts with `NestFactory.createMicroservice` instead of `NestFactory.create`:

```ts
// apps/[service-name]/src/main.ts
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBITMQ_URL ?? 'amqp://localhost:5672'],
        queue: 'orders-queue', // must match the queue name in Step 3
        queueOptions: { durable: true },
      },
    }
  );
  await app.listen();
}
bootstrap();
```

---

### Step 6 — Listen to the event in the microservice controller

Use `@EventPattern` for fire-and-forget events. Delegate to the `CommandBus` immediately.

```ts
// apps/[service-name]/src/modules/orders/orders.controller.ts
import { Controller } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { EventPattern, Payload } from '@nestjs/microservices';
import { EVENTS } from '@app/shared'; // or local copy of constants
import { HandleOrderCreatedCommand } from './commands';

@Controller()
export class OrdersController {
  constructor(private readonly commandBus: CommandBus) {}

  @EventPattern(EVENTS.ORDER_CREATED)
  async onOrderCreated(@Payload() data: { id: string }) {
    await this.commandBus.execute(new HandleOrderCreatedCommand(data.id));
  }
}
```

---

### Step 7 — Environment variable

```bash
# .env
RABBITMQ_URL=amqp://user:pass@localhost:5672
```

Local Docker Compose:

```yaml
rabbitmq:
  image: rabbitmq:3-management
  ports:
    - '5672:5672'
    - '15672:15672' # management UI
  environment:
    RABBITMQ_DEFAULT_USER: user
    RABBITMQ_DEFAULT_PASS: pass
```

---

## Request / Reply with @MessagePattern

Use `@MessagePattern` when the HTTP app needs a **response** back from the microservice:

```ts
// microservice controller
@MessagePattern({ cmd: 'get-order' })
getOrder(@Payload() data: { id: string }) {
  return this.queryBus.execute(new GetOrderByIdQuery(data.id));
}

// HTTP app — sending the request
import { lastValueFrom } from 'rxjs';

const order = await lastValueFrom(
  this.client.send<Order>({ cmd: 'get-order' }, { id }),
);
```

Use `lastValueFrom` to convert the Observable to a Promise. `send()` waits for one reply then completes.

---

## Hybrid App — HTTP + Microservice in One Process

When one app must handle both REST requests and RabbitMQ messages:

```ts
// apps/[hybrid-app]/src/main.ts
const app = await NestFactory.create<NestFastifyApplication>(
  AppModule,
  new FastifyAdapter()
);

app.connectMicroservice<MicroserviceOptions>({
  transport: Transport.RMQ,
  options: {
    urls: [process.env.RABBITMQ_URL],
    queue: 'notifications-queue',
    queueOptions: { durable: true },
  },
});

await app.startAllMicroservices();
await app.listen(3001, '0.0.0.0');
```

---

## Rules

- Event pattern strings always come from `EVENTS` constants — never inline.
- `.emit()` is fire-and-forget — do not await or subscribe to the return value.
- `.send()` + `lastValueFrom()` for request/reply — never `.emit()` when you need a response.
- Microservice handlers delegate to `CommandBus` or `QueryBus` immediately — no business logic in the controller.
- Queue name in the emitter (`ClientsModule`) and the listener (`createMicroservice`) must match exactly.

---

## Anti-Patterns

```ts
// ❌ inline event string
this.client.emit('order.created', data);
// ✅ this.client.emit(EVENTS.ORDER_CREATED, data)

// ❌ await .emit()
await lastValueFrom(this.client.emit(EVENTS.ORDER_CREATED, data));
// ✅ this.client.emit(EVENTS.ORDER_CREATED, data)  — no await

// ❌ business logic directly in the event handler
@EventPattern(EVENTS.ORDER_CREATED)
async onOrderCreated(@Payload() data: { id: string }) {
  const order = await this.ordersRepository.findById(data.id); // ❌
  await this.notificationService.send(order);                   // ❌
}
// ✅ delegate to CommandBus: this.commandBus.execute(new HandleOrderCreatedCommand(data.id))

// ❌ BullMQ for cross-service events
await this.queue.add('order-created', { id });
// ✅ this.client.emit(EVENTS.ORDER_CREATED, { id })

// ❌ direct database access across apps
const order = await this.prisma.order.findUnique(...); // from the wrong app
// ✅ emit an event and let the owning app handle it, or use @MessagePattern to request data
```
