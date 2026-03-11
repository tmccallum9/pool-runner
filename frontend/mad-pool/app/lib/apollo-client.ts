import { ApolloClient, InMemoryCache, HttpLink, NormalizedCacheObject } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

let client: ApolloClient<NormalizedCacheObject> | null = null;

export function getApolloClient(): ApolloClient<NormalizedCacheObject> {
  const isServer = typeof window === 'undefined';

  // Always create a new client on the server (for SSR)
  // But reuse the same client on the browser
  if (isServer || !client) {
    const rawGraphQLEndpoint =
      process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:8000/graphql/';
    const graphqlEndpoint = rawGraphQLEndpoint.endsWith('/')
      ? rawGraphQLEndpoint
      : `${rawGraphQLEndpoint}/`;

    const httpLink = new HttpLink({
      uri: graphqlEndpoint,
      credentials: 'include', // Include cookies for authentication
      // Add custom fetch to log requests in development
      fetch: typeof window !== 'undefined' && process.env.NODE_ENV === 'development'
        ? (uri, options) => {
            console.log('[Apollo Client] Fetching:', uri);
            console.log('[Apollo Client] Headers:', options?.headers);
            return fetch(uri, options);
          }
        : undefined,
    });

    // Add authentication header with JWT token
    const authLink = setContext((_, { headers }) => {
      // Get the authentication token from localStorage if it exists
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;

      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
        console.log('[Apollo Client] Token from localStorage:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');
      }

      // Return the headers to the context so httpLink can read them
      return {
        headers: {
          ...headers,
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
      };
    });

    const newClient = new ApolloClient({
      link: authLink.concat(httpLink),
      cache: new InMemoryCache(),
      // Disable cache for SSR to avoid hydration mismatches
      ssrMode: isServer,
      // Don't cache on server
      defaultOptions: isServer
        ? {
            query: {
              fetchPolicy: 'no-cache',
            },
            mutate: {
              fetchPolicy: 'no-cache',
            },
          }
        : {
            query: {
              fetchPolicy: 'cache-first',
            },
          },
    });

    // Only cache the client on the browser
    if (!isServer) {
      client = newClient;
    }

    return newClient;
  }

  return client;
}
