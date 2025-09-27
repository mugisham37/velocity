import bcrypt from 'bcryptjs';
import { db } from './index';
import {
  accounts,
  companies,
  roles,
  userRoles,
  users,
  warehouses,
  type NewAccount,
  type NewCompany,
  type NewRole,
  type NewUser,
  type NewUserRole,
  type NewWarehouse,
} from './schema';

async function seedDatabase() {
  console.log('🌱 Seeding database...');

  try {
    // Create default company
    const [company] = await db
      .insert(companies)
      .values({
        name: 'KIRO Technologies',
        abbreviation: 'KIRO',
        defaultCurrency: 'USD',
        settings: {
          fiscalYear: '2024-04-01',
          dateFormat: 'dd-mm-yyyy',
          timeZone: 'UTC',
        },
      } satisfies NewCompany)
      .returning();

    if (!company) {
      throw new Error('Failed to create default company');
    }

    console.log('✅ Created default company:', company.name);

    // Create default roles
    const adminRole = await db
      .insert(roles)
      .values({
        name: 'System Administrator',
        description: 'Full system access with all permissions',
        permissions: ['*'], // Wildcard for all permissions
        companyId: company.id,
      } satisfies NewRole)
      .returning();

    await db
      .insert(roles)
      .values({
        name: 'Standard User',
        description: 'Standard user with limited permissions',
        permissions: ['read:own', 'write:own'],
        companyId: company.id,
      } satisfies NewRole)
      .returning();

    console.log('✅ Created default roles');

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 12);
    const [adminUser] = await db
      .insert(users)
      .values({
        email: 'admin@kiro.com',
        passwordHash: hashedPassword,
        firstName: 'System',
        lastName: 'Administrator',
        isActive: true,
        isEmailVerified: true,
        companyId: company.id,
      } satisfies NewUser)
      .returning();

    if (!adminUser) {
      throw new Error('Failed to create admin user');
    }

    // Assign admin role to admin user
    await db.insert(userRoles).values({
      userId: adminUser.id,
      roleId: adminRole[0]!.id,
    } satisfies NewUserRole);

    console.log('✅ Created admin user:', adminUser.email);

    // Create default chart of accounts
    const accountsData: NewAccount[] = [
      // Assets
      {
        accountCode: '1000',
        accountName: 'Assets',
        accountType: 'Asset',
        isGroup: true,
        companyId: company.id,
      },
      {
        accountCode: '1100',
        accountName: 'Current Assets',
        accountType: 'Asset',
        isGroup: true,
        companyId: company.id,
      },
      {
        accountCode: '1110',
        accountName: 'Cash and Bank',
        accountType: 'Asset',
        companyId: company.id,
      },
      {
        accountCode: '1120',
        accountName: 'Accounts Receivable',
        accountType: 'Asset',
        companyId: company.id,
      },
      {
        accountCode: '1130',
        accountName: 'Inventory',
        accountType: 'Asset',
        companyId: company.id,
      },

      // Liabilities
      {
        accountCode: '2000',
        accountName: 'Liabilities',
        accountType: 'Liability',
        isGroup: true,
        companyId: company.id,
      },
      {
        accountCode: '2100',
        accountName: 'Current Liabilities',
        accountType: 'Liability',
        isGroup: true,
        companyId: company.id,
      },
      {
        accountCode: '2110',
        accountName: 'Accounts Payable',
        accountType: 'Liability',
        companyId: company.id,
      },

      // Equity
      {
        accountCode: '3000',
        accountName: 'Equity',
        accountType: 'Equity',
        isGroup: true,
        companyId: company.id,
      },
      {
        accountCode: '3100',
        accountName: 'Retained Earnings',
        accountType: 'Equity',
        companyId: company.id,
      },

      // Income
      {
        accountCode: '4000',
        accountName: 'Income',
        accountType: 'Income',
        isGroup: true,
        companyId: company.id,
      },
      {
        accountCode: '4100',
        accountName: 'Sales Revenue',
        accountType: 'Income',
        companyId: company.id,
      },

      // Expenses
      {
        accountCode: '5000',
        accountName: 'Expenses',
        accountType: 'Expense',
        isGroup: true,
        companyId: company.id,
      },
      {
        accountCode: '5100',
        accountName: 'Cost of Goods Sold',
        accountType: 'Expense',
        companyId: company.id,
      },
      {
        accountCode: '5200',
        accountName: 'Operating Expenses',
        accountType: 'Expense',
        companyId: company.id,
      },
    ];

    await db.insert(accounts).values(accountsData);
    console.log('✅ Created default chart of accounts');

    // Create default warehouse
    await db.insert(warehouses).values({
      warehouseCode: 'MAIN',
      warehouseName: 'Main Warehouse',
      warehouseType: 'Stock',
      companyId: company.id,
      address: {
        line1: '123 Business Street',
        city: 'Business City',
        state: 'BC',
        postalCode: '12345',
        country: 'United States',
      },
    } satisfies NewWarehouse);

    console.log('✅ Created default warehouse');

    console.log('🎉 Database seeding completed successfully!');
    console.log('');
    console.log('Default login credentials:');
    console.log('Email: admin@kiro.com');
    console.log('Password: admin123');
    console.log('');
    console.log('⚠️  Please change the default password after first login!');
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(console.error);
}

export { seedDatabase };
