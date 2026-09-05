# Stack and playbooks

Run `spec-skills-lib/tools/detect-stack.sh` when `stack_profile` is `detect`.

Load `spec-skills-lib/playbooks/stacks/<stack_profile>.yaml` for test, lint, build, and security audit commands.

Merge overrides in `spec-skills-lib/rules/global-rules.override.yaml` when needed.
