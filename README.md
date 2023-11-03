Step to build:

```
pnpm install
pnpm dev:prepare
pnpm prepack
pnpm build
pnpm pack --pack-destination ../tl-frontend-mono
```

Edits

1. src/runtime/composables/commonAuthState.ts (TL Edit: Get origin from runtime config)
2. src/runtime/composables/local/useAuth.ts (TL Edit: Update getSession to get GA client id from cookies and attach the client id to Headers)
