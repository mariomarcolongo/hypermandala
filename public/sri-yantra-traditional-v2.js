(() => {
  'use strict';

  if (window.__hypermandalaSriTraditionalV2Installed) return;
  window.__hypermandalaSriTraditionalV2Installed = true;

  const TAU = Math.PI * 2;
  const DPR_LIMIT = 2;
  const DIMENSION_SECONDS = 2.15;
  const W_DEPTH = 0.34;

  const COLORS = {
    outline: '#efe6d3',
    outlineSoft: '#b9ad98',
    bhupuraOuter: '#f2eee4',
    bhupuraMiddle: '#c66040',
    bhupuraInner: '#d9b44b',
    lotus16: '#4366ad',
    lotus8: '#c94b40',
    central: '#f4efe2',
    bindu: '#b83232',
    neutral: '#dfd5c0',
    x: '#ff6b6b',
    y: '#62d48b',
    z: '#6ca8ff',
    w: '#f0c45c',
  };

  const RAW_TRIANGLES = [
    [53.65669559977147, 123.20508075688774, 250, 246.34330440022853, 0, 'D1'],
    [52.984011026495736, 174.24660560764943, 50, 247.01598897350425, 1, 'U1'],
    [98.71823312733801, 220.03828947357886, 123.20508075688774, 201.281766872662, 1, 'U3'],
    [78.26467997914015, 197.92315674002487, 78.10499177949904, 221.73532002085986, 1, 'U2'],
    [90.4856922951427, 78.10499177949904, 160.66014976539617, 209.51430770485734, 0, 'D3'],
    [80.98384838952128, 103.12199145016105, 220.03828947357886, 219.0161516104787, 0, 'D2'],
    [114.9488500600036, 160.66014976539617, 103.12199145016105, 185.0511499399964, 1, 'U4'],
    [116.35142605010424, 134.30757626706648, 197.92315674002487, 183.64857394989576, 0, 'D4'],
    [124.61190803072795, 144.79777263138968, 174.24660560764943, 175.38809196927207, 0, 'D5'],
  ];

  const oldCanvas = document.querySelector('.sri-traditional-canvas');
  if (oldCanvas) oldCanvas.remove();
  document.getElementById('sriTraditionalCorrectionStyles')?.remove();

  const canvas = document.createElement('canvas');
  canvas.className = 'sri-traditional-canvas sri-traditional-canvas--v2';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });

  const style = document.createElement('style');
  style.id = 'sriTraditionalCorrectionStylesV2';
  style.textContent = `
    .sri-traditional-canvas--v2 {
      position: fixed;
      inset: 0;
      z-index: 1;
      width: 100vw;
      height: 100dvh;
      opacity: 0;
      pointer-events: none;
      transition: opacity 140ms ease;
      touch-action: none;
    }
    body.sri-traditional-active:not(.learn4d-active) .sri-traditional-canvas--v2 {
      opacity: 1;
      pointer-events: auto;
    }
    body.sri-traditional-active:not(.learn4d-active) #solidLayer,
    body.sri-traditional-active:not(.learn4d-active) #mandala {
      opacity: 0 !important;
      visibility: hidden !important;
      pointer-events: none !important;
    }
    @media (prefers-reduced-motion: reduce) {
      .sri-traditional-canvas--v2 { transition: none; }
    }
  `;
  document.head.appendChild(style);

  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const smooth = (t) => {
    const x = clamp(t);
    return x * x * (3 - 2 * x);
  };
  const smoothRange = (a, b, x) => smooth((x - a) / Math.max(1e-6, b - a));

  function hexToRgba(hex, alpha = 1) {
    const h = hex.replace('#', '');
    const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
  }

  function fitCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, DPR_LIMIT);
    const width = window.innerWidth;
    const height = window.innerHeight;
    const pw = Math.max(1, Math.round(width * dpr));
    const ph = Math.max(1, Math.round(height * dpr));
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { width, height };
  }

  function activeValue(selector, attr) {
    return document.querySelector(`${selector}.is-active`)?.getAttribute(attr) || null;
  }

  function sriSelected() {
    return Boolean(document.querySelector('.mandala-card[data-preset="sriyantra"].is-active'));
  }

  function selectedDimension() {
    return Number(activeValue('[data-dimension]', 'data-dimension')) || 2;
  }

  function selectedRenderMode() {
    return activeValue('[data-render]', 'data-render') || 'solid';
  }

  function selectedColorMode() {
    return activeValue('[data-color]', 'data-color') || 'classic';
  }

  function selectedProjection() {
    return activeValue('[data-projection]', 'data-projection') || 'perspective';
  }

  function readRanges(containerId, count, fallback) {
    const inputs = [...document.querySelectorAll(`#${containerId} input[type="range"]`)];
    return Array.from({ length: count }, (_, i) => {
      const v = Number(inputs[i]?.value);
      return Number.isFinite(v) ? v : fallback[i];
    });
  }

  function readRotations() {
    const v = readRanges('rotationRows', 6, [0, 0, 0, 0, 0, 0]);
    const r = Math.PI / 180;
    return { xw:v[0]*r, yw:v[1]*r, zw:v[2]*r, xy:v[3]*r, xz:v[4]*r, yz:v[5]*r };
  }

  function readScales() {
    const v = readRanges('scaleRows', 4, [1, 1, 1, 1]);
    return { x:v[0], y:v[1], z:v[2], w:v[3] };
  }

  function trianglePoints(raw, scale = 0.62) {
    const [lx, baseY, apexY, rx] = raw;
    const p = (x, y) => [((x - 150) / 100) * scale, ((y - 150) / 100) * scale];
    return [p(lx, baseY), p(150, apexY), p(rx, baseY)];
  }

  const TRIANGLES = RAW_TRIANGLES.map((raw) => ({ id: raw[5], points: trianglePoints(raw) }));

  function segmentStrip(a, b, thickness) {
    const dx = b[0]-a[0], dy = b[1]-a[1];
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len * thickness * .5;
    const ny = dx / len * thickness * .5;
    return [[a[0]+nx,a[1]+ny],[b[0]+nx,b[1]+ny],[b[0]-nx,b[1]-ny],[a[0]-nx,a[1]-ny]];
  }

  function circlePoly(radius, segments = 28) {
    return Array.from({ length: segments }, (_, i) => {
      const a = i / segments * TAU;
      return [Math.cos(a)*radius, Math.sin(a)*radius];
    });
  }

  function petalPolygon(count, index, innerR, outerR) {
    const step = TAU / count;
    const center = -Math.PI / 2 + index * step;
    const half = step * .43;
    const points = [];
    for (let i = 0; i <= 12; i += 1) {
      const t = i / 12;
      const a = center - half + 2 * half * t;
      const profile = Math.pow(Math.sin(Math.PI * t), .62);
      const r = innerR + (outerR - innerR) * profile;
      points.push([Math.cos(a)*r, Math.sin(a)*r]);
    }
    for (let i = 5; i >= 0; i -= 1) {
      const t = i / 5;
      const a = center - half + 2 * half * t;
      points.push([Math.cos(a)*innerR, Math.sin(a)*innerR]);
    }
    return points;
  }

  function ringQuads(radius, thickness, segments = 64) {
    const out = [];
    const r0 = radius - thickness*.5, r1 = radius + thickness*.5;
    for (let i = 0; i < segments; i += 1) {
      const a0 = i/segments*TAU, a1 = (i+1)/segments*TAU;
      out.push([[Math.cos(a0)*r0,Math.sin(a0)*r0],[Math.cos(a1)*r0,Math.sin(a1)*r0],[Math.cos(a1)*r1,Math.sin(a1)*r1],[Math.cos(a0)*r1,Math.sin(a0)*r1]]);
    }
    return out;
  }

  function bhupuraSegments(half, thickness, gateWidth=.22, gateDepth=.12) {
    const g = gateWidth*.5, t = thickness, p = [];
    p.push([[-half,-half],[-g,-half],[-g,-half+t],[-half,-half+t]]);
    p.push([[g,-half],[half,-half],[half,-half+t],[g,-half+t]]);
    p.push([[-half,half-t],[-g,half-t],[-g,half],[-half,half]]);
    p.push([[g,half-t],[half,half-t],[half,half],[g,half]]);
    p.push([[-half,-half],[-half+t,-half],[-half+t,-g],[-half,-g]]);
    p.push([[-half,g],[-half+t,g],[-half+t,half],[-half,half]]);
    p.push([[half-t,-half],[half,-half],[half,-g],[half-t,-g]]);
    p.push([[half-t,g],[half,g],[half,half],[half-t,half]]);
    const lip = gateWidth*.15;
    p.push([[-g-lip,-half-gateDepth],[g+lip,-half-gateDepth],[g+lip,-half-gateDepth+t],[-g-lip,-half-gateDepth+t]]);
    p.push([[-g-lip,half+gateDepth-t],[g+lip,half+gateDepth-t],[g+lip,half+gateDepth],[-g-lip,half+gateDepth]]);
    p.push([[-half-gateDepth,-g-lip],[-half-gateDepth+t,-g-lip],[-half-gateDepth+t,g+lip],[-half-gateDepth,g+lip]]);
    p.push([[half+gateDepth-t,-g-lip],[half+gateDepth,-g-lip],[half+gateDepth,g+lip],[half+gateDepth-t,g+lip]]);
    return p;
  }

  function region(poly, color, z, height, order, id, kind='solid') {
    return { poly, color, z, height, order, id, kind };
  }

  function buildRegions(colorMode='classic') {
    const form = colorMode === 'form';
    const neutral = form ? COLORS.neutral : COLORS.outline;
    const p = colorMode === 'classic' ? COLORS : {
      ...COLORS,
      bhupuraOuter:neutral, bhupuraMiddle:neutral, bhupuraInner:neutral,
      lotus16:neutral, lotus8:neutral, central:neutral, bindu:neutral,
      outline:neutral, outlineSoft:neutral,
    };
    const regions = [];
    [[1.34,p.bhupuraOuter,0,'bhupura-outer'],[1.285,p.bhupuraMiddle,.035,'bhupura-middle'],[1.23,p.bhupuraInner,.07,'bhupura-inner']]
      .forEach(([half,color,z,id], layer) => bhupuraSegments(half,.018,.24,.11).forEach((poly,i) => regions.push(region(poly,color,z,.045,10+layer,`${id}-${i}`))));
    [1.105,1.07,1.035].forEach((r,ri) => ringQuads(r,.010,72).forEach((poly,i) => regions.push(region(poly,p.outlineSoft,.105,.026,20+ri,`trivalaya-${ri}-${i}`))));
    for (let i=0;i<16;i+=1) regions.push(region(petalPolygon(16,i,.82,.995),p.lotus16,.15,.075,30,`lotus16-${i}`));
    for (let i=0;i<8;i+=1) regions.push(region(petalPolygon(8,i,.665,.79),p.lotus8,.245,.082,40,`lotus8-${i}`));
    TRIANGLES.forEach((tri,ti) => {
      for (let i=0;i<3;i+=1) regions.push(region(segmentStrip(tri.points[i],tri.points[(i+1)%3],.011),p.outline,.35,.04,50+ti*.01,`${tri.id}-edge-${i}`,'line'));
    });
    const central = TRIANGLES.find((tri) => tri.id === 'D5');
    if (central) regions.push(region(central.points.map(([x,y]) => [x*.92,y*.92]),p.central,.405,.052,70,'central-trikona'));
    regions.push(region(circlePoly(.024,24),p.bindu,.475,.060,80,'bindu'));
    return regions;
  }

  function rotatePlane(v,a,b,angle) {
    if (!angle) return;
    const c=Math.cos(angle), s=Math.sin(angle), x=v[a], y=v[b];
    v[a]=x*c-y*s; v[b]=x*s+y*c;
  }

  function transform4(point, rotations, scales) {
    const v=[point[0]*scales.x,point[1]*scales.y,point[2]*scales.z,point[3]*scales.w];
    rotatePlane(v,0,3,rotations.xw); rotatePlane(v,1,3,rotations.yw); rotatePlane(v,2,3,rotations.zw);
    rotatePlane(v,0,1,rotations.xy); rotatePlane(v,0,2,rotations.xz); rotatePlane(v,1,2,rotations.yz);
    return v;
  }

  const camera={ yaw:-.60,pitch:.50,zoom:1,dragging:false,x:0,y:0,pointerId:null };

  function rotate3(v,yaw,pitch) {
    let [x,y,z]=v; let c=Math.cos(yaw),s=Math.sin(yaw);
    [x,z]=[c*x-s*z,s*x+c*z]; c=Math.cos(pitch); s=Math.sin(pitch); [y,z]=[c*y-s*z,s*y+c*z];
    return [x,y,z];
  }

  function stageFrame(width,height) {
    const panel=document.getElementById('explorerControls');
    const rect=panel?.getBoundingClientRect();
    const visible=rect&&rect.width>100&&rect.left>width*.55&&getComputedStyle(panel).visibility!=='hidden';
    const right=visible?rect.left:width;
    const available=Math.max(320,right);
    return { cx:available*.5,cy:height*.49,scale:Math.min(available*.275,height*.335)*camera.zoom };
  }

  function projectPoint(point,width,height,rotations,scales,projection,cameraMix) {
    const v4=transform4(point,rotations,scales);
    let v3=[v4[0]+v4[3]*.58,v4[1]-v4[3]*.42,v4[2]+v4[3]*.20];
    if (projection==='isometric') {
      const isoYaw=-Math.PI/4*cameraMix;
      const isoPitch=Math.asin(Math.tan(Math.PI/6))*cameraMix;
      v3=rotate3(v3,isoYaw,isoPitch);
    } else {
      v3=rotate3(v3,camera.yaw*cameraMix,camera.pitch*cameraMix);
    }
    const frame=stageFrame(width,height);
    let factor=1;
    if (projection==='perspective') factor=4.6/Math.max(2.4,4.6-v3[2]*cameraMix);
    return { x:frame.cx+v3[0]*frame.scale*factor,y:frame.cy+v3[1]*frame.scale*factor,depth:v3[2] };
  }

  function polyPath(points) {
    if (!points.length) return;
    ctx.beginPath(); ctx.moveTo(points[0].x,points[0].y);
    for (let i=1;i<points.length;i+=1) ctx.lineTo(points[i].x,points[i].y);
    ctx.closePath();
  }

  function drawFace(points,color,alpha,stroke=null,lineWidth=.8) {
    if (points.length<3) return;
    polyPath(points); ctx.fillStyle=hexToRgba(color,alpha); ctx.fill();
    if (stroke) { ctx.strokeStyle=hexToRgba(stroke,Math.min(1,alpha+.18)); ctx.lineWidth=lineWidth; ctx.stroke(); }
  }

  function drawLine(a,b,color,alpha=1,width=1) {
    ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y);
    ctx.strokeStyle=hexToRgba(color,alpha); ctx.lineWidth=width; ctx.lineCap='round'; ctx.stroke();
  }

  function axisTint(r,colorMode) {
    if (colorMode!=='axis') return r.color;
    if (r.id.startsWith('bhupura')) return COLORS.x;
    if (r.id.startsWith('lotus16')) return COLORS.y;
    if (r.id.startsWith('lotus8')) return COLORS.z;
    if (r.id==='bindu') return COLORS.w;
    return COLORS.neutral;
  }

  function regionGeometry(r,zMix,w,width,height,rotations,scales,projection,cameraMix) {
    const z0=r.z*zMix, z1=(r.z+r.height)*zMix;
    const bottom=r.poly.map(([x,y]) => projectPoint([x,y,z0,w],width,height,rotations,scales,projection,cameraMix));
    const top=r.poly.map(([x,y]) => projectPoint([x,y,z1,w],width,height,rotations,scales,projection,cameraMix));
    const faces=[{points:top,depth:top.reduce((s,p)=>s+p.depth,0)/top.length,type:'top'}];
    if (zMix>.001) {
      for (let i=0;i<r.poly.length;i+=1) {
        const j=(i+1)%r.poly.length;
        const points=[bottom[i],bottom[j],top[j],top[i]];
        faces.push({points,depth:points.reduce((s,p)=>s+p.depth,0)/4,type:'side'});
      }
    }
    return {faces,top,bottom};
  }

  function drawScene(regions,width,height,zMix,wMix,colorMode,renderMode,projection,rotations,scales) {
    const cameraMix=smooth(zMix);
    const wEase=smooth(wMix);
    const duplicateFade=smoothRange(.06,.28,wEase);
    const connectorFade=smoothRange(.12,.42,wEase);
    const xray=renderMode==='xray';
    const queue=[];
    const connectors=[];

    for (const r of regions) {
      const color=axisTint(r,colorMode);
      const original=regionGeometry(r,zMix,0,width,height,rotations,scales,projection,cameraMix);
      for (const face of original.faces) queue.push({...face,color,alpha:xray?.25:.76,order:r.order,copy:0});

      if (duplicateFade>.001) {
        const duplicate=regionGeometry(r,zMix,W_DEPTH*wEase,width,height,rotations,scales,projection,cameraMix);
        for (const face of duplicate.faces) queue.push({...face,color,alpha:(xray?.18:.62)*duplicateFade,order:r.order,copy:1});
        for (let i=0;i<original.top.length;i+=1) {
          connectors.push([original.top[i],duplicate.top[i],connectorFade]);
          if (zMix>.001) connectors.push([original.bottom[i],duplicate.bottom[i],connectorFade]);
        }
      }
    }

    queue.sort((a,b)=>a.depth-b.depth||a.order-b.order||a.copy-b.copy);
    for (const item of queue) {
      const side=item.type==='side';
      if (renderMode==='wire') {
        polyPath(item.points); ctx.strokeStyle=hexToRgba(item.color,item.alpha*.95); ctx.lineWidth=1; ctx.stroke();
      } else {
        drawFace(item.points,item.color,item.alpha*(side?.62:1),renderMode==='solid-edges'?COLORS.outline:null,.8);
      }
    }
    if (duplicateFade>.001) {
      for (const [a,b,fade] of connectors) drawLine(a,b,COLORS.w,(renderMode==='wire'?.62:.34)*fade,renderMode==='wire'?1:.8);
    }
  }

  let dimensionPosition=2;
  let wasActive=false;
  let last=performance.now();
  let lastPreview=0;

  function drawPreview(now) {
    if (now-lastPreview<220) return;
    lastPreview=now;
    const preview=document.getElementById('previewSriYantra');
    if (!preview) return;
    const pctx=preview.getContext('2d');
    const w=preview.width,h=preview.height;
    pctx.clearRect(0,0,w,h); pctx.save(); pctx.translate(w*.5,h*.5);
    const s=Math.min(w,h)*.35; pctx.scale(s,s);
    for (const r of buildRegions('classic').sort((a,b)=>a.order-b.order)) {
      pctx.beginPath(); pctx.moveTo(r.poly[0][0],r.poly[0][1]);
      for (let i=1;i<r.poly.length;i+=1) pctx.lineTo(r.poly[i][0],r.poly[i][1]);
      pctx.closePath(); pctx.fillStyle=r.color; pctx.globalAlpha=r.kind==='line'?.96:.9; pctx.fill();
    }
    pctx.restore();
  }

  function tick(now) {
    const active=sriSelected()&&!document.body.classList.contains('learn4d-active');
    document.body.classList.toggle('sri-traditional-active',active);
    drawPreview(now);
    const {width,height}=fitCanvas(); ctx.clearRect(0,0,width,height);
    const dt=Math.min(.05,Math.max(0,(now-last)/1000)); last=now;
    const target=selectedDimension();

    if (active) {
      if (!wasActive) dimensionPosition=target;
      const delta=target-dimensionPosition;
      if (Math.abs(delta)>.0001) {
        const step=dt/DIMENSION_SECONDS;
        dimensionPosition += Math.sign(delta)*Math.min(Math.abs(delta),step);
      } else dimensionPosition=target;

      const zMix=smooth(clamp(dimensionPosition-2,0,1));
      const wMix=smooth(clamp(dimensionPosition-3,0,1));
      drawScene(
        buildRegions(selectedColorMode()),width,height,zMix,wMix,selectedColorMode(),selectedRenderMode(),selectedProjection(),readRotations(),readScales(),
      );
    } else {
      dimensionPosition=target;
    }

    wasActive=active;
    requestAnimationFrame(tick);
  }

  canvas.addEventListener('pointerdown',(e)=>{
    if (!document.body.classList.contains('sri-traditional-active')) return;
    camera.dragging=true; camera.pointerId=e.pointerId; camera.x=e.clientX; camera.y=e.clientY; canvas.setPointerCapture?.(e.pointerId);
  });
  canvas.addEventListener('pointermove',(e)=>{
    if (!camera.dragging||e.pointerId!==camera.pointerId||dimensionPosition<2.02) return;
    const dx=e.clientX-camera.x,dy=e.clientY-camera.y; camera.x=e.clientX; camera.y=e.clientY;
    camera.yaw+=dx*.008; camera.pitch=clamp(camera.pitch+dy*.008,-1.35,1.35);
  });
  const release=(e)=>{ if(e.pointerId===camera.pointerId){camera.dragging=false;camera.pointerId=null;} };
  canvas.addEventListener('pointerup',release); canvas.addEventListener('pointercancel',release);
  canvas.addEventListener('wheel',(e)=>{
    if (!document.body.classList.contains('sri-traditional-active')) return;
    e.preventDefault(); camera.zoom=clamp(camera.zoom*Math.exp(-e.deltaY*.001),.62,1.65);
  },{passive:false});

  requestAnimationFrame(tick);
})();
