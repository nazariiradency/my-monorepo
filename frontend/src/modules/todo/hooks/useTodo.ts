import { useQuery } from '@tanstack/react-query';
import { todoDetailOptions } from '../api';

export function useTodo(id: string) {
  return useQuery(todoDetailOptions(id));
}
