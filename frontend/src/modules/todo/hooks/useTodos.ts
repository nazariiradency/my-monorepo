import { useQuery } from '@tanstack/react-query';
import { todosListOptions } from '../api';

export function useTodos(page = 1, limit = 10) {
  return useQuery(todosListOptions(page, limit));
}
