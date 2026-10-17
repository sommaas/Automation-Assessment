# SauceDemo UI + Reqres API Automation

Automation assessment covering:

| Part | Target | Tooling | Reports |
|------|--------|---------|---------|
| UI automation (Q1–Q3) | https://www.saucedemo.com | Playwright + TypeScript (Page Object Model) | Playwright HTML + Allure |
| API automation (API-Q3 – API-Q8) | https://reqres.in/api | Postman collection, executed from CLI with Newman | Newman HTML (htmlextra) + JUnit XML |

---

## 1. Prerequisites

- **Node.js 18+** (20 LTS recommended) and npm
- **Java 8+** — only needed to build the **Allure** HTML report (`allure-commandline` is Java-based). The Playwright HTML report works without Java.
- Git

## 2. Installation

```bash
git clone <this-repo-url>
cd saucedemo-reqres-automation
npm install
npx playwright install chromium        # downloads the browser (add --with-deps on Linux CI)
```

## 3. Project structure

```
├── pages/                         # Page Objects
│   ├── LoginPage.ts
│   ├── HeaderMenu.ts              # hamburger menu (Reset App State, Logout) + cart icon
│   ├── InventoryPage.ts           # product list, sorting, add to cart
│   ├── CartPage.ts
│   └── CheckoutPage.ts            # info form, overview (final checkout page), complete page
├── tests/ui/
│   ├── q1-locked-out-user.spec.ts
│   ├── q2-standard-user-checkout.spec.ts
│   └── q3-performance-glitch-user.spec.ts
├── utils/testData.ts              # users, messages, customer info, price helpers
├── api/
│   ├── reqres.postman_collection.json    # Postman collection (import into Postman or run with Newman)
│   └── reqres.postman_environment.json   # baseUrl, apiKey, credentials, expected data
├── playwright.config.ts
└── .github/workflows/tests.yml   # optional CI run with reports uploaded as artifacts
```

---

## 4. UI automation (Playwright)

### Run each scenario separately

```bash
npm run ui:q1     # Q1 – locked_out_user error message
npm run ui:q2     # Q2 – standard_user: reset, 3 items, checkout, verify, finish, reset, logout
npm run ui:q3     # Q3 – performance_glitch_user: reset, sort Z→A, first item, checkout, verify, finish, reset, logout
```

### Run all scenarios together (sequentially Q1 → Q2 → Q3)

```bash
npm run ui:all
```

The config uses `workers: 1` and `fullyParallel: false`, so the specs always run one after another in file order.
Add `--headed` (or use `npm run ui:headed`) to watch the browser.

### Reports (generated on every execution)

Each `ui:*` command first clears old results, then produces:

| Report | Location | Open it |
|--------|----------|---------|
| Playwright HTML | `playwright-report/index.html` | `npm run report:playwright` |
| Allure results | `allure-results/` | `npm run report:allure` (generates `allure-report/` and opens it) |

Screenshots, videos and traces are attached automatically for failed tests.

### What each scenario verifies

**Q1 – locked_out_user**
- Error text equals `Epic sadface: Sorry, this user has been locked out.`
- User stays on the login page.

**Q2 – standard_user**
1. Login → Reset App State from the hamburger menu (cart badge verified empty).
2. Add the first three products; cart badge shows `3`.
3. Cart → Checkout → customer info → **final checkout (overview) page**.
4. Verifies every product name, and that *Item total* = sum of the prices captured on the inventory page, *Tax* = 8 % of item total, *Total* = item total + tax.
5. Finish → verifies `Thank you for your order!` and the dispatch message.
6. Reset App State again → Logout → back on the login page.

**Q3 – performance_glitch_user**
1. Login (slow by design — timeouts are raised accordingly) → Reset App State.
2. Sort **Name (Z to A)** and assert the list really is in descending order.
3. Add the first product, go to the final checkout page, verify all product names, item total, tax and total.
4. Finish → verify success message → Reset App State → Logout.

---

## 5. API automation (Postman + Newman)

### API key (important)

Reqres now requires an `x-api-key` header on every `/api/*` call (missing key → `401`).
The environment ships with the public free key `reqres-free-v1`. If it is rejected, create your own free key at https://app.reqres.in/ and either:

- edit `apiKey` in `api/reqres.postman_environment.json`, or
- pass it at run time: `npm run api:all -- --env-var "apiKey=YOUR_KEY"`

The free plan allows ~250 requests/day per key — plenty for this suite (12 requests per full run).

### Run each scenario separately

```bash
npm run api:q3    # Login with registered credentials – capture authToken
npm run api:q4    # GET user by userId – verify name & email
npm run api:q5    # PUT updated profile – verify updatedAt
npm run api:q6    # PATCH single field – verify only that field changed
npm run api:q8    # Bad requests using stored data – assert 4xx
```

Each folder can run on its own: a collection-level pre-request script logs in automatically if no `authToken` has been captured yet.

### Run all API scenarios together (sequentially)

```bash
npm run api:all
```

### Run with Newman directly (without npm scripts)

```bash
npx newman run api/reqres.postman_collection.json \
  -e api/reqres.postman_environment.json \
  -r cli,htmlextra --reporter-htmlextra-export reports/api/report.html
```

You can also **import both JSON files into Postman** and use the Collection Runner.

### Reports (generated on every execution)

`reports/api/*.html` — one HTML report per run (`api-q3-login.html`, …, `api-all.html`), plus `api-all.xml` (JUnit) for the full run.

### What each request verifies

Every request asserts its **exact status code** (mandatory requirement), plus a global response-time check.

| # | Request | Assertions |
|---|---------|-----------|
| API-Q3 | `POST /login` (eve.holt@reqres.in) | `200`, token present and non-empty, stored as `authToken` |
| API-Q4 | `GET /users/{{userId}}` | `200`, id matches, first/last name and email match expected data, stores user for later steps |
| API-Q5 | `PUT /users/{{userId}}` | `200`, name/job echoed, `updatedAt` is valid ISO-8601 and within 5 min of the request time |
| API-Q6 | `PATCH /users/{{userId}}` `{job}` | `200`, job updated, response contains **only** `job` + `updatedAt`, no other field present |
| API-Q6 | `GET /users/{{userId}}` after PATCH | `200`, first name, last name and email unchanged vs stored data |
| API-Q8 | `POST /login` stored email, no password | `400`, `Missing password` |
| API-Q8 | `POST /login` stored password, no email | `400`, missing email/username |
| API-Q8 | `POST /login` unregistered email | `400`, `user not found` |
| API-Q8 | `POST /register` stored email, no password | `400`, `Missing password` |
| API-Q8 | `GET /users/23` (non-existent) | `404`, empty body |
| API-Q8 | `GET /unknown/23` | `404` |
| API-Q8 | `GET /users/{{userId}}` without `x-api-key` | `401` |

> Note: the assessment numbers the API questions Q3, Q4, Q5, Q6, Q8 (UI also has a Q3 and there is no Q7). The Postman folders are prefixed `API-` to keep them distinct from the UI scenarios.

---

## 6. Run everything (UI then API)

```bash
npm run test:all
```

## 7. CI (optional)

`.github/workflows/tests.yml` runs both suites on GitHub Actions and uploads the Playwright, Allure and Newman reports as build artifacts. Add a repository secret `REQRES_API_KEY` if you use your own reqres key.
