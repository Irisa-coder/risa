/* Ambient triangle field — minimal, irregular, cursor-responsive. */
(() => {
  'use strict';
  const canvas = document.getElementById('triangleBackground');
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pointer = { x: -10000, y: -10000, active: false };
  const TAU = Math.PI * 2;
  let shapes = [], width = 0, height = 0, ratio = 1, raf = 0, last = 0;

  const layout = [
    { x: .010, y: .070, size: 1, vertices: [[-18,-12],[90,60],[66,67]], phase: .3 },
    { x: .953, y: .287, size: .86, vertices: [[-28,-38],[92,-4],[-41,63]], phase: 1.4 },
    { x: .985, y: .675, size: .96, vertices: [[-98,-35],[64,-15],[-77,48]], phase: 2.2 },
    { x: .208, y: .960, size: .82, vertices: [[-44,-50],[93,-43],[-7,37]], phase: 3.8 },
    { x: .792, y: .085, size: .61, vertices: [[-36,11],[47,-32],[33,44]], phase: 4.5 },
    { x: .615, y: .900, size: .67, vertices: [[-49,-29],[45,-18],[-2,53]], phase: 5.1 }
  ];

  function setSize() {
    width = window.innerWidth;
    height = window.innerHeight;
    ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    const scale = Math.max(.75, Math.min(1.17, width / 1160));
    shapes = layout.filter((_, i) => width > 650 || [0,1,2,3].includes(i)).map(s => ({
      points: s.vertices.map(([vx,vy], j) => {
        const x = width * s.x + vx * s.size * scale;
        const y = height * s.y + vy * s.size * scale;
        return { x, y, rx:x, ry:y, vx:0, vy:0, phase:s.phase + j*2.14 };
      })
    }));
    render(performance.now(), 1);
  }

  function drawVertex(x, y, a) {
    const r = 2.65;
    ctx.beginPath();
    ctx.moveTo(x+Math.cos(a)*r,y+Math.sin(a)*r);
    ctx.lineTo(x+Math.cos(a+TAU/3)*r,y+Math.sin(a+TAU/3)*r);
    ctx.lineTo(x+Math.cos(a+2*TAU/3)*r,y+Math.sin(a+2*TAU/3)*r);
    ctx.closePath();
    ctx.fill();
  }

  function render(now, step) {
    ctx.clearRect(0,0,width,height);
    const t = now / 1000;
    for (const s of shapes) {
      for (const p of s.points) {
        const idleX = Math.sin(t*.49+p.phase)*2.6+Math.sin(t*.31+p.phase*1.9)*1.8;
        const idleY = Math.cos(t*.43+p.phase*1.3)*2.5;
        let pushX=0,pushY=0;
        if (pointer.active) {
          const dx=p.x-pointer.x,dy=p.y-pointer.y;
          const distance=Math.hypot(dx,dy),radius=175;
          if (distance<radius) {
            const force=Math.pow(1-distance/radius,1.65)*40;
            const norm=distance>.01?distance:1;
            pushX=dx/norm*force;
            pushY=dy/norm*force;
          }
        }
        const tx=p.x+idleX+pushX,ty=p.y+idleY+pushY;
        if (reduceMotion) {p.rx=tx;p.ry=ty;}
        else {
          p.vx=(p.vx+(tx-p.rx)*.030*step)*Math.pow(.79,step);
          p.vy=(p.vy+(ty-p.ry)*.030*step)*Math.pow(.79,step);
          p.rx+=p.vx*step;
          p.ry+=p.vy*step;
        }
      }
      const [a,b,c]=s.points;
      ctx.lineWidth=.85;
      ctx.strokeStyle='rgba(153,132,163,.21)';
      ctx.beginPath();
      ctx.moveTo(a.rx,a.ry);
      ctx.lineTo(b.rx,b.ry);
      ctx.lineTo(c.rx,c.ry);
      ctx.closePath();
      ctx.stroke();
      ctx.fillStyle='rgba(153,125,163,.43)';
      for (const p of s.points) drawVertex(p.rx,p.ry,p.phase+t*.075);
    }
  }

  function frame(now) {
    const step=Math.min(2,(now-(last||now))/16.667||1);
    last=now;
    render(now,step);
    raf=requestAnimationFrame(frame);
  }
  window.addEventListener('pointermove', e=>{
    if(e.pointerType==='touch') return;
    pointer.x=e.clientX;
    pointer.y=e.clientY;
    pointer.active=true;
  },{passive:true});
  const leave=()=>{pointer.active=false;pointer.x=pointer.y=-10000;};
  window.addEventListener('pointerout',e=>{if(!e.relatedTarget)leave();});
  window.addEventListener('blur',leave);
  window.addEventListener('resize',setSize,{passive:true});
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){if(raf)cancelAnimationFrame(raf);raf=0;}
    else if(!reduceMotion&&!raf){last=0;raf=requestAnimationFrame(frame);}
  });
  setSize();
  if(!reduceMotion)raf=requestAnimationFrame(frame);
})();
