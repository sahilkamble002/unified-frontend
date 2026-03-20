import { apiRequest } from "./client.js";

export const getNotifications = () => apiRequest("/notifications");

export const getPushConfig = () => apiRequest("/notifications/push-config");

export const markNotificationRead = (notificationId) =>
  apiRequest(`/notifications/${notificationId}/read`, {
    method: "PATCH"
  });

export const registerPushToken = (payload) =>
  apiRequest("/notifications/push-token", {
    method: "POST",
    body: payload
  });

export const unregisterPushToken = (token) =>
  apiRequest("/notifications/push-token", {
    method: "DELETE",
    body: { token }
  });

export const createEventNotification = (eventId, payload) =>
  apiRequest(`/notifications/event/${eventId}`, {
    method: "POST",
    body: payload
  });
