// Stock Module Components

export { ItemMaster } from './ItemMaster';
export { StockEntry } from './StockEntry';
export { MaterialRequest } from './MaterialRequest';
export { StockReports } from './StockReports';

// Re-export stock types for convenience
export type {
  Item,
  ItemAttribute,
  ItemVariant,
  StockEntry as StockEntryType,
  StockEntryDetail,
  StockEntryPurpose,
  StockEntryType as StockEntryTypeEnum,
  MaterialRequest as MaterialRequestType,
  MaterialRequestItem,
  MaterialRequestType as MaterialRequestTypeEnum,
  MaterialRequestStatus,
  StockLedgerEntry,
  StockBalance,
  Warehouse,
  SerialNo,
  Batch,
  StockAgeingItem,
  ABCAnalysisItem,
  StockEntryValidation,
} from '@/types/stock';