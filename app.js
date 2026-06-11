const STORAGE_KEY = "christendomBudgetingWebSettings";
const DEMO_DB_KEY = "christendomBudgetingDemoDatabase";
const DB_FILENAME = "budget.sqlite3";

const state = {
  SQL: null,
  db: null,
  dbSha: null,
  settings: null,
  mode: "github",
  month: currentMonth(),
  editingTransactionId: null,
  editingAccountId: null,
  editingCategoryId: null,
  editingDebtId: null,
  dirty: false,
  saving: false,
};

const DEFAULT_CATEGORIES = [
  ["Paycheque", "income", 0, "#16a34a"],
  ["Housing", "expense", 0, "#2563eb"],
  ["Groceries", "expense", 0, "#ea580c"],
  ["Gas", "expense", 0, "#ca8a04"],
  ["Vehicle", "expense", 0, "#0891b2"],
  ["Debt", "expense", 0, "#dc2626"],
  ["Savings", "expense", 0, "#059669"],
  ["Giving", "expense", 0, "#7c3aed"],
  ["Entertainment", "expense", 0, "#db2777"],
  ["Medical", "expense", 0, "#0f766e"],
];

const els = {
  status: document.getElementById("status"),
  setupView: document.getElementById("setupView"),
  settingsForm: document.getElementById("settingsForm"),
  repoInput: document.getElementById("repoInput"),
  branchInput: document.getElementById("branchInput"),
  tokenInput: document.getElementById("tokenInput"),
  loadReposButton: document.getElementById("loadReposButton"),
  demoButton: document.getElementById("demoButton"),
  tabs: document.getElementById("tabs"),
  syncButton: document.getElementById("syncButton"),
  monthInput: document.getElementById("monthInput"),
  incomeValue: document.getElementById("incomeValue"),
  spendingValue: document.getElementById("spendingValue"),
  savingsValue: document.getElementById("savingsValue"),
  budgetValue: document.getElementById("budgetValue"),
  netWorthValue: document.getElementById("netWorthValue"),
  accountBalanceList: document.getElementById("accountBalanceList"),
  categorySpendList: document.getElementById("categorySpendList"),
  transactionForm: document.getElementById("transactionForm"),
  transactionSubmit: document.querySelector("#transactionForm button[type='submit']"),
  txAmount: document.getElementById("txAmount"),
  txType: document.getElementById("txType"),
  txDate: document.getElementById("txDate"),
  txAccount: document.getElementById("txAccount"),
  txCategory: document.getElementById("txCategory"),
  txDebt: document.getElementById("txDebt"),
  txVendor: document.getElementById("txVendor"),
  txNotes: document.getElementById("txNotes"),
  vendorList: document.getElementById("vendorList"),
  transactionSearch: document.getElementById("transactionSearch"),
  transactionList: document.getElementById("transactionList"),
  exportCsvButton: document.getElementById("exportCsvButton"),
  importCsvInput: document.getElementById("importCsvInput"),
  accountForm: document.getElementById("accountForm"),
  accountName: document.getElementById("accountName"),
  accountType: document.getElementById("accountType"),
  accountOpening: document.getElementById("accountOpening"),
  accountNetWorth: document.getElementById("accountNetWorth"),
  accountSubmitButton: document.getElementById("accountSubmitButton"),
  cancelAccountEditButton: document.getElementById("cancelAccountEditButton"),
  accountsList: document.getElementById("accountsList"),
  categoryForm: document.getElementById("categoryForm"),
  categoryName: document.getElementById("categoryName"),
  categoryKind: document.getElementById("categoryKind"),
  categoryLimit: document.getElementById("categoryLimit"),
  categorySubmitButton: document.getElementById("categorySubmitButton"),
  cancelCategoryEditButton: document.getElementById("cancelCategoryEditButton"),
  categoriesList: document.getElementById("categoriesList"),
  expectedIncomeForm: document.getElementById("expectedIncomeForm"),
  expectedIncomeMonth: document.getElementById("expectedIncomeMonth"),
  expectedIncomeCategory: document.getElementById("expectedIncomeCategory"),
  expectedIncomePlanned: document.getElementById("expectedIncomePlanned"),
  budgetForm: document.getElementById("budgetForm"),
  budgetMonth: document.getElementById("budgetMonth"),
  budgetCategory: document.getElementById("budgetCategory"),
  budgetPlanned: document.getElementById("budgetPlanned"),
  budgetCarry: document.getElementById("budgetCarry"),
  resetBudgetDefaultsButton: document.getElementById("resetBudgetDefaultsButton"),
  budgetExpectedValue: document.getElementById("budgetExpectedValue"),
  budgetAllocatedValue: document.getElementById("budgetAllocatedValue"),
  budgetLeftValue: document.getElementById("budgetLeftValue"),
  budgetStatusValue: document.getElementById("budgetStatusValue"),
  budgetsList: document.getElementById("budgetsList"),
  debtForm: document.getElementById("debtForm"),
  debtName: document.getElementById("debtName"),
  debtAccount: document.getElementById("debtAccount"),
  debtBalance: document.getElementById("debtBalance"),
  debtRate: document.getElementById("debtRate"),
  debtMin: document.getElementById("debtMin"),
  debtExtra: document.getElementById("debtExtra"),
  debtSubmitButton: document.getElementById("debtSubmitButton"),
  cancelDebtEditButton: document.getElementById("cancelDebtEditButton"),
  debtsList: document.getElementById("debtsList"),
  reportsList: document.getElementById("reportsList"),
  reportMonthInput: document.getElementById("reportMonthInput"),
  saveDbButton: document.getElementById("saveDbButton"),
  reloadDbButton: document.getElementById("reloadDbButton"),
  resetButton: document.getElementById("resetButton"),
};

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function money(value) {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(Number(value || 0));
}

function displayText(value) {
  const text = String(value || "").replace(/_/g, " ").trim();
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : "";
}

function numberValue(input) {
  const value = Number(String(input.value || "0").replace(/,/g, ""));
  return Number.isFinite(value) ? value : 0;
}

function showStatus(message, isError) {
  els.status.textContent = message;
  els.status.className = "status show" + (isError ? " error" : "");
}

function clearStatusSoon() {
  window.setTimeout(function () {
    if (!state.saving) {
      els.status.className = "status";
      els.status.textContent = "";
    }
  }, 3500);
}

function clearNode(node) {
  while (node.firstChild) {
    node.removeChild(node.firstChild);
  }
}

function setReady(ready) {
  els.setupView.style.display = ready ? "none" : "block";
  els.tabs.classList.toggle("ready", ready);
  document.querySelectorAll(".tab-page").forEach(function (page) {
    page.style.display = ready ? "" : "none";
  });
  updateModeLabels();
}

function activateTab(name) {
  document.querySelectorAll(".tabs button").forEach(function (button) {
    button.classList.toggle("active", button.dataset.tab === name);
  });
  document.querySelectorAll(".tab-page").forEach(function (page) {
    page.classList.remove("active");
  });
  const target = document.getElementById(name + "Tab");
  if (target) {
    target.classList.add("active");
  }
  if (name === "add") {
    window.setTimeout(function () {
      els.txAmount.focus();
    }, 50);
  }
}

function loadSettings() {
  if (window.location.search.indexOf("reset=1") !== -1) {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(DEMO_DB_KEY);
  }
  try {
    const settings = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (settings && settings.mode === "demo") {
      return settings;
    }
    if (settings && settings.repo && settings.branch && settings.token) {
      return settings;
    }
  } catch (_error) {
    return null;
  }
  return null;
}

function saveSettings(settings) {
  state.settings = settings;
  state.mode = settings && settings.mode === "demo" ? "demo" : "github";
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  updateModeLabels();
}

function fillSettingsForm() {
  const settings = state.settings || {};
  setSelectOptions(els.repoInput, settings.repo ? [{ value: settings.repo, label: settings.repo }] : [], "Load repositories");
  setSelectOptions(els.branchInput, settings.branch ? [{ value: settings.branch, label: settings.branch }] : [], "Select repository first");
  els.repoInput.value = settings.repo || "";
  els.branchInput.value = settings.branch || "";
  els.tokenInput.value = settings.token || "";
  updateModeLabels();
}

function updateModeLabels() {
  const demo = state.mode === "demo";
  els.syncButton.textContent = demo ? "Save Demo" : "Sync";
  els.saveDbButton.textContent = demo ? "Save Demo Database" : "Save Database Now";
  els.reloadDbButton.textContent = demo ? "Reload Demo Database" : "Reload From GitHub";
}

function setSelectOptions(select, options, placeholder) {
  clearNode(select);
  const first = document.createElement("option");
  first.value = "";
  first.textContent = placeholder;
  select.appendChild(first);
  options.forEach(function (optionData) {
    const option = document.createElement("option");
    option.value = optionData.value;
    option.textContent = optionData.label;
    select.appendChild(option);
  });
}

function tokenHeaders(token) {
  return {
    Accept: "application/vnd.github+json",
    Authorization: "Bearer " + token,
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

async function githubJson(url, token) {
  const response = await fetch(url, { headers: tokenHeaders(token) });
  if (!response.ok) {
    const body = await response.json().catch(function () {
      return {};
    });
    throw new Error(body.message || "GitHub error " + response.status);
  }
  return response.json();
}

async function loadRepositories() {
  const token = els.tokenInput.value.trim();
  if (!token) {
    showStatus("Paste your GitHub token first.", true);
    return;
  }
  showStatus("Loading repositories from GitHub...");
  const repos = await githubJson(
    "https://api.github.com/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator,organization_member",
    token,
  );
  const options = repos
    .filter(function (repo) { return !repo.archived; })
    .map(function (repo) {
      return { value: repo.full_name, label: repo.full_name + (repo.private ? " (private)" : "") };
    });
  if (!options.length) {
    setSelectOptions(els.repoInput, [], "No repositories found");
    setSelectOptions(els.branchInput, [], "Select repository first");
    showStatus("No repositories were found for this token. Check token repository access.", true);
    return;
  }
  const previousRepo = els.repoInput.value || (state.settings && state.settings.repo) || "";
  setSelectOptions(els.repoInput, options, "Select repository");
  if (previousRepo && options.some(function (option) { return option.value === previousRepo; })) {
    els.repoInput.value = previousRepo;
  }
  showStatus("Repositories loaded. Select one to load branches.");
  if (els.repoInput.value) {
    await loadBranches();
  }
}

async function loadBranches() {
  const token = els.tokenInput.value.trim();
  const repo = els.repoInput.value;
  if (!token || !repo) {
    setSelectOptions(els.branchInput, [], "Select repository first");
    return;
  }
  showStatus("Loading branches...");
  const branches = await githubJson(
    "https://api.github.com/repos/" + repo + "/branches?per_page=100",
    token,
  );
  const options = branches.map(function (branch) {
    return { value: branch.name, label: branch.name };
  });
  const previousBranch = els.branchInput.value || (state.settings && state.settings.branch) || "main";
  setSelectOptions(els.branchInput, options, "Select branch");
  if (options.some(function (option) { return option.value === previousBranch; })) {
    els.branchInput.value = previousBranch;
  } else if (options.length) {
    els.branchInput.value = options[0].value;
  }
  showStatus("Branches loaded.");
  clearStatusSoon();
}

function encodedPath(filename) {
  return filename
    .split("/")
    .filter(Boolean)
    .map(encodeURIComponent)
    .join("/");
}

function apiUrl(filename) {
  return "https://api.github.com/repos/" + state.settings.repo + "/contents/" + encodedPath(filename);
}

function headers() {
  return tokenHeaders(state.settings.token);
}

function bytesToBase64(bytes) {
  let binary = "";
  const chunk = 0x8000;
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(index, index + chunk));
  }
  return btoa(binary);
}

function base64ToBytes(base64) {
  const binary = atob(base64.replace(/\s/g, ""));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

async function githubGetFile(filename) {
  const response = await fetch(apiUrl(filename) + "?ref=" + encodeURIComponent(state.settings.branch), {
    headers: headers(),
  });
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    const body = await response.json().catch(function () {
      return {};
    });
    throw new Error(body.message || "GitHub error " + response.status);
  }
  return response.json();
}

async function githubGetBytes(filename) {
  const file = await githubGetFile(filename);
  if (!file) {
    return { bytes: null, sha: null };
  }
  if (file.content && file.encoding === "base64") {
    return { bytes: base64ToBytes(file.content), sha: file.sha };
  }
  if (file.git_url) {
    const blobResponse = await fetch(file.git_url, { headers: headers() });
    if (!blobResponse.ok) {
      throw new Error("Could not download " + filename + " from GitHub's blob API.");
    }
    const blob = await blobResponse.json();
    if (blob.content && blob.encoding === "base64") {
      return { bytes: base64ToBytes(blob.content), sha: file.sha };
    }
  }
  if (!file.download_url) {
    throw new Error("GitHub did not return downloadable content for " + filename + ".");
  }
  const response = await fetch(file.download_url, { headers: headers() });
  if (!response.ok) {
    throw new Error("Could not download " + filename + " from GitHub.");
  }
  return { bytes: new Uint8Array(await response.arrayBuffer()), sha: file.sha };
}

async function githubPutBytes(filename, bytes, sha) {
  const body = {
    message: "Save Christendom Budgeting database",
    content: bytesToBase64(bytes),
    branch: state.settings.branch,
  };
  if (sha) {
    body.sha = sha;
  }
  const response = await fetch(apiUrl(filename), {
    method: "PUT",
    headers: Object.assign({}, headers(), { "Content-Type": "application/json" }),
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const error = await response.json().catch(function () {
      return {};
    });
    const message = error.message || "GitHub error " + response.status;
    if (response.status === 409) {
      throw new Error("GitHub has a newer database version. Reload from GitHub before saving again.");
    }
    throw new Error(message);
  }
  return response.json();
}

async function loadSqlJsLibrary() {
  if (state.SQL) {
    return state.SQL;
  }
  if (typeof initSqlJs !== "function") {
    throw new Error("SQLite engine did not load. Check that sql-wasm.js is available from the CDN.");
  }
  state.SQL = await initSqlJs({
    locateFile: function (file) {
      return "https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/" + file;
    },
  });
  return state.SQL;
}

function all(sql, params) {
  const stmt = state.db.prepare(sql);
  const rows = [];
  try {
    if (params) {
      stmt.bind(params);
    }
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
  } finally {
    stmt.free();
  }
  return rows;
}

function one(sql, params) {
  const rows = all(sql, params);
  return rows.length ? rows[0] : null;
}

function scalar(sql, params, key) {
  const row = one(sql, params);
  if (!row) {
    return 0;
  }
  if (key) {
    return row[key] || 0;
  }
  const keys = Object.keys(row);
  return keys.length ? row[keys[0]] || 0 : 0;
}

function run(sql, params) {
  state.db.run(sql, params || []);
  state.dirty = true;
}

function migrateDatabase() {
  state.db.run("PRAGMA foreign_keys = ON");
  state.db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      opening_balance REAL NOT NULL DEFAULT 0,
      include_in_net_worth INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      kind TEXT NOT NULL CHECK (kind IN ('income','expense')),
      monthly_limit REAL NOT NULL DEFAULT 0,
      color TEXT NOT NULL DEFAULT '#64748b',
      is_default INTEGER NOT NULL DEFAULT 0,
      UNIQUE(name, kind)
    );
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      debt_id INTEGER REFERENCES debts(id) ON DELETE SET NULL,
      date TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('income','expense')),
      amount REAL NOT NULL CHECK (amount >= 0),
      vendor TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      recurring_transaction_id INTEGER,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      month TEXT NOT NULL,
      category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
      planned REAL NOT NULL DEFAULT 0,
      carry_forward INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(month, category_id)
    );
    CREATE TABLE IF NOT EXISTS recurring_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      type TEXT NOT NULL CHECK (type IN ('income','expense')),
      amount REAL NOT NULL CHECK (amount >= 0),
      vendor TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      frequency TEXT NOT NULL DEFAULT 'monthly',
      next_date TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS debts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      balance REAL NOT NULL DEFAULT 0,
      interest_rate REAL NOT NULL DEFAULT 0,
      minimum_payment REAL NOT NULL DEFAULT 0,
      extra_payment REAL NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
    CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
    CREATE INDEX IF NOT EXISTS idx_budgets_month ON budgets(month);
    CREATE INDEX IF NOT EXISTS idx_debts_account ON debts(account_id);
  `);
  const columns = all("PRAGMA table_info(transactions)").map(function (row) {
    return row.name;
  });
  if (columns.indexOf("source") === -1) {
    state.db.run("ALTER TABLE transactions ADD COLUMN source TEXT NOT NULL DEFAULT 'desktop'");
  }
  if (columns.indexOf("external_id") === -1) {
    state.db.run("ALTER TABLE transactions ADD COLUMN external_id TEXT");
  }
  if (columns.indexOf("debt_id") === -1) {
    state.db.run("ALTER TABLE transactions ADD COLUMN debt_id INTEGER REFERENCES debts(id) ON DELETE SET NULL");
  }
  state.db.run(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_source_external
    ON transactions(source, external_id)
    WHERE external_id IS NOT NULL AND external_id <> ''
  `);
  state.db.run("CREATE INDEX IF NOT EXISTS idx_transactions_debt ON transactions(debt_id)");
  if (Number(scalar("SELECT COUNT(*) count FROM categories", [], "count")) === 0) {
    DEFAULT_CATEGORIES.forEach(function (category) {
      state.db.run(
        "INSERT INTO categories(name, kind, monthly_limit, color, is_default) VALUES (?, ?, ?, ?, 1)",
        category,
      );
    });
  }
}

function categoryId(name, kind) {
  const row = one("SELECT id FROM categories WHERE name = ? AND kind = ?", [name, kind]);
  return row ? Number(row.id) : null;
}

function accountId(name) {
  const row = one("SELECT id FROM accounts WHERE name = ?", [name]);
  return row ? Number(row.id) : null;
}

function debtCategoryId() {
  let id = categoryId("Debt", "expense");
  if (!id) {
    run("INSERT INTO categories(name, kind, monthly_limit, color, is_default) VALUES ('Debt', 'expense', 0, '#dc2626', 1)");
    id = categoryId("Debt", "expense");
  }
  return id;
}

function monthlyDebtPaymentTotal() {
  return Number(scalar(
    "SELECT COALESCE(SUM(minimum_payment + extra_payment), 0) total FROM debts",
    [],
    "total",
  ));
}

function syncDebtBudget(month) {
  const debtTotal = monthlyDebtPaymentTotal();
  const category = debtCategoryId();
  if (!category) {
    return;
  }
  if (debtTotal > 0) {
    run(
      `INSERT INTO budgets(month, category_id, planned, carry_forward)
       VALUES (?, ?, ?, 0)
       ON CONFLICT(month, category_id)
       DO UPDATE SET planned = excluded.planned, updated_at = CURRENT_TIMESTAMP`,
      [month, category, debtTotal],
    );
  } else {
    run("DELETE FROM budgets WHERE month = ? AND category_id = ?", [month, category]);
  }
}

function syncDebtBudgetIfNeeded(month) {
  if (monthlyDebtPaymentTotal() <= 0) {
    return false;
  }
  const category = debtCategoryId();
  if (!category) {
    return false;
  }
  const current = Number(scalar(
    "SELECT COALESCE(planned, 0) planned FROM budgets WHERE month = ? AND category_id = ?",
    [month, category],
    "planned",
  ));
  const expected = monthlyDebtPaymentTotal();
  if (Math.abs(current - expected) < 0.005) {
    return false;
  }
  syncDebtBudget(month);
  return true;
}

async function setBudgetMonth(month) {
  state.month = month || currentMonth();
  const synced = syncDebtBudgetIfNeeded(state.month);
  if (synced) {
    await saveAfterChange("Debt payment budget updated for " + state.month + ".");
  } else {
    renderAll();
  }
}

function transactionDebtImpact(tx) {
  if (!tx || !tx.debt_id || tx.type !== "expense") {
    return 0;
  }
  return Number(tx.amount || 0);
}

function applyDebtImpact(tx, undo) {
  const impact = transactionDebtImpact(tx);
  if (!impact) {
    return;
  }
  if (undo) {
    run("UPDATE debts SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [impact, Number(tx.debt_id)]);
  } else {
    run("UPDATE debts SET balance = balance - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [impact, Number(tx.debt_id)]);
  }
}

function addBudgetLine(month, categoryName, kind, planned) {
  const id = categoryId(categoryName, kind);
  if (!id) {
    return;
  }
  state.db.run(
    `INSERT INTO budgets(month, category_id, planned, carry_forward)
     VALUES (?, ?, ?, 0)
     ON CONFLICT(month, category_id)
     DO UPDATE SET planned = excluded.planned, updated_at = CURRENT_TIMESTAMP`,
    [month, id, planned],
  );
}

function seedDemoDatabase() {
  if (Number(scalar("SELECT COUNT(*) count FROM accounts", [], "count")) > 0) {
    return false;
  }
  const month = currentMonth();
  state.db.run("UPDATE categories SET monthly_limit = 1600 WHERE name = 'Housing' AND kind = 'expense'");
  state.db.run("UPDATE categories SET monthly_limit = 650 WHERE name = 'Groceries' AND kind = 'expense'");
  state.db.run("UPDATE categories SET monthly_limit = 260 WHERE name = 'Gas' AND kind = 'expense'");
  state.db.run("UPDATE categories SET monthly_limit = 350 WHERE name = 'Debt' AND kind = 'expense'");
  state.db.run("UPDATE categories SET monthly_limit = 750 WHERE name = 'Savings' AND kind = 'expense'");
  state.db.run("UPDATE categories SET monthly_limit = 200 WHERE name = 'Giving' AND kind = 'expense'");
  state.db.run("UPDATE categories SET monthly_limit = 250 WHERE name = 'Entertainment' AND kind = 'expense'");
  state.db.run("UPDATE categories SET monthly_limit = 140 WHERE name = 'Medical' AND kind = 'expense'");
  state.db.run(
    "INSERT INTO accounts(name, type, opening_balance, include_in_net_worth) VALUES (?, ?, ?, ?)",
    ["Chequing", "Chequing", 1250, 1],
  );
  state.db.run(
    "INSERT INTO accounts(name, type, opening_balance, include_in_net_worth) VALUES (?, ?, ?, ?)",
    ["Savings", "Savings", 5200, 1],
  );
  state.db.run(
    "INSERT INTO accounts(name, type, opening_balance, include_in_net_worth) VALUES (?, ?, ?, ?)",
    ["Credit Card", "Credit Card", 0, 1],
  );
  const chequing = accountId("Chequing");
  const savings = accountId("Savings");
  const creditCard = accountId("Credit Card");
  const paycheque = categoryId("Paycheque", "income");
  const housing = categoryId("Housing", "expense");
  const groceries = categoryId("Groceries", "expense");
  const gas = categoryId("Gas", "expense");
  const savingsCategory = categoryId("Savings", "expense");
  const entertainment = categoryId("Entertainment", "expense");
  const debt = categoryId("Debt", "expense");
  [
    [chequing, paycheque, month + "-01", "income", 4200, "Employer", "Demo paycheque"],
    [chequing, housing, month + "-02", "expense", 1600, "Rent", ""],
    [creditCard, groceries, month + "-04", "expense", 86.42, "Market", "Weekly groceries"],
    [creditCard, gas, month + "-07", "expense", 63.18, "Gas Station", ""],
    [savings, savingsCategory, month + "-08", "expense", 750, "Savings Transfer", ""],
    [creditCard, entertainment, month + "-10", "expense", 42.5, "Coffee", "Demo transaction"],
    [chequing, debt, month + "-12", "expense", 350, "Car Loan", "Minimum plus extra"],
  ].forEach(function (tx) {
    state.db.run(
      "INSERT INTO transactions(account_id, category_id, date, type, amount, vendor, notes, source, external_id) VALUES (?, ?, ?, ?, ?, ?, ?, 'demo', ?)",
      tx.concat(["demo-" + tx[2] + "-" + tx[5].toLowerCase().replace(/\s+/g, "-")]),
    );
  });
  addBudgetLine(month, "Paycheque", "income", 4200);
  addBudgetLine(month, "Housing", "expense", 1600);
  addBudgetLine(month, "Groceries", "expense", 650);
  addBudgetLine(month, "Gas", "expense", 260);
  addBudgetLine(month, "Debt", "expense", 350);
  addBudgetLine(month, "Savings", "expense", 750);
  addBudgetLine(month, "Giving", "expense", 200);
  addBudgetLine(month, "Entertainment", "expense", 250);
  addBudgetLine(month, "Medical", "expense", 140);
  state.db.run(
    "INSERT INTO debts(account_id, name, balance, interest_rate, minimum_payment, extra_payment) VALUES (?, ?, ?, ?, ?, ?)",
    [creditCard, "Credit Card", 625, 19.99, 75, 50],
  );
  state.db.run(
    "INSERT INTO debts(account_id, name, balance, interest_rate, minimum_payment, extra_payment) VALUES (?, ?, ?, ?, ?, ?)",
    [null, "Car Loan", 8400, 6.5, 300, 50],
  );
  return true;
}

async function openDatabase() {
  if (state.settings && state.settings.mode === "demo") {
    await openDemoDatabase();
    return;
  }
  showStatus("Opening SQLite database from GitHub...");
  const SQL = await loadSqlJsLibrary();
  const result = await githubGetBytes(DB_FILENAME);
  state.dbSha = result.sha;
  state.db = result.bytes ? new SQL.Database(result.bytes) : new SQL.Database();
  migrateDatabase();
  state.dirty = !result.bytes;
  syncDebtBudgetIfNeeded(state.month);
  renderAll();
  setReady(true);
  activateTab("add");
  showStatus(result.bytes ? "Database loaded. Ready to enter transactions." : "No database found. A new one is ready to save.");
  clearStatusSoon();
}

async function openDemoDatabase() {
  showStatus("Opening demo database...");
  const SQL = await loadSqlJsLibrary();
  const saved = localStorage.getItem(DEMO_DB_KEY);
  state.dbSha = null;
  state.db = saved ? new SQL.Database(base64ToBytes(saved)) : new SQL.Database();
  migrateDatabase();
  const seeded = seedDemoDatabase();
  state.dirty = seeded;
  syncDebtBudgetIfNeeded(state.month);
  renderAll();
  setReady(true);
  activateTab("add");
  if (seeded || !saved) {
    localStorage.setItem(DEMO_DB_KEY, bytesToBase64(state.db.export()));
    state.dirty = false;
  }
  showStatus(seeded ? "Demo budget loaded. Changes stay in this browser only." : "Demo database loaded from this browser.");
  clearStatusSoon();
}

async function saveDatabase() {
  if (!state.db) {
    showStatus("Open a database first.", true);
    return;
  }
  if (state.settings && state.settings.mode === "demo") {
    localStorage.setItem(DEMO_DB_KEY, bytesToBase64(state.db.export()));
    state.dirty = false;
    showStatus("Demo database saved in this browser.");
    clearStatusSoon();
    return;
  }
  state.saving = true;
  showStatus("Saving budget.sqlite3 to GitHub...");
  try {
    const bytes = state.db.export();
    const result = await githubPutBytes(DB_FILENAME, bytes, state.dbSha);
    state.dbSha = result.content ? result.content.sha : state.dbSha;
    state.dirty = false;
    showStatus("Database saved to GitHub.");
    clearStatusSoon();
  } catch (error) {
    showStatus(error.message, true);
    throw error;
  } finally {
    state.saving = false;
  }
}

async function saveAfterChange(message) {
  renderAll();
  await saveDatabase();
  if (message) {
    showStatus(message);
    clearStatusSoon();
  }
}

function accountsWithBalances() {
  return all(`
    SELECT a.*,
      a.opening_balance + COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE -t.amount END), 0) AS current_balance
    FROM accounts a
    LEFT JOIN transactions t ON t.account_id = a.id
    GROUP BY a.id
    ORDER BY a.name
  `);
}

function dashboardData() {
  const totals = one(
    "SELECT COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE 0 END), 0) income, COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END), 0) spending FROM transactions WHERE substr(date, 1, 7) = ?",
    [state.month],
  ) || { income: 0, spending: 0 };
  const planned = Number(scalar(
    "SELECT COALESCE(SUM(b.planned), 0) planned FROM budgets b JOIN categories c ON c.id = b.category_id WHERE b.month = ? AND c.kind = 'expense'",
    [state.month],
    "planned",
  ));
  const expectedIncome = Number(scalar(
    "SELECT COALESCE(SUM(b.planned), 0) planned FROM budgets b JOIN categories c ON c.id = b.category_id WHERE b.month = ? AND c.kind = 'income'",
    [state.month],
    "planned",
  ));
  const accounts = accountsWithBalances();
  const debtTotal = Number(scalar("SELECT COALESCE(SUM(balance), 0) total FROM debts", [], "total"));
  const netWorth = accounts.reduce(function (sum, account) {
    return account.include_in_net_worth ? sum + Number(account.current_balance || 0) : sum;
  }, 0) - debtTotal;
  return {
    income: Number(totals.income || 0),
    spending: Number(totals.spending || 0),
    planned,
    expectedIncome,
    netWorth,
    accounts,
  };
}

function zeroBudgetSummary(month) {
  const expectedIncome = Number(scalar(
    "SELECT COALESCE(SUM(b.planned), 0) planned FROM budgets b JOIN categories c ON c.id = b.category_id WHERE b.month = ? AND c.kind = 'income'",
    [month],
    "planned",
  ));
  const allocated = Number(scalar(
    "SELECT COALESCE(SUM(b.planned), 0) planned FROM budgets b JOIN categories c ON c.id = b.category_id WHERE b.month = ? AND c.kind = 'expense'",
    [month],
    "planned",
  ));
  return {
    expectedIncome: expectedIncome,
    allocated: allocated,
    left: expectedIncome - allocated,
  };
}

function renderAll() {
  if (!state.db) {
    return;
  }
  els.monthInput.value = state.month;
  els.reportMonthInput.value = state.month;
  els.expectedIncomeMonth.value = state.month;
  els.budgetMonth.value = state.month;
  renderSelectors();
  renderDashboard();
  renderTransactions();
  renderAccounts();
  renderCategories();
  renderBudgets();
  renderDebts();
  renderReports();
}

function renderSelectors() {
  const accounts = all("SELECT * FROM accounts ORDER BY name");
  const categories = all("SELECT * FROM categories ORDER BY kind, name");
  const debts = all("SELECT * FROM debts ORDER BY name");
  const oldAccount = els.txAccount.value;
  const oldDebtAccount = els.debtAccount.value;
  const oldTransactionDebt = els.txDebt.value;
  clearNode(els.txAccount);
  clearNode(els.debtAccount);
  clearNode(els.txDebt);
  const noDebtAccount = document.createElement("option");
  noDebtAccount.value = "";
  noDebtAccount.textContent = "No Linked Account";
  els.debtAccount.appendChild(noDebtAccount);
  const noTransactionDebt = document.createElement("option");
  noTransactionDebt.value = "";
  noTransactionDebt.textContent = "No Linked Debt";
  els.txDebt.appendChild(noTransactionDebt);
  accounts.forEach(function (account) {
    const label = account.name + " (" + displayText(account.type) + ")";
    const option = document.createElement("option");
    option.value = account.id;
    option.textContent = label;
    els.txAccount.appendChild(option);
    const debtOption = document.createElement("option");
    debtOption.value = account.id;
    debtOption.textContent = label;
    els.debtAccount.appendChild(debtOption);
  });
  els.txAccount.value = oldAccount || (accounts[0] ? String(accounts[0].id) : "");
  els.debtAccount.value = oldDebtAccount || "";
  debts.forEach(function (debt) {
    const option = document.createElement("option");
    option.value = debt.id;
    option.textContent = debt.name + " (" + money(debt.balance) + ")";
    els.txDebt.appendChild(option);
  });
  els.txDebt.value = oldTransactionDebt || "";
  fillCategorySelect(els.txCategory, categories, els.txType.value, true);
  fillCategorySelect(els.expectedIncomeCategory, categories, "income", false);
  fillCategorySelect(els.budgetCategory, categories, "expense", false);
  const vendors = all("SELECT vendor, COUNT(*) count FROM transactions WHERE TRIM(vendor) <> '' GROUP BY vendor ORDER BY count DESC, vendor LIMIT 100");
  clearNode(els.vendorList);
  vendors.forEach(function (row) {
    const option = document.createElement("option");
    option.value = row.vendor;
    els.vendorList.appendChild(option);
  });
}

function fillCategorySelect(select, categories, kind, allowEmpty) {
  const current = select.value;
  clearNode(select);
  if (allowEmpty) {
    const empty = document.createElement("option");
    empty.value = "";
    empty.textContent = "No Category";
    select.appendChild(empty);
  }
  categories.filter(function (category) {
    return category.kind === kind;
  }).forEach(function (category) {
    const option = document.createElement("option");
    option.value = category.id;
    option.textContent = category.name;
    select.appendChild(option);
  });
  select.value = current;
  if (!select.value && !allowEmpty && select.options.length) {
    select.value = select.options[0].value;
  }
}

function chooseDebtCategory() {
  const id = categoryId("Debt", "expense");
  if (id) {
    els.txCategory.value = String(id);
  }
}

function addRow(container, title, amount, detail, amountClass, actions) {
  const item = document.createElement("div");
  item.className = "row";
  const top = document.createElement("div");
  top.className = "row-top";
  const left = document.createElement("span");
  left.textContent = title;
  const right = document.createElement("span");
  right.className = amountClass || "";
  right.textContent = amount || "";
  top.appendChild(left);
  top.appendChild(right);
  const sub = document.createElement("div");
  sub.className = "row-sub";
  sub.textContent = detail || "";
  item.appendChild(top);
  item.appendChild(sub);
  if (actions && actions.length) {
    const tools = document.createElement("div");
    tools.className = "row-actions";
    actions.forEach(function (action) {
      const button = document.createElement("button");
      button.className = action.danger ? "danger small" : "secondary small";
      button.type = "button";
      button.dataset.action = action.action;
      button.dataset.id = action.id;
      button.textContent = action.label;
      tools.appendChild(button);
    });
    item.appendChild(tools);
  }
  container.appendChild(item);
}

function renderDashboard() {
  const data = dashboardData();
  const net = data.income - data.spending;
  const remaining = data.planned - data.spending;
  els.incomeValue.textContent = money(data.income);
  els.spendingValue.textContent = money(data.spending);
  els.savingsValue.textContent = money(net);
  els.budgetValue.textContent = money(remaining);
  els.netWorthValue.textContent = money(data.netWorth);
  els.incomeValue.className = data.income > 0 ? "positive" : "";
  els.spendingValue.className = data.spending > data.planned ? "negative" : "positive";
  els.savingsValue.className = net < 0 ? "negative" : "positive";
  els.budgetValue.className = remaining < 0 ? "negative" : "positive";
  clearNode(els.accountBalanceList);
  if (!data.accounts.length) {
    els.accountBalanceList.textContent = "Add an account to start.";
  }
  data.accounts.forEach(function (account) {
    const balance = Number(account.current_balance || 0);
    addRow(els.accountBalanceList, account.name, money(balance), displayText(account.type), balance < 0 ? "negative" : "positive");
  });
  clearNode(els.categorySpendList);
  const spending = all(`
    SELECT COALESCE(c.name, 'Uncategorized') name,
      COALESCE(SUM(t.amount), 0) amount,
      COALESCE(b.planned, 0) planned
    FROM transactions t
    LEFT JOIN categories c ON c.id = t.category_id
    LEFT JOIN budgets b ON b.category_id = c.id AND b.month = ?
    WHERE substr(t.date, 1, 7) = ? AND t.type = 'expense'
    GROUP BY name, b.planned
    ORDER BY amount DESC
  `, [state.month, state.month]);
  if (!spending.length) {
    els.categorySpendList.textContent = "No spending this month.";
  }
  spending.forEach(function (row) {
    const actual = Number(row.amount || 0);
    const planned = Number(row.planned || 0);
    const remaining = planned - actual;
    addRow(
      els.categorySpendList,
      row.name,
      money(actual),
      "Planned " + money(planned) + " - Remaining " + money(remaining),
      actual > planned ? "negative" : "positive",
    );
  });
}

function renderTransactions() {
  clearNode(els.transactionList);
  const search = "%" + String(els.transactionSearch.value || "").toLowerCase() + "%";
  const rows = all(`
    SELECT t.*, a.name account, COALESCE(c.name, '') category, COALESCE(d.name, '') debt
    FROM transactions t
    JOIN accounts a ON a.id = t.account_id
    LEFT JOIN categories c ON c.id = t.category_id
    LEFT JOIN debts d ON d.id = t.debt_id
    WHERE lower(t.vendor || ' ' || t.notes || ' ' || a.name || ' ' || COALESCE(c.name, '') || ' ' || COALESCE(d.name, '')) LIKE ?
    ORDER BY t.date DESC, t.id DESC
    LIMIT 250
  `, [search]);
  if (!rows.length) {
    els.transactionList.textContent = "No transactions found.";
  }
  rows.forEach(function (tx) {
    const title = tx.vendor || tx.notes || tx.category || "Transaction";
    const detail = [tx.date, tx.account, tx.category, tx.debt ? "Debt: " + tx.debt : "", displayText(tx.type), tx.notes].filter(Boolean).join(" - ");
    addRow(els.transactionList, title, money(tx.amount), detail, tx.type === "income" ? "positive" : "negative", [
      { label: "Edit", action: "edit-transaction", id: tx.id },
      { label: "Delete", action: "delete-transaction", id: tx.id, danger: true },
    ]);
  });
}

function renderAccounts() {
  clearNode(els.accountsList);
  const rows = accountsWithBalances();
  if (!rows.length) {
    els.accountsList.textContent = "No accounts yet.";
  }
  rows.forEach(function (account) {
    const balance = Number(account.current_balance || 0);
    addRow(
      els.accountsList,
      account.name,
      money(balance),
      displayText(account.type) + " - Opening " + money(account.opening_balance),
      balance < 0 ? "negative" : "positive",
      [
        { label: "Edit", action: "edit-account", id: account.id },
        { label: "Delete", action: "delete-account", id: account.id, danger: true },
      ],
    );
  });
}

function renderCategories() {
  clearNode(els.categoriesList);
  const rows = all("SELECT * FROM categories ORDER BY kind, name");
  rows.forEach(function (category) {
    addRow(
      els.categoriesList,
      category.name,
      money(category.monthly_limit),
      displayText(category.kind) + " - Default budget",
      "",
      [
        { label: "Edit", action: "edit-category", id: category.id },
        { label: "Delete", action: "delete-category", id: category.id, danger: true },
      ],
    );
  });
}

function renderBudgets() {
  clearNode(els.budgetsList);
  const summary = zeroBudgetSummary(state.month);
  els.budgetExpectedValue.textContent = money(summary.expectedIncome);
  els.budgetAllocatedValue.textContent = money(summary.allocated);
  els.budgetLeftValue.textContent = money(summary.left);
  els.budgetLeftValue.className = Math.abs(summary.left) < 0.005 ? "positive" : "negative";
  els.budgetStatusValue.textContent = Math.abs(summary.left) < 0.005 && summary.expectedIncome > 0 ? "Fully Allocated" : "Needs Allocation";
  els.budgetStatusValue.className = Math.abs(summary.left) < 0.005 && summary.expectedIncome > 0 ? "positive" : "negative";
  const rows = all(`
    SELECT b.*, c.name category_name, c.kind,
      COALESCE(SUM(CASE WHEN t.type='expense' THEN t.amount ELSE 0 END), 0) actual
    FROM budgets b
    JOIN categories c ON c.id = b.category_id
    LEFT JOIN transactions t ON t.category_id = b.category_id AND substr(t.date, 1, 7) = b.month
    WHERE b.month = ?
    GROUP BY b.id
    ORDER BY c.kind DESC, c.name
  `, [state.month]);
  if (!rows.length) {
    els.budgetsList.textContent = "Set expected income, then allocate every dollar to categories.";
  }
  const incomeRows = rows.filter(function (budget) { return budget.kind === "income"; });
  const allocationRows = rows.filter(function (budget) { return budget.kind === "expense"; });
  if (incomeRows.length) {
    const incomeHeader = document.createElement("h3");
    incomeHeader.textContent = "Expected Income";
    incomeHeader.className = "inline-section-title";
    els.budgetsList.appendChild(incomeHeader);
  }
  incomeRows.forEach(function (budget) {
    addRow(
      els.budgetsList,
      budget.category_name,
      money(budget.planned),
      "Expected for " + state.month,
      "positive",
      [{ label: "Delete", action: "delete-budget", id: budget.id, danger: true }],
    );
  });
  if (allocationRows.length) {
    const allocationHeader = document.createElement("h3");
    allocationHeader.textContent = "Allocations";
    allocationHeader.className = "inline-section-title";
    els.budgetsList.appendChild(allocationHeader);
  }
  allocationRows.forEach(function (budget) {
    const remaining = Number(budget.planned || 0) - Number(budget.actual || 0);
    const actual = Number(budget.actual || 0);
    const planned = Number(budget.planned || 0);
    addRow(
      els.budgetsList,
      budget.category_name,
      money(actual),
      "Planned " + money(planned) + " - Remaining " + money(remaining) + (budget.carry_forward ? " - Carry forward" : ""),
      actual > planned ? "negative" : "positive",
      [{ label: "Delete", action: "delete-budget", id: budget.id, danger: true }],
    );
  });
}

function monthsUntilPayoff(balance, annualRate, payment) {
  if (balance <= 0 || payment <= 0) {
    return null;
  }
  const monthlyRate = annualRate / 100 / 12;
  let months = 0;
  while (balance > 0.01 && months < 600) {
    const interest = balance * monthlyRate;
    if (payment <= interest && months > 0) {
      return null;
    }
    balance = balance + interest - payment;
    months += 1;
  }
  return months < 600 ? months : null;
}

function renderDebts() {
  clearNode(els.debtsList);
  const rows = all(`
    SELECT d.*, COALESCE(a.name, '') account
    FROM debts d
    LEFT JOIN accounts a ON a.id = d.account_id
    ORDER BY d.balance DESC
  `);
  if (!rows.length) {
    els.debtsList.textContent = "No debts yet.";
  }
  rows.forEach(function (debt) {
    const payment = Number(debt.minimum_payment || 0) + Number(debt.extra_payment || 0);
    const payoff = monthsUntilPayoff(Number(debt.balance || 0), Number(debt.interest_rate || 0), payment);
    const payoffText = payoff === null ? "No projection" : Math.floor(payoff / 12) + "y " + (payoff % 12) + "m";
    addRow(
      els.debtsList,
      debt.name,
      money(debt.balance),
      [debt.account, Number(debt.interest_rate || 0) + "%", "Payment " + money(payment), payoffText].filter(Boolean).join(" - "),
      "negative",
      [
        { label: "Edit", action: "edit-debt", id: debt.id },
        { label: "Delete", action: "delete-debt", id: debt.id, danger: true },
      ],
    );
  });
}

function renderReports() {
  clearNode(els.reportsList);
  renderReportSummary();
  renderMonthlyTrendReport();
  renderBudgetPerformanceReport();
  renderCategoryReport();
  renderIncomeReport();
  renderAccountReport();
  renderDebtReport();
}

function addReportSection(title) {
  const section = document.createElement("section");
  section.className = "report-section";
  const heading = document.createElement("h3");
  heading.textContent = title;
  section.appendChild(heading);
  const list = document.createElement("div");
  list.className = "list";
  section.appendChild(list);
  els.reportsList.appendChild(section);
  return list;
}

function pct(value) {
  return Number(value || 0).toFixed(1) + "%";
}

function renderReportSummary() {
  const summary = dashboardData();
  const zeroSummary = zeroBudgetSummary(state.month);
  const net = summary.income - summary.spending;
  const savingsRate = summary.income ? (net / summary.income) * 100 : 0;
  const budgetRemaining = summary.planned - summary.spending;
  const list = addReportSection("This Month Summary");
  addRow(list, "Actual income", money(summary.income), "Expected " + money(zeroSummary.expectedIncome), "positive");
  addRow(list, "Allocated", money(zeroSummary.allocated), "Left to allocate " + money(zeroSummary.left), Math.abs(zeroSummary.left) < 0.005 ? "positive" : "negative");
  addRow(list, "Spending", money(summary.spending), summary.planned ? "Budget " + money(summary.planned) : "No budget set", summary.spending > summary.planned ? "negative" : "positive");
  addRow(list, "Net savings", money(net), "Savings rate " + pct(savingsRate), net < 0 ? "negative" : "positive");
  addRow(list, "Budget remaining", money(budgetRemaining), budgetRemaining < 0 ? "Over budget" : "Under budget", budgetRemaining < 0 ? "negative" : "positive");
  addRow(list, "Net worth", money(summary.netWorth), "Accounts minus tracked debts", summary.netWorth < 0 ? "negative" : "positive");
}

function renderMonthlyTrendReport() {
  const rows = all(`
    SELECT substr(date, 1, 7) month,
      COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE 0 END), 0) income,
      COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END), 0) spending
    FROM transactions
    GROUP BY month
    ORDER BY month DESC
    LIMIT 24
  `);
  const list = addReportSection("Monthly Cash Flow");
  if (!rows.length) {
    list.textContent = "No report data yet.";
    return;
  }
  rows.forEach(function (row) {
    const income = Number(row.income || 0);
    const spending = Number(row.spending || 0);
    const net = income - spending;
    const savingsRate = income ? (net / income) * 100 : 0;
    addRow(
      list,
      row.month,
      money(net),
      "Income " + money(income) + " - Spending " + money(spending) + " - Savings rate " + savingsRate.toFixed(1) + "%",
      net < 0 ? "negative" : "positive",
    );
  });
}

function renderBudgetPerformanceReport() {
  const rows = all(`
    SELECT c.name category,
      b.planned,
      COALESCE(SUM(CASE WHEN t.type='expense' THEN t.amount ELSE 0 END), 0) actual
    FROM budgets b
    JOIN categories c ON c.id = b.category_id
    LEFT JOIN transactions t ON t.category_id = b.category_id AND substr(t.date, 1, 7) = b.month
    WHERE b.month = ? AND c.kind = 'expense'
    GROUP BY b.id
    ORDER BY (b.planned - actual) ASC
  `, [state.month]);
  const list = addReportSection("Budget Performance");
  if (!rows.length) {
    list.textContent = "No budget lines for this month.";
    return;
  }
  rows.forEach(function (row) {
    const planned = Number(row.planned || 0);
    const actual = Number(row.actual || 0);
    const remaining = planned - actual;
    const used = planned ? (actual / planned) * 100 : 0;
    addRow(
      list,
      row.category,
      money(remaining),
      "Planned " + money(planned) + " - Actual " + money(actual) + " - Used " + pct(used),
      remaining < 0 ? "negative" : "positive",
    );
  });
}

function renderCategoryReport() {
  const rows = all(`
    SELECT COALESCE(c.name, 'Uncategorized') category,
      COUNT(t.id) count,
      COALESCE(SUM(t.amount), 0) amount
    FROM transactions t
    LEFT JOIN categories c ON c.id = t.category_id
    WHERE substr(t.date, 1, 7) = ? AND t.type = 'expense'
    GROUP BY category
    ORDER BY amount DESC
    LIMIT 12
  `, [state.month]);
  const total = rows.reduce(function (sum, row) { return sum + Number(row.amount || 0); }, 0);
  const list = addReportSection("Top Spending Categories");
  if (!rows.length) {
    list.textContent = "No expenses this month.";
    return;
  }
  rows.forEach(function (row) {
    const share = total ? (Number(row.amount || 0) / total) * 100 : 0;
    addRow(list, row.category, money(row.amount), row.count + " transaction(s) - " + pct(share) + " of spending", "negative");
  });
}

function renderIncomeReport() {
  const rows = all(`
    SELECT COALESCE(c.name, 'Uncategorized') category,
      COUNT(t.id) count,
      COALESCE(SUM(t.amount), 0) amount
    FROM transactions t
    LEFT JOIN categories c ON c.id = t.category_id
    WHERE substr(t.date, 1, 7) = ? AND t.type = 'income'
    GROUP BY category
    ORDER BY amount DESC
    LIMIT 10
  `, [state.month]);
  const list = addReportSection("Income Sources");
  if (!rows.length) {
    list.textContent = "No income this month.";
    return;
  }
  rows.forEach(function (row) {
    addRow(list, row.category, money(row.amount), row.count + " transaction(s)", "positive");
  });
}

function renderAccountReport() {
  const rows = accountsWithBalances();
  const list = addReportSection("Account Balances");
  if (!rows.length) {
    list.textContent = "No accounts yet.";
    return;
  }
  rows.forEach(function (account) {
    const balance = Number(account.current_balance || 0);
    addRow(list, account.name, money(balance), displayText(account.type) + " - Opening " + money(account.opening_balance), balance < 0 ? "negative" : "positive");
  });
}

function renderDebtReport() {
  const debts = all("SELECT * FROM debts ORDER BY balance DESC");
  const list = addReportSection("Debt Payoff");
  if (!debts.length) {
    list.textContent = "No debts tracked.";
    return;
  }
  const total = debts.reduce(function (sum, debt) { return sum + Number(debt.balance || 0); }, 0);
  addRow(list, "Total tracked debt", money(total), debts.length + " debt account(s)", "negative");
  debts.forEach(function (debt) {
    const payment = Number(debt.minimum_payment || 0) + Number(debt.extra_payment || 0);
    const payoff = monthsUntilPayoff(Number(debt.balance || 0), Number(debt.interest_rate || 0), payment);
    const payoffText = payoff === null ? "No projection" : Math.floor(payoff / 12) + "y " + (payoff % 12) + "m";
    addRow(list, debt.name, money(debt.balance), "Payment " + money(payment) + " - " + Number(debt.interest_rate || 0) + "% - " + payoffText, "negative");
  });
}

async function saveTransaction(event) {
  event.preventDefault();
  if (!state.db) {
    showStatus("Open the database first.", true);
    return;
  }
  const accountId = Number(els.txAccount.value || 0);
  const debtId = els.txDebt.value ? Number(els.txDebt.value) : null;
  const categoryId = els.txCategory.value ? Number(els.txCategory.value) : (debtId ? debtCategoryId() : null);
  const amount = Math.abs(numberValue(els.txAmount));
  if (!accountId || amount <= 0) {
    showStatus("Choose an account and enter an amount.", true);
    return;
  }
  if (debtId && els.txType.value !== "expense") {
    showStatus("Linked debt transactions must be expenses.", true);
    return;
  }
  if (state.editingTransactionId) {
    const oldTx = one("SELECT * FROM transactions WHERE id = ?", [state.editingTransactionId]);
    applyDebtImpact(oldTx, true);
    run(
      `UPDATE transactions
       SET account_id = ?, category_id = ?, debt_id = ?, date = ?, type = ?, amount = ?, vendor = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [accountId, categoryId, debtId, els.txDate.value || today(), els.txType.value, amount, els.txVendor.value.trim(), els.txNotes.value.trim(), state.editingTransactionId],
    );
    applyDebtImpact({ debt_id: debtId, type: els.txType.value, amount: amount }, false);
    state.editingTransactionId = null;
    els.transactionSubmit.textContent = "Save Transaction";
  } else {
    run(
      `INSERT INTO transactions(account_id, category_id, debt_id, date, type, amount, vendor, notes, source, external_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'web', ?)`,
      [
        accountId,
        categoryId,
        debtId,
        els.txDate.value || today(),
        els.txType.value,
        amount,
        els.txVendor.value.trim(),
        els.txNotes.value.trim(),
        "web-" + Date.now() + "-" + Math.random().toString(16).slice(2),
      ],
    );
    applyDebtImpact({ debt_id: debtId, type: els.txType.value, amount: amount }, false);
  }
  const keepDate = els.txDate.value;
  const keepAccount = els.txAccount.value;
  const keepCategory = els.txCategory.value;
  const keepType = els.txType.value;
  const keepDebt = els.txDebt.value;
  els.transactionForm.reset();
  els.txDate.value = keepDate || today();
  els.txType.value = keepType || "expense";
  renderSelectors();
  els.txAccount.value = keepAccount;
  els.txCategory.value = keepCategory;
  els.txDebt.value = keepDebt;
  await saveAfterChange("Transaction saved.");
  els.txAmount.focus();
}

function editTransaction(id) {
  const tx = one("SELECT * FROM transactions WHERE id = ?", [Number(id)]);
  if (!tx) {
    return;
  }
  state.editingTransactionId = Number(id);
  els.txAmount.value = tx.amount;
  els.txType.value = tx.type;
  els.txDate.value = tx.date;
  renderSelectors();
  els.txAccount.value = tx.account_id;
  els.txCategory.value = tx.category_id || "";
  els.txDebt.value = tx.debt_id || "";
  els.txVendor.value = tx.vendor || "";
  els.txNotes.value = tx.notes || "";
  els.transactionSubmit.textContent = "Update Transaction";
  activateTab("add");
}

async function deleteById(table, id, message) {
  run("DELETE FROM " + table + " WHERE id = ?", [Number(id)]);
  await saveAfterChange(message);
}

async function deleteTransaction(id) {
  const tx = one("SELECT * FROM transactions WHERE id = ?", [Number(id)]);
  applyDebtImpact(tx, true);
  run("DELETE FROM transactions WHERE id = ?", [Number(id)]);
  await saveAfterChange("Transaction deleted.");
}

async function deleteDebt(id) {
  if (state.editingDebtId === Number(id)) {
    clearDebtEditMode();
  }
  run("DELETE FROM debts WHERE id = ?", [Number(id)]);
  syncDebtBudget(state.month);
  await saveAfterChange("Debt deleted. Monthly debt budget updated.");
}

async function deleteAccount(id) {
  if (state.editingAccountId === Number(id)) {
    clearAccountEditMode();
  }
  run("DELETE FROM accounts WHERE id = ?", [Number(id)]);
  await saveAfterChange("Account deleted.");
}

async function saveAccount(event) {
  event.preventDefault();
  const name = els.accountName.value.trim();
  if (!name) {
    showStatus("Account name is required.", true);
    return;
  }
  const values = [
    name,
    els.accountType.value.trim() || "Chequing",
    numberValue(els.accountOpening),
    els.accountNetWorth.checked ? 1 : 0,
  ];
  if (state.editingAccountId) {
    run(
      "UPDATE accounts SET name = ?, type = ?, opening_balance = ?, include_in_net_worth = ? WHERE id = ?",
      values.concat([state.editingAccountId]),
    );
    clearAccountEditMode();
    await saveAfterChange("Account updated.");
    return;
  }
  run(
    "INSERT INTO accounts(name, type, opening_balance, include_in_net_worth) VALUES (?, ?, ?, ?)",
    values,
  );
  els.accountForm.reset();
  els.accountNetWorth.checked = true;
  await saveAfterChange("Account added.");
}

function editAccount(id) {
  const account = one("SELECT * FROM accounts WHERE id = ?", [Number(id)]);
  if (!account) {
    return;
  }
  state.editingAccountId = Number(id);
  els.accountName.value = account.name || "";
  els.accountType.value = account.type || "";
  els.accountOpening.value = account.opening_balance || "";
  els.accountNetWorth.checked = Number(account.include_in_net_worth || 0) === 1;
  els.accountSubmitButton.textContent = "Update Account";
  els.cancelAccountEditButton.classList.remove("hidden");
  activateTab("accounts");
  window.setTimeout(function () {
    els.accountName.focus();
  }, 50);
}

function clearAccountEditMode() {
  state.editingAccountId = null;
  els.accountForm.reset();
  els.accountNetWorth.checked = true;
  els.accountSubmitButton.textContent = "Add Account";
  els.cancelAccountEditButton.classList.add("hidden");
}

async function saveCategory(event) {
  event.preventDefault();
  const name = els.categoryName.value.trim();
  if (!name) {
    showStatus("Category name is required.", true);
    return;
  }
  try {
    if (state.editingCategoryId) {
      run(
        "UPDATE categories SET name = ?, kind = ?, monthly_limit = ? WHERE id = ?",
        [name, els.categoryKind.value, numberValue(els.categoryLimit), state.editingCategoryId],
      );
      clearCategoryEditMode();
      await saveAfterChange("Category updated.");
    } else {
      run("INSERT INTO categories(name, kind, monthly_limit) VALUES (?, ?, ?)", [name, els.categoryKind.value, numberValue(els.categoryLimit)]);
      els.categoryForm.reset();
      els.categoryKind.value = "expense";
      await saveAfterChange("Category added.");
    }
  } catch (error) {
    showStatus("Could not save category. Another category with that name and kind may already exist.", true);
  }
}

function editCategory(id) {
  const category = one("SELECT * FROM categories WHERE id = ?", [Number(id)]);
  if (!category) {
    return;
  }
  state.editingCategoryId = Number(id);
  els.categoryName.value = category.name || "";
  els.categoryKind.value = category.kind || "expense";
  els.categoryLimit.value = category.monthly_limit || "";
  els.categorySubmitButton.textContent = "Update Category";
  els.cancelCategoryEditButton.classList.remove("hidden");
  activateTab("categories");
  window.setTimeout(function () {
    els.categoryName.focus();
  }, 50);
}

function clearCategoryEditMode() {
  state.editingCategoryId = null;
  els.categoryForm.reset();
  els.categoryKind.value = "expense";
  els.categorySubmitButton.textContent = "Add Category";
  els.cancelCategoryEditButton.classList.add("hidden");
}

async function saveExpectedIncome(event) {
  event.preventDefault();
  if (!els.expectedIncomeCategory.value) {
    showStatus("Choose an income category.", true);
    return;
  }
  const planned = numberValue(els.expectedIncomePlanned);
  if (planned <= 0) {
    showStatus("Expected income must be more than zero.", true);
    return;
  }
  const month = els.expectedIncomeMonth.value || state.month;
  run(
    `INSERT INTO budgets(month, category_id, planned, carry_forward)
     VALUES (?, ?, ?, 0)
     ON CONFLICT(month, category_id)
     DO UPDATE SET planned = excluded.planned, updated_at = CURRENT_TIMESTAMP`,
    [month, Number(els.expectedIncomeCategory.value), planned],
  );
  state.month = month;
  els.expectedIncomePlanned.value = "";
  const summary = zeroBudgetSummary(month);
  await saveAfterChange("Expected income saved. Left to allocate: " + money(summary.left) + ".");
}

async function saveBudget(event) {
  event.preventDefault();
  if (!els.budgetCategory.value) {
    showStatus("Choose a category.", true);
    return;
  }
  run(
    `INSERT INTO budgets(month, category_id, planned, carry_forward)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(month, category_id)
     DO UPDATE SET planned = excluded.planned, carry_forward = excluded.carry_forward, updated_at = CURRENT_TIMESTAMP`,
    [els.budgetMonth.value || state.month, Number(els.budgetCategory.value), numberValue(els.budgetPlanned), els.budgetCarry.checked ? 1 : 0],
  );
  state.month = els.budgetMonth.value || state.month;
  syncDebtBudgetIfNeeded(state.month);
  els.budgetPlanned.value = "";
  els.budgetCarry.checked = false;
  const summary = zeroBudgetSummary(state.month);
  await saveAfterChange(
    Math.abs(summary.left) < 0.005
      ? "Allocation saved. Every dollar is allocated."
      : "Allocation saved. Left to allocate: " + money(summary.left) + ".",
  );
}

async function resetBudgetFromDefaults() {
  if (!confirm("Reset this month from category default budgets? Existing planned amounts for those categories will be replaced.")) {
    return;
  }
  const month = els.budgetMonth.value || state.month;
  const rows = all("SELECT id, monthly_limit FROM categories WHERE kind = 'expense' AND monthly_limit > 0");
  rows.forEach(function (category) {
    run(
      `INSERT INTO budgets(month, category_id, planned, carry_forward)
       VALUES (?, ?, ?, 0)
       ON CONFLICT(month, category_id)
       DO UPDATE SET planned = excluded.planned, updated_at = CURRENT_TIMESTAMP`,
      [month, Number(category.id), Number(category.monthly_limit || 0)],
    );
  });
  state.month = month;
  syncDebtBudgetIfNeeded(month);
  const summary = zeroBudgetSummary(month);
  await saveAfterChange("Reset " + rows.length + " allocation(s) from defaults. Left to allocate: " + money(summary.left) + ".");
}

async function saveDebt(event) {
  event.preventDefault();
  const name = els.debtName.value.trim();
  if (!name) {
    showStatus("Debt name is required.", true);
    return;
  }
  const values = [
    els.debtAccount.value ? Number(els.debtAccount.value) : null,
    name,
    numberValue(els.debtBalance),
    numberValue(els.debtRate),
    numberValue(els.debtMin),
    numberValue(els.debtExtra),
  ];
  if (state.editingDebtId) {
    run(
      `UPDATE debts
       SET account_id = ?, name = ?, balance = ?, interest_rate = ?, minimum_payment = ?, extra_payment = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      values.concat([state.editingDebtId]),
    );
    clearDebtEditMode();
    syncDebtBudget(state.month);
    await saveAfterChange("Debt updated. Monthly debt budget updated.");
    return;
  }
  run(
    "INSERT INTO debts(account_id, name, balance, interest_rate, minimum_payment, extra_payment) VALUES (?, ?, ?, ?, ?, ?)",
    values,
  );
  syncDebtBudget(state.month);
  els.debtForm.reset();
  await saveAfterChange("Debt added. Monthly debt budget updated.");
}

function editDebt(id) {
  const debt = one("SELECT * FROM debts WHERE id = ?", [Number(id)]);
  if (!debt) {
    return;
  }
  state.editingDebtId = Number(id);
  els.debtName.value = debt.name || "";
  els.debtAccount.value = debt.account_id || "";
  els.debtBalance.value = debt.balance || "";
  els.debtRate.value = debt.interest_rate || "";
  els.debtMin.value = debt.minimum_payment || "";
  els.debtExtra.value = debt.extra_payment || "";
  els.debtSubmitButton.textContent = "Update Debt";
  els.cancelDebtEditButton.classList.remove("hidden");
  activateTab("debts");
  window.setTimeout(function () {
    els.debtName.focus();
  }, 50);
}

function clearDebtEditMode() {
  state.editingDebtId = null;
  els.debtForm.reset();
  els.debtSubmitButton.textContent = "Add Debt";
  els.cancelDebtEditButton.classList.add("hidden");
}

function exportCsv() {
  const rows = all(`
    SELECT t.date, a.name account, COALESCE(c.name, '') category, COALESCE(d.name, '') debt, t.type, t.amount, t.vendor, t.notes
    FROM transactions t
    JOIN accounts a ON a.id = t.account_id
    LEFT JOIN categories c ON c.id = t.category_id
    LEFT JOIN debts d ON d.id = t.debt_id
    ORDER BY t.date DESC, t.id DESC
  `);
  const header = ["date", "account", "category", "debt", "type", "amount", "vendor", "notes"];
  const lines = [header.join(",")].concat(rows.map(function (row) {
    return header.map(function (key) {
      const value = String(row[key] == null ? "" : row[key]);
      return '"' + value.replace(/"/g, '""') + '"';
    }).join(",");
  }));
  const blob = new Blob([lines.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "local-budget-transactions.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && quoted && next === '"') {
      value += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(value);
      value = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      row.push(value);
      if (row.some(function (cell) { return cell.trim() !== ""; })) {
        rows.push(row);
      }
      row = [];
      value = "";
    } else {
      value += char;
    }
  }
  row.push(value);
  if (row.some(function (cell) { return cell.trim() !== ""; })) {
    rows.push(row);
  }
  return rows;
}

async function importCsvFile(file) {
  const text = await file.text();
  const rows = parseCsv(text);
  if (rows.length < 2) {
    showStatus("CSV file is empty.", true);
    return;
  }
  const header = rows[0].map(function (name) { return name.trim().toLowerCase(); });
  let imported = 0;
  rows.slice(1).forEach(function (cells) {
    const raw = {};
    header.forEach(function (key, index) {
      raw[key] = cells[index] || "";
    });
    const accountName = String(raw.account || "").trim();
    if (!accountName) {
      return;
    }
    let account = one("SELECT * FROM accounts WHERE lower(name) = lower(?)", [accountName]);
    if (!account) {
      run("INSERT INTO accounts(name, type, opening_balance) VALUES (?, 'Chequing', 0)", [accountName]);
      account = one("SELECT * FROM accounts WHERE id = last_insert_rowid()");
    }
    const txType = ["income", "expense"].indexOf(String(raw.type || "").toLowerCase()) !== -1 ? String(raw.type).toLowerCase() : "expense";
    let category = null;
    if (raw.category) {
      category = one("SELECT * FROM categories WHERE lower(name) = lower(?) AND kind = ?", [raw.category.trim(), txType]);
    }
    let debt = null;
    if (raw.debt) {
      debt = one("SELECT * FROM debts WHERE lower(name) = lower(?)", [raw.debt.trim()]);
    }
    if (debt && txType !== "expense") {
      return;
    }
    const amount = Math.abs(Number(raw.amount || 0));
    if (!amount) {
      return;
    }
    run(
      "INSERT INTO transactions(account_id, category_id, debt_id, date, type, amount, vendor, notes, source, external_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'web-csv', ?)",
      [
        account.id,
        category ? category.id : null,
        debt ? debt.id : null,
        raw.date || today(),
        txType,
        amount,
        raw.vendor || "",
        raw.notes || "",
        "csv-" + Date.now() + "-" + imported,
      ],
    );
    applyDebtImpact({ debt_id: debt ? debt.id : null, type: txType, amount: amount }, false);
    imported += 1;
  });
  await saveAfterChange("Imported " + imported + " transaction(s).");
}

function bindEvents() {
  els.demoButton.addEventListener("click", async function () {
    saveSettings({ mode: "demo" });
    try {
      await openDatabase();
    } catch (error) {
      setReady(false);
      showStatus(error.message, true);
    }
  });
  els.loadReposButton.addEventListener("click", function () {
    loadRepositories().catch(function (error) { showStatus(error.message, true); });
  });
  els.repoInput.addEventListener("change", function () {
    loadBranches().catch(function (error) { showStatus(error.message, true); });
  });
  els.settingsForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    if (!els.repoInput.value || !els.branchInput.value) {
      showStatus("Load repositories, then choose a repository and branch.", true);
      return;
    }
    saveSettings({
      repo: els.repoInput.value,
      branch: els.branchInput.value,
      token: els.tokenInput.value.trim(),
    });
    try {
      await openDatabase();
    } catch (error) {
      setReady(false);
      showStatus(error.message, true);
    }
  });
  els.tabs.addEventListener("click", function (event) {
    const button = event.target.closest("button[data-tab]");
    if (button) {
      activateTab(button.dataset.tab);
    }
  });
  els.syncButton.addEventListener("click", function () {
    if (state.settings && state.settings.mode === "demo") {
      saveDatabase().catch(function () {});
      return;
    }
    if (state.dirty) {
      saveDatabase().catch(function () {});
    } else {
      openDatabase().catch(function (error) { showStatus(error.message, true); });
    }
  });
  els.saveDbButton.addEventListener("click", function () {
    saveDatabase().catch(function () {});
  });
  els.reloadDbButton.addEventListener("click", function () {
    openDatabase().catch(function (error) { showStatus(error.message, true); });
  });
  els.resetButton.addEventListener("click", function () {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(DEMO_DB_KEY);
    state.settings = null;
    state.mode = "github";
    state.db = null;
    state.dbSha = null;
    fillSettingsForm();
    setReady(false);
    showStatus("Web settings cleared.");
  });
  els.monthInput.addEventListener("change", function () {
    setBudgetMonth(els.monthInput.value).catch(function (error) { showStatus(error.message, true); });
  });
  els.reportMonthInput.addEventListener("change", function () {
    setBudgetMonth(els.reportMonthInput.value).catch(function (error) { showStatus(error.message, true); });
  });
  els.txType.addEventListener("change", function () {
    if (els.txType.value !== "expense") {
      els.txDebt.value = "";
    }
    renderSelectors();
  });
  els.txDebt.addEventListener("change", function () {
    if (els.txDebt.value) {
      els.txType.value = "expense";
      renderSelectors();
      chooseDebtCategory();
    }
  });
  els.transactionSearch.addEventListener("input", renderTransactions);
  els.transactionForm.addEventListener("submit", function (event) {
    saveTransaction(event).catch(function (error) { showStatus(error.message, true); });
  });
  els.accountForm.addEventListener("submit", function (event) {
    saveAccount(event).catch(function (error) { showStatus(error.message, true); });
  });
  els.cancelAccountEditButton.addEventListener("click", clearAccountEditMode);
  els.categoryForm.addEventListener("submit", function (event) {
    saveCategory(event).catch(function (error) { showStatus(error.message, true); });
  });
  els.cancelCategoryEditButton.addEventListener("click", clearCategoryEditMode);
  els.expectedIncomeForm.addEventListener("submit", function (event) {
    saveExpectedIncome(event).catch(function (error) { showStatus(error.message, true); });
  });
  els.budgetForm.addEventListener("submit", function (event) {
    saveBudget(event).catch(function (error) { showStatus(error.message, true); });
  });
  els.resetBudgetDefaultsButton.addEventListener("click", function () {
    resetBudgetFromDefaults().catch(function (error) { showStatus(error.message, true); });
  });
  els.debtForm.addEventListener("submit", function (event) {
    saveDebt(event).catch(function (error) { showStatus(error.message, true); });
  });
  els.cancelDebtEditButton.addEventListener("click", clearDebtEditMode);
  els.exportCsvButton.addEventListener("click", exportCsv);
  els.importCsvInput.addEventListener("change", function () {
    const file = els.importCsvInput.files[0];
    if (file) {
      importCsvFile(file).catch(function (error) { showStatus(error.message, true); });
    }
  });
  document.body.addEventListener("click", function (event) {
    const button = event.target.closest("button[data-action]");
    if (!button) {
      return;
    }
    const action = button.dataset.action;
    const id = button.dataset.id;
    if (action === "edit-transaction") {
      editTransaction(id);
    } else if (action === "delete-transaction" && confirm("Delete this transaction?")) {
      deleteTransaction(id).catch(function (error) { showStatus(error.message, true); });
    } else if (action === "edit-account") {
      editAccount(id);
    } else if (action === "delete-account" && confirm("Delete this account and its transactions?")) {
      deleteAccount(id).catch(function (error) { showStatus(error.message, true); });
    } else if (action === "edit-category") {
      editCategory(id);
    } else if (action === "delete-category" && confirm("Delete this category? Existing transactions become uncategorized.")) {
      if (state.editingCategoryId === Number(id)) {
        clearCategoryEditMode();
      }
      deleteById("categories", id, "Category deleted.").catch(function (error) { showStatus(error.message, true); });
    } else if (action === "delete-budget" && confirm("Delete this budget line?")) {
      deleteById("budgets", id, "Budget deleted.").catch(function (error) { showStatus(error.message, true); });
    } else if (action === "edit-debt") {
      editDebt(id);
    } else if (action === "delete-debt" && confirm("Delete this debt?")) {
      deleteDebt(id).catch(function (error) { showStatus(error.message, true); });
    }
  });
}

async function init() {
  bindEvents();
  els.txDate.value = today();
  els.monthInput.value = state.month;
  els.reportMonthInput.value = state.month;
  els.budgetMonth.value = state.month;
  state.settings = loadSettings();
  state.mode = state.settings && state.settings.mode === "demo" ? "demo" : "github";
  fillSettingsForm();
  setReady(false);
  if (state.settings) {
    try {
      await openDatabase();
    } catch (error) {
      setReady(false);
      showStatus(error.message, true);
    }
  }
}

init().catch(function (error) {
  setReady(false);
  showStatus(error.message, true);
});
