/* ==========================================================================
   DEN-VULKAN PROMPT ARCHITECT - APPLICATION LOGIC (WEBSITE.JSON INTEGRATION)
   ========================================================================== */

const STORAGE_WEBHOOK_KEY = "prompt_enhancer_n8n_webhook";
const DEFAULT_WEBHOOK_URL = "http://localhost:5678/webhook/enhanced-prompt";

// DOM Elements Cache
let enhanceBtn, rawPromptInput, clearPromptBtn, statusBarEl, resultsGridEl;
let webhookSettingsBtn, webhookIndicatorEl, webhookBannerEl, bannerConfigBtn;
let settingsModal, closeModalBtn, webhookUrlInput, testWebhookBtn, saveWebhookBtn, testResultEl;

// Application State
let webhookUrl = localStorage.getItem(STORAGE_WEBHOOK_KEY) || DEFAULT_WEBHOOK_URL;
let lastGeneratedMasterPrompt = "";

// Initialize App
document.addEventListener("DOMContentLoaded", () => {
  cacheDOMElements();
  initWebhookState();
  initEventListeners();
});

function cacheDOMElements() {
  enhanceBtn = document.getElementById("enhance-btn");
  rawPromptInput = document.getElementById("raw-prompt");
  clearPromptBtn = document.getElementById("clear-prompt-btn");
  statusBarEl = document.getElementById("status-bar");
  resultsGridEl = document.getElementById("results-grid");

  webhookSettingsBtn = document.getElementById("webhook-settings-btn");
  webhookIndicatorEl = document.getElementById("webhook-indicator");
  webhookBannerEl = document.getElementById("webhook-banner");
  bannerConfigBtn = document.getElementById("banner-config-btn");

  settingsModal = document.getElementById("settings-modal");
  closeModalBtn = document.getElementById("close-modal-btn");
  webhookUrlInput = document.getElementById("webhook-url-input");
  testWebhookBtn = document.getElementById("test-webhook-btn");
  saveWebhookBtn = document.getElementById("save-webhook-btn");
  testResultEl = document.getElementById("webhook-test-result");
}

/* ==========================================================================
   WEBHOOK STATE & EVENT LISTENERS
   ========================================================================== */
function initWebhookState() {
  if (webhookUrl) {
    if (webhookUrlInput) webhookUrlInput.value = webhookUrl;
    if (webhookIndicatorEl) webhookIndicatorEl.classList.remove("offline");
    if (webhookBannerEl) webhookBannerEl.classList.add("hidden");
  } else {
    if (webhookIndicatorEl) webhookIndicatorEl.classList.add("offline");
    if (webhookBannerEl) webhookBannerEl.classList.remove("hidden");
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
      const url = webhookUrlInput ? webhookUrlInput.value.trim() : "";
      webhookUrl = url;
      localStorage.setItem(STORAGE_WEBHOOK_KEY, url);
      initWebhookState();
      closeModal();
      showStatus("Webhook endpoint saved successfully.", "success");
    });
  }

  if (testWebhookBtn) {
    testWebhookBtn.addEventListener("click", testWebhookConnection);
  }
}

/* ==========================================================================
   PROMPT ENHANCEMENT HANDLER (CATERING TO WEBSITE.JSON N8N WORKFLOW)
   ========================================================================== */
async function handleEnhanceRequest() {
  const promptText = rawPromptInput ? rawPromptInput.value.trim() : "";

  if (!promptText) {
    showStatus("PLEASE ENTER A RAW HUMAN PROMPT BEFORE EXECUTING ENHANCEMENT.", "error");
    return;
  }

  setLoadingState(true);
  showStatus(`CONTACTING N8N HYPER ENGINE PIPELINE...`, "info");

  // Calibrated payload for website.json n8n workflow (Gemini node expects $json.body.message)
  const payload = {
    message: promptText,
    prompt: promptText,
    model: "hyper_engine"
  };

  try {
    let resultText = "";

    if (!webhookUrl) {
      // Fallback demo execution matching website.json framework
      await new Promise(r => setTimeout(r, 450));
      resultText = generateStructuredFrameworkPrompt(promptText);
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
        // Extracts enhanced_prompt returned from n8n Respond to Website node
        resultText = resJson.enhanced_prompt || resJson.output || resJson.text || resJson.content?.parts[0]?.text || rawText;
      } catch (e) {
        resultText = rawText;
      }
    }

    lastGeneratedMasterPrompt = resultText;
    renderMasterPromptCard(resultText);
    showStatus(`PROMPT ENHANCEMENT COMPLETE. MASTER OUTPUT BUFFER UPDATED.`, "success");

  } catch (err) {
    console.warn("n8n Webhook connection failed, using fallback generator:", err);
    showStatus(`WEBHOOK NOTICE: ${err.message}. DEMO OUTPUT GENERATED BELOW.`, "error");
    const demoPrompt = generateStructuredFrameworkPrompt(promptText);
    lastGeneratedMasterPrompt = demoPrompt;
    renderMasterPromptCard(demoPrompt);
  } finally {
    setLoadingState(false);
  }
}

/* ==========================================================================
   MASTER PROMPT CARD RENDERER
   ========================================================================== */
function renderMasterPromptCard(promptText) {
  if (!resultsGridEl) return;
  resultsGridEl.innerHTML = "";

  const wordCount = promptText ? promptText.trim().split(/\s+/).length : 0;
  const charCount = promptText ? promptText.length : 0;

  const card = document.createElement("div");
  card.className = "result-card";
  card.innerHTML = `
    <div class="result-card-header">
      <div class="result-title-group">
        <i class="fa-solid fa-code" style="color: #38bdf8;"></i>
        <span>HYPER ENGINE MASTER PROMPT</span>
        <span class="badge-tag">PRODUCTION-READY</span>
      </div>
      <button class="copy-btn" type="button"><i class="fa-regular fa-copy"></i> <span>COPY PROMPT</span></button>
    </div>

    <div class="prompt-body">
      <pre class="prompt-output">${escapeHtml(promptText)}</pre>
    </div>

    <div class="result-footer-stats">
      <span>METRICS: ${charCount} CHARS | ${wordCount} WORDS</span>
      <span>N8N MODEL: GEMINI 1.5/3.5 FLASH</span>
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
        copyBtn.innerHTML = `<i class="fa-solid fa-check"></i> COPIED!`;
        setTimeout(() => { copyBtn.innerHTML = originalHtml; }, 2000);
      });
    });
  }
}

/* ==========================================================================
   STRUCTURED PROMPT FRAMEWORK GENERATOR (MATCHING WEBSITE.JSON SPECIFICATION)
   ========================================================================== */
function generateStructuredFrameworkPrompt(humanPrompt) {
  return `<role_and_objective>
You are an expert Senior Software Architect, Systems Engineer, and Production Code Specialist.
Your primary objective is to execute the following task with 100% precision: "${humanPrompt}".
Define a clear, specialized expert persona and deliver complete, production-grade output without placeholders.
</role_and_objective>

<context_and_background>
- Target Environment: Enterprise Production System / Cloud Services
- Task Domain: Technical implementation of user request: "${humanPrompt}"
- Target Models: Designed for high-performance execution in ChatGPT-4o, Gemini 1.5/3.5 Flash, Claude 3.5 Sonnet, and Llama 3.3.
</context_and_background>

<step_by_step_instructions>
1. Analyze the core functional requirements and edge cases inherent in the raw human input prompt.
2. Formulate a modular, step-by-step implementation architecture.
3. Implement complete, clean, self-documenting code with explicit type hints and docstrings.
4. Add robust input validation and explicit exception handling for all failure paths.
5. Provide clear verification instructions and unit test guidelines.
</step_by_step_instructions>

<constraints_and_boundaries>
- DO NOT use pseudocode or incomplete placeholders (e.g. "// TODO: implement later").
- DO NOT summarize or truncate implementation logic.
- DO NOT add conversational filler or unnecessary commentary.
- MUST enforce strict typing and explicit exception paths.
</constraints_and_boundaries>

<output_format>
- Format response strictly in clean GitHub-Flavored Markdown.
- Enclose all code within fenced code blocks with language identifiers.
- Structure sections using clear, clean Markdown headings.
</output_format>`;
}

/* ==========================================================================
   UI UTILITIES & MODALS
   ========================================================================== */
function setLoadingState(isLoading) {
  if (!enhanceBtn) return;
  enhanceBtn.disabled = isLoading;
  const btnText = enhanceBtn.querySelector(".btn-text");
  const btnSpinner = enhanceBtn.querySelector(".btn-spinner");

  if (isLoading) {
    if (btnText) btnText.classList.add("hidden");
    if (btnSpinner) btnSpinner.classList.remove("hidden");
  } else {
    if (btnText) btnText.classList.remove("hidden");
    if (btnSpinner) btnSpinner.classList.add("hidden");
  }
}

function showStatus(msg, type = "info") {
  if (!statusBarEl) return;
  statusBarEl.className = `status-bar ${type}`;
  statusBarEl.innerText = msg;
  statusBarEl.classList.remove("hidden");
}

function openModal() {
  if (settingsModal) settingsModal.classList.add("active");
}

function closeModal() {
  if (settingsModal) settingsModal.classList.remove("active");
  if (testResultEl) testResultEl.innerHTML = "";
}

async function testWebhookConnection() {
  const url = webhookUrlInput ? webhookUrlInput.value.trim() : "";
  if (!url) {
    if (testResultEl) testResultEl.innerHTML = `<span style="color:#f43f5e;">PLEASE ENTER A VALID URL BEFORE TESTING.</span>`;
    return;
  }

  if (testResultEl) testResultEl.innerHTML = `<span style="color:#38bdf8;"><i class="fa-solid fa-spinner fa-spin"></i> TESTING CONNECTION...</span>`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Connection Test", prompt: "Connection Test" })
    });

    if (res.ok) {
      if (testResultEl) testResultEl.innerHTML = `<span style="color:#10b981;"><i class="fa-solid fa-check"></i> CONNECTION SUCCESSFUL! HTTP ${res.status}</span>`;
    } else {
      if (testResultEl) testResultEl.innerHTML = `<span style="color:#f43f5e;"><i class="fa-solid fa-xmark"></i> CONNECTION FAILED: HTTP ${res.status}</span>`;
    }
  } catch (e) {
    if (testResultEl) testResultEl.innerHTML = `<span style="color:#f43f5e;"><i class="fa-solid fa-xmark"></i> ERROR: ${escapeHtml(e.message)}</span>`;
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
