import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/shared/ui';

type TodoPaginationProps = {
  page: number;
  totalPages: number;
  total: number;
  onPage: (page: number) => void;
};

function TodoPagination({
  page,
  totalPages,
  total,
  onPage,
}: TodoPaginationProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-200">
      <span className="text-sm text-zinc-500">
        Page {page} of {totalPages} · {total} items
      </span>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPage(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export { TodoPagination };
