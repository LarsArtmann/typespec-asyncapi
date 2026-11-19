Done in 253e4665. The NPM_TOKEN secret is deleted, publish now authenticates via OIDC with `id-token: write` scoped to the publish job, and a full dry run of the pipeline is green (https://github.com/LarsArtmann/typespec-asyncapi/actions/runs/44599637231).

The one-time trusted-publisher registration needs a 2FA session on npmjs.com, so I am keeping this open until the first tokenless publish (1.2.0) proves it end to end.
