/* ==========================================================================
   DEN-VULKAN PROMPT ARCHITECT - HIGH-PERFORMANCE APPLICATION LOGIC
   ========================================================================== */

const STORAGE_WEBHOOK_KEY = "prompt_enhancer_n8n_webhook";
const DEFAULT_WEBHOOK_URL = "http://localhost:5678/webhook/enhance-promp";

// DOM Elements Cache
let enhanceBtn, rawPromptInput, clearPromptBtn, statusBarEl, resultsGridEl;
let copyPromptBtn, downloadPromptBtn;
let metricCharsEl, metricWordsEl, metricTokensEl;
let webhookSettingsBtn, webhookIndicatorEl, webhookBannerEl, bannerConfigBtn;
let settingsModal, closeModalBtn, webhookUrlInput, testWebhookBtn, saveWebhookBtn, testResultEl;

// Application State
let webhookUrl = localStorage.getItem(STORAGE_WEBHOOK_KEY) || DEFAULT_WEBHOOK_URL;
let activeMode = "xml_master"; // xml_master | system_role | few_shot
let lastGeneratedMasterPrompt = "";
let metricsRafId = null;

// Initialize App
document.addEventListener("DOMContentLoaded", () => {
  cacheDOMElements();
  initWebhookState();
  initEventListeners();
  initPresetChips();
  initModePills();
});

function cacheDOMElements() {
  enhanceBtn = document.getElementById("enhance-btn");
  rawPromptInput = document.getElementById("raw-prompt");
  clearPromptBtn = document.getElementById("clear-prompt-btn");
  statusBarEl = document.getElementById("status-bar");
  resultsGridEl = document.getElementById("results-grid");
  copyPromptBtn = document.getElementById("copy-prompt-btn");
  downloadPromptBtn = document.getElementById("download-prompt-btn");

  metricCharsEl = document.getElementById("metric-chars");
  metricWordsEl = document.getElementById("metric-words");
  metricTokensEl = document.getElementById("metric-tokens");

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
      updateMetricsDebounced();
    });
  }

  if (enhanceBtn) {
    enhanceBtn.addEventListener("click", handleEnhanceRequest);
  }

  if (copyPromptBtn) {
    copyPromptBtn.addEventListener("click", copyMasterPromptToClipboard);
  }

  if (downloadPromptBtn) {
    downloadPromptBtn.addEventListener("click", downloadMasterPromptFile);
  }

  if (rawPromptInput) {
    rawPromptInput.addEventListener("input", updateMetricsDebounced);
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
   PRESET CHIPS & ARCHITECTURE MODES
   ========================================================================== */
function initPresetChips() {
  const chips = document.querySelectorAll(".preset-chip");
  chips.forEach(chip => {
    chip.addEventListener("click", () => {
      const promptText = chip.getAttribute("data-prompt");
      if (promptText && rawPromptInput) {
        rawPromptInput.value = promptText;
        updateMetricsDebounced();
        showStatus(`Loaded template: "${chip.innerText}"`, "info");
      }
    });
  });
}

function initModePills() {
  const pills = document.querySelectorAll(".mode-pill");
  pills.forEach(pill => {
    pill.addEventListener("click", () => {
      pills.forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      activeMode = pill.getAttribute("data-mode") || "xml_master";
      showStatus(`Architecture mode switched to: ${pill.innerText}`, "info");
    });
  });
}

/* ==========================================================================
   DEBOUNCED LIVE METRICS CALCULATOR (120 FPS SMOOTH)
   ========================================================================== */
function updateMetricsDebounced() {
  if (metricsRafId) cancelAnimationFrame(metricsRafId);
  metricsRafId = requestAnimationFrame(() => {
    const text = rawPromptInput ? rawPromptInput.value : "";
    const chars = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const estTokens = Math.ceil(chars / 4);

    if (metricCharsEl) metricCharsEl.innerText = `${chars} Chars`;
    if (metricWordsEl) metricWordsEl.innerText = `${words} Words`;
    if (metricTokensEl) metricTokensEl.innerText = `~${estTokens} Est. Tokens`;
  });
}

/* ==========================================================================
   PROMPT ENHANCEMENT HANDLER
   ========================================================================== */
async function handleEnhanceRequest() {
  const promptText = rawPromptInput ? rawPromptInput.value.trim() : "";

  if (!promptText) {
    showStatus("PLEASE ENTER A RAW HUMAN PROMPT BEFORE EXECUTING ENHANCEMENT.", "error");
    return;
  }

  setLoadingState(true);
  showStatus(`SYNTHESIZING PROMPT VIA DEN-VULKAN HYPER ENGINE...`, "info");

  const payload = {
    prompt: promptText,
    model: "hyper_engine",
    mode: activeMode,
    subject_ref: promptText
  };

  try {
    let resultText = "";

    if (!webhookUrl) {
      // Fallback demo execution tailored to selected mode
      await new Promise(r => setTimeout(r, 450));
      resultText = generateModeTailoredPrompt(promptText, activeMode);
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

    lastGeneratedMasterPrompt = resultText;
    renderMasterPromptCard(resultText);
    showStatus(`PROMPT ENHANCEMENT COMPLETE. MASTER OUTPUT BUFFER UPDATED.`, "success");

  } catch (err) {
    console.warn("n8n Webhook connection failed, using fallback generator:", err);
    showStatus(`WEBHOOK NOTICE: ${err.message}. DEMO OUTPUT GENERATED BELOW.`, "error");
    const demoPrompt = generateModeTailoredPrompt(promptText, activeMode);
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
  const modeLabel = activeMode === "xml_master" ? "MASTER XML" : activeMode === "system_role" ? "SYSTEM ROLE" : "FEW-SHOT PROTOCOL";

  const card = document.createElement("div");
  card.className = "result-card";
  card.innerHTML = `
    <div class="result-card-header">
      <div class="result-title-group">
        <i class="fa-solid fa-bolt" style="color: #00f2fe;"></i>
        <span>DEN-VULKAN MASTER PROMPT</span>
        <span class="badge-mode">${modeLabel}</span>
      </div>
    </div>

    <div class="prompt-body">
      <pre class="prompt-output">${escapeHtml(promptText)}</pre>
    </div>

    <div class="result-footer-stats">
      <span>METRICS: ${charCount} CHARS | ${wordCount} WORDS</span>
      <span>COMPATIBLE WITH ALL LLMS</span>
    </div>
  `;

  resultsGridEl.appendChild(card);

  // Enable copy and download buttons
  if (copyPromptBtn) copyPromptBtn.disabled = false;
  if (downloadPromptBtn) downloadPromptBtn.disabled = false;
}

function copyMasterPromptToClipboard() {
  if (!lastGeneratedMasterPrompt) return;

  navigator.clipboard.writeText(lastGeneratedMasterPrompt).then(() => {
    const originalHtml = copyPromptBtn.innerHTML;
    copyPromptBtn.innerHTML = `<i class="fa-solid fa-check"></i> COPIED!`;
    setTimeout(() => { copyPromptBtn.innerHTML = originalHtml; }, 2000);
  });
}

function downloadMasterPromptFile() {
  if (!lastGeneratedMasterPrompt) return;

  const blob = new Blob([lastGeneratedMasterPrompt], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `DEN-VULKAN-MASTER-PROMPT-${Date.now()}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ==========================================================================
   MODE TAILORED DEMO PROMPT GENERATOR
   ========================================================================== */
function generateModeTailoredPrompt(humanPrompt, mode) {
  if (mode === "system_role") {
    return `SYSTEM INSTRUCTIONS:
You are an expert Production Systems Engineer & Senior Solution Architect.

PRIMARY ROLE & RESPONSIBILITIES:
- Execute task: "${humanPrompt}" with 100% precision.
- Enforce strict typing, zero placeholder logic, and comprehensive exception handling.
- Structure code modules cleanly with explicit inline documentation.

EXECUTION PROTOCOL:
1. Analyze objective requirements and potential failure modes.
2. Produce production-ready implementation without omitting any logic.
3. Validate performance and compatibility.`;
  }

  if (mode === "few_shot") {
    return `# TASK: ${humanPrompt}

## EXAMPLES:
[Example Input 1]: Automated web scraper request
[Example Output 1]: Modular Python script using Playwright + BeautifulSoup with retry decorators.

[Example Input 2]: Data transformation pipeline
[Example Output 2]: Strict BigQuery SQL CTE query with window metrics.

## YOUR TASK:
Provide a complete, production-ready solution for "${humanPrompt}" adhering strictly to the architectural standards shown above.`;
  }

  // Default: Master XML Structure
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
- Target LLMs: Designed for optimal execution in ChatGPT-4o, Gemini 1.5 Pro, Claude 3.5 Sonnet, DeepSeek V3, and Llama 3.3.
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

  if (testResultEl) testResultEl.innerHTML = `<span style="color:#00f2fe;"><i class="fa-solid fa-spinner fa-spin"></i> TESTING CONNECTION...</span>`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "Connection Test", model: "hyper_engine" })
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
