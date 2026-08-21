# Sherlock

Field inspection casefiles for occupational health and safety officers. Capture photo
evidence, notes and scanned documents on site, tag each piece to the employer responsible,
and assemble the per-employer report before leaving the site.

Built from a [Claude Design](https://claude.ai/design) prototype using its **Broadsheet**
design system.

## Status

Working prototype. Every screen from the design is implemented and clickable end to end.
State is in-memory only — it resets on reload — and the camera, microphone and scanner are
placeholders rather than real device APIs.

## Requirements

- Node.js 20.9 or newer (required by Next.js 16)
- npm

## Getting Started

```bash
git clone https://github.com/StewartRogers/Sherlock.git
cd Sherlock
npm install
cp .env.example .env.local
```

Fill in `.env.local` before starting — the app refuses to serve without it:

```bash
# a passcode of your choosing, or a generated one:
echo "APP_PASSCODE=$(openssl rand -base64 18 | tr -d '/+=' | cut -c1-20)" >> .env.local
echo "AUTH_SECRET=$(openssl rand -base64 32)" >> .env.local
```

```bash
npm run dev
```

Then open http://localhost:3000 and enter the passcode.

```bash
npm run build      # production build
npm start          # serve the production build
npm run typecheck  # tsc --noEmit
npm run lint       # next lint
```

## The app

An inspector opens a casefile and works through six sections:

| Section | What it does |
| --- | --- |
| **Capture** | Shutter adds photo evidence (`E-10`, `E-11`, …). Each photo is tagged to one or more employers on site; a bulk action copies the current tags onto every still-untagged photo. |
| **Notes** | Dictate or type a note, tag it, and save it as a Note (`N-1`) or a Request (`REQ-1`). Saved entries can be retagged or reclassified afterwards. |
| **Scan** | Multi-page document scanning with a running notes field. |
| **Case folder** | Every piece of evidence with its employer and type tags — Order, Reference, Request, or Open · needs review — plus primary/secondary exhibit ranking. |
| **Report content** | One report per employer: inspection note, orders, and regulation references, each editable and extendable. |
| **Knowledge graph** | An SVG node-link view of Casefile → Employers → Evidence. Selecting a node traces its connections and dims the rest. |

Below a container width of 720px the last three collapse behind a **More** tab, matching the
phone layout in the design.

### Employer slots

The seeded evidence and the graph are authored against two positional employer slots. A
casefile started with custom employers fills those slots in order, so the demo evidence
follows whoever the inspector actually named on the New casefile screen.

## Access control

The whole app sits behind a single shared passcode — there are no user accounts. Two
environment variables drive it:

| Variable | What it is |
| --- | --- |
| `APP_PASSCODE` | The passcode inspectors type in. Anyone who has it gets in, so make it long and random and share it out of band. |
| `AUTH_SECRET` | Signing key for the session cookie. Any long random string; `openssl rand -base64 32` is fine. Changing it signs everyone out. |

`proxy.ts` (Next.js 16's rename of the `middleware` convention) checks every request
that is not `/login` or `/api/login`. Without a valid
session it redirects to the passcode screen, and if either variable is missing it returns
503 rather than serving the app — a misconfiguration locks the door, it does not open it.

A correct passcode sets an `HttpOnly`, `SameSite=Lax`, `Secure` cookie holding a signed
expiry stamp — never the passcode itself — good for 12 hours. **More → Lock this device**
clears it. `/api/login` throttles to 8 attempts per 10 minutes per IP, per serverless
instance; for a hard ceiling put a Vercel WAF rate-limit rule in front of the route.

This is a shared doorkey, not authentication. It keeps the public out of a prototype. It
does not identify who did what, and rotating it means telling everyone the new code.

## Deploying to Vercel

```bash
vercel                                    # link the project
vercel env add APP_PASSCODE production    # paste the passcode when prompted
vercel env add AUTH_SECRET production     # paste the signing secret
vercel --prod
```

Add both to the **Preview** environment too, or preview deployments will 503. Set them
under *Settings → Environment Variables* in the dashboard if you would rather not use
the CLI.

## Design system

**Broadsheet** — newsprint set for the web. Source Serif 4 throughout, near-black `#201e1d`
on paper `#f3f2f2`, with process cyan `#0088b0` and magenta `#d6006c` used sparingly as spot
color. Hierarchy comes from the type scale and whitespace rather than boxes and dividers.

All tokens live at the top of `app/globals.css` as CSS custom properties — `--color-*`,
`--font-*`, `--space-*`, `--radius-*`, `--shadow-*`. Take values from those variables rather
than hard-coding a hex, font name, or pixel value the tokens already carry. Retuning the look
means editing that token block, not the components.

## Project Structure

```
.
├── app/
│   ├── api/login/route.ts # passcode check, session cookie, lock
│   ├── login/             # passcode screen
│   ├── globals.css        # Broadsheet tokens + component layer + app styles
│   ├── layout.tsx
│   └── page.tsx           # screen router (home / new casefile / inspection)
├── components/
│   ├── AppScreen.tsx      # tab bar and panel switching
│   ├── HomeScreen.tsx
│   ├── NewCaseScreen.tsx
│   ├── CaptureTab.tsx  NotesTab.tsx  ScanTab.tsx  MoreTab.tsx
│   ├── CaseFolderTab.tsx  ReportTab.tsx  GraphTab.tsx
│   ├── ImageSlot.tsx      # placeholder standing in for a photo or scan
│   └── icons.tsx
├── lib/
│   ├── auth.ts            # session token signing and verification
│   ├── data.ts            # seed casefiles, evidence, report copy, graph
│   ├── store.tsx          # single in-memory store behind a React context
│   └── types.ts
├── proxy.ts               # passcode gate on every route (was middleware.ts)
└── next.config.mjs
```

## Contributing

Issues and pull requests are welcome. Please open an issue to discuss substantial changes
before submitting a PR.

## License

Released under the [MIT License](LICENSE).
