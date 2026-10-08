from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def replace_once(text: str, old: str, new: str) -> str:
    if text.count(old) != 1:
        raise RuntimeError(f"expected one occurrence of {old!r}, got {text.count(old)}")
    return text.replace(old, new, 1)


def main() -> None:
    immersive_path = ROOT / "public/immersive.js"
    immersive = immersive_path.read_text()
    immersive = replace_once(
        immersive,
        "    const maxPairWidth = swapped ? 720 : 580;",
        "    const maxPairWidth = swapped ? 560 : 460;",
    )
    immersive = replace_once(
        immersive,
        "          pushStereoVertex(lines, transformed.view[edge.a], rgb, 0.96);\n          pushStereoVertex(lines, transformed.view[edge.b], rgb, 0.96);",
        "          const depthBias = appState.renderMode === 'solid-edges' ? 0.0081 : 0;\n          const a = transformed.view[edge.a];\n          const b = transformed.view[edge.b];\n          pushStereoVertex(lines, [a[0], a[1], a[2] + depthBias], rgb, 0.96);\n          pushStereoVertex(lines, [b[0], b[1], b[2] + depthBias], rgb, 0.96);",
    )
    immersive_path.write_text(immersive)

    workflow_path = ROOT / ".github/workflows/verify-projection-perception.yml"
    workflow = workflow_path.read_text()
    workflow = workflow.replace("pairWidth > 580.1", "pairWidth > 460.1")
    workflow = workflow.replace("pairWidth > 720.1", "pairWidth > 560.1")
    workflow_path.write_text(workflow)

    readme_path = ROOT / "README.md"
    readme = readme_path.read_text()
    readme = replace_once(
        readme,
        "- **Motion parallax** perturbs only the ordinary 3D camera after the 4D→3D projection. Pointer motion works on desktop; compatible mobile browsers may use device orientation after explicit permission.",
        "- **Observer orbit** changes only the ordinary 3D camera orientation after the 4D→3D projection. Pointer motion works on desktop; compatible mobile browsers may use device orientation after explicit permission. True translational head parallax is provided by WebXR when supported.",
    )
    readme_path.write_text(readme)

    rigor_path = ROOT / "scripts/verify_math_rigor.py"
    rigor = rigor_path.read_text()
    marker = '        "Observer orbit",\n'
    if '        "const depthBias = appState.renderMode === \'solid-edges\' ? 0.0081 : 0;",\n' not in rigor:
        rigor = replace_once(
            rigor,
            marker,
            marker + '        "const depthBias = appState.renderMode === \'solid-edges\' ? 0.0081 : 0;",\n',
        )
    rigor_path.write_text(rigor)

    print("Final projection/perception refinements applied.")


if __name__ == "__main__":
    main()
