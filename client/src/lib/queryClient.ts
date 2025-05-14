import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    try {
      const resClone = res.clone();
      const text = (await res.text()) || res.statusText;
      console.error(`API Error (${res.status}):`, text);
      throw new Error(`${res.status}: ${text}`);
    } catch (error) {
      throw new Error(`${res.status}: Request failed`);
    }
  }
}

export async function apiRequest(
  method: string = 'GET',
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  console.log(`API Request: ${url} ${method}`, data);
  
  try {
    // Make sure URL starts with /api
    if (!url.startsWith('/api') && !url.startsWith('http')) {
      url = `/api${url.startsWith('/') ? '' : '/'}${url}`;
    }
    
    console.log(`Sending request to: ${url} with method ${method}`);
    
    const res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    console.log(`API Response status: ${res.status}`);
    
    // Clone the response before checking if it's ok
    // This ensures we can still return the original response even after reading its body
    const resClone = res.clone();
    
    if (!res.ok) {
      const text = await res.text();
      let errorMessage;
      try {
        const errorJson = JSON.parse(text);
        errorMessage = errorJson.message || text;
      } catch {
        errorMessage = text;
      }
      console.error(`API Error (${res.status}):`, errorMessage);
      throw new Error(errorMessage);
    }
    
    return resClone;
  } catch (error) {
    console.error("API request failed:", error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Make sure URL starts with /api
    let url = queryKey[0] as string;
    if (!url.startsWith('/api') && !url.startsWith('http')) {
      url = `/api${url.startsWith('/') ? '' : '/'}${url}`;
    }
    
    console.log(`Query function fetching: ${url}`);
    
    const res = await fetch(url, {
      credentials: "include",
    });
    
    console.log(`Query response status: ${res.status}`);

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      console.log("Returning null due to 401");
      return null;
    }

    try {
      await throwIfResNotOk(res);
      const data = await res.json();
      console.log("Query response data:", data);
      return data;
    } catch (error) {
      console.error("Error in query function:", error);
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: 1,
    },
    mutations: {
      retry: 1,
    },
  },
});
