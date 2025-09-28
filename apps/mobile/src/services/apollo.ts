import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  from,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { RetryLink } from '@apollo/client/link/retry';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '@store/auth';
import * as SecureStore from 'expo-secure-store';

// HTTP Link
const httpLink = createHttpLink({
  uri: process.env.EXPO_PUBLIC_GRAPHQL_URL || 'http://localhost:4000/graphql',
});

// Auth Link
const authLink = setContext(async (_, { headers }) => {
  // Get the authentication token from secure storage
  const token = await SecureStore.getItemAsync('accessToken');

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

// Error Link
const errorLink = onError(
  ({ graphQLErrors, networkError, operation, forward }) => {
    if (graphQLErrors) {
      graphQLErrors.forEach(({ message, locations, path }) => {
        console.error(
          `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
        );
      });
    }

    if (networkError) {
      console.error(`[Network error]: ${networkError}`);

      // Handle 401 errors (unauthorized)
      if ('statusCode' in networkError && networkError.statusCode === 401) {
        // Try to refresh token
        const auth = useAuthStore.getState();
        auth.refreshToken().catch(() => {
          // If refresh fails, logout user
          auth.logout();
        });
      }
    }
    return forward(operation);
  }
);

// Retry Link
const retryLink = new RetryLink({
  delay: {
    initial: 300,
    max: Infinity,
    jitter: true,
  },
  attempts: {
    max: 5,
    retryIf: (error, _operation) => !!error,
  },
});

// Cache
const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        customers: {
          merge(existing = [], incoming: any[]) {
            return incoming;
          },
        },
        products: {
          merge(existing = [], incoming: any[]) {
            return incoming;
          },
        },
        salesOrders: {
          merge(existing = [], incoming: any[]) {
            return incoming;
          },
        },
      },
    },
  },
});

// Apollo Client
export const apolloClient = new ApolloClient({
  link: from([errorLink, retryLink, authLink, httpLink]),
  cache,
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
      notifyOnNetworkStatusChange: true,
    },
    query: {
      errorPolicy: 'all',
    },
  },
});

// Cache persistence
export const persistCache = async () => {
  try {
    const cacheData = await cache.extract();
    await AsyncStorage.setItem('apollo-cache', JSON.stringify(cacheData));
  } catch (error) {
    console.error('Error persisting cache:', error);
  }
};

export const restoreCache = async () => {
  try {
    const cacheData = await AsyncStorage.getItem('apollo-cache');
    if (cacheData) {
      await cache.restore(JSON.parse(cacheData));
    }
  } catch (error) {
    console.error('Error restoring cache:', error);
  }
};
