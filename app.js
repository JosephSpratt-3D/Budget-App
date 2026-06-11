const STORAGE_KEY = "localBudgetMobileSettings";
const MOBILE_DATA_FILE = "mobile_data.json";
const MOBILE_CHANGES_FILE = "mobile_changes.json";

const state = {
  settings: null,
  data: null,
};

const els = {
  status: document.getElementById("status"),
  setupView: document.getElementById("setupView"),
  settingsForm: document.getElementById("settingsForm"),
  repoInput: document.getElementById("repoInput"),
  branchInput: document.getElementById("branchInput"),
  folderInput: document.getElementById("folderInput"),
  tokenInput: document.getElementById("tokenInput"),
  tabs: document.getElementById("tabs"),
  refreshButton: document.getElementById("refreshButton"),
  resetButton: document.getElementById("resetButton"),
  incomeValue: document.getElementById("incomeValue"),
  spendingValue: document.getElementById("spendingValue"),
  savingsValue: document.getElementById("savingsValue"),
  budgetValue: document.getElementById("budgetValue"),
  netWorthValue: document.getElementById("netWorthValue"),
  accountBalanceList: document.getElementById("accountBalanceList"),
  transactionList: document.getElementById("transactionList"),
  accountsList: document.getElementById("accountsList"),
  budgetsList: document.getElementById("budgetsList"),
  debtsList: document.getElementById("debtsList"),
  transactionForm: document.getElementById("transactionForm"),
  txDate: document.getElementById("txDate"),
  txAccount: document.getElementById("txAccount"),
  txCategory: document.getElementById("txCategory"),
  txType: document.getElementById("txType"),
  txAmount: document.getElementById("txAmount"),
  txVendor: document.getElementById("txVendor"),
  txNotes: document.getElementById("txNotes"),
};

function money(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value || 0));
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function showStatus(message, isError = false) {
  if (!els.status) {
    return;
  }
  els.status.textContent = message;
  els.status.className = `status show${isError ? " error" : ""}`;
}

function clearStatusSoon() {
  window.setTimeout(() => {
    els.status.className = "status";
    els.status.textContent = "";
  }, 3500);
}

function loadSettings() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (parsed && parsed.repo && parsed.branch && parsed.folder && parsed.token) {
      return parsed;
    }
  } catch (_error) {
    return null;
  }
  return null;
}

function saveSettings(settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  state.settings = settings;
}

function fillSettingsForm() {
  const settings = state.settings || {};
  els.repoInput.value = settings.repo || "";
  els.branchInput.value = settings.branch || "main";
  els.folderInput.value = settings.folder || "local-budget-backups";
  els.tokenInput.value = settings.token || "";
}

function setReady(ready) {
  els.setupView.style.display = ready ? "none" : "block";
  els.tabs.classList.toggle("ready", ready);
  document.querySelectorAll(".tab-page").forEach((page) => {
    page.style.display = ready ? "" : "none";
  });
}

function showLoadError(error) {
  setReady(false);
  showStatus(
    `Could not load mobile_data.json. Check owner/repo, branch, folder, token permission, and run Sync in the Windows app. Details: ${error.message}`,
    true,
  );
}

function clearNode(node) {
  while (node.firstChild) {
    node.removeChild(node.firstChild);
  }
}

function encodedPath(filename) {
  const folder = state.settings.folder.replace(/^\/+|\/+$/g, "");
  return `${folder}/${filename}`
    .split("/")
    .filter(Boolean)
    .map(encodeURIComponent)
    .join("/");
}

function apiUrl(filename) {
  return `https://api.github.com/repos/${state.settings.repo}/contents/${encodedPath(filename)}`;
}

function headers() {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${state.settings.token}`,
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

function decodeBase64(text) {
  return decodeURIComponent(escape(atob(text.replace(/\s/g, ""))));
}

function encodeBase64(text) {
  return btoa(unescape(encodeURIComponent(text)));
}

async function githubGetFile(filename) {
  const response = await fetch(`${apiUrl(filename)}?ref=${encodeURIComponent(state.settings.branch)}`, {
    headers: headers(),
  });
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || `GitHub error ${response.status}`);
  }
  return response.json();
}

async function githubGetJson(filename) {
  const file = await githubGetFile(filename);
  if (!file) {
    return { payload: null, sha: null };
  }
  const raw = file.encoding === "base64" ? decodeBase64(file.content) : "{}";
  return { payload: JSON.parse(raw || "{}"), sha: file.sha };
}

async function githubPutJson(filename, payload, message, sha = null) {
  const body = {
    message,
    content: encodeBase64(JSON.stringify(payload, null, 2)),
    branch: state.settings.branch,
  };
  if (sha) {
    body.sha = sha;
  }
  const response = await fetch(apiUrl(filename), {
    method: "PUT",
    headers: { ...headers(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const failure = new Error(error.message || `GitHub error ${response.status}`);
    failure.status = response.status;
    throw failure;
  }
  return response.json();
}

async function loadMobileData() {
  showStatus("Downloading mobile_data.json...");
  const { payload } = await githubGetJson(MOBILE_DATA_FILE);
  if (!payload) {
    throw new Error("mobile_data.json was not found. Run Sync in the Windows app first.");
  }
  state.data = payload;
  renderAll();
  setReady(true);
  showStatus(`Loaded ${payload.month || "current"} budget data.`);
  clearStatusSoon();
}

function renderAll() {
  const data = state.data || {};
  const dashboard = data.dashboard || {};
  els.incomeValue.textContent = money(dashboard.income);
  els.spendingValue.textContent = money(dashboard.spending);
  els.savingsValue.textContent = money(dashboard.net_savings);
  els.budgetValue.textContent = money(dashboard.budget_remaining);
  els.netWorthValue.textContent = money(dashboard.net_worth);
  els.budgetValue.className = Number(dashboard.budget_remaining || 0) < 0 ? "negative" : "positive";
  renderAccounts(data.accounts || []);
  renderTransactions(data.recent_transactions || []);
  renderBudgets(data.monthly_budgets || []);
  renderDebts(data.debts || []);
  fillTransactionOptions();
}

function row(title, amount, detail = "", amountClass = "") {
  const div = document.createElement("div");
  div.className = "row";
  div.innerHTML = `
    <div class="row-top"><span></span><span class="${amountClass}"></span></div>
    <div class="row-sub"></div>
  `;
  div.querySelector(".row-top span:first-child").textContent = title;
  div.querySelector(".row-top span:last-child").textContent = amount;
  div.querySelector(".row-sub").textContent = detail;
  return div;
}

function renderAccounts(accounts) {
  clearNode(els.accountBalanceList);
  clearNode(els.accountsList);
  if (!accounts.length) {
    els.accountBalanceList.textContent = "No accounts exported yet.";
    els.accountsList.textContent = "No accounts exported yet.";
    return;
  }
  accounts.forEach((account) => {
    const balance = Number(account.current_balance || 0);
    const item = row(account.name, money(balance), account.type || "", balance < 0 ? "negative" : "positive");
    els.accountBalanceList.appendChild(item.cloneNode(true));
    els.accountsList.appendChild(item);
  });
}

function renderTransactions(transactions) {
  clearNode(els.transactionList);
  if (!transactions.length) {
    els.transactionList.textContent = "No recent transactions.";
    return;
  }
  transactions.forEach((tx) => {
    const sign = tx.type === "income" ? "positive" : "negative";
    const detail = [tx.date, tx.account, tx.category, tx.vendor].filter(Boolean).join(" - ");
    els.transactionList.appendChild(row(tx.notes || tx.vendor || tx.category || "Transaction", money(tx.amount), detail, sign));
  });
}

function renderBudgets(budgets) {
  clearNode(els.budgetsList);
  if (!budgets.length) {
    els.budgetsList.textContent = "No budget lines for this month.";
    return;
  }
  budgets.forEach((budget) => {
    const remaining = Number(budget.remaining || 0);
    const detail = `Planned ${money(budget.planned)} - Actual ${money(budget.actual)}`;
    els.budgetsList.appendChild(row(budget.category_name, money(remaining), detail, remaining < 0 ? "negative" : "positive"));
  });
}

function renderDebts(debts) {
  clearNode(els.debtsList);
  if (!debts.length) {
    els.debtsList.textContent = "No debts exported yet.";
    return;
  }
  debts.forEach((debt) => {
    const payment = Number(debt.minimum_payment || 0) + Number(debt.extra_payment || 0);
    const detail = `${debt.account || "Debt"} - ${Number(debt.interest_rate || 0)}% - Payment ${money(payment)}`;
    els.debtsList.appendChild(row(debt.name, money(debt.balance), detail, "negative"));
  });
}

function fillTransactionOptions() {
  const data = state.data || {};
  const accounts = data.accounts || [];
  const categories = data.categories || [];
  clearNode(els.txAccount);
  accounts.forEach((account) => {
    const option = document.createElement("option");
    option.value = account.id;
    option.textContent = `${account.name} (${account.type})`;
    option.dataset.name = account.name;
    els.txAccount.appendChild(option);
  });
  filterCategoryOptions();
}

function filterCategoryOptions() {
  const type = els.txType.value;
  const categories = ((state.data && state.data.categories) || []).filter((category) => category.kind === type);
  clearNode(els.txCategory);
  const empty = document.createElement("option");
  empty.value = "";
  empty.textContent = "No Category";
  els.txCategory.appendChild(empty);
  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category.id;
    option.textContent = category.name;
    option.dataset.name = category.name;
    els.txCategory.appendChild(option);
  });
}

async function uploadPendingTransaction(transaction) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const { payload, sha } = await githubGetJson(MOBILE_CHANGES_FILE);
    const current = payload || { schema_version: 1, source: "mobile", transactions: [] };
    const transactions = Array.isArray(current.transactions) ? current.transactions : [];
    if (!transactions.some((item) => item.id === transaction.id)) {
      transactions.push(transaction);
    }
    const nextPayload = {
      schema_version: 1,
      source: "mobile",
      updated_at: new Date().toISOString(),
      transactions,
    };
    try {
      await githubPutJson(MOBILE_CHANGES_FILE, nextPayload, "Submit Local Budget mobile transaction", sha);
      return transactions.length;
    } catch (error) {
      if (error.status !== 409 && !String(error.message).toLowerCase().includes("sha")) {
        throw error;
      }
    }
  }
  throw new Error("GitHub changed while saving. Try again.");
}

function selectedOption(select) {
  return select.options[select.selectedIndex];
}

async function saveTransaction(event) {
  event.preventDefault();
  if (!state.data) {
    showStatus("Load mobile data before adding a transaction.", true);
    return;
  }
  const accountOption = selectedOption(els.txAccount);
  const categoryOption = selectedOption(els.txCategory);
  const amount = Number(els.txAmount.value);
  if (!accountOption || !Number.isFinite(amount) || amount <= 0) {
    showStatus("Choose an account and enter a valid amount.", true);
    return;
  }
  const transaction = {
    id: `phone-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    source: "mobile",
    created_at: new Date().toISOString(),
    date: els.txDate.value || today(),
    account_id: Number(accountOption.value),
    account: accountOption.dataset.name || accountOption.textContent,
    category_id: categoryOption && categoryOption.value ? Number(categoryOption.value) : null,
    category: categoryOption && categoryOption.dataset ? categoryOption.dataset.name || "" : "",
    type: els.txType.value,
    amount,
    vendor: els.txVendor.value.trim(),
    notes: els.txNotes.value.trim(),
  };
  showStatus("Uploading pending transaction...");
  try {
    const pendingCount = await uploadPendingTransaction(transaction);
    els.transactionForm.reset();
    els.txDate.value = today();
    filterCategoryOptions();
    showStatus(`Transaction submitted. ${pendingCount} pending phone change(s) will import next time Windows syncs.`);
  } catch (error) {
    showStatus(error.message, true);
  }
}

function bindEvents() {
  els.settingsForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    saveSettings({
      repo: els.repoInput.value.trim(),
      branch: els.branchInput.value.trim() || "main",
      folder: els.folderInput.value.trim() || "local-budget-backups",
      token: els.tokenInput.value.trim(),
    });
    setReady(false);
    await loadMobileData().catch(showLoadError);
  });

  els.refreshButton.addEventListener("click", () => {
    if (!state.settings) {
      showStatus("Save GitHub settings first.", true);
      return;
    }
    loadMobileData().catch(showLoadError);
  });

  els.resetButton.addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    state.settings = null;
    state.data = null;
    fillSettingsForm();
    setReady(false);
    showStatus("Mobile settings cleared.");
  });

  els.tabs.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-tab]");
    if (!button) {
      return;
    }
    document.querySelectorAll(".tabs button").forEach((tab) => tab.classList.remove("active"));
    document.querySelectorAll(".tab-page").forEach((page) => page.classList.remove("active"));
    button.classList.add("active");
    document.getElementById(`${button.dataset.tab}Tab`).classList.add("active");
  });

  els.txType.addEventListener("change", filterCategoryOptions);
  els.transactionForm.addEventListener("submit", saveTransaction);
}

async function init() {
  bindEvents();
  els.txDate.value = today();
  if (window.location.search.indexOf("reset=1") !== -1) {
    localStorage.removeItem(STORAGE_KEY);
  }
  state.settings = loadSettings();
  fillSettingsForm();
  setReady(false);
  if (state.settings) {
    showStatus("Saved GitHub settings found. Loading mobile_data.json...");
    await loadMobileData().catch(showLoadError);
  }
}

init().catch(showLoadError);
