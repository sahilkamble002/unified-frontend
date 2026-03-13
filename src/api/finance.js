import { apiRequest } from "./client.js";

export const createDonation = (eventId, payload) =>
  apiRequest(`/finance/${eventId}/donate`, {
    method: "POST",
    body: payload
  });

export const getEventDonations = (eventId, params = {}) => {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", params.page);
  if (params?.limit) query.set("limit", params.limit);
  const suffix = query.toString();
  return apiRequest(
    `/finance/${eventId}/donations${suffix ? `?${suffix}` : ""}`
  );
};

export const getFinanceSummary = (eventId) =>
  apiRequest(`/finance/${eventId}/summary`);

export const createExpense = (eventId, payload) =>
  apiRequest(`/finance/${eventId}/expense`, {
    method: "POST",
    body: payload
  });

export const getEventExpenses = (eventId, params = {}) => {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", params.page);
  if (params?.limit) query.set("limit", params.limit);
  const suffix = query.toString();
  return apiRequest(
    `/finance/${eventId}/expenses${suffix ? `?${suffix}` : ""}`
  );
};

export const getDonationQR = (eventId) =>
  apiRequest(`/finance/${eventId}/donation-qr`);

export const verifyDonation = (donationId) =>
  apiRequest(`/finance/donation/${donationId}/verify`, {
    method: "PATCH"
  });
