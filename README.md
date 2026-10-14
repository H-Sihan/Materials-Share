# Materials Share — GitHub Pages edition

Share class materials with an 8-character code (e.g. `V2WV-AF63`), hosted free on GitHub Pages, optionally on your own domain. No server to run.

## How it works

- **You** open `admin.html`, pick files, and press *Encrypt, upload & create code*. Your browser encrypts everything (AES-256-GCM) with a key derived from a fresh random code, then commits the encrypted files to this repo. A presenter screen shows the address and code for the projector.
- **Students** open the site, type the code (or follow `site/#CODE`). Their browser derives the same key, fetches the encrypted files and decrypts them locally. Single files or "Download all" as a zip.
- **The repo only ever contains ciphertext.** Titles, file names and contents are all encrypted; folder names are derived from the code via PBKDF2 (400,000 rounds), so they reveal nothing.
- **Expiry**: the student page refuses expired shares, and a daily GitHub Action deletes expired folders.

## Set up (about 10 minutes)

1. **Create a repository** on GitHub, e.g. `materials`.
   - Free account → must be **public** (the files in it are encrypted, so that's fine).
   - GitHub Pro / Team → can be private.
2. **Upload this folder's contents** to the repo root, including the hidden `.github` folder. Easiest with git:
   ```bash
   cd materials-share-github
   git init -b main && git add -A && git commit -m "Materials Share"
   git remote add origin https://github.com/YOUR-USERNAME/materials.git
   git push -u origin main
   ```
3. **Turn on Pages**: repo → *Settings → Pages* → Source: *Deploy from a branch* → `main` / `(root)` → Save. After a minute your site is at `https://YOUR-USERNAME.github.io/materials/`.
4. **Allow the cleanup job to commit**: *Settings → Actions → General → Workflow permissions* → *Read and write permissions*.
5. **Create an upload token**: GitHub → *Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token*
   - Repository access: *Only select repositories* → this repo
   - Permissions: *Contents → Read and write* (nothing else)
   - Expiry: e.g. 90 days (you'll just paste a new one when it runs out)
6. Open `https://YOUR-USERNAME.github.io/materials/admin.html`, paste the repo name and token, tick *Remember on this device* if it's your own machine, and press **Connect**.

## Your own domain (optional)

1. At your domain's DNS provider add a **CNAME** record: `get` → `YOUR-USERNAME.github.io`
2. Repo → *Settings → Pages → Custom domain* → `get.yourdomain.com` → Save, then tick **Enforce HTTPS** once it's offered (can take up to an hour).

Students then go to `get.yourdomain.com`.

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
