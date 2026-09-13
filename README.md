<div align="center">

# Openline

### Make the call that matters.

Openline turns a real-world service question into an inspectable phone workflow, then returns the evidence a person needs to decide what happens next.

<p>
  <a href="https://github.com/Datwebguy/openline/actions"><img alt="CI" src="https://img.shields.io/github/actions/workflow/status/Datwebguy/openline/ci.yml?style=flat-square&label=checks"></a>
  <img alt="Node.js 20+" src="https://img.shields.io/badge/node-20%2B-1f8f70?style=flat-square">
  <img alt="CALL-E" src="https://img.shields.io/badge/CALL--E-integrated-6f42c1?style=flat-square">
  <img alt="Status" src="https://img.shields.io/badge/status-hackathon%20build-f97316?style=flat-square">
</p>

</div>

> **Evidence before confidence.** Openline is designed for questions where a web page may be stale, incomplete, or unavailable—but a phone call can still establish what is true right now.

## What Openline does

Openline helps a caseworker, resource navigator, or community member verify whether a service is actually available. The first workflow focuses on same-day food-support access: whether a provider is accepting new households, whether it is open during the requested window, what requirements apply, and whether the requested language can be supported.

The product is intentionally narrow at the start. It does not pretend to be a general directory, a booking agent, or an autonomous decision-maker. It creates a clear question, prepares a call plan, waits for a human approval, and presents the resulting evidence with uncertainty intact.

## Why it exists

Important services are often described by information that changes faster than websites and directories can be updated. A listing may say “open” while the phone coordinator says the program is full. A service may accept walk-ins but only during a short window. A requirement may be applied inconsistently or explained differently from one day to the next.

Openline treats the phone as a verification channel rather than a black box. The system shows what it plans to ask before a live call is made, identifies itself as an AI assistant, prohibits commitments such as bookings or payments, and returns a structured record instead of a vague success message.

## The workflow

<table>
  <tr>
    <td width="25%" bgcolor="#e8f7f1"><strong>01 · Request</strong><br><br>Describe the need, country, timing, language, household size, and any accessibility constraint.</td>
    <td width="25%" bgcolor="#eef3ff"><strong>02 · Review</strong><br><br>Openline turns the request into explicit provider questions and a visible call plan.</td>
    <td width="25%" bgcolor="#fff1e8"><strong>03 · Approve</strong><br><br>A person approves the exact calls before the live execution boundary is crossed.</td>
    <td width="25%" bgcolor="#f2edff"><strong>04 · Decide</strong><br><br>Evidence, requirements, confidence, and follow-up needs are returned for human review.</td>
  </tr>
</table>

The core rule is simple: Openline can verify facts, but it does not commit someone to an action. It does not book, purchase, pay, reserve, or promise an outcome on the user’s behalf.

## Product principles

- **Preview before execution.** The call plan is visible before approval.
- **Explicit human control.** Live calls require both live mode configuration and a user approval action.
- **Truthful uncertainty.** Outcomes distinguish confirmed, unavailable, voicemail, contradictory, failed, and unknown.
- **Structured evidence.** Results include evidence, requirements, confidence, and transcript data when available.
- **Server-side credentials.** The browser never receives the CALL-E API key.
- **Safe failure.** Unsupported regions, missing recipients, fixture numbers, and provider errors stop before a misleading success state is shown.
- **Simulation first.** The full request-to-evidence experience can be demonstrated without placing a real call.

## Current build status

The repository contains a working preview-first application with:

- a responsive, mobile-first interface;
- country-based intake with a complete country selector;
- deterministic simulation results;
- a guarded CALL-E adapter;
- explicit live-call approval;
- idempotency keys for live task creation;
- structured recipient result schemas;
- evidence and transcript rendering;
- live/simulation status reporting;
- in-product blocked and failed-call states;
- Vercel serverless deployment support;
- automated backend and adapter tests.

Live coverage is provider-controlled. The country selector is intentionally broad for request intake; the adapter separately validates the actual recipient’s configured region and language before creating a CALL-E task.

## Technology

Openline is deliberately small and dependency-light:

- **Runtime:** Node.js 20+
- **Backend:** Node.js HTTP server with a Vercel function adapter
- **Frontend:** semantic HTML, CSS, and browser JavaScript
- **Calling layer:** CALL-E Developer API
- **Testing:** Node’s built-in test runner
- **Deployment:** Vercel

There is no frontend framework or build step. This keeps the demo surface understandable, makes the integration boundary easy to inspect, and reduces deployment complexity.

## Run locally

### Requirements

- Node.js 20 or newer
- npm

### Install and start

```bash
npm install
npm start
```

Open the URL printed by the server. The local server prefers port `5050` and automatically selects another available development port when necessary.

The default configuration is simulation mode. It does not place real calls and does not require a CALL-E key.

### Run tests

```bash
npm test
npm audit --omit=dev
```

The test suite covers approval ordering, deterministic simulation outcomes, country-only requests, required-field validation, live confirmation guards, fixture-number rejection, and unsupported recipient-region rejection.

## Configuration

Copy the example file before enabling live behavior:

```bash
copy .env.example .env
```

For local simulation, the important settings are:

```env
OPENLINE_MODE=simulation
OPENLINE_LIVE_CONFIRM=false
```

For a real CALL-E run, all of the following must be deliberate:

```env
OPENLINE_MODE=live
OPENLINE_LIVE_CONFIRM=true
CALLE_API_KEY=your_server_side_key
OPENLINE_TEST_PHONE=authorized_e164_number
OPENLINE_TEST_REGION=CALL_E_REGION_CODE
OPENLINE_TEST_CITY=recipient_context
OPENLINE_LIVE_PROVIDER_ID=live-test-recipient
```

Use an authorized recipient number in E.164 format. Do not commit `.env`, API keys, phone numbers, or provider credentials. In Vercel, use project environment variables rather than `CALLE_API_KEY_FILE`; filesystem paths from a local machine do not exist in the deployment runtime.

Openline validates the recipient region and requested language against the current CALL-E live coverage before making a network request. A successful API response is not treated as proof that service availability was confirmed; the structured call result must still contain evidence.

## Vercel deployment

The repository includes `api/index.js` and `vercel.json`. The local server remains available through `npm start`, while Vercel uses the serverless function entrypoint.

### Deploy from the Vercel dashboard

1. Import `Datwebguy/openline` into Vercel.
2. Leave the framework preset as **Other**.
3. Use the repository root as the project root.
4. Do not add a build command; this project has no frontend compilation step.
5. Add `OPENLINE_MODE=simulation` for the first deployment.
6. Deploy and verify the home page and `/api/health`.
7. Add live CALL-E variables only after a supported, authorized recipient is available.

### Deploy from the CLI

```bash
npm install --global vercel
vercel login
vercel
vercel --prod
```

For a safe first deployment, keep live mode disabled. Treat enabling live mode as a separate release decision because it creates the ability to place real outbound calls.

## API surface

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/api/health` | Reports mode and live readiness without exposing credentials or phone numbers. |
| `GET` | `/api/providers` | Returns the public provider directory with recipient phone numbers removed. |
| `POST` | `/api/requests` | Creates a validated request. |
| `POST` | `/api/requests/:id/preview` | Builds an inspectable call plan. |
| `POST` | `/api/requests/:id/approve` | Records explicit approval. |
| `POST` | `/api/requests/:id/run` | Runs simulation or guarded live execution. |
| `GET` | `/api/requests/:id` | Reads the current request state. |

The current storage layer is process memory. That is appropriate for a hackathon demonstration, but a production deployment needs durable storage and a background job/reconciliation layer for calls that outlive a serverless invocation.

## Project structure

```text
openline/
├── api/
│   └── index.js              # Vercel function adapter
├── public/
│   ├── index.html            # Product surface
│   ├── styles.css            # Responsive visual system
│   ├── app.js                # Request, approval, and result flow
│   ├── countries.js          # Country selector data
│   ├── health.js             # Mode indicator
│   ├── product-ui.js         # Accessible error dialog
│   └── ui-stability.js       # Live progress feedback
├── server/
│   ├── calle-adapter.js      # CALL-E boundary and result normalization
│   ├── env.js                # Local environment loading
│   ├── index.js              # Local HTTP server and API handler
│   ├── providers.js          # Fixture and live-recipient directory
│   ├── simulation.js          # Deterministic demo scenarios
│   └── store.js              # Request lifecycle and decision ranking
├── test/                     # Domain and integration-boundary tests
├── .env.example
├── package.json
├── package-lock.json
└── vercel.json
```

## Safety and privacy boundaries

Openline can initiate real outbound calls when live mode is deliberately enabled. Operators must verify the recipient, region, language, purpose, and questions before approval. The caller identifies itself as an AI assistant and is instructed not to make commitments.

The application does not expose the CALL-E key to the browser, and public provider responses redact phone numbers. The current demo does not provide authentication, rate limiting, durable storage, or multi-user authorization; it should not be treated as a production service for sensitive case data without those controls.

## Roadmap

The next production-oriented improvements are:

1. durable request and evidence storage;
2. authenticated workspaces and request ownership;
3. background execution with webhook reconciliation;
4. provider onboarding and authorization records;
5. rate limiting, audit logs, and operational monitoring;
6. additional service categories beyond the initial food-support wedge;
7. supported-region capability discovery surfaced before approval.

## Contributing

Keep changes small, testable, and explicit about whether they affect simulation, live execution, or both. Never add secrets, personal recipient data, local environment files, or generated build output to a commit. Run the tests and dependency audit before opening a pull request.

## Status

Openline is an active hackathon build. The simulation workflow is the reliable demonstration path. Live execution is intentionally guarded and depends on CALL-E account coverage, an authorized recipient, and correctly configured deployment secrets.

<div align="center">

**Openline — evidence before confidence.**

</div>

## Judge presentation

The six-slide judge deck is available at [`openline-deck.html`](./openline-deck.html). Open it directly in a browser or serve the repository locally. Use the arrow keys, Page Up/Page Down, mouse wheel, touch swipe, or the right-side navigation dots to move between slides. The deck is designed to fit desktop, tablet, and mobile viewports without internal scrolling.

The deployed presentation is available at [openlinecall.vercel.app/openline-deck.html](https://openlinecall.vercel.app/openline-deck.html).

For submission portals that require a file upload, download the landscape PDF here: [Openline Judge Deck PDF](https://openlinecall.vercel.app/Openline-Judge-Deck.pdf). It contains the same six slides, one 16:9 slide per page.
