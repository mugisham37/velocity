import { gql } from '@apollo/client';

export const GET_CUSTOMERS = gql`
  query GetCustomers {
    customers {
      id
      name
      email
      phone
      address {
        street
        city
        state
        zipCode
        country
      }
      createdAt
      updatedAt
    }
  }
`;

export const GET_PRODUCTS = gql`
  query GetProducts {
    products {
      id
      name
      sku
      barcode
      description
      price
      cost
      stockQuantity
      category
      images
      isActive
      createdAt
      updatedAt
    }
  }
`;

export const GET_SALES_ORDERS = gql`
  query GetSalesOrders {
    salesOrders {
      id
      customerId
      orderDate
      status
      items {
        id
        productId
        quantity
        unitPrice
        discount
        total
      }
      total
      createdAt
      updatedAt
    }
  }
`;
