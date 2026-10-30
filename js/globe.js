/* Interactive digital globe; local geometry and no external runtime. */
(() => {
  const continents = [[[-168, 70], [-145, 70], [-130, 55], [-122, 48], [-125, 40], [-118, 32], [-108, 25], [-96, 18], [-86, 20], [-82, 26], [-80, 32], [-70, 44], [-60, 50], [-52, 60], [-65, 68], [-88, 72], [-110, 70], [-130, 73]], [[-80, 12], [-68, 10], [-58, 5], [-50, -2], [-35, -8], [-40, -22], [-50, -30], [-57, -40], [-67, -55], [-73, -42], [-72, -25], [-78, -10]], [[-52, 60], [-42, 60], [-20, 75], [-28, 83], [-48, 82], [-60, 72]], [[-18, 35], [0, 37], [10, 34], [25, 32], [34, 30], [43, 12], [50, 10], [42, -12], [35, -25], [20, -35], [12, -25], [8, -5], [-8, 5], [-17, 16]], [[-10, 36], [-10, 44], [-2, 50], [8, 55], [20, 70], [35, 70], [30, 58], [45, 55], [60, 60], [80, 72], [110, 72], [140, 65], [170, 60], [160, 48], [140, 40], [130, 30], [120, 20], [108, 10], [100, 0], [95, 20], [80, 8], [70, 25], [55, 24], [45, 12], [35, 30], [25, 40], [10, 44], [0, 40]], [[112, -12], [128, -10], [140, -16], [151, -25], [146, -38], [132, -34], [116, -35], [112, -22]], [[47, -13], [51, -17], [47, -26], [44, -22]], [[130, 32], [142, 44], [145, 40], [138, 33]], [[95, 5], [105, -5], [120, -8], [135, -5], [130, -10], [110, -10]], [[166, -35], [177, -39], [172, -46], [166, -44]]];
  const map = document.querySelector('#map'), canvas = document.querySelector('#globeCanvas');
  const ctx = canvas.getContext('2d'), motion = matchMedia('(prefers-reduced-motion: reduce)');
  const locations = { us: [29.4, -95.4], th: [13.74, 100.56], au: [-37.81, 144.96] };
  const controls = document.createElement('div'); controls.className = 'globe-offices'; map.after(controls);
  let size = 0, yaw = 65, target = null, pausedUntil = 0, dragging = null, visible = false, raf = 0, last = 0;
  const rad = Math.PI / 180;
  function project(lat, lon, elevation = 1) {
    const p = lat * rad, l = (lon - yaw) * rad;
    return { x: size * .5 + Math.cos(p) * Math.sin(l) * size * .4 * elevation,
      y: size * .46 - Math.sin(p) * size * .4 * elevation, z: Math.cos(p) * Math.cos(l) };
  }
  function inside(lon, lat, polygon) {
    let yes = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const [x,y] = polygon[i], [a,b] = polygon[j];
      if (((y>lat)!==(b>lat)) && lon < (a-x)*(lat-y)/(b-y)+x) yes = !yes;
    }
    return yes;
  }
  const dots = [];
  for (let lat=-55;lat<=80;lat+=4) for(let lon=-180;lon<180;lon+=4) {
    if(continents.some(p=>inside(lon,lat,p))) dots.push([lat,lon]);
  }
  function line(points, color, width = .7) {
    ctx.beginPath(); let active = false;
    for (const p of points) {
      if(p.z < 0) { active = false; continue; }
      if(active) ctx.lineTo(p.x,p.y); else ctx.moveTo(p.x,p.y);
      active = true;
    }
    ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke();
  }
  function updateControls() {
    controls.replaceChildren(...Object.keys(locations).map(id=>{
      const button = document.createElement('button'); button.type='button'; button.dataset.globeOffice=id;
      button.textContent=map.querySelector(`.pin[data-office="${id}"]`)?.getAttribute('aria-label') || id;
      return button;
    }));
  }
  function draw() {
    ctx.clearRect(0,0,size,size);
    const cx=size*.5, cy=size*.46, r=size*.4;
    const fill=ctx.createRadialGradient(cx-r*.35,cy-r*.4,r*.1,cx,cy,r);
    fill.addColorStop(0,'#123f55'); fill.addColorStop(.65,'#071d30'); fill.addColorStop(1,'#020913');
    ctx.shadowColor='#25c7e5'; ctx.shadowBlur=18;
    ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fillStyle=fill; ctx.fill(); ctx.shadowBlur=0;
    ctx.strokeStyle='rgba(68,216,239,.7)';ctx.lineWidth=1.2;ctx.stroke();
    for(let lat=-60;lat<=60;lat+=30) {
      const points=[];for(let lon=-180;lon<=180;lon+=3) points.push(project(lat,lon));
      line(points,'rgba(58,169,205,.23)');
    }
    for(let lon=-180;lon<180;lon+=30) {
      const points=[];for(let lat=-90;lat<=90;lat+=3) points.push(project(lat,lon));
      line(points,'rgba(58,169,205,.23)');
    }
    for(const polygon of continents) {
      const points=[];
      for(let i=0;i<polygon.length;i++) {
        const a=polygon[i],b=polygon[(i+1)%polygon.length];
        for(let k=0;k<=8;k++) points.push(project(a[1]+(b[1]-a[1])*k/8,a[0]+(b[0]-a[0])*k/8));
      }
      line(points,'rgba(103,221,234,.64)',.9);
    }
    for(const [lat,lon] of dots) {
      const p=project(lat,lon);if(p.z<0)continue;
      ctx.fillStyle=`rgba(82,207,225,${.3+p.z*.5})`;ctx.beginPath();ctx.arc(p.x,p.y,Math.max(.65,size*.0024),0,Math.PI*2);ctx.fill();
    }
    const ids=Object.keys(locations);
    ids.forEach(id=>{
      const p=project(...locations[id]), pin=map.querySelector(`.pin[data-office="${id}"]`);
      if(!pin)return;
      pin.style.setProperty('--x',`${p.x/size*100}%`);pin.style.setProperty('--y',`${p.y/size*100}%`);
      pin.hidden=p.z < .03; pin.tabIndex=p.z < .03 ? -1 : 0;
      const button=controls.querySelector(`[data-globe-office="${id}"]`);
      button?.setAttribute('aria-pressed',pin.getAttribute('aria-pressed'));
    });
    // Draw moving links in the same globe coordinates as the office markers.
    const arcPaths=[];
    for(const [from,to] of [['us','th'],['th','au']]) {
      const a=locations[from],b=locations[to];let path='',started=false;
      for(let i=0;i<=40;i++) {
        const t=i/40;
        const vec=([lat,lon])=>[Math.cos(lat*rad)*Math.cos(lon*rad),Math.sin(lat*rad),Math.cos(lat*rad)*Math.sin(lon*rad)];
        const av=vec(a),bv=vec(b),v=av.map((n,j)=>n*(1-t)+bv[j]*t),len=Math.hypot(...v);
        const lat=Math.asin(v[1]/len)/rad,lon=Math.atan2(v[2],v[0])/rad,p=project(lat,lon,1+.08*Math.sin(Math.PI*t));
        if(p.z<0){started=false;continue;}
        path+=(started?'L':'M')+p.x/size*100+','+p.y/size*100;started=true;
      }
      arcPaths.push(`<path d="${path}"/>`);
    }
    document.querySelector('#mapArcs').innerHTML=arcPaths.join('');
  }
  function frame(now) {
    if(!visible||document.hidden)return;
    const dt=Math.min(60,now-last||33);last=now;
    if(target!==null) {
      const delta=((target-yaw+540)%360)-180;
      yaw+=delta*.13;
      if(Math.abs(delta)<.1){yaw=target;target=null;}
    } else if(!motion.matches&&!dragging&&now>pausedUntil&&!(matchMedia('(hover: hover)').matches && map.matches(':hover'))) yaw+=dt*.0035;
    yaw = ((yaw + 180) % 360 + 360) % 360 - 180;
    draw();
    if(!motion.matches||target!==null)raf=requestAnimationFrame(frame);
  }
  function sync() {cancelAnimationFrame(raf);last=0;if(visible&&!document.hidden)raf=requestAnimationFrame(frame);}
  new ResizeObserver(()=>{size=map.clientWidth;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=size*dpr;canvas.height=size*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);draw();}).observe(map);
  new IntersectionObserver(e=>{visible=e[0].isIntersecting;sync();}).observe(map);
  new MutationObserver(()=>{updateControls();draw();}).observe(map,{childList:true});
  function selectOffice(e) {
    const button=e.target.closest('[data-globe-office]'),pin=e.target.closest('.pin');
    const id=button?.dataset.globeOffice||pin?.dataset.office;
    if(!id)return;
    if(button)map.querySelector(`.pin[data-office="${id}"]`)?.click();
    pausedUntil=performance.now()+8000;
    if(motion.matches){yaw=locations[id][1];target=null;draw();}
    else {target=locations[id][1];sync();}
  }
  map.addEventListener('click',selectOffice);
  controls.addEventListener('click',selectOffice);
  map.addEventListener('pointerdown',e=>{if(e.target.closest('button')||e.button!==0)return;dragging={x:e.clientX,y:e.clientY,yaw,locked:false};});
  map.addEventListener('pointermove',e=>{
    if(!dragging)return;
    const dx=e.clientX-dragging.x,dy=e.clientY-dragging.y;
    if(!dragging.locked){if(Math.abs(dy)>Math.abs(dx)&&Math.abs(dy)>8){dragging=null;return;}if(Math.abs(dx)<8)return;dragging.locked=true;map.setPointerCapture(e.pointerId);}
    target=null;yaw=dragging.yaw-dx*.4;pausedUntil=performance.now()+5000;draw();
  });
  const release=()=>{dragging=null;sync();};
  map.addEventListener('pointerup',release);map.addEventListener('pointercancel',release);
  document.addEventListener('visibilitychange',sync);motion.addEventListener('change',sync);
  updateControls();
})();
