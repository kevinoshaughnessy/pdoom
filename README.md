# p(Doom) by 2050: how to host it

The calculator is one static page, `index.html`. It works anywhere. Saving
answers needs somewhere to send them, set by `endpoint` in the `CONFIG` block
near the top of `index.html`. Respondents who choose "Keep my answers private"
never send anything.

| Option | Page hosted on | Answers saved to | Files used |
| --- | --- | --- | --- |
| A (simplest) | GitHub Pages | A Google Sheet | `index.html`, `apps-script/Code.gs` |
| B | Cloudflare Pages | A Cloudflare D1 database | `index.html`, `functions/api/submit.js`, `schema.sql` |

## Option A: GitHub Pages + Google Sheet

### 1. Set up saving (about 5 minutes)

1. Create a new Google Sheet, for example "p(Doom) responses".
2. In the sheet: Extensions → Apps Script. Delete the sample code, paste in all of
   `apps-script/Code.gs`, and save.
3. Deploy → New deployment → the gear icon → Web app.
   Set "Execute as" to **Me** and "Who has access" to **Anyone**. Deploy, and
   approve the permissions Google asks for.
4. Copy the web app URL. It starts `https://script.google.com/macros/s/` and ends `/exec`.
5. In `index.html`, set `endpoint` to that URL:
   `endpoint: 'https://script.google.com/macros/s/…/exec',`

Each saved response becomes a row in the `responses` tab. The `payload` column
holds the full answer set as JSON.

### 2. Publish the page

1. On GitHub, create a new **public** repository, for example `pdoom`.
   GitHub Pages is free only for public repositories, so the code will be visible.
2. Add file → Upload files → upload `index.html` → Commit.
3. Settings → Pages → Build and deployment: Source **Deploy from a branch**,
   branch **main**, folder **/ (root)** → Save.
4. After a minute or two the site is live. For a repository called `pdoom` under
   your account, the address is `https://kevinoshaughnessy.github.io/pdoom/`.
5. Set `shareUrl` in `index.html` to that address and upload the file again, so
   the share buttons point to the public site.

### 3. Check it

Take the quiz once with "Save my answers" selected, then look for a new row in
the sheet. The page can't read the Google script's reply, so it always says
"saved". The sheet is the real check.

## Option B: Cloudflare Pages + D1

1. Install the CLI: `npm install -g wrangler`, then `wrangler login`.
2. `wrangler d1 create pdoom`
3. `wrangler d1 execute pdoom --remote --file=schema.sql`
4. Set `endpoint: '/api/submit',` in `index.html`.
5. `wrangler pages deploy . --project-name=pdoom`
6. Dashboard: Workers & Pages → pdoom → Settings → Bindings → Add → D1 database.
   Variable name `DB`, database `pdoom`. Redeploy (step 5).
7. Set `shareUrl` to the live address and redeploy.

Read the data:

```
wrangler d1 execute pdoom --remote --json --command "SELECT payload FROM responses" > responses.json
```

## Before launch (both options)

- **Privacy notice.** You collect optional names and free text. If anyone in the
  UK or EU takes part, add a short notice: what's stored, why, for how long, and
  how to ask for deletion.
- **Spam.** Both back ends reject malformed and oversized posts. Anyone who reads
  the page source can find the save address, so expect the odd junk row and
  filter it out before analysis.
- **Versioning.** Bump `version` in `CONFIG` whenever you change wording or the
  model, so responses can be told apart.
