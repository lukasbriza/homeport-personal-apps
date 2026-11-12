# Chart and Application templates

Source of truth: `homeport-personal-apps/apps/actual/k8s/chart/`. Replace `<name>`,
`<port>`, `<domain>`. Adapt, do not paste blindly.

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

persistence:            # drop this block + pvc.yaml if the app is stateless
  size: 1Gi
  storageClassName: local-path

service:
  port: <port>

ingress:
  enabled: false
  host: ""

infisical:
  enabled: false
  projectId: ""
  environmentSlug: prod
  secretPath: /<name>
  authRef:
    name: homeport-infisical-auth
    namespace: infisical-system
```


## values-prod.example.yaml

```yaml
ingress:
  enabled: true
  host: "<domain>"
infisical:
  enabled: true
  projectId: "<Homeport project id>"
  secretPath: /<name>
```

## templates/deployment.yaml (essentials)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ .Release.Name }}
  namespace: {{ .Release.Namespace }}
spec:
  replicas: {{ .Values.replicas }}
  selector:
    matchLabels: { app: {{ .Release.Name }} }
  template:
    metadata:
      labels: { app: {{ .Release.Name }} }
    spec:
      enableServiceLinks: false
      containers:
        - name: <name>
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
          ports: [{ containerPort: {{ .Values.service.port }} }]
          envFrom:
            - secretRef: { name: {{ .Release.Name }}-secrets }   # only if infisical.enabled
          readinessProbe:
            httpGet: { path: /health, port: {{ .Values.service.port }} }   # use the app's real health path
            initialDelaySeconds: 5
          livenessProbe:
            httpGet: { path: /health, port: {{ .Values.service.port }} }
            initialDelaySeconds: 15
          resources:
            {{- toYaml .Values.resources | nindent 12 }}
```

Add `volumeMounts` + `volumes` (PVC `{{ .Release.Name }}-data`) only for stateful apps.

## templates/service.yaml, ingress.yaml, pvc.yaml

Copy unchanged from `apps/actual/k8s/chart/templates/`. Ingress uses `ingressClassName: traefik`,
TLS secret `{{ .Release.Name }}-tls`. Drop the `scaleToZero` branch unless opting in.

## templates/infisical-static-secret.yaml

Copy from `apps/mcp-servers/templates/infisical-static-secret.yaml`. Simplify to one
`sources` entry (`projectId`, `environmentSlug`, `secretPath`) and a `template.data` map
`ENV_NAME: "{{ .INFISICAL_KEY.Value }}"`. Target secret name: `{{ .Release.Name }}-secrets`.
The `{{ .X.Value }}` is evaluated by the Infisical operator, not Helm: escape it with
`{{ "{{ .X.Value }}" }}`.

## ArgoCD Application (infra repo)

File: `infrastructure/argocd/k8s/applications/<name>.yaml`

```yaml
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

The `root` Application picks the file up on push. No `kubectl apply` needed.
