import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { appConfig } from '@app/shared';
import { DatabaseModule } from './infra/database';
import { TodosModule } from './modules/todos/todos.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [appConfig] }),
    DatabaseModule,
    TodosModule,
  ],
})
export class AppModule {}
