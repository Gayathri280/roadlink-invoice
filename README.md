# RoadLink Cargos — Invoice Generator

An Angular 17 web app to generate GST-compliant PDF invoices matching the RoadLink Cargos invoice format.

---

## Features
- Basic auth (hardcoded credentials, session-based)
- Invoice form: party details, itemised goods, Hamali/Halt charges
- Auto-calculated IGST (18%) or CGST+SGST (9%+9%)
- Grand Total in words (Indian numbering)
- One-click PDF download matching the original invoice layout
- Fully responsive UI

---

## Default Credentials

| Field    | Value            |
|----------|------------------|
| Username | `admin`          |
| Password | `roadlink@2024`  |

> To change: edit `src/environments/environment.ts` and `environment.prod.ts`

---

## Quick Start (Local)

```bash
# 1. Install dependencies
npm install

# 2. Start dev server
npm start
# Open http://localhost:4200
```

---

## Build for Production

```bash
npm run build:prod
# Output in dist/roadlink-invoice/
```

---

## Push to GitHub (Step-by-step)

### 1. Create a new GitHub repository
- Go to https://github.com/new
- Repository name: `roadlink-invoice`
- Keep it **Private** (recommended — contains credentials)
- Do **NOT** initialize with README (you already have one)
- Click **Create repository**

### 2. Initialize Git and push

```bash
# Inside the project folder
git init
git add .
git commit -m "Initial commit: RoadLink Invoice Generator"

# Add your GitHub remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/roadlink-invoice.git

git branch -M main
git push -u origin main
```

---

## Host on Netlify (Free, Recommended)

### Option A — Drag & Drop
1. Build the app: `npm run build:prod`
2. Go to https://app.netlify.com/drop
3. Drag the `dist/roadlink-invoice/browser/` folder onto the page
4. Your site is live instantly with a free URL

### Option B — Connect GitHub (Auto-deploy on push)
1. Go to https://app.netlify.com → **Add new site** → **Import from Git**
2. Choose GitHub → select `roadlink-invoice` repo
3. Set build settings:
   - **Build command:** `npm run build:prod`
   - **Publish directory:** `dist/roadlink-invoice/browser`
4. Click **Deploy site**
5. Every push to `main` auto-deploys ✓

> Add a `_redirects` file in `src/assets/` with content:
> ```
> /*  /index.html  200
> ```
> This fixes Angular routing on Netlify.

---

## Host on GitHub Pages

```bash
npm install -g angular-cli-ghpages

# Build with base-href set to your repo name
npm run build:prod -- --base-href="/roadlink-invoice/"

# Deploy
npx angular-cli-ghpages --dir=dist/roadlink-invoice/browser
```

Then go to: `https://YOUR_USERNAME.github.io/roadlink-invoice/`

---

## Project Structure

```
src/
├── app/
│   ├── auth/
│   │   ├── auth.service.ts       # Session-based auth
│   │   └── login.component.ts    # Login page
│   ├── guards/
│   │   └── auth.guard.ts         # Route protection
│   ├── invoice/
│   │   ├── invoice.model.ts      # TypeScript interfaces
│   │   ├── invoice.component.ts  # Invoice form logic
│   │   ├── invoice.component.html# Invoice form UI
│   │   └── pdf.service.ts        # PDF generation (jsPDF)
│   ├── app.component.ts
│   ├── app.config.ts
│   └── app.routes.ts
├── environments/
│   ├── environment.ts            # Dev config (credentials)
│   └── environment.prod.ts       # Prod config
└── styles.css                    # Global styles
```
