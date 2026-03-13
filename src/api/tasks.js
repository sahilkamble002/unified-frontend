import { apiRequest } from "./client.js";

export const getEventTasks = (eventId) =>
  apiRequest(`/tasks/${eventId}/tasks`);

export const createTask = (eventId, payload) =>
  apiRequest(`/tasks/${eventId}/tasks`, {
    method: "POST",
    body: payload
  });

export const getTaskDetails = (taskId) => apiRequest(`/tasks/${taskId}`);

export const assignTask = (taskId, payload) =>
  apiRequest(`/tasks/${taskId}/assign`, {
    method: "POST",
    body: payload
  });

export const updateTaskProgress = (taskId, payload) =>
  apiRequest(`/tasks/${taskId}/progress`, {
    method: "PATCH",
    body: payload
  });

export const updateTaskStatus = (taskId, payload) =>
  apiRequest(`/tasks/${taskId}/status`, {
    method: "PATCH",
    body: payload
  });

export const deleteTask = (taskId) =>
  apiRequest(`/tasks/${taskId}`, {
    method: "DELETE"
  });
