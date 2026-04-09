import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button, Input, Spin } from "antd";
import {
  CloseOutlined,
  MessageOutlined,
  ReloadOutlined,
  RobotOutlined,
  SendOutlined,
} from "@ant-design/icons";
import { useSelector } from "react-redux";
import {
  createChatbotSession,
  endChatbotSession,
  getChatbotConfig,
  sendChatbotMessage,
} from "../../api/chatbotApi";
import "./ChatBot.css";

const DEFAULT_THEME = {
  accent: "#1A3636",
  accentSoft: "#40534C",
  panelBackground: "#FFFFFF",
  bodyBackground: "#F5F7F4",
  border: "rgba(214, 189, 152, 0.24)",
  launcherText: "#FFFFFF",
  botBubble: "#FFFFFF",
  userBubble: "#1A3636",
  userText: "#FFFFFF",
  assistantText: "#1A3636",
  mutedText: "#677D6A",
  errorBackground: "rgba(196, 63, 44, 0.1)",
  errorText: "#9F2D20",
};

const formatTimestamp = (timestampUtc) => {
  if (!timestampUtc) {
    return "";
  }

  return new Date(timestampUtc).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const buildMessageId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const normalizeMessages = (messages) =>
  (messages || []).map((message) => ({
    id: message.id || buildMessageId(),
    role: message.role || "assistant",
    text: message.text || "",
    timestampUtc: message.timestampUtc || new Date().toISOString(),
    metadata: message.metadata || null,
  }));

const hasSameMessageSignature = (left, right) =>
  left?.role === right?.role &&
  left?.text === right?.text &&
  (left?.metadata?.actionValue || "") === (right?.metadata?.actionValue || "") &&
  (left?.metadata?.actionTitle || "") === (right?.metadata?.actionTitle || "");

const appendUniqueMessages = (currentMessages, incomingMessages) => {
  const nextMessages = [...currentMessages];
  for (const message of incomingMessages) {
    const alreadyExists = nextMessages.some((existingMessage) => hasSameMessageSignature(existingMessage, message));
    if (!alreadyExists) {
      nextMessages.push(message);
    }
  }

  return nextMessages;
};

const buildPopupFeatures = () => {
  const width = 520;
  const height = 720;
  const dualScreenLeft = window.screenLeft ?? window.screenX ?? 0;
  const dualScreenTop = window.screenTop ?? window.screenY ?? 0;
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth || screen.width;
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight || screen.height;
  const left = dualScreenLeft + Math.max((viewportWidth - width) / 2, 0);
  const top = dualScreenTop + Math.max((viewportHeight - height) / 2, 0);

  return `popup=yes,width=${width},height=${height},left=${Math.round(left)},top=${Math.round(top)},resizable=yes,scrollbars=yes`;
};

const retryOnce = async (operation) => {
  try {
    return await operation();
  } catch (error) {
    if (error.name === "AbortError") {
      throw error;
    }

    return operation();
  }
};

const ChatBot = ({
  title,
  theme,
  position,
  apiBaseUrl,
  startOpen = false,
  showLauncher = true,
}) => {
  const { user, token } = useSelector((state) => state.auth);
  const storedAuth = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);
  const authToken = token || storedAuth?.token || null;
  const bottomRef = useRef(null);
  const abortRef = useRef(null);
  const [config, setConfig] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [sessionId, setSessionId] = useState("");
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(startOpen);
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState("");
  const [signInState, setSignInState] = useState({
    active: false,
    status: "idle",
    actionTitle: "Sign in",
    actionValue: "",
    lastUserMessage: "",
  });

  const mergedTheme = useMemo(
    () => ({ ...DEFAULT_THEME, ...(theme || {}) }),
    [theme],
  );

  const widgetPosition = position || config?.position || "bottom-right";
  const displayTitle = title || config?.title || "GeoSmart assistant";
  const enabled = config?.enabled ?? true;

  useEffect(() => {
    if (!enabled || !isOpen) {
      return;
    }

    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [enabled, isOpen, messages, isTyping]);

  useEffect(() => {
    if (!authToken || !user) {
      setConfig(null);
      setLoadingConfig(false);
      return undefined;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    const loadConfig = async () => {
      setLoadingConfig(true);
      try {
        const response = await getChatbotConfig({
          baseUrl: apiBaseUrl,
          token: authToken,
          signal: controller.signal,
        });

        setConfig(response);
        if (response?.welcomeMessage) {
          setMessages((currentMessages) => appendUniqueMessages(currentMessages, [{
            id: "welcome-message",
            role: "assistant",
            text: response.welcomeMessage,
            timestampUtc: new Date().toISOString(),
          }]));
        }
      } catch (loadError) {
        if (controller.signal.aborted || loadError?.name === "AbortError") {
          return;
        }

        setConfig({
          enabled: true,
          title: displayTitle,
          position: widgetPosition,
          welcomeMessage: "Hello. I am GeoSmart Assistance, how can I help you?",
        });
        setError(loadError.message || "Failed to load chatbot configuration.");
      } finally {
        setLoadingConfig(false);
      }
    };

    loadConfig();

    return () => {
      controller.abort();
    };
  }, [apiBaseUrl, authToken, user, displayTitle, widgetPosition]);

  useEffect(() => {
    return () => {
      if (sessionId && authToken) {
        endChatbotSession({ baseUrl: apiBaseUrl, token: authToken, sessionId }).catch(() => {});
      }
    };
  }, [apiBaseUrl, sessionId, authToken]);

  const ensureSession = async () => {
    if (sessionId) {
      return sessionId;
    }

    const response = await createChatbotSession({
      baseUrl: apiBaseUrl,
      token: authToken,
      body: {
        clientId: user?.id || user?._id || user?.email || "web-client",
        userId: user?.id || user?._id || user?.email || "web-user",
        userName: user?.name || user?.email || "Authenticated User",
        locale: navigator.language || "en-US",
      },
    });

    if (response?.welcomeMessage) {
      setMessages((currentMessages) => {
        return appendUniqueMessages(currentMessages, [{
            id: response.welcomeMessage.id || "session-welcome-message",
            role: response.welcomeMessage.role || "assistant",
            text: response.welcomeMessage.text || "",
            timestampUtc: response.welcomeMessage.timestampUtc || new Date().toISOString(),
          }]);
      });
    }

    setSessionId(response.sessionId);
    return response.sessionId;
  };

  const handleSend = async () => {
    const trimmedValue = inputValue.trim();
    if (!trimmedValue || isSending || signInState.status === "pending") {
      return;
    }

    const userMessage = {
      id: buildMessageId(),
      role: "user",
      text: trimmedValue,
      timestampUtc: new Date().toISOString(),
    };

    const nextHistory = [...messages, userMessage];
    setMessages(nextHistory);
    setInputValue("");
    setError("");
    setSignInState((currentState) => ({
      ...currentState,
      lastUserMessage: trimmedValue,
      status: currentState.active ? "ready-to-retry" : "idle",
    }));
    setIsSending(true);
    setIsTyping(true);

    try {
      const activeSessionId = await ensureSession();
      const response = await retryOnce(() =>
        sendChatbotMessage({
          baseUrl: apiBaseUrl,
          token: authToken,
          body: {
            sessionId: activeSessionId,
            text: trimmedValue,
            userId: user?.id || user?._id || user?.email || "web-user",
            userName: user?.name || user?.email || "Authenticated User",
            locale: navigator.language || "en-US",
            history: nextHistory.map((message) => ({
              id: message.id,
              role: message.role,
              text: message.text,
              timestampUtc: message.timestampUtc,
            })),
          },
        }),
      );

      const botMessages = normalizeMessages(response?.messages).filter((message) => message.text);
      if (botMessages.length === 0) {
        throw new Error("The chatbot returned an empty response.");
      }

      const requiresSignInMessage = botMessages.find((message) => message.metadata?.requiresSignIn === "true" && message.metadata?.actionValue);
      if (requiresSignInMessage) {
        setSignInState({
          active: true,
          status: "prompted",
          actionTitle: requiresSignInMessage.metadata?.actionTitle || "Sign in",
          actionValue: requiresSignInMessage.metadata?.actionValue || "",
          lastUserMessage: trimmedValue,
        });
      } else {
        setSignInState((currentState) => ({
          ...currentState,
          active: false,
          status: "idle",
        }));
      }

      setMessages((currentMessages) => appendUniqueMessages(currentMessages, botMessages));
    } catch (sendError) {
      setError(sendError.message || "Failed to send your message.");
    } finally {
      setIsTyping(false);
      setIsSending(false);
    }
  };

  const openSignInWindow = () => {
    if (!signInState.actionValue) {
      return;
    }

    const signInWindow = window.open(signInState.actionValue, "chatbot-signin", buildPopupFeatures());
    if (!signInWindow) {
      setError("The sign-in window was blocked by the browser. Allow pop-ups for this site and try again.");
      return;
    }

    setError("");
    setSignInState((currentState) => ({
      ...currentState,
      active: true,
      status: "pending",
    }));

    const popupPoll = window.setInterval(() => {
      if (signInWindow.closed) {
        window.clearInterval(popupPoll);
        setSignInState((currentState) => ({
          ...currentState,
          active: true,
          status: "ready-to-retry",
        }));
      }
    }, 1000);
  };

  const retryLastMessage = () => {
    if (!signInState.lastUserMessage) {
      return;
    }

    setInputValue(signInState.lastUserMessage);
    setSignInState((currentState) => ({
      ...currentState,
      status: "idle",
    }));
  };

  const dismissSignInPrompt = () => {
    setSignInState({
      active: false,
      status: "idle",
      actionTitle: "Sign in",
      actionValue: "",
      lastUserMessage: "",
    });
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  if (!user || !authToken) {
    return null;
  }

  if (loadingConfig) {
    return showLauncher ? (
      <div className={`chatbot-widget chatbot-widget--${widgetPosition}`}>
        <button
          type="button"
          className="chatbot-widget__launcher"
          style={{ background: mergedTheme.accent, color: mergedTheme.launcherText }}
          aria-label="Loading assistant"
        >
          <Spin size="small" />
        </button>
      </div>
    ) : null;
  }

  if (!enabled) {
    return null;
  }

  return (
    <div className={`chatbot-widget chatbot-widget--${widgetPosition}`}>
      {isOpen ? (
        <div
          className="chatbot-widget__panel"
          style={{
            background: mergedTheme.panelBackground,
            border: `1px solid ${mergedTheme.border}`,
          }}
        >
          <div
            className="chatbot-widget__header"
            style={{
              background: `linear-gradient(135deg, ${mergedTheme.accent} 0%, ${mergedTheme.accentSoft} 100%)`,
              color: mergedTheme.launcherText,
            }}
          >
            <div className="chatbot-widget__header-main">
              <span className="chatbot-widget__avatar" style={{ background: "rgba(255, 255, 255, 0.18)" }}>
                <RobotOutlined />
              </span>
              <div>
                <h3 className="chatbot-widget__title">{displayTitle}</h3>
                <div className="chatbot-widget__subtitle">Ask anything about the workflow or data</div>
              </div>
            </div>

            <button type="button" className="chatbot-widget__close" onClick={() => setIsOpen(false)} aria-label="Close chatbot">
              <CloseOutlined />
            </button>
          </div>

          {error ? (
            <div
              className="chatbot-widget__error"
              style={{ background: mergedTheme.errorBackground, color: mergedTheme.errorText }}
            >
              {error}
            </div>
          ) : null}

          {signInState.active ? (
            <div className="chatbot-widget__signin-banner">
              <div className="chatbot-widget__signin-copy">
                <strong>Bot sign-in required</strong>
                <span>
                  {signInState.status === "pending"
                    ? "Finish signing in in the popup window, then come back here."
                    : signInState.status === "ready-to-retry"
                      ? "Sign-in window closed. Retry your last message to continue the conversation."
                      : "This bot requires a separate sign-in before it can answer protected questions."}
                </span>
              </div>
              <div className="chatbot-widget__signin-actions">
                <Button
                  type="primary"
                  size="small"
                  onClick={openSignInWindow}
                  disabled={signInState.status === "pending" || !signInState.actionValue}
                  style={{ background: mergedTheme.accent, borderColor: mergedTheme.accent }}
                >
                  {signInState.actionTitle || "Sign in"}
                </Button>
                {signInState.status === "ready-to-retry" ? (
                  <Button size="small" icon={<ReloadOutlined />} onClick={retryLastMessage}>
                    Retry last message
                  </Button>
                ) : null}
                <Button size="small" type="text" onClick={dismissSignInPrompt}>
                  Dismiss
                </Button>
              </div>
            </div>
          ) : null}

          <div className="chatbot-widget__body" style={{ background: mergedTheme.bodyBackground }}>
            {messages.map((message) => {
              const isUser = message.role === "user";
              return (
                <div
                  key={message.id}
                  className={`chatbot-widget__message-row chatbot-widget__message-row--${isUser ? "user" : "assistant"}`}
                >
                  <div
                    className="chatbot-widget__bubble"
                    style={{
                      background: isUser ? mergedTheme.userBubble : mergedTheme.botBubble,
                      color: isUser ? mergedTheme.userText : mergedTheme.assistantText,
                      border: isUser ? "none" : `1px solid ${mergedTheme.border}`,
                    }}
                  >
                    {message.text}
                    {!isUser && message.metadata?.actionValue ? (
                      <div style={{ marginTop: 12 }}>
                        <Button
                          type="primary"
                          size="small"
                          onClick={openSignInWindow}
                          style={{ background: mergedTheme.accent, borderColor: mergedTheme.accent }}
                        >
                          {message.metadata.actionTitle || "Sign in"}
                        </Button>
                      </div>
                    ) : null}
                    <div className="chatbot-widget__meta">{formatTimestamp(message.timestampUtc)}</div>
                  </div>
                </div>
              );
            })}

            {isTyping ? (
              <div className="chatbot-widget__message-row chatbot-widget__message-row--assistant">
                <div
                  className="chatbot-widget__bubble"
                  style={{
                    background: mergedTheme.botBubble,
                    color: mergedTheme.assistantText,
                    border: `1px solid ${mergedTheme.border}`,
                  }}
                >
                  <div className="chatbot-widget__typing">
                    <span className="chatbot-widget__typing-dot" style={{ background: mergedTheme.accent }} />
                    <span className="chatbot-widget__typing-dot" style={{ background: mergedTheme.accent }} />
                    <span className="chatbot-widget__typing-dot" style={{ background: mergedTheme.accent }} />
                  </div>
                </div>
              </div>
            ) : null}

            <div ref={bottomRef} />
          </div>

          <div className="chatbot-widget__footer" style={{ background: mergedTheme.panelBackground }}>
            <div className="chatbot-widget__composer">
              <Input.TextArea
                rows={2}
                autoSize={{ minRows: 2, maxRows: 4 }}
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message and press Enter"
                disabled={isSending || signInState.status === "pending"}
              />

              <Button
                type="primary"
                icon={<SendOutlined />}
                className="chatbot-widget__send"
                onClick={handleSend}
                loading={isSending}
                disabled={signInState.status === "pending"}
                style={{ background: mergedTheme.accent, borderColor: mergedTheme.accent }}
              >
                Send
              </Button>
            </div>

            <div className="chatbot-widget__helper" style={{ color: mergedTheme.mutedText }}>
              {signInState.status === "pending"
                ? "Complete the sign-in popup before sending another message."
                : "Shift + Enter adds a new line."}
            </div>
          </div>
        </div>
      ) : null}

      {showLauncher && !isOpen ? (
        <button
          type="button"
          className="chatbot-widget__launcher"
          style={{ background: mergedTheme.accent, color: mergedTheme.launcherText }}
          onClick={() => setIsOpen(true)}
          aria-label="Open chatbot"
        >
          <MessageOutlined style={{ fontSize: 22 }} />
        </button>
      ) : null}
    </div>
  );
};

export default ChatBot;