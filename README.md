# Christendom Budgeting

This is a standalone static web app for Christendom Budgeting.

It uses:

- Plain HTML
- Plain CSS
- Plain JavaScript
- SQL.js in the browser
- GitHub as the database storage/sync backend

It does not use Node.js, npm, React, a server, paid hosting, firewall ports, or direct access to a local Windows file.

## What It Edits

The web app downloads, opens, edits, and uploads:

```text
budget.sqlite3
```

from the selected GitHub repository and branch.

The Windows app can still use the same file by syncing with GitHub, but the web app no longer depends on the Windows app for daily entry.

## New User GitHub Sync Setup

To test without GitHub first, open the app and tap `Try Demo Without GitHub`. Demo mode creates a sample budget in this browser only. It does not upload anything and it can be cleared from `Settings`.

1. Put these files on GitHub Pages:
   - `index.html`
   - `style.css`
   - `app.js`
2. Open the published GitHub Pages URL.
3. Create or sign in to a GitHub account.
4. Create a private repository, for example `christendom-budget-sync`.
5. Create a fine-grained personal access token for only that repository.
6. Give the token `Contents: Read and write` permission.
7. Paste the token into Christendom Budgeting.
8. Tap `Load Repositories`.
9. Choose the repository from the dropdown.
10. Choose the branch from the dropdown, usually `main`.
11. Tap `Open Database`.

Christendom Budgeting stores `budget.sqlite3` at the root of the selected branch.

The fine-grained token needs:

- Access only to the private budget backup repo
- `Contents: Read and write`

## Daily Use

The first screen after loading is `Add`, because transaction entry is the focus.

Adding a transaction:

1. Enter the amount.
2. Choose expense/income.
3. Choose account and category.
4. For a debt payment, choose the matching debt in `Linked Debt`.
5. Optionally add vendor and notes.
6. Tap `Save Transaction`.

Christendom Budgeting saves the transaction into SQLite and uploads the updated `budget.sqlite3` to GitHub.

Budgeting:

1. Open `Budgets`.
2. Enter expected income for the month.
3. Allocate that income across expense, savings, giving, debt, and other categories.
4. Keep allocating until `Left To Allocate` is `$0.00`.

Debt payments are added to the monthly budget automatically. The app sets the `Debt`
allocation to the total of all tracked debts' minimum plus extra payments.

Budget rows show what has been spent so far, plus the planned and remaining amounts.
Rows are green when spending is at or under the planned amount and red when spending
is over plan. The dashboard category spending list shows the same planned and
remaining details.

The overall budget status is green when every dollar is assigned and red while money
is still unallocated or overallocated.

Accounts:

1. Open `Accounts`.
2. Add accounts for chequing, savings, credit cards, cash, or other balances.
3. Use `Edit` to rename an account, change its type, adjust opening balance, or change whether it counts toward net worth.

Debt tracking:

1. Add each debt in the `Debts` tab with its balance, interest rate, minimum payment, and extra payment.
2. When recording a debt payment transaction, choose the matching debt in `Linked Debt`.
3. Linked debt expense transactions reduce that debt's tracked balance.
4. Editing or deleting a linked transaction reverses the old balance impact before applying the new one.
5. Use `Edit` on a debt to update its balance, linked account, interest rate, or payment amounts.

## Features

- Dashboard totals
- Account balances and net worth
- Add/edit/delete transactions
- Fast transaction entry
- Vendor suggestions from previous transactions
- Transaction search
- CSV import/export
- Editable accounts
- Editable categories
- Zero-based monthly budgets where expected income must be allocated across categories
- Category allocation defaults and reset-from-defaults
- Editable debts with automatic monthly budget allocations and linked payment transactions
- Comprehensive past-month reports for cash flow, savings rate, budget performance, categories, income sources, accounts, and debt payoff

## Conflict Handling

The web app uploads the entire SQLite database file.

If GitHub says the database changed since the web app loaded it, saving fails with a conflict message. Use `Reload From GitHub`, then make the change again.

Avoid editing in the Windows app and web app at the exact same time.

## Reset

To clear saved browser settings, open:

```text
https://your-pages-url/?reset=1
```

or use `Clear Web Settings` in the Settings tab.

## Security Note

The GitHub token is stored in this browser's `localStorage`. Use a private repo and a token limited to that repo.
