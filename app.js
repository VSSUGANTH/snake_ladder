(() => {
  const canvas = document.getElementById('board');
  const ctx = canvas.getContext('2d');
  let dpr = window.devicePixelRatio || 1;
  function resize(){ canvas.width = Math.floor(canvas.clientWidth * dpr); canvas.height = Math.floor(canvas.clientHeight * dpr); cell = Math.floor(canvas.width/10); draw(); }
  window.addEventListener('resize', ()=>{ dpr = window.devicePixelRatio || 1; resize(); });

  const bgm = document.getElementById('bgm');
  const newGameBtn = document.getElementById('newGame');
  const rollBtn = document.getElementById('rollBtn');
  const muteBtn = document.getElementById('muteBtn');
  const logEl = document.getElementById('log');
  const turnEl = document.getElementById('turn');
  const diceEl = document.getElementById('dice');
  const movesEl = document.getElementById('moves');
  const playersCountEl = document.getElementById('playersCount');

  let cell = 64;
  resize();

  function cellXY(n){
    const idx = n-1;
    const row = 9 - Math.floor(idx/10);
    let col = idx % 10;
    if((9-row) % 2 === 1) col = 9 - col;
    return {x: col, y: row};
  }

  const snakes = {16:6, 48:30, 62:19, 88:24, 95:56, 97:78};
  const ladders = {2:38, 7:14, 8:31, 15:26, 28:84, 36:44, 46:68, 49:60, 51:67, 71:91};

  let powerups = {};
  function randomlyPlacePowerups(){
    powerups = {};
    const types = ['extra','shield','speed'];
    let placed = 0;
    while(placed < 6){
      const pos = Math.floor(Math.random()*98)+2;
      if(snakes[pos] || ladders[pos] || powerups[pos]) continue;
      powerups[pos] = types[Math.floor(Math.random()*types.length)];
      placed++;
    }
  }

  let players = [{pos:0, color:'#ef4444', name:'P1', shield:0},{pos:0, color:'#0ea5e9', name:'P2', shield:0}];
  let current = 0;
  let moves = 0;
  let rolling = false;

  function log(msg){ const p = document.createElement('div'); p.textContent = msg; logEl.prepend(p); }

  function newGame(){
    players = [{pos:0, color:'#ef4444', name:'P1', shield:0},{pos:0, color:'#0ea5e9', name:'P2', shield:0}];
    current = 0; moves = 0; rolling = false;
    randomlyPlacePowerups();
    updateHud();
    draw();
    log('New game started. Power-ups randomized.');
    bgm.play().catch(()=>{});
  }

  function updateHud(){
    turnEl.textContent = (current+1);
    diceEl.textContent = '-';
    movesEl.textContent = moves;
    playersCountEl.textContent = players.length;
  }

  function rollDice(){
    if(rolling) return;
    rolling = true;
    const roll = Math.floor(Math.random()*6)+1;
    diceEl.textContent = roll;
    log(players[current].name + ' rolled ' + roll);
    let steps = roll;
    const stepFn = () => {
      if(steps<=0){
        handleTile(players[current].pos);
        if(players[current].pos >= 100){
          log(players[current].name + ' wins!');
          rolling = false; return;
        }
        current = (current+1) % players.length;
        updateHud();
        rolling = false;
        return;
      }
      // speed boost: if active, move two cells per step (consumes boost)
      if(players[current].speedBoost){
        players[current].pos = Math.min(100, players[current].pos + 2);
      } else {
        players[current].pos = Math.min(100, players[current].pos + 1);
      }
      steps--;
      draw();
      setTimeout(stepFn, 160);
    };
    stepFn();
  }

  function handleTile(pos){
    moves++;
    if(powerups[pos]){
      const t = powerups[pos];
      delete powerups[pos];
      if(t==='extra'){
        log(players[current].name + ' picked Extra Move!');
        setTimeout(()=>{ rollDice(); }, 400);
      } else if(t==='shield'){
        players[current].shield = 1;
        log(players[current].name + ' picked Shield (immunity to next snake).');
      } else if(t==='speed'){
        players[current].speedBoost = true;
        log(players[current].name + ' picked Speed Boost (double movement next moves).');
      }
    }
    if(snakes[pos]){
      if(players[current].shield > 0){
        players[current].shield--;
        log(players[current].name + ' avoided a snake bite using Shield!');
      } else {
        const to = snakes[pos];
        players[current].pos = to;
        log(players[current].name + ' got bitten by a snake! Slid to ' + to);
      }
    }
    if(ladders[pos]){
      const to = ladders[pos];
      players[current].pos = to;
      log(players[current].name + ' climbed a ladder to ' + to + '!');
    }
    draw();
    updateHud();
  }

  function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = '#fffaf0';
    ctx.fillRect(0,0,canvas.width,canvas.height);

    for(let r=0;r<10;r++){
      for(let c=0;c<10;c++){
        const x = c*cell; const y = r*cell;
        ctx.fillStyle = ((r+c)%2===0)?'#fff':'#f3f4f6';
        ctx.fillRect(x,y,cell-2,cell-2);
        const rowFromTop = r;
        const rowIndex = 9-rowFromTop;
        let n;
        if((9-rowIndex)%2===0){
          n = rowIndex*10 + c + 1;
        } else {
          n = rowIndex*10 + (9-c) + 1;
        }
        ctx.fillStyle = '#111827';
        ctx.font = `${12*dpr}px sans-serif`;
        ctx.fillText(n, x+6, y+16);
      }
    }

    ctx.lineWidth = 6*dpr;
    Object.keys(snakes).forEach(s=>{
      const from = parseInt(s,10), to = snakes[s];
      const a = cellXY(from); const b = cellXY(to);
      drawSnakeOrLadder(a.x,a.y,b.x,b.y,'snake');
    });
    Object.keys(ladders).forEach(l=>{
      const from = parseInt(l,10), to = ladders[l];
      const a = cellXY(from); const b = cellXY(to);
      drawSnakeOrLadder(a.x,a.y,b.x,b.y,'ladder');
    });

    Object.keys(powerups).forEach(p=>{
      const pos = parseInt(p,10);
      const pt = cellXY(pos);
      const cx = pt.x*cell + cell/2; const cy = pt.y*cell + cell/2;
      ctx.font = `${24*dpr}px sans-serif`;
      let icon = '🍀';
      if(powerups[p]==='shield') icon='🛡️';
      if(powerups[p]==='speed') icon='⚡';
      ctx.fillText(icon, cx-10, cy+10);
    });

    players.forEach((pl,idx)=>{
      const pos = Math.max(0, pl.pos||0) || 0;
      const p = pos===0 ? {x:0,y:9} : cellXY(pos);
      const cx = p.x*cell + cell*0.2 + idx*12;
      const cy = p.y*cell + cell*0.6;
      ctx.fillStyle = pl.color;
      ctx.beginPath();
      ctx.arc(cx,cy,10*dpr,0,Math.PI*2);
      ctx.fill();
      if(pl.shield) {
        ctx.strokeStyle='#facc15'; ctx.lineWidth=3; ctx.stroke();
      }
    });
  }

  function cellXY(n){
    if(n<=0) return {x:0,y:9};
    const idx = n-1;
    const row = 9 - Math.floor(idx/10);
    let col = idx % 10;
    if((9-row)%2===1) col = 9 - col;
    return {x:col,y:row};
  }

  function drawSnakeOrLadder(cx,cy,tx,ty,type){
    const sx = cx*cell + cell/2; const sy = cy*cell + cell/2;
    const ex = tx*cell + cell/2; const ey = ty*cell + cell/2;
    ctx.beginPath();
    if(type==='snake'){
      ctx.strokeStyle = '#6b21a8'; ctx.lineWidth = 6*dpr;
      ctx.moveTo(sx,sy);
      const mx = (sx+ex)/2 + (Math.random()*40-20);
      const my = (sy+ey)/2 + (Math.random()*40-20);
      ctx.quadraticCurveTo(mx,my,ex,ey);
      ctx.stroke();
      ctx.fillStyle = '#7c3aed';
      ctx.beginPath(); ctx.arc(sx,sy,8*dpr,0,Math.PI*2); ctx.fill();
    } else {
      ctx.strokeStyle = '#16a34a'; ctx.lineWidth = 6*dpr;
      ctx.moveTo(sx,sy); ctx.lineTo(ex,ey); ctx.stroke();
      const steps = Math.max(3, Math.floor(Math.hypot(ex-sx,ey-sy)/(cell/3)));
      for(let i=1;i<steps;i++){
        const px = sx + (ex-sx)*(i/steps);
        const py = sy + (ey-sy)*(i/steps);
        ctx.beginPath(); ctx.moveTo(px-8,py-8); ctx.lineTo(px+8,py+8); ctx.stroke();
      }
    }
  }

  newGameBtn.addEventListener('click', newGame);
  rollBtn.addEventListener('click', ()=>{ if(!rolling) rollDice(); });
  muteBtn.addEventListener('click', ()=>{
    if(bgm.paused){ bgm.play().catch(()=>{}); muteBtn.textContent='Toggle Music'; }
    else { bgm.pause(); muteBtn.textContent='Unmute Music'; }
  });

  newGame();
})();