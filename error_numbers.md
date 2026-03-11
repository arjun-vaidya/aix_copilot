# AI4Numerics Client Error Codes

The following table documents the internal error codes that may be surfaced to the client UI instead of raw error stack traces to provide technical obfuscation in student-facing interfaces.

| Error Code | Category | Internal Meaning | Required Action |
|------------|----------|-------------------|------------------|
| ERROR # 701 | Credentials | `VITE_GITHUB_PAT` environment variable missing or utilizing the unauthenticated placeholder | Secure a new repository PAT from Github and add it to the hidden `.env.local` config |
