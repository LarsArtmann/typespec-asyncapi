//TODO: Split this into it's own file!
export type HttpBindingConfig = {
  /** HTTP method */
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS";
  /** Query parameters schema */
  query?: Record<string, unknown>;
  /** Headers schema */
  headers?: Record<string, unknown>;
  /** Request/response status codes */
  statusCode?: number;
};
