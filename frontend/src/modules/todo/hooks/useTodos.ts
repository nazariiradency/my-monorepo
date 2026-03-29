import { useQuery } from '@tanstack/react-query';
import { todosListOptions } from '../api';

function useTodos(page = 1, limit = 10) {
  return useQuery(todosListOptions(page, limit));
}

export { useTodos };
