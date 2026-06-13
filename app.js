const DB_FILENAME = "budget.sqlite3";
const SUPABASE_URL = "https://uhzgrdivbkhqfxgwdzsd.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_KPhJfS-UNgyV5C3v-RVO_A_e0SP96Iy";
const SUPABASE_BUCKET = "budget-files";
const AUTH_REDIRECT_URL = "https://josephspratt-3d.github.io/Christendom-Budgeting/";
const TAB_ORDER_STORAGE_KEY = "christendomBudgetTabOrder";
const DEFAULT_TABS = [
  { id: "add", label: "Add" },
  { id: "dashboard", label: "Dashboard" },
  { id: "transactions", label: "Transactions" },
  { id: "recurring", label: "Recurring" },
  { id: "accounts", label: "Accounts" },
  { id: "categories", label: "Categories" },
  { id: "budgets", label: "Budgets" },
  { id: "debts", label: "Debts" },
  { id: "reports", label: "Reports" },
  { id: "settings", label: "Settings" },
];

const state = {
  SQL: null,
  db: null,
  supabase: null,
  session: null,
  user: null,
  remoteVersion: null,
  remoteExists: false,
  checkingRemote: false,
  autoSyncTimer: null,
  syncMessage: "",
  editModal: null,
  month: currentMonth(),
  editingTransactionId: null,
  editingTransferBaseId: null,
  editingAccountId: null,
  editingCategoryId: null,
  editingDebtId: null,
  editingRecurringId: null,
  editingBudgetId: null,
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
  authForm: document.getElementById("authForm"),
  emailInput: document.getElementById("emailInput"),
  passwordInput: document.getElementById("passwordInput"),
  signUpButton: document.getElementById("signUpButton"),
  sessionPanel: document.getElementById("sessionPanel"),
  sessionSummary: document.getElementById("sessionSummary"),
  tabs: document.getElementById("tabs"),
  syncButton: document.getElementById("syncButton"),
  monthInput: document.getElementById("monthInput"),
  incomeValue: document.getElementById("incomeValue"),
  spendingValue: document.getElementById("spendingValue"),
  budgetValue: document.getElementById("budgetValue"),
  netWorthValue: document.getElementById("netWorthValue"),
  accountBalanceList: document.getElementById("accountBalanceList"),
  categorySpendList: document.getElementById("categorySpendList"),
  transactionMonthInput: document.getElementById("transactionMonthInput"),
  transactionForm: document.getElementById("transactionForm"),
  transactionSubmit: document.querySelector("#transactionForm button[type='submit']"),
  txAmount: document.getElementById("txAmount"),
  txType: document.getElementById("txType"),
  txDate: document.getElementById("txDate"),
  txAccountField: document.getElementById("txAccountField"),
  txAccountLabel: document.getElementById("txAccountLabel"),
  txAccount: document.getElementById("txAccount"),
  txTransferToField: document.getElementById("txTransferToField"),
  txTransferTo: document.getElementById("txTransferTo"),
  txCategoryField: document.getElementById("txCategoryField"),
  txCategory: document.getElementById("txCategory"),
  txDebtField: document.getElementById("txDebtField"),
  txDebt: document.getElementById("txDebt"),
  txVendorField: document.getElementById("txVendorField"),
  txVendor: document.getElementById("txVendor"),
  txVendorSuggestions: document.getElementById("txVendorSuggestions"),
  txNotes: document.getElementById("txNotes"),
  cancelTransactionEditButton: document.getElementById("cancelTransactionEditButton"),
  deleteTransactionEditButton: document.getElementById("deleteTransactionEditButton"),
  vendorList: document.getElementById("vendorList"),
  transactionSearch: document.getElementById("transactionSearch"),
  transactionTypeFilter: document.getElementById("transactionTypeFilter"),
  transactionAccountFilter: document.getElementById("transactionAccountFilter"),
  transactionCategoryFilter: document.getElementById("transactionCategoryFilter"),
  transactionDebtFilter: document.getElementById("transactionDebtFilter"),
  transactionMinFilter: document.getElementById("transactionMinFilter"),
  transactionMaxFilter: document.getElementById("transactionMaxFilter"),
  transactionList: document.getElementById("transactionList"),
  exportCsvButton: document.getElementById("exportCsvButton"),
  importCsvInput: document.getElementById("importCsvInput"),
  recurringForm: document.getElementById("recurringForm"),
  recAmount: document.getElementById("recAmount"),
  recType: document.getElementById("recType"),
  recNextDate: document.getElementById("recNextDate"),
  recFrequency: document.getElementById("recFrequency"),
  recAccount: document.getElementById("recAccount"),
  recCategory: document.getElementById("recCategory"),
  recDebt: document.getElementById("recDebt"),
  recVendor: document.getElementById("recVendor"),
  recVendorSuggestions: document.getElementById("recVendorSuggestions"),
  recNotes: document.getElementById("recNotes"),
  recActive: document.getElementById("recActive"),
  recurringSubmitButton: document.getElementById("recurringSubmitButton"),
  cancelRecurringEditButton: document.getElementById("cancelRecurringEditButton"),
  deleteRecurringEditButton: document.getElementById("deleteRecurringEditButton"),
  runRecurringButton: document.getElementById("runRecurringButton"),
  recurringList: document.getElementById("recurringList"),
  accountForm: document.getElementById("accountForm"),
  accountName: document.getElementById("accountName"),
  accountType: document.getElementById("accountType"),
  accountBalanceLabel: document.getElementById("accountBalanceLabel"),
  accountOpening: document.getElementById("accountOpening"),
  accountNetWorth: document.getElementById("accountNetWorth"),
  accountSubmitButton: document.getElementById("accountSubmitButton"),
  cancelAccountEditButton: document.getElementById("cancelAccountEditButton"),
  deleteAccountEditButton: document.getElementById("deleteAccountEditButton"),
  accountsList: document.getElementById("accountsList"),
  categoryForm: document.getElementById("categoryForm"),
  categoryName: document.getElementById("categoryName"),
  categoryKind: document.getElementById("categoryKind"),
  categoryLimit: document.getElementById("categoryLimit"),
  categorySubmitButton: document.getElementById("categorySubmitButton"),
  cancelCategoryEditButton: document.getElementById("cancelCategoryEditButton"),
  deleteCategoryEditButton: document.getElementById("deleteCategoryEditButton"),
  categoriesList: document.getElementById("categoriesList"),
  budgetMonthInput: document.getElementById("budgetMonthInput"),
  budgetForm: document.getElementById("budgetForm"),
  budgetKind: document.getElementById("budgetKind"),
  budgetCategoryLabel: document.getElementById("budgetCategoryLabel"),
  budgetCategory: document.getElementById("budgetCategory"),
  budgetPlannedLabel: document.getElementById("budgetPlannedLabel"),
  budgetPlanned: document.getElementById("budgetPlanned"),
  budgetCarryField: document.getElementById("budgetCarryField"),
  budgetCarry: document.getElementById("budgetCarry"),
  budgetSubmitButton: document.getElementById("budgetSubmitButton"),
  cancelBudgetEditButton: document.getElementById("cancelBudgetEditButton"),
  deleteBudgetEditButton: document.getElementById("deleteBudgetEditButton"),
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
  deleteDebtEditButton: document.getElementById("deleteDebtEditButton"),
  debtsList: document.getElementById("debtsList"),
  reportsList: document.getElementById("reportsList"),
  reportMonthInput: document.getElementById("reportMonthInput"),
  reportViewFilter: document.getElementById("reportViewFilter"),
  openBudgetButton: document.getElementById("openBudgetButton"),
  saveDbButton: document.getElementById("saveDbButton"),
  logoutButton: document.getElementById("logoutButton"),
  logoutSettingsButton: document.getElementById("logoutSettingsButton"),
  syncStatusValue: document.getElementById("syncStatusValue"),
  tabOrderList: document.getElementById("tabOrderList"),
  resetTabOrderButton: document.getElementById("resetTabOrderButton"),
  resetButton: document.getElementById("resetButton"),
  editModal: document.getElementById("editModal"),
  editModalTitle: document.getElementById("editModalTitle"),
  editModalBody: document.getElementById("editModalBody"),
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

function accountTypeKey(value) {
  return String(value || "").trim().toLowerCase();
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

function addOption(select, value, label) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = label;
  select.appendChild(option);
}

function setReady(ready) {
  els.setupView.style.display = ready ? "none" : "block";
  els.tabs.classList.toggle("ready", ready);
  document.querySelectorAll(".tab-page").forEach(function (page) {
    page.style.display = ready ? "" : "none";
  });
}

function defaultTabOrder() {
  return DEFAULT_TABS.map(function (tab) { return tab.id; });
}

function tabLabel(id) {
  const tab = DEFAULT_TABS.find(function (item) { return item.id === id; });
  return tab ? tab.label : displayText(id);
}

function getTabOrder() {
  let saved = [];
  try {
    saved = JSON.parse(window.localStorage.getItem(TAB_ORDER_STORAGE_KEY) || "[]");
  } catch (_error) {
    saved = [];
  }
  const validIds = defaultTabOrder();
  const clean = saved.filter(function (id, index) {
    return validIds.indexOf(id) !== -1 && saved.indexOf(id) === index;
  });
  validIds.forEach(function (id) {
    if (clean.indexOf(id) === -1) {
      clean.push(id);
    }
  });
  return clean;
}

function saveTabOrder(order) {
  window.localStorage.setItem(TAB_ORDER_STORAGE_KEY, JSON.stringify(order));
}

function applyTabOrder() {
  const order = getTabOrder();
  order.forEach(function (id) {
    const button = els.tabs.querySelector("button[data-tab='" + id + "']");
    if (button) {
      els.tabs.appendChild(button);
    }
  });
}

function renderTabOrderSettings() {
  clearNode(els.tabOrderList);
  const order = getTabOrder();
  order.forEach(function (id, index) {
    addRow(
      els.tabOrderList,
      tabLabel(id),
      "",
      "Position " + (index + 1),
      "",
      [
        { label: "Up", action: "move-tab-up", id: id },
        { label: "Down", action: "move-tab-down", id: id },
      ],
    );
  });
}

function moveTab(id, direction) {
  const order = getTabOrder();
  const index = order.indexOf(id);
  const nextIndex = index + direction;
  if (index === -1 || nextIndex < 0 || nextIndex >= order.length) {
    return;
  }
  const temp = order[index];
  order[index] = order[nextIndex];
  order[nextIndex] = temp;
  saveTabOrder(order);
  applyTabOrder();
  renderTabOrderSettings();
}

function resetTabOrder() {
  saveTabOrder(defaultTabOrder());
  applyTabOrder();
  renderTabOrderSettings();
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

function openEditModal(title, form) {
  closeEditModal(true);
  const placeholder = document.createComment("edit-form-placeholder");
  const parent = form.parentNode;
  const next = form.nextSibling;
  parent.insertBefore(placeholder, form);
  state.editModal = {
    form: form,
    parent: parent,
    next: next,
    placeholder: placeholder,
  };
  els.editModalTitle.textContent = title;
  els.editModalBody.appendChild(form);
  els.editModal.classList.remove("hidden");
}

function closeEditModal(returnOnly) {
  if (state.editModal) {
    const modal = state.editModal;
    if (modal.next && modal.next.parentNode === modal.parent) {
      modal.parent.insertBefore(modal.form, modal.next);
    } else {
      modal.parent.appendChild(modal.form);
    }
    if (modal.placeholder.parentNode) {
      modal.placeholder.parentNode.removeChild(modal.placeholder);
    }
    state.editModal = null;
  }
  els.editModal.classList.add("hidden");
  clearNode(els.editModalBody);
  if (!returnOnly) {
    if (state.editingTransactionId) {
      clearTransactionEditMode();
    }
    if (state.editingRecurringId) {
      clearRecurringEditMode();
    }
    if (state.editingAccountId) {
      clearAccountEditMode();
    }
    if (state.editingCategoryId) {
      clearCategoryEditMode();
    }
    if (state.editingDebtId) {
      clearDebtEditMode();
    }
    if (state.editingBudgetId) {
      clearBudgetEditMode();
    }
  }
}

function supabaseConfigured() {
  return SUPABASE_URL.indexOf("YOUR_PROJECT_REF") === -1 && SUPABASE_ANON_KEY.indexOf("YOUR_SUPABASE") === -1;
}

function createSupabaseClient() {
  if (state.supabase) {
    return state.supabase;
  }
  if (!supabaseConfigured()) {
    throw new Error("Configure SUPABASE_URL and SUPABASE_ANON_KEY in app.js first.");
  }
  if (!window.supabase || typeof window.supabase.createClient !== "function") {
    throw new Error("Supabase client did not load. Check the Supabase CDN script.");
  }
  state.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return state.supabase;
}

function budgetStoragePath() {
  if (!state.user || !state.user.id) {
    throw new Error("Log in before opening or saving a budget.");
  }
  return "budgets/" + state.user.id + "/" + DB_FILENAME;
}

function budgetStorageFolder() {
  if (!state.user || !state.user.id) {
    throw new Error("Log in before opening or saving a budget.");
  }
  return "budgets/" + state.user.id;
}

function remoteVersion(info) {
  if (!info) {
    return "";
  }
  const metadata = info.metadata || {};
  return [
    info.updated_at || "",
    info.created_at || "",
    metadata.eTag || metadata.etag || "",
    metadata.size || info.size || "",
  ].join("|");
}

async function getRemoteBudgetInfo() {
  const result = await state.supabase.storage.from(SUPABASE_BUCKET).list(budgetStorageFolder(), {
    limit: 10,
    search: DB_FILENAME,
  });
  if (result.error) {
    throw result.error;
  }
  return (result.data || []).find(function (file) {
    return file.name === DB_FILENAME;
  }) || null;
}

function updateAuthUi() {
  const signedIn = Boolean(state.user);
  const email = state.user && state.user.email ? state.user.email : "";
  els.setupView.style.display = signedIn && state.db ? "none" : "block";
  els.tabs.classList.toggle("ready", signedIn && Boolean(state.db));
  els.syncButton.style.display = signedIn && state.db ? "" : "none";
  els.authForm.classList.toggle("hidden", signedIn);
  els.sessionPanel.classList.toggle("hidden", !signedIn);
  els.sessionSummary.textContent = signedIn ? "Signed in as " + email + "." : "";
  els.openBudgetButton.disabled = !signedIn;
  els.saveDbButton.disabled = !signedIn || !state.db;
  els.logoutButton.disabled = !signedIn;
  els.logoutSettingsButton.disabled = !signedIn;
  els.syncStatusValue.textContent = signedIn
    ? "Sync Status: Signed in as " + email + (state.dirty ? " - unsaved changes" : " - saved") + (state.syncMessage ? " - " + state.syncMessage : "")
    : "Sync Status: Not signed in.";
}

async function refreshSession() {
  const supabaseClient = createSupabaseClient();
  const result = await supabaseClient.auth.getSession();
  if (result.error) {
    throw result.error;
  }
  state.session = result.data.session;
  state.user = state.session ? state.session.user : null;
  updateAuthUi();
}

async function signIn(event) {
  event.preventDefault();
  const email = els.emailInput.value.trim();
  const password = els.passwordInput.value;
  if (!email || !password) {
    showStatus("Enter your email and password.", true);
    return;
  }
  showStatus("Logging in...");
  const result = await state.supabase.auth.signInWithPassword({ email: email, password: password });
  if (result.error) {
    throw result.error;
  }
  state.session = result.data.session;
  state.user = state.session ? state.session.user : result.data.user;
  els.passwordInput.value = "";
  updateAuthUi();
  await openDatabase();
}

async function signUp() {
  const email = els.emailInput.value.trim();
  const password = els.passwordInput.value;
  if (!email || !password) {
    showStatus("Enter your email and password.", true);
    return;
  }
  showStatus("Creating account...");
  const result = await state.supabase.auth.signUp({
    email: email,
    password: password,
    options: {
      emailRedirectTo: AUTH_REDIRECT_URL,
    },
  });
  if (result.error) {
    throw result.error;
  }
  state.session = result.data.session;
  state.user = state.session ? state.session.user : null;
  els.passwordInput.value = "";
  updateAuthUi();
  if (state.user) {
    await openDatabase();
    showStatus("Account created. Your budget is ready.");
  } else {
    showStatus("Account created. Check your email to confirm, then log in.");
  }
  clearStatusSoon();
}

async function signOut() {
  closeEditModal(false);
  if (state.supabase) {
    const result = await state.supabase.auth.signOut();
    if (result.error) {
      throw result.error;
    }
  }
  state.session = null;
  state.user = null;
  state.db = null;
  state.remoteVersion = null;
  state.remoteExists = false;
  state.syncMessage = "";
  stopAutoSyncChecks();
  setReady(false);
  updateAuthUi();
  showStatus("Logged out.");
  clearStatusSoon();
}

async function supabaseGetBytes() {
  const path = budgetStoragePath();
  const result = await state.supabase.storage.from(SUPABASE_BUCKET).download(path);
  if (result.error) {
    const status = Number(result.error.statusCode || result.error.status || 0);
    if (status === 404 || String(result.error.message || "").toLowerCase().indexOf("not found") !== -1) {
      return null;
    }
    throw result.error;
  }
  return new Uint8Array(await result.data.arrayBuffer());
}

async function supabasePutBytes(bytes) {
  const path = budgetStoragePath();
  const file = new Blob([bytes], { type: "application/x-sqlite3" });
  const result = await state.supabase.storage.from(SUPABASE_BUCKET).upload(path, file, {
    contentType: "application/x-sqlite3",
    upsert: true,
  });
  if (result.error) {
    throw result.error;
  }
  return result.data;
}

async function hasRemoteChanged() {
  const info = await getRemoteBudgetInfo();
  const version = remoteVersion(info);
  if (!state.remoteVersion) {
    return Boolean(info);
  }
  return version !== state.remoteVersion;
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
      account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
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
      debt_id INTEGER REFERENCES debts(id) ON DELETE SET NULL,
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
  const transactionAccountColumn = all("PRAGMA table_info(transactions)").find(function (row) {
    return row.name === "account_id";
  });
  if (transactionAccountColumn && Number(transactionAccountColumn.notnull || 0) === 1) {
    state.db.run("PRAGMA foreign_keys = OFF");
    state.db.run(`
      CREATE TABLE transactions_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
        category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
        debt_id INTEGER REFERENCES debts(id) ON DELETE SET NULL,
        date TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('income','expense')),
        amount REAL NOT NULL CHECK (amount >= 0),
        vendor TEXT NOT NULL DEFAULT '',
        notes TEXT NOT NULL DEFAULT '',
        recurring_transaction_id INTEGER,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        source TEXT NOT NULL DEFAULT 'desktop',
        external_id TEXT
      )
    `);
    state.db.run(`
      INSERT INTO transactions_new(
        id, account_id, category_id, debt_id, date, type, amount, vendor, notes,
        recurring_transaction_id, created_at, updated_at, source, external_id
      )
      SELECT
        id, account_id, category_id, debt_id, date, type, amount, vendor, notes,
        recurring_transaction_id, created_at, updated_at, source, external_id
      FROM transactions
    `);
    state.db.run("DROP TABLE transactions");
    state.db.run("ALTER TABLE transactions_new RENAME TO transactions");
    state.db.run("PRAGMA foreign_keys = ON");
  }
  state.db.run("CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date)");
  state.db.run("CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id)");
  state.db.run("CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id)");
  state.db.run(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_source_external
    ON transactions(source, external_id)
    WHERE external_id IS NOT NULL AND external_id <> ''
  `);
  state.db.run("CREATE INDEX IF NOT EXISTS idx_transactions_debt ON transactions(debt_id)");
  const recurringColumns = all("PRAGMA table_info(recurring_transactions)").map(function (row) {
    return row.name;
  });
  if (recurringColumns.indexOf("debt_id") === -1) {
    state.db.run("ALTER TABLE recurring_transactions ADD COLUMN debt_id INTEGER REFERENCES debts(id) ON DELETE SET NULL");
  }
  state.db.run("CREATE INDEX IF NOT EXISTS idx_recurring_next_date ON recurring_transactions(next_date)");
  state.db.run("CREATE INDEX IF NOT EXISTS idx_recurring_debt ON recurring_transactions(debt_id)");
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

async function openDatabase() {
  if (!state.user) {
    showStatus("Log in before opening a budget.", true);
    return;
  }
  showStatus("Opening budget from Supabase...");
  const SQL = await loadSqlJsLibrary();
  const remoteInfo = await getRemoteBudgetInfo();
  const bytes = remoteInfo ? await supabaseGetBytes() : null;
  state.remoteVersion = remoteVersion(remoteInfo);
  state.remoteExists = Boolean(remoteInfo);
  state.syncMessage = "";
  state.db = bytes ? new SQL.Database(bytes) : new SQL.Database();
  migrateDatabase();
  state.dirty = !bytes;
  syncDebtBudgetIfNeeded(state.month);
  const recurringResult = processDueRecurringTransactions();
  renderAll();
  setReady(true);
  updateAuthUi();
  startAutoSyncChecks();
  activateTab("add");
  if (recurringResult.created > 0 || recurringResult.advanced > 0) {
    await saveDatabase();
    showStatus("Budget loaded. Added " + recurringResult.created + " recurring transaction(s).");
  } else {
    showStatus(bytes ? "Budget loaded. Ready to enter transactions." : "No saved budget found. A new one is ready to save.");
  }
  clearStatusSoon();
}

async function saveDatabase() {
  if (!state.db) {
    showStatus("Open a database first.", true);
    return;
  }
  if (!state.user) {
    showStatus("Log in before saving a budget.", true);
    return;
  }
  state.saving = true;
  showStatus("Saving budget to Supabase...");
  try {
    if (await hasRemoteChanged()) {
      state.syncMessage = "remote changes available";
      updateAuthUi();
      throw new Error("This budget changed on another device. Open Budget to reload before saving so you do not overwrite newer data.");
    }
    const bytes = state.db.export();
    await supabasePutBytes(bytes);
    const remoteInfo = await getRemoteBudgetInfo();
    state.remoteVersion = remoteVersion(remoteInfo);
    state.remoteExists = Boolean(remoteInfo);
    state.syncMessage = "";
    state.dirty = false;
    updateAuthUi();
    showStatus("Budget saved to Supabase.");
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

async function checkForRemoteUpdates(autoReload) {
  if (!state.user || !state.db || state.saving || state.checkingRemote) {
    return;
  }
  state.checkingRemote = true;
  try {
    const changed = await hasRemoteChanged();
    if (!changed) {
      state.syncMessage = "";
      updateAuthUi();
      return;
    }
    if (autoReload && !state.dirty && !state.editModal) {
      showStatus("Remote changes found. Refreshing budget...");
      state.checkingRemote = false;
      await openDatabase();
      state.checkingRemote = true;
      showStatus("Budget refreshed from Supabase.");
      clearStatusSoon();
      return;
    }
    state.syncMessage = "remote changes available";
    updateAuthUi();
    showStatus("This budget changed on another device. Open Budget to reload before making more changes.", true);
  } finally {
    state.checkingRemote = false;
  }
}

function startAutoSyncChecks() {
  if (state.autoSyncTimer) {
    window.clearInterval(state.autoSyncTimer);
  }
  state.autoSyncTimer = window.setInterval(function () {
    checkForRemoteUpdates(true)
      .then(function () { return ensureRecurringTransactionsCurrent(true); })
      .catch(function (error) {
        state.syncMessage = "sync check failed";
        updateAuthUi();
        showStatus(error.message, true);
      });
  }, 30000);
}

function stopAutoSyncChecks() {
  if (state.autoSyncTimer) {
    window.clearInterval(state.autoSyncTimer);
    state.autoSyncTimer = null;
  }
}

function accountsWithBalances() {
  return all(`
    SELECT a.*,
      a.opening_balance + COALESCE(SUM(
        CASE
          WHEN lower(a.type) = 'credit card' AND t.type = 'income' THEN -t.amount
          WHEN lower(a.type) = 'credit card' AND t.type = 'expense' THEN t.amount
          WHEN t.type = 'income' THEN t.amount
          ELSE -t.amount
        END
      ), 0) AS current_balance
    FROM accounts a
    LEFT JOIN transactions t ON t.account_id = a.id
    GROUP BY a.id
    ORDER BY a.name
  `);
}

function accountTransactionNet(accountId) {
  return Number(scalar(
    `SELECT COALESCE(SUM(
      CASE
        WHEN lower(a.type) = 'credit card' AND t.type = 'income' THEN -t.amount
        WHEN lower(a.type) = 'credit card' AND t.type = 'expense' THEN t.amount
        WHEN t.type = 'income' THEN t.amount
        ELSE -t.amount
      END
    ), 0) net
    FROM accounts a
    LEFT JOIN transactions t ON t.account_id = a.id
    WHERE a.id = ?`,
    [Number(accountId)],
    "net",
  ));
}

function dashboardData() {
  const totals = one(
    "SELECT COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE 0 END), 0) income, COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END), 0) spending FROM transactions WHERE substr(date, 1, 7) = ? AND COALESCE(source, '') <> 'transfer'",
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
    if (!account.include_in_net_worth) {
      return sum;
    }
    const balance = Number(account.current_balance || 0);
    return accountTypeKey(account.type) === "credit card" ? sum - balance : sum + balance;
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
  els.transactionMonthInput.value = state.month;
  els.budgetMonthInput.value = state.month;
  renderSelectors();
  renderDashboard();
  renderTransactions();
  renderRecurring();
  renderAccounts();
  renderCategories();
  renderBudgets();
  renderDebts();
  renderReports();
  renderTabOrderSettings();
}

function renderSelectors() {
  const accounts = all("SELECT * FROM accounts ORDER BY name");
  const categories = all("SELECT * FROM categories ORDER BY kind, name");
  const debts = all("SELECT * FROM debts ORDER BY name");
  const oldAccount = els.txAccount.value;
  const oldTransferTo = els.txTransferTo.value;
  const oldDebtAccount = els.debtAccount.value;
  const oldTransactionDebt = els.txDebt.value;
  const oldFilterAccount = els.transactionAccountFilter.value;
  const oldFilterCategory = els.transactionCategoryFilter.value;
  const oldFilterDebt = els.transactionDebtFilter.value;
  const oldRecurringAccount = els.recAccount.value;
  const oldRecurringDebt = els.recDebt.value;
  const oldBudgetCategory = els.budgetCategory.value;
  clearNode(els.txAccount);
  clearNode(els.txTransferTo);
  clearNode(els.recAccount);
  clearNode(els.debtAccount);
  clearNode(els.txDebt);
  clearNode(els.recDebt);
  clearNode(els.transactionAccountFilter);
  clearNode(els.transactionCategoryFilter);
  clearNode(els.transactionDebtFilter);
  addOption(els.transactionAccountFilter, "all", "All Accounts");
  addOption(els.transactionAccountFilter, "none", "No Account");
  addOption(els.transactionCategoryFilter, "all", "All Categories");
  addOption(els.transactionCategoryFilter, "none", "No Category");
  addOption(els.transactionDebtFilter, "all", "All Debts");
  addOption(els.transactionDebtFilter, "none", "No Debt");
  const noDebtAccount = document.createElement("option");
  noDebtAccount.value = "";
  noDebtAccount.textContent = "No Linked Account";
  els.debtAccount.appendChild(noDebtAccount);
  const noTransactionDebt = document.createElement("option");
  noTransactionDebt.value = "";
  noTransactionDebt.textContent = "No Linked Debt";
  els.txDebt.appendChild(noTransactionDebt);
  const noRecurringDebt = document.createElement("option");
  noRecurringDebt.value = "";
  noRecurringDebt.textContent = "No Linked Debt";
  els.recDebt.appendChild(noRecurringDebt);
  const noTransactionAccount = document.createElement("option");
  noTransactionAccount.value = "";
  noTransactionAccount.textContent = "No Account";
  els.txAccount.appendChild(noTransactionAccount);
  accounts.forEach(function (account) {
    const label = account.name + " (" + displayText(account.type) + ")";
    const option = document.createElement("option");
    option.value = account.id;
    option.textContent = label;
    els.txAccount.appendChild(option);
    const transferToOption = document.createElement("option");
    transferToOption.value = account.id;
    transferToOption.textContent = label;
    els.txTransferTo.appendChild(transferToOption);
    const recurringOption = document.createElement("option");
    recurringOption.value = account.id;
    recurringOption.textContent = label;
    els.recAccount.appendChild(recurringOption);
    const debtOption = document.createElement("option");
    debtOption.value = account.id;
    debtOption.textContent = label;
    els.debtAccount.appendChild(debtOption);
    addOption(els.transactionAccountFilter, String(account.id), label);
  });
  els.txAccount.value = oldAccount;
  els.txTransferTo.value = oldTransferTo || (accounts[1] ? String(accounts[1].id) : (accounts[0] ? String(accounts[0].id) : ""));
  els.recAccount.value = oldRecurringAccount || (accounts[0] ? String(accounts[0].id) : "");
  els.debtAccount.value = oldDebtAccount || "";
  debts.forEach(function (debt) {
    const option = document.createElement("option");
    option.value = debt.id;
    option.textContent = debt.name + " (" + money(debt.balance) + ")";
    els.txDebt.appendChild(option);
    const recurringDebtOption = document.createElement("option");
    recurringDebtOption.value = debt.id;
    recurringDebtOption.textContent = option.textContent;
    els.recDebt.appendChild(recurringDebtOption);
    addOption(els.transactionDebtFilter, String(debt.id), debt.name);
  });
  els.txDebt.value = oldTransactionDebt || "";
  els.recDebt.value = oldRecurringDebt || "";
  fillCategorySelect(els.txCategory, categories, els.txType.value, true);
  fillCategorySelect(els.recCategory, categories, els.recType.value, true);
  fillCategorySelect(els.budgetCategory, categories, els.budgetKind.value || "expense", false);
  categories.forEach(function (category) {
    addOption(els.transactionCategoryFilter, String(category.id), category.name + " (" + displayText(category.kind) + ")");
  });
  els.transactionAccountFilter.value = oldFilterAccount || "all";
  els.transactionCategoryFilter.value = oldFilterCategory || "all";
  els.transactionDebtFilter.value = oldFilterDebt || "all";
  els.budgetCategory.value = oldBudgetCategory || "";
  const vendors = vendorOptions();
  clearNode(els.vendorList);
  vendors.forEach(function (row) {
    const option = document.createElement("option");
    option.value = row;
    els.vendorList.appendChild(option);
  });
  updateTransactionTypeUi();
  updateBudgetFormUi();
}

function updateBudgetFormUi() {
  const isIncome = els.budgetKind.value === "income";
  els.budgetCategoryLabel.textContent = isIncome ? "Income Category" : "Expense Category";
  els.budgetPlannedLabel.textContent = isIncome ? "Expected Income" : "Allocated Amount";
  els.budgetCarryField.classList.toggle("hidden", isIncome);
  els.budgetCarry.disabled = isIncome;
  if (isIncome) {
    els.budgetCarry.checked = false;
  }
  if (state.editingBudgetId) {
    els.budgetSubmitButton.textContent = isIncome ? "Update Expected Income" : "Update Allocation";
  } else {
    els.budgetSubmitButton.textContent = isIncome ? "Save Expected Income" : "Save Allocation";
  }
}

function updateTransactionTypeUi() {
  const isTransfer = els.txType.value === "transfer";
  els.txAccountLabel.textContent = isTransfer ? "From Account" : "Account";
  els.txTransferToField.classList.toggle("hidden", !isTransfer);
  els.txCategoryField.classList.toggle("hidden", isTransfer);
  els.txDebtField.classList.toggle("hidden", isTransfer);
  els.txVendorField.classList.toggle("hidden", isTransfer);
  els.txTransferTo.disabled = !isTransfer;
  els.txTransferTo.required = isTransfer;
  els.txCategory.disabled = isTransfer;
  els.txDebt.disabled = isTransfer;
  els.txVendor.disabled = isTransfer;
  if (isTransfer) {
    els.txDebt.value = "";
    els.txCategory.value = "";
    els.txVendor.value = "";
  }
  if (state.editingTransferBaseId) {
    els.transactionSubmit.textContent = isTransfer ? "Update Transfer" : "Update Transaction";
  } else if (state.editingTransactionId) {
    els.transactionSubmit.textContent = "Update Transaction";
  } else {
    els.transactionSubmit.textContent = isTransfer ? "Save Transfer" : "Save Transaction";
  }
}

function vendorOptions() {
  const rows = all(`
    SELECT vendor, COUNT(*) count
    FROM (
      SELECT vendor FROM transactions WHERE TRIM(vendor) <> ''
      UNION ALL
      SELECT vendor FROM recurring_transactions WHERE TRIM(vendor) <> ''
    )
    GROUP BY vendor
    ORDER BY count DESC, vendor
    LIMIT 100
  `);
  return rows.map(function (row) {
    return row.vendor;
  });
}

function renderVendorSuggestions(input, container) {
  const query = String(input.value || "").trim().toLowerCase();
  const options = vendorOptions().filter(function (vendor) {
    return !query || vendor.toLowerCase().indexOf(query) !== -1;
  }).slice(0, 6);
  clearNode(container);
  if (!options.length) {
    container.classList.add("hidden");
    return;
  }
  options.forEach(function (vendor) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "suggestion-option";
    button.textContent = vendor;
    button.addEventListener("mousedown", function (event) {
      event.preventDefault();
      input.value = vendor;
      container.classList.add("hidden");
    });
    container.appendChild(button);
  });
  container.classList.remove("hidden");
}

function hideVendorSuggestions(container) {
  window.setTimeout(function () {
    container.classList.add("hidden");
  }, 120);
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

function chooseRecurringDebtCategory() {
  const id = categoryId("Debt", "expense");
  if (id) {
    els.recCategory.value = String(id);
  }
}

function parseDateParts(value) {
  const parts = String(value || today()).split("-").map(Number);
  return {
    year: parts[0],
    month: parts[1],
    day: parts[2],
  };
}

function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function addDays(dateText, days) {
  const date = new Date(dateText + "T00:00:00Z");
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function addMonths(dateText, months) {
  const parts = parseDateParts(dateText);
  const targetMonthIndex = parts.month - 1 + months;
  const targetYear = parts.year + Math.floor(targetMonthIndex / 12);
  const targetMonth = ((targetMonthIndex % 12) + 12) % 12 + 1;
  const targetDay = Math.min(parts.day, daysInMonth(targetYear, targetMonth));
  return [
    String(targetYear).padStart(4, "0"),
    String(targetMonth).padStart(2, "0"),
    String(targetDay).padStart(2, "0"),
  ].join("-");
}

function nextRecurringDate(dateText, frequency) {
  if (frequency === "weekly") {
    return addDays(dateText, 7);
  }
  if (frequency === "biweekly") {
    return addDays(dateText, 14);
  }
  if (frequency === "yearly") {
    return addMonths(dateText, 12);
  }
  return addMonths(dateText, 1);
}

function createTransactionFromRecurring(rule, dueDate) {
  const externalId = "recurring-" + rule.id + "-" + dueDate;
  const exists = one("SELECT id FROM transactions WHERE source = 'recurring' AND external_id = ?", [externalId]);
  if (exists) {
    return false;
  }
  run(
    `INSERT INTO transactions(account_id, category_id, debt_id, date, type, amount, vendor, notes, recurring_transaction_id, source, external_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'recurring', ?)`,
    [
      Number(rule.account_id),
      rule.category_id ? Number(rule.category_id) : (rule.debt_id ? debtCategoryId() : null),
      rule.debt_id ? Number(rule.debt_id) : null,
      dueDate,
      rule.type,
      Number(rule.amount || 0),
      rule.vendor || "",
      rule.notes || "",
      Number(rule.id),
      externalId,
    ],
  );
  applyDebtImpact({ debt_id: rule.debt_id, type: rule.type, amount: rule.amount }, false);
  return true;
}

function processDueRecurringTransactions() {
  const dueThrough = today();
  let created = 0;
  let advanced = 0;
  const rules = all("SELECT * FROM recurring_transactions WHERE active = 1 AND next_date <= ? ORDER BY next_date, id", [dueThrough]);
  rules.forEach(function (rule) {
    let nextDate = rule.next_date;
    let guard = 0;
    while (nextDate && nextDate <= dueThrough && guard < 120) {
      if (createTransactionFromRecurring(rule, nextDate)) {
        created += 1;
      }
      nextDate = nextRecurringDate(nextDate, rule.frequency);
      guard += 1;
    }
    if (nextDate !== rule.next_date) {
      run("UPDATE recurring_transactions SET next_date = ? WHERE id = ?", [nextDate, Number(rule.id)]);
      advanced += 1;
    }
  });
  return { created: created, advanced: advanced };
}

async function ensureRecurringTransactionsCurrent(silent) {
  if (!state.db || state.saving) {
    return { created: 0, advanced: 0 };
  }
  const result = processDueRecurringTransactions();
  if (result.created > 0 || result.advanced > 0) {
    await saveAfterChange(
      silent
        ? (result.created > 0 ? "Added " + result.created + " recurring transaction(s)." : "Recurring schedules are up to date.")
        : (result.created > 0
          ? "Added " + result.created + " recurring transaction(s)."
          : "Recurring schedules are up to date."),
    );
  }
  return result;
}

function addRow(container, title, amount, detail, amountClass, actions, rowAction) {
  const item = document.createElement("div");
  item.className = "row";
  if (rowAction) {
    item.classList.add("clickable-row");
    item.tabIndex = 0;
    item.dataset.action = rowAction.action;
    item.dataset.id = rowAction.id;
    item.setAttribute("role", "button");
    item.setAttribute("aria-label", rowAction.label || "Open");
  }
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
  const remaining = data.planned - data.spending;
  els.incomeValue.textContent = money(data.income);
  els.spendingValue.textContent = money(data.spending);
  els.budgetValue.textContent = money(remaining);
  els.netWorthValue.textContent = money(data.netWorth);
  els.incomeValue.className = data.income > 0 ? "positive" : "";
  els.spendingValue.className = data.spending > data.planned ? "negative" : "positive";
  els.budgetValue.className = remaining < 0 ? "negative" : "positive";
  clearNode(els.accountBalanceList);
  if (!data.accounts.length) {
    els.accountBalanceList.textContent = "Add an account to start.";
  }
  data.accounts.forEach(function (account) {
    const balance = Number(account.current_balance || 0);
    addRow(
      els.accountBalanceList,
      account.name,
      money(balance),
      displayText(account.type),
      accountTypeKey(account.type) === "credit card" || balance < 0 ? "negative" : "positive",
    );
  });
  clearNode(els.categorySpendList);
  const spending = all(`
    SELECT COALESCE(c.name, 'Uncategorized') name,
      COALESCE(SUM(t.amount), 0) amount,
      COALESCE(b.planned, 0) planned
    FROM transactions t
    LEFT JOIN categories c ON c.id = t.category_id
    LEFT JOIN budgets b ON b.category_id = c.id AND b.month = ?
    WHERE substr(t.date, 1, 7) = ? AND t.type = 'expense' AND COALESCE(t.source, '') <> 'transfer'
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
  const search = String(els.transactionSearch.value || "").trim().toLowerCase();
  const typeFilter = els.transactionTypeFilter.value || "all";
  const accountFilter = els.transactionAccountFilter.value || "all";
  const categoryFilter = els.transactionCategoryFilter.value || "all";
  const debtFilter = els.transactionDebtFilter.value || "all";
  const minAmount = String(els.transactionMinFilter.value || "").trim() === "" ? null : numberValue(els.transactionMinFilter);
  const maxAmount = String(els.transactionMaxFilter.value || "").trim() === "" ? null : numberValue(els.transactionMaxFilter);
  const rows = all(`
    SELECT t.*, COALESCE(a.name, 'No Account') account, COALESCE(c.name, '') category, COALESCE(d.name, '') debt
    FROM transactions t
    LEFT JOIN accounts a ON a.id = t.account_id
    LEFT JOIN categories c ON c.id = t.category_id
    LEFT JOIN debts d ON d.id = t.debt_id
    WHERE substr(t.date, 1, 7) = ?
    ORDER BY t.date DESC, t.id DESC
  `, [state.month]).filter(function (tx) {
    const text = [
      tx.vendor,
      tx.notes,
      tx.account,
      tx.category,
      tx.debt,
      displayText(tx.type),
      tx.source === "transfer" ? "transfer" : "",
    ].filter(Boolean).join(" ").toLowerCase();
    if (search && text.indexOf(search) === -1) {
      return false;
    }
    if (typeFilter === "transfer" && tx.source !== "transfer") {
      return false;
    }
    if ((typeFilter === "income" || typeFilter === "expense") && (tx.source === "transfer" || tx.type !== typeFilter)) {
      return false;
    }
    if (accountFilter === "none" && tx.account_id) {
      return false;
    }
    if (accountFilter !== "all" && accountFilter !== "none" && Number(tx.account_id || 0) !== Number(accountFilter)) {
      return false;
    }
    if (categoryFilter === "none" && tx.category_id) {
      return false;
    }
    if (categoryFilter !== "all" && categoryFilter !== "none" && Number(tx.category_id || 0) !== Number(categoryFilter)) {
      return false;
    }
    if (debtFilter === "none" && tx.debt_id) {
      return false;
    }
    if (debtFilter !== "all" && debtFilter !== "none" && Number(tx.debt_id || 0) !== Number(debtFilter)) {
      return false;
    }
    if (minAmount !== null && Number(tx.amount || 0) < minAmount) {
      return false;
    }
    if (maxAmount !== null && Number(tx.amount || 0) > maxAmount) {
      return false;
    }
    return true;
  }).slice(0, 250);
  if (!rows.length) {
    els.transactionList.textContent = "No transactions found for " + state.month + ".";
  }
  rows.forEach(function (tx) {
    const title = tx.vendor || tx.notes || tx.category || "Transaction";
    const detail = [tx.date, tx.account, tx.category, tx.debt ? "Debt: " + tx.debt : "", displayText(tx.type), tx.notes].filter(Boolean).join(" - ");
    addRow(
      els.transactionList,
      title,
      money(tx.amount),
      detail,
      tx.type === "income" ? "positive" : "negative",
      null,
      { label: "Edit " + title, action: "edit-transaction", id: tx.id },
    );
  });
}

function renderRecurring() {
  clearNode(els.recurringList);
  const rows = all(`
    SELECT r.*, a.name account, COALESCE(c.name, '') category, COALESCE(d.name, '') debt
    FROM recurring_transactions r
    JOIN accounts a ON a.id = r.account_id
    LEFT JOIN categories c ON c.id = r.category_id
    LEFT JOIN debts d ON d.id = r.debt_id
    ORDER BY r.active DESC, r.next_date, r.vendor
  `);
  if (!rows.length) {
    els.recurringList.textContent = "No recurring transactions yet.";
  }
  rows.forEach(function (rule) {
    const title = rule.vendor || rule.notes || rule.category || "Recurring transaction";
    const detail = [
      rule.active ? "Active" : "Paused",
      "Next " + rule.next_date,
      displayText(rule.frequency),
      rule.account,
      rule.category,
      rule.debt ? "Debt: " + rule.debt : "",
      displayText(rule.type),
    ].filter(Boolean).join(" - ");
    addRow(
      els.recurringList,
      title,
      money(rule.amount),
      detail,
      rule.type === "income" ? "positive" : "negative",
      null,
      { label: "Edit " + title, action: "edit-recurring", id: rule.id },
    );
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
      displayText(account.type),
      accountTypeKey(account.type) === "credit card" || balance < 0 ? "negative" : "positive",
      null,
      { label: "Edit " + account.name, action: "edit-account", id: account.id },
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
      null,
      { label: "Edit " + category.name, action: "edit-category", id: category.id },
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
    LEFT JOIN transactions t ON t.category_id = b.category_id AND substr(t.date, 1, 7) = b.month AND COALESCE(t.source, '') <> 'transfer'
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
      null,
      { label: "Edit " + budget.category_name, action: "edit-expected-income", id: budget.id },
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
      null,
      { label: "Edit " + budget.category_name, action: "edit-budget", id: budget.id },
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
      null,
      { label: "Edit " + debt.name, action: "edit-debt", id: debt.id },
    );
  });
}

function renderReports() {
  clearNode(els.reportsList);
  const view = els.reportViewFilter.value || "all";
  if (view === "all" || view === "summary") {
    renderReportSummary();
  }
  if (view === "all" || view === "budget") {
    renderBudgetPerformanceReport();
  }
  if (view === "all" || view === "categories") {
    renderCategoryReport();
  }
  if (view === "all" || view === "income") {
    renderIncomeReport();
  }
  if (view === "all" || view === "accounts") {
    renderAccountReport();
  }
  if (view === "all" || view === "debts") {
    renderDebtReport();
  }
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
  list.classList.add("report-summary-grid");
  addReportMetric(list, "Actual Income", money(summary.income), "Expected " + money(zeroSummary.expectedIncome), "positive");
  addReportMetric(list, "Allocated", money(zeroSummary.allocated), "Left to allocate " + money(zeroSummary.left), Math.abs(zeroSummary.left) < 0.005 ? "positive" : "negative");
  addReportMetric(list, "Spending", money(summary.spending), summary.planned ? "Budget " + money(summary.planned) : "No budget set", summary.spending > summary.planned ? "negative" : "positive");
  addReportMetric(list, "Net Savings", money(net), "Savings rate " + pct(savingsRate), net < 0 ? "negative" : "positive");
  addReportMetric(list, "Budget Remaining", money(budgetRemaining), budgetRemaining < 0 ? "Over budget" : "Under budget", budgetRemaining < 0 ? "negative" : "positive");
  addReportMetric(list, "Net Worth", money(summary.netWorth), "Accounts minus tracked debts", summary.netWorth < 0 ? "negative" : "positive");
}

function addReportMetric(container, title, value, detail, valueClass) {
  const item = document.createElement("article");
  item.className = "report-metric";
  const label = document.createElement("span");
  label.textContent = title;
  const amount = document.createElement("strong");
  amount.className = valueClass || "";
  amount.textContent = value;
  const sub = document.createElement("p");
  sub.textContent = detail || "";
  item.appendChild(label);
  item.appendChild(amount);
  item.appendChild(sub);
  container.appendChild(item);
}

function renderBudgetPerformanceReport() {
  const rows = all(`
    SELECT c.name category,
      b.planned,
      COALESCE(SUM(CASE WHEN t.type='expense' THEN t.amount ELSE 0 END), 0) actual
    FROM budgets b
    JOIN categories c ON c.id = b.category_id
    LEFT JOIN transactions t ON t.category_id = b.category_id AND substr(t.date, 1, 7) = b.month AND COALESCE(t.source, '') <> 'transfer'
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
    WHERE substr(t.date, 1, 7) = ? AND t.type = 'expense' AND COALESCE(t.source, '') <> 'transfer'
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
    WHERE substr(t.date, 1, 7) = ? AND t.type = 'income' AND COALESCE(t.source, '') <> 'transfer'
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
    addRow(
      list,
      account.name,
      money(balance),
      displayText(account.type) + " - Opening " + money(account.opening_balance),
      accountTypeKey(account.type) === "credit card" || balance < 0 ? "negative" : "positive",
    );
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
  if (els.txType.value === "transfer") {
    await saveTransferFromTransaction();
    return;
  }
  const accountId = els.txAccount.value ? Number(els.txAccount.value) : null;
  const debtId = els.txDebt.value ? Number(els.txDebt.value) : null;
  const categoryId = els.txCategory.value ? Number(els.txCategory.value) : (debtId ? debtCategoryId() : null);
  const amount = Math.abs(numberValue(els.txAmount));
  if (amount <= 0) {
    showStatus("Enter an amount.", true);
    return;
  }
  if (accountId === null && !categoryId) {
    showStatus("Choose a category for budget-only transactions.", true);
    return;
  }
  if (debtId && els.txType.value !== "expense") {
    showStatus("Linked debt transactions must be expenses.", true);
    return;
  }
  const wasEditing = Boolean(state.editingTransactionId);
  if (state.editingTransferBaseId) {
    run(
      "DELETE FROM transactions WHERE source = 'transfer' AND (external_id = ? OR external_id = ?)",
      [state.editingTransferBaseId + "-out", state.editingTransferBaseId + "-in"],
    );
    state.editingTransferBaseId = null;
  }
  if (wasEditing) {
    const oldTx = one("SELECT * FROM transactions WHERE id = ?", [state.editingTransactionId]);
    applyDebtImpact(oldTx, true);
    run(
      `UPDATE transactions
       SET account_id = ?, category_id = ?, debt_id = ?, date = ?, type = ?, amount = ?, vendor = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [accountId, categoryId, debtId, els.txDate.value || today(), els.txType.value, amount, els.txVendor.value.trim(), els.txNotes.value.trim(), state.editingTransactionId],
    );
    applyDebtImpact({ debt_id: debtId, type: els.txType.value, amount: amount }, false);
    clearTransactionEditMode();
    await saveAfterChange("Transaction updated.");
    return;
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
  updateTransactionTypeUi();
  await saveAfterChange("Transaction saved.");
  els.txAmount.focus();
}

async function saveTransferFromTransaction() {
  const fromAccount = Number(els.txAccount.value || 0);
  const toAccount = Number(els.txTransferTo.value || 0);
  const amount = Math.abs(numberValue(els.txAmount));
  if (!fromAccount || !toAccount || fromAccount === toAccount || amount <= 0) {
    showStatus("Choose two different accounts and enter an amount.", true);
    return;
  }
  if (state.editingTransactionId) {
    const oldTx = one("SELECT * FROM transactions WHERE id = ?", [state.editingTransactionId]);
    applyDebtImpact(oldTx, true);
    run("DELETE FROM transactions WHERE id = ?", [state.editingTransactionId]);
    state.editingTransactionId = null;
  }
  const transferId = state.editingTransferBaseId || ("transfer-" + Date.now() + "-" + Math.random().toString(16).slice(2));
  const date = els.txDate.value || today();
  const notes = els.txNotes.value.trim();
  if (state.editingTransferBaseId) {
    run(
      `UPDATE transactions
       SET account_id = ?, date = ?, amount = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
       WHERE source = 'transfer' AND external_id = ?`,
      [fromAccount, date, amount, notes, transferId + "-out"],
    );
    run(
      `UPDATE transactions
       SET account_id = ?, date = ?, amount = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
       WHERE source = 'transfer' AND external_id = ?`,
      [toAccount, date, amount, notes, transferId + "-in"],
    );
    clearTransactionEditMode();
    await saveAfterChange("Transfer updated.");
    return;
  }
  run(
    `INSERT INTO transactions(account_id, category_id, debt_id, date, type, amount, vendor, notes, source, external_id)
     VALUES (?, NULL, NULL, ?, 'expense', ?, 'Transfer', ?, 'transfer', ?)`,
    [fromAccount, date, amount, notes, transferId + "-out"],
  );
  run(
    `INSERT INTO transactions(account_id, category_id, debt_id, date, type, amount, vendor, notes, source, external_id)
     VALUES (?, NULL, NULL, ?, 'income', ?, 'Transfer', ?, 'transfer', ?)`,
    [toAccount, date, amount, notes, transferId + "-in"],
  );
  const keepDate = els.txDate.value;
  const keepFrom = els.txAccount.value;
  const keepTo = els.txTransferTo.value;
  els.transactionForm.reset();
  els.txDate.value = keepDate || today();
  els.txType.value = "transfer";
  renderSelectors();
  els.txAccount.value = keepFrom;
  els.txTransferTo.value = keepTo;
  updateTransactionTypeUi();
  await saveAfterChange("Transfer saved.");
  els.txAmount.focus();
}

function editTransaction(id) {
  const tx = one("SELECT * FROM transactions WHERE id = ?", [Number(id)]);
  if (!tx) {
    return;
  }
  if (tx.source === "transfer" && tx.external_id) {
    editTransfer(tx);
    return;
  }
  state.editingTransactionId = Number(id);
  state.editingTransferBaseId = null;
  els.txAmount.value = tx.amount;
  els.txType.value = tx.type;
  els.txDate.value = tx.date;
  renderSelectors();
  els.txAccount.value = tx.account_id;
  els.txCategory.value = tx.category_id || "";
  els.txDebt.value = tx.debt_id || "";
  els.txVendor.value = tx.vendor || "";
  els.txNotes.value = tx.notes || "";
  updateTransactionTypeUi();
  els.cancelTransactionEditButton.classList.remove("hidden");
  els.deleteTransactionEditButton.classList.remove("hidden");
  openEditModal("Edit Transaction", els.transactionForm);
  window.setTimeout(function () {
    els.txAmount.focus();
  }, 50);
}

function editTransfer(tx) {
  const baseId = String(tx.external_id).replace(/-(out|in)$/, "");
  const outTx = one("SELECT * FROM transactions WHERE source = 'transfer' AND external_id = ?", [baseId + "-out"]);
  const inTx = one("SELECT * FROM transactions WHERE source = 'transfer' AND external_id = ?", [baseId + "-in"]);
  if (!outTx || !inTx) {
    showStatus("This transfer is missing one side and cannot be edited.", true);
    return;
  }
  state.editingTransactionId = null;
  state.editingTransferBaseId = baseId;
  els.txAmount.value = outTx.amount;
  els.txType.value = "transfer";
  els.txDate.value = outTx.date;
  renderSelectors();
  els.txAccount.value = outTx.account_id;
  els.txTransferTo.value = inTx.account_id;
  els.txNotes.value = outTx.notes || inTx.notes || "";
  updateTransactionTypeUi();
  els.cancelTransactionEditButton.classList.remove("hidden");
  els.deleteTransactionEditButton.classList.remove("hidden");
  openEditModal("Edit Transfer", els.transactionForm);
  window.setTimeout(function () {
    els.txAmount.focus();
  }, 50);
}

function clearTransactionEditMode() {
  state.editingTransactionId = null;
  state.editingTransferBaseId = null;
  els.transactionForm.reset();
  els.txDate.value = today();
  els.txType.value = "expense";
  renderSelectors();
  updateTransactionTypeUi();
  els.cancelTransactionEditButton.classList.add("hidden");
  els.deleteTransactionEditButton.classList.add("hidden");
  closeEditModal(true);
}

async function deleteById(table, id, message) {
  if (table === "budgets") {
    if (state.editingBudgetId === Number(id)) {
      clearBudgetEditMode();
    }
  } else if (table === "categories") {
    if (state.editingCategoryId === Number(id)) {
      clearCategoryEditMode();
    }
  }
  run("DELETE FROM " + table + " WHERE id = ?", [Number(id)]);
  await saveAfterChange(message);
}

async function deleteTransaction(id) {
  const tx = one("SELECT * FROM transactions WHERE id = ?", [Number(id)]);
  if (tx && tx.source === "transfer" && tx.external_id) {
    const baseId = String(tx.external_id).replace(/-(out|in)$/, "");
    run(
      "DELETE FROM transactions WHERE source = 'transfer' AND (external_id = ? OR external_id = ?)",
      [baseId + "-out", baseId + "-in"],
    );
    if (state.editingTransferBaseId === baseId) {
      clearTransactionEditMode();
    }
    await saveAfterChange("Transfer deleted.");
    return;
  }
  applyDebtImpact(tx, true);
  run("DELETE FROM transactions WHERE id = ?", [Number(id)]);
  if (state.editingTransactionId === Number(id)) {
    clearTransactionEditMode();
  }
  await saveAfterChange("Transaction deleted.");
}

async function saveRecurring(event) {
  event.preventDefault();
  const accountId = Number(els.recAccount.value || 0);
  const debtId = els.recDebt.value ? Number(els.recDebt.value) : null;
  const categoryId = els.recCategory.value ? Number(els.recCategory.value) : (debtId ? debtCategoryId() : null);
  const amount = Math.abs(numberValue(els.recAmount));
  if (!accountId || amount <= 0) {
    showStatus("Choose an account and enter an amount.", true);
    return;
  }
  if (debtId && els.recType.value !== "expense") {
    showStatus("Linked debt recurring transactions must be expenses.", true);
    return;
  }
  const values = [
    accountId,
    categoryId,
    debtId,
    els.recType.value,
    amount,
    els.recVendor.value.trim(),
    els.recNotes.value.trim(),
    els.recFrequency.value,
    els.recNextDate.value || today(),
    els.recActive.checked ? 1 : 0,
  ];
  if (state.editingRecurringId) {
    run(
      `UPDATE recurring_transactions
       SET account_id = ?, category_id = ?, debt_id = ?, type = ?, amount = ?, vendor = ?, notes = ?, frequency = ?, next_date = ?, active = ?
       WHERE id = ?`,
      values.concat([state.editingRecurringId]),
    );
    clearRecurringEditMode();
    const result = processDueRecurringTransactions();
    await saveAfterChange(
      result.created > 0
        ? "Recurring transaction updated. Added " + result.created + " due transaction(s)."
        : "Recurring transaction updated.",
    );
    return;
  }
  run(
    `INSERT INTO recurring_transactions(account_id, category_id, debt_id, type, amount, vendor, notes, frequency, next_date, active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    values,
  );
  els.recurringForm.reset();
  els.recFrequency.value = "monthly";
  els.recNextDate.value = today();
  els.recActive.checked = true;
  const result = processDueRecurringTransactions();
  await saveAfterChange(
    result.created > 0
      ? "Recurring transaction added. Added " + result.created + " due transaction(s)."
      : "Recurring transaction added.",
  );
}

function editRecurring(id) {
  const rule = one("SELECT * FROM recurring_transactions WHERE id = ?", [Number(id)]);
  if (!rule) {
    return;
  }
  state.editingRecurringId = Number(id);
  els.recAmount.value = rule.amount || "";
  els.recType.value = rule.type || "expense";
  renderSelectors();
  els.recAccount.value = rule.account_id;
  els.recCategory.value = rule.category_id || "";
  els.recDebt.value = rule.debt_id || "";
  els.recFrequency.value = rule.frequency || "monthly";
  els.recNextDate.value = rule.next_date || today();
  els.recVendor.value = rule.vendor || "";
  els.recNotes.value = rule.notes || "";
  els.recActive.checked = Number(rule.active || 0) === 1;
  els.recurringSubmitButton.textContent = "Update Recurring";
  els.cancelRecurringEditButton.classList.remove("hidden");
  els.deleteRecurringEditButton.classList.remove("hidden");
  openEditModal("Edit Recurring Transaction", els.recurringForm);
  window.setTimeout(function () {
    els.recAmount.focus();
  }, 50);
}

function clearRecurringEditMode() {
  state.editingRecurringId = null;
  els.recurringForm.reset();
  els.recFrequency.value = "monthly";
  els.recNextDate.value = today();
  els.recActive.checked = true;
  els.recurringSubmitButton.textContent = "Add Recurring";
  els.cancelRecurringEditButton.classList.add("hidden");
  els.deleteRecurringEditButton.classList.add("hidden");
  closeEditModal(true);
}

async function deleteRecurring(id) {
  if (state.editingRecurringId === Number(id)) {
    clearRecurringEditMode();
  }
  run("DELETE FROM recurring_transactions WHERE id = ?", [Number(id)]);
  await saveAfterChange("Recurring transaction deleted.");
}

async function runDueRecurringNow() {
  const result = processDueRecurringTransactions();
  await saveAfterChange(
    result.created > 0
      ? "Added " + result.created + " recurring transaction(s)."
      : (result.advanced > 0 ? "Recurring schedules are up to date." : "No recurring transactions are due."),
  );
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
  if (state.editingAccountId) {
    const targetBalance = numberValue(els.accountOpening);
    const adjustedOpeningBalance = targetBalance - accountTransactionNet(state.editingAccountId);
    run(
      "UPDATE accounts SET name = ?, type = ?, opening_balance = ?, include_in_net_worth = ? WHERE id = ?",
      [
        name,
        els.accountType.value.trim() || "Chequing",
        adjustedOpeningBalance,
        els.accountNetWorth.checked ? 1 : 0,
        state.editingAccountId,
      ],
    );
    clearAccountEditMode();
    await saveAfterChange("Account updated.");
    return;
  }
  const values = [
    name,
    els.accountType.value.trim() || "Chequing",
    numberValue(els.accountOpening),
    els.accountNetWorth.checked ? 1 : 0,
  ];
  run(
    "INSERT INTO accounts(name, type, opening_balance, include_in_net_worth) VALUES (?, ?, ?, ?)",
    values,
  );
  els.accountForm.reset();
  els.accountNetWorth.checked = true;
  await saveAfterChange("Account added.");
}

function editAccount(id) {
  const account = one(`
    SELECT a.*,
      a.opening_balance + COALESCE(SUM(
        CASE
          WHEN lower(a.type) = 'credit card' AND t.type = 'income' THEN -t.amount
          WHEN lower(a.type) = 'credit card' AND t.type = 'expense' THEN t.amount
          WHEN t.type = 'income' THEN t.amount
          ELSE -t.amount
        END
      ), 0) AS current_balance
    FROM accounts a
    LEFT JOIN transactions t ON t.account_id = a.id
    WHERE a.id = ?
    GROUP BY a.id
  `, [Number(id)]);
  if (!account) {
    return;
  }
  state.editingAccountId = Number(id);
  els.accountName.value = account.name || "";
  els.accountType.value = account.type || "Chequing";
  if (els.accountType.value !== (account.type || "Chequing")) {
    els.accountType.value = "Other";
  }
  els.accountOpening.value = account.current_balance || "";
  els.accountBalanceLabel.textContent = "Balance";
  els.accountNetWorth.checked = Number(account.include_in_net_worth || 0) === 1;
  els.accountSubmitButton.textContent = "Update Account";
  els.cancelAccountEditButton.classList.remove("hidden");
  els.deleteAccountEditButton.classList.remove("hidden");
  openEditModal("Edit Account", els.accountForm);
  window.setTimeout(function () {
    els.accountName.focus();
  }, 50);
}

function clearAccountEditMode() {
  state.editingAccountId = null;
  els.accountForm.reset();
  els.accountBalanceLabel.textContent = "Opening Balance";
  els.accountNetWorth.checked = true;
  els.accountSubmitButton.textContent = "Add Account";
  els.cancelAccountEditButton.classList.add("hidden");
  els.deleteAccountEditButton.classList.add("hidden");
  closeEditModal(true);
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
  els.deleteCategoryEditButton.classList.remove("hidden");
  openEditModal("Edit Category", els.categoryForm);
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
  els.deleteCategoryEditButton.classList.add("hidden");
  closeEditModal(true);
}

function editExpectedIncome(id) {
  editBudget(id);
}

async function saveBudget(event) {
  event.preventDefault();
  if (!els.budgetCategory.value) {
    showStatus("Choose a category.", true);
    return;
  }
  const month = state.month;
  const category = one("SELECT kind FROM categories WHERE id = ?", [Number(els.budgetCategory.value)]);
  const kind = category ? category.kind : (els.budgetKind.value || "expense");
  const planned = numberValue(els.budgetPlanned);
  const carryForward = kind === "expense" && els.budgetCarry.checked ? 1 : 0;
  if (state.editingBudgetId) {
    run(
      `UPDATE budgets
       SET month = ?, category_id = ?, planned = ?, carry_forward = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [month, Number(els.budgetCategory.value), planned, carryForward, state.editingBudgetId],
    );
    state.month = month;
    syncDebtBudgetIfNeeded(state.month);
    clearBudgetEditMode();
    const summary = zeroBudgetSummary(state.month);
    await saveAfterChange(
      kind === "income"
        ? "Expected income updated. Left to allocate: " + money(summary.left) + "."
        : (Math.abs(summary.left) < 0.005
          ? "Allocation updated. Every dollar is allocated."
          : "Allocation updated. Left to allocate: " + money(summary.left) + "."),
    );
    return;
  }
  run(
    `INSERT INTO budgets(month, category_id, planned, carry_forward)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(month, category_id)
     DO UPDATE SET planned = excluded.planned, carry_forward = excluded.carry_forward, updated_at = CURRENT_TIMESTAMP`,
    [month, Number(els.budgetCategory.value), planned, carryForward],
  );
  state.month = month;
  syncDebtBudgetIfNeeded(state.month);
  els.budgetPlanned.value = "";
  els.budgetCarry.checked = false;
  const summary = zeroBudgetSummary(state.month);
  await saveAfterChange(
    kind === "income"
      ? "Expected income saved. Left to allocate: " + money(summary.left) + "."
      : (Math.abs(summary.left) < 0.005
        ? "Allocation saved. Every dollar is allocated."
        : "Allocation saved. Left to allocate: " + money(summary.left) + "."),
  );
}

function editBudget(id) {
  const budget = one(`
    SELECT b.*, c.kind
    FROM budgets b
    JOIN categories c ON c.id = b.category_id
    WHERE b.id = ?
  `, [Number(id)]);
  if (!budget) {
    return;
  }
  state.editingBudgetId = Number(id);
  state.month = budget.month || state.month;
  els.budgetKind.value = budget.kind || "expense";
  renderSelectors();
  els.budgetCategory.value = budget.category_id || "";
  els.budgetPlanned.value = budget.planned || "";
  els.budgetCarry.checked = Number(budget.carry_forward || 0) === 1;
  updateBudgetFormUi();
  els.cancelBudgetEditButton.classList.remove("hidden");
  els.deleteBudgetEditButton.classList.remove("hidden");
  openEditModal(budget.kind === "income" ? "Edit Expected Income" : "Edit Allocation", els.budgetForm);
  window.setTimeout(function () {
    els.budgetPlanned.focus();
  }, 50);
}

function clearBudgetEditMode() {
  state.editingBudgetId = null;
  els.budgetForm.reset();
  els.budgetKind.value = "expense";
  els.budgetCarry.checked = false;
  renderSelectors();
  updateBudgetFormUi();
  els.cancelBudgetEditButton.classList.add("hidden");
  els.deleteBudgetEditButton.classList.add("hidden");
  closeEditModal(true);
}

async function resetBudgetFromDefaults() {
  if (!confirm("Reset this month from category default budgets? Existing expected income and planned amounts for those categories will be replaced.")) {
    return;
  }
  const month = state.month;
  const rows = all("SELECT id, monthly_limit FROM categories WHERE monthly_limit > 0");
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
  await saveAfterChange("Reset " + rows.length + " budget line(s) from defaults. Left to allocate: " + money(summary.left) + ".");
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
  els.deleteDebtEditButton.classList.remove("hidden");
  openEditModal("Edit Debt", els.debtForm);
  window.setTimeout(function () {
    els.debtName.focus();
  }, 50);
}

function clearDebtEditMode() {
  state.editingDebtId = null;
  els.debtForm.reset();
  els.debtSubmitButton.textContent = "Add Debt";
  els.cancelDebtEditButton.classList.add("hidden");
  els.deleteDebtEditButton.classList.add("hidden");
  closeEditModal(true);
}

function exportCsv() {
  const rows = all(`
    SELECT t.date, COALESCE(a.name, 'No Account') account, COALESCE(c.name, '') category, COALESCE(d.name, '') debt, t.type, t.amount, t.vendor, t.notes
    FROM transactions t
    LEFT JOIN accounts a ON a.id = t.account_id
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
    let account = null;
    if (accountName && accountName.toLowerCase() !== "no account") {
      account = one("SELECT * FROM accounts WHERE lower(name) = lower(?)", [accountName]);
    }
    if (accountName && accountName.toLowerCase() !== "no account" && !account) {
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
        account ? account.id : null,
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
  els.authForm.addEventListener("submit", function (event) {
    signIn(event).catch(function (error) { showStatus(error.message, true); });
  });
  els.signUpButton.addEventListener("click", function () {
    signUp().catch(function (error) { showStatus(error.message, true); });
  });
  els.tabs.addEventListener("click", function (event) {
    const button = event.target.closest("button[data-tab]");
    if (button) {
      activateTab(button.dataset.tab);
    }
  });
  els.syncButton.addEventListener("click", function () {
    saveDatabase().catch(function (error) { showStatus(error.message, true); });
  });
  els.openBudgetButton.addEventListener("click", function () {
    openDatabase().catch(function (error) { showStatus(error.message, true); });
  });
  els.saveDbButton.addEventListener("click", function () {
    saveDatabase().catch(function (error) { showStatus(error.message, true); });
  });
  els.logoutButton.addEventListener("click", function () {
    signOut().catch(function (error) { showStatus(error.message, true); });
  });
  els.logoutSettingsButton.addEventListener("click", function () {
    signOut().catch(function (error) { showStatus(error.message, true); });
  });
  els.resetTabOrderButton.addEventListener("click", resetTabOrder);
  els.editModal.addEventListener("click", function (event) {
    if (event.target === els.editModal) {
      closeEditModal(false);
    }
  });
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !els.editModal.classList.contains("hidden")) {
      closeEditModal(false);
    }
  });
  els.resetButton.addEventListener("click", function () {
    closeEditModal(false);
    state.db = null;
    state.remoteVersion = null;
    state.remoteExists = false;
    state.syncMessage = "";
    stopAutoSyncChecks();
    setReady(false);
    updateAuthUi();
    showStatus("Local app state cleared. Your Supabase budget file was not deleted.");
  });
  window.addEventListener("focus", function () {
    checkForRemoteUpdates(true)
      .then(function () { return ensureRecurringTransactionsCurrent(true); })
      .catch(function (error) { showStatus(error.message, true); });
  });
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) {
      checkForRemoteUpdates(true)
        .then(function () { return ensureRecurringTransactionsCurrent(true); })
        .catch(function (error) { showStatus(error.message, true); });
    }
  });
  els.monthInput.addEventListener("change", function () {
    setBudgetMonth(els.monthInput.value).catch(function (error) { showStatus(error.message, true); });
  });
  els.reportMonthInput.addEventListener("change", function () {
    setBudgetMonth(els.reportMonthInput.value).catch(function (error) { showStatus(error.message, true); });
  });
  els.reportViewFilter.addEventListener("change", renderReports);
  els.transactionMonthInput.addEventListener("change", function () {
    setBudgetMonth(els.transactionMonthInput.value).catch(function (error) { showStatus(error.message, true); });
  });
  els.budgetMonthInput.addEventListener("change", function () {
    setBudgetMonth(els.budgetMonthInput.value).catch(function (error) { showStatus(error.message, true); });
  });
  els.txType.addEventListener("change", function () {
    if (els.txType.value !== "expense") {
      els.txDebt.value = "";
    }
    renderSelectors();
    updateTransactionTypeUi();
  });
  els.txDebt.addEventListener("change", function () {
    if (els.txDebt.value) {
      els.txType.value = "expense";
      renderSelectors();
      chooseDebtCategory();
    }
  });
  els.recType.addEventListener("change", function () {
    if (els.recType.value !== "expense") {
      els.recDebt.value = "";
    }
    renderSelectors();
  });
  els.recDebt.addEventListener("change", function () {
    if (els.recDebt.value) {
      els.recType.value = "expense";
      renderSelectors();
      chooseRecurringDebtCategory();
    }
  });
  els.budgetKind.addEventListener("change", function () {
    renderSelectors();
    updateBudgetFormUi();
  });
  els.transactionSearch.addEventListener("input", renderTransactions);
  [
    els.transactionTypeFilter,
    els.transactionAccountFilter,
    els.transactionCategoryFilter,
    els.transactionDebtFilter,
    els.transactionMinFilter,
    els.transactionMaxFilter,
  ].forEach(function (control) {
    control.addEventListener("input", renderTransactions);
    control.addEventListener("change", renderTransactions);
  });
  els.txVendor.addEventListener("input", function () {
    renderVendorSuggestions(els.txVendor, els.txVendorSuggestions);
  });
  els.txVendor.addEventListener("focus", function () {
    renderVendorSuggestions(els.txVendor, els.txVendorSuggestions);
  });
  els.txVendor.addEventListener("blur", function () {
    hideVendorSuggestions(els.txVendorSuggestions);
  });
  els.recVendor.addEventListener("input", function () {
    renderVendorSuggestions(els.recVendor, els.recVendorSuggestions);
  });
  els.recVendor.addEventListener("focus", function () {
    renderVendorSuggestions(els.recVendor, els.recVendorSuggestions);
  });
  els.recVendor.addEventListener("blur", function () {
    hideVendorSuggestions(els.recVendorSuggestions);
  });
  els.transactionForm.addEventListener("submit", function (event) {
    saveTransaction(event).catch(function (error) { showStatus(error.message, true); });
  });
  els.cancelTransactionEditButton.addEventListener("click", clearTransactionEditMode);
  els.deleteTransactionEditButton.addEventListener("click", function () {
    const id = state.editingTransactionId;
    const baseId = state.editingTransferBaseId;
    if (!id && !baseId) {
      return;
    }
    if (confirm(baseId ? "Delete this transfer?" : "Delete this transaction?")) {
      const transferSide = baseId ? one("SELECT id FROM transactions WHERE source = 'transfer' AND external_id = ?", [baseId + "-out"]) : null;
      const targetId = id || (transferSide ? transferSide.id : null);
      if (targetId) {
        deleteTransaction(targetId).catch(function (error) { showStatus(error.message, true); });
      }
    }
  });
  els.recurringForm.addEventListener("submit", function (event) {
    saveRecurring(event).catch(function (error) { showStatus(error.message, true); });
  });
  els.cancelRecurringEditButton.addEventListener("click", clearRecurringEditMode);
  els.deleteRecurringEditButton.addEventListener("click", function () {
    if (state.editingRecurringId && confirm("Delete this recurring transaction? Existing transactions will stay.")) {
      deleteRecurring(state.editingRecurringId).catch(function (error) { showStatus(error.message, true); });
    }
  });
  els.runRecurringButton.addEventListener("click", function () {
    runDueRecurringNow().catch(function (error) { showStatus(error.message, true); });
  });
  els.accountForm.addEventListener("submit", function (event) {
    saveAccount(event).catch(function (error) { showStatus(error.message, true); });
  });
  els.cancelAccountEditButton.addEventListener("click", clearAccountEditMode);
  els.deleteAccountEditButton.addEventListener("click", function () {
    if (state.editingAccountId && confirm("Delete this account and its transactions?")) {
      deleteAccount(state.editingAccountId).catch(function (error) { showStatus(error.message, true); });
    }
  });
  els.categoryForm.addEventListener("submit", function (event) {
    saveCategory(event).catch(function (error) { showStatus(error.message, true); });
  });
  els.cancelCategoryEditButton.addEventListener("click", clearCategoryEditMode);
  els.deleteCategoryEditButton.addEventListener("click", function () {
    if (state.editingCategoryId && confirm("Delete this category? Existing transactions become uncategorized.")) {
      deleteById("categories", state.editingCategoryId, "Category deleted.").catch(function (error) { showStatus(error.message, true); });
    }
  });
  els.budgetForm.addEventListener("submit", function (event) {
    saveBudget(event).catch(function (error) { showStatus(error.message, true); });
  });
  els.cancelBudgetEditButton.addEventListener("click", clearBudgetEditMode);
  els.deleteBudgetEditButton.addEventListener("click", function () {
    if (state.editingBudgetId && confirm("Delete this budget line?")) {
      deleteById("budgets", state.editingBudgetId, "Budget deleted.").catch(function (error) { showStatus(error.message, true); });
    }
  });
  els.resetBudgetDefaultsButton.addEventListener("click", function () {
    resetBudgetFromDefaults().catch(function (error) { showStatus(error.message, true); });
  });
  els.debtForm.addEventListener("submit", function (event) {
    saveDebt(event).catch(function (error) { showStatus(error.message, true); });
  });
  els.cancelDebtEditButton.addEventListener("click", clearDebtEditMode);
  els.deleteDebtEditButton.addEventListener("click", function () {
    if (state.editingDebtId && confirm("Delete this debt?")) {
      deleteDebt(state.editingDebtId).catch(function (error) { showStatus(error.message, true); });
    }
  });
  els.exportCsvButton.addEventListener("click", exportCsv);
  els.importCsvInput.addEventListener("change", function () {
    const file = els.importCsvInput.files[0];
    if (file) {
      importCsvFile(file).catch(function (error) { showStatus(error.message, true); });
    }
  });
  document.body.addEventListener("click", function (event) {
    const button = event.target.closest("button[data-action]");
    const row = event.target.closest(".clickable-row[data-action]");
    const target = button || row;
    if (!target) {
      return;
    }
    const action = target.dataset.action;
    const id = target.dataset.id;
    if (action === "edit-transaction") {
      editTransaction(id);
    } else if (action === "delete-transaction" && confirm("Delete this transaction?")) {
      deleteTransaction(id).catch(function (error) { showStatus(error.message, true); });
    } else if (action === "edit-recurring") {
      editRecurring(id);
    } else if (action === "delete-recurring" && confirm("Delete this recurring transaction? Existing transactions will stay.")) {
      deleteRecurring(id).catch(function (error) { showStatus(error.message, true); });
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
    } else if (action === "edit-expected-income") {
      editExpectedIncome(id);
    } else if (action === "edit-budget") {
      editBudget(id);
    } else if (action === "delete-budget" && confirm("Delete this budget line?")) {
      deleteById("budgets", id, "Budget deleted.").catch(function (error) { showStatus(error.message, true); });
    } else if (action === "edit-debt") {
      editDebt(id);
    } else if (action === "delete-debt" && confirm("Delete this debt?")) {
      deleteDebt(id).catch(function (error) { showStatus(error.message, true); });
    } else if (action === "move-tab-up") {
      moveTab(id, -1);
    } else if (action === "move-tab-down") {
      moveTab(id, 1);
    }
  });
  document.body.addEventListener("keydown", function (event) {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }
    const row = event.target.closest(".clickable-row[data-action]");
    if (row) {
      event.preventDefault();
      row.click();
    }
  });
}

async function init() {
  createSupabaseClient();
  applyTabOrder();
  renderTabOrderSettings();
  bindEvents();
  els.txDate.value = today();
  els.recNextDate.value = today();
  els.monthInput.value = state.month;
  els.reportMonthInput.value = state.month;
  els.transactionMonthInput.value = state.month;
  els.budgetMonthInput.value = state.month;
  setReady(false);
  await refreshSession();
  state.supabase.auth.onAuthStateChange(function (_event, session) {
    state.session = session;
    state.user = session ? session.user : null;
    if (!state.user) {
      state.db = null;
      state.remoteVersion = null;
      state.remoteExists = false;
      state.syncMessage = "";
      stopAutoSyncChecks();
      setReady(false);
    }
    updateAuthUi();
  });
  if (state.user) {
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
  if (els.syncStatusValue) {
    els.syncStatusValue.textContent = "Sync Status: " + error.message;
  }
  showStatus(error.message, true);
});
