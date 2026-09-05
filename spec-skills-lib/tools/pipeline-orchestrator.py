#!/usr/bin/env python3
"""Lightweight pipeline orchestrator for spec-skills multi-agent flows."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

try:
    import yaml
except ImportError:
    print("ERROR: PyYAML required. Install: pip install pyyaml", file=sys.stderr)
    sys.exit(1)

# Maps flow artifact IDs to project-relative doc paths
ARTIFACT_PATHS: dict[str, str] = {
    "project-brief": "docs/business/project-brief.md",
    "problem-statement": "docs/business/problem-statement.md",
    "success-metrics": "docs/business/success-metrics.md",
    "market-research": "docs/discovery/market-research.md",
    "competitive-map": "docs/discovery/competitive-map.md",
    "icp-personas": "docs/discovery/icp-personas.md",
    "viability-summary": "docs/digital-business/viability-summary.md",
    "profitability-model": "docs/digital-business/profitability-model.md",
    "product-approach": "docs/saas/product-approach.md",
    "startup-pattern-checklist": "docs/saas/startup-pattern-checklist.md",
    "requirements": "docs/requirements/requirements.md",
    "acceptance-criteria": "docs/requirements/acceptance-criteria.md",
    "wbs": "docs/requirements/wbs.md",
    "epics": "docs/requirements/epics.md",
    "wireframes": "docs/ux/wireframes.md",
    "design-system": "docs/ux/design-system.md",
    "a11y-checklist": "docs/ux/a11y-checklist.md",
    "sales-strategy": "docs/copy/sales-strategy.md",
    "copy-deck": "docs/copy/launch-copy-deck.md",
    "solution-design": "docs/architecture/solution-design.md",
    "adr": "docs/architecture/adr-001.md",
    "ai-architecture": "docs/ai/ai-architecture.md",
    "eval-plan": "docs/ai/eval-plan.md",
    "llm-cost-estimate": "docs/ai/llm-cost-estimate.md",
    "option-evaluation": "docs/cloud/option-evaluation.md",
    "architecture-overview": "docs/cloud/architecture-overview.md",
    "threat-model": "docs/security/threat-model.md",
    "security-controls": "docs/security/controls-matrix.md",
    "terms-of-service": "docs/legal/terms-of-service.md",
    "privacy-policy": "docs/legal/privacy-policy.md",
    "compliance-checklist": "docs/legal/compliance-checklist.md",
    "implementation-cost-plan": "docs/finops/implementation-cost-plan.md",
    "optimization-backlog": "docs/finops/optimization-backlog.md",
    "ci-cd": "docs/infrastructure/ci-cd.md",
    "environments": "docs/infrastructure/environments.md",
    "iac": "docs/infrastructure/iac.md",
    "ui-implementation": "docs/frontend/ui-contracts.md",
    "ui-tests": "docs/frontend/test-evidence.md",
    "api-implementation": "docs/backend/api-contract.md",
    "api-tests": "docs/backend/test-report.md",
    "workflow-inventory": "docs/automation/workflow-inventory.md",
    "n8n-setup": "docs/automation/n8n-setup.md",
    "readme": "README.md",
    "runbook": "docs/runbook.md",
    "release-notes": "docs/release-notes.md",
    "dashboards": "docs/observability/dashboards.md",
    "alerts": "docs/observability/alerts.md",
    "tracing-config": "docs/observability/tracing.md",
    "qa-report": "docs/qa/validation-report.md",
    "go-no-go": "docs/qa/regression-report.md",
    "billing-setup": "docs/saas-ops/billing-setup.md",
    "tenant-management": "docs/saas-ops/tenant-management.md",
    "metrics-dashboard": "docs/saas-ops/metrics-dashboard.md",
    "incident-playbook": "docs/support/incident-playbook.md",
    "feedback-backlog": "docs/support/feedback-backlog.md",
    "growth-strategy": "docs/growth/growth-strategy.md",
    "seo-baseline": "docs/growth/seo-baseline.md",
    "retention-metrics": "docs/growth/retention-metrics.md",
}

SOFT_DEPENDENCIES: list[tuple[str, str, str]] = [
    # (stage_id, requires_stage_id, condition_key)
    ("stage-cloud", "stage-ai-engineering", "ai_features_enabled"),
]


@dataclass
class StageInfo:
    id: str
    role: str
    mode: str
    inputs: list[str]
    outputs: list[str]
    skip_when: str | None = None


@dataclass
class ParallelGroup:
    id: str
    stages: list[str]
    join_stage: str
    join_policy: str = "all"


@dataclass
class PipelineState:
    flow_name: str
    completed: list[str] = field(default_factory=list)
    artifact_hashes: dict[str, str] = field(default_factory=dict)
    updated_at: str = ""

    def to_dict(self) -> dict[str, Any]:
        return {
            "flow_name": self.flow_name,
            "completed": self.completed,
            "artifact_hashes": self.artifact_hashes,
            "updated_at": self.updated_at,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> PipelineState:
        return cls(
            flow_name=data.get("flow_name", ""),
            completed=list(data.get("completed", [])),
            artifact_hashes=dict(data.get("artifact_hashes", {})),
            updated_at=data.get("updated_at", ""),
        )


class PipelineOrchestrator:
    def __init__(self, project_root: Path, lib_root: Path | None = None) -> None:
        self.project_root = project_root.resolve()
        self.lib_root = (lib_root or project_root / "spec-skills-lib").resolve()
        self.state_dir = self.project_root / ".spec-skills"
        self.state_file = self.state_dir / "pipeline-state.yaml"
        self.rules = self._load_rules()
        self.flow = self._load_flow()
        self.stages = {s["id"]: StageInfo(
            id=s["id"],
            role=s["role"],
            mode=s["mode"],
            inputs=list(s.get("inputs", [])),
            outputs=list(s.get("outputs", [])),
            skip_when=s.get("skip_when"),
        ) for s in self.flow["stages"]}
        self.predecessors = self._build_predecessors()
        self.parallel_groups = self._resolve_parallel_groups()
        self.state = self._load_state()
        self._reconcile_skip_state()

    def _rel_path(self, path: Path) -> str:
        try:
            return str(path.relative_to(self.project_root))
        except ValueError:
            return str(path)

    def _load_yaml(self, path: Path) -> dict[str, Any]:
        if not path.is_file():
            raise FileNotFoundError(f"Missing config: {path}")
        with path.open(encoding="utf-8") as f:
            data = yaml.safe_load(f)
        if not isinstance(data, dict):
            raise ValueError(f"Expected mapping in {path}")
        return data

    def _load_rules(self) -> dict[str, Any]:
        rules_path = self.lib_root / "rules" / "global-rules.yaml"
        rules = self._load_yaml(rules_path)
        override = self.lib_root / "rules" / "global-rules.override.yaml"
        if override.is_file():
            override_data = self._load_yaml(override)
            self._deep_merge(rules, override_data)
        return rules

    def _deep_merge(self, base: dict[str, Any], override: dict[str, Any]) -> None:
        for key, value in override.items():
            if key in base and isinstance(base[key], dict) and isinstance(value, dict):
                self._deep_merge(base[key], value)
            else:
                base[key] = value

    def _active_flow_name(self) -> str:
        flow_cfg = self.rules.get("flow_config", {})
        if flow_cfg.get("opc_mode"):
            return "opc-flow"
        if flow_cfg.get("complexity_profile") == "high":
            return "complex-flow"
        return flow_cfg.get("active_flow", "default-flow")

    def _load_flow(self) -> dict[str, Any]:
        flow_name = self._active_flow_name()
        flow_path = self.lib_root / "flows" / f"{flow_name}.yaml"
        flow = self._load_yaml(flow_path)
        flow["_resolved_name"] = flow_name
        return flow

    def _build_predecessors(self) -> dict[str, set[str]]:
        preds: dict[str, set[str]] = defaultdict(set)
        for stage_id in self.stages:
            preds[stage_id]  # ensure key exists
        for tr in self.flow.get("transitions", []):
            preds[tr["to"]].add(tr["from"])
        return dict(preds)

    def _infer_parallel_groups(self) -> list[ParallelGroup]:
        groups: list[ParallelGroup] = []
        by_from: dict[str, list[str]] = defaultdict(list)
        for tr in self.flow.get("transitions", []):
            by_from[tr["from"]].append(tr["to"])
        for fork_from, targets in by_from.items():
            if len(targets) < 2:
                continue
            join_candidates: dict[str, int] = defaultdict(int)
            for target in targets:
                for tr in self.flow.get("transitions", []):
                    if tr["from"] == target:
                        join_candidates[tr["to"]] += 1
            for join_stage, count in join_candidates.items():
                if count == len(targets):
                    groups.append(ParallelGroup(
                        id=f"inferred-{fork_from}",
                        stages=sorted(targets),
                        join_stage=join_stage,
                    ))
                    break
        return groups

    def _resolve_parallel_groups(self) -> list[ParallelGroup]:
        explicit = self.flow.get("parallel_groups", [])
        if explicit:
            return [
                ParallelGroup(
                    id=g["id"],
                    stages=list(g["stages"]),
                    join_stage=g["join_stage"],
                    join_policy=g.get("join_policy", "all"),
                )
                for g in explicit
            ]
        return self._infer_parallel_groups()

    def _load_state(self) -> PipelineState:
        flow_name = self.flow["_resolved_name"]
        if not self.state_file.is_file():
            return PipelineState(flow_name=flow_name)
        data = self._load_yaml(self.state_file)
        state = PipelineState.from_dict(data)
        if state.flow_name != flow_name:
            print(
                f"WARNING: state flow '{state.flow_name}' != active '{flow_name}'; resetting state.",
                file=sys.stderr,
            )
            return PipelineState(flow_name=flow_name)
        if data.get("skipped"):
            print(
                "NOTE: Ignoring persisted 'skipped' list; skip status is derived from current flow config.",
                file=sys.stderr,
            )
        return state

    def _reconcile_skip_state(self) -> None:
        """Drop completed entries for stages that are currently skipped by config."""
        skipped_now = {sid for sid in self.stages if self._eval_skip_when(self.stages[sid].skip_when)}
        before = len(self.state.completed)
        self.state.completed = [sid for sid in self.state.completed if sid not in skipped_now]
        if len(self.state.completed) != before:
            self._save_state()

    def _save_state(self) -> None:
        self.state.flow_name = self.flow["_resolved_name"]
        self.state.updated_at = datetime.now(timezone.utc).isoformat()
        self.state_dir.mkdir(parents=True, exist_ok=True)
        with self.state_file.open("w", encoding="utf-8") as f:
            yaml.safe_dump(self.state.to_dict(), f, sort_keys=False, allow_unicode=True)

    def _eval_skip_when(self, skip_when: str | None) -> bool:
        if not skip_when:
            return False
        skip_when = skip_when.strip()
        if skip_when == "ai_features_enabled == false":
            return not self.rules.get("flow_config", {}).get("ai_features_enabled", False)
        return False

    def _is_skipped(self, stage_id: str) -> bool:
        stage = self.stages[stage_id]
        return self._eval_skip_when(stage.skip_when)

    def _is_completed(self, stage_id: str) -> bool:
        return stage_id in self.state.completed or self._is_skipped(stage_id)

    def _soft_deps_satisfied(self, stage_id: str) -> bool:
        flow_cfg = self.rules.get("flow_config", {})
        for stage, requires, cond_key in SOFT_DEPENDENCIES:
            if stage_id != stage:
                continue
            if not flow_cfg.get(cond_key, False):
                continue
            if not self._is_completed(requires):
                return False
        return True

    def _predecessors_satisfied(self, stage_id: str) -> bool:
        for pred in self.predecessors.get(stage_id, set()):
            if not self._is_completed(pred):
                return False
        return True

    def _is_ready(self, stage_id: str) -> bool:
        if stage_id not in self.stages:
            return False
        if self._is_completed(stage_id):
            return False
        if not self._predecessors_satisfied(stage_id):
            return False
        if not self._soft_deps_satisfied(stage_id):
            return False
        return True

    def ready_stages(self) -> list[str]:
        return sorted(sid for sid in self.stages if self._is_ready(sid))

    def artifact_path(self, artifact_id: str) -> Path:
        rel = ARTIFACT_PATHS.get(artifact_id, f"docs/{artifact_id.replace('-', '/')}.md")
        return self.project_root / rel

    def check_artifacts(self, stage_id: str) -> tuple[list[str], list[str]]:
        stage = self.stages[stage_id]
        found: list[str] = []
        missing: list[str] = []
        for artifact in stage.outputs:
            path = self.artifact_path(artifact)
            if path.is_file():
                found.append(str(path.relative_to(self.project_root)))
            else:
                missing.append(str(path.relative_to(self.project_root)))
        return found, missing

    def gate_for_stage(self, stage_id: str) -> dict[str, Any] | None:
        for gate in self.flow.get("gates", []):
            if gate["stage_id"] == stage_id:
                return gate
        return None

    def cmd_plan(self) -> int:
        flow_name = self.flow["_resolved_name"]
        print(f"Flow: {flow_name} ({self.flow.get('name', '')})")
        print(f"Stages: {len(self.stages)}")
        print()
        for sid in self._topo_order():
            stage = self.stages[sid]
            preds = ", ".join(sorted(self.predecessors.get(sid, set()))) or "(start)"
            skip = " [SKIP]" if self._eval_skip_when(stage.skip_when) else ""
            print(f"  {sid} ({stage.role}){skip}")
            print(f"    predecessors: {preds}")
            print(f"    inputs: {', '.join(stage.inputs) or '-'}")
            print(f"    outputs: {', '.join(stage.outputs) or '-'}")
        if self.parallel_groups:
            print()
            print("Parallel groups:")
            for g in self.parallel_groups:
                print(f"  {g.id}: {' | '.join(g.stages)} -> {g.join_stage} ({g.join_policy})")
        return 0

    def _topo_order(self) -> list[str]:
        visited: set[str] = set()
        order: list[str] = []

        def visit(sid: str) -> None:
            if sid in visited:
                return
            for pred in sorted(self.predecessors.get(sid, set())):
                visit(pred)
            visited.add(sid)
            order.append(sid)

        for sid in sorted(self.stages):
            visit(sid)
        return order

    def cmd_status(self) -> int:
        print(f"Flow: {self.flow['_resolved_name']}")
        print(f"State: {self.state_file}")
        print()
        for sid in self._topo_order():
            if self._is_skipped(sid):
                status = "skipped"
            elif sid in self.state.completed:
                status = "completed"
            elif self._is_ready(sid):
                status = "ready"
            else:
                status = "blocked"
            role = self.stages[sid].role
            print(f"  [{status:9}] {sid} ({role})")
        ready = self.ready_stages()
        if ready:
            print()
            print(f"Ready now: {', '.join(ready)}")
        return 0

    def cmd_next(self) -> int:
        ready = self.ready_stages()
        if not ready:
            print("No stages ready. Run 'status' for blocked stages.")
            return 1
        for sid in ready:
            stage = self.stages[sid]
            spec = self.lib_root / "roles" / stage.role / "spec.md"
            print(f"=== {sid} ({stage.role}) ===")
            print(f"spec: {spec.relative_to(self.project_root)}")
            print(f"mode: {stage.mode}")
            if stage.inputs:
                print("inputs:")
                for inp in stage.inputs:
                    path = self.artifact_path(inp)
                    mark = "ok" if path.is_file() else "missing"
                    print(f"  - {inp} [{mark}] -> {path.relative_to(self.project_root)}")
            in_parallel = [g.id for g in self.parallel_groups if sid in g.stages]
            if in_parallel:
                print(f"parallel_group: {', '.join(in_parallel)}")
            print()
        return 0

    def cmd_complete(self, stage_id: str, force: bool = False) -> int:
        if stage_id not in self.stages:
            print(f"Unknown stage: {stage_id}", file=sys.stderr)
            return 1
        if not force and not self._is_ready(stage_id):
            print(f"Stage not ready: {stage_id}. Run 'status' or use --force.", file=sys.stderr)
            return 1
        found, missing = self.check_artifacts(stage_id)
        if missing and not force:
            print(f"Missing artifacts for {stage_id}:", file=sys.stderr)
            for m in missing:
                print(f"  - {m}", file=sys.stderr)
            print("Use --force to mark complete anyway.", file=sys.stderr)
            return 1
        if stage_id not in self.state.completed:
            self.state.completed.append(stage_id)
        for path_str in found:
            path = self.project_root / path_str
            if path.is_file():
                digest = hashlib.sha256(path.read_bytes()).hexdigest()[:16]
                self.state.artifact_hashes[path_str] = digest
        self._save_state()
        print(f"Marked complete: {stage_id}")
        next_ready = self.ready_stages()
        if next_ready:
            print(f"Ready next: {', '.join(next_ready)}")
        return 0

    def cmd_gate_check(self, stage_id: str) -> int:
        if stage_id not in self.stages:
            print(f"Unknown stage: {stage_id}", file=sys.stderr)
            return 1
        gate = self.gate_for_stage(stage_id)
        found, missing = self.check_artifacts(stage_id)
        print(f"Gate check: {stage_id} ({self.stages[stage_id].role})")
        print()
        print("Artifacts:")
        for f in found:
            print(f"  [ok] {f}")
        for m in missing:
            print(f"  [MISSING] {m}")
        if gate:
            print()
            print(f"Gate: {gate['id']} (on_fail: {gate.get('on_fail', 'rework_stage')})")
            for i, criterion in enumerate(gate["criteria"], 1):
                print(f"  {i}. {criterion} [manual verify]")
        else:
            print()
            print("No gate defined for this stage.")
        return 0 if not missing else 1

    def cmd_graph(self, fmt: str = "mermaid") -> int:
        if fmt == "mermaid":
            print("```mermaid")
            print("flowchart TD")
            for tr in self.flow.get("transitions", []):
                frm, to = tr["from"], tr["to"]
                if self._is_skipped(frm) or self._is_skipped(to):
                    continue
                print(f"  {frm} --> {to}")
            for sid in self.state.completed:
                if sid in self.stages:
                    print(f"  style {sid} fill:#9f9")
            for sid in self.ready_stages():
                print(f"  style {sid} fill:#ff9")
            print("```")
        else:
            for tr in self.flow.get("transitions", []):
                print(f'  "{tr["from"]}" -> "{tr["to"]}";')
        return 0

    def cmd_resync(self) -> int:
        """Reconcile state with artifact files on disk."""
        changed = False
        for sid, stage in self.stages.items():
            if sid in self.state.completed:
                continue
            found, missing = self.check_artifacts(stage_id=sid)
            if found and not missing:
                self.state.completed.append(sid)
                changed = True
                print(f"Auto-completed from artifacts: {sid}")
        if changed:
            self._save_state()
        else:
            print("No changes from resync.")
        return 0

    def cmd_dispatch(self, stage_id: str, use_sdk: bool = False) -> int:
        if stage_id not in self.stages:
            print(f"Unknown stage: {stage_id}", file=sys.stderr)
            return 1
        if not self._is_ready(stage_id) and stage_id not in self.state.completed:
            print(f"Stage not ready: {stage_id}", file=sys.stderr)
            return 1
        stage = self.stages[stage_id]
        spec_rel = self.lib_root / "roles" / stage.role / "spec.md"
        prompt_lines = [
            f"Execute role: {stage.role}",
            f"Stage: {stage_id}",
            f"Read spec: {self._rel_path(spec_rel)}",
            f"Mode: {stage.mode}",
            "",
            "Required inputs:",
        ]
        for inp in stage.inputs:
            path = self.artifact_path(inp)
            prompt_lines.append(f"  - {self._rel_path(path)}")
        prompt_lines.extend([
            "",
            "Produce outputs:",
        ])
        for out in stage.outputs:
            path = self.artifact_path(out)
            prompt_lines.append(f"  - {self._rel_path(path)}")
        prompt = "\n".join(prompt_lines)
        print(prompt)

        api_key = os.environ.get("CURSOR_API_KEY")
        if use_sdk:
            if not api_key:
                print(
                    "\nERROR: CURSOR_API_KEY not set. Export it or run without --sdk.",
                    file=sys.stderr,
                )
                return 1
            try:
                from cursor_sdk import Agent  # type: ignore[import-untyped]
            except ImportError:
                print(
                    "\nERROR: cursor-sdk not installed. pip install cursor-sdk",
                    file=sys.stderr,
                )
                print("Handoff prompt printed above for manual IDE execution.", file=sys.stderr)
                return 1
            print("\nDispatching via Cursor SDK...", file=sys.stderr)
            result = Agent.prompt(prompt, api_key=api_key, local={"cwd": str(self.project_root)})
            print(f"\nSDK status: {getattr(result, 'status', result)}")
            if hasattr(result, "result") and result.result:
                print(result.result)
            return 0

        if api_key:
            print(
                "\nTip: CURSOR_API_KEY is set. Use 'dispatch --sdk' to run via Cursor SDK.",
                file=sys.stderr,
            )
        return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="spec-skills pipeline orchestrator")
    parser.add_argument(
        "--project-root",
        type=Path,
        default=Path.cwd(),
        help="Project root (default: cwd)",
    )
    parser.add_argument(
        "--lib-root",
        type=Path,
        default=None,
        help="spec-skills-lib path (default: <project>/spec-skills-lib)",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("plan", help="List stages, dependencies, parallel groups")
    sub.add_parser("status", help="Show stage completion state")
    sub.add_parser("next", help="Show ready stage(s) with handoff details")
    sub.add_parser("resync", help="Auto-complete stages with all artifacts on disk")

    p_complete = sub.add_parser("complete", help="Mark stage complete")
    p_complete.add_argument("stage_id", help="Stage id e.g. stage-frontend")
    p_complete.add_argument("--force", action="store_true", help="Skip readiness/artifact checks")

    p_gate = sub.add_parser("gate-check", help="Check gate criteria and artifacts")
    p_gate.add_argument("stage_id", help="Stage id")

    p_graph = sub.add_parser("graph", help="Export DAG")
    p_graph.add_argument("--format", choices=["mermaid", "dot"], default="mermaid")

    p_dispatch = sub.add_parser("dispatch", help="Print handoff prompt; optional SDK dispatch")
    p_dispatch.add_argument("stage_id", help="Stage id")
    p_dispatch.add_argument("--sdk", action="store_true", help="Dispatch via Cursor SDK")

    args = parser.parse_args()
    orch = PipelineOrchestrator(args.project_root, args.lib_root)

    handlers = {
        "plan": orch.cmd_plan,
        "status": orch.cmd_status,
        "next": orch.cmd_next,
        "resync": orch.cmd_resync,
        "graph": lambda: orch.cmd_graph(args.format),
        "complete": lambda: orch.cmd_complete(args.stage_id, args.force),
        "gate-check": lambda: orch.cmd_gate_check(args.stage_id),
        "dispatch": lambda: orch.cmd_dispatch(args.stage_id, args.sdk),
    }
    return handlers[args.command]()


if __name__ == "__main__":
    sys.exit(main())
