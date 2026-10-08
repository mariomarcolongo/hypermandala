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

    harmony_markers = [
        ".segmented--four",
        "#renderControl.segmented--four",
        ".view-tools-details",
        ".tool-group",
        "#explorerControls > .control-section:has(#projectionControl) { order: 10; }",
        "#explorerControls > .control-section:has(#screenProjectionControl) { order: 20; }",
        "#explorerControls > .control-section:has(#rotationRows) { order: 30; }",
        "#explorerControls > .control-section:has(#renderControl) { order: 40; }",
        "#explorerControls > .scale-section { order: 50; }",
        "#explorerControls > .control-section:has(#colorControl) { order: 60; }",
        "#explorerControls > .perception-details { order: 70; }",
        "#explorerControls > .view-tools-details { order: 80; }",
        "#explorerControls > .rotation-section .control-section__label",
        "#screenProjectionControl",
        "#isometricView",
        "#isometricView::after",
        "content: 'Isometric';",
        "#isometricView.is-active::after",
    ]
    for marker in harmony_markers:
        assert marker in harmony, marker

    print("UI harmony regression checks passed.")


if __name__ == "__main__":
    main()
