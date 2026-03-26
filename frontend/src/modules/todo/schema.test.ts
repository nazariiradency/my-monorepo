import { describe, it, expect } from 'vitest';
import { createTodoSchema, updateTodoSchema } from './schema';

describe('createTodoSchema', () => {
  it('accepts a valid title', () => {
    const result = createTodoSchema.safeParse({ title: 'Buy milk' });
    expect(result.success).toBe(true);
  });

  it('rejects an empty title', () => {
    const result = createTodoSchema.safeParse({ title: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Title is required');
    }
  });

  it('rejects a title exceeding 255 characters', () => {
    const result = createTodoSchema.safeParse({ title: 'a'.repeat(256) });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Title is too long');
    }
  });

  it('rejects a missing title field', () => {
    const result = createTodoSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('updateTodoSchema', () => {
  it('accepts an empty object (all fields optional)', () => {
    const result = updateTodoSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts a valid title update', () => {
    const result = updateTodoSchema.safeParse({ title: 'Updated title' });
    expect(result.success).toBe(true);
  });

  it('accepts a completed flag update', () => {
    const result = updateTodoSchema.safeParse({ completed: true });
    expect(result.success).toBe(true);
  });

  it('rejects an empty title when title is provided', () => {
    const result = updateTodoSchema.safeParse({ title: '' });
    expect(result.success).toBe(false);
  });
});
