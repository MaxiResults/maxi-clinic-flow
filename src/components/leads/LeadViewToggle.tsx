import { Button } from '@/components/ui/button';
import { LayoutGrid, List, Table } from 'lucide-react';

interface LeadViewToggleProps {
  view: 'grid' | 'list' | 'table';
  onViewChange: (view: 'grid' | 'list' | 'table') => void;
}

export function LeadViewToggle({ view, onViewChange }: LeadViewToggleProps) {
  return (
    <div className="flex gap-1 bg-muted p-1 rounded-md">
      <Button
        variant={view === 'grid' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('grid')}
        className="h-8 w-8 p-0"
      >
        <LayoutGrid className="h-4 w-4" />
      </Button>
      <Button
        variant={view === 'list' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('list')}
        className="h-8 w-8 p-0"
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        variant={view === 'table' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('table')}
        className="h-8 w-8 p-0"
      >
        <Table className="h-4 w-4" />
      </Button>
    </div>
  );
}
