# Templates

Replace `<name>`, `<port>`, `<health-path>`, `<domain>`, `<repo>`. Adapt to the app, do not
paste blindly. Paths are relative to `apps/<name>/k8s/chart/`.

## Chart.yaml

```yaml
apiVersion: v2
name: <name>
description: <name> for homeport
type: application
version: 0.1.0
appVersion: "latest"
```

## values.yaml

```yaml
image:
  repository: ghcr.io/lukasbriza/<name>
  # Bumped by .github/workflows/<name>-build-push.yml on every <name>-v* tag.
  tag: <name>-v0.1.0

replicas: 1

resources:
  requests: { cpu: 50m, memory: 128Mi }
  limits: { cpu: 500m, memory: 512Mi }

# Remove this block and pvc.yaml for a stateless app.
persistence:
  size: 1Gi
  storageClassName: local-path

service:
  port: <port>

ingress:
  enabled: false
  host: ""

# Non-secret env vars.
env: {}

infisical:
  enabled: false
  authRef:
    name: homeport-infisical-auth
    namespace: infisical-system
  projectId: ""
  environmentSlug: prod
  secretPath: /<name>
  # Kubernetes env var name -> Infisical secret key.
  secrets: {}
```

## values-prod.example.yaml (copy to values-prod.yaml, committed, no secrets)

```yaml
ingress:
  enabled: true
  host: "<domain>"
infisical:
  enabled: true
  projectId: "<Homeport project id>"
```

## templates/deployment.yaml

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ .Release.Name }}
  namespace: {{ .Release.Namespace }}
spec:
  replicas: {{ .Values.replicas }}
  selector:
    matchLabels:
      app: {{ .Release.Name }}
  template:
    metadata:
      labels:
        app: {{ .Release.Name }}
    spec:
      enableServiceLinks: false
      containers:
        - name: <name>
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
          ports:
            - containerPort: {{ .Values.service.port }}
          {{- with .Values.env }}
          env:
            {{- range $k, $v := . }}
            - name: {{ $k }}
              value: {{ $v | quote }}
            {{- end }}
          {{- end }}
          {{- if .Values.infisical.enabled }}
          envFrom:
            - secretRef:
                name: {{ .Release.Name }}-secrets
          {{- end }}
          readinessProbe:
            httpGet: { path: <health-path>, port: {{ .Values.service.port }} }
            initialDelaySeconds: 5
          livenessProbe:
            httpGet: { path: <health-path>, port: {{ .Values.service.port }} }
            initialDelaySeconds: 15
          resources:
            {{- toYaml .Values.resources | nindent 12 }}
          {{- if .Values.persistence }}
          volumeMounts:
            - name: data
              mountPath: /data
          {{- end }}
      {{- if .Values.persistence }}
      volumes:
        - name: data
          persistentVolumeClaim:
            claimName: {{ .Release.Name }}-data
      {{- end }}
```

Set `mountPath` to the directory the app writes to. If `env` is also set via `envFrom`
and `env`, make sure no key appears in both.

## templates/service.yaml

```yaml
apiVersion: v1
kind: Service
metadata:
  name: {{ .Release.Name }}
  namespace: {{ .Release.Namespace }}
spec:
  selector:
    app: {{ .Release.Name }}
  ports:
    - port: {{ .Values.service.port }}
      targetPort: {{ .Values.service.port }}
```

## templates/ingress.yaml

```yaml
{{- if .Values.ingress.enabled }}
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: {{ .Release.Name }}
  namespace: {{ .Release.Namespace }}
spec:
  ingressClassName: traefik
  tls:
    - hosts: [{{ .Values.ingress.host | quote }}]
      secretName: {{ .Release.Name }}-tls
  rules:
    - host: {{ .Values.ingress.host | quote }}
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: {{ .Release.Name }}
                port:
                  number: {{ .Values.service.port }}
{{- end }}
```

## templates/pvc.yaml (stateful apps only)

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: {{ .Release.Name }}-data
  namespace: {{ .Release.Namespace }}
  annotations:
    # local-path reclaims with Delete, so without this `helm uninstall` wipes the data.
    helm.sh/resource-policy: keep
spec:
  accessModes: ["ReadWriteOnce"]
  storageClassName: {{ .Values.persistence.storageClassName }}
  resources:
    requests:
      storage: {{ .Values.persistence.size }}
```

## templates/infisical-static-secret.yaml

```yaml
{{- if .Values.infisical.enabled }}
apiVersion: secrets.infisical.com/v1beta1
kind: InfisicalStaticSecret
metadata:
  name: {{ .Release.Name }}-secrets-sync
  namespace: {{ .Release.Namespace }}
spec:
  infisicalAuthRef:
    name: {{ .Values.infisical.authRef.name }}
    namespace: {{ .Values.infisical.authRef.namespace }}
  syncOptions:
    refreshInterval: 60s
  sources:
    - projectId: {{ .Values.infisical.projectId | quote }}
      environmentSlug: {{ .Values.infisical.environmentSlug }}
      secretPath: {{ .Values.infisical.secretPath | quote }}
  targets:
    - name: {{ .Release.Name }}-secrets
      namespace: {{ .Release.Namespace }}
      kind: Secret
      creationPolicy: Owner
      template:
        engineVersion: v1
        data:
          {{- range $envName, $infisicalKey := .Values.infisical.secrets }}
          # Not evaluated by Helm: printf emits literal text, the Infisical operator fills it in.
          {{ $envName }}: {{ printf "{{ .%s.Value }}" $infisicalKey | quote }}
          {{- end }}
{{- end }}
```

Fill `infisical.secrets` in `values.yaml`, e.g. `DATABASE_URL: DATABASE_URL`.

## .github/workflows/<name>-build-push.yml

```yaml
# Builds and pushes the <name> image, bumps the tag in the chart values, commits to
# master, then syncs ArgoCD. The ArgoCD Application has no automated sync, so nothing
# deploys except through this workflow's sync step.
name: Build and push <name> image

on:
  push:
    tags:
      - '<name>-v*'
  workflow_dispatch: {}

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      packages: write
    steps:
      - uses: actions/checkout@v4

      - name: Get version from tag
        id: vars
        run: echo "version=${GITHUB_REF_NAME#<name>-v}" >> "$GITHUB_OUTPUT"

      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push image
        uses: docker/build-push-action@v6
        with:
          context: .
          file: docker/node/Dockerfile
          build-args: |
            APP=<name>
            PORT=<port>
          push: true
          tags: ghcr.io/lukasbriza/<name>:<name>-v${{ steps.vars.outputs.version }}
          labels: org.opencontainers.image.source=https://github.com/${{ github.repository }}

      - name: Bump image tag in Helm values
        run: |
          sed -i "s/tag: <name>-v.*/tag: <name>-v${{ steps.vars.outputs.version }}/" apps/<name>/k8s/chart/values.yaml

      - name: Commit and push updated values
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          # A tag checkout is a detached HEAD. Switch to the branch ArgoCD tracks.
          git fetch origin master
          git checkout master
          git add apps/<name>/k8s/chart/values.yaml
          git diff --cached --quiet && echo "No changes to commit" || git commit -m "chore: bump <name> image to v${{ steps.vars.outputs.version }}"
          for i in 1 2 3; do
            git push origin master && break
            echo "push rejected, rebasing and retrying ($i/3)"
            git fetch origin master
            git rebase origin/master
            sleep 2
          done

      - name: Install argocd CLI
        run: |
          curl -sSL -o /usr/local/bin/argocd \
            https://github.com/argoproj/argo-cd/releases/latest/download/argocd-linux-amd64
          chmod +x /usr/local/bin/argocd

      - name: Sync via ArgoCD
        env:
          ARGOCD_AUTH_TOKEN: ${{ secrets.ARGOCD_AUTH_TOKEN }}
        run: |
          argocd app sync <name> --server argocd.lukasbriza.eu --grpc-web
          argocd app wait <name> --server argocd.lukasbriza.eu --grpc-web --health
```

If the repo's default branch is not `master`, tell the user before changing it: the
ArgoCD Application tracks the same branch.

## ArgoCD Application (print for the user; they add it to the infra repo)

File name in the infra repo: `applications/<name>.yaml`

```yaml
# ArgoCD Application for <name> (<repo> repo). Deploys only through the release tag
# (<name>-v*), whose workflow builds the image, bumps values.yaml and runs `argocd app sync`.
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: <name>
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/lukasbriza/<repo>.git
    targetRevision: master
    path: apps/<name>/k8s/chart
    helm:
      valueFiles:
        - values.yaml
        - values-prod.yaml
  destination:
    server: https://kubernetes.default.svc
    namespace: <name>
  syncPolicy:
    syncOptions:
      - CreateNamespace=true
```

After the user pushes it, the cluster's root Application picks it up. No `kubectl apply`.
