'use client';

import React, { useMemo, useCallback } from 'react';
import { PaginationState } from '@/types';
import styles from './ListPagination.module.css';

export interface ListPaginationProps {
  pagination: PaginationState;
  totalCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  showPageSizeSelector?: boolean;
  pageSizeOptions?: number[];
}

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export function ListPagination({
  pagination,
  totalCount,
  onPageChange,
  onPageSizeChange,
  showPageSizeSelector = true,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
}: ListPaginationProps) {
  const { page, pageSize, totalPages } = pagination;

  // Calculate display information
  const startRecord = useMemo(() => {
    return totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  }, [page, pageSize, totalCount]);

  const endRecord = useMemo(() => {
    return Math.min(page * pageSize, totalCount);
  }, [page, pageSize, totalCount]);

  // Generate page numbers to display
  const pageNumbers = useMemo(() => {
    const delta = 2; // Number of pages to show on each side of current page
    const range = [];
    const rangeWithDots = [];

    // Calculate range
    const start = Math.max(1, page - delta);
    const end = Math.min(totalPages, page + delta);

    for (let i = start; i <= end; i++) {
      range.push(i);
    }

    // Add first page and dots if needed
    if (start > 1) {
      rangeWithDots.push(1);
      if (start > 2) {
        rangeWithDots.push('...');
      }
    }

    // Add main range
    rangeWithDots.push(...range);

    // Add last page and dots if needed
    if (end < totalPages) {
      if (end < totalPages - 1) {
        rangeWithDots.push('...');
      }
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  }, [page, totalPages]);

  // Handle page navigation
  const handlePageClick = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== page) {
      onPageChange(newPage);
    }
  }, [page, totalPages, onPageChange]);

  const handlePrevious = useCallback(() => {
    if (page > 1) {
      onPageChange(page - 1);
    }
  }, [page, onPageChange]);

  const handleNext = useCallback(() => {
    if (page < totalPages) {
      onPageChange(page + 1);
    }
  }, [page, totalPages, onPageChange]);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    onPageSizeChange(newPageSize);
  }, [onPageSizeChange]);

  if (totalCount === 0) {
    return null;
  }

  return (
    <div className={styles.listPagination}>
      <div className={styles.paginationInfo}>
        <span className={styles.recordCount}>
          Showing {startRecord} to {endRecord} of {totalCount} entries
        </span>
        
        {showPageSizeSelector && (
          <div className={styles.pageSizeSelector}>
            <label htmlFor="pageSize">Show:</label>
            <select
              id="pageSize"
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className={styles.pageSizeSelect}
            >
              {pageSizeOptions.map(size => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span>entries</span>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className={styles.paginationControls}>
          <button
            className={`${styles.paginationBtn} ${page === 1 ? styles.disabled : ''}`}
            onClick={handlePrevious}
            disabled={page === 1}
            aria-label="Previous page"
          >
            ‹
          </button>

          {pageNumbers.map((pageNum, index) => (
            <React.Fragment key={index}>
              {pageNum === '...' ? (
                <span className={styles.paginationDots}>...</span>
              ) : (
                <button
                  className={`${styles.paginationBtn} ${pageNum === page ? styles.active : ''}`}
                  onClick={() => handlePageClick(pageNum as number)}
                  aria-label={`Go to page ${pageNum}`}
                  aria-current={pageNum === page ? 'page' : undefined}
                >
                  {pageNum}
                </button>
              )}
            </React.Fragment>
          ))}

          <button
            className={`${styles.paginationBtn} ${page === totalPages ? styles.disabled : ''}`}
            onClick={handleNext}
            disabled={page === totalPages}
            aria-label="Next page"
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}