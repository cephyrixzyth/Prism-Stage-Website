(() => {
  const canvas = document.querySelector('#scene');
  const ctx = canvas.getContext('2d', { alpha: false });
  const world = document.querySelector('#world');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const venues = [
    { id:'continental', name:'The Continental', short:'CONTINENTAL', era:'SOUTH CONGRESS · SINCE 1955', tag:'A little room. A bottomless night.', description:'An intimate South Congress landmark gets folded into a pocket-sized light machine. Roots, rockabilly and a ceiling that forgot about the sky.', area:'SOUTH CONGRESS', color:'#ff5f49', kind:'bar' },
    { id:'antones', name:'Antone’s', short:'ANTONE’S', era:'DOWNTOWN BLUES · SINCE 1975', tag:'Every wall has a blue note.', description:'Clifford Antone’s blues room becomes a slow electric tide: deep indigo, hot amber, and a backbeat that leaves a trace in the air.', area:'DOWNTOWN', color:'#41bbff', kind:'blues' },
    { id:'mohawk', name:'Mohawk', short:'MOHAWK', era:'RED RIVER · INDOOR / OUTDOOR', tag:'Two stages. Four million stars.', description:'Red River goes vertical. Brick, balconies, an outside stage and a night sky running a little too much voltage.', area:'RED RIVER', color:'#d5ff36', kind:'brick' },
    { id:'stubbs', name:'Stubb’s', short:'STUBB’S', era:'RED RIVER · THE OUTDOOR STAGE', tag:'Smoke signals from the future.', description:'An outdoor Austin classic turns into a backyard-sized aurora. Canopy lights, big sky, low frequencies, absolutely no curfew in this dimension.', area:'RED RIVER', color:'#ffad44', kind:'outdoor' },
    { id:'acl', name:'ACL Live at the Moody Theater', short:'ACL LIVE', era:'DOWNTOWN · HOME OF AUSTIN CITY LIMITS', tag:'The whole room is the instrument.', description:'The Moody Theater becomes a precision light chamber, where the audience, stage and broadcast rig all glow as one machine.', area:'DOWNTOWN', color:'#bc91ff', kind:'theater' }
  ];
  let selected = 0, inside = false, streetMode = false, beforeInterior = 'aerial';
  let width = 0, height = 0, scale = 1, frame = 0, ripple = null;
  let vehicle = { x: .45, y: .67 }, pointer = { x: -10, y: -10 }, dpr = 1;
  const street = { pos: 0, depth: .78, step: 0 };
  const keys = new Set();
  const buttons = document.querySelector('#route-stops');
  const el = id => document.getElementById(id);

  venues.forEach((venue, index) => {
    const button = document.createElement('button');
    button.className = 'route-stop';
    button.type = 'button';
    button.dataset.index = index;
    button.style.setProperty('--stop', venue.color);
    button.setAttribute('aria-pressed', 'false');
    button.setAttribute('aria-label', `Stop ${index + 1}: ${venue.name}, ${venue.area}`);
    button.innerHTML = `<span class="stop-no">0${index + 1}</span><span class="stop-name">${venue.short}</span><span class="stop-neighborhood">${venue.area}</span>`;
    button.addEventListener('click', () => selectVenue(index));
    buttons.append(button);
  });

  function selectVenue(index) {
    selected = (index + venues.length) % venues.length;
    const venue = venues[selected];
    document.querySelectorAll('.route-stop').forEach((button, i) => button.setAttribute('aria-pressed', String(i === selected)));
    el('venue-count').textContent = `STOP 0${selected + 1} / 0${venues.length}`;
    el('venue-era').textContent = venue.era;
    el('venue-name').innerHTML = venue.id === 'continental' ? 'THE<br>CONTINENTAL' : venue.id === 'acl' ? 'ACL LIVE<br>AT THE MOODY' : venue.name.toUpperCase();
    el('venue-tag').textContent = venue.tag;
    el('venue-description').textContent = venue.description;
    el('scene-label-name').textContent = venue.name.toUpperCase();
    document.querySelector('.venue-readout').style.setProperty('--venue', venue.color);
    world.style.setProperty('--venue', venue.color);
    document.querySelectorAll('.readout-pulse,.venue-count').forEach(node => node.style.color = venue.color);
    el('mode-chip').innerHTML = `<i></i> ${inside ? 'INSIDE THE VENUE' : streetMode ? 'STREET LEVEL' : 'AERIAL MAP'}`;
    const p = document.querySelector('#mode-chip i');
    p.style.background = venue.color; p.style.boxShadow = `0 0 12px ${venue.color}`;
    const point = locationOf(selected);
    vehicle.targetX = point.x; vehicle.targetY = point.y;
    street.pos = selected;
    el('map-coordinate').innerHTML = `30° ${String(15 + selected).padStart(2,'0')}′ 2″ N<br>97° ${selected % 2 ? '44' : '45'}′ ${35 + selected * 3}″ W<br><span>SCHEMATIC / NOT TO SCALE</span>`;
    el('street-venue-name').textContent = venue.id === 'acl' ? 'ACL LIVE / THE MOODY' : venue.short;
    el('street-area').textContent = venue.era;
    el('street-instructions').textContent = venue.kind === 'outdoor' ? 'Follow the string lights. The stage is hiding under the Texas sky.' : 'Walk the block. Find the hand-painted sign and the light leaking under the door.';
  }

  function resize() {
    const rect = world.getBoundingClientRect();
    dpr = Math.min(devicePixelRatio || 1, 2);
    width = rect.width; height = rect.height;
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    scale = Math.min(width, height);
  }
  new ResizeObserver(resize).observe(world); resize();

  function locationOf(i) {
    const w = width < 620;
    return [
      {x:w?.36:.42,y:w?.57:.67}, {x:w?.63:.51,y:w?.39:.48},
      {x:w?.66:.70,y:w?.30:.37}, {x:w?.80:.78,y:w?.48:.51},
      {x:w?.30:.27,y:w?.37:.49}
    ][i];
  }
  const X = n => n * width, Y = n => n * height;
  const glow = (x,y,r,color,alpha=.4) => { const g=ctx.createRadialGradient(x,y,1,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'transparent');ctx.globalAlpha=alpha;ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);ctx.globalAlpha=1; };
  function path(points, color, line, dash=[]) { ctx.beginPath(); points.forEach((p,i)=>i?ctx.lineTo(X(p[0]),Y(p[1])):ctx.moveTo(X(p[0]),Y(p[1])));ctx.strokeStyle=color;ctx.lineWidth=line;ctx.setLineDash(dash);ctx.stroke();ctx.setLineDash([]); }
  function text(str,x,y,size,color,align='center',font='Mono,Consolas,monospace') { ctx.fillStyle=color;ctx.textAlign=align;ctx.textBaseline='middle';ctx.font=`${size}px ${font}`;ctx.fillText(str,x,y); }
  function rounded(x,y,w,h,r,fill,stroke) { ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.stroke()} }

  function drawRoute(t) {
    const night=ctx.createLinearGradient(0,0,0,height);night.addColorStop(0,'#09080d');night.addColorStop(.55,'#14121c');night.addColorStop(1,'#0a1117');ctx.fillStyle=night;ctx.fillRect(0,0,width,height);
    // Distant skyline and the warm grain of a city that refuses bedtime.
    for(let i=0;i<70;i++){const x=(i*173.31%width),y=Y(.16)+(i*31.73%Y(.26)),w=8+(i*13%28),h=15+(i*47%90);ctx.fillStyle=i%5===0?'#27202e':'#171622';ctx.fillRect(x,y,w,h);for(let wy=y+7;wy<y+h-3;wy+=9)for(let wx=x+4;wx<x+w-2;wx+=7){if(((i+wx+wy)%4)<1.1){ctx.fillStyle=i%3?'#ffcb6b65':'#a6e9ff4d';ctx.fillRect(wx,wy,2,3)}}}
    // Downtown street grid; intersections breathe when a venue is selected.
    for(let i=0;i<8;i++){const x=X(.07+i*.124);path([[x/width,.23],[x/width,.76]],'#8d90ae16',1);}
    for(let i=0;i<6;i++){const y=.29+i*.083;path([[.04,y],[.96,y]],'#9996b31c',1);}
    path([[.02,.35],[.27,.35],[.38,.41],[.53,.41],[.66,.45],[.94,.45]],'#f0e4ca22',7);
    path([[.18,.22],[.18,.39],[.29,.51],[.38,.62],[.41,.79]],'#f0e4ca19',5);
    path([[.84,.22],[.84,.6],[.7,.68],[.57,.7],[.43,.67]],'#f0e4ca18',5);
    // Lady Bird Lake and two bright, impossible bridges.
    ctx.beginPath();ctx.moveTo(0,Y(.73));ctx.bezierCurveTo(X(.16),Y(.67),X(.27),Y(.78),X(.42),Y(.74));ctx.bezierCurveTo(X(.59),Y(.70),X(.69),Y(.78),X(.82),Y(.73));ctx.bezierCurveTo(X(.9),Y(.70),X(.96),Y(.72),width,Y(.69));ctx.lineTo(width,height);ctx.lineTo(0,height);ctx.closePath();const lake=ctx.createLinearGradient(0,Y(.7),0,height);lake.addColorStop(0,'#132833');lake.addColorStop(1,'#07131b');ctx.fillStyle=lake;ctx.fill();
    for(let i=0;i<12;i++){const y=.76+i*.019;path([[.12,y],[.36,y-.008],[.57,y+.005],[.86,y-.012]],'#61d5ff17',1);}
    path([[.29,.72],[.34,.705],[.41,.714]],'#ffcc774b',2);path([[.70,.716],[.78,.69],[.86,.704]],'#ffcc7740',2);
    text('LADY BIRD LAKE',X(.55),Y(.91),8,'#75c9e68b');
    // Walkable night route.
    const points=venues.map((_,i)=>locationOf(i));
    ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(X(p.x),Y(p.y)):ctx.moveTo(X(p.x),Y(p.y)));ctx.closePath();ctx.strokeStyle='#d8ff3230';ctx.lineWidth=15;ctx.stroke();ctx.strokeStyle='#d8ff32a0';ctx.lineWidth=1.5;ctx.setLineDash([5,6]);ctx.stroke();ctx.setLineDash([]);
    glow(X(points[selected].x),Y(points[selected].y),width*.15,venues[selected].color,.17);
    venues.forEach((venue,i)=>drawVenueMarker(venue,i,points[i],t));
    if(vehicle.targetX!==undefined){vehicle.x+=(vehicle.targetX-vehicle.x)*.055;vehicle.y+=(vehicle.targetY-vehicle.y)*.055}else{const p=points[0];vehicle.x=p.x;vehicle.y=p.y}
    drawVan(X(vehicle.x),Y(vehicle.y),t);
    text('N',X(.94),Y(.2),9,'#e9e0ca','center','Arial');path([[.94,.22],[.94,.26]],'#e9e0ca88',1);
  }

  function drawVenueMarker(venue,i,p,t) {
    const x=X(p.x),y=Y(p.y),s=Math.max(28,Math.min(55,scale*.055)),active=i===selected;
    glow(x,y,s*2,venue.color,active?.62:.17);
    ctx.save();ctx.translate(x,y);
    if(active){ctx.beginPath();ctx.ellipse(0,0,s*1.08,s*.48,0,0,Math.PI*2);ctx.strokeStyle=venue.color+'aa';ctx.lineWidth=1;ctx.setLineDash([3,4]);ctx.lineDashOffset=-t*9;ctx.stroke();ctx.setLineDash([])}
    // Tiny venue facades have different roofs, stage apertures and marquee shapes.
    if(venue.kind==='theater'){
      ctx.fillStyle='#292536';ctx.beginPath();ctx.moveTo(-s*.6,-s*.18);ctx.lineTo(-s*.48,-s*.67);ctx.lineTo(s*.48,-s*.67);ctx.lineTo(s*.6,-s*.18);ctx.closePath();ctx.fill();ctx.fillStyle=venue.color;ctx.fillRect(-s*.49,-s*.2,s*.98,s*.11);ctx.fillStyle='#16141c';ctx.fillRect(-s*.43,-s*.08,s*.86,s*.47);ctx.fillStyle=venue.color;for(let n=-2;n<=2;n++)ctx.fillRect(n*s*.12-s*.025,s*.02,s*.05,s*.32);
    } else if(venue.kind==='outdoor'){
      ctx.fillStyle='#30251c';ctx.fillRect(-s*.65,-s*.22,s*1.3,s*.48);ctx.fillStyle=venue.color;ctx.beginPath();ctx.moveTo(-s*.7,-s*.22);ctx.lineTo(-s*.48,-s*.56);ctx.lineTo(s*.48,-s*.56);ctx.lineTo(s*.7,-s*.22);ctx.closePath();ctx.fill();ctx.fillStyle='#15121a';ctx.fillRect(-s*.43,-s*.12,s*.86,s*.35);ctx.strokeStyle=venue.color;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-s*.72,s*.3);ctx.lineTo(s*.72,s*.3);ctx.stroke();
    } else if(venue.kind==='brick'){
      ctx.fillStyle='#39272a';ctx.fillRect(-s*.68,-s*.42,s*1.36,s*.69);ctx.fillStyle='#211923';ctx.fillRect(-s*.56,-s*.66,s*.78,s*.28);ctx.fillStyle=venue.color;ctx.fillRect(-s*.3,-s*.06,s*.6,s*.13);ctx.strokeStyle='#a56b48';ctx.lineWidth=1;for(let r=-.32;r<.24;r+=.13){ctx.beginPath();ctx.moveTo(-s*.63,s*r);ctx.lineTo(s*.63,s*r);ctx.stroke()}
    } else if(venue.kind==='blues'){
      ctx.fillStyle='#252833';ctx.fillRect(-s*.62,-s*.5,s*1.24,s*.75);ctx.fillStyle='#3c4655';ctx.fillRect(-s*.53,-s*.65,s*1.06,s*.15);ctx.fillStyle=venue.color;ctx.fillRect(-s*.48,-s*.21,s*.96,s*.12);ctx.fillStyle='#11141c';ctx.fillRect(-s*.39,-s*.06,s*.78,s*.31);for(let n=0;n<4;n++){ctx.fillStyle=n%2?'#d3a35b':'#477db0';ctx.fillRect(-s*.45+n*s*.28,-s*.46,s*.12,s*.12)}
    } else {
      ctx.fillStyle='#382427';ctx.fillRect(-s*.66,-s*.4,s*1.32,s*.65);ctx.fillStyle='#bc5141';ctx.fillRect(-s*.72,-s*.43,s*1.44,s*.11);ctx.fillStyle='#16141a';ctx.fillRect(-s*.53,-s*.24,s*1.06,s*.4);ctx.fillStyle='#ffd37a';ctx.fillRect(-s*.55,-s*.43,s*1.1,s*.045);ctx.fillStyle='#ffb678';ctx.beginPath();ctx.arc(-s*.35,-s*.46,s*.075,0,Math.PI*2);ctx.fill();
    }
    if(active){ctx.fillStyle=venue.color;ctx.fillRect(-2,-s*.96,4,s*.24);ctx.beginPath();ctx.arc(0,-s*.99,3+Math.sin(t*5)*1.2,0,Math.PI*2);ctx.fill()}
    ctx.restore();
    const labelY=y+s*.53+(p.y>.65?-s*.93:s*.8);
    rounded(x-s*.65,labelY-8,s*1.3,16,3,'#09080de8',active?venue.color+'aa':'#ffffff25');
    text(venue.short,x,labelY,7,active?venue.color:'#d6d0c5');
  }

  function drawVan(x,y,t) {
    ctx.save();ctx.translate(x,y+Math.sin(t*5)*2);ctx.rotate(Math.sin(t*1.4)*.04);
    ctx.shadowColor='#d8ff32';ctx.shadowBlur=12;rounded(x-x+(-14),-8,28,16,4,'#d8ff32','#fff7c8');ctx.shadowBlur=0;
    rounded(-8,-5,13,10,3,'#171821');rounded(4,-4,5,8,2,'#ff674f');
    ctx.fillStyle='#09080d';ctx.beginPath();ctx.arc(-7,8,3,0,Math.PI*2);ctx.arc(8,8,3,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff4a2';ctx.fillRect(12,-4,3,3);ctx.fillRect(12,2,3,3);ctx.restore();
  }

  function drawAustinSky(t) {
    const sky=ctx.createLinearGradient(0,0,0,height*.66);sky.addColorStop(0,'#332553');sky.addColorStop(.54,'#db5d5c');sky.addColorStop(1,'#f5a94f');ctx.fillStyle=sky;ctx.fillRect(0,0,width,height*.67);
    const moonX=width*.77,moonY=height*.19,moonR=Math.min(width,height)*.105;
    ctx.fillStyle='#f5db79';ctx.beginPath();ctx.arc(moonX,moonY,moonR,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#e8a956';for(let i=0;i<12;i++){const a=i*2.399+t*.012,r=moonR*(.28+(i%4)*.13);ctx.beginPath();ctx.arc(moonX+Math.cos(a)*r,moonY+Math.sin(a)*r,2+i%3,0,Math.PI*2);ctx.fill()}
    // A hand-drawn Austin skyline: the Capitol dome, the UT tower and the Frost sail.
    const baseline=height*.58;
    ctx.fillStyle='#33253d';
    const skyline=[[-.03,.28,.10], [.07,.22,.13], [.19,.32,.08], [.29,.25,.11], [.40,.20,.14], [.53,.29,.09], [.64,.17,.13], [.76,.26,.10], [.88,.20,.14]];
    skyline.forEach(([x,h,w],i)=>{const xx=width*x,ww=width*w,hh=height*h;ctx.fillRect(xx,baseline-hh,ww,hh);ctx.strokeStyle='#f3a85655';ctx.lineWidth=1;for(let yy=baseline-hh+10;yy<baseline-5;yy+=13)for(let wx=xx+7;wx<xx+ww-4;wx+=13)if(((Math.floor(wx)+Math.floor(yy)+i)%4)<1.5){ctx.fillStyle='#ffd56e';ctx.fillRect(wx,yy,3,5);ctx.fillStyle='#33253d'}});
    // Capitol dome and UT clock tower make the skyline read as Austin.
    const cap=width*.23;ctx.fillStyle='#53405a';ctx.fillRect(cap,baseline-height*.31,width*.085,height*.31);ctx.beginPath();ctx.ellipse(cap+width*.042,baseline-height*.31,width*.052,height*.035,0,Math.PI,Math.PI*2);ctx.fill();ctx.fillRect(cap+width*.039,baseline-height*.39,width*.006,height*.055);
    const tower=width*.57;ctx.fillStyle='#493653';ctx.fillRect(tower,baseline-height*.36,width*.035,height*.36);ctx.fillStyle='#f5c86a';ctx.fillRect(tower+width*.007,baseline-height*.35,width*.02,height*.035);ctx.fillRect(tower+width*.012,baseline-height*.405,width*.01,height*.06);
    const frost=width*.69;ctx.fillStyle='#573654';ctx.beginPath();ctx.moveTo(frost,baseline-height*.42);ctx.lineTo(frost+width*.075,baseline-height*.57);ctx.lineTo(frost+width*.12,baseline-height*.52);ctx.lineTo(frost+width*.12,baseline);ctx.lineTo(frost,baseline);ctx.closePath();ctx.fill();ctx.strokeStyle='#ffd46e';ctx.lineWidth=2;ctx.stroke();
    // Hills and live oak silhouettes at the edge of town.
    ctx.fillStyle='#252239';ctx.beginPath();ctx.moveTo(0,baseline);ctx.quadraticCurveTo(width*.17,baseline-height*.1,width*.34,baseline);ctx.quadraticCurveTo(width*.57,baseline-height*.12,width*.74,baseline);ctx.quadraticCurveTo(width*.9,baseline-height*.08,width,baseline);ctx.lineTo(width,height);ctx.lineTo(0,height);ctx.closePath();ctx.fill();
    ctx.fillStyle='#18222a';for(let i=0;i<7;i++){const x=(i*width*.177+frame*2)%(width+40)-20,y=baseline-height*.03;ctx.fillRect(x-3,y,6,height*.2);ctx.beginPath();ctx.arc(x,y-height*.025,14+i%3*4,0,Math.PI*2);ctx.fill()}
  }

  function drawMural(venue,x,y,w,h,t) {
    ctx.save();ctx.translate(x,y);ctx.fillStyle='#17202a';ctx.strokeStyle='#17121b';ctx.lineWidth=5;ctx.beginPath();ctx.roundRect(0,0,w,h,9);ctx.fill();ctx.stroke();
    // Bright, original mural/poster motifs: oversized shapes, imperfect outlines and halftone dots.
    const colors=[venue.color,'#f3d65d','#f16c66','#58d2c1','#d394e8'];
    for(let i=0;i<5;i++){ctx.fillStyle=colors[i];const px=w*(.12+i*.16),py=h*(.19+(i%2)*.08);ctx.beginPath();if(i===0){ctx.arc(px,py,h*.13,0,Math.PI*2)}else{ctx.moveTo(px,py-h*.12);ctx.lineTo(px+h*.1,py);ctx.lineTo(px,py+h*.12);ctx.lineTo(px-h*.1,py);ctx.closePath()}ctx.fill();ctx.strokeStyle='#201526';ctx.lineWidth=2;ctx.stroke()}
    ctx.strokeStyle='#211724';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(w*.1,h*.75);ctx.bezierCurveTo(w*.28,h*.42,w*.44,h*.95,w*.62,h*.62);ctx.bezierCurveTo(w*.76,h*.4,w*.83,h*.84,w*.95,h*.54);ctx.stroke();
    ctx.fillStyle='#fff0bb';for(let i=0;i<24;i++){const dx=(i*37%97)/100*w,dy=(i*61%83)/100*h;ctx.globalAlpha=.45;ctx.fillRect(dx,dy,2,2)}ctx.globalAlpha=1;
    const symbol=venue.kind==='bar'?'ARMADILLO RADIO':venue.kind==='blues'?'BLUE NOTE CLUB':venue.kind==='brick'?'RED RIVER DREAM':venue.kind==='outdoor'?'SMOKE / SOUND':'AUSTIN CITY LIMITS';
    text(symbol,w*.5,h*.91,Math.max(7,w*.023),'#fff0cb');ctx.restore();
  }

  function drawFacade(venue,cx,t) {
    const bw=width*.8,bh=height*.37,left=cx-bw*.5,top=height*.28,ground=top+bh;
    const wall=venue.kind==='bar'?'#dbb587':venue.kind==='blues'?'#8b4c43':venue.kind==='brick'?'#8c443f':venue.kind==='outdoor'?'#e6d9b8':'#292b3a';
    ctx.fillStyle='#1a1520';ctx.strokeStyle='#18121c';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(left-8,top+19);ctx.lineTo(left+bw*.08,top);ctx.lineTo(left+bw*.93,top+3);ctx.lineTo(left+bw+8,top+23);ctx.lineTo(left+bw,ground);ctx.lineTo(left,ground);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle=wall;ctx.beginPath();ctx.moveTo(left,top+22);ctx.lineTo(left+bw*.08,top+7);ctx.lineTo(left+bw*.93,top+10);ctx.lineTo(left+bw,top+25);ctx.lineTo(left+bw,ground);ctx.lineTo(left,ground);ctx.closePath();ctx.fill();
    // Hand-inked brick and painted trim.
    if(venue.kind==='blues'||venue.kind==='brick'){ctx.strokeStyle=venue.kind==='blues'?'#522d3570':'#53262f88';ctx.lineWidth=2;for(let row=0;row<6;row++){const yy=top+35+row*20;ctx.beginPath();ctx.moveTo(left,yy);ctx.lineTo(left+bw,yy);ctx.stroke();for(let col=0;col<13;col++){const xx=left+col*bw/13+(row%2)*bw/26;ctx.beginPath();ctx.moveTo(xx,yy-10);ctx.lineTo(xx,yy);ctx.stroke()}}}
    // Upper-storey windows on downtown brick buildings.
    const rows=venue.kind==='blues'?2:venue.kind==='brick'?2:venue.kind==='theater'?1:0;
    for(let row=0;row<rows;row++)for(let col=0;col<5;col++){const wx=left+bw*(.13+col*.17),wy=top+bh*(.18+row*.22);ctx.fillStyle='#283445';ctx.strokeStyle='#211923';ctx.lineWidth=3;ctx.fillRect(wx,wy,bw*.105,bh*.16);ctx.strokeRect(wx,wy,bw*.105,bh*.16);ctx.fillStyle='#ffd27a';ctx.globalAlpha=.5+(col%2)*.2;ctx.fillRect(wx+4,wy+4,bw*.105-8,bh*.16-8);ctx.globalAlpha=1;ctx.strokeStyle='#211923';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(wx+bw*.052,wy);ctx.lineTo(wx+bw*.052,wy+bh*.16);ctx.moveTo(wx,wy+bh*.08);ctx.lineTo(wx+bw*.105,wy+bh*.08);ctx.stroke()}
    // Main doors, windows, porch or theater entrance.
    if(venue.kind==='outdoor'){
      ctx.fillStyle='#d8c9a6';ctx.fillRect(left+bw*.08,top+bh*.35,bw*.84,bh*.43);ctx.fillStyle='#35242a';ctx.fillRect(left+bw*.12,top+bh*.4,bw*.76,bh*.27);ctx.strokeStyle='#27202a';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(left+bw*.07,top+bh*.37);ctx.lineTo(left+bw*.93,top+bh*.37);ctx.stroke();
      for(let i=0;i<14;i++){const xx=left+bw*(.09+i*.062);ctx.fillStyle=i%2?'#ffd35c':'#ff744f';ctx.beginPath();ctx.arc(xx,top+bh*.34,5,0,Math.PI*2);ctx.fill()}
    }else if(venue.kind==='theater'){
      ctx.fillStyle='#171823';ctx.fillRect(left+bw*.12,top+bh*.45,bw*.76,bh*.42);ctx.fillStyle='#35364b';ctx.fillRect(left+bw*.16,top+bh*.49,bw*.68,bh*.34);ctx.fillStyle='#c58e4f';for(let i=0;i<5;i++){ctx.fillRect(left+bw*(.19+i*.13),top+bh*.51,bw*.075,bh*.28)}
    }else{
      ctx.fillStyle=venue.kind==='bar'?'#b33f38':'#34212a';ctx.strokeStyle='#211923';ctx.lineWidth=4;ctx.fillRect(left+bw*.08,top+bh*.56,bw*.84,bh*.33);ctx.strokeRect(left+bw*.08,top+bh*.56,bw*.84,bh*.33);
      const doors=venue.kind==='brick'?3:venue.kind==='blues'?2:4;for(let i=0;i<doors;i++){const dx=left+bw*(.12+i*(.78/doors));ctx.fillStyle=venue.kind==='bar'?'#302634':'#232c38';ctx.fillRect(dx,top+bh*.58,bw*.17,bh*.28);ctx.strokeStyle='#221a24';ctx.lineWidth=3;ctx.strokeRect(dx,top+bh*.58,bw*.17,bh*.28);ctx.fillStyle='#ffdb7a';ctx.globalAlpha=.48;ctx.fillRect(dx+4,top+bh*.6,bw*.17-8,bh*.23);ctx.globalAlpha=1;ctx.fillStyle='#292029';ctx.beginPath();ctx.arc(dx+bw*.15,top+bh*.72,3,0,Math.PI*2);ctx.fill()}
    }
    // Venue-specific marquee, cut like a hand-painted gig poster.
    const signW=bw*.58,signH=bh*.14,sx=cx-signW*.5,sy=top+bh*.045;
    ctx.fillStyle=venue.kind==='theater'?'#171722':'#201821';ctx.strokeStyle=venue.color;ctx.lineWidth=3;ctx.beginPath();ctx.roundRect(sx,sy,signW,signH,5);ctx.fill();ctx.stroke();
    text(venue.kind==='theater'?'ACL LIVE AT THE MOODY':venue.kind==='bar'?'THE CONTINENTAL CLUB':venue.kind==='blues'?"ANTONE’S NIGHTCLUB":venue.kind==='brick'?'MOHAWK / RED RIVER':"STUBB’S BAR-B-Q",cx,sy+signH*.52,Math.min(18,signH*.43),'#fff0c5','center','Arial Black,Impact,sans-serif');
    if(venue.kind==='bar'){
      // The Continental's recognizable red, vertical roadside neon.
      ctx.fillStyle='#291720';ctx.strokeStyle='#211622';ctx.lineWidth=4;ctx.fillRect(left+bw*.015,top+bh*.11,bw*.13,bh*.47);ctx.strokeRect(left+bw*.015,top+bh*.11,bw*.13,bh*.47);text('CONTINENTAL',left+bw*.08,top+bh*.34,10,'#ff6b4d','center','Arial Black,Impact,sans-serif');
      for(let i=0;i<5;i++){ctx.fillStyle=i%2?'#ffd36b':'#ff644b';ctx.beginPath();ctx.arc(left+bw*(.27+i*.09),top+bh*.53,4,0,Math.PI*2);ctx.fill()}
    }
    if(venue.kind==='blues'){ctx.strokeStyle='#3dbaff';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(cx-bw*.1,top+bh*.3);ctx.quadraticCurveTo(cx,top+bh*.15,cx+bw*.1,top+bh*.3);ctx.stroke()}
    if(venue.kind==='brick'){ctx.fillStyle='#201a23';ctx.fillRect(left+bw*.05,top+bh*.55,bw*.9,bh*.05);ctx.fillStyle=venue.color;ctx.fillRect(left+bw*.08,top+bh*.53,bw*.84,5);for(let i=0;i<7;i++){ctx.fillStyle='#ffda68';ctx.fillRect(left+bw*(.09+i*.125),top+bh*.52,5,5)}}
    drawMural(venue,left+bw*.16,top+bh*.22,bw*.22,bh*.28,t);
    if(venue.kind==='outdoor'){
      // Outdoor stage appears through the fence at Stubb's.
      ctx.fillStyle='#29212b';ctx.fillRect(left+bw*.65,top+bh*.56,bw*.27,bh*.31);ctx.fillStyle='#ffb54e';ctx.fillRect(left+bw*.67,top+bh*.54,bw*.23,5);ctx.strokeStyle='#30202a';ctx.lineWidth=3;for(let i=0;i<8;i++){const xx=left+bw*(.64+i*.042);ctx.beginPath();ctx.moveTo(xx,top+bh*.54);ctx.lineTo(xx,top+bh*.9);ctx.stroke()}
    }
    ctx.strokeStyle='#17141d';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(left,ground);ctx.lineTo(left+bw,ground);ctx.stroke();
  }

  function drawWalker(x,y,t) {
    const bob=Math.sin(t*5)*3, s=scale*.036*(.8+street.depth*.35);
    ctx.save();ctx.translate(x,y+bob);ctx.lineCap='round';ctx.lineJoin='round';
    // Original little night-walker, in gig-poster outlines and brightly painted clothes.
    ctx.strokeStyle='#18121b';ctx.lineWidth=s*.56;ctx.beginPath();ctx.moveTo(-s*.12,s*.7);ctx.lineTo(-s*.25,s*1.55+Math.sin(t*5)*s*.12);ctx.moveTo(s*.13,s*.7);ctx.lineTo(s*.28,s*1.52-Math.sin(t*5)*s*.12);ctx.stroke();
    ctx.strokeStyle='#f6d374';ctx.lineWidth=s*.17;ctx.beginPath();ctx.moveTo(-s*.25,s*1.5+Math.sin(t*5)*s*.12);ctx.lineTo(-s*.48,s*1.55+Math.sin(t*5)*s*.12);ctx.moveTo(s*.28,s*1.5-Math.sin(t*5)*s*.12);ctx.lineTo(s*.48,s*1.55-Math.sin(t*5)*s*.12);ctx.stroke();
    ctx.fillStyle='#ee655b';ctx.strokeStyle='#17121b';ctx.lineWidth=s*.12;ctx.beginPath();ctx.moveTo(-s*.33,-s*.08);ctx.lineTo(s*.3,-s*.08);ctx.lineTo(s*.42,s*.78);ctx.lineTo(-s*.36,s*.78);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.strokeStyle='#f0cf76';ctx.lineWidth=s*.12;ctx.beginPath();ctx.moveTo(-s*.3,s*.03);ctx.lineTo(-s*.55,s*.57);ctx.moveTo(s*.29,s*.03);ctx.lineTo(s*.53,s*.45);ctx.stroke();
    ctx.fillStyle='#d29c6d';ctx.beginPath();ctx.arc(0,-s*.4,s*.29,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#18121b';ctx.lineWidth=s*.08;ctx.stroke();
    ctx.fillStyle='#21202b';ctx.beginPath();ctx.moveTo(-s*.38,-s*.47);ctx.lineTo(-s*.32,-s*.75);ctx.quadraticCurveTo(0,-s*.9,s*.34,-s*.71);ctx.lineTo(s*.4,-s*.48);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle='#f2dd83';ctx.beginPath();ctx.arc(s*.1,-s*.39,s*.035,0,Math.PI*2);ctx.fill();
    // A guitar case slung over one shoulder.
    ctx.save();ctx.rotate(-.22);ctx.fillStyle='#3d3b4a';ctx.strokeStyle='#17121b';ctx.lineWidth=s*.1;ctx.beginPath();ctx.roundRect(s*.31,-s*.58,s*.26,s*1.02,s*.12);ctx.fill();ctx.stroke();ctx.fillStyle='#e8cf78';ctx.fillRect(s*.39,-s*.47,s*.1,s*.75);ctx.restore();ctx.restore();
  }

  function updateStreet() {
    let dx=0,dy=0;if(keys.has('ArrowLeft')||keys.has('a'))dx--;if(keys.has('ArrowRight')||keys.has('d'))dx++;
    if(keys.has('ArrowUp')||keys.has('w'))dy--;if(keys.has('ArrowDown')||keys.has('s'))dy++;
    street.pos=Math.max(0,Math.min(venues.length-1,street.pos+dx*.006));
    street.depth=Math.max(.61,Math.min(.86,street.depth+dy*.0015));
    const nearest=Math.max(0,Math.min(venues.length-1,Math.round(street.pos)));
    if(nearest!==selected&&Math.abs(street.pos-nearest)<.49){
      selected=nearest;
      const venue=venues[selected];
      document.querySelectorAll('.route-stop').forEach((button,i)=>button.setAttribute('aria-pressed',String(i===selected)));
      el('venue-count').textContent=`STOP 0${selected+1} / 0${venues.length}`;
      el('venue-era').textContent=venue.era;
      el('venue-name').innerHTML=venue.id==='continental'?'THE<br>CONTINENTAL':venue.id==='acl'?'ACL LIVE<br>AT THE MOODY':venue.name.toUpperCase();
      el('venue-tag').textContent=venue.tag;el('venue-description').textContent=venue.description;
      el('scene-label-name').textContent=venue.name.toUpperCase();
      document.querySelector('.venue-readout').style.setProperty('--venue',venue.color);world.style.setProperty('--venue',venue.color);
      document.querySelectorAll('.readout-pulse,.venue-count').forEach(node=>node.style.color=venue.color);
      const p=locationOf(selected);vehicle.targetX=p.x;vehicle.targetY=p.y;
      el('map-coordinate').innerHTML=`30° ${String(15+selected).padStart(2,'0')}′ 2″ N<br>97° ${selected%2?'44':'45'}′ ${35+selected*3}″ W<br><span>SCHEMATIC / NOT TO SCALE</span>`;
      el('street-venue-name').textContent=venue.id==='acl'?'ACL LIVE / THE MOODY':venue.short;
      el('street-area').textContent=venue.era;
      el('street-instructions').textContent=venue.kind==='outdoor'?'Follow the string lights. The stage is hiding under the Texas sky.':'Walk the block. Find the hand-painted sign and the light leaking under the door.';
      updateModeUi();
    }
  }

  function drawStreet(t) {
    drawAustinSky(t);
    const h=height,base=h*.67;
    // A row of hand-cut city silhouettes and layered poster-like light spill.
    const wash=ctx.createLinearGradient(0,base,0,h);wash.addColorStop(0,'#73505b');wash.addColorStop(.33,'#3c3341');wash.addColorStop(1,'#17151f');ctx.fillStyle=wash;ctx.fillRect(0,base,width,h-base);
    ctx.fillStyle='#211b27';ctx.fillRect(0,h*.61,width,h*.11);
    // Sidewalk tile pattern drifts the opposite way from the street for parallax.
    for(let i=0;i<18;i++){let x=((i*width/18-(street.pos*width*.62)% (width/18))%(width+width/18));if(x<0)x+=width+width/18;ctx.strokeStyle='#f4d59d2c';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,h*.68);ctx.lineTo(x-width*.07,h);ctx.stroke()}
    ctx.fillStyle='#312d36';ctx.fillRect(0,h*.8,width,h*.2);
    const stripe=((street.pos*width*2)%width);ctx.fillStyle='#f4d77a';for(let i=-1;i<4;i++)ctx.fillRect(i*width*.39-stripe*.18,h*.91,width*.17,4);
    // Main street façades slide by as the visitor walks the connected venue route.
    const gap=width*1.1,camera=street.pos*gap;
    venues.forEach((venue,i)=>{const cx=width*.44+i*gap-camera;if(cx>-width*.52&&cx<width*1.52)drawFacade(venue,cx,t)});
    // Street lamps, traffic lights and utility wires make the scale feel walkable.
    ctx.strokeStyle='#211823';ctx.lineWidth=5;for(let i=0;i<5;i++){const x=((i*width*.31-camera*.24)%(width+90)+width+90)%(width+90)-45;ctx.beginPath();ctx.moveTo(x,h*.35);ctx.lineTo(x,h*.68);ctx.lineTo(x+width*.07,h*.68);ctx.stroke();ctx.fillStyle='#f9cf62';ctx.beginPath();ctx.arc(x+width*.07,h*.68,5,0,Math.PI*2);ctx.fill();glow(x+width*.07,h*.69,55,'#ffbd5a',.28)}
    path([[0,h*.33],[.25,h*.29],[.5,h*.32],[.77,h*.28],[1,h*.3]],'#20172288',2);
    // Crossing lights and occasional cheeky night birds.
    for(let i=0;i<4;i++){const x=(i*width*.29+width*.1)%width;ctx.fillStyle=i%2?'#5ae1c8':'#ff6a57';ctx.beginPath();ctx.arc(x,h*.2+Math.sin(t+i)*8,2.5,0,Math.PI*2);ctx.fill()}
    const walkerX=width*.42,walkerY=height*street.depth;drawWalker(walkerX,walkerY,t+street.step);street.step+=.009;
    const venue=venues[selected];glow(walkerX,walkerY,scale*.12,venue.color,.17);
    text(venue.area,walkerX,walkerY+scale*.05,8,'#fff1c9','center');
  }

  function drawProjection(venue,t,cx,cy,r) {
    const color=venue.color;ctx.save();ctx.globalCompositeOperation='lighter';
    if(venue.kind==='bar'){
      for(let l=0;l<8;l++){ctx.beginPath();for(let k=0;k<=260;k++){const a=k/260*Math.PI*2,mod=1+.11*Math.sin(a*5+t*1.8+l*.7)+.045*Math.cos(a*11-t+l);const rr=r*(.12+l*.105)*mod;const x=cx+Math.cos(a)*rr*1.25,y=cy+Math.sin(a)*rr*.64;if(!k)ctx.moveTo(x,y);else ctx.lineTo(x,y)}ctx.closePath();ctx.strokeStyle=`${color}${l===0?'ff':'8a'}`;ctx.lineWidth=l===0?2:1;ctx.stroke()}
    }else if(venue.kind==='blues'){
      for(let l=0;l<9;l++){ctx.beginPath();for(let k=0;k<190;k++){const x=cx-r*.8+k/189*r*1.6,y=cy+(l-4)*r*.065+Math.sin(k*.07+t*1.5+l*.45)*r*(.09+l*.012);k?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.strokeStyle=`${l%2?color:'#ffbd65'}99`;ctx.lineWidth=l===4?2.5:1;ctx.stroke()}
      for(let i=0;i<14;i++){const a=t*.23+i*2.4,rr=r*(.2+(i%4)*.12);ctx.beginPath();ctx.arc(cx+Math.cos(a)*rr,cy+Math.sin(a*1.7)*rr*.6,2+(i%3),0,Math.PI*2);ctx.fillStyle=color;ctx.fill()}
    }else if(venue.kind==='brick'){
      for(let k=0;k<12;k++){const a=t*.4+k*Math.PI/6, x=cx+Math.cos(a)*r*.28,y=cy+Math.sin(a)*r*.18;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(x+Math.cos(a)*r*1.2,y+Math.sin(a)*r*.7);ctx.lineWidth=1+(k%3);ctx.strokeStyle=`${k%2?color:'#ff4f72'}${k%3?'83':'c9'}`;ctx.stroke()}
      for(let l=0;l<4;l++){ctx.beginPath();ctx.ellipse(cx,cy,r*(.2+l*.2),r*(.11+l*.09),Math.sin(t*.2)*.2,0,Math.PI*2);ctx.strokeStyle=`${color}${'aa'}`;ctx.lineWidth=1;ctx.stroke()}
    }else if(venue.kind==='outdoor'){
      for(let i=0;i<42;i++){const x=cx+Math.sin(t*.4+i*3.17)*r*(.2+(i%5)*.15),y=cy+Math.cos(t*.31+i*1.73)*r*(.14+(i%6)*.1);const sz=2+(i%4);ctx.fillStyle=i%3?'#ffce6f':color;ctx.globalAlpha=.4+.5*Math.sin(t*2+i);ctx.fillRect(x,y,sz,sz)}ctx.globalAlpha=1;
      for(let l=0;l<5;l++){ctx.beginPath();ctx.moveTo(cx-r*.65,cy+r*.35-l*r*.09);ctx.quadraticCurveTo(cx+Math.sin(t+l)*r*.4,cy-r*.7-l*r*.1,cx+r*.7,cy+r*.35-l*r*.1);ctx.strokeStyle=`${l%2?color:'#ffad44'}88`;ctx.lineWidth=2;ctx.stroke()}
    }else{
      for(let l=0;l<5;l++){ctx.beginPath();for(let k=0;k<=120;k++){const a=k/120*Math.PI*2,rr=r*(.25+l*.16)*(1+.035*Math.sin(a*8+t*2+l));const x=cx+Math.cos(a)*rr,y=cy+Math.sin(a)*rr*.63;k?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.closePath();ctx.strokeStyle=`${color}${l===0?'ff':'88'}`;ctx.lineWidth=l===0?2:1;ctx.stroke()}
      for(let i=0;i<7;i++){const x=cx-r*.65+i*r*.22;ctx.beginPath();ctx.moveTo(x,cy+r*.05);ctx.lineTo(cx+(x-cx)*.38,cy-r*.46);ctx.strokeStyle=`${color}72`;ctx.lineWidth=1;ctx.stroke()}
    }
    ctx.restore();
  }

  function drawInterior(venue,t) {
    const w=width,h=height,color=venue.color, outdoor=venue.kind==='outdoor';
    const bg=ctx.createLinearGradient(0,0,0,h);bg.addColorStop(0,outdoor?'#11112a':'#111019');bg.addColorStop(.54,outdoor?'#241b32':'#211725');bg.addColorStop(1,'#09090d');ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
    for(let i=0;i<38;i++){const x=(i*177.7%w),y=(i*53.1%(h*.38));ctx.fillStyle=`rgba(255,255,255,${.18+(i%3)*.12})`;ctx.fillRect(x,y,1.2,1.2)}
    // Roof / venue silhouette differs at every stop.
    if(venue.kind==='theater'){
      ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(w,0);ctx.lineTo(w,h*.25);ctx.quadraticCurveTo(w*.5,h*.03,0,h*.25);ctx.fillStyle='#1e1b2b';ctx.fill();
      for(let i=0;i<9;i++){ctx.beginPath();ctx.ellipse(w*.5,h*.36,w*(.18+i*.034),h*(.11+i*.017),0,Math.PI,Math.PI*2);ctx.strokeStyle=i%2?'#a88cff34':'#67dfff26';ctx.lineWidth=1;ctx.stroke()}
    }else if(venue.kind==='brick'){
      ctx.fillStyle='#38232a';ctx.fillRect(0,0,w*.16,h*.61);ctx.fillRect(w*.84,0,w*.16,h*.61);ctx.fillStyle='#19151e';ctx.fillRect(w*.04,h*.1,w*.12,h*.38);ctx.fillRect(w*.84,h*.06,w*.12,h*.42);
      ctx.strokeStyle='#a3574c44';ctx.lineWidth=2;for(let y=20;y<h*.55;y+=24){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w*.16,y);ctx.moveTo(w*.84,y);ctx.lineTo(w,y);ctx.stroke()}
    }else if(venue.kind==='outdoor'){
      ctx.fillStyle='#11121e';ctx.fillRect(0,0,w,h*.5);ctx.fillStyle='#2d2330';ctx.fillRect(0,h*.49,w,h*.05);
      for(let i=0;i<22;i++){const x=i*w/21;glow(x,h*.48,40,i%2?color:'#ffb557',.16)}
    }else if(venue.kind==='blues'){
      ctx.fillStyle='#1d202b';ctx.fillRect(0,0,w,h*.55);for(let x=0;x<w;x+=56){ctx.strokeStyle='#8898a22a';ctx.lineWidth=2;ctx.strokeRect(x+5,h*.08,46,h*.36)}
    }else{
      ctx.fillStyle='#292128';ctx.fillRect(0,0,w,h*.43);ctx.fillStyle='#47312a';ctx.fillRect(0,h*.4,w,h*.08);for(let x=0;x<w;x+=70){ctx.fillStyle='#805f453a';ctx.fillRect(x,h*.12,36,5);ctx.fillRect(x+12,h*.15,5,h*.15)}
    }
    // Each back wall gets its own hand-painted mural rather than a generic glow tunnel.
    drawMural(venue,w*.24,h*.2,w*.52,h*.16,t);
    // A fan of color spills from the active rig into the room.
    const cx=w*.52,cy=h*.42,stageW=Math.min(w*.52,700),stageH=Math.min(h*.24,190);
    for(let b=0;b<5;b++){ctx.save();ctx.globalAlpha=.075;ctx.fillStyle=b%2?color:'#ffffff';ctx.beginPath();ctx.moveTo(cx+(b-2)*stageW*.08,h*.13);ctx.lineTo(cx+(b-2)*stageW*.23-stageW*.18,h*.69);ctx.lineTo(cx+(b-2)*stageW*.23+stageW*.18,h*.69);ctx.closePath();ctx.fill();ctx.restore()}
    // Raised stage and signature architectural cues.
    ctx.beginPath();ctx.moveTo(cx-stageW*.65,h*.55);ctx.lineTo(cx+stageW*.65,h*.55);ctx.lineTo(cx+stageW*.53,h*.73);ctx.lineTo(cx-stageW*.53,h*.73);ctx.closePath();ctx.fillStyle=venue.kind==='bar'?'#44332d':venue.kind==='brick'?'#453037':'#2e2939';ctx.fill();ctx.strokeStyle=color+'88';ctx.lineWidth=2;ctx.stroke();
    if(venue.kind==='theater'){
      ctx.fillStyle='#16131e';ctx.fillRect(cx-stageW*.5,h*.38,stageW,h*.18);for(let i=0;i<5;i++){ctx.fillStyle=`rgba(188,145,255,${.16+i*.05})`;ctx.fillRect(cx-stageW*.48+i*stageW*.19,h*.39,stageW*.13,h*.16)}
      // Theater seating fans around the performance.
      for(let row=0;row<5;row++){ctx.beginPath();ctx.ellipse(cx,h*.72+row*22,stageW*(.72+row*.14),h*(.15+row*.02),0,Math.PI,Math.PI*2);ctx.strokeStyle='#bc91ff36';ctx.lineWidth=5;ctx.stroke()}
    } else if(venue.kind==='outdoor'){
      ctx.beginPath();ctx.moveTo(cx-stageW*.53,h*.42);ctx.lineTo(cx-stageW*.43,h*.29);ctx.lineTo(cx+stageW*.43,h*.29);ctx.lineTo(cx+stageW*.53,h*.42);ctx.strokeStyle='#ffad44';ctx.lineWidth=9;ctx.stroke();
      for(let i=0;i<28;i++){const x=(i*83%w),y=h*.76+(i*29%(h*.16));drawHead(x,y,7+(i%7),i)}
    }else if(venue.kind==='brick'){
      ctx.fillStyle='#26202a';ctx.fillRect(cx-stageW*.62,h*.28,stageW*.2,h*.27);ctx.fillRect(cx+stageW*.42,h*.22,stageW*.2,h*.33);ctx.fillStyle='#d5ff36';ctx.fillRect(cx-stageW*.6,h*.26,stageW*.17,4);ctx.fillRect(cx+stageW*.44,h*.2,stageW*.16,4);
    }else if(venue.kind==='bar'){
      for(let i=0;i<8;i++){const x=cx-stageW*.48+i*stageW*.135;ctx.fillStyle=i%2?'#e59c6b':'#f0ce90';ctx.fillRect(x,h*.45,4,h*.16)}
    }
    // Projected image: a different live visual language in each room.
    const rr=Math.min(stageW*.48,h*.31);glow(cx,cy,rr*1.6,color,.3);drawProjection(venue,t,cx,cy,rr);
    // DJ / performer silhouette, with no human likeness.
    ctx.fillStyle='#0a090d';ctx.fillRect(cx-5,h*.47,10,h*.12);ctx.beginPath();ctx.arc(cx,h*.45,7,0,Math.PI*2);ctx.fill();
    if(venue.kind==='bar'||venue.kind==='blues'){
      ctx.strokeStyle=venue.kind==='bar'?'#e8b68f':'#66a9ff';ctx.lineWidth=3;ctx.beginPath();ctx.arc(cx+stageW*.25,h*.51,11,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(cx+stageW*.25,h*.51-11);ctx.lineTo(cx+stageW*.25,h*.51+11);ctx.stroke();
    }
    if(venue.kind!=='outdoor')for(let i=0;i<40;i++){const x=(i*97.21%w),y=h*.76+(i*31.17%(h*.17));drawHead(x,y,5+(i*7%8),i)}
    // Floor reflections / image feedback.
    ctx.save();ctx.globalAlpha=.23;const reflection=ctx.createLinearGradient(0,h*.72,0,h);reflection.addColorStop(0,color);reflection.addColorStop(1,'transparent');ctx.fillStyle=reflection;ctx.beginPath();ctx.moveTo(cx-stageW*.45,h*.75);ctx.lineTo(cx+stageW*.45,h*.75);ctx.lineTo(cx+stageW*.78,h);ctx.lineTo(cx-stageW*.78,h);ctx.closePath();ctx.fill();ctx.restore();
    for(let i=0;i<36;i++){const x=(i*139%w),y=h*.2+((i*71+t*16)%h*.72);ctx.fillStyle=`rgba(255,255,255,${.18+Math.sin(t*2+i)*.13})`;ctx.fillRect(x,y,1.5,1.5)}
    if(ripple){
      const age=ripple.age++,radius=8+age*5;ctx.save();ctx.globalAlpha=Math.max(0,1-age/46);ctx.strokeStyle=color;ctx.lineWidth=4-age*.06;ctx.beginPath();ctx.arc(ripple.x,ripple.y,radius,0,Math.PI*2);ctx.stroke();ctx.restore();if(age>46)ripple=null;
    }
  }
  function drawHead(x,y,s,i){ctx.fillStyle=i%4===0?'#27232e':'#0a090d';ctx.beginPath();ctx.arc(x,y-s*.45,s*.42,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.moveTo(x-s*.52,y);ctx.quadraticCurveTo(x,y-s*.25,x+s*.52,y);ctx.lineTo(x+s*.72,y+s*.8);ctx.lineTo(x-s*.72,y+s*.8);ctx.closePath();ctx.fill()}

  function render(now) {
    const speed=reduceMotion.matches?.22:1;frame+=.012*speed;const t=frame;
    if(inside)drawInterior(venues[selected],t);else if(streetMode){updateStreet();drawStreet(t)}else drawRoute(t);
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
  selectVenue(0);

  function updateModeUi(){
    world.classList.toggle('street-view',streetMode&&!inside);
    world.classList.toggle('inside',inside);
    el('street-hud').hidden=!streetMode||inside;
    el('walk-hint').hidden=!streetMode||inside;
    el('walkpad').hidden=!streetMode||inside;
    el('back-button').hidden=!inside;
    el('scene-whisper').hidden=!inside;
    el('level-toggle').setAttribute('aria-pressed',String(streetMode));
    el('level-toggle').innerHTML=streetMode?'CLIMB TO AERIAL <span>↑</span>':'DROP TO STREET <span>↓</span>';
    el('mode-chip').innerHTML=`<i></i> ${inside?'INSIDE THE VENUE':streetMode?'STREET LEVEL':'AERIAL MAP'}`;
    el('mode-chip').style.color=venues[selected].color;
  }
  function setStreetMode(value){inside=false;streetMode=value;street.pos=selected;keys.clear();updateModeUi();}
  function toggleStreetMode(){setStreetMode(!streetMode);}
  function enterVenue(){beforeInterior=streetMode?'street':'aerial';inside=true;keys.clear();ripple=null;updateModeUi();}
  function exitVenue(){inside=false;streetMode=beforeInterior==='street';street.pos=selected;updateModeUi();}
  el('level-toggle').addEventListener('click',toggleStreetMode);
  el('enter-button').addEventListener('click',enterVenue);
  el('street-enter').addEventListener('click',enterVenue);
  el('back-button').addEventListener('click',exitVenue);
  document.querySelectorAll('.walkpad button').forEach(button=>{
    const move=button.dataset.move;
    const down=event=>{event.preventDefault();keys.add(move==='left'?'a':move==='right'?'d':move==='forward'?'w':'s');button.setPointerCapture?.(event.pointerId)};
    const up=()=>{keys.delete(move==='left'?'a':move==='right'?'d':move==='forward'?'w':'s')};
    button.addEventListener('pointerdown',down);button.addEventListener('pointerup',up);button.addEventListener('pointercancel',up);button.addEventListener('lostpointercapture',up);
    button.addEventListener('click',()=>{if(move==='left')street.pos=Math.max(0,street.pos-.08);if(move==='right')street.pos=Math.min(venues.length-1,street.pos+.08);if(move==='forward')street.depth=Math.max(.61,street.depth-.035);if(move==='back')street.depth=Math.min(.86,street.depth+.035)});
  });
  canvas.addEventListener('pointermove',event=>{const r=canvas.getBoundingClientRect();pointer={x:event.clientX-r.left,y:event.clientY-r.top};canvas.style.cursor='default';if(!inside&&!streetMode){venues.forEach((_,i)=>{const p=locationOf(i),dx=pointer.x-X(p.x),dy=pointer.y-Y(p.y);if(Math.hypot(dx,dy)<Math.max(32,scale*.055))canvas.style.cursor='pointer'})}});
  canvas.addEventListener('pointerleave',()=>{pointer={x:-10,y:-10}});
  canvas.addEventListener('pointerdown',event=>{
    const r=canvas.getBoundingClientRect(),mx=event.clientX-r.left,my=event.clientY-r.top;
    if(inside){ripple={x:mx,y:my,age:0};return}
    if(streetMode){street.pos=Math.max(0,Math.min(venues.length-1,street.pos+(mx>width*.54?.11:-.11)));return}
    let best=-1,dist=Infinity;venues.forEach((_,i)=>{const p=locationOf(i),d=Math.hypot(mx-X(p.x),my-Y(p.y));if(d<dist){dist=d;best=i}});if(best>=0&&dist<Math.max(42,scale*.075)){selectVenue(best);if(event.detail>1)enterVenue()}
  });
  el('route-stops').addEventListener('wheel',event=>{if(Math.abs(event.deltaX)<Math.abs(event.deltaY)){event.preventDefault();buttons.scrollLeft+=event.deltaY}},{passive:false});
  document.addEventListener('keydown',event=>{
    if(['INPUT','TEXTAREA'].includes(document.activeElement?.tagName))return;
    if(document.activeElement?.closest('button,a')&&['Enter',' '].includes(event.key))return;
    if(streetMode&&!inside&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','a','A','d','D','w','W','s','S'].includes(event.key)){event.preventDefault();keys.add(event.key.length===1?event.key.toLowerCase():event.key);return}
    if(event.key==='ArrowRight'){event.preventDefault();selectVenue(selected+1)}
    else if(event.key==='ArrowLeft'){event.preventDefault();selectVenue(selected-1)}
    else if(event.key==='ArrowUp'||event.key.toLowerCase()==='g'||event.key.toLowerCase()==='v'){event.preventDefault();if(!inside)toggleStreetMode()}
    else if(event.key==='ArrowDown'&&!inside){event.preventDefault();toggleStreetMode()}
    else if((event.key==='Enter'||event.key.toLowerCase()==='e')&&!inside){event.preventDefault();enterVenue()}
    else if(event.key==='Escape'&&inside){event.preventDefault();exitVenue()}
    else if(event.key.toLowerCase()==='m'){event.preventDefault();setStreetMode(false)}
  });
  document.addEventListener('keyup',event=>keys.delete(event.key.length===1?event.key.toLowerCase():event.key));
  window.addEventListener('blur',()=>keys.clear());
  updateModeUi();
})();
