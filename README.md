# Local Budget Mobile Companion

This is a plain HTML, CSS, and JavaScript mobile companion for the Windows Local Budget desktop app.

It does not use Node.js, npm, React, a server, or direct SQLite access.

## How It Works

- The Windows desktop app owns `budget.sqlite3`.
- The Windows app exports read-only phone data to `mobile_data.json`.
- This mobile page downloads `mobile_data.json` from GitHub.
- When you add a transaction on the phone, it writes a pending request to `mobile_changes.json`.
- The Windows app imports and validates `mobile_changes.json` on open and when you press `Sync`.
- After import, the Windows app archives and clears `mobile_changes.json` so phone transactions do not import twice.

The phone never edits `budget.sqlite3` directly.

## GitHub Requirements

Use the same private GitHub repository and folder that the Windows app uses.

Your fine-grained Personal Access Token needs:

- Access to only the backup repository
- `Contents: Read and write`

## First-Time Setup

1. Open the Windows app.
2. Go to `Backups`.
3. Enter your GitHub token, repo, branch, and folder.
4. Press `Sync`.
5. Confirm GitHub now has:
   - `budget.sqlite3`
   - `mobile_data.json`
6. Open `index.html` on your phone.
7. Enter:
   - `owner/repo`
   - branch, usually `main`
   - folder, usually `local-budget-backups`
   - your fine-grained token
8. Tap `Save And Load`.

## iPhone Options

You can use the files directly, or publish this folder with a free private workflow you control.

Simple local option:

1. Copy the `mobile_web` folder to iCloud Drive.
2. On iPhone, open `index.html` from the Files app.
3. If Safari blocks local JavaScript, use the GitHub Pages option below.

Free GitHub Pages option:

1. Put the `mobile_web` folder in a GitHub repository.
2. Enable GitHub Pages for that repository.
3. Open the published `index.html` URL on your iPhone.

GitHub Pages hosts only the static companion page. Your budget database stays in the private sync repo/folder configured in the app.

## Conflict Handling

- The phone submits pending transaction requests only.
- Each phone transaction has a unique id.
- The Windows app stores imported phone transaction ids in SQLite.
- If the same phone transaction appears again, the Windows app skips it.
- If a phone transaction references an unknown account, invalid type, or invalid amount, the Windows app skips it.
- The Windows app archives then clears `mobile_changes.json` after processing.

## Security Note

The GitHub token is stored in this browser's `localStorage`. Use a private repo and a fine-grained token limited to that repo.
