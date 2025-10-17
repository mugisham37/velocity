'use client';

import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FilterCondition,
  SortCondition,
  DocumentListItem,
  PaginationState,
} from '@/types';
import { queryFunctions } from '@/lib/query/config';
import { useNotifications } from './useNotifications';

export interface UseListViewOptions {
  doctype: string;
  initialFilters?: FilterCondition[];
  initialSort?: SortCondition[];
  initialPageSize?: number;
  fields?: string[];
  enabled?: boolean;
}

export interface UseListViewReturn {
  // Data
  data: DocumentListItem[];
  totalCount: number;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  loading: boolean;

  // State
  filters: FilterCondition[];
  sort: SortCondition[];
  sorting: SortCondition[];
  pagination: PaginationState;
  selection: string[];

  // Actions
  setFilters: (filters: FilterCondition[]) => void;
  addFilter: (filter: FilterCondition) => void;
  removeFilter: (fieldname: string) => void;
  clearFilters: () => void;
  updateFilters: (filters: FilterCondition[]) => void;

  setSort: (sort: SortCondition[]) => void;
  addSort: (fieldname: string, direction: 'asc' | 'desc') => void;
  removeSort: (fieldname: string) => void;
  clearSort: () => void;
  updateSorting: (sort: SortCondition[]) => void;

  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  updatePagination: (pagination: Partial<PaginationState>) => void;

  setSelection: (selection: string[]) => void;
  selectAll: () => void;
  clearSelection: () => void;
  updateSelection: (selection: string[]) => void;

  // Utilities
  refetch: () => void;
  refresh: () => void;
}

export function useListView({
  doctype,
  initialFilters = [],
  initialSort = [],
  initialPageSize = 20,
  fields,
  enabled = true,
}: UseListViewOptions): UseListViewReturn {
  const { showApiError } = useNotifications();

  // State management
  const [filters, setFilters] = useState<FilterCondition[]>(initialFilters);
  const [sort, setSort] = useState<SortCondition[]>(initialSort);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: initialPageSize,
    totalPages: 1,
  });
  const [selection, setSelection] = useState<string[]>([]);

  // Build query options
  const queryOptions = useMemo(() => {
    const options: Parameters<typeof queryFunctions.getDocList>[1] = {};

    if (fields) {
      options.fields = fields;
    }

    if (filters.length > 0) {
      // Convert filters to Frappe format
      options.filters = filters.map(
        (filter) =>
          [filter.fieldname, filter.operator, filter.value] as [
            string,
            string,
            unknown,
          ]
      );
    }

    if (sort.length > 0) {
      // Convert sort to Frappe format
      options.order_by = sort
        .map((s) => `${s.fieldname} ${s.direction}`)
        .join(', ');
    }

    // Pagination
    options.limit_start = (pagination.page - 1) * pagination.pageSize;
    options.limit_page_length = pagination.pageSize;

    return options;
  }, [fields, filters, sort, pagination.page, pagination.pageSize]);

  // Query for list data
  const query = useQuery({
    ...queryFunctions.getDocList(doctype, queryOptions),
    enabled,
  });

  // Update pagination when data changes
  const totalCount = query.data?.total_count || 0;
  const totalPages = Math.ceil(totalCount / pagination.pageSize);

  // Update pagination state when totalPages changes
  useMemo(() => {
    setPagination((prev) => ({
      ...prev,
      totalPages,
    }));
  }, [totalPages]);

  // Handle errors
  useMemo(() => {
    if (query.error) {
      showApiError(query.error, `Failed to load ${doctype} list`);
    }
  }, [query.error, showApiError, doctype]);

  // Filter actions
  const addFilter = useCallback((filter: FilterCondition) => {
    setFilters((prev) => {
      // Remove existing filter for the same field
      const filtered = prev.filter((f) => f.fieldname !== filter.fieldname);
      return [...filtered, filter];
    });
    // Reset to first page when filters change
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const removeFilter = useCallback((fieldname: string) => {
    setFilters((prev) => prev.filter((f) => f.fieldname !== fieldname));
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters([]);
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  // Sort actions
  const addSort = useCallback(
    (fieldname: string, direction: 'asc' | 'desc') => {
      setSort((prev) => {
        // Remove existing sort for the same field
        const filtered = prev.filter((s) => s.fieldname !== fieldname);
        return [...filtered, { fieldname, direction }];
      });
    },
    []
  );

  const removeSort = useCallback((fieldname: string) => {
    setSort((prev) => prev.filter((s) => s.fieldname !== fieldname));
  }, []);

  const clearSort = useCallback(() => {
    setSort([]);
  }, []);

  // Pagination actions
  const setPage = useCallback((page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  }, []);

  const setPageSize = useCallback(
    (pageSize: number) => {
      setPagination((prev) => ({
        ...prev,
        pageSize,
        page: 1, // Reset to first page
        totalPages: Math.ceil(totalCount / pageSize),
      }));
    },
    [totalCount]
  );

  // Selection actions
  const selectAll = useCallback(() => {
    const allNames = (
      query.data?.data?.map((doc) => (doc as DocumentListItem).name) || []
    ).filter((name): name is string => typeof name === 'string');
    setSelection(allNames);
  }, [query.data?.data]);

  const clearSelection = useCallback(() => {
    setSelection([]);
  }, []);

  // Additional action methods for backward compatibility
  const updateFilters = useCallback((newFilters: FilterCondition[]) => {
    setFilters(newFilters);
  }, []);

  const updateSorting = useCallback((newSort: SortCondition[]) => {
    setSort(newSort);
  }, []);

  const updatePagination = useCallback((newPagination: Partial<PaginationState>) => {
    setPagination(prev => ({ ...prev, ...newPagination }));
  }, []);

  const updateSelection = useCallback((newSelection: string[]) => {
    setSelection(newSelection);
  }, []);

  // Utility actions
  const refresh = useCallback(() => {
    query.refetch();
    clearSelection();
  }, [query, clearSelection]);

  return {
    // Data
    data: (query.data?.data || []) as DocumentListItem[],
    totalCount,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    loading: query.isLoading,

    // State
    filters,
    sort,
    sorting: sort,
    pagination,
    selection,

    // Actions
    setFilters,
    addFilter,
    removeFilter,
    clearFilters,
    updateFilters,

    setSort,
    addSort,
    removeSort,
    clearSort,
    updateSorting,

    setPage,
    setPageSize,
    updatePagination,

    setSelection,
    selectAll,
    clearSelection,
    updateSelection,

    // Utilities
    refetch: query.refetch,
    refresh,
  };
}
