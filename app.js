/* ==========================================================================
   MICROCYBER BATTLEDECK V02 - APPLICATION LOGIC
   ========================================================================== */

const STORAGE_WEBHOOK_KEY = "prompt_enhancer_n8n_webhook";
const STORAGE_HISTORY_KEY = "prompt_enhancer_history_v4";
const DEFAULT_WEBHOOK_URL = "http://localhost:5678/webhook/enhance-promp";

// DOM Elements
const enhanceBtn = document.getElementById("enhance-btn");
const rawPromptInput = document.getElementById("raw-prompt");
const clearPromptBtn = document.getElementById("clear-prompt-btn");
const statusBarEl = document.getElementById("status-bar");
const resultsGridEl = document.getElementById("results-grid");
const activeModelTagEl = document.getElementById("active-model-tag");

// Navigation View Tabs (EXACTLY TWO VIEWS)
const viewTabPrompt = document.getElementById("view-tab-prompt");
const viewTabHistory = document.getElementById("view-tab-history");

const viewPromptContainer = document.getElementById("view-prompt-container");
const viewHistoryContainer = document.getElementById("view-history-container");
const historyListEl = document.getElementById("history-list");
const clearHistoryBtn = document.getElementById("clear-history-btn");

// Header & Modal Elements
const webhookSettingsBtn = document.getElementById("webhook-settings-btn");
const webhookIndicatorEl = document.getElementById("webhook-indicator");
const webhookBannerEl = document.getElementById("webhook-banner");
const bannerConfigBtn = document.getElementById("banner-config-btn");

const settingsModal = document.getElementById("settings-modal");
const closeModalBtn = document.getElementById("close-modal-btn");
const webhookUrlInput = document.getElementById("webhook-url-input");
const testWebhookBtn = document.getElementById("test-webhook-btn");
const saveWebhookBtn = document.getElementById("save-webhook-btn");
const testResultEl = document.getElementById("webhook-test-result");

// App State
let webhookUrl = localStorage.getItem(STORAGE_WEBHOOK_KEY) || DEFAULT_WEBHOOK_URL;
let historyData = JSON.parse(localStorage.getItem(STORAGE_HISTORY_KEY) || "[]");

// Initialize App
document.addEventListener("DOMContentLoaded", () => {
  initWebhookState();
  initEventListeners();
  initViewSwitcher();
});

function initWebhookState() {
  if (webhookUrl) {
    webhookUrlInput.value = webhookUrl;
    webhookIndicatorEl.classList.remove("offline");
    webhookBannerEl.classList.add("hidden");
  } else {
    webhookIndicatorEl.classList.add("offline");
    webhookBannerEl.classList.remove("hidden");
  }
}

// Exactly 2 Main Navigation View Switcher
function initViewSwitcher() {
  if (viewTabPrompt) {
    viewTabPrompt.addEventListener("click", () => {
      viewTabPrompt.classList.add("active");
      viewTabHistory.classList.remove("active");

      viewPromptContainer.classList.remove("hidden");
      viewHistoryContainer.classList.add("hidden");
    });
  }

  if (viewTabHistory) {
    viewTabHistory.addEventListener("click", () => {
      viewTabHistory.classList.add("active");
      viewTabPrompt.classList.remove("active");

      viewPromptContainer.classList.add("hidden");
      viewHistoryContainer.classList.remove("hidden");

      renderInPageHistoryList();
    });
  }
}

function initEventListeners() {
  if (clearPromptBtn && rawPromptInput) {
    clearPromptBtn.addEventListener("click", () => {
      rawPromptInput.value = "";
    });
  }

  if (enhanceBtn) {
    enhanceBtn.addEventListener("click", handleEnhanceRequest);
  }

  // Webhook settings modal
  if (webhookSettingsBtn) webhookSettingsBtn.addEventListener("click", openModal);
  if (bannerConfigBtn) bannerConfigBtn.addEventListener("click", openModal);
  if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);

  if (saveWebhookBtn) {
    saveWebhookBtn.addEventListener("click", () => {
      const url = webhookUrlInput.value.trim();
      webhookUrl = url;
      localStorage.setItem(STORAGE_WEBHOOK_KEY, url);
      initWebhookState();
      closeModal();
      showStatus("Webhook endpoint settings saved successfully.", "success");
    });
  }

  if (testWebhookBtn) {
    testWebhookBtn.addEventListener("click", testWebhookConnection);
  }

  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener("click", () => {
      historyData = [];
      localStorage.removeItem(STORAGE_HISTORY_KEY);
      renderInPageHistoryList();
      showStatus("Log history buffer cleared.", "info");
    });
  }
}

async function handleEnhanceRequest() {
  const promptText = rawPromptInput ? rawPromptInput.value.trim() : "";

  if (!promptText) {
    showStatus("PLEASE ENTER A RAW HUMAN PROMPT BEFORE EXECUTING BATTLEDECK PROMPT SYNTHESIS.", "error");
    return;
  }

  setLoadingState(true);
  showStatus(`CONTACTING BATTLEDECK PROMPT SYNTHESIZER PIPELINE...`, "info");

  const payload = {
    prompt: promptText,
    model: "hyper_engine",
    subject_ref: promptText
  };

  try {
    let resultText = "";

    if (!webhookUrl) {
      // Fallback demo execution
      await new Promise(r => setTimeout(r, 600));
      resultText = generateDemoHyperPrompt(promptText);
    } else {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}: ${response.statusText}`);
      }

      const rawText = await response.text();
      try {
        const resJson = JSON.parse(rawText);
        resultText = resJson.enhanced_prompt || resJson.output || resJson.text || rawText;
      } catch (e) {
        resultText = rawText;
      }
    }

    renderHyperMasterPromptCard(resultText);
    saveToHistory(promptText, resultText);
    showStatus(`BATTLEDECK PROMPT SYNTHESIS COMPLETE. MASTER OUTPUT BUFFER UPDATED.`, "success");

  } catch (err) {
    console.warn("n8n Webhook connection failed, using fallback generator:", err);
    showStatus(`WEBHOOK WARNING: ${err.message}. BATTLEDECK DEMO OUTPUT GENERATED BELOW.`, "error");
    const demoPrompt = generateDemoHyperPrompt(promptText);
    renderHyperMasterPromptCard(demoPrompt);
  } finally {
    setLoadingState(false);
  }
}

// Render Master Hyper Prompt Card
function renderHyperMasterPromptCard(promptText) {
  resultsGridEl.innerHTML = "";

  const wordCount = promptText ? promptText.trim().split(/\s+/).length : 0;
  const charCount = promptText ? promptText.length : 0;

  const card = document.createElement("div");
  card.className = "result-card card-text-only";
  card.innerHTML = `
    <div class="result-header">
      <div class="model-name">
        <i class="fa-solid fa-code" style="color: #00ffaa;"></i>
        <span>DEN-VULKAN MASTER PROMPT</span>
        <span class="badge-text-only">PRODUCTION-READY LLM PROMPT</span>
      </div>
      <div class="result-actions">
        <button class="copy-btn" type="button"><i class="fa-regular fa-copy"></i> <span>COPY_MASTER_PROMPT</span></button>
      </div>
    </div>

    <div class="prompt-body">
      <pre class="prompt-output">${escapeHtml(promptText)}</pre>
    </div>

    <div class="result-footer">
      <span>STATISTICS: ${charCount} CHARS | ${wordCount} WORDS</span>
      <span>COMPATIBILITY: ChatGPT-4o | Gemini 1.5 Pro | Claude 3.5 | Llama 3</span>
    </div>
  `;

  bindCopyButton(card, promptText);
  resultsGridEl.appendChild(card);
}

function bindCopyButton(card, textToCopy) {
  const copyBtn = card.querySelector(".copy-btn");
  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(textToCopy).then(() => {
        const originalHtml = copyBtn.innerHTML;
        copyBtn.innerHTML = `<i class="fa-solid fa-check"></i> COPIED_TO_CLIPBOARD!`;
        setTimeout(() => { copyBtn.innerHTML = originalHtml; }, 2000);
      });
    });
  }
}

// Fallback Demo Hyper Prompt Generator
function generateDemoHyperPrompt(humanPrompt) {
  return `<role>
You are an elite Senior Software Architect, Systems Engineer, and Production Code Specialist.
You possess deep expertise in writing robust, scalable, self-documenting code with comprehensive error handling and optimal performance.
</role>

<objective>
Analyze the human prompt objective: "${humanPrompt}".
Synthesize a complete, production-ready solution that fulfills all functional, architectural, and operational requirements without truncation or placeholder logic.
</objective>

<context>
- Target Environment: Production Cloud / Local Operating System
- Operating Constraints: Strict typing, zero unhandled exception paths, clean code architecture, and modular function design.
- Target LLMs: Designed for optimal execution in ChatGPT-4o, Gemini 1.5 Pro, Claude 3.5 Sonnet, and Llama 3.
</context>

<execution_steps>
1. Analyze the core functional requirements and edge cases inherent in the raw human prompt.
2. Outline the step-by-step modular code structure and data schemas required.
3. Implement the complete, clean, production-grade source code with explicit type annotations and docstrings.
4. Include explicit error handling, input validation, and graceful failure fallbacks.
5. Provide clear verification instructions and unit test guidelines.
</execution_steps>

<output_format>
- Structure response in clean GitHub-Flavored Markdown.
- Enclose all code in fenced code blocks with language identifiers.
- Maintain professional, precise technical documentation style.
</output_format>

<negative_constraints>
- DO NOT use pseudocode or incomplete placeholders (e.g. "// TODO: implement later").
- DO NOT summarize or skip implementation steps.
- DO NOT introduce unverified third-party dependencies without explicit justification.
</negative_constraints>`;
}

// UI Utilities
function setLoadingState(isLoading) {
  enhanceBtn.disabled = isLoading;
  const btnText = enhanceBtn.querySelector(".btn-text");
  const btnSpinner = enhanceBtn.querySelector(".btn-spinner");

  if (isLoading) {
    btnText.classList.add("hidden");
    btnSpinner.classList.remove("hidden");
  } else {
    btnText.classList.remove("hidden");
    btnSpinner.classList.add("hidden");
  }
}

function showStatus(msg, type = "info") {
  if (!statusBarEl) return;
  statusBarEl.className = `status-bar ${type}`;
  statusBarEl.innerText = msg;
  statusBarEl.classList.remove("hidden");
}

// History Handling (In-Page View 2)
function saveToHistory(prompt, result) {
  const item = {
    id: Date.now(),
    timestamp: new Date().toLocaleTimeString(),
    prompt,
    result
  };

  historyData.unshift(item);
  if (historyData.length > 30) historyData.pop();
  localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(historyData));
}

function renderInPageHistoryList() {
  if (!historyListEl) return;

  if (historyData.length === 0) {
    historyListEl.innerHTML = `<p class="history-empty">NO LOG HISTORY RECORDED.</p>`;
    return;
  }

  historyListEl.innerHTML = historyData.map(item => `
    <div class="history-card-item" onclick="loadHistoryItem(${item.id})">
      <div class="history-item-header">
        <span>LOG ID: #${item.id}</span>
        <span>TIME: [${escapeHtml(item.timestamp)}]</span>
      </div>
      <div class="history-item-prompt">PROMPT: "${escapeHtml(item.prompt)}"</div>
    </div>
  `).join("");
}

window.loadHistoryItem = function (id) {
  const found = historyData.find(h => h.id === id);
  if (found) {
    // Switch to view 1 prompt engine and render the result
    if (viewTabPrompt) viewTabPrompt.click();
    renderHyperMasterPromptCard(found.result);
    showStatus(`LOADED LOG HISTORY ITEM #${found.id} [${found.timestamp}]`, "info");
  }
};

// Modal Handling
function openModal() {
  settingsModal.classList.add("active");
}

function closeModal() {
  settingsModal.classList.remove("active");
  if (testResultEl) testResultEl.innerHTML = "";
}

async function testWebhookConnection() {
  const url = webhookUrlInput.value.trim();
  if (!url) {
    testResultEl.innerHTML = `<span style="color:#f43f5e;">PLEASE ENTER A VALID URL BEFORE TESTING.</span>`;
    return;
  }

  testResultEl.innerHTML = `<span style="color:#00ffaa;"><i class="fa-solid fa-spinner fa-spin"></i> TESTING CONNECTION...</span>`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "Connection Test", model: "hyper_engine" })
    });

    if (res.ok) {
      testResultEl.innerHTML = `<span style="color:#00ff66;"><i class="fa-solid fa-check"></i> CONNECTION SUCCESSFUL! HTTP ${res.status}</span>`;
    } else {
      testResultEl.innerHTML = `<span style="color:#f43f5e;"><i class="fa-solid fa-xmark"></i> CONNECTION FAILED: HTTP ${res.status}</span>`;
    }
  } catch (e) {
    testResultEl.innerHTML = `<span style="color:#f43f5e;"><i class="fa-solid fa-xmark"></i> ERROR: ${escapeHtml(e.message)}</span>`;
  }
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
