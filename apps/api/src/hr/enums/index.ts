// Attendance Status Enum
export enum AttendanceStatus {
  PRESENT = 'Present',
  ABSENT = 'Absent',
  LATE = 'Late',
  HALF_DAY = 'Half Day',
  HOLIDAY = 'Holiday',
  LEAVE = 'Leave',
}

// Leave Status Enum
export enum LeaveStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
  CANCELLED = 'Cancelled',
}

// Leave Type Enum
export enum LeaveType {
  ANNUAL = 'Annual',
  SICK = 'Sick',
  MATERNITY = 'Maternity',
  PATERNITY = 'Paternity',
  EMERGENCY = 'Emergency',
  STUDY = 'Study',
  UNPAID = 'Unpaid',
}

// Accrual Type Enum
export enum AccrualType {
  ANNUAL = 'Annual',
  MONTHLY = 'Monthly',
  PER_PAY_PERIOD = 'Per Pay Period',
}

// Component Type Enum
export enum ComponentType {
  EARNING = 'Earning',
  DEDUCTION = 'Deduction',
}

// Payroll Status Enum
export enum PayrollStatus {
  DRAFT = 'Draft',
  PROCESSING = 'Processing',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled',
}

// Payroll Entry Status Enum
export enum PayrollEntryStatus {
  DRAFT = 'Draft',
  PROCESSED = 'Processed',
  PAID = 'Paid',
}

// Frequency Enum
export enum PayrollFrequency {
  WEEKLY = 'Weekly',
  BI_WEEKLY = 'Bi-weekly',
  MONTHLY = 'Monthly',
}

// Employment Status Enum
export enum EmploymentStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
  TERMINATED = 'Terminated',
}

// Employment Type Enum
export enum EmploymentType {
  FULL_TIME = 'Full-time',
  PART_TIME = 'Part-time',
  CONTRACT = 'Contract',
  INTERN = 'Intern',
}

// Shift Type Enum
export enum ShiftType {
  REGULAR = 'Regular',
  NIGHT = 'Night',
  WEEKEND = 'Weekend',
}

// Half Day Period Enum
export enum HalfDayPeriod {
  MORNING = 'Morning',
  AFTERNOON = 'Afternoon',
}

// Payment Method Enum
export enum PaymentMethod {
  BANK_TRANSFER = 'Bank Transfer',
  CASH = 'Cash',
  CHEQUE = 'Cheque',
}
