# Materials Share — GitHub Pages edition

Share class materials with an 8-character code (e.g. `V2WV-AF63`), hosted free on GitHub Pages, optionally on your own domain. No server to run.

## How it works

- **You** open `admin.html`, pick files, and press *Encrypt, upload & create code*. Your browser encrypts everything (AES-256-GCM) with a key derived from a fresh random code, then commits the encrypted files to this repo. A presenter screen shows the address and code for the projector.
- **Students** open the site, type the code (or follow `site/#CODE`). Their browser derives the same key, fetches the encrypted files and decrypts them locally. Single files or "Download all" as a zip.
- **The repo only ever contains ciphertext.** Titles, file names and contents are all encrypted; folder names are derived from the code via PBKDF2 (400,000 rounds), so they reveal nothing.
- **Expiry**: the student page refuses expired shares, and a daily GitHub Action deletes expired folders.

# https://h-sihan.github.io/Materials-Share/

## Day to day

- New share: `admin.html` → files → create. Live within about a minute.
- **Show** re-opens the presenter screen; **Delete** removes the share immediately (GitHub's cache may serve it for up to ~10 minutes).
- The share list lives in the browser you created it from. Codes can't be recovered from the repo — that's what keeps them secret. Use the same browser, or note codes down.

## Limits and honest caveats

- **50 MB per file**; keep the whole repo under ~1 GB (GitHub Pages limit). Delete old shares each semester.
- **No download counts or download caps** — a static site can't count.
- **Code strength**: 8 characters from 31 symbols (~850 billion combinations), each guess costing 400k PBKDF2 rounds. Fine for teaching materials; don't use it for anything confidential (personal data, exam papers).
- **Deleted files remain in git history** (still encrypted). For a clean slate, delete and recreate the repo.
- `config.js` holds your site's salt. **Never change it** after sharing codes, or every existing code stops working.
