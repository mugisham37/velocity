export interface FilterOption {
  label: string;
  value: string;
  type: 'string' | 'number' | 'boolean' | 'date';
}

export interface SavedFilter {
  id: string;
  name: string;
  conditions: FilterCondition[];
}

export interface FilterCondition {
  field: string;
  operator: string;
  value: any;
}

export interface DocField {
  name: string;
  label: string;
  type: string;
}

export interface ListFiltersProps {
  fields: DocField[];
  filters: FilterCondition[];
  doctype: string;
  onFiltersChange: (newFilters: FilterCondition[]) => void;
}

export interface ListPaginationProps {
  pagination: PaginationState;
  totalCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (newPageSize: number) => void;
}

export interface PaginationState {
  page: number;
  pageSize: number;
}