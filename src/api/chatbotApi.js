const resolveBaseUrl = (baseUrl) => {
  const fallback = `${import.meta.env.VITE_API_URL}/api/chatbot`;
  return (baseUrl || fallback).replace(/\/$/, "");
};

const buildHeaders = (token) => {
  const headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

const parseResponse = async (response) => {
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message = typeof payload === "string"
      ? payload
      : payload?.message || payload?.title || "Chatbot request failed.";
    throw new Error(message);
  }

  return payload;
};

const requestJson = async (url, options) => {
  const response = await fetch(url, options);
  return parseResponse(response);
};

export const getChatbotConfig = ({ baseUrl, token, signal } = {}) =>
  requestJson(`${resolveBaseUrl(baseUrl)}/config`, {
    method: "GET",
    headers: buildHeaders(token),
    signal,
  });

export const createChatbotSession = ({ baseUrl, token, body, signal } = {}) =>
  requestJson(`${resolveBaseUrl(baseUrl)}/sessions`, {
    method: "POST",
    headers: buildHeaders(token),
    body: JSON.stringify(body || {}),
    signal,
  });

export const sendChatbotMessage = ({ baseUrl, token, body, signal } = {}) =>
  requestJson(`${resolveBaseUrl(baseUrl)}/messages`, {
    method: "POST",
    headers: buildHeaders(token),
    body: JSON.stringify(body || {}),
    signal,
  });

export const endChatbotSession = ({ baseUrl, token, sessionId, signal } = {}) =>
  requestJson(`${resolveBaseUrl(baseUrl)}/sessions/${sessionId}`, {
    method: "DELETE",
    headers: buildHeaders(token),
    signal,
  });