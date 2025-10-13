export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  companyId: string;
  roles?: string[];
  permissions?: string[];
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
