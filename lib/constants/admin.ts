// Shared between server pages (page-size validation) and the client
// AdminPagination component — kept in a plain module (no "use client") so
// Server Components can import the value directly instead of importing it
// out of a client-boundary file.
export const PAGE_SIZE_OPTIONS = [20, 50, 100, 200];
