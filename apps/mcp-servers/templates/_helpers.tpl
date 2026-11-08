{{/*
Per-server config: every <dir>/server.yaml in the chart root, keyed by <dir>.
The directory name is the URL path segment and the suffix of the Deployment/Service
name (mcp-<dir>). Returns YAML; callers use `include "mcp.servers" . | fromYaml`.
*/}}
{{- define "mcp.servers" -}}
{{- $servers := dict -}}
{{- range $path, $content := .Files.Glob "*/server.yaml" -}}
{{- $_ := set $servers (base (dir $path)) ($.Files.Get $path | fromYaml) -}}
{{- end -}}
{{- toYaml $servers -}}
{{- end -}}
