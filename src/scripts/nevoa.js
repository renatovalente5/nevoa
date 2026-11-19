// NEVOA — a névoa dourada da capa (proposta A). WebGL, a meia resolução, só enquanto se vê; com «reduzir
// movimento» desenha um fotograma parado. Sem WebGL fica o fundo do CSS (os brilhos em gradiente).
(() => {
  const tela = document.querySelector('[data-nevoa]');
  if (!tela) return;
  const gl = tela.getContext('webgl', { antialias: false, alpha: false, premultipliedAlpha: false, powerPreference: 'low-power' });
  if (!gl) return;

  const VERT = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  const FRAG = `precision mediump float;
uniform vec2 r; uniform float t; uniform vec2 m;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);
  return mix(mix(h(i),h(i+vec2(1.,0.)),u.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),u.x),u.y);}
float fbm(vec2 p){float v=0.,a=.5;mat2 q=mat2(.8,.6,-.6,.8);for(int i=0;i<5;i++){v+=a*n(p);p=q*p*2.03+vec2(1.7,9.2);a*=.5;}return v;}
void main(){
  vec2 s=gl_FragCoord.xy/r;
  vec2 p=gl_FragCoord.xy/r.y*1.35+m*.06;
  float tt=t*.028;
  vec2 q=vec2(fbm(p+vec2(0.,tt)),fbm(p+vec2(5.2,1.3)-tt*.8));
  vec2 w=vec2(fbm(p+2.8*q+vec2(1.7,9.2)+tt*1.4),fbm(p+2.8*q+vec2(8.3,2.8)-tt*.9));
  float f=fbm(p+2.4*w+vec2(tt*.6,0.));
  float alto=smoothstep(.02,.95,s.y);
  float lado=.55+.45*smoothstep(.05,.95,s.x);
  float d=smoothstep(.38,.98,f)*alto*lado;
  vec3 fundo=vec3(.043,.039,.031);
  vec3 ambar=vec3(.49,.33,.13);
  vec3 ouro=vec3(.87,.70,.44);
  vec3 c=mix(fundo,ambar,d*.75);
  c=mix(c,ouro,pow(d,2.1)*.7);
  c+=ouro*pow(max(0.,f-.6),3.)*2.4*alto;
  c=mix(c,fundo,smoothstep(.62,0.,s.y)*.35);
  gl_FragColor=vec4(c,1.);
}`;
  const sh = (tipo, src) => { const s = gl.createShader(tipo); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; };
  const vs = sh(gl.VERTEX_SHADER, VERT), fs = sh(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return;
  const prog = gl.createProgram();
  gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const uR = gl.getUniformLocation(prog, 'r'), uT = gl.getUniformLocation(prog, 't'), uM = gl.getUniformLocation(prog, 'm');

  const ESCALA = 0.5;                     // meia resolução: a névoa é macia, não precisa de mais
  let w = 0, h = 0;
  const medir = () => {
    const q = tela.getBoundingClientRect();
    const nw = Math.max(2, Math.round(q.width * ESCALA)), nh = Math.max(2, Math.round(q.height * ESCALA));
    if (nw !== w || nh !== h) { w = nw; h = nh; tela.width = w; tela.height = h; gl.viewport(0, 0, w, h); }
  };
  const rato = { x: 0, y: 0, ax: 0, ay: 0 };
  addEventListener('pointermove', (e) => { rato.x = e.clientX / innerWidth - 0.5; rato.y = 0.5 - e.clientY / innerHeight; }, { passive: true });

  const reduzir = matchMedia('(prefers-reduced-motion: reduce)');
  const t0 = performance.now() - 40000 * Math.random();
  let visivel = true, id = 0, ultimo = 0;
  const desenhar = (agora) => {
    medir();
    rato.ax += (rato.x - rato.ax) * 0.03; rato.ay += (rato.y - rato.ay) * 0.03;
    gl.uniform2f(uR, w, h);
    gl.uniform1f(uT, (agora - t0) / 1000);
    gl.uniform2f(uM, rato.ax, rato.ay);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
  const ciclo = (agora) => {
    id = 0;
    if (!visivel || document.hidden || reduzir.matches) return;
    if (agora - ultimo > 33) { ultimo = agora; desenhar(agora); }   // ~30 fotogramas por segundo chegam
    id = requestAnimationFrame(ciclo);
  };
  const arrancar = () => { if (!id && visivel && !document.hidden && !reduzir.matches) id = requestAnimationFrame(ciclo); };
  desenhar(performance.now());
  requestAnimationFrame(() => tela.classList.add('pronta'));
  if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => { visivel = e.isIntersecting; arrancar(); }).observe(tela);
  document.addEventListener('visibilitychange', arrancar);
  reduzir.addEventListener('change', () => { desenhar(performance.now()); arrancar(); });
  addEventListener('resize', () => { if (reduzir.matches) desenhar(performance.now()); }, { passive: true });
  arrancar();
})();
