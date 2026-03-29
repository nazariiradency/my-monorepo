import { Injectable } from '@nestjs/common';
import { PaginatedResult } from '@app/shared';
import { PrismaService } from '../database';
import { CreateTodoDto, Todo, UpdateTodoDto } from '../../modules/todos';

@Injectable()
export class TodosRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(page: number, limit: number): Promise<PaginatedResult<Todo>> {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.todo.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.todo.count(),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  findById(id: string): Promise<Todo | null> {
    return this.prisma.todo.findUnique({ where: { id } });
  }

  create(data: CreateTodoDto): Promise<Todo> {
    return this.prisma.todo.create({ data: { title: data.title } });
  }

  update(id: string, data: UpdateTodoDto): Promise<Todo> {
    return this.prisma.todo.update({ where: { id }, data });
  }

  delete(id: string): Promise<Todo> {
    return this.prisma.todo.delete({ where: { id } });
  }
}
