# AppModule — Root Application Module

AppModule is the **root of the dependency injection tree**.

It is responsible for **wiring together all global concerns and feature modules**.

---

# Core Idea

AppModule = application bootstrap point

```text
main.ts → AppModule → [GlobalModules, FeatureModules]
```

---

# Responsibilities

AppModule MUST:

- configure global modules (`ConfigModule`, `DatabaseModule`)
- import all feature modules
- stay flat and thin

AppModule MUST NOT:

- declare controllers
- declare providers
- contain any logic

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

---

# Key Principles

## 1. No Providers, No Controllers

AppModule is an orchestrator — it only imports, never declares.

---

## 2. Global Modules at the Top

`ConfigModule` and `DatabaseModule` always come first — feature modules depend on them.

---

## 3. One Line Per Feature

Each feature module is a single import. AppModule never knows about internals of a feature.

---

# Summary

- AppModule = root wiring module, no logic
- Always: `ConfigModule` → `DatabaseModule` → feature modules
- `isGlobal: true` on `ConfigModule` — never re-import it elsewhere
- Adding a feature = one import line, nothing else
