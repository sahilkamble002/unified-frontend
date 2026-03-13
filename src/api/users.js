import { apiRequest } from "./client.js";

export const searchUsers = (query) =>
  apiRequest(`/users/search?q=${encodeURIComponent(query)}`);
