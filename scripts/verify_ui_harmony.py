from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def main() -> None:
    immersive = (ROOT / "public/immersive.js").read_text()
    harmony = (ROOT / "public/ui-harmony.css").read_text()

    required = [
        "renderControl.appendChild(xray)",
        "renderControl.classList.add('segmented--four')",
        "inspectionLabel.textContent = '4D inspection'",
        "className = 'control-section view-tools-details'",
        "makeLabel('Stereoscopic view')",
        "makeLabel('Observer motion')",
        "makeLabel('4D motion')",
        "ctx.rect(viewport.x, viewport.y, viewport.width, viewport.height)",
        "const drawFaces = appState.renderMode !== 'wire'",
        "const drawStructuralEdges = appState.renderMode !== 'solid'",
        "appState.screenProjection === 'perspective'",
        "if (appState.colorMode === 'axis')",
        "if (appState.colorMode === 'form')",
        "xrayInsideRendering",
    ]
    for marker in required:
        assert marker in immersive, marker

    assert ".segmented--four" in harmony
    assert "#renderControl.segmented--four" in harmony
    assert ".view-tools-details" in harmony
    assert ".tool-group" in harmony

    print("UI harmony regression checks passed.")


if __name__ == "__main__":
    main()
