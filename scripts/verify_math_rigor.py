#!/usr/bin/env python3
"""Regression checks for Hypermandala's audited geometry and projection math."""
from pathlib import Path
import math

ROOT = Path(__file__).resolve().parents[1]


def bessel(order: int, x: float, modified: bool = False) -> float:
    half = x * 0.5
    term = half ** order / math.factorial(order)
    total = term
    x_quarter = half * half
    for k in range(1, 48):
        term *= (1 if modified else -1) * x_quarter / (k * (order + k))
        total += term
        if abs(term) <= 1e-15 * max(1.0, abs(total)):
            break
    return total


def chladni_radial(rho: float) -> float:
    order = 4
    lam = 8.346605938750736
    ratio = bessel(order, lam) / bessel(order, lam, True)
    x = lam * min(1.0, max(0.0, rho))
    return bessel(order, x) - ratio * bessel(order, x, True)


def check_plate_mode() -> None:
    order = 4
    lam = 8.346605938750736
    displacement = chladni_radial(1.0)
    h = 1e-5
    inward_slope = (chladni_radial(1.0) - chladni_radial(1.0 - h)) / h

    j = bessel(order, lam)
    i = bessel(order, lam, True)
    j_prime = (bessel(order - 1, lam) - bessel(order + 1, lam)) * 0.5
    i_prime = (bessel(order - 1, lam, True) + bessel(order + 1, lam, True)) * 0.5
    eigen_residual = j_prime * i - j * i_prime

    assert abs(displacement) < 2e-10, displacement
    assert abs(inward_slope) < 2e-4, inward_slope
    assert abs(eigen_residual) < 2e-8, eigen_residual
    assert abs(chladni_radial(0.0)) < 1e-14


def rotate_plane(point, a: int, b: int, angle: float):
    p = list(point)
    c = math.cos(angle)
    s = math.sin(angle)
    pa, pb = p[a], p[b]
    p[a] = c * pa - s * pb
    p[b] = s * pa + c * pb
    return p


def check_4d_rotations() -> None:
    source = [0.71, -1.13, 0.37, 1.89]
    norm2 = sum(value * value for value in source)
    planes = [(0, 1), (0, 2), (0, 3), (1, 2), (1, 3), (2, 3)]

    for index, (a, b) in enumerate(planes):
        rotated = rotate_plane(source, a, b, 0.173 + index * 0.271)
        assert abs(sum(value * value for value in rotated) - norm2) < 1e-12

    full = rotate_plane(source, 0, 3, 2 * math.pi)
    for actual, expected in zip(full, source):
        assert abs(actual - expected) < 1e-12


def check_rotation_noncommutativity() -> None:
    point = [0.7, -0.4, 1.1, 0.9]
    first = rotate_plane(rotate_plane(point, 0, 3, 0.61), 1, 3, -0.47)
    second = rotate_plane(rotate_plane(point, 1, 3, -0.47), 0, 3, 0.61)
    distance = math.sqrt(sum((a - b) ** 2 for a, b in zip(first, second)))
    assert distance > 1e-3


def check_4d_perspective() -> None:
    camera_w = 9.0
    point = [1.2, -0.7, 0.4, 2.25]
    factor = camera_w / (camera_w - point[3])
    projected = [point[axis] * factor for axis in range(3)]
    expected_factor = 4.0 / 3.0
    assert abs(factor - expected_factor) < 1e-12
    for axis in range(3):
        assert abs(projected[axis] - point[axis] * expected_factor) < 1e-12


def camera_isometric(point):
    x, y, z = point
    yaw = -math.pi / 4
    c, s = math.cos(yaw), math.sin(yaw)
    x, z = c * x - s * z, s * x + c * z

    pitch = math.atan(1 / math.sqrt(2))
    c, s = math.cos(pitch), math.sin(pitch)
    y, z = c * y - s * z, s * y + c * z
    return x, y, z


def check_true_3d_isometric() -> None:
    lengths = []
    for axis in range(3):
        basis = [0.0, 0.0, 0.0]
        basis[axis] = 1.0
        x, y, _ = camera_isometric(basis)
        lengths.append(math.hypot(x, y))

    expected = math.sqrt(2 / 3)
    for length in lengths:
        assert abs(length - expected) < 1e-12, lengths
    assert max(lengths) - min(lengths) < 1e-12


def clip_ndc_depth(view_z: float, camera_z: float = 9.0) -> float:
    near = 0.1
    far = 40.0
    distance = camera_z - view_z
    a = (far + near) / (far - near)
    b = (-2 * far * near) / (far - near)
    return (a * distance + b) / distance


def check_projective_depth() -> None:
    far_point = clip_ndc_depth(-3.0)
    middle_point = clip_ndc_depth(0.0)
    near_point = clip_ndc_depth(3.0)
    assert near_point < middle_point < far_point
    assert -1 < near_point < 1
    assert -1 < far_point < 1

    ndc_x, ndc_y = 0.37, -0.42
    distance = 9.0 - 1.7
    assert abs((ndc_x * distance) / distance - ndc_x) < 1e-15
    assert abs((ndc_y * distance) / distance - ndc_y) < 1e-15


def check_source_guards() -> None:
    app = (ROOT / "public/app.js").read_text()
    index = (ROOT / "public/index.html").read_text()
    readme = (ROOT / "README.md").read_text()

    required_app = [
        "const CHLADNI_LAMBDA = 8.346605938750736;",
        "function triangulateProjectedPolygon(points)",
        "function solidClipPosition(xPx, yPx, depth, depthBias = 0)",
        "in vec4 aPosition;",
        "gl_Position = aPosition;",
        "faceData.length / 8",
        "edgeData.length / 8",
        "const cameraW = 9;",
        "const factor = cameraW / (cameraW - p[3]);",
        "Math.atan(1 / Math.sqrt(2))",
        "function hypercellEdgeSets(module)",
        "function renderSectionSurface(polygons",
        "source3?.faces",
        "state.screenProjection",
        "state.isometricView",
        "faces: faces3.map",
        "capTriangles = triangulateProjectedPolygon",
        "vertexRgb = (",
        "bayer[16]",
    ]
    for needle in required_app:
        assert needle in app, needle

    forbidden_app = [
        "Math.sin(3 * Math.PI * radialT)",
        "gl_Position = vec4(aPosition, 1.0);",
        "faceData.length / 7",
        "edgeData.length / 7",
        "transparentTriangles.sort",
    ]
    for needle in forbidden_app:
        assert needle not in app, needle

    assert "exact 2D plans" not in index
    assert "exact 2D geometric plans" not in index
    assert "exact 2D plans" not in readme
    assert "exact 2D geometric plans" not in readme
    assert "4D → 3D projection" in index
    assert "3D → 2D camera" in index
    assert "Isometric orientation" in index
    assert "4d-tools-fix.js" not in index
    assert "Fourth-coordinate semantics" in readme


def main() -> None:
    check_plate_mode()
    check_4d_rotations()
    check_rotation_noncommutativity()
    check_4d_perspective()
    check_true_3d_isometric()
    check_projective_depth()
    check_source_guards()
    print("Mathematical-rigor regression checks passed.")


if __name__ == "__main__":
    main()
