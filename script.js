// ---------- FUNDO PS2 CEREBRAL COM IA ----------

(function(){
  const canvas = document.createElement('canvas');
  canvas.id = 'ps2-bg';
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.zIndex = '-9999';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  const PARTICLE_COUNT = 120;
  const MAX_DISTANCE = 150;
  const particles = [];

  let mouse = { x: null, y: null, vx: 0, vy: 0, lastX: null, lastY: null };
  window.addEventListener('mousemove', e => {
    if(mouse.lastX !== null){
      mouse.vx = e.clientX - mouse.lastX;
      mouse.vy = e.clientY - mouse.lastY;
    }
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.lastX = e.clientX;
    mouse.lastY = e.clientY;
  });
  window.addEventListener('mouseout', () => {
    mouse.x = null;
    mouse.y = null;
    mouse.vx = 0;
    mouse.vy = 0;
  });

  canvas.addEventListener('click', e => {
    particles.forEach(p => {
      let dx = p.x - e.clientX;
      let dy = p.y - e.clientY;
      let dist = Math.sqrt(dx*dx + dy*dy);
      if(dist < 120){
        let angle = Math.atan2(dy, dx);
        p.vx += Math.cos(angle) * 2;
        p.vy += Math.sin(angle) * 2;
        p.energy = Math.min(p.energy + 0.5, 1);
      }
    });
  });

  for(let i=0;i<PARTICLE_COUNT;i++){
    particles.push({
      x: Math.random()*canvas.width,
      y: Math.random()*canvas.height,
      vx: (Math.random()-0.5)*1.2,
      vy: (Math.random()-0.5)*1.2,
      size: Math.random()*2+1,
      state: "calm",
      energy: Math.random()*0.2
    });
  }

  function updateState(p){
    if(p.energy > 0.7) p.state = "alert";
    else if(p.energy > 0.3) p.state = "curious";
    else p.state = "calm";
  }

  // ---------- WEBCAM ----------
  const video = document.createElement('video');
  video.autoplay = true;
  video.style.display = 'none';
  document.body.appendChild(video);

  navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => { video.srcObject = stream; })
    .catch(err => { console.error("Erro ao acessar a câmera:", err); });

  const camCanvas = document.createElement('canvas');
  const camCtx = camCanvas.getContext('2d');
  let prevFrame = null;

  function getMotionIntensity() {
    if(!video.videoWidth) return 0;
    camCanvas.width = video.videoWidth;
    camCanvas.height = video.videoHeight;
    camCtx.drawImage(video,0,0,camCanvas.width,camCanvas.height);
    const frame = camCtx.getImageData(0,0,camCanvas.width,camCanvas.height);
    if(!prevFrame){
      prevFrame = frame;
      return 0;
    }

    let diff = 0;
    for(let i=0;i<frame.data.length;i+=4){
      diff += Math.abs(frame.data[i] - prevFrame.data[i]);
      diff += Math.abs(frame.data[i+1] - prevFrame.data[i+1]);
      diff += Math.abs(frame.data[i+2] - prevFrame.data[i+2]);
    }
    prevFrame = frame;
    return diff / (frame.data.length);
  }

  // ---------- CÉREBRO IA ----------
  class BrainAI {
    constructor(particles){
      this.particles = particles;
      this.mood = 0; // -1 triste, 0 neutro, +1 animado
      this.tick = 0;
    }

    update(mouse, motionIntensity){
      // mood baseado em estímulos
      if(mouse.vx || mouse.vy) this.mood += 0.01;
      if(motionIntensity > 2) this.mood += 0.02;
      this.mood = Math.max(-1, Math.min(1, this.mood));

      // influencia partículas
      this.particles.forEach(p=>{
        if(this.mood > 0){
          p.energy = Math.min(p.energy + 0.01*this.mood, 1);
          p.vx += (Math.random()-0.5)*0.1*this.mood;
          p.vy += (Math.random()-0.5)*0.1*this.mood;
        } else if(this.mood < 0){
          p.energy = Math.max(p.energy + 0.01*this.mood, 0);
          p.vx += (Math.random()-0.5)*0.05*this.mood;
          p.vy += (Math.random()-0.5)*0.05*this.mood;
        }
      });
    }

    speak(){
      this.tick++;
      if(this.tick % 300 === 0){ // de vez em quando
        const msgs = ["Opa!", "Senti você!", "Move mais rápido!", "Calma aí...", "Ei, olha pra mim!"];
        const msg = msgs[Math.floor(Math.random()*msgs.length)];
        console.log("Cérebro IA:", msg);
      }
    }
  }

  const brain = new BrainAI(particles);

  // ---------- ANIMAÇÃO ----------
  function animate(){
    ctx.fillStyle = "rgba(0,0,0,0.15)";
    ctx.fillRect(0,0,canvas.width,canvas.height);

    const motionIntensity = getMotionIntensity() * 50;

    brain.update(mouse, motionIntensity);
    brain.speak();

    particles.forEach(p=>{
      // mouse
      if(mouse.x !== null && mouse.y !== null){
        let dx = mouse.x - p.x;
        let dy = mouse.y - p.y;
        let dist = Math.sqrt(dx*dx + dy*dy);
        if(dist < 150){
          let force = (150 - dist) / 150;
          p.vx += dx * 0.002 * force + mouse.vx*0.01;
          p.vy += dy * 0.002 * force + mouse.vy*0.01;
          p.energy = Math.min(p.energy + 0.01*force, 1);
        }
      }

      // webcam influencia movimento
      p.vx += (Math.random()-0.5) * motionIntensity * 0.002;
      p.vy += (Math.random()-0.5) * motionIntensity * 0.002;
      p.energy = Math.min(p.energy + motionIntensity*0.001, 1);

      updateState(p);

      // cores
      let color;
      if(p.state==="calm") color = `rgba(46,163,255,${0.5+p.energy/2})`;
      if(p.state==="curious") color = `rgba(255,200,0,${0.5+p.energy/2})`;
      if(p.state==="alert") color = `rgba(255,50,50,${0.5+p.energy/2})`;

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(p.x,p.y,p.size,0,Math.PI*2);
      ctx.fill();

      // movimento e bordas
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.98;
      p.vy *= 0.98;
      if(p.x<0||p.x>canvas.width)p.vx*=-1;
      if(p.y<0||p.y>canvas.height)p.vy*=-1;
      p.energy = Math.max(p.energy - 0.001,0);
    });

    // linhas sinapses
    for(let i=0;i<PARTICLE_COUNT;i++){
      for(let j=i+1;j<PARTICLE_COUNT;j++){
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx*dx+dy*dy);
        if(dist<MAX_DISTANCE){
          let alpha = (1-dist/MAX_DISTANCE)*(particles[i].energy+particles[j].energy)/2;
          ctx.strokeStyle = `rgba(46,163,255,${alpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(particles[i].x,particles[i].y);
          ctx.lineTo(particles[j].x,particles[j].y);
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(animate);
  }

  animate();
})();