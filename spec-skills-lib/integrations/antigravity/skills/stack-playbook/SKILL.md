---
name: stack-playbook
description: Resolve stack profile and load test/lint/build commands. Use when unsure which toolchain applies.
---

# Stack playbook

If `stack_profile` is `detect`, run `spec-skills-lib/tools/detect-stack.sh`.

Load `spec-skills-lib/playbooks/stacks/<profile>.yaml` and use its `commands` and `security_audit_commands`.
