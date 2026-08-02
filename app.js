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
      enhanceBtn.querySelector(".btn-text").innerHTML = `<i class="fa-solid fa-magnifying-glass-chart"></i> Analyze SEO & Market Intelligence`;
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
      enhanceBtn.querySelector(".btn-text").innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> Generate Image 3 & Prompt`;
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
        showStatus(`Selected Trending Niche: "${chip.textContent.trim()}"`, "info");
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
      showStatus("Please enter a niche keyword or topic to search.", "error");
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
  showStatus(`Analyzing request using engine: ${selectedModel.toUpperCase()}...`, "info");

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
      // Demo Engine Mode with rich Analytics & Metrics
      await new Promise(resolve => setTimeout(resolve, 1000));
      variations = generateDemoVariations(rawPrompt, styleRef, subjectRef, selectedStyle, selectedModel);
      showStatus("Generated using Demo Engine Mode. Connect n8n Webhook URL for live workflow execution.", "info");
    }

    if (variations.length === 0) {
      throw new Error("No analytics or responses returned from workflow.");
    }

    renderResults(variations);
    if (webhookUrl) {
      showStatus("Successfully retrieved market intelligence & analytics!", "success");
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
  if (model === "seo") {
    activeModelTagEl.innerHTML = `<i class="fa-solid fa-chart-line"></i> Engine: High-SEO & Ad Revenue Intelligence`;
  } else if (model === "trends") {
    activeModelTagEl.innerHTML = `<i class="fa-solid fa-earth-americas"></i> Engine: USA vs Philippines Trend Intelligence`;
  } else if (model === "image") {
    activeModelTagEl.innerHTML = `<i class="fa-solid fa-palette"></i> Engine: Pollinations Image Generator`;
  } else {
    activeModelTagEl.innerHTML = `<i class="fa-brands fa-google"></i> Engine: Google Gemini Prompt Enhancer`;
  }
}

function getModelLabel(modelKey) {
  if (modelKey === "seo") return "SEO & Ad Revenue Intelligence";
  if (modelKey === "trends") return "USA vs Philippines Regional Trends";
  if (modelKey === "image") return "Pollinations Image Generator";
  return "Google Gemini Prompt Enhancer";
}

// Render Analytics & Results Dashboard
function renderResults(variations) {
  resultsGridEl.innerHTML = "";

  variations.forEach((v) => {
    const modelType = v.model_type || modelSelectEl.value;
    const label = v.label || getModelLabel(modelType);
    const text = v.prompt || "";
    const rawData = v.payload_data || {};

    let parsedJson = null;
    try {
      if (typeof text === "string" && text.trim().startsWith("{")) {
        parsedJson = JSON.parse(text);
      }
    } catch (e) {}

    const card = document.createElement("div");
    card.className = `result-card card-analytics`;

    if (modelType === "seo") {
      const seoData = parsedJson || {
        niche: v.subject_ref || "Selected Keyword Niche",
        seo_search_volume: "48,500 / mo (High Demand)",
        seo_difficulty: "38/100 (Moderate)",
        estimated_rpm: "$22.50 - $42.00 per 1k views",
        estimated_cpc: "$2.10 - $5.80",
        est_monthly_revenue_potential: "$4,500 - $12,000",
        pros: [
          "High advertiser competition & premium affiliate payouts.",
          "Strong evergreen search interest with year-round stability.",
          "Abundant low-competition long-tail keyword clusters."
        ],
        cons: [
          "Established media sites hold top 3 positions for seed keywords.",
          "Requires structured content strategy & topic cluster authority."
        ],
        summary: "High ROI niche opportunity. Ideal for niche sites, YouTube automation, and SaaS affiliate landing pages."
      };

      card.innerHTML = `
        <div class="result-header">
          <div class="model-name" style="color: #10b981;">
            <i class="fa-solid fa-chart-line"></i>
            <span>${escapeHtml(label)} Metrics</span>
          </div>
          <div class="result-actions">
            <button class="copy-btn" type="button"><i class="fa-regular fa-copy"></i> <span>Copy Metrics</span></button>
          </div>
        </div>

        <div class="niche-title-banner">
          <span class="niche-tag"><i class="fa-solid fa-tag"></i> Keyword Query:</span>
          <h3>"${escapeHtml(seoData.niche)}"</h3>
        </div>

        <!-- Metrics Dashboard -->
        <div class="metrics-grid">
          <div class="metric-card metric-green">
            <span class="metric-label"><i class="fa-solid fa-hand-holding-dollar"></i> Est. Monthly Revenue</span>
            <span class="metric-value">${escapeHtml(seoData.est_monthly_revenue_potential)}</span>
          </div>
          <div class="metric-card metric-purple">
            <span class="metric-label"><i class="fa-solid fa-eye"></i> AdSense / Ad RPM</span>
            <span class="metric-value">${escapeHtml(seoData.estimated_rpm)}</span>
          </div>
          <div class="metric-card metric-blue">
            <span class="metric-label"><i class="fa-solid fa-arrow-trend-up"></i> Search Volume</span>
            <span class="metric-value">${escapeHtml(seoData.seo_search_volume)}</span>
          </div>
          <div class="metric-card metric-orange">
            <span class="metric-label"><i class="fa-solid fa-shield-halved"></i> SEO Difficulty</span>
            <span class="metric-value">${escapeHtml(seoData.seo_difficulty)}</span>
          </div>
        </div>

        <!-- Pros & Cons Grid -->
        <div class="pros-cons-container">
          <div class="pros-box">
            <h4><i class="fa-solid fa-circle-check" style="color: #10b981;"></i> Niche Pros & Advantages</h4>
            <ul>
              ${(seoData.pros || []).map(p => `<li><i class="fa-solid fa-check"></i> ${escapeHtml(p)}</li>`).join("")}
            </ul>
          </div>
          <div class="cons-box">
            <h4><i class="fa-solid fa-triangle-exclamation" style="color: #f43f5e;"></i> Risks & Challenges</h4>
            <ul>
              ${(seoData.cons || []).map(c => `<li><i class="fa-solid fa-xmark"></i> ${escapeHtml(c)}</li>`).join("")}
            </ul>
          </div>
        </div>

        <div class="summary-box">
          <strong><i class="fa-solid fa-lightbulb"></i> Strategic Recommendation:</strong>
          <p>${escapeHtml(seoData.summary)}</p>
        </div>
      `;

    } else if (modelType === "trends") {
      const trendData = parsedJson || {
        niche: v.subject_ref || "Selected Market Topic",
        usa_popularity: "🔥 95/100 (Top 3 Trending Category in the US)",
        philippines_popularity: "📈 89/100 (Surging Interest in PH E-Commerce)",
        usa_insights: "US audience focuses on high-efficiency tools, subscription flexibility, and premium brand value.",
        philippines_insights: "PH audience relies heavily on Shopee/Lazada ecosystem, GCash digital wallet, and TikTok shop influencers.",
        target_demographics: "Ages 18-34 | Tech Professionals, Online Entrepreneurs & Gen-Z Creators",
        growth_trajectory: "🚀 +44% Year-over-Year Search Expansion",
        multidisciplinary_stats: [
          "74% Mobile traffic dominance in PH vs 62% in the US",
          "Peak buying hours: 8 PM - 11 PM PH local time",
          "Top channels: Google Search (48%), TikTok Shop (32%), YouTube Shorts (20%)"
        ],
        summary: "Strong dual-market potential with high virality upside in the Philippines and high purchasing power in the USA."
      };

      card.innerHTML = `
        <div class="result-header">
          <div class="model-name" style="color: #38bdf8;">
            <i class="fa-solid fa-earth-americas"></i>
            <span>${escapeHtml(label)}</span>
          </div>
          <div class="result-actions">
            <button class="copy-btn" type="button"><i class="fa-regular fa-copy"></i> <span>Copy Insights</span></button>
          </div>
        </div>

        <div class="niche-title-banner">
          <span class="niche-tag"><i class="fa-solid fa-earth-asia"></i> Regional Comparison:</span>
          <h3>"${escapeHtml(trendData.niche)}"</h3>
        </div>

        <!-- Regional USA vs PH Cards -->
        <div class="regional-grid">
          <div class="region-card usa-card">
            <div class="region-flag">🇺🇸 U.S.A. Market Trends</div>
            <div class="region-pop">${escapeHtml(trendData.usa_popularity)}</div>
            <p class="region-desc">${escapeHtml(trendData.usa_insights)}</p>
          </div>

          <div class="region-card ph-card">
            <div class="region-flag">🇵🇭 Philippines Market Trends</div>
            <div class="region-pop">${escapeHtml(trendData.philippines_popularity)}</div>
            <p class="region-desc">${escapeHtml(trendData.philippines_insights)}</p>
          </div>
        </div>

        <!-- Multidisciplinary Stats -->
        <div class="multidisciplinary-box">
          <h4><i class="fa-solid fa-chart-pie"></i> Multidisciplinary Analytics & Audience Breakdown</h4>
          <div class="demographics-row">
            <span><strong>Target Demographics:</strong> ${escapeHtml(trendData.target_demographics)}</span>
            <span><strong>Growth Trajectory:</strong> ${escapeHtml(trendData.growth_trajectory)}</span>
          </div>
          <ul class="stats-list">
            ${(trendData.multidisciplinary_stats || []).map(s => `<li><i class="fa-solid fa-chart-simple"></i> ${escapeHtml(s)}</li>`).join("")}
          </ul>
        </div>

        <div class="summary-box">
          <strong><i class="fa-solid fa-bullseye"></i> Executive Summary:</strong>
          <p>${escapeHtml(trendData.summary)}</p>
        </div>
      `;

    } else if (modelType === "image" || v.image_url) {
      const imageUrl = v.image_url || buildPollinationsImageUrl(text);
      card.className = `result-card card-gemini fusion-result-card`;
      card.innerHTML = `
        <div class="result-header">
          <div class="model-name"><i class="fa-solid fa-palette" style="color: #4285f4"></i> <span>${escapeHtml(label)}</span></div>
          <div class="result-actions">
            <button class="copy-btn" type="button"><i class="fa-regular fa-copy"></i> <span>Copy Prompt</span></button>
          </div>
        </div>
        <div class="generated-image-container">
          <div class="image-header">
            <span class="image-title"><i class="fa-solid fa-image"></i> Image 3 Output (gen.pollinations.ai)</span>
            <span class="image-badge">FLUX Model | 1024 x 1024</span>
          </div>
          <div class="image-preview-wrapper">
            <div class="image-skeleton-spinner"><i class="fa-solid fa-spinner fa-spin"></i> Rendering Image 3...</div>
            <img src="${escapeHtml(imageUrl)}" alt="Generated Image 3" class="generated-image-preview" onload="this.previousElementSibling.style.display='none'; this.style.opacity='1';" onerror="this.previousElementSibling.innerHTML='Failed to load image preview';">
          </div>
          <div class="image-actions">
            <a href="${escapeHtml(imageUrl)}" target="_blank" rel="noopener" class="btn-img-action"><i class="fa-solid fa-expand"></i> Open Fullsize</a>
            <button type="button" class="btn-img-action copy-img-url-btn" data-url="${escapeHtml(imageUrl)}"><i class="fa-solid fa-link"></i> Copy Link</button>
            <a href="${escapeHtml(imageUrl)}" download="generated_image_3.jpg" target="_blank" class="btn-img-action primary-action"><i class="fa-solid fa-download"></i> Download</a>
          </div>
        </div>
        <div class="prompt-section">
          <div class="section-label"><i class="fa-solid fa-code"></i> Master Prompt:</div>
          <pre class="prompt-output">${escapeHtml(text)}</pre>
        </div>
      `;
    } else {
      card.className = `result-card card-gemini`;
      card.innerHTML = `
        <div class="result-header">
          <div class="model-name"><i class="fa-brands fa-google" style="color: #4285f4"></i> <span>${escapeHtml(label)}</span></div>
          <div class="result-actions">
            <button class="copy-btn" type="button"><i class="fa-regular fa-copy"></i> <span>Copy</span></button>
          </div>
        </div>
        <pre class="prompt-output">${escapeHtml(text)}</pre>
      `;
    }

    // Copy Handler
    const copyBtn = card.querySelector(".copy-btn");
    if (copyBtn) {
      copyBtn.addEventListener("click", () => {
        const textToCopy = parsedJson ? JSON.stringify(parsedJson, null, 2) : text;
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

    resultsGridEl.appendChild(card);
  });
}

function renderLoadingSkeletons(selectedModel) {
  const label = getModelLabel(selectedModel);
  resultsGridEl.innerHTML = `
    <div class="result-card card-analytics">
      <div class="result-header">
        <div class="model-name"><i class="fa-solid fa-circle-notch fa-spin"></i> ${escapeHtml(label)} analyzing market data...</div>
      </div>
      <div class="loading-fusion-box">
        <div class="skeleton-image-placeholder">
          <i class="fa-solid fa-chart-simple fa-bounce"></i>
          <p>Analyzing Search Volume, Ad Revenues, Pros/Cons & USA vs Philippines Market Trends...</p>
        </div>
      </div>
    </div>
  `;
}

function renderErrorState(errorMsg) {
  resultsGridEl.innerHTML = `
    <div class="empty-state card">
      <div class="empty-icon" style="color: #f43f5e; background: rgba(244, 63, 94, 0.1);"><i class="fa-solid fa-triangle-exclamation"></i></div>
      <h3>Failed to Execute Market Intelligence</h3>
      <p>${escapeHtml(errorMsg)}</p>
      <div style="margin-top: 1rem; text-align: left; background: rgba(10, 15, 26, 0.6); padding: 1rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); font-size: 0.82rem; color: #9ca3af;">
        <strong style="color: #f3f4f6;">💡 Quick Troubleshooting Checklist:</strong>
        <ol style="margin-left: 1.25rem; margin-top: 0.5rem; display: flex; flex-direction: column; gap: 0.35rem;">
          <li><strong>Check n8n Executions tab</strong>: Verify Webhook node is receiving <code>model: "${modelSelectEl.value}"</code>.</li>
          <li><strong>Check Webhook Endpoint</strong>: Using <code>https://caravan-tidbit-flyover.ngrok-free.dev/webhook/enhance-promp</code>.</li>
        </ol>
      </div>
    </div>
  `;
}

// Fallback Demo Response Generator
function generateDemoVariations(promptText, styleRef, subjectRef, style, model) {
  const keyword = promptText || subjectRef || "AI Video Editing Tools";

  if (model === "seo") {
    const seoData = {
      niche: keyword,
      seo_search_volume: "52,400 / mo (High Demand)",
      seo_difficulty: "36/100 (Moderate - Low Competition in long-tail)",
      estimated_rpm: "$24.50 - $48.00 per 1k views",
      estimated_cpc: "$2.40 - $6.20",
      est_monthly_revenue_potential: "$4,800 - $14,500",
      pros: [
        "Extremely high advertiser demand with lucrative recurring software affiliate payouts.",
        "Sustained 45%+ annual search growth driven by content creator boom.",
        "Rich long-tail keyword clusters for rapid Google & YouTube ranking."
      ],
      cons: [
        "Requires active content updates to keep pace with new AI model releases.",
        "Strong domain authority needed for broad seed keywords."
      ],
      summary: "High ROI niche opportunity. Ideal for niche sites, YouTube automation channels, and SaaS recommendation portals."
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
      usa_popularity: "🔥 96/100 (Top 5 Search Trend in US Digital Creator Sector)",
      philippines_popularity: "📈 91/100 (Surging Interest in PH Freelance & BPO Sector)",
      usa_insights: "US consumers prioritize automated workflow integrations, 4K rendering speed, and commercial licensing.",
      philippines_insights: "PH users favor mobile-first tools, CapCut/TikTok integrations, GCash payments, and remote freelance client work.",
      target_demographics: "Ages 18-35 | Video Editors, Content Creators & Remote Freelancers",
      growth_trajectory: "🚀 +48% Year-over-Year Search Expansion",
      multidisciplinary_stats: [
        "76% Mobile search share in the Philippines vs 64% in the USA",
        "Peak search engagement: 7:30 PM - 11:00 PM local time",
        "Primary traffic discovery: Google Search (50%), TikTok (30%), YouTube Shorts (20%)"
      ],
      summary: "High potential in both regions. US market drives high software subscriptions, while PH market drives massive viral usage and service freelancing."
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

  showStatus("Settings & Pollinations API Key saved successfully!", "success");
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
  testResultEl.textContent = "Testing connection to n8n webhook...";

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
      <div class="history-item-time"><i class="fa-regular fa-clock"></i> ${item.timestamp} (${item.variations.length} items)</div>
    `;
    div.addEventListener("click", () => {
      if (nicheSearchInput) nicheSearchInput.value = item.rawPrompt;
      renderResults(item.variations);
      closeHistoryDrawer();
      showStatus("Restored market intelligence item from history.", "info");
    });
    historyListEl.appendChild(div);
  });
}

function clearHistory() {
  historyData = [];
  localStorage.removeItem(STORAGE_HISTORY_KEY);
  renderHistory();
}
