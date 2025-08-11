# Pipeline triggering

Jenkinse pipelines are triggered on tag push. Ensure to have correct format of pipeline: `<platform>/<project_name>/<environment_short>/<version>`

- `<platform>` - should be in lowercase format (like slug in Infisical)
- `<project>` - should be in same format like in repository
- `<environment_short>` - short name of environment (can be gound in Infisical)
- `<version>` - version number
