// ─── State ───────────────────────────────────────────────────────────────────
const state = {
  chats: [{ id: 1, title: "Memory Bank", active: false }],
  currentChatId: null,
  messages: {},
  isStreaming: false,
  mode: "Default",
};

const MODES = ["Default", "Creative", "Precise", "Balanced"];

const AI_RESPONSES = [
  "That's a great question! Let me think through this carefully...\n\nBased on what I know, here's a thorough breakdown:\n\n**Key Points:**\n- The concept has several important dimensions worth exploring\n- Context matters a great deal here\n- There are multiple valid perspectives to consider\n\nWould you like me to dive deeper into any of these areas?",
  "Sure! Here's how I'd approach that:\n\n1. **Start with the basics** — make sure the foundation is solid\n2. **Build incrementally** — small steps reduce complexity\n3. **Test as you go** — catch issues early\n\nLet me know if you'd like a more detailed explanation of any step.",
  "Interesting prompt! Here's my take:\n\nThe short answer is: *it depends on the context*. The longer answer involves weighing a few trade-offs that are worth understanding before making a decision.\n\nI'm happy to walk you through each one if that would help.",
  "Absolutely, I can help with that.\n\nHere's a quick summary of what I know on this topic:\n\n> The most important thing to keep in mind is that simplicity often wins over cleverness.\n\nWith that framing in mind, here are a few practical suggestions to get you started.",
];

// ─── DOM refs ─────────────────────────────────────────────────────────────────
const chatListEl = document.getElementById("chat-list");
const noChatsEl = document.getElementById("no-chats");
const mainEl = document.getElementById("main");
const welcomeEl = document.getElementById("welcome");
const messagesEl = document.getElementById("messages");
const inputEl = document.getElementById("message-input");
const sendBtn = document.getElementById("send-btn");
const newChatBtn = document.getElementById("new-chat-btn");
const modeBtn = document.getElementById("mode-btn");
const modeLabelEl = document.getElementById("mode-label");
const chatTitleEl = document.getElementById("chat-title");

// ─── Init ─────────────────────────────────────────────────────────────────────
renderChatList();

// ─── New Chat ─────────────────────────────────────────────────────────────────
newChatBtn.addEventListener("click", () => {
  createChat("New Chat");
});

function createChat(title) {
  const id = Date.now();
  state.chats.unshift({ id, title });
  state.messages[id] = [];
  renderChatList();
  openChat(id);
}

// ─── Open Chat ────────────────────────────────────────────────────────────────
function openChat(id) {
  state.currentChatId = id;
  state.chats.forEach((c) => (c.active = c.id === id));
  renderChatList();

  const chat = state.chats.find((c) => c.id === id);
  if (chatTitleEl) chatTitleEl.textContent = chat?.title || "Chat";

  welcomeEl.style.display = "none";
  messagesEl.style.display = "flex";
  messagesEl.innerHTML = "";

  (state.messages[id] || []).forEach((msg) => renderBubble(msg, false));
}

// ─── Render Sidebar ───────────────────────────────────────────────────────────
function renderChatList() {
  chatListEl.innerHTML = "";
  const hasChats = state.chats.length > 0;
  noChatsEl.style.display = hasChats ? "none" : "flex";

  state.chats.forEach((chat) => {
    const item = document.createElement("div");
    item.className = "chat-item" + (chat.active ? " active" : "");
    item.dataset.id = chat.id;
    item.innerHTML = `
      <span class="dot"></span>
      <span class="chat-name">${escapeHtml(chat.title)}</span>
      <button class="delete-btn" title="Delete chat">
        <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    `;

    item.addEventListener("click", (e) => {
      if (e.target.closest(".delete-btn")) return;
      openChat(chat.id);
    });

    item.querySelector(".delete-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      deleteChat(chat.id);
    });

    chatListEl.appendChild(item);
  });
}

function deleteChat(id) {
  state.chats = state.chats.filter((c) => c.id !== id);
  delete state.messages[id];
  if (state.currentChatId === id) {
    state.currentChatId = null;
    welcomeEl.style.display = "flex";
    messagesEl.style.display = "none";
    if (chatTitleEl) chatTitleEl.textContent = "";
  }
  renderChatList();
}

// ─── Send Message ─────────────────────────────────────────────────────────────
sendBtn.addEventListener("click", sendMessage);
inputEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

inputEl.addEventListener("input", () => {
  sendBtn.style.opacity = inputEl.value.trim() ? "1" : "0.4";
});

function sendMessage() {
  const content = inputEl.value.trim();
  if (!content || state.isStreaming) return;

  if (!state.currentChatId) {
    createChat(content.slice(0, 36) + (content.length > 36 ? "…" : ""));
  }

  const id = state.currentChatId;
  const userMsg = { role: "user", content };
  state.messages[id] = state.messages[id] || [];
  state.messages[id].push(userMsg);

  // Update chat title from first message
  const chat = state.chats.find((c) => c.id === id);
  if (chat && chat.title === "New Chat") {
    chat.title = content.slice(0, 36) + (content.length > 36 ? "…" : "");
    if (chatTitleEl) chatTitleEl.textContent = chat.title;
    renderChatList();
  }

  renderBubble(userMsg, true);
  inputEl.value = "";
  sendBtn.style.opacity = "0.4";

  streamResponse(id);
}

// ─── Suggestions ──────────────────────────────────────────────────────────────
document.querySelectorAll(".suggestion").forEach((btn) => {
  btn.addEventListener("click", () => {
    const text = btn.textContent.replace(/^"|"$/g, "");
    inputEl.value = text;
    sendBtn.style.opacity = "1";
    inputEl.focus();
    sendMessage();
  });
});

// ─── Mode Toggle ──────────────────────────────────────────────────────────────
modeBtn.addEventListener("click", () => {
  const idx = MODES.indexOf(state.mode);
  state.mode = MODES[(idx + 1) % MODES.length];
  modeLabelEl.textContent = "Mode: " + state.mode;
});

// ─── Render Bubble ────────────────────────────────────────────────────────────
function renderBubble(msg, animate) {
  const isUser = msg.role === "user";
  const wrapper = document.createElement("div");
  wrapper.className = "message-row " + (isUser ? "user-row" : "ai-row") + (animate ? " slide-in" : "");

  if (isUser) {
    wrapper.innerHTML = `
      <div class="bubble user-bubble">${escapeHtml(msg.content)}</div>
      <div class="avatar user-avatar">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      </div>
    `;
  } else {
    wrapper.innerHTML = `
      <div class="avatar ai-avatar">🎩</div>
      <div class="bubble ai-bubble">${msg.content}</div>
    `;
  }

  messagesEl.appendChild(wrapper);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return wrapper;
}

// ─── Stream Response ──────────────────────────────────────────────────────────
function streamResponse(chatId) {
  state.isStreaming = true;
  sendBtn.innerHTML = `
    <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
      <rect x="6" y="6" width="12" height="12" rx="2"/>
    </svg>`;
  sendBtn.title = "Stop";
  sendBtn.onclick = stopStream;

  const fullText = AI_RESPONSES[Math.floor(Math.random() * AI_RESPONSES.length)];
  let i = 0;
  let accumulated = "";

  const wrapper = document.createElement("div");
  wrapper.className = "message-row ai-row slide-in";
  wrapper.innerHTML = `
    <div class="avatar ai-avatar">🎩</div>
    <div class="bubble ai-bubble"><span class="cursor">▍</span></div>
  `;
  messagesEl.appendChild(wrapper);
  messagesEl.scrollTop = messagesEl.scrollHeight;

  const bubbleEl = wrapper.querySelector(".ai-bubble");

  const interval = setInterval(() => {
    if (!state.isStreaming) {
      clearInterval(interval);
      return;
    }

    const chunk = fullText.slice(i, i + 4);
    accumulated += chunk;
    i += 4;

    bubbleEl.innerHTML = renderMarkdown(accumulated) + '<span class="cursor">▍</span>';
    messagesEl.scrollTop = messagesEl.scrollHeight;

    if (i >= fullText.length) {
      clearInterval(interval);
      bubbleEl.innerHTML = renderMarkdown(accumulated);
      state.messages[chatId] = state.messages[chatId] || [];
      state.messages[chatId].push({ role: "assistant", content: accumulated });
      finishStream();
    }
  }, 30);

  window._streamInterval = interval;
}

function stopStream() {
  clearInterval(window._streamInterval);
  finishStream();
}

function finishStream() {
  state.isStreaming = false;
  sendBtn.innerHTML = `
    <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
      <line x1="22" y1="2" x2="11" y2="13"/>
      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>`;
  sendBtn.title = "Send";
  sendBtn.onclick = sendMessage;
}

// ─── Simple Markdown renderer ─────────────────────────────────────────────────
function renderMarkdown(text) {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/^\d+\. (.+)$/gm, "<li>$1</li>")
    .replace(/^[-*] (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br/>");
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}