# AppModule — Root Application Module

AppModule is the **root of the dependency injection tree**.

It is responsible for **wiring together all global concerns and feature modules**.

---

# Structure

```ts
@Module({
  imports: [
    // 1. Global config
    ConfigModule.forRoot({ isGlobal: true, load: [appConfig] }),

    // 2. Global infrastructure
    DatabaseModule,

    // 3. Feature modules
    TodosModule,
  ],
})
export class AppModule {}
```

---

# Import Order Convention

Always group imports in this order:

```text
1. Global config       → ConfigModule
2. Global infra        → DatabaseModule, CacheModule, etc.
3. Feature modules     → TodosModule, UsersModule, etc.
```

✔ Keeps the file predictable as the app grows

---

# ConfigModule

```ts
ConfigModule.forRoot({
  isGlobal: true, // available in every module without re-importing
  load: [appConfig], // typed config factory
});
```

✔ Always `isGlobal: true` — no need to import `ConfigModule` in feature modules  
✔ Always pass a typed `load` factory — avoids raw `process.env` across the codebase

---

# DatabaseModule

Encapsulates `PrismaService` and exposes it globally.

```text
AppModule
  └── DatabaseModule  → provides PrismaService
                          ↓
                    RepositoriesModule
                          ↓
                    Feature modules
```

Lives in:

```text
src/infra/database/database.module.ts
```

---

# Feature Modules

Each domain entity gets its own module:

```text
src/modules/
  todos/
    todos.module.ts
  users/
    users.module.ts
```

AppModule only imports the top-level module — never reaches inside a feature directly.

---

# File Location

```text
src/
  app.module.ts        ← this file
  main.ts
  infra/
    database/
  modules/
    todos/
```

---

# Module Registration Pattern

```ts
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [appConfig] }),
    DatabaseModule,
    [Feature]Module,
  ],
})
export class AppModule {}
```

Adding a new feature = **one line** in the `imports` array.

---

# Architecture Role

```text
main.ts
  ↓
AppModule
  ├── ConfigModule   (global)
  ├── DatabaseModule (global infra)
  └── TodosModule
        ├── TodosController
        ├── CommandHandlers
        ├── QueryHandlers
        └── RepositoriesModule
```
