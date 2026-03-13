import { apiRequest } from "./client.js";

export const getEvents = () => apiRequest("/events");

export const createEvent = (payload) =>
  apiRequest("/events", {
    method: "POST",
    body: payload
  });

export const getEventById = (eventId) => apiRequest(`/events/${eventId}`);

export const updateEvent = (eventId, payload) =>
  apiRequest(`/events/${eventId}`, {
    method: "PATCH",
    body: payload
  });

export const deleteEvent = (eventId) =>
  apiRequest(`/events/${eventId}`, {
    method: "DELETE"
  });

export const getEventMembers = (eventId) =>
  apiRequest(`/events/${eventId}/members`);

export const addEventMember = (eventId, payload) =>
  apiRequest(`/events/${eventId}/members`, {
    method: "POST",
    body: payload
  });

export const updateMemberRole = (eventId, username, payload) =>
  apiRequest(`/events/${eventId}/members/${username}`, {
    method: "PATCH",
    body: payload
  });

export const removeEventMember = (eventId, username) =>
  apiRequest(`/events/${eventId}/members/${username}`, {
    method: "DELETE"
  });
