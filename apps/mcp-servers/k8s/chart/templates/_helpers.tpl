{{/*
Per-server config: every servers/<name>.yaml in the chart, keyed by <name>.
The file name is the URL path segment and the suffix of the Deployment/Service
name (mcp-<name>). Returns YAML; callers use `include "mcp.servers" . | fromYaml`.
*/}}
{{- define "mcp.servers" -}}
{{- $servers := dict -}}
{{- range $path, $content := .Files.Glob "servers/*.yaml" -}}
{{- $_ := set $servers (base $path | trimSuffix ".yaml") ($.Files.Get $path | fromYaml) -}}
{{- end -}}
{{- toYaml $servers -}}
{{- end -}}
