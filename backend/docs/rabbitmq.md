# RabbitMQ — Cross-Service Messaging

Use RabbitMQ when an action in one app must trigger work in another.

---

# Core Idea

RabbitMQ is used to **emit events after a successful business action**.

```text
Controller → Command → CommandHandler → Repository
                                      ↓
                                  emit(event)
```

---

# Naming Convention

## Pattern

```text
[Name] = domain entity (Todo, User, Order, etc.)
```

Used in:

```text
Create[Name]Command
[Name]Repository
EVENTS.[NAME]_CREATED
```

---

# Where RabbitMQ Belongs

| Layer          | Responsibility         |
| -------------- | ---------------------- |
| Controller     | Accept request         |
| Command        | Describe action        |
| CommandHandler | Execute business logic |
| Repository     | Persist data           |
| RabbitMQ       | Notify other services  |

---

# Controller (No RabbitMQ Here)

Controller should stay clean.

```ts
@Controller('[names]')
export class [Name]Controller {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  async create(@Body() dto: { /* fields */ }) {
    return this.commandBus.execute(
      new Create[Name]Command(dto),
    );
  }
}
```

✔ No messaging logic
✔ Only delegates to CommandBus

---

# Command

```ts
export class Create[Name]Command {
  constructor(public readonly data: any) {}
}
```

---

# CommandHandler (RabbitMQ HERE)

RabbitMQ is used **inside CommandHandler after success**.

```ts
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

import { [Name] } from '../interfaces';
import { [Name]Repository } from '.../repositories';
import { EVENTS } from '@app/shared';

@CommandHandler(Create[Name]Command)
export class Create[Name]Handler
  implements ICommandHandler<Create[Name]Command, [Name]>
{
  constructor(
    private readonly repository: [Name]Repository,
    @Inject('[TARGET_SERVICE]')
    private readonly client: ClientProxy,
  ) {}

  async execute(command: Create[Name]Command): Promise<[Name]> {
    const entity = await this.repository.create(command.data);

    // ✅ Emit AFTER successful DB write
    this.client.emit(EVENTS.[NAME]_CREATED, {
      id: entity.id,
    });

    return entity;
  }
}
```

---

# Rule

Emit event **only after state change is successful**

```ts
// ❌ WRONG
this.client.emit(EVENTS.[NAME]_CREATED, data);
await this.repository.create(...);
```

```ts
// ✅ CORRECT
const entity = await this.repository.create(...);
this.client.emit(EVENTS.[NAME]_CREATED, { id: entity.id });
```

---

# Event Listener (Microservice)

Other service reacts to event.

```ts
@Controller()
export class [Name]Listener {
  constructor(private readonly commandBus: CommandBus) {}

  @EventPattern(EVENTS.[NAME]_CREATED)
  async handle(@Payload() data: { id: string }) {
    await this.commandBus.execute(
      new Handle[Name]CreatedCommand(data.id),
    );
  }
}
```

---

# Data Flow

```text
HTTP Request
  ↓
Controller
  ↓
CommandBus
  ↓
CommandHandler
  ↓
Database write
  ↓
emit(EVENT)
  ↓
RabbitMQ Queue
  ↓
Microservice (@EventPattern)
  ↓
CommandBus
  ↓
Business Logic
```

---

# Injecting RabbitMQ Client

```ts
ClientsModule.register([
  {
    name: '[TARGET_SERVICE]',
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL],
      queue: '[name]-queue',
      queueOptions: { durable: true },
    },
  },
]);
```

---

# Event Definition

Events describe **what already happened**

```ts
export const EVENTS = {
  [NAME]_CREATED: '[name].created',
  [NAME]_DELETED: '[name].deleted',
} as const;
```

---

# Summary

- Controller → no RabbitMQ
- CommandHandler → emit events
- Event = fact after change
- Listener → reacts via CommandBus

---

# Final Flow

```text
create [name]
  ↓
save to DB
  ↓
emit([name].created)
  ↓
other services react
```
