import * as SQLite from 'expo-sqlite';
import type {
  Customer,
  Product,
  SalesOrder,
  SalesOrderItem,
} from '../types/database';

class DatabaseService {
  private db: SQLite.WebSQLDatabase | null = null;

  async initialize() {
    this.db = SQLite.openDatabase('kiro_erp.db');

    await this.createTables();
  }

  private createTables(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      this.db.transaction(
        tx => {
          // Customers table
          tx.executeSql(`
            CREATE TABLE IF NOT EXISTS customers (
              id TEXT PRIMARY KEY,
              name TEXT NOT NULL,
              email TEXT,
              phone TEXT,
              address_street TEXT,
              address_city TEXT,
              address_state TEXT,
              address_zip_code TEXT,
              address_country TEXT,
              credit_limit REAL,
              balance REAL DEFAULT 0,
              status TEXT DEFAULT 'active',
              last_modified TEXT,
              needs_sync INTEGER DEFAULT 0,
              sync_status TEXT DEFAULT 'synced',
              is_deleted INTEGER DEFAULT 0
            )
          `);

          // Products table
          tx.executeSql(`
            CREATE TABLE IF NOT EXISTS products (
              id TEXT PRIMARY KEY,
              name TEXULL,
              sku TEXT UNIQUE,
              barcode TEXT,
              description TEXT,
              price REAL NOT NULL,
              cost REAL,
              stock_quantity INTEGER DEFAULT 0,
              category TEXT,
              images TEXT, -- JSON array
              is_active INTEGER DEFAULT 1,
              last_modified TEXT,
              needs_sync INTEGER DEFAULT 0,
              sync_status TEXT DEFAULT 'synced',
              is_deleted INTEGER DEFAULT 0
            )
          `);

          // Sales Orders table
          tx.executeSql(`
            CREATE TABLE IF NOT EXISTS sales_orders (
              id TEXT PRIMARY KEY,
              order_number TEXT UNIQUE,
              customer_id TEXT,
              customer_name TEXT,
              subtotal REAL,
              tax REAL,
              total REAL,
              status TEXT DEFAULT 'draft',
              order_date TEXT,
              delivery_date TEXT,
              notes TEXT,
              signature TEXT,
              last_modified TEXT,
              needs_sync INTEGER DEFAULT 0,
              sync_status TEXT DEFAULT 'synced',
              is_deleted INTEGER DEFAULT 0,
              FOREIGN KEY (customer_id) REFERENCES customers (id)
            )
          `);

          // Sales Order Items table
          tx.executeSql(`
            CREATE TABLE IF NOT EXISTS sales_order_items (
              id TEXT PRIMARY KEY,
              sales_order_id TEXT,
              product_id TEXT,
              product_name TEXT,
              product_sku TEXT,
              quantity INTEGER,
              unit_price REAL,
              discount REAL DEFAULT 0,
              total REAL,
              FOREIGN KEY (sales_order_id) REFERENCES sales_orders (id),
              FOREIGN KEY (product_id) REFERENCES products (id)
            )
          `);

          // Create indexes for better performance
          tx.executeSql(
            'CREATE INDEX IF NOT EXISTS idx_customers_name ON customers (name)'
          );
          tx.executeSql(
            'CREATE INDEX IF NOT EXISTS idx_products_sku ON products (sku)'
          );
          tx.executeSql(
            'CREATE INDEX IF NOT EXISTS idx_products_barcode ON products (barcode)'
          );
          tx.executeSql(
            'CREATE INDEX IF NOT EXISTS idx_sales_orders_customer ON sales_orders (customer_id)'
          );
          tx.executeSql(
            'CREATE INDEX IF NOT EXISTS idx_sales_orders_date ON sales_orders (order_date)'
          );
        },
        error => reject(error),
        () => resolve()
      );
    });
  }

  // Customer operations
  async storeCustomers(customers: Customer[]): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      this.db.transaction(
        tx => {
          customers.forEach(customer => {
            tx.executeSql(
              `INSERT OR REPLACE INTO customers
               (id, name, email, phone, address_street, address_city, address_state,
                address_zip_code, address_country, credit_limit, balance, status,
                last_modified, needs_sync, sync_status, is_deleted)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                customer.id,
                customer.name,
                customer.email || null,
                customer.phone || null,
                customer.address?.street || null,
                customer.address?.city || null,
                customer.address?.state || null,
                customer.address?.zipCode || null,
                customer.address?.country || null,
                customer.creditLimit || null,
                customer.balance,
                customer.status,
                customer.lastModified.toISOString(),
                customer.needsSync ? 1 : 0,
                customer.syncStatus,
                customer.isDeleted ? 1 : 0,
              ]
            );
          });
        },
        error => reject(error),
        () => resolve()
      );
    });
  }

  async getCustomers(): Promise<Customer[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      this.db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM customers WHERE is_deleted = 0 ORDER BY name',
          [],
          (_, { rows }) => {
            const customers: Customer[] = [];
            for (let i = 0; i < rows.length; i++) {
              const row = rows.item(i);
              customers.push({
                id: row.id,
                name: row.name,
                email: row.email,
                phone: row.phone,
                address: row.address_street
                  ? {
                      street: row.address_street,
                      city: row.address_city,
                      state: row.address_state,
                      zipCode: row.address_zip_code,
                      country: row.address_country,
                    }
                  : undefined,
                creditLimit: row.credit_limit,
                balance: row.balance,
                status: row.status,
                lastModified: new Date(row.last_modified),
                needsSync: row.needs_sync === 1,
                syncStatus: row.sync_status,
                isDeleted: row.is_deleted === 1,
              });
            }
            resolve(customers);
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  // Product operations
  async storeProducts(products: Product[]): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      this.db.transaction(
        tx => {
          products.forEach(product => {
            tx.executeSql(
              `INSERT OR REPLACE INTO products
               (id, name, sku, barcode, description, price, cost, stock_quantity,
                category, images, is_active, last_modified, needs_sync, sync_status, is_deleted)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                product.id,
                product.name,
                product.sku,
                product.barcode || null,
                product.description || null,
                product.price,
                product.cost,
                product.stockQuantity,
                product.category || null,
                JSON.stringify(product.images),
                product.isActive ? 1 : 0,
                product.lastModified.toISOString(),
                product.needsSync ? 1 : 0,
                product.syncStatus,
                product.isDeleted ? 1 : 0,
              ]
            );
          });
        },
        error => reject(error),
        () => resolve()
      );
    });
  }

  async getProducts(): Promise<Product[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      this.db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM products WHERE is_deleted = 0 ORDER BY name',
          [],
          (_, { rows }) => {
            const products: Product[] = [];
            for (let i = 0; i < rows.length; i++) {
              const row = rows.item(i);
              products.push({
                id: row.id,
                name: row.name,
                sku: row.sku,
                barcode: row.barcode,
                description: row.description,
                price: row.price,
                cost: row.cost,
                stockQuantity: row.stock_quantity,
                category: row.category,
                images: JSON.parse(row.images || '[]'),
                isActive: row.is_active === 1,
                lastModified: new Date(row.last_modified),
                needsSync: row.needs_sync === 1,
                syncStatus: row.sync_status,
                isDeleted: row.is_deleted === 1,
              });
            }
            resolve(products);
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  async getProductByBarcode(barcode: string): Promise<Product | null> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      this.db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM products WHERE barcode = ? AND is_deleted = 0',
          [barcode],
          (_, { rows }) => {
            if (rows.length > 0) {
              const row = rows.item(0);
              resolve({
                id: row.id,
                name: row.name,
                sku: row.sku,
                barcode: row.barcode,
                description: row.description,
                price: row.price,
                cost: row.cost,
                stockQuantity: row.stock_quantity,
                category: row.category,
                images: JSON.parse(row.images || '[]'),
                isActive: row.is_active === 1,
                lastModified: new Date(row.last_modified),
                needsSync: row.needs_sync === 1,
                syncStatus: row.sync_status,
                isDeleted: row.is_deleted === 1,
              });
            } else {
              resolve(null);
            }
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  // Sales Order operations
  async storeSalesOrders(salesOrders: SalesOrder[]): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      this.db.transaction(
        tx => {
          salesOrders.forEach(order => {
            // Insert sales order
            tx.executeSql(
              `INSERT OR REPLACE INTO sales_orders
               (id, order_number, customer_id, customer_name, subtotal, tax, total,
                status, order_date, delivery_date, notes, signature, last_modified,
                needs_sync, sync_status, is_deleted)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                order.id,
                order.orderNumber,
                order.customerId,
                order.customer?.name || null,
                order.subtotal,
                order.tax,
                order.total,
                order.status,
                order.orderDate.toISOString(),
                order.deliveryDate?.toISOString() || null,
                order.notes || null,
                order.signature || null,
                order.lastModified.toISOString(),
                order.needsSync ? 1 : 0,
                order.syncStatus,
                order.isDeleted ? 1 : 0,
              ]
            );

            // Delete existing items
            tx.executeSql(
              'DELETE FROM sales_order_items WHERE sales_order_id = ?',
              [order.id]
            );

            // Insert items
            order.items.forEach((item: SalesOrderItem) => {
              tx.executeSql(
                `INSERT INTO sales_order_items
                 (id, sales_order_id, product_id, product_name, product_sku,
                  quantity, unit_price, discount, total)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                  item.id,
                  order.id,
                  item.productId,
                  item.product?.name || null,
                  item.product?.sku || null,
                  item.quantity,
                  item.unitPrice,
                  item.discount,
                  item.total,
                ]
              );
            });
          });
        },
        error => reject(error),
        () => resolve()
      );
    });
  }

  async getSalesOrders(): Promise<SalesOrder[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      this.db.transaction(tx => {
        tx.executeSql(
          `SELECT so.*,
                  GROUP_CONCAT(soi.id) as item_ids,
                  GROUP_CONCAT(soi.product_id) as product_ids,
                  GROUP_CONCAT(soi.product_name) as product_names,
                  GROUP_CONCAT(soi.product_sku) as product_skus,
                  GROUP_CONCAT(soi.quantity) as quantities,
                  GROUP_CONCAT(soi.unit_price) as unit_prices,
                  GROUP_CONCAT(soi.discount) as discounts,
                  GROUP_CONCAT(soi.total) as item_totals
           FROM sales_orders so
           LEFT JOIN sales_order_items soi ON so.id = soi.sales_order_id
           WHERE so.is_deleted = 0
           GROUP BY so.id
           ORDER BY so.order_date DESC`,
          [],
          (_, { rows }) => {
            const salesOrders: SalesOrder[] = [];
            for (let i = 0; i < rows.length; i++) {
              const row = rows.item(i);

              // Parse items
              const items = [];
              if (row.item_ids) {
                const itemIds = row.item_ids.split(',');
                const productIds = row.product_ids.split(',');
                const productNames = row.product_names.split(',');
                const productSkus = row.product_skus.split(',');
                const quantities = row.quantities.split(',');
                const unitPrices = row.unit_prices.split(',');
                const discounts = row.discounts.split(',');
                const itemTotals = row.item_totals.split(',');

                for (let j = 0; j < itemIds.length; j++) {
                  items.push({
                    id: itemIds[j],
                    productId: productIds[j],
                    product: productNames[j]
                      ? {
                          id: productIds[j],
                          name: productNames[j],
                          sku: productSkus[j],
                        }
                      : undefined,
                    quantity: parseInt(quantities[j]),
                    unitPrice: parseFloat(unitPrices[j]),
                    discount: parseFloat(discounts[j]),
                    total: parseFloat(itemTotals[j]),
                  });
                }
              }

              salesOrders.push({
                id: row.id,
                orderNumber: row.order_number,
                customerId: row.customer_id,
                customer: row.customer_name
                  ? {
                      id: row.customer_id,
                      name: row.customer_name,
                      balance: 0,
                      status: 'active',
                      lastModified: new Date(),
                      isDeleted: false,
                      createdAt: new Date(),
                      updatedAt: new Date(),
                      isActive: true,
                    }
                  : undefined,
                items,
                subtotal: row.subtotal,
                tax: row.tax,
                total: row.total,
                status: row.status,
                orderDate: new Date(row.order_date),
                deliveryDate: row.delivery_date
                  ? new Date(row.delivery_date)
                  : undefined,
                notes: row.notes,
                signature: row.signature,
                lastModified: new Date(row.last_modified),
                needsSync: row.needs_sync === 1,
                syncStatus: row.sync_status,
                isDeleted: row.is_deleted === 1,
              });
            }
            resolve(salesOrders);
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  async clearAllData(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      this.db.transaction(
        tx => {
          tx.executeSql('DELETE FROM sales_order_items');
          tx.executeSql('DELETE FROM sales_orders');
          tx.executeSql('DELETE FROM products');
          tx.executeSql('DELETE FROM customers');
        },
        error => reject(error),
        () => resolve()
      );
    });
  }
}

export const databaseService = new DatabaseService();
