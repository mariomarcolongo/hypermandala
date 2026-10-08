#!/usr/bin/env python3
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
app_path = ROOT / 'public/app.js'
readme_path = ROOT / 'README.md'
app = app_path.read_text()
readme = readme_path.read_text()

def once(text, before, after, label):
    count = text.count(before)
    if count != 1:
        raise SystemExit(f'{label}: expected one occurrence, found {count}')
    return text.replace(before, after, 1)

def regex_once(text, pattern, replacement, label):
    new, count = re.subn(pattern, replacement, text, count=1, flags=re.S)
    if count != 1:
        raise SystemExit(f'{label}: expected one regex match, found {count}')
    return new

# Intrinsic symmetric W is centered on zero, not merely display-centered.
app = once(app,
'''      // Pure dimensional promotion follows the same convention as the Z lift:
      // the finished 3D complex starts on W=0 and sweeps into +W.
      // Intrinsically this is G3 × [0,h]. The renderer may subtract the
      // midpoint only as a presentation translation so the object stays
      // centered on screen; the intrinsic geometry remains one-sided in +W.''',
'''      // Pure dimensional promotion is a centered Cartesian product.
      // Intrinsically this is G3 × [-h/2,+h/2], so “Intrinsic W” is the
      // same centered coordinate used by the mathematical construction.''',
'centered hyperprism comment')
app = once(app, '        center: extent * 0.5,\n        half: extent * 0.5,',
                 '        center: 0,\n        half: extent * 0.5,', 'center intrinsic W')

# Preserve source 3D faces so cross-sections can reconstruct real surfaces.
app = once(app,
'''        edges: edges3.map((edge) => ({ ...edge })),
        footprint: footprint.map((point) => [...point]),''',
'''        edges: edges3.map((edge) => ({ ...edge })),
        faces: faces3.map((face) => ({ ...face, indices: [...face.indices] })),
        footprint: footprint.map((point) => [...point]),''',
'source3 faces')

# Warped caps are generally non-planar n-gons. Triangulate them intrinsically,
# before any camera projection, so topology cannot change with viewpoint.
start = app.index('  function warpedFootprintPrismData(')
end = app.index('  function addWarpedFootprintPrism(', start)
if start < 0 or end < 0: raise SystemExit('warpedFootprintPrismData not found')
chunk = app[start:end]
chunk = once(chunk,
'''    faces3.push({
      indices: Array.from({ length: n }, (_, i) => n - 1 - i),
      axis: 'z',
    });
    faces3.push({
      indices: Array.from({ length: n }, (_, i) => i + n),
      axis: 'z',
    });''',
'''    const capTriangles = triangulateProjectedPolygon(
      footprint.map(([x, y]) => ({ x, y })),
    );
    for (const [a, b, c] of capTriangles) {
      faces3.push({ indices: [c, b, a], axis: 'z' });
      faces3.push({ indices: [a + n, b + n, c + n], axis: 'z' });
    }''', 'intrinsic warped triangulation')
app = app[:start] + chunk + app[end:]

# Continuous W-color mapping helper. WebGL will interpolate this per vertex.
app = once(app, '  function wCoordinateRgb(face, module) {',
'''  function wCoordinateRgbValue(value) {
    const bounds = transformedWBounds();
    const t = clamp((value - bounds.min) / Math.max(1e-7, bounds.max - bounds.min), 0, 1);
    const negative = hexToRgb('#6ca8ff');
    const neutral = hexToRgb('#e7ddc6');
    const positive = hexToRgb('#f0c45c');
    return t < 0.5
      ? mixRgb(negative, neutral, t * 2)
      : mixRgb(neutral, positive, (t - 0.5) * 2);
  }

  function wCoordinateRgb(face, module) {''', 'W color helper')
app = regex_once(app,
 r"  function wCoordinateRgb\(face, module\) \{[\s\S]*?\n  \}\n\n  function faceStyleMix",
'''  function wCoordinateRgb(face, module) {
    const averageW = face.indices.reduce(
      (sum, index) => sum + transform4D(module.vertices[index], true)[3],
      0,
    ) / Math.max(1, face.indices.length);
    return wCoordinateRgbValue(averageW);
  }

  function faceStyleMix''', 'simplify W average fallback')
app = once(app,
'''          triData.push(
            x, y, z, w,
            rgb.r / 255,
            rgb.g / 255,
            rgb.b / 255,
            clamp(alpha * entry.visibility, 0, 1),
          );''',
'''          const vertexRgb = (
            (state.wDepthColor || state.insightMode === 'w-color')
            && state.wMix > 0.001
          ) ? wCoordinateRgbValue(p.w) : rgb;
          triData.push(
            x, y, z, w,
            vertexRgb.r / 255,
            vertexRgb.g / 255,
            vertexRgb.b / 255,
            clamp(alpha * entry.visibility, 0, 1),
          );''', 'per-vertex W color')

# Exact section surfaces ------------------------------------------------------
helpers = r'''
  function sourceBoundaryEdgePairs(source3) {
    const seen = new Set();
    const pairs = [];
    for (const face of source3?.faces || []) {
      for (let i = 0; i < face.indices.length; i += 1) {
        const a = face.indices[i];
        const b = face.indices[(i + 1) % face.indices.length];
        const key = a < b ? a + ':' + b : b + ':' + a;
        if (seen.has(key)) continue;
        seen.add(key);
        pairs.push([a, b]);
      }
    }
    return pairs;
  }

  function polygon3Key(points, precision = 100000) {
    return points.map((point) => point3Key(point, precision)).sort().join('|');
  }

  function orderCoplanarSectionPolygon(points) {
    const unique = dedupeSectionPoints(points);
    if (unique.length < 3) return [];
    const center = [0, 0, 0];
    for (const p of unique) {
      center[0] += p[0]; center[1] += p[1]; center[2] += p[2];
    }
    center[0] /= unique.length; center[1] /= unique.length; center[2] /= unique.length;
    let u = null;
    for (const p of unique) {
      const d = [p[0]-center[0], p[1]-center[1], p[2]-center[2]];
      const length = Math.hypot(...d);
      if (length > 1e-9) { u = d.map((x) => x / length); break; }
    }
    if (!u) return [];
    let normal = null;
    for (const p of unique) {
      const d = [p[0]-center[0], p[1]-center[1], p[2]-center[2]];
      const cross = [u[1]*d[2]-u[2]*d[1], u[2]*d[0]-u[0]*d[2], u[0]*d[1]-u[1]*d[0]];
      const length = Math.hypot(...cross);
      if (length > 1e-9) { normal = cross.map((x) => x / length); break; }
    }
    if (!normal) return [];
    const v = [normal[1]*u[2]-normal[2]*u[1], normal[2]*u[0]-normal[0]*u[2], normal[0]*u[1]-normal[1]*u[0]];
    return [...unique].sort((a, b) => {
      const da = [a[0]-center[0], a[1]-center[1], a[2]-center[2]];
      const db = [b[0]-center[0], b[1]-center[1], b[2]-center[2]];
      const aa = Math.atan2(da[0]*v[0]+da[1]*v[1]+da[2]*v[2], da[0]*u[0]+da[1]*u[1]+da[2]*u[2]);
      const ab = Math.atan2(db[0]*v[0]+db[1]*v[1]+db[2]*v[2], db[0]*u[0]+db[1]*u[1]+db[2]*u[2]);
      return aa - ab;
    });
  }

  function hypercellEdgeSets(module) {
    const source = module.source3;
    if (!source?.faces?.length) return [];
    const n = source.vertices.length;
    const boundaryEdges = sourceBoundaryEdgePairs(source);
    const cells = [];
    for (const layer of [0, 1]) {
      const offset = layer * n;
      cells.push({
        kind: 'cap',
        vertexIndices: Array.from({ length: n }, (_, i) => i + offset),
        edgePairs: boundaryEdges.map(([a,b]) => [a+offset,b+offset]),
        coplanarFaces: source.faces.map((face) => face.indices.map((i) => i + offset)),
      });
    }
    for (const face of source.faces) {
      const indices = face.indices;
      const edgePairs = [];
      for (let i = 0; i < indices.length; i += 1) {
        const a = indices[i], b = indices[(i+1)%indices.length];
        edgePairs.push([a,b], [a+n,b+n]);
      }
      for (const a of indices) edgePairs.push([a,a+n]);
      cells.push({ kind:'side', vertexIndices:[...indices,...indices.map((i)=>i+n)], edgePairs });
    }
    return cells;
  }

  function intersectEdgeSetWithViewW(vertices, edgePairs, targetW) {
    const epsilon = 1e-7;
    const hits = [];
    for (const [ia, ib] of edgePairs) {
      const a = vertices[ia], b = vertices[ib];
      if (!a || !b) continue;
      const da = a[3]-targetW, db = b[3]-targetW;
      const aOn = Math.abs(da)<=epsilon, bOn = Math.abs(db)<=epsilon;
      if (aOn) hits.push([a[0],a[1],a[2],targetW]);
      if (bOn) hits.push([b[0],b[1],b[2],targetW]);
      if ((da < -epsilon && db > epsilon) || (da > epsilon && db < -epsilon)) {
        const t = (targetW-a[3])/(b[3]-a[3]);
        hits.push([a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t, a[2]+(b[2]-a[2])*t, targetW]);
      }
    }
    return dedupeSectionPoints(hits);
  }

  function renderSectionSurface(polygons, alpha, width, color) {
    const counts = new Map();
    const entries = [];
    for (const polygon of polygons) {
      if (polygon.length < 3) continue;
      const key = polygon3Key(polygon);
      counts.set(key, (counts.get(key)||0)+1);
      entries.push({ polygon, key });
    }
    const rendered = [];
    for (const entry of entries) {
      if ((counts.get(entry.key)||0) !== 1) continue;
      const points = entry.polygon.map((p) => projectTransformed4DToScreen(p));
      if (Math.abs(polygonArea2D(points)) < 0.2) continue;
      rendered.push({ points, depth: points.reduce((sum,p)=>sum+p.depth,0)/points.length });
    }
    rendered.sort((a,b)=>a.depth-b.depth);
    ctx.save();
    ctx.lineJoin = 'round';
    for (const item of rendered) {
      ctx.beginPath();
      item.points.forEach((p,i)=>{ if (!i) ctx.moveTo(p.x,p.y); else ctx.lineTo(p.x,p.y); });
      ctx.closePath();
      ctx.fillStyle = color; ctx.globalAlpha = alpha*0.22; ctx.fill();
      ctx.strokeStyle = color; ctx.globalAlpha = alpha; ctx.lineWidth = width; ctx.stroke();
    }
    ctx.restore();
  }
'''
app = once(app, '  function drawViewSpaceWSection(fraction, alpha, width, color) {', helpers + '\n  function drawViewSpaceWSection(fraction, alpha, width, color) {', 'section helpers')
app = regex_once(app, r"  function drawViewSpaceWSection\(fraction, alpha, width, color\) \{[\s\S]*?\n  \}\n\n  function drawIntrinsicWSection",
'''  function drawViewSpaceWSection(fraction, alpha, width, color) {
    const sectionModules = activeFilledModules();
    if (!sectionModules.length) return;
    const bounds = transformedSectionWBounds(sectionModules);
    const targetW = bounds.min + (bounds.max - bounds.min) * fraction;
    const epsilon = Math.max(1e-7, (bounds.max-bounds.min)*1e-7);
    const polygons = [];
    for (const module of sectionModules) {
      if (!module.source3?.faces?.length) continue;
      const transformed = module.vertices.map((point) => transform4D(point, true));
      for (const cell of hypercellEdgeSets(module)) {
        const cellVertices = cell.vertexIndices.map((index) => transformed[index]);
        const allOn = cellVertices.length && cellVertices.every((point) => Math.abs(point[3]-targetW)<=epsilon);
        if (allOn && cell.kind === 'cap') {
          for (const face of cell.coplanarFaces) {
            polygons.push(face.map((index) => { const p=transformed[index]; return [p[0],p[1],p[2],targetW]; }));
          }
          continue;
        }
        const polygon = orderCoplanarSectionPolygon(intersectEdgeSetWithViewW(transformed, cell.edgePairs, targetW));
        if (polygon.length >= 3) polygons.push(polygon.map((p)=>[p[0],p[1],p[2],targetW]));
      }
    }
    renderSectionSurface(polygons, alpha, width, color);
  }

  function drawIntrinsicWSection''', 'view-space section surfaces')
app = regex_once(app, r"  function drawIntrinsicWSection\(fraction, alpha, width, color\) \{[\s\S]*?\n  \}\n\n  function drawWLayerOverlay",
'''  function drawIntrinsicWSection(fraction, alpha, width, color) {
    const sectionModules = activeFilledModules();
    const bounds = globalIntrinsicWBounds(sectionModules);
    const targetW = bounds.min + (bounds.max - bounds.min) * fraction;
    const epsilon = Math.max(1e-7, (bounds.max-bounds.min)*1e-7);
    const polygons = [];
    for (const module of sectionModules) {
      const source = module.source3;
      if (!source?.faces?.length) continue;
      const profile = module.wProfile;
      const low = profile ? profile.center-profile.half : Math.min(...module.vertices.map((p)=>p[3]));
      const high = profile ? profile.center+profile.half : Math.max(...module.vertices.map((p)=>p[3]));
      if (targetW < low-epsilon || targetW > high+epsilon) continue;
      const transformed = source.vertices.map((p)=>transform4D([p[0],p[1],p[2],targetW], true));
      for (const face of source.faces) polygons.push(face.indices.map((index)=>transformed[index]));
    }
    renderSectionSurface(polygons, alpha, width, color);
  }

  function drawWLayerOverlay''', 'intrinsic section surfaces')
app = once(app, '  function globalIntrinsicWBounds() {\n    let min = Infinity;\n    let max = -Infinity;\n\n    for (const module of modules) {',
'''  function globalIntrinsicWBounds(sectionModules = activeFilledModules()) {
    let min = Infinity;
    let max = -Infinity;

    for (const module of sectionModules) {''', 'intrinsic bounds modules')
app = once(app,
'''      if (
        state.wSectionSpace === 'view'
        && state.insightMode === 'w-slice'
      ) {
        drawViewSpaceWSection(fraction, alpha, width, color);
      } else {''',
'''      if (state.wSectionSpace === 'view') {
        drawViewSpaceWSection(fraction, alpha, width, color);
      } else {''', 'view five-slice semantics')

# Replace order-dependent translucent painter sorting with deterministic
# screen-door X-ray. The complete wireframe will provide hidden geometry.
app = once(app, '        outColor = vColor;', '''        if (vColor.a < 0.999) {
          ivec2 p = ivec2(mod(gl_FragCoord.xy, 4.0));
          int i = p.x + p.y * 4;
          float bayer[16] = float[16](
            0.0,8.0,2.0,10.0, 12.0,4.0,14.0,6.0,
            3.0,11.0,1.0,9.0, 15.0,7.0,13.0,5.0
          );
          if (vColor.a <= (bayer[i] + 0.5) / 16.0) discard;
          outColor = vec4(vColor.rgb, 1.0);
        } else {
          outColor = vColor;
        }''', 'screen-door fragment shader')
app = app.replace('    const transparentTriangles = [];\n', '')
app = once(app,
'''        if (xray) {
          transparentTriangles.push({
            depth: tri.reduce((sum, p) => sum + p.depth, 0) / 3,
            data: triData,
          });
        } else {
          faceData.push(...triData);
        }''',
'''        faceData.push(...triData);''', 'remove xray sorting enqueue')
app = regex_once(app, r"    if \(xray\) \{\n      // Canvas fallback already painter-sorts faces\.[\s\S]*?\n    \}\n\n    gl\.viewport", '    gl.viewport', 'remove xray sorting block')
app = regex_once(app, r"    const translucent = xray \|\| alpha < 0\.999;\n    if \(translucent\) \{[\s\S]*?\n    \} else \{\n      gl\.disable\(gl\.BLEND\);\n    \}",
'''    gl.disable(gl.BLEND);
    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(true);''', 'depth-correct xray')
app = app.replace('    if (xray) gl.enable(gl.DEPTH_TEST);\n', '')
app = once(app,
'''    if (state.renderMode === 'solid-edges') {
      drawEdges(transitionEdgeAlpha);
      drawVertices(transitionEdgeAlpha);
    }''',
'''    if (state.renderMode === 'solid-edges' || state.renderMode === 'xray') {
      drawEdges(transitionEdgeAlpha);
      drawVertices(transitionEdgeAlpha);
    }''', 'xray structural overlay')

# Debug validator used by browser CI to inspect generated geometry, not screenshots.
debug = r'''
  function faceAffineResidual(vertices, indices) {
    if (!indices || indices.length <= 3) return 0;
    const p0 = vertices[indices[0]];
    let u = null, v = null;
    for (let i=1;i<indices.length&&!u;i+=1) {
      const d=vertices[indices[i]].map((x,a)=>x-p0[a]);
      if (Math.hypot(...d)>1e-9) u=d;
    }
    if (!u) return 0;
    const uu=u.reduce((s,x)=>s+x*x,0);
    for (let i=1;i<indices.length&&!v;i+=1) {
      const d=vertices[indices[i]].map((x,a)=>x-p0[a]);
      const ud=u.reduce((s,x,a)=>s+x*d[a],0);
      const o=d.map((x,a)=>x-u[a]*ud/uu);
      if (Math.hypot(...o)>1e-8) v=o;
    }
    if (!v) return 0;
    const vv=v.reduce((s,x)=>s+x*x,0);
    let worst=0;
    for (const index of indices) {
      const d=vertices[index].map((x,a)=>x-p0[a]);
      const du=u.reduce((s,x,a)=>s+x*d[a],0)/uu;
      const dv=v.reduce((s,x,a)=>s+x*d[a],0)/vv;
      worst=Math.max(worst,Math.hypot(...d.map((x,a)=>x-du*u[a]-dv*v[a])));
    }
    return worst;
  }

  function validateCurrentGeometry() {
    const issues=[];
    const inspect=[...modules,...surfaceModules];
    let maxFaceResidual=0,minCameraWDistance=Infinity,minCameraZDistance=Infinity;
    inspect.forEach((module,moduleIndex)=>{
      module.vertices.forEach((p,vertexIndex)=>{
        if (p.length!==4||p.some((x)=>!Number.isFinite(x))) issues.push('non-finite vertex m'+moduleIndex+' v'+vertexIndex);
        const p4=transform4D(p,true); minCameraWDistance=Math.min(minCameraWDistance,9-p4[3]);
        const p3=cameraTransform(project4Dto3D(p4)); minCameraZDistance=Math.min(minCameraZDistance,9-p3[2]);
      });
      for (const face of module.faces) {
        const residual=faceAffineResidual(module.vertices,face.indices); maxFaceResidual=Math.max(maxFaceResidual,residual);
        if (residual>2e-6) issues.push('non-planar 4D face m'+moduleIndex+': '+residual);
      }
      if (module.source3?.faces) for (const face of module.source3.faces) {
        const residual=faceAffineResidual(module.source3.vertices,face.indices); maxFaceResidual=Math.max(maxFaceResidual,residual);
        if (residual>2e-6) issues.push('non-planar source3 face m'+moduleIndex+': '+residual);
      }
    });
    if (minCameraWDistance<=0.25) issues.push('4D camera crosses geometry');
    if (minCameraZDistance<=0.25) issues.push('3D camera crosses geometry');
    if (PRESET_META[state.preset]?.kind==='symmetric') for (const module of modules) {
      if (module.wProfile && Math.abs(module.wProfile.center)>1e-9) issues.push('symmetric intrinsic W not centered');
    }
    return {preset:state.preset,modules:modules.length,surfaceModules:surfaceModules.length,maxFaceResidual,minCameraWDistance,minCameraZDistance,issues,ok:issues.length===0};
  }

  window.__hypermandalaDebug = Object.freeze({
    validateCurrentGeometry,
    currentWSemantics: () => [...currentWSemantics()],
    projectionState: () => ({projection4D:state.projection,projection3D:state.screenProjection,isometricView:state.isometricView}),
  });
'''
app = once(app, "  setTimeout(() => hint.classList.add('is-hidden'), 6500);\n})();",
                 "  setTimeout(() => hint.classList.add('is-hidden'), 6500);\n" + debug + "})();", 'debug validator')

readme = readme.replace('The collapsed **4D tools** disclosure exposes one exact intrinsic-W 3D cross-section or five simultaneous sections. These are sections of the actual 4D construction, not screen-space clipping.',
'''The collapsed **4D tools** disclosure exposes one exact 3D cross-section surface or five simultaneous section surfaces, in either intrinsic-W or post-rotation view-space W. The section boundary polygons are reconstructed from the 4D cell complex; this is not screen-space clipping and not merely an edge skeleton.''')
readme = readme.replace('- **Transparent** — optional translucent inspection of projected layers. Transparent triangles are composited back-to-front without depth writes so hidden projected geometry remains visible. It is simply a see-through inspection aid, **not** a simulation of 4D eyesight.',
'''- **X-ray** — depth-correct screen-door surfaces plus the complete structural wireframe. It avoids false painter-order relationships between intersecting translucent layers and remains an inspection aid, **not** a simulation of 4D eyesight.''')

app_path.write_text(app); readme_path.write_text(readme)
print('Applied geometry/visualization audit fixes.')
