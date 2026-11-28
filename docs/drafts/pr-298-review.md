> [!NOTE]
> Review done with Crush and GLM-5.3 (security pass over the publish path).

Audited the whole workflow. All six action pins resolve to the official tag commits (checkout v7.0.1, pnpm/action-setup v6.1.1, setup-node v7.1.0, setup-bun v2.2.0, upload-artifact v7.0.2, download-artifact v8.0.2), permissions are least-privilege per job, no secrets or token env left, `--ignore-scripts` on every publish, and npm receives the exact tarball the verify job gated on. Nothing shady found — merging.
