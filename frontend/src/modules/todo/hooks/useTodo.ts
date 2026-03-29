import { useQuery } from '@tanstack/react-query';
import { todoDetailOptions } from '../api';

function useTodo(id: string) {
  return useQuery(todoDetailOptions(id));
}

export { useTodo };
