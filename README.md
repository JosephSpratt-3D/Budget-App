# Christendom Budgeting

This is a standalone static web app for Christendom Budgeting.

It uses:

- Plain HTML
- Plain CSS
- Plain JavaScript
- SQL.js in the browser
- Supabase Auth for email/password accounts
- Supabase Storage for each user's `budget.sqlite3` file

It does not use Node.js, npm, React, a server, paid hosting, firewall ports, GitHub personal access tokens, or private GitHub repositories for user data.

## What It Stores

The web app opens, edits, and saves one SQLite database file per logged-in Supabase user:

```text
budgets/{user_id}/budget.sqlite3
```

The file is stored in a private Supabase Storage bucket named:

```text
budget-files
```

The frontend uses only the Supabase public anon key. Never put a Supabase service-role key in this app.

## Supabase Setup

1. Create a Supabase project.
2. Open `Authentication > Providers > Email` and enable email/password signups.
3. Open `Storage` and create a private bucket named `budget-files`.
4. Open the SQL editor and add Storage policies for the `budget-files` bucket.
5. In [app.js](/workspaces/Budget-App/app.js), set:

```js
const SUPABASE_URL = "https://YOUR_PROJECT_REF.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_PUBLIC_ANON_KEY";
```

Use the anon/public key from Supabase project settings. Do not use the service-role key.

## Storage Policies

Run these policies in the Supabase SQL editor. They allow authenticated users to read, create, and overwrite only their own budget file.

```sql
create policy "Users can read own budget file"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'budget-files'
  and name = 'budgets/' || (select auth.uid()::text) || '/budget.sqlite3'
);

create policy "Users can create own budget file"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'budget-files'
  and name = 'budgets/' || (select auth.uid()::text) || '/budget.sqlite3'
);

create policy "Users can update own budget file"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'budget-files'
  and name = 'budgets/' || (select auth.uid()::text) || '/budget.sqlite3'
)
with check (
  bucket_id = 'budget-files'
  and name = 'budgets/' || (select auth.uid()::text) || '/budget.sqlite3'
);
```

The app saves with Storage `upsert`, so it needs `select`, `insert`, and `update` policies.

## Daily Use

1. Open the app.
2. Sign up or log in with email and password.
3. Tap `Open Budget`.
4. Add accounts, categories, transactions, budgets, and debts.
5. Use `Sync` to write the current `budget.sqlite3` file to Supabase Storage.

Most changes save immediately after the action completes. Before a database is open, the signed-in panel has `Open Budget`. After the database is open, the top bar and Settings tab have manual `Sync` controls.

## Add To Home Screen On iPhone

1. Open the app in Safari.
2. Tap the Safari `Share` button.
3. Scroll down and tap `Add to Home Screen`.
4. Tap `Add`.
5. Open Christendom Budgeting from the new Home Screen icon.

## Multi-Device Sync

The app stores the whole SQLite database file in Supabase Storage, so two devices cannot safely merge simultaneous edits into one file. To make same-account use safer, the app tracks the remote Storage file version.

- When a budget opens, the app records the current remote file version.
- Before saving, the app checks whether another device has saved a newer file.
- If the remote file changed, the app blocks the save instead of overwriting the newer file.
- When this device has no unsaved local changes, it automatically refreshes from Supabase after remote changes are detected.
- Sync checks run when the app regains focus and about every 30 seconds while a budget is open.

For best results, avoid editing the same account on two devices at the exact same time. If the app says remote changes are available, use `Open Budget` to reload the newer file before continuing.

## Transactions

Adding a transaction:

1. Enter the amount.
2. Choose expense/income.
3. Choose account and category.
4. For a debt payment, choose the matching debt in `Linked Debt`.
5. Optionally add vendor and notes.
6. Tap `Save Transaction`.

Linked debt expense transactions reduce the selected debt's tracked balance. Editing or deleting a linked transaction reverses the old balance impact before applying the new one.

## Recurring Transactions

Use the `Recurring` tab to schedule repeating income or expense transactions.

1. Enter the amount, type, next date, and frequency.
2. Choose the account and category.
3. For recurring debt payments, choose the matching debt in `Linked Debt`.
4. Leave `Active` checked unless the schedule should be paused.
5. Tap `Add Recurring`.

When a budget is opened, the app automatically creates any recurring transactions due on or before today, advances each schedule's next date, and saves the updated database. Use `Run Due Now` to manually check for due schedules. Frequencies are weekly, biweekly, monthly, and yearly.

Generated recurring debt expense transactions reduce the linked debt balance just like manually entered linked debt payments.

## Budgeting

1. Open `Budgets`.
2. Enter expected income for the month.
3. Allocate that income across expense, savings, giving, debt, and other categories.
4. Keep allocating until `Left To Allocate` is `$0.00`.

Debt payments are added to the monthly budget automatically. The app sets the `Debt` allocation to the total of all tracked debts' minimum plus extra payments.

Budget rows show what has been spent so far, plus the planned and remaining amounts. Rows are green when spending is at or under the planned amount and red when spending is over plan. The dashboard category spending list shows the same planned and remaining details.

## Features

- Supabase email/password login and logout
- Per-user Supabase Storage file at `budgets/{user_id}/budget.sqlite3`
- Dashboard totals
- Account balances and net worth
- Add/edit/delete transactions
- Scheduled recurring transactions
- Fast transaction entry
- Vendor suggestions from previous transactions
- Transaction search
- CSV import/export
- Editable accounts
- Editable categories
- Zero-based monthly budgets
- Category allocation defaults and reset-from-defaults
- Editable debts with automatic monthly budget allocations and linked payment transactions
- Reports for cash flow, savings rate, budget performance, categories, income sources, accounts, and debt payoff

## Security Notes

- Do not store GitHub tokens. This app no longer uses GitHub for user data.
- Do not store Supabase service-role keys in the frontend.
- Use only the Supabase public anon key in `app.js`.
- Keep the `budget-files` bucket private.
- Enforce user isolation with Supabase Auth and Storage RLS policies.

## Reset

`Clear Local App State` closes the currently opened browser-side SQLite database. It does not delete the user's Supabase account or Storage file.
