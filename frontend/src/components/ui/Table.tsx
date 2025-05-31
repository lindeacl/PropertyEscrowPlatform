import React, { useState } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

export interface TableColumn {
  key: string;
  header: string;
  sortable?: boolean;
  width?: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface TableProps {
  columns: TableColumn[];
  data: any[];
  onRowClick?: (row: any, index: number) => void;
  highlightRows?: boolean;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
}

type SortDirection = 'asc' | 'desc' | null;

const Table: React.FC<TableProps> = ({
  columns,
  data,
  onRowClick,
  highlightRows = true,
  loading = false,
  emptyMessage = 'No data available',
  className = ''
}) => {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const handleSort = (columnKey: string) => {
    const column = columns.find(col => col.key === columnKey);
    if (!column?.sortable) return;

    let newDirection: SortDirection = 'asc';
    
    if (sortColumn === columnKey) {
      if (sortDirection === 'asc') {
        newDirection = 'desc';
      } else if (sortDirection === 'desc') {
        newDirection = null;
      }
    }

    setSortColumn(newDirection ? columnKey : null);
    setSortDirection(newDirection);
  };

  const getSortedData = () => {
    if (!sortColumn || !sortDirection) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];

      if (aValue === bValue) return 0;

      let comparison = 0;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else if (aValue instanceof Date && bValue instanceof Date) {
        comparison = aValue.getTime() - bValue.getTime();
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  };

  const renderSortIcon = (column: TableColumn) => {
    if (!column.sortable) return null;

    const isActive = sortColumn === column.key;
    
    if (!isActive) {
      return <ChevronsUpDown className="h-4 w-4 text-text-secondary" />;
    }

    return sortDirection === 'asc' ? (
      <ChevronUp className="h-4 w-4 text-primary" />
    ) : (
      <ChevronDown className="h-4 w-4 text-primary" />
    );
  };

  const sortedData = getSortedData();

  if (loading) {
    return (
      <div className={`w-full ${className}`}>
        <div className="animate-pulse">
          <div className="bg-background rounded-lg">
            <div className="px-6 py-4 border-b border-border">
              <div className="flex space-x-4">
                {columns.map((_, index) => (
                  <div key={index} className="h-4 bg-gray-300 rounded flex-1"></div>
                ))}
              </div>
            </div>
            {[...Array(5)].map((_, index) => (
              <div key={index} className="px-6 py-4 border-b border-border">
                <div className="flex space-x-4">
                  {columns.map((_, colIndex) => (
                    <div key={colIndex} className="h-4 bg-gray-200 rounded flex-1"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-background border-b border-border">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`
                    px-6 py-4 text-left text-sm font-semibold text-text-primary
                    ${column.sortable ? 'cursor-pointer hover:bg-gray-50 transition-colors' : ''}
                    ${column.width ? column.width : ''}
                  `}
                  onClick={() => handleSort(column.key)}
                >
                  <div className="flex items-center space-x-2">
                    <span>{column.header}</span>
                    {renderSortIcon(column)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-surface divide-y divide-border">
            {sortedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-12 text-center text-text-secondary"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sortedData.map((row, index) => (
                <tr
                  key={index}
                  className={`
                    ${onRowClick ? 'cursor-pointer' : ''}
                    ${highlightRows ? 'hover:bg-primary-50 transition-colors' : ''}
                  `}
                  onClick={() => onRowClick?.(row, index)}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className="px-6 py-4 text-sm text-text-primary"
                    >
                      {column.render
                        ? column.render(row[column.key], row)
                        : row[column.key]
                      }
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Table;