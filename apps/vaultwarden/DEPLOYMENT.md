# Kubernetes (k3s) deployment

Helm chart lives in `k8s/chart/`. `values.yaml` (committed, safe defaults) is the k3s
equivalent of `.env.local`; `values-prod.yaml` (gitignored, see `values-prod.example.yaml`
for the template) is the equivalent of `.env`.

1. Copy `k8s/chart/values-prod.example.yaml` to `k8s/chart/values-prod.yaml` and fill in
   `domain`, `ingress.host`, and either `adminToken` or the `infisical.*` block (see below).

2. Install:

   ```bash
   cd k8s/chart
   helm install vaultwarden . -n vaultwarden --create-namespace -f values-prod.yaml
   ```

3. Upgrade after any change to `values-prod.yaml` or `templates/`:

   ```bash
   helm upgrade vaultwarden . -n vaultwarden -f values-prod.yaml
   ```

4. Preview what will actually change before applying, without touching the cluster:

   ```bash
   helm template vaultwarden . -f values-prod.yaml
   ```

5. Rollback if an upgrade breaks something:

   ```bash
   helm history vaultwarden -n vaultwarden
   helm rollback vaultwarden <REVISION> -n vaultwarden
   ```

6. Uninstall:

   ```bash
   helm uninstall vaultwarden -n vaultwarden
   kubectl delete namespace vaultwarden
   ```

## ADMIN_TOKEN on Kubernetes

Two options, controlled by `infisical.enabled` in `values-prod.yaml`:

- `infisical.enabled: false` — generate the token the same way as below (throwaway
  container, `/vaultwarden hash`), but paste the resulting hash into `adminToken` in
  `values-prod.yaml` instead of Infisical, then `helm upgrade` to apply it. Access the
  admin page on `<domain>/admin` with the plaintext password you typed while hashing.
- `infisical.enabled: true` (recommended) — the operator only *syncs* whatever value you
  put in Infisical, it doesn't generate one. Requires the cluster-wide operator setup
  described in `homeport-architecture-apps/DEPLOYMENT.md` (step 6) to already be in place;
  fill in `infisical.projectId`/`environmentSlug`/`secretPath` to match where the token
  lives in your Infisical project.

  Generate the token in a throwaway container (no need to touch the running pod):

  ```bash
  docker run --rm -it vaultwarden/server /vaultwarden hash
  ```

  Set a password when prompted, then paste the resulting `$argon2id$...` hash as the
  `VAULTWARDEN_ADMIN_TOKEN` value in Infisical. Vaultwarden detects the `$argon2id$` prefix
  and switches to hashed comparison — log into `/admin` with the plaintext password you
  typed above, not the hash itself. This also means the value that actually ends up in the
  k8s Secret / pod env (visible via `kubectl describe`) is the hash, not a usable token on
  its own — worth doing even though Infisical is already an encrypted store, since anyone
  with `kubectl describe`/`docker inspect` access to the cluster would otherwise see a
  working plaintext token.
