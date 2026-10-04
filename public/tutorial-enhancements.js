(() => {
  'use strict';

  const modesEl = document.querySelector('.learn4d-modes');
  const baseCanvas = document.querySelector('.learn4d-stage');
  const caption = document.querySelector('.learn4d-caption');
  const hud = document.querySelector('.learn4d-hud');
  const timeline = document.querySelector('.learn4d-timeline');
  const markers = document.querySelector('.learn4d-markers');
  if (!modesEl || !baseCanvas || !caption || !hud || !timeline || !markers) return;

  const GOLD = '#d8b662';
  const WHITE = 'rgba(244,246,249,.92)';
  const BLUE = '#6ca8ff';

  const style = document.createElement('style');
  style.textContent = `
    .learn4d-enhanced-stage {
      position: fixed;
      inset: 0;
      z-index: 8;
      width: 100vw;
      height: 100dvh;
      pointer-events: none;
      opacity: 0;
      transition: opacity 140ms ease;
    }
    body.learn4d-active.learn4d-enhanced .learn4d-enhanced-stage { opacity: 1; }
    body.learn4d-active.learn4d-enhanced .learn4d-stage:not(.learn4d-enhanced-stage) { opacity: 0 !important; }
  `;
  document.head.appendChild(style);

  const canvas = document.createElement('canvas');
  canvas.className = 'learn4d-enhanced-stage';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  let mode = null;
  let raf = 0;

  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => { const x = clamp(t); return x * x * (3 - 2 * x); };

  function fitCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
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

  function line(a, b, color = WHITE, width = 1.5, alpha = 1) {
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

  function dot(p, r = 3.2, color = WHITE, alpha = 1) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(p[0], p[1], r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function basis(width, height) {
    const s = Math.min(width, height) * .285;
    return {
      center: [width * .5, height * .445],
      vectors: [[s,0],[0,s],[s*.34,-s*.28],[-s*.27,-s*.22]],
    };
  }

  function project(c, width, height) {
    const { center, vectors } = basis(width, height);
    let x = center[0];
    let y = center[1];
    for (let i = 0; i < 4; i += 1) {
      x += (c[i] - .5) * vectors[i][0];
      y += (c[i] - .5) * vectors[i][1];
    }
    return [x, y];
  }

  function vertices(dim, fixedAxis = null, fixedValue = null) {
    const axes = [];
    for (let i = 0; i < dim; i += 1) if (i !== fixedAxis) axes.push(i);
    const out = [];
    const count = 1 << axes.length;
    for (let mask = 0; mask < count; mask += 1) {
      const c = [.5,.5,.5,.5];
      const bits = [0,0,0,0];
      if (fixedAxis !== null) c[fixedAxis] = fixedValue;
      axes.forEach((axis, k) => {
        const bit = (mask >> k) & 1;
        bits[axis] = bit;
        c[axis] = bit;
      });
      out.push({ c, bits });
    }
    return { out, axes };
  }

  function pairs(vs, axes) {
    const out = [];
    for (let i = 0; i < vs.length; i += 1) {
      for (const axis of axes) {
        const j = vs.findIndex((v) => axes.every((a) => v.bits[a] === (a === axis ? 1 - vs[i].bits[a] : vs[i].bits[a])));
        if (j > i) out.push([i,j]);
      }
    }
    return out;
  }

  function drawCopy(dim, axis, value, width, height, color, alpha, lineWidth = 1.4) {
    if (dim === 0) {
      const c = [.5,.5,.5,.5];
      c[axis] = value;
      dot(project(c,width,height),4,color,alpha);
      return [c];
    }
    const { out, axes } = vertices(dim, axis, value);
    const pts = out.map((v) => project(v.c,width,height));
    pairs(out,axes).forEach(([a,b]) => line(pts[a],pts[b],color,lineWidth,alpha));
    pts.forEach((p) => dot(p,2.5,color,alpha*.8));
    return out.map((v) => v.c);
  }

  function stageInfo(t) {
    const x = clamp(t) * 4;
    const stage = Math.min(3, Math.floor(x));
    return { stage, local: ease(x >= 4 ? 1 : x - stage) };
  }

  function drawEmergence(width, height, t) {
    const { stage, local } = stageInfo(t);
    const axis = stage;
    const sep = .5 * local;
    const a = drawCopy(stage,axis,.5-sep,width,height,WHITE,.52,1.25);
    const b = drawCopy(stage,axis,.5+sep,width,height,GOLD,.96,1.7);
    const grow = ease(clamp((local - .10) / .90));
    for (let i = 0; i < Math.min(a.length,b.length); i += 1) {
      const end = b[i].slice();
      end[axis] = lerp(a[i][axis],b[i][axis],grow);
      line(project(a[i],width,height),project(end,width,height),GOLD,2,.84);
    }
    const source = ['points','lines','squares','cubes'];
    const result = ['line','square','cube','tesseract'];
    caption.textContent = `regular case · two ${source[stage]} + corresponding connections → ${result[stage]}`;
  }

  function drawWireExtent(width,height,extents,color=WHITE,alpha=.22,lineWidth=1) {
    const axes = extents.map((e,i)=>e > .0001 ? i : -1).filter((i)=>i>=0);
    const count = 1 << axes.length;
    const vs=[];
    for(let mask=0;mask<count;mask+=1){
      const c=[0,0,0,0];
      const bits=[0,0,0,0];
      axes.forEach((axis,k)=>{
        const bit=(mask>>k)&1;
        bits[axis]=bit;
        c[axis]=bit*extents[axis];
      });
      vs.push({c,bits});
    }
    const pts=vs.map((v)=>project(v.c,width,height));
    pairs(vs,axes).forEach(([a,b])=>line(pts[a],pts[b],color,lineWidth,alpha));
  }

  function drawSlice(dim, axis, value, width, height, color, alpha, lineWidth) {
    const { out, axes } = vertices(dim, axis, value);
    const pts = out.map((v)=>project(v.c,width,height));
    pairs(out,axes).forEach(([a,b])=>line(pts[a],pts[b],color,lineWidth,alpha));
  }

  function drawContinuum(width,height,t) {
    const { stage, local } = stageInfo(t);
    const scan = local;
    const samples = stage === 0 ? 120 : stage === 1 ? 52 : stage === 2 ? 28 : 20;

    if (stage === 0) {
      const a = project([0,0,0,0],width,height);
      const b = project([1,0,0,0],width,height);
      line(a,b,WHITE,1.1,.18);
      for(let i=0;i<samples;i+=1){
        const u=i/(samples-1);
        const p=project([u,0,0,0],width,height);
        const trail = u <= scan ? .16 + .40 * (1 - Math.abs(scan-u)) : .035;
        dot(p,i%12===0?2.1:1.05,u<=scan?BLUE:WHITE,trail);
      }
      dot(project([scan,0,0,0],width,height),4.7,GOLD,.98);
      caption.textContent='line = infinitely many points · the glowing point sweeps along it';
      return;
    }

    if (stage === 1) {
      drawWireExtent(width,height,[1,scan,0,0],WHITE,.24,1.1);
      for(let i=0;i<samples;i+=1){
        const u=(i/(samples-1))*scan;
        line(project([0,u,0,0],width,height),project([1,u,0,0],width,height),BLUE,.65,.10 + .10*(u/Math.max(scan,.001)));
      }
      line(project([0,scan,0,0],width,height),project([1,scan,0,0],width,height),GOLD,2.7,.98);
      caption.textContent='square = infinitely many line slices · the glowing line sweeps the new direction';
      return;
    }

    if (stage === 2) {
      drawWireExtent(width,height,[1,1,scan,0],WHITE,.20,1);
      for(let i=0;i<samples;i+=1){
        const u=(i/(samples-1))*scan;
        drawSlice(2,2,u,width,height,BLUE,.08 + .08*(u/Math.max(scan,.001)),.65);
      }
      drawSlice(2,2,scan,width,height,GOLD,.98,2.2);
      caption.textContent='cube = infinitely many square slices · the glowing square sweeps through depth';
      return;
    }

    drawWireExtent(width,height,[1,1,1,scan],WHITE,.17,.9);
    for(let i=0;i<samples;i+=1){
      const u=(i/(samples-1))*scan;
      drawSlice(3,3,u,width,height,BLUE,.055 + .065*(u/Math.max(scan,.001)),.58);
    }
    drawSlice(3,3,scan,width,height,GOLD,.98,2.0);
    caption.textContent='tesseract = infinitely many cubic slices · the glowing cube sweeps through W';
  }

  function setEnhanced(next) {
    mode = next;
    document.body.classList.toggle('learn4d-enhanced', Boolean(mode));
    modesEl.querySelectorAll('.learn4d-mode').forEach((b) => b.classList.toggle('is-active', b.dataset.mode === mode));
    if (mode === 'emergence') {
      markers.innerHTML = '<span>0D</span><span>1D</span><span>2D</span><span>3D</span><span>4D</span>';
    }
  }

  const emergence = document.createElement('button');
  emergence.type = 'button';
  emergence.className = 'learn4d-mode';
  emergence.dataset.mode = 'emergence';
  emergence.textContent = 'Emergence';
  emergence.addEventListener('click', () => {
    const build = modesEl.querySelector('[data-mode="build"]');
    build?.click();
    setEnhanced('emergence');
  });

  const continuumButton = modesEl.querySelector('[data-mode="continuum"]');
  if (continuumButton) modesEl.insertBefore(emergence, continuumButton);
  else modesEl.appendChild(emergence);

  modesEl.querySelectorAll('.learn4d-mode').forEach((button) => {
    if (button === emergence) return;
    button.addEventListener('click', () => {
      if (button.dataset.mode === 'continuum') setEnhanced('continum');
      else setEnhanced(null);
    });
  });

  function frame() {
    if (document.body.classList.contains('learn4d-active') && mode) {
      const { width, height } = fitCanvas();
      ctx.clearRect(0,0,width,height);
      const t = Number(timeline.value) || 0;
      if (mode === 'emergence') drawEmergence(width,height,t);
      else drawContinuum(width,height,t);
    } else {
      ctx.clearRect(0,0,canvas.width,canvas.height);
    }
    raf = requestAnimationFrame(frame);
  }

  raf = requestAnimationFrame(frame);
})();
