import { apiRequest } from "./client.js";

export const getNotifications = () => apiRequest("/notifications");

export const markNotificationRead = (notificationId) =>
  apiRequest(`/notifications/${notificationId}/read`, {
    method: "PATCH"
  });

export const createEventNotification = (eventId, payload) =>
  apiRequest(`/notifications/event/${eventId}`, {
    method: "POST",
    body: payload
  });
