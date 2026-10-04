(() => {
  'use strict';

  if (window.__hypermandalaTutorialInstalled) return;
  window.__hypermandalaTutorialInstalled = true;

  const TAU = Math.PI * 2;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const lessons = [
    {
      id: 'build',
      short: 'Build',
      eyebrow: 'THE REPEATED RULE',
      title: 'Build a dimension',
      copy: 'Move the entire object in a new perpendicular direction. Every part moves with it and sweeps out something one dimension higher.',
    },
    {
      id: 'parts',
      short: 'Every part',
      eyebrow: 'NOT JUST THE OUTLINE',
      title: 'Every part upgrades',
      copy: 'A cube does not simply “turn into” a 4D object. Its vertices, edges, faces and the cube itself all receive the dimensional upgrade.',
    },
    {
      id: 'freedom',
      short: 'Freedom',
      eyebrow: 'REGULAR IS ONE CHOICE',
      title: 'The upgrade is not unique',
      copy: 'A line can sweep a square or a rectangle. A square can sweep a cube or another prism. The same freedom continues into 4D.',
    },
    {
      id: 'slice',
      short: 'Slices',
      eyebrow: 'A VIEW IS NOT THE WHOLE',
      title: 'A slice does not determine what is behind it',
      copy: 'The same lower-dimensional slice can belong to infinitely many higher-dimensional objects. A square does not imply a cube, and a cube does not imply a tesseract.',
    },
    {
      id: 'projection',
      short: 'See 4D',
      eyebrow: 'TWO DIFFERENT OPERATIONS',
      title: 'Projection is not a slice',
      copy: 'A projection compresses information from the whole object. A slice shows only one intersection. Both are useful, but they answer different questions.',
    },
  ];

  const style = document.createElement('style');
  style.id = 'hypermandalaTutorialStyles';
  style.textContent = `
    .control-panel__actions .learn-4d-launch {
      border: 0;
      padding: 2px 0;
      background: transparent;
      color: rgba(231,211,158,.80);
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: .08em;
      cursor: pointer;
    }
    .control-panel__actions .learn-4d-launch:hover { color: rgba(250,232,181,.98); }

    .dimension-tutorial {
      position: fixed;
      inset: 0;
      z-index: 100;
      display: grid;
      place-items: center;
      padding: 18px;
      background: rgba(4,5,7,.84);
      backdrop-filter: blur(18px) saturate(115%);
      -webkit-backdrop-filter: blur(18px) saturate(115%);
    }
    .dimension-tutorial[hidden] { display: none; }
    .dimension-tutorial__shell {
      width: min(1100px, calc(100vw - 36px));
      max-height: min(880px, calc(100dvh - 36px));
      overflow: hidden;
      border: 1px solid rgba(255,255,255,.11);
      border-radius: 22px;
      background: rgba(10,12,15,.975);
      box-shadow: 0 28px 90px rgba(0,0,0,.55);
    }
    .dimension-tutorial__top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 15px 18px 11px;
      border-bottom: 1px solid rgba(255,255,255,.07);
    }
    .dimension-tutorial__brand { display: flex; align-items: baseline; gap: 10px; }
    .dimension-tutorial__brand strong { font-size: 14px; font-weight: 750; letter-spacing: .035em; }
    .dimension-tutorial__brand span {
      color: rgba(225,227,230,.35);
      font-size: 8px;
      text-transform: uppercase;
      letter-spacing: .11em;
    }
    .dimension-tutorial__close {
      display: grid;
      place-items: center;
      width: 34px;
      height: 34px;
      padding: 0;
      border: 1px solid rgba(255,255,255,.09);
      border-radius: 10px;
      background: rgba(255,255,255,.035);
      color: rgba(245,246,248,.68);
      cursor: pointer;
      font-size: 18px;
    }
    .dimension-tutorial__close:hover { background: rgba(255,255,255,.08); color: #fff; }
    .dimension-tutorial__steps {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 4px;
      padding: 10px 14px 0;
    }
    .dimension-tutorial__step {
      min-height: 35px;
      border: 0;
      border-radius: 9px;
      background: transparent;
      color: rgba(238,239,242,.34);
      cursor: pointer;
      font-size: 9px;
      font-weight: 720;
      letter-spacing: .045em;
    }
    .dimension-tutorial__step:hover { color: rgba(238,239,242,.72); }
    .dimension-tutorial__step.is-active { background: rgba(255,255,255,.075); color: rgba(249,249,247,.96); }
    .dimension-tutorial__body {
      display: grid;
      grid-template-columns: minmax(0, 1.6fr) minmax(285px, .72fr);
      min-height: 570px;
    }
    .dimension-tutorial__stage {
      display: grid;
      grid-template-rows: minmax(0, 1fr) auto;
      min-width: 0;
      padding: 16px 16px 18px;
    }
    .dimension-tutorial__canvas-wrap {
      position: relative;
      min-height: 430px;
      overflow: hidden;
      border: 1px solid rgba(255,255,255,.065);
      border-radius: 18px;
      background:
        radial-gradient(circle at 50% 45%, rgba(76,88,110,.11), transparent 46%),
        rgba(255,255,255,.014);
    }
    .dimension-tutorial canvas { width: 100%; height: 100%; display: block; }
    .dimension-tutorial__visual-label {
      position: absolute;
      top: 13px;
      left: 14px;
      color: rgba(225,227,230,.38);
      font-size: 8px;
      font-weight: 750;
      letter-spacing: .10em;
      text-transform: uppercase;
      pointer-events: none;
    }
    .dimension-tutorial__controls { display: grid; gap: 9px; padding-top: 12px; }
    .dimension-tutorial__control-row {
      display: grid;
      grid-template-columns: 126px minmax(0,1fr) 54px;
      align-items: center;
      gap: 11px;
    }
    .dimension-tutorial__control-row > span:first-child {
      color: rgba(238,239,242,.45);
      font-size: 8px;
      font-weight: 750;
      letter-spacing: .065em;
      text-transform: uppercase;
    }
    .dimension-tutorial__value {
      color: rgba(238,239,242,.68);
      font-size: 10px;
      font-variant-numeric: tabular-nums;
      text-align: right;
    }
    .dimension-tutorial input[type='range'] { width: 100%; accent-color: #d8b662; }
    .dimension-tutorial__panel {
      display: flex;
      flex-direction: column;
      min-width: 0;
      padding: 24px 22px 20px 4px;
    }
    .dimension-tutorial__eyebrow {
      color: rgba(216,182,98,.74);
      font-size: 8px;
      font-weight: 800;
      letter-spacing: .12em;
      text-transform: uppercase;
    }
    .dimension-tutorial__title {
      margin: 8px 0 9px;
      font-size: clamp(24px, 2.3vw, 35px);
      line-height: 1.04;
      letter-spacing: -.026em;
    }
    .dimension-tutorial__copy {
      margin: 0;
      color: rgba(232,234,238,.60);
      font-size: 13px;
      line-height: 1.55;
    }
    .dimension-tutorial__rule {
      margin-top: 17px;
      padding: 13px 14px;
      border: 1px solid rgba(216,182,98,.18);
      border-radius: 13px;
      background: rgba(216,182,98,.055);
      color: rgba(245,239,225,.84);
      font-size: 12px;
      line-height: 1.48;
    }
    .dimension-tutorial__rule strong { color: #f5dfaa; }
    .dimension-tutorial__chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 15px; }
    .dimension-tutorial__chip {
      min-height: 34px;
      padding: 0 11px;
      border: 1px solid rgba(255,255,255,.075);
      border-radius: 9px;
      background: rgba(255,255,255,.025);
      color: rgba(238,239,242,.45);
      cursor: pointer;
      font-size: 9px;
      font-weight: 720;
      letter-spacing: .04em;
    }
    .dimension-tutorial__chip:hover { color: rgba(238,239,242,.82); }
    .dimension-tutorial__chip.is-active {
      border-color: rgba(216,182,98,.30);
      background: rgba(216,182,98,.105);
      color: rgba(249,245,232,.96);
    }
    .dimension-tutorial__facts { display: grid; gap: 7px; margin-top: 17px; }
    .dimension-tutorial__fact {
      display: grid;
      grid-template-columns: minmax(66px, auto) 1fr;
      gap: 9px;
      align-items: baseline;
      color: rgba(232,234,238,.56);
      font-size: 11px;
      line-height: 1.36;
    }
    .dimension-tutorial__fact strong { color: rgba(249,249,247,.90); font-size: 12px; font-variant-numeric: tabular-nums; }
    .dimension-tutorial__mini { margin-top: 12px; color: rgba(225,227,230,.36); font-size: 9px; line-height: 1.5; }
    .dimension-tutorial__nav {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      margin-top: auto;
      padding-top: 20px;
    }
    .dimension-tutorial__nav button {
      min-height: 38px;
      padding: 0 14px;
      border: 1px solid rgba(255,255,255,.08);
      border-radius: 10px;
      background: rgba(255,255,255,.035);
      color: rgba(245,246,248,.70);
      cursor: pointer;
      font-size: 9px;
      font-weight: 750;
      letter-spacing: .055em;
      text-transform: uppercase;
    }
    .dimension-tutorial__nav button:hover { background: rgba(255,255,255,.075); color: #fff; }
    .dimension-tutorial__nav button:disabled { opacity: .25; cursor: default; }
    .dimension-tutorial__nav .is-primary {
      border-color: rgba(216,182,98,.23);
      background: rgba(216,182,98,.10);
      color: rgba(249,245,232,.94);
    }

    @media (max-width: 800px) {
      .dimension-tutorial { padding: 0; }
      .dimension-tutorial__shell {
        width: 100vw;
        height: 100dvh;
        max-height: none;
        border: 0;
        border-radius: 0;
        overflow: auto;
      }
      .dimension-tutorial__top { position: sticky; top: 0; z-index: 5; background: rgba(10,12,15,.98); }
      .dimension-tutorial__brand span { display: none; }
      .dimension-tutorial__steps {
        grid-template-columns: repeat(5, minmax(90px, 1fr));
        overflow-x: auto;
        padding-bottom: 2px;
      }
      .dimension-tutorial__body { grid-template-columns: 1fr; min-height: 0; }
      .dimension-tutorial__stage { padding: 12px; }
      .dimension-tutorial__canvas-wrap { min-height: 340px; }
      .dimension-tutorial__panel { padding: 4px 16px 20px; }
      .dimension-tutorial__control-row { grid-template-columns: 94px minmax(0,1fr) 46px; gap: 8px; }
      .dimension-tutorial__nav { margin-top: 18px; }
    }
  `;
  document.head.appendChild(style);

  const launch = document.createElement('button');
  launch.type = 'button';
  launch.className = 'learn-4d-launch';
  launch.textContent = 'Learn 4D';
  launch.title = 'Interactive dimensional tutorial';
  document.querySelector('.control-panel__actions')?.prepend(launch);

  const overlay = document.createElement('div');
  overlay.className = 'dimension-tutorial';
  overlay.hidden = true;
  overlay.innerHTML = `
    <section class="dimension-tutorial__shell" role="dialog" aria-modal="true" aria-labelledby="dimensionTutorialTitle">
      <div class="dimension-tutorial__top">
        <div class="dimension-tutorial__brand">
          <strong>Dimension Builder</strong>
          <span>see the upgrade happen</span>
        </div>
        <button class="dimension-tutorial__close" type="button" aria-label="Close tutorial">×</button>
      </div>
      <div class="dimension-tutorial__steps" aria-label="Tutorial chapters"></div>
      <div class="dimension-tutorial__body">
        <div class="dimension-tutorial__stage">
          <div class="dimension-tutorial__canvas-wrap">
            <canvas aria-label="Interactive dimensional construction"></canvas>
            <div class="dimension-tutorial__visual-label"></div>
          </div>
          <div class="dimension-tutorial__controls"></div>
        </div>
        <aside class="dimension-tutorial__panel">
          <div class="dimension-tutorial__eyebrow"></div>
          <h2 class="dimension-tutorial__title" id="dimensionTutorialTitle"></h2>
          <p class="dimension-tutorial__copy"></p>
          <div class="dimension-tutorial__rule"></div>
          <div class="dimension-tutorial__chips"></div>
          <div class="dimension-tutorial__facts"></div>
          <div class="dimension-tutorial__mini"></div>
          <div class="dimension-tutorial__nav">
            <button type="button" data-nav="prev">Back</button>
            <button type="button" class="is-primary" data-nav="next">Next</button>
          </div>
        </aside>
      </div>
    </section>
  `;
  document.body.appendChild(overlay);

  const canvas = overlay.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const stepsEl = overlay.querySelector('.dimension-tutorial__steps');
  const controlsEl = overlay.querySelector('.dimension-tutorial__controls');
  const chipsEl = overlay.querySelector('.dimension-tutorial__chips');
  const factsEl = overlay.querySelector('.dimension-tutorial__facts');
  const miniEl = overlay.querySelector('.dimension-tutorial__mini');
  const titleEl = overlay.querySelector('.dimension-tutorial__title');
  const eyebrowEl = overlay.querySelector('.dimension-tutorial__eyebrow');
  const copyEl = overlay.querySelector('.dimension-tutorial__copy');
  const ruleEl = overlay.querySelector('.dimension-tutorial__rule');
  const visualLabel = overlay.querySelector('.dimension-tutorial__visual-label');
  const prevButton = overlay.querySelector('[data-nav="prev"]');
  const nextButton = overlay.querySelector('[data-nav="next"]');
  const closeButton = overlay.querySelector('.dimension-tutorial__close');

  const C = {
    text: 'rgba(245,246,248,.93)',
    faint: 'rgba(226,229,235,.24)',
    source: 'rgba(226,229,235,.42)',
    gold: 'rgba(216,182,98,.94)',
    goldFill: 'rgba(216,182,98,.10)',
    blue: 'rgba(108,168,255,.78)',
    green: 'rgba(98,212,139,.75)',
  };

  let lessonIndex = 0;
  let buildStage = 3;
  let progress = 1;
  let extent = 1;
  let partMode = 'everything';
  let deformation = 'straight';
  let freedomDim = 3;
  let sliceDim = 3;
  let viewDim = 4;
  let auto = false;
  let autoDir = -1;
  let raf = 0;

  function line(a, b, color = C.text, width = 1.4, alpha = 1) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
    ctx.stroke();
    ctx.restore();
  }

  function poly(points, fill = null, stroke = null, alpha = 1, width = 1) {
    if (!points.length) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    points.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); }
    ctx.restore();
  }

  function dot(p, radius = 3.6, color = C.text, alpha = 1) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(p[0], p[1], radius, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function text(value, x, y, color = C.faint, size = 10) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.font = `600 ${size}px Inter, ui-sans-serif, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(value, x, y);
    ctx.restore();
  }

  function fitCanvas() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const pw = Math.max(1, Math.round(rect.width * dpr));
    const ph = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return [rect.width, rect.height];
  }

  function cubeVertices(size = 1) {
    const out = [];
    for (let z = 0; z < 2; z += 1) {
      for (let y = 0; y < 2; y += 1) {
        for (let x = 0; x < 2; x += 1) {
          out.push([(x - .5) * size, (y - .5) * size, (z - .5) * size]);
        }
      }
    }
    return out;
  }

  const cubeEdges = [
    [0,1],[0,2],[0,4],[1,3],[1,5],[2,3],[2,6],[3,7],
    [4,5],[4,6],[5,7],[6,7],
  ];

  const cubeFaces = [
    [0,2,6,4], [1,5,7,3],
    [0,4,5,1], [2,3,7,6],
    [0,1,3,2], [4,6,7,5],
  ];

  function rotate3(v, zAngle = 0) {
    let [x, y, z] = v;
    if (zAngle) {
      const c0 = Math.cos(zAngle), s0 = Math.sin(zAngle);
      [x, y] = [c0*x - s0*y, s0*x + c0*y];
    }
    const yaw = -.72;
    const pitch = .52;
    let c = Math.cos(yaw), s = Math.sin(yaw);
    [x, z] = [c*x - s*z, s*x + c*z];
    c = Math.cos(pitch); s = Math.sin(pitch);
    [y, z] = [c*y - s*z, s*y + c*z];
    return [x,y,z];
  }

  function project3(v, center, scale, zAngle = 0) {
    const [x,y,z] = rotate3(v,zAngle);
    const f = 5 / (5 - z);
    return [center[0] + x*scale*f, center[1] + y*scale*f, z];
  }

  function rotate4(v) {
    const q = [...v];
    const r = (a,b,angle) => {
      const c = Math.cos(angle), s = Math.sin(angle);
      const na = c*q[a] - s*q[b];
      const nb = s*q[a] + c*q[b];
      q[a] = na; q[b] = nb;
    };
    r(0,3,.50); r(1,3,-.30); r(2,3,.22); r(0,2,-.52); r(1,2,.34);
    return q;
  }

  function project4(v, center, scale) {
    const q = rotate4(v);
    const wf = 5 / (5 - q[3]);
    return project3([q[0]*wf,q[1]*wf,q[2]*wf],center,scale);
  }

  function drawCubeWire(vertices, center, scale, color, alpha = .8, width = 1.4, zAngle = 0) {
    const p = vertices.map((v) => project3(v,center,scale,zAngle));
    cubeEdges.forEach(([a,b]) => line(p[a],p[b],color,width,alpha));
    return p;
  }

  function draw4DCubeSlice(cube, w, center, scale, color, alpha = .55, zAngle = 0) {
    const p = cube.map((v) => {
      const [x,y,z] = zAngle ? rotateAroundZ(v,zAngle) : v;
      return project4([x,y,z,w],center,scale);
    });
    cubeEdges.forEach(([a,b]) => line(p[a],p[b],color,1.2,alpha));
    return p;
  }

  function rotateAroundZ(v, angle) {
    const c = Math.cos(angle), s = Math.sin(angle);
    return [c*v[0]-s*v[1], s*v[0]+c*v[1], v[2]];
  }

  function drawBuild(width, height) {
    const center = [width*.5,height*.52];
    const base = Math.min(width,height)*.28;
    const p = Math.max(0,Math.min(1,progress));
    const e = extent*p;

    if (buildStage === 0) {
      const length = base*1.35*p;
      const a = [center[0]-base*.67,center[1]];
      const b = [a[0]+length,center[1]];
      line(a,b,C.gold,3,.82);
      dot(a,5,C.source); dot(b,5.2,C.text);
      text('a point traces a line',center[0],height*.18,C.gold,12);
      return;
    }

    if (buildStage === 1) {
      const side = base*1.18;
      const half = side/2;
      const dx = side*e;
      const x = center[0]-side*.50;
      const a=[x,center[1]-half], b=[x,center[1]+half];
      const c=[x+dx,center[1]+half], d=[x+dx,center[1]-half];
      poly([a,b,c,d],C.goldFill,C.gold,.92,1.3);
      line(a,b,C.source,2.3,.8); line(d,c,C.text,2.3,.92);
      [a,b].forEach((q)=>dot(q,4,C.source)); [c,d].forEach((q)=>dot(q,4,C.text));
      const finalName = Math.abs(extent-1)<.025 ? 'square' : 'rectangle';
      text(p>.985 ? finalName : `building ${Math.round(p*100)}%`,center[0],height*.17,C.gold,12);
      return;
    }

    if (buildStage === 2) {
      const side = 1.35;
      const source = cubeVertices(side).map(([x,y,z])=>[x,y,z*e]);
      const proj = source.map((v)=>project3(v,center,base*.78));
      cubeFaces.forEach((face)=>poly(face.map((i)=>proj[i]),'rgba(216,182,98,.035)','rgba(216,182,98,.20)',.65,1));
      cubeEdges.forEach(([a,b])=>{
        const newEdge = Math.abs(source[a][2]-source[b][2])>.01;
        line(proj[a],proj[b],newEdge?C.gold:C.text,newEdge?2.1:1.45,newEdge?.9:.68);
      });
      proj.forEach((q,i)=>dot(q,2.9,i<4?C.source:C.text,.85));
      const finalName = Math.abs(extent-1)<.025 ? 'cube' : 'rectangular prism';
      text(p>.985 ? finalName : `building ${Math.round(p*100)}%`,center[0],height*.14,C.gold,12);
      return;
    }

    const cube = cubeVertices(1.30);
    const wHalf = .65*e;
    const p4 = [
      ...cube.map((v)=>project4([v[0],v[1],v[2],-wHalf],center,base*.78)),
      ...cube.map((v)=>project4([v[0],v[1],v[2], wHalf],center,base*.78)),
    ];
    cubeEdges.forEach(([a,b])=>{
      line(p4[a],p4[b],C.source,1.25,.55);
      line(p4[a+8],p4[b+8],C.text,1.5,.88);
    });
    for(let i=0;i<8;i+=1) line(p4[i],p4[i+8],C.gold,2.2,.90);
    p4.forEach((q,i)=>dot(q,2.7,i<8?C.source:C.text,.88));
    const finalName = Math.abs(extent-1)<.025 ? 'tesseract' : '4D rectangular orthotope';
    text(p>.985 ? finalName : `building through W · ${Math.round(p*100)}%`,center[0],height*.13,C.gold,12);
  }

  function tesseractProjection(width,height) {
    const center=[width*.5,height*.52];
    const scale=Math.min(width,height)*.22;
    const cube=cubeVertices(1.34);
    const all=[...cube.map((v)=>[...v,-.68]),...cube.map((v)=>[...v,.68])];
    const p=all.map((v)=>project4(v,center,scale));
    return {center,scale,cube,p};
  }

  function drawParts(width,height) {
    const {center,p}=tesseractProjection(width,height);
    cubeEdges.forEach(([a,b])=>{
      line(p[a],p[b],C.source,1.15,.28);
      line(p[a+8],p[b+8],C.text,1.25,.34);
    });
    for(let i=0;i<8;i+=1) line(p[i],p[i+8],C.gold,1.5,.35);

    if(partMode==='vertices'||partMode==='everything'){
      for(let i=0;i<8;i+=1){line(p[i],p[i+8],C.gold,3,1);dot(p[i],4,C.source);dot(p[i+8],4,C.gold);}
    }
    if(partMode==='edges'||partMode==='everything'){
      cubeEdges.forEach(([a,b])=>poly([p[a],p[b],p[b+8],p[a+8]],'rgba(108,168,255,.055)',C.blue,partMode==='everything'?.40:.82,1.2));
    }
    if(partMode==='faces'||partMode==='everything'){
      cubeFaces.forEach((face)=>{
        const a=face.map((i)=>p[i]);
        const b=face.map((i)=>p[i+8]);
        poly(a,null,C.green,partMode==='everything'?.23:.60,1.2);
        poly(b,null,C.green,partMode==='everything'?.23:.60,1.2);
        face.forEach((i)=>line(p[i],p[i+8],C.green,1.6,partMode==='everything'?.22:.58));
      });
    }
    if(partMode==='whole'){
      cubeEdges.forEach(([a,b])=>{line(p[a],p[b],C.source,2,.72);line(p[a+8],p[b+8],C.text,2,.90);});
      for(let i=0;i<8;i+=1) line(p[i],p[i+8],C.gold,2.6,.95);
    }
    const m={
      everything:'all levels upgrade simultaneously',
      vertices:'8 vertices → 8 new W-edges',
      edges:'12 edges → 12 new square faces',
      faces:'6 square faces → 6 new cubic cells',
      whole:'the whole cube sweeps a 4D body',
    };
    text(m[partMode],center[0],height*.13,C.gold,12);
  }

  function deformationAt(t) {
    if(deformation==='taper') return {scale:1-.55*t,angle:0};
    if(deformation==='twist') return {scale:1,angle:t*.95};
    return {scale:1,angle:0};
  }

  function drawFreedom3D(width,height,asSlice=false) {
    const center=[width*.5,height*.52];
    const base=Math.min(width,height)*.23;
    const steps=asSlice?10:8;
    const rings=[];
    for(let i=0;i<=steps;i+=1){
      const t=i/steps;
      const signed=asSlice?t*2-1:t;
      const u=asSlice?Math.abs(signed):t;
      let {scale,angle}=deformationAt(u);
      if(asSlice&&deformation==='twist') angle=signed*.72;
      if(asSlice&&deformation==='taper') scale=1-.42*Math.abs(signed);
      const z=(asSlice?signed:(t-.5)*2)*1.25*extent;
      const s=.74*scale;
      const corners=[[-s,-s],[s,-s],[s,s],[-s,s]].map(([x,y])=>{
        const c=Math.cos(angle),sn=Math.sin(angle);
        return [c*x-sn*y,sn*x+c*y,z];
      });
      rings.push(corners.map((v)=>project3(v,center,base)));
    }
    const highlight=asSlice?Math.floor(steps/2):0;
    rings.forEach((ring,i)=>poly(ring,i===highlight?C.goldFill:null,i===highlight?C.gold:'rgba(226,229,235,.22)',i===highlight?1:.50,i===highlight?2.3:1));
    for(let k=0;k<4;k+=1) for(let i=0;i<rings.length-1;i+=1) line(rings[i][k],rings[i+1][k],deformation==='straight'?C.faint:C.blue,1.1,.5);
    text(asSlice?'the highlighted square is only one slice':'same starting square · different continuation',center[0],height*.13,C.gold,12);
  }

  function drawFreedom4D(width,height,asSlice=false) {
    const center=[width*.5,height*.52];
    const base=Math.min(width,height)*.18;
    const steps=asSlice?8:6;
    const cube0=cubeVertices(1.22);
    const slices=[];
    for(let i=0;i<=steps;i+=1){
      const t=i/steps;
      const signed=asSlice?t*2-1:t;
      const u=asSlice?Math.abs(signed):t;
      let {scale,angle}=deformationAt(u);
      if(asSlice&&deformation==='twist') angle=signed*.70;
      if(asSlice&&deformation==='taper') scale=1-.38*Math.abs(signed);
      const w=(asSlice?signed:(t-.5)*2)*.86*extent;
      const cube=cube0.map((v)=>rotateAroundZ(v.map((n)=>n*scale),angle));
      const p=cube.map((v)=>project4([v[0],v[1],v[2],w],center,base));
      slices.push(p);
      const highlight=asSlice&&i===Math.floor(steps/2);
      cubeEdges.forEach(([a,b])=>line(p[a],p[b],highlight?C.gold:'rgba(226,229,235,.28)',highlight?2.1:1.05,highlight?1:.48));
    }
    for(let i=0;i<slices.length-1;i+=1){
      for(let v=0;v<8;v+=1) line(slices[i][v],slices[i+1][v],deformation==='straight'?C.faint:C.blue,1,.36);
    }
    text(asSlice?'the highlighted cube is only one 3D slice':'same starting cube · different continuation through W',center[0],height*.13,C.gold,12);
  }

  function drawFreedom(width,height){
    if(freedomDim===3) drawFreedom3D(width,height,false);
    else drawFreedom4D(width,height,false);
  }

  function drawSlice(width,height){
    if(sliceDim===3) drawFreedom3D(width,height,true);
    else drawFreedom4D(width,height,true);
  }

  function drawProjection(width,height){
    const left=[width*.27,height*.52], right=[width*.73,height*.52];
    const scale=Math.min(width,height)*(viewDim===3?.18:.14);
    if(viewDim===3){
      const cube=cubeVertices(1.45);
      const a=cube.map((v)=>project3(v,left,scale));
      cubeEdges.forEach(([i,j])=>line(a[i],a[j],C.text,1.6,.82));
      const b=cube.map((v)=>project3(v,right,scale));
      cubeEdges.forEach(([i,j])=>line(b[i],b[j],C.faint,1,.35));
      const face=cubeFaces[4].map((i)=>b[i]);
      poly(face,C.goldFill,C.gold,1,2.4);
    } else {
      const cube=cubeVertices(1.25);
      const whole=[...cube.map((v)=>[...v,-.65]),...cube.map((v)=>[...v,.65])];
      const a=whole.map((v)=>project4(v,left,scale));
      cubeEdges.forEach(([i,j])=>{line(a[i],a[j],C.source,1.1,.55);line(a[i+8],a[j+8],C.text,1.3,.82);});
      for(let i=0;i<8;i+=1) line(a[i],a[i+8],C.gold,1.8,.78);
      const faint=whole.map((v)=>project4(v,right,scale));
      cubeEdges.forEach(([i,j])=>{line(faint[i],faint[j],C.faint,1,.22);line(faint[i+8],faint[j+8],C.faint,1,.22);});
      for(let i=0;i<8;i+=1) line(faint[i],faint[i+8],C.faint,1,.18);
      const slice=cube.map((v)=>project4([v[0],v[1],v[2],0],right,scale));
      cubeEdges.forEach(([i,j])=>line(slice[i],slice[j],C.gold,2.2,.95));
    }
    text('PROJECTION',left[0],height*.18,C.gold,11);
    text('whole object contributes',left[0],height*.84,C.faint,10);
    text('SLICE',right[0],height*.18,C.gold,11);
    text('only one intersection appears',right[0],height*.84,C.faint,10);
    line([width*.5,height*.24],[width*.5,height*.80],'rgba(255,255,255,.07)',1,1);
  }

  function renderCanvas(){
    if(overlay.hidden) return;
    const [width,height]=fitCanvas();
    ctx.clearRect(0,0,width,height);
    const id=lessons[lessonIndex].id;
    if(id==='build') drawBuild(width,height);
    else if(id==='parts') drawParts(width,height);
    else if(id==='freedom') drawFreedom(width,height);
    else if(id==='slice') drawSlice(width,height);
    else drawProjection(width,height);
  }

  function addChip(label,value,current,onPick){
    const b=document.createElement('button');
    b.type='button';
    b.className='dimension-tutorial__chip'+(value===current?' is-active':'');
    b.textContent=label;
    b.addEventListener('click',()=>onPick(value));
    chipsEl.appendChild(b);
  }

  function addFact(head,body){
    const row=document.createElement('div');
    row.className='dimension-tutorial__fact';
    const strong=document.createElement('strong');
    strong.textContent=head;
    const span=document.createElement('span');
    span.textContent=body;
    row.append(strong,span);
    factsEl.appendChild(row);
  }

  function rangeRow(label,min,max,step,value,format,onChange){
    const row=document.createElement('label');
    row.className='dimension-tutorial__control-row';
    const name=document.createElement('span'); name.textContent=label;
    const input=document.createElement('input');
    input.type='range'; input.min=min; input.max=max; input.step=step; input.value=value;
    const out=document.createElement('span'); out.className='dimension-tutorial__value'; out.textContent=format(value);
    input.addEventListener('input',()=>{const v=Number(input.value);out.textContent=format(v);onChange(v);renderCanvas();});
    row.append(name,input,out);
    return row;
  }

  function buildLessonUi(){
    const lesson=lessons[lessonIndex];
    eyebrowEl.textContent=lesson.eyebrow;
    titleEl.textContent=lesson.title;
    copyEl.textContent=lesson.copy;
    controlsEl.replaceChildren(); chipsEl.replaceChildren(); factsEl.replaceChildren(); miniEl.textContent='';
    stepsEl.querySelectorAll('button').forEach((b,i)=>b.classList.toggle('is-active',i===lessonIndex));

    if(lesson.id==='build'){
      visualLabel.textContent=['0D → 1D','1D → 2D','2D → 3D','3D → 4D'][buildStage];
      ruleEl.innerHTML='<strong>Same operation, every time:</strong> duplicate the whole object along a new perpendicular axis and connect corresponding parts.';
      [['Point → line',0],['Line → plane',1],['Square → 3D',2],['Cube → 4D',3]].forEach(([label,value])=>addChip(label,value,buildStage,(v)=>{buildStage=v;progress=1;auto=false;buildLessonUi();renderCanvas();}));
      controlsEl.append(rangeRow('Build progress',0,1,.01,progress,(v)=>Math.round(v*100)+'%',(v)=>{progress=v;}));
      if(buildStage>0) controlsEl.append(rangeRow('New-axis length',.35,1.7,.01,extent,(v)=>v.toFixed(2)+'×',(v)=>{extent=v;}));
      const animate=document.createElement('button');
      animate.type='button';animate.className='dimension-tutorial__chip';animate.textContent=auto?'Pause':'Animate';
      animate.addEventListener('click',()=>{auto=!auto;autoDir=progress>.98?-1:1;buildLessonUi();if(auto)startAnimation();});
      chipsEl.appendChild(animate);
      miniEl.textContent='At equal lengths: line → square, square → cube, cube → tesseract. Change the new-axis length and you get a rectangle, rectangular prism, or 4D orthotope instead.';
    } else if(lesson.id==='parts'){
      visualLabel.textContent='CUBE → 4D';
      ruleEl.innerHTML='<strong>Every sub-object participates.</strong> The dimensional upgrade is applied to the complete structure, not merely to its outer contour.';
      [['Everything','everything'],['Vertices','vertices'],['Edges','edges'],['Faces','faces'],['Whole cube','whole']].forEach(([label,value])=>addChip(label,value,partMode,(v)=>{partMode=v;buildLessonUi();renderCanvas();}));
      addFact('8 → 8','vertices trace eight new W-edges');
      addFact('12 → 12','edges sweep twelve square faces');
      addFact('6 → 6','square faces sweep six cubic cells');
      addFact('+ 2','the two end cubes remain: a regular tesseract has eight cubic cells');
      miniEl.textContent='A regular tesseract has 16 vertices, 32 edges, 24 square faces and 8 cubic cells.';
    } else if(lesson.id==='freedom'){
      visualLabel.textContent=freedomDim===3?'SQUARE → 3D':'CUBE → 4D';
      ruleEl.innerHTML='<strong>The regular shape is only one parameter choice.</strong> The new dimension can have another size, and the lower-dimensional cross-section can scale or rotate as it moves.';
      addChip('Square → 3D',3,freedomDim,(v)=>{freedomDim=v;buildLessonUi();renderCanvas();});
      addChip('Cube → 4D',4,freedomDim,(v)=>{freedomDim=v;buildLessonUi();renderCanvas();});
      [['Straight','straight'],['Taper','taper'],['Twist','twist']].forEach(([label,value])=>addChip(label,value,deformation,(v)=>{deformation=v;buildLessonUi();renderCanvas();}));
      controlsEl.append(rangeRow('New-axis length',.35,1.7,.01,extent,(v)=>v.toFixed(2)+'×',(v)=>{extent=v;}));
      miniEl.textContent=freedomDim===3?'With Straight + 1.00×, the square sweeps a cube. Other settings are equally valid 3D continuations.':'With Straight + 1.00×, the cube gives the familiar regular tesseract construction. Other W-continuations are possible.';
    } else if(lesson.id==='slice'){
      visualLabel.textContent=sliceDim===3?'SQUARE SLICE IN 3D':'CUBE SLICE IN 4D';
      ruleEl.innerHTML='<strong>A slice tells you what exists here, not what exists elsewhere.</strong> Infinitely many different higher-dimensional objects can share the same slice.';
      addChip('Square slice',3,sliceDim,(v)=>{sliceDim=v;buildLessonUi();renderCanvas();});
      addChip('Cube slice',4,sliceDim,(v)=>{sliceDim=v;buildLessonUi();renderCanvas();});
      [['Straight','straight'],['Tapered','taper'],['Twisted','twist']].forEach(([label,value])=>addChip(label,value,deformation,(v)=>{deformation=v;buildLessonUi();renderCanvas();}));
      miniEl.textContent=sliceDim===3?'The highlighted square is identical at the chosen plane even though the surrounding 3D body changes.':'The highlighted cube is identical at W = 0 even though the surrounding 4D continuation changes.';
    } else {
      visualLabel.textContent=viewDim===3?'3D → 2D':'4D → 3D → SCREEN';
      ruleEl.innerHTML='<strong>Projection:</strong> the whole object contributes to the image. <strong>Slice:</strong> only the intersection at one coordinate value is retained.';
      addChip('3D example',3,viewDim,(v)=>{viewDim=v;buildLessonUi();renderCanvas();});
      addChip('4D example',4,viewDim,(v)=>{viewDim=v;buildLessonUi();renderCanvas();});
      addFact('Projection','shows global relationships but overlaps information');
      addFact('Slice','is locally exact but hides everything outside that slice');
      miniEl.textContent='Hypermandala primarily uses projection: you are seeing a lower-dimensional image of the whole higher-dimensional construction, not a literal 4D object on the screen.';
    }

    prevButton.disabled=lessonIndex===0;
    nextButton.textContent=lessonIndex===lessons.length-1?'Explore':'Next';
  }

  function buildSteps(){
    stepsEl.replaceChildren();
    lessons.forEach((lesson,i)=>{
      const b=document.createElement('button');
      b.type='button';b.className='dimension-tutorial__step'+(i===lessonIndex?' is-active':'');b.textContent=`${i+1}. ${lesson.short}`;
      b.addEventListener('click',()=>{lessonIndex=i;auto=false;buildLessonUi();renderCanvas();});
      stepsEl.appendChild(b);
    });
  }

  function openTutorial(){
    overlay.hidden=false;
    document.body.style.overflow='hidden';
    buildSteps();buildLessonUi();requestAnimationFrame(renderCanvas);closeButton.focus();
  }

  function closeTutorial(){
    overlay.hidden=true;auto=false;cancelAnimationFrame(raf);document.body.style.overflow='';launch.focus();
  }

  function startAnimation(){
    cancelAnimationFrame(raf);
    let last=performance.now();
    const tick=(now)=>{
      if(!auto||overlay.hidden) return;
      const dt=Math.min(.04,(now-last)/1000);last=now;
      progress+=autoDir*dt*.46;
      if(progress>=1){progress=1;autoDir=-1;}if(progress<=0){progress=0;autoDir=1;}
      const first=controlsEl.querySelector('input[type="range"]');
      const out=controlsEl.querySelector('.dimension-tutorial__value');
      if(first) first.value=progress;if(out) out.textContent=Math.round(progress*100)+'%';
      renderCanvas();raf=requestAnimationFrame(tick);
    };
    if(!reduceMotion) raf=requestAnimationFrame(tick);
  }

  launch.addEventListener('click',openTutorial);
  closeButton.addEventListener('click',closeTutorial);
  overlay.addEventListener('click',(e)=>{if(e.target===overlay)closeTutorial();});
  prevButton.addEventListener('click',()=>{if(lessonIndex>0){lessonIndex-=1;auto=false;buildLessonUi();renderCanvas();}});
  nextButton.addEventListener('click',()=>{
    if(lessonIndex<lessons.length-1){lessonIndex+=1;auto=false;buildLessonUi();renderCanvas();return;}
    closeTutorial();
    document.querySelector('[data-preset="square"]')?.click();
    document.querySelector('[data-dimension="4"]')?.click();
  });
  window.addEventListener('resize',()=>{if(!overlay.hidden)renderCanvas();},{passive:true});
  window.addEventListener('keydown',(e)=>{
    if(overlay.hidden) return;
    if(e.key==='Escape') closeTutorial();
    if(e.key==='ArrowRight'&&lessonIndex<lessons.length-1){lessonIndex+=1;auto=false;buildLessonUi();renderCanvas();}
    if(e.key==='ArrowLeft'&&lessonIndex>0){lessonIndex-=1;auto=false;buildLessonUi();renderCanvas();}
  });
})();
