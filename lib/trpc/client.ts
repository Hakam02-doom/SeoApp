// Stub tRPC client - tRPC has been removed
// This file exists to prevent import errors in pages that haven't been updated yet

// Create a generic stub for any router/method combination
const createStubQuery = () => ({ 
  data: null, 
  isLoading: false, 
  error: null,
  refetch: async () => ({ data: null, isLoading: false, error: null }),
});

const createStubMutation = () => ({ 
  mutate: () => {}, 
  mutateAsync: async () => ({}),
  isPending: false,
  isSuccess: false,
  isError: false,
  error: null,
  data: null,
  reset: () => {},
}) as any;

// Create a proxy that returns stubs for any property access
const createStubRouter = (): any => {
  return new Proxy({}, {
    get(_target, prop) {
      if (prop === 'useQuery') {
        return () => createStubQuery();
      }
      if (prop === 'useMutation') {
        return (options?: any) => {
          const stub = createStubMutation();
          // Call callbacks if provided
          if (options?.onSuccess) {
            setTimeout(() => options.onSuccess({ article: { id: '' } } as any), 0);
          }
          return stub;
        };
      }
      // For nested properties, return another stub router
      return createStubRouter();
    },
  });
};

export const trpc = createStubRouter();

