// LocalStorage Keys
const STORAGE_WEBHOOK_KEY = "prompt_studio_webhook_url";
const STORAGE_HISTORY_KEY = "prompt_studio_history";
const DEFAULT_WEBHOOK_URL = "https://caravan-tidbit-flyover.ngrok-free.dev/webhook/enhanced-prompt";

// DOM Elements
const rawPromptEl = document.getElementById("raw-prompt");
const charCountEl = document.getElementById("char-count");
const clearPromptBtn = document.getElementById("clear-prompt-btn");
const enhanceBtn = document.getElementById("enhance-btn");
const statusBarEl = document.getElementById("status-bar");
const resultsGridEl = document.getElementById("results-grid");
const presetChips = document.querySelectorAll(".chip");
const activeModelTagEl = document.getElementById("active-model-tag");
const modelSelectEl = document.getElementById("model-select");

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

// History Drawer Elements
const toggleHistoryBtn = document.getElementById("toggle-history-btn");
const closeHistoryBtn = document.getElementById("close-history-btn");
const historyDrawer = document.getElementById("history-drawer");
const drawerOverlay = document.getElementById("drawer-overlay");
const historyListEl = document.getElementById("history-list");
const clearHistoryBtn = document.getElementById("clear-history-btn");

// App State
let webhookUrl = localStorage.getItem(STORAGE_WEBHOOK_KEY) || DEFAULT_WEBHOOK_URL;
let historyData = JSON.parse(localStorage.getItem(STORAGE_HISTORY_KEY) || "[]");

// Initialize App
document.addEventListener("DOMContentLoaded", () => {
  initWebhookState();
  initEventListeners();
  initPillSelectors();
  updateCharCount();
  updateActiveModelTag(modelSelectEl.value);
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

function initPillSelectors() {
  // Handle active states for radio pill groups (Target Style)
  document.querySelectorAll('.pill-option input[type="radio"]').forEach((radio) => {
    radio.addEventListener("change", (e) => {
      const name = e.target.name;
      document.querySelectorAll(`input[name="${name}"]`).forEach((r) => {
        r.closest(".pill-option").classList.remove("active");
      });
      e.target.closest(".pill-option").classList.add("active");
    });
  });
}

function initEventListeners() {
  // Dropdown Change Listener
  modelSelectEl.addEventListener("change", () => {
    updateActiveModelTag(modelSelectEl.value);
  });

  // Input listeners
  rawPromptEl.addEventListener("input", updateCharCount);
  clearPromptBtn.addEventListener("click", () => {
    rawPromptEl.value = "";
    updateCharCount();
    rawPromptEl.focus();
  });

  // Preset Chips
  presetChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      rawPromptEl.value = chip.getAttribute("data-prompt");
      updateCharCount();
      rawPromptEl.focus();
    });
  });

  // Enhance Button
  enhanceBtn.addEventListener("click", enhancePrompt);

  // Modal Listeners
  webhookSettingsBtn.addEventListener("click", openModal);
  bannerConfigBtn.addEventListener("click", openModal);
  closeModalBtn.addEventListener("click", closeModal);
  saveWebhookBtn.addEventListener("click", saveWebhookUrl);
  testWebhookBtn.addEventListener("click", testWebhookConnection);

  // History Drawer Listeners
  toggleHistoryBtn.addEventListener("click", openHistoryDrawer);
  closeHistoryBtn.addEventListener("click", closeHistoryDrawer);
  drawerOverlay.addEventListener("click", closeHistoryDrawer);
  clearHistoryBtn.addEventListener("click", clearHistory);
}

function updateCharCount() {
  const len = rawPromptEl.value.length;
  charCountEl.textContent = `${len} / 2000 chars`;
}

// Main Prompt Enhancement Handler
async function enhancePrompt() {
  const rawPrompt = rawPromptEl.value.trim();
  const selectedStyle = document.querySelector('input[name="prompt-style"]:checked')?.value || "detailed";
  const selectedModel = modelSelectEl.value || "gemini";

  if (!rawPrompt) {
    showStatus("Please enter a raw prompt idea first.", "error");
    return;
  }

  updateActiveModelTag(selectedModel);
  setLoadingState(true);
  showStatus(`Connecting to n8n backend... Executing request using model: ${selectedModel.toUpperCase()}...`, "info");

  // Show loading skeleton in results grid
  renderLoadingSkeletons(selectedModel);

  try {
    let variations = [];

    if (webhookUrl) {
      // Live n8n Webhook Request
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "69420"
        },
        body: JSON.stringify({
          raw_prompt: rawPrompt,
          style: selectedStyle,
          selected_model: selectedModel
        }),
      });

      const responseText = await response.text();

      if (!responseText || !responseText.trim()) {
        throw new Error(
          "n8n returned an empty (0-byte) response. Check your n8n Executions tab — an upstream node likely failed before reaching the Respond node."
        );
      }

      if (!response.ok) {
        throw new Error(`n8n Webhook responded with status ${response.status}: ${responseText.substring(0, 150)}`);
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`Invalid JSON returned from n8n: ${responseText.substring(0, 150)}`);
      }

      variations = Array.isArray(data.variations) ? data.variations : (data.results || []);
      
      if (variations.length === 0 && data.prompt) {
        variations = [{ label: getModelLabel(selectedModel), prompt: data.prompt }];
      }
    } else {
      // Demo / Fallback Mode
      await new Promise(resolve => setTimeout(resolve, 1000));
      variations = generateDemoVariations(rawPrompt, selectedStyle, selectedModel);
      showStatus("Generated using Demo Mode. Connect your n8n Webhook URL for live OpenRouter responses.", "info");
    }

    if (variations.length === 0) {
      throw new Error("No enhanced prompts returned from workflow.");
    }

    renderResults(variations);
    if (webhookUrl) {
      showStatus("Successfully enhanced prompt!", "success");
    }
    saveToHistory(rawPrompt, variations);

  } catch (err) {
    console.error("Enhance Prompt Error:", err);
    showStatus(`${err.message}`, "error");
    renderErrorState(err.message);
  } finally {
    setLoadingState(false);
  }
}

function updateActiveModelTag(model) {
  if (model === "gpt") {
    activeModelTagEl.innerHTML = `<i class="fa-solid fa-robot"></i> Model: OpenAI GPT-4o Mini`;
  } else {
    activeModelTagEl.innerHTML = `<i class="fa-brands fa-google"></i> Model: Google Gemini 3.6 Flash`;
  }
}

function getModelLabel(modelKey) {
  if (modelKey === "gpt") return "OpenAI GPT-4o Mini (free)";
  return "Google Gemini 3.6 Flash";
}

// Render Results Grid
function renderResults(variations) {
  resultsGridEl.innerHTML = "";

  variations.forEach((v, index) => {
    const label = v.label || (index === 0 ? "Google Gemini 3.6 Flash" : "OpenAI GPT-4o Mini (free)");
    const text = v.prompt || v.text || "";
    const lowerLabel = label.toLowerCase();
    
    let cardClass = "card-gemini";
    let iconClass = "fa-google";
    let iconColor = "#4285f4";

    if (lowerLabel.includes("gpt") || lowerLabel.includes("openai")) {
      cardClass = "card-gpt";
      iconClass = "fa-robot";
      iconColor = "#10a37f";
    }

    const card = document.createElement("div");
    card.className = `result-card ${cardClass}`;
    card.innerHTML = `
      <div class="result-header">
        <div class="model-name">
          <i class="${iconClass === 'fa-google' ? 'fa-brands' : 'fa-solid'} ${iconClass}" style="color: ${iconColor}"></i>
          <span>${escapeHtml(label)}</span>
        </div>
        <div class="result-actions">
          <button class="copy-btn" type="button">
            <i class="fa-regular fa-copy"></i> <span>Copy</span>
          </button>
        </div>
      </div>
      <pre class="prompt-output">${escapeHtml(text)}</pre>
      <div class="result-footer">
        <span><i class="fa-solid fa-align-left"></i> ${getWordCount(text)} words | ${text.length} chars</span>
        <span>Ready for AI Models</span>
      </div>
    `;

    // Copy Handler
    const copyBtn = card.querySelector(".copy-btn");
    copyBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(text).then(() => {
        copyBtn.classList.add("copied");
        copyBtn.innerHTML = `<i class="fa-solid fa-check"></i> <span>Copied!</span>`;
        setTimeout(() => {
          copyBtn.classList.remove("copied");
          copyBtn.innerHTML = `<i class="fa-regular fa-copy"></i> <span>Copy</span>`;
        }, 2000);
      });
    });

    resultsGridEl.appendChild(card);
  });
}

function renderLoadingSkeletons(selectedModel) {
  if (selectedModel === "gpt") {
    resultsGridEl.innerHTML = `
      <div class="result-card card-gpt">
        <div class="result-header">
          <div class="model-name"><i class="fa-solid fa-circle-notch fa-spin"></i> OpenAI GPT-4o Mini generating...</div>
        </div>
        <div class="prompt-output" style="opacity: 0.6;">Generating system & persona instruction prompt variation...</div>
      </div>
    `;
  } else {
    resultsGridEl.innerHTML = `
      <div class="result-card card-gemini">
        <div class="result-header">
          <div class="model-name"><i class="fa-solid fa-circle-notch fa-spin"></i> Google Gemini 3.6 Flash generating...</div>
        </div>
        <div class="prompt-output" style="opacity: 0.6;">Generating structured & multimodal-ready prompt variation...</div>
      </div>
    `;
  }
}

function renderErrorState(errorMsg) {
  resultsGridEl.innerHTML = `
    <div class="empty-state card">
      <div class="empty-icon" style="color: #f43f5e; background: rgba(244, 63, 94, 0.1);"><i class="fa-solid fa-triangle-exclamation"></i></div>
      <h3>Failed to Retrieve Variations</h3>
      <p>${escapeHtml(errorMsg)}</p>
      <div style="margin-top: 1rem; text-align: left; background: rgba(10, 15, 26, 0.6); padding: 1rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); font-size: 0.82rem; color: #9ca3af;">
        <strong style="color: #f3f4f6;">💡 Quick Troubleshooting Checklist:</strong>
        <ol style="margin-left: 1.25rem; margin-top: 0.5rem; display: flex; flex-direction: column; gap: 0.35rem;">
          <li><strong>Open n8n Executions tab</strong>: Check if an OpenRouter node turned red (e.g. OpenRouter API Key missing).</li>
          <li><strong>Check Webhook Endpoint</strong>: Using <code>https://caravan-tidbit-flyover.ngrok-free.dev/webhook/enhanced-prompt</code>.</li>
          <li><strong>ngrok Warning Header</strong>: Added <code>ngrok-skip-browser-warning</code> header automatically.</li>
        </ol>
      </div>
    </div>
  `;
}

// Fallback Demo Response Generator
function generateDemoVariations(promptText, style, model) {
  const gemini = {
    label: "Google Gemini 3.6 Flash",
    prompt: `<context>\nYou are a domain expert assistant optimized for Google Gemini models.\n</context>\n\n<task>\nObjective: "${promptText}"\n</task>\n\n<instructions>\n1. Provide a comprehensive, structured response formatted in clean markdown.\n2. Address potential edge cases and explain step-by-step reasoning clearly.\n3. Calibrated style: ${style.toUpperCase()}.\n</instructions>`
  };

  const gpt = {
    label: "OpenAI GPT-4o Mini (free)",
    prompt: `[SYSTEM ROLE: Senior AI Prompt Specialist]\n\nTASK OVERVIEW:\n"${promptText}"\n\nEXECUTION DIRECTIVES:\n- Deliver an actionable, well-structured, production-ready solution.\n- Use XML/markdown blocks for distinct sections.\n- Style preset: ${style.toUpperCase()}.\n\nCONSTRAINTS:\n- Maintain high precision and eliminate fluff.`
  };

  if (model === "gpt") return [gpt];
  return [gemini];
}

// UI State & Utilities
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

function showStatus(msg, type) {
  statusBarEl.className = `status-bar ${type}`;
  statusBarEl.innerHTML = `<i class="fa-solid ${type === 'error' ? 'fa-circle-exclamation' : type === 'success' ? 'fa-circle-check' : 'fa-circle-info'}"></i> <span>${escapeHtml(msg)}</span>`;
  statusBarEl.classList.remove("hidden");
}

function getWordCount(str) {
  return str.trim().split(/\s+/).filter(Boolean).length;
}

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

// Modal Handlers
function openModal() {
  webhookUrlInput.value = webhookUrl;
  testResultEl.className = "test-result";
  testResultEl.textContent = "";
  settingsModal.classList.add("active");
}

function closeModal() {
  settingsModal.classList.remove("active");
}

function saveWebhookUrl() {
  const url = webhookUrlInput.value.trim();
  webhookUrl = url || DEFAULT_WEBHOOK_URL;
  if (url) {
    localStorage.setItem(STORAGE_WEBHOOK_KEY, url);
    showStatus("n8n Webhook URL saved successfully!", "success");
  } else {
    localStorage.removeItem(STORAGE_WEBHOOK_KEY);
    showStatus("Reset to default ngrok Webhook URL.", "info");
  }
  initWebhookState();
  closeModal();
}

async function testWebhookConnection() {
  const url = webhookUrlInput.value.trim();
  if (!url) {
    testResultEl.className = "test-result error";
    testResultEl.textContent = "Please enter a valid URL first.";
    return;
  }

  testResultEl.className = "test-result";
  testResultEl.textContent = "Testing connection to n8n webhook...";

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "69420"
      },
      body: JSON.stringify({ raw_prompt: "ping_test", style: "detailed", selected_model: "gemini" }),
    });

    if (response.ok) {
      testResultEl.className = "test-result success";
      testResultEl.textContent = "✓ Webhook connection successful! Status 200 OK.";
    } else {
      testResultEl.className = "test-result error";
      testResultEl.textContent = `✗ Received status ${response.status} from server. Ensure your n8n workflow is ACTIVE.`;
    }
  } catch (err) {
    testResultEl.className = "test-result error";
    testResultEl.textContent = `✗ Connection failed: ${err.message}. Check CORS settings in n8n Webhook node.`;
  }
}

// History Drawer Handlers
function openHistoryDrawer() {
  renderHistory();
  historyDrawer.classList.add("open");
  drawerOverlay.classList.add("active");
}

function closeHistoryDrawer() {
  historyDrawer.classList.remove("open");
  drawerOverlay.classList.remove("active");
}

function saveToHistory(rawPrompt, variations) {
  const item = {
    id: Date.now(),
    timestamp: new Date().toLocaleString(),
    rawPrompt: rawPrompt,
    variations: variations
  };
  historyData.unshift(item);
  if (historyData.length > 20) historyData.pop(); // keep last 20
  localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(historyData));
}

function renderHistory() {
  if (historyData.length === 0) {
    historyListEl.innerHTML = `<p class="history-empty">No prompt history saved yet.</p>`;
    return;
  }

  historyListEl.innerHTML = "";
  historyData.forEach((item) => {
    const div = document.createElement("div");
    div.className = "history-item";
    div.innerHTML = `
      <div class="history-item-raw">${escapeHtml(item.rawPrompt)}</div>
      <div class="history-item-time"><i class="fa-regular fa-clock"></i> ${item.timestamp} (${item.variations.length} variations)</div>
    `;
    div.addEventListener("click", () => {
      rawPromptEl.value = item.rawPrompt;
      updateCharCount();
      renderResults(item.variations);
      closeHistoryDrawer();
      showStatus("Restored prompt from history.", "info");
    });
    historyListEl.appendChild(div);
  });
}

function clearHistory() {
  historyData = [];
  localStorage.removeItem(STORAGE_HISTORY_KEY);
  renderHistory();
}
