# SignalDesk

template for frontend implementation of Shadow Yield

## The application lives in [`hampton-roads-history/`](./hampton-roads-history)

The full Next.js 16 app (Hampton Roads History) is in the
[`hampton-roads-history/`](./hampton-roads-history) subdirectory — **not** at
the repo root. The `exampleHTML.html` file at the root is only the original
static mockup.

### Running it in GitHub Codespaces

A [`.devcontainer`](./.devcontainer/devcontainer.json) is configured, so a new
Codespace opens directly into `hampton-roads-history/` and installs
dependencies automatically. Once it finishes:

```bash
npm run dev
```

Then open the forwarded port **3000**. (See
[`hampton-roads-history/README.md`](./hampton-roads-history/README.md) for the
environment variables needed for full functionality — the homepage renders
without them, but Supabase-backed features need the keys.)

### Running it locally

```bash
cd hampton-roads-history
npm install
npm run dev
```
