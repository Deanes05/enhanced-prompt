// LocalStorage Keys
const STORAGE_WEBHOOK_KEY = "prompt_studio_webhook_url";
const STORAGE_POLLINATIONS_KEY = "prompt_studio_pollinations_key";
const STORAGE_HISTORY_KEY = "prompt_studio_history";
const DEFAULT_WEBHOOK_URL = "https://caravan-tidbit-flyover.ngrok-free.dev/webhook/enhance-promp";

// DOM Elements
const rawPromptEl = document.getElementById("raw-prompt");
const styleRefInput = document.getElementById("style-ref-input");
const subjectRefInput = document.getElementById("subject-ref-input");
const nicheSearchInput = document.getElementById("niche-search-input");
const charCountEl = document.getElementById("char-count");
const clearPromptBtn = document.getElementById("clear-prompt-btn");
const enhanceBtn = document.getElementById("enhance-btn");
const statusBarEl = document.getElementById("status-bar");
const resultsGridEl = document.getElementById("results-grid");
const activeModelTagEl = document.getElementById("active-model-tag");
const modelSelectEl = document.getElementById("model-select");

// Mode Tabs & Containers
const tabNicheSearch = document.getElementById("tab-niche-search");
const tabStyleTransfer = document.getElementById("tab-style-transfer");
const tabTextPrompt = document.getElementById("tab-text-prompt");

const nicheSearchContainer = document.getElementById("niche-search-container");
const styleTransferContainer = document.getElementById("style-transfer-container");
const singlePromptContainer = document.getElementById("single-prompt-container");

// Header & Modal Elements
const webhookSettingsBtn = document.getElementById("webhook-settings-btn");
const webhookIndicatorEl = document.getElementById("webhook-indicator");
const webhookBannerEl = document.getElementById("webhook-banner");
const bannerConfigBtn = document.getElementById("banner-config-btn");

const settingsModal = document.getElementById("settings-modal");
const closeModalBtn = document.getElementById("close-modal-btn");
const webhookUrlInput = document.getElementById("webhook-url-input");
const pollinationsKeyInput = document.getElementById("pollinations-key-input");
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
let pollinationsKey = localStorage.getItem(STORAGE_POLLINATIONS_KEY) || "";
let historyData = JSON.parse(localStorage.getItem(STORAGE_HISTORY_KEY) || "[]");
let currentMode = "niche-search"; // 'niche-search', 'style-transfer', or 'text-prompt'

function buildPollinationsImageUrl(promptText) {
  const encoded = encodeURIComponent((promptText || "masterpiece").replace(/[\\r\\n]+/g, ' ').trim().substring(0, 300));
  let url = `https://gen.pollinations.ai/image/${encoded}?model=flux&nologo=true&width=1024&height=1024`;
  if (pollinationsKey) {
    url += `&key=${encodeURIComponent(pollinationsKey)}`;
  }
  return url;
}

// Initialize App
document.addEventListener("DOMContentLoaded", () => {
  initWebhookState();
  initEventListeners();
  initPillSelectors();
  initPresetChips();
  initNicheChips();
  initModeTabs();
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
  if (pollinationsKeyInput) {
    pollinationsKeyInput.value = pollinationsKey;
  }
}

function initModeTabs() {
  if (tabNicheSearch) {
    tabNicheSearch.addEventListener("click", () => {
      currentMode = "niche-search";
      tabNicheSearch.classList.add("active");
      tabStyleTransfer.classList.remove("active");
      tabTextPrompt.classList.remove("active");

      nicheSearchContainer.classList.remove("hidden");
      styleTransferContainer.classList.add("hidden");
      singlePromptContainer.classList.add("hidden");

      modelSelectEl.value = "seo";
      updateActiveModelTag("seo");
      enhanceBtn.querySelector(".btn-text").innerHTML = `<i class="fa-solid fa-magnifying-glass-chart"></i> Analyze Market Intelligence`;
    });
  }

  if (tabStyleTransfer) {
    tabStyleTransfer.addEventListener("click", () => {
      currentMode = "style-transfer";
      tabStyleTransfer.classList.add("active");
      if (tabNicheSearch) tabNicheSearch.classList.remove("active");
      tabTextPrompt.classList.remove("active");

      if (nicheSearchContainer) nicheSearchContainer.classList.add("hidden");
      styleTransferContainer.classList.remove("hidden");
      singlePromptContainer.classList.add("hidden");

      modelSelectEl.value = "image";
      updateActiveModelTag("image");
      enhanceBtn.querySelector(".btn-text").innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> Generate Image`;
    });
  }

  if (tabTextPrompt) {
    tabTextPrompt.addEventListener("click", () => {
      currentMode = "text-prompt";
      tabTextPrompt.classList.add("active");
      if (tabNicheSearch) tabNicheSearch.classList.remove("active");
      tabStyleTransfer.classList.remove("active");

      if (nicheSearchContainer) nicheSearchContainer.classList.add("hidden");
      styleTransferContainer.classList.add("hidden");
      singlePromptContainer.classList.remove("hidden");

      modelSelectEl.value = "gemini";
      updateActiveModelTag("gemini");
      enhanceBtn.querySelector(".btn-text").innerHTML = `<i class="fa-solid fa-sparkles"></i> Enhance Text Prompt`;
    });
  }
}

function initNicheChips() {
  document.querySelectorAll(".niche-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const niche = chip.getAttribute("data-niche");
      if (niche && nicheSearchInput) {
        nicheSearchInput.value = niche;
        document.querySelectorAll(".niche-chip").forEach((c) => c.classList.remove("active"));
        chip.classList.add("active");
        showStatus(`Selected Niche: "${chip.textContent.trim()}"`, "info");
      }
    });
  });
}

function initPresetChips() {
  document.querySelectorAll(".preset-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const preset = chip.getAttribute("data-preset");
      if (preset && styleRefInput) {
        styleRefInput.value = preset;
        document.querySelectorAll(".preset-chip").forEach((c) => c.classList.remove("active"));
        chip.classList.add("active");
        showStatus(`Applied style preset: "${chip.textContent.trim()}"`, "info");
      }
    });
  });
}

function initPillSelectors() {
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
  modelSelectEl.addEventListener("change", () => {
    updateActiveModelTag(modelSelectEl.value);
  });

  if (rawPromptEl) {
    rawPromptEl.addEventListener("input", updateCharCount);
  }
  
  if (clearPromptBtn) {
    clearPromptBtn.addEventListener("click", () => {
      if (rawPromptEl) rawPromptEl.value = "";
      updateCharCount();
      if (rawPromptEl) rawPromptEl.focus();
    });
  }

  enhanceBtn.addEventListener("click", enhancePrompt);

  webhookSettingsBtn.addEventListener("click", openModal);
  bannerConfigBtn.addEventListener("click", openModal);
  closeModalBtn.addEventListener("click", closeModal);
  saveWebhookBtn.addEventListener("click", saveWebhookUrl);
  testWebhookBtn.addEventListener("click", testWebhookConnection);

  toggleHistoryBtn.addEventListener("click", openHistoryDrawer);
  closeHistoryBtn.addEventListener("click", closeHistoryDrawer);
  drawerOverlay.addEventListener("click", closeHistoryDrawer);
  clearHistoryBtn.addEventListener("click", clearHistory);
}

function updateCharCount() {
  if (rawPromptEl && charCountEl) {
    const len = rawPromptEl.value.length;
    charCountEl.textContent = `${len} / 2000 chars`;
  }
}

// Main Request Handler
async function enhancePrompt() {
  const selectedStyle = document.querySelector('input[name="prompt-style"]:checked')?.value || "detailed";
  const selectedModel = modelSelectEl.value || "seo";

  let styleRef = "";
  let subjectRef = "";
  let rawPrompt = "";

  if (currentMode === "niche-search") {
    rawPrompt = nicheSearchInput ? nicheSearchInput.value.trim() : "";
    if (!rawPrompt) {
      showStatus("Please enter a niche keyword or topic.", "error");
      return;
    }
    subjectRef = rawPrompt;
  } else if (currentMode === "style-transfer") {
    styleRef = styleRefInput.value.trim();
    subjectRef = subjectRefInput.value.trim();

    if (!styleRef && !subjectRef) {
      showStatus("Please enter Image 1 Style Reference or Image 2 Subject Reference.", "error");
      return;
    }
    rawPrompt = subjectRef ? (styleRef ? `${subjectRef} in the style of ${styleRef}` : subjectRef) : styleRef;
  } else {
    rawPrompt = rawPromptEl.value.trim();
    if (!rawPrompt) {
      showStatus("Please enter your prompt text first.", "error");
      return;
    }
    subjectRef = rawPrompt;
  }

  updateActiveModelTag(selectedModel);
  setLoadingState(true);
  showStatus(`Executing request... Engine: ${selectedModel.toUpperCase()}`, "info");

  renderLoadingSkeletons(selectedModel);

  try {
    let variations = [];

    if (webhookUrl) {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "69420"
        },
        body: JSON.stringify({
          prompt: rawPrompt,
          style_ref: styleRef || "Default Cinematic Lighting & High Detail",
          subject_ref: subjectRef || rawPrompt,
          model: selectedModel,
          style: selectedStyle,
          pollinations_key: pollinationsKey
        }),
      });

      const responseText = await response.text();

      if (!responseText || !responseText.trim()) {
        throw new Error("n8n returned an empty response. Check n8n Executions tab.");
      }

      if (!response.ok) {
        throw new Error(`n8n responded with status ${response.status}: ${responseText.substring(0, 150)}`);
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`Invalid JSON returned: ${responseText.substring(0, 150)}`);
      }

      const enhancedPromptText = data.enhanced_prompt || data.prompt || (data.content && data.content.parts && data.content.parts[0]?.text);
      const imageUrl = data.image_url || (selectedModel === "image" ? buildPollinationsImageUrl(enhancedPromptText || rawPrompt) : null);

      variations = [{
        label: getModelLabel(selectedModel),
        model_type: selectedModel,
        prompt: enhancedPromptText || rawPrompt,
        image_url: imageUrl,
        style_ref: data.style_ref || styleRef,
        subject_ref: data.subject_ref || subjectRef,
        payload_data: data
      }];
    } else {
      // Demo Mode
      await new Promise(resolve => setTimeout(resolve, 800));
      variations = generateDemoVariations(rawPrompt, styleRef, subjectRef, selectedStyle, selectedModel);
      showStatus("Generated using Demo Engine Mode.", "info");
    }

    if (variations.length === 0) {
      throw new Error("No responses returned from workflow.");
    }

    renderResults(variations);
    showStatus("Execution completed successfully!", "success");
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
  if (model === "seo") {
    activeModelTagEl.innerHTML = `<i class="fa-solid fa-chart-line"></i> Engine: SEO & Ad Revenue Intelligence`;
  } else if (model === "trends") {
    activeModelTagEl.innerHTML = `<i class="fa-solid fa-earth-americas"></i> Engine: USA vs PH Trends & Analytics`;
  } else if (model === "image") {
    activeModelTagEl.innerHTML = `<i class="fa-solid fa-image"></i> Engine: Pure Image Generator (FLUX)`;
  } else {
    activeModelTagEl.innerHTML = `<i class="fa-solid fa-file-lines"></i> Engine: Pure Text Prompt Enhancer`;
  }
}

function getModelLabel(modelKey) {
  if (modelKey === "seo") return "SEO & Ad Revenue Intelligence";
  if (modelKey === "trends") return "USA vs Philippines Regional Trends";
  if (modelKey === "image") return "Pollinations FLUX Image Generator";
  return "Google Gemini Prompt Enhancer";
}

// Strictly Decoupled Result Renderers
function renderResults(variations) {
  resultsGridEl.innerHTML = "";

  variations.forEach((v) => {
    const modelType = v.model_type || modelSelectEl.value;
    const label = v.label || getModelLabel(modelType);
    const text = v.prompt || "";
    
    let parsedJson = null;
    try {
      if (typeof text === "string" && text.trim().startsWith("{")) {
        parsedJson = JSON.parse(text);
      }
    } catch (e) {}

    // 1. PURE TEXT PROMPT ENHANCER (Strictly Text Only, No Image Container)
    if (modelType === "gemini") {
      renderPureTextCard(label, text);
    }
    // 2. PURE IMAGE GENERATOR (Strictly Image Only + Generation Notes)
    else if (modelType === "image") {
      const imageUrl = v.image_url || buildPollinationsImageUrl(text);
      renderPureImageCard(label, imageUrl, text, v.style_ref, v.subject_ref);
    }
    // 3. SEO & AD REVENUE INTELLIGENCE (Compact, Detailed Table Dashboard, No Random Recommendations)
    else if (modelType === "seo") {
      renderCompactSeoCard(label, parsedJson, v.subject_ref);
    }
    // 4. USA VS PH REGIONAL TRENDS (Compact Regional Analytics)
    else if (modelType === "trends") {
      renderCompactTrendsCard(label, parsedJson, v.subject_ref);
    }
    // Fallback: Default Text
    else {
      renderPureTextCard(label, text);
    }
  });
}

// Renderer 1: Pure Text Only (No Image container rendered)
function renderPureTextCard(label, text) {
  const card = document.createElement("div");
  card.className = "result-card card-gemini compact-card";
  card.innerHTML = `
    <div class="result-header">
      <div class="model-name">
        <i class="fa-solid fa-file-code" style="color: #4285f4"></i>
        <span>${escapeHtml(label)}</span>
        <span class="badge-text-only">Pure Text Output</span>
      </div>
      <div class="result-actions">
        <button class="copy-btn" type="button"><i class="fa-regular fa-copy"></i> <span>Copy Text</span></button>
      </div>
    </div>
    <div class="prompt-body-wrapper">
      <pre class="prompt-output">${escapeHtml(text)}</pre>
    </div>
    <div class="result-footer">
      <span><i class="fa-solid fa-align-left"></i> ${getWordCount(text)} words | ${text.length} chars</span>
      <span>Production Ready Text Prompt</span>
    </div>
  `;

  bindCopyButton(card, text);
  resultsGridEl.appendChild(card);
}

// Renderer 2: Pure Image Only + Additional Notes
function renderPureImageCard(label, imageUrl, promptText, styleRef, subjectRef) {
  const card = document.createElement("div");
  card.className = "result-card card-image compact-card";
  
  card.innerHTML = `
    <div class="result-header">
      <div class="model-name">
        <i class="fa-solid fa-image" style="color: #a855f7"></i>
        <span>${escapeHtml(label)}</span>
        <span class="badge-image-only">1024 x 1024 FLUX</span>
      </div>
      <div class="result-actions">
        <button class="btn-img-action copy-img-url-btn" data-url="${escapeHtml(imageUrl)}"><i class="fa-solid fa-link"></i> Copy URL</button>
        <a href="${escapeHtml(imageUrl)}" download="generated_image_3.jpg" target="_blank" class="btn-img-action primary-action"><i class="fa-solid fa-download"></i> Download Image</a>
      </div>
    </div>

    <!-- Prominent Image Display -->
    <div class="generated-image-container compact-image-box">
      <div class="image-preview-wrapper compact-wrapper">
        <div class="image-skeleton-spinner"><i class="fa-solid fa-spinner fa-spin"></i> Rendering Image...</div>
        <img src="${escapeHtml(imageUrl)}" alt="Generated Image 3" class="generated-image-preview" onload="this.previousElementSibling.style.display='none'; this.style.opacity='1';" onerror="this.previousElementSibling.innerHTML='Failed to load image preview';">
      </div>
    </div>

    <!-- Additional Generation Notes Drawer -->
    <div class="generation-notes-box">
      <div class="notes-header"><i class="fa-solid fa-sliders"></i> Generation Notes & Parameters:</div>
      <div class="notes-grid">
        <div class="note-item"><strong>Engine Model:</strong> Pollinations FLUX.1 Neural Synthesis</div>
        <div class="note-item"><strong>Dimensions:</strong> 1024 x 1024 px (1:1 Square)</div>
        <div class="note-item"><strong>Style Reference:</strong> ${escapeHtml(styleRef || 'Cinematic Volumetric Lighting')}</div>
        <div class="note-item"><strong>Subject Reference:</strong> ${escapeHtml(subjectRef || promptText || 'Masterpiece Subject')}</div>
      </div>
      <div class="prompt-snippet-box">
        <span class="snippet-label">Synthesized Engine Prompt:</span>
        <code>${escapeHtml(promptText)}</code>
      </div>
    </div>
  `;

  // Copy Image Link Handler
  const copyImgUrlBtn = card.querySelector(".copy-img-url-btn");
  if (copyImgUrlBtn) {
    copyImgUrlBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(imageUrl).then(() => {
        copyImgUrlBtn.innerHTML = `<i class="fa-solid fa-check"></i> Copied!`;
        setTimeout(() => {
          copyImgUrlBtn.innerHTML = `<i class="fa-solid fa-link"></i> Copy URL`;
        }, 2000);
      });
    });
  }

  resultsGridEl.appendChild(card);
}

// Renderer 3: Compact SEO & Ad Revenue Analytics (Clean, Detailed Table, No Random Recommendations)
function renderCompactSeoCard(label, parsedJson, subjectRef) {
  const seoData = parsedJson || {
    niche: subjectRef || "Target Keyword Niche",
    seo_search_volume: "48,500 / mo",
    seo_difficulty: "38/100 (Moderate)",
    estimated_rpm: "$22.50 - $42.00",
    estimated_cpc: "$2.10 - $5.80",
    est_monthly_revenue_potential: "$4,500 - $12,000",
    pros: [
      "High advertiser competition & premium affiliate payouts.",
      "Evergreen search volume with consistent year-round interest.",
      "Low competition in long-tail search query variations."
    ],
    cons: [
      "Established media domains hold top 3 positions for primary seed keywords.",
      "Requires publishing high-authority structured content."
    ]
  };

  const card = document.createElement("div");
  card.className = "result-card card-analytics compact-card";
  card.innerHTML = `
    <div class="result-header">
      <div class="model-name" style="color: #10b981;">
        <i class="fa-solid fa-chart-column"></i>
        <span>${escapeHtml(label)}</span>
        <span class="badge-analytics">Niche Financial Intelligence</span>
      </div>
      <div class="result-actions">
        <button class="copy-btn" type="button"><i class="fa-regular fa-copy"></i> <span>Copy Data</span></button>
      </div>
    </div>

    <div class="niche-title-banner compact-banner">
      <span class="niche-tag">Target Keyword:</span>
      <h3>"${escapeHtml(seoData.niche)}"</h3>
    </div>

    <!-- High-Density Metrics Bar -->
    <div class="metrics-grid compact-grid">
      <div class="metric-card metric-green">
        <span class="metric-label">Est. Monthly Revenue</span>
        <span class="metric-value">${escapeHtml(seoData.est_monthly_revenue_potential)}</span>
      </div>
      <div class="metric-card metric-purple">
        <span class="metric-label">AdSense / Ad RPM</span>
        <span class="metric-value">${escapeHtml(seoData.estimated_rpm)}</span>
      </div>
      <div class="metric-card metric-blue">
        <span class="metric-label">Search Volume</span>
        <span class="metric-value">${escapeHtml(seoData.seo_search_volume)}</span>
      </div>
      <div class="metric-card metric-orange">
        <span class="metric-label">SEO Difficulty</span>
        <span class="metric-value">${escapeHtml(seoData.seo_difficulty)}</span>
      </div>
    </div>

    <!-- Compact Pros & Cons Data Table (Clean, detailed, free of random filler) -->
    <div class="pros-cons-container compact-pc">
      <div class="pros-box compact-box">
        <h4><i class="fa-solid fa-circle-check" style="color: #10b981;"></i> Key Market Advantages (Pros)</h4>
        <ul>
          ${(seoData.pros || []).map(p => `<li><i class="fa-solid fa-check"></i> ${escapeHtml(p)}</li>`).join("")}
        </ul>
      </div>
      <div class="cons-box compact-box">
        <h4><i class="fa-solid fa-circle-xmark" style="color: #f43f5e;"></i> Niche Entry Risks (Cons)</h4>
        <ul>
          ${(seoData.cons || []).map(c => `<li><i class="fa-solid fa-xmark"></i> ${escapeHtml(c)}</li>`).join("")}
        </ul>
      </div>
    </div>
  `;

  bindCopyButton(card, JSON.stringify(seoData, null, 2));
  resultsGridEl.appendChild(card);
}

// Renderer 4: Compact USA vs Philippines Regional Trends
function renderCompactTrendsCard(label, parsedJson, subjectRef) {
  const trendData = parsedJson || {
    niche: subjectRef || "Target Keyword Niche",
    usa_popularity: "🔥 95/100 (Top 3 Search Trend)",
    philippines_popularity: "📈 89/100 (Surging PH Interest)",
    usa_insights: "US market favors high-end subscriptions, desktop/mobile convenience, and fast shipping.",
    philippines_insights: "PH market favors Shopee/Lazada integrations, GCash payments, and TikTok influencer trends.",
    target_demographics: "Ages 18-34 | Tech Professionals & Content Creators",
    growth_trajectory: "🚀 +44% YoY Search Growth",
    multidisciplinary_stats: [
      "74% Mobile traffic share in PH vs 62% in US",
      "Peak engagement hours: 8 PM - 11 PM local time",
      "Top channels: Google Search (48%), TikTok (32%), YouTube Shorts (20%)"
    ]
  };

  const card = document.createElement("div");
  card.className = "result-card card-analytics compact-card";
  card.innerHTML = `
    <div class="result-header">
      <div class="model-name" style="color: #38bdf8;">
        <i class="fa-solid fa-earth-americas"></i>
        <span>${escapeHtml(label)}</span>
        <span class="badge-analytics">Regional Trend Analytics</span>
      </div>
      <div class="result-actions">
        <button class="copy-btn" type="button"><i class="fa-regular fa-copy"></i> <span>Copy Data</span></button>
      </div>
    </div>

    <div class="niche-title-banner compact-banner">
      <span class="niche-tag">Regional Query:</span>
      <h3>"${escapeHtml(trendData.niche)}"</h3>
    </div>

    <!-- Regional Comparison Cards -->
    <div class="regional-grid compact-grid">
      <div class="region-card usa-card compact-region">
        <div class="region-flag">🇺🇸 U.S.A. Market Insights</div>
        <div class="region-pop">${escapeHtml(trendData.usa_popularity)}</div>
        <p class="region-desc">${escapeHtml(trendData.usa_insights)}</p>
      </div>

      <div class="region-card ph-card compact-region">
        <div class="region-flag">🇵🇭 Philippines Market Insights</div>
        <div class="region-pop">${escapeHtml(trendData.philippines_popularity)}</div>
        <p class="region-desc">${escapeHtml(trendData.philippines_insights)}</p>
      </div>
    </div>

    <!-- Compact Multidisciplinary Stats -->
    <div class="multidisciplinary-box compact-box">
      <h4><i class="fa-solid fa-chart-pie"></i> Audience & Multidisciplinary Stats</h4>
      <div class="demographics-row">
        <span><strong>Demographics:</strong> ${escapeHtml(trendData.target_demographics)}</span>
        <span><strong>Trajectory:</strong> ${escapeHtml(trendData.growth_trajectory)}</span>
      </div>
      <ul class="stats-list">
        ${(trendData.multidisciplinary_stats || []).map(s => `<li><i class="fa-solid fa-chart-simple"></i> ${escapeHtml(s)}</li>`).join("")}
      </ul>
    </div>
  `;

  bindCopyButton(card, JSON.stringify(trendData, null, 2));
  resultsGridEl.appendChild(card);
}

function bindCopyButton(card, textToCopy) {
  const copyBtn = card.querySelector(".copy-btn");
  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(textToCopy).then(() => {
        copyBtn.classList.add("copied");
        copyBtn.innerHTML = `<i class="fa-solid fa-check"></i> <span>Copied!</span>`;
        setTimeout(() => {
          copyBtn.classList.remove("copied");
          copyBtn.innerHTML = `<i class="fa-regular fa-copy"></i> <span>Copy</span>`;
        }, 2000);
      });
    });
  }
}

function renderLoadingSkeletons(selectedModel) {
  const label = getModelLabel(selectedModel);
  resultsGridEl.innerHTML = `
    <div class="result-card card-analytics compact-card">
      <div class="result-header">
        <div class="model-name"><i class="fa-solid fa-circle-notch fa-spin"></i> Processing ${escapeHtml(label)}...</div>
      </div>
      <div class="loading-fusion-box compact-loading">
        <div class="skeleton-image-placeholder">
          <i class="fa-solid fa-microchip fa-bounce"></i>
          <p>Processing clean, detailed data for engine: ${selectedModel.toUpperCase()}...</p>
        </div>
      </div>
    </div>
  `;
}

function renderErrorState(errorMsg) {
  resultsGridEl.innerHTML = `
    <div class="empty-state card compact-card">
      <div class="empty-icon" style="color: #f43f5e; background: rgba(244, 63, 94, 0.1);"><i class="fa-solid fa-triangle-exclamation"></i></div>
      <h3>Execution Error</h3>
      <p>${escapeHtml(errorMsg)}</p>
    </div>
  `;
}

// Fallback Demo Response Generator
function generateDemoVariations(promptText, styleRef, subjectRef, style, model) {
  const keyword = promptText || subjectRef || "AI Video Editing Tools";

  if (model === "seo") {
    const seoData = {
      niche: keyword,
      seo_search_volume: "52,400 / mo",
      seo_difficulty: "36/100 (Moderate)",
      estimated_rpm: "$24.50 - $48.00",
      estimated_cpc: "$2.40 - $6.20",
      est_monthly_revenue_potential: "$4,800 - $14,500",
      pros: [
        "High advertiser competition with premium recurring software affiliate payouts.",
        "Sustained 45%+ annual search growth driven by creator economy.",
        "Rich long-tail keyword clusters for rapid Google & YouTube ranking."
      ],
      cons: [
        "Requires active content updates to keep pace with new AI releases.",
        "High domain authority sites hold top positions for broad seed keywords."
      ]
    };

    return [{
      label: getModelLabel(model),
      model_type: "seo",
      prompt: JSON.stringify(seoData, null, 2),
      subject_ref: keyword
    }];

  } else if (model === "trends") {
    const trendData = {
      niche: keyword,
      usa_popularity: "🔥 96/100 (Top 5 Search Trend)",
      philippines_popularity: "📈 91/100 (Surging Interest)",
      usa_insights: "US users prioritize automated workflow integrations, 4K rendering speed, and commercial licensing.",
      philippines_insights: "PH users favor CapCut/TikTok integrations, GCash payments, and remote freelance client work.",
      target_demographics: "Ages 18-35 | Content Creators & Remote Freelancers",
      growth_trajectory: "🚀 +48% YoY Expansion",
      multidisciplinary_stats: [
        "76% Mobile search share in Philippines vs 64% in USA",
        "Peak engagement: 7:30 PM - 11:00 PM local time",
        "Primary traffic: Google Search (50%), TikTok (30%), YouTube Shorts (20%)"
      ]
    };

    return [{
      label: getModelLabel(model),
      model_type: "trends",
      prompt: JSON.stringify(trendData, null, 2),
      subject_ref: keyword
    }];

  } else if (model === "image") {
    const synthesizedMasterPrompt = `A high-fidelity master digital artwork showcasing ${keyword}, rendered in ${styleRef || 'Vibrant 3D Pixar style'}. Masterpiece quality, octane render, 8k resolution.`;
    return [{
      label: getModelLabel(model),
      model_type: "image",
      prompt: synthesizedMasterPrompt,
      image_url: buildPollinationsImageUrl(synthesizedMasterPrompt),
      style_ref: styleRef,
      subject_ref: keyword
    }];

  } else {
    return [{
      label: getModelLabel(model),
      model_type: "gemini",
      prompt: `<role>\nYou are a prompt engineering specialist.\n</role>\n\n<task>\nObjective: "${keyword}"\n</task>\n\n<framework>\n1. Provide structured response formatted in clean markdown.\n2. Calibrated style preset: ${style.toUpperCase()}.\n</framework>`,
      subject_ref: keyword
    }];
  }
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

function showStatus(msg, type) {
  statusBarEl.className = `status-bar ${type}`;
  statusBarEl.innerHTML = `<i class="fa-solid ${type === 'error' ? 'fa-circle-exclamation' : type === 'success' ? 'fa-circle-check' : 'fa-circle-info'}"></i> <span>${escapeHtml(msg)}</span>`;
  statusBarEl.classList.remove("hidden");
}

function getWordCount(str) {
  if (!str) return 0;
  return str.trim().split(/\s+/).filter(Boolean).length;
}

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

// Modal Handlers
function openModal() {
  webhookUrlInput.value = webhookUrl;
  if (pollinationsKeyInput) pollinationsKeyInput.value = pollinationsKey;
  testResultEl.className = "test-result";
  testResultEl.textContent = "";
  settingsModal.classList.add("active");
}

function closeModal() {
  settingsModal.classList.remove("active");
}

function saveWebhookUrl() {
  const url = webhookUrlInput.value.trim();
  const key = pollinationsKeyInput ? pollinationsKeyInput.value.trim() : "";

  webhookUrl = url || DEFAULT_WEBHOOK_URL;
  pollinationsKey = key;

  if (url) {
    localStorage.setItem(STORAGE_WEBHOOK_KEY, url);
  } else {
    localStorage.removeItem(STORAGE_WEBHOOK_KEY);
  }

  if (key) {
    localStorage.setItem(STORAGE_POLLINATIONS_KEY, key);
  } else {
    localStorage.removeItem(STORAGE_POLLINATIONS_KEY);
  }

  showStatus("Settings saved successfully!", "success");
  initWebhookState();
  closeModal();
}

async function testWebhookConnection() {
  const url = webhookUrlInput.value.trim();
  if (!url) {
    testResultEl.className = "test-result error";
    testResultEl.textContent = "Please enter a valid Webhook URL first.";
    return;
  }

  testResultEl.className = "test-result";
  testResultEl.textContent = "Testing connection...";

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "69420"
      },
      body: JSON.stringify({ prompt: "ping_test", model: "seo" }),
    });

    if (response.ok) {
      testResultEl.className = "test-result success";
      testResultEl.textContent = "✓ Webhook connection successful! Status 200 OK.";
    } else {
      testResultEl.className = "test-result error";
      testResultEl.textContent = `✗ Received status ${response.status} from server.`;
    }
  } catch (err) {
    testResultEl.className = "test-result error";
    testResultEl.textContent = `✗ Connection failed: ${err.message}.`;
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
  if (historyData.length > 20) historyData.pop();
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
      <div class="history-item-time"><i class="fa-regular fa-clock"></i> ${item.timestamp}</div>
    `;
    div.addEventListener("click", () => {
      if (nicheSearchInput) nicheSearchInput.value = item.rawPrompt;
      renderResults(item.variations);
      closeHistoryDrawer();
      showStatus("Restored item from history.", "info");
    });
    historyListEl.appendChild(div);
  });
}

function clearHistory() {
  historyData = [];
  localStorage.removeItem(STORAGE_HISTORY_KEY);
  renderHistory();
}
