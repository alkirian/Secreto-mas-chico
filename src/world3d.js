import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

// Physics coordinates are pixels with Y down. The front edge of every mesh
// maps exactly onto its collider. Depth goes behind that plane, never onto it.
const WIDTH=1600,HEIGHT=900;
const palette={stone:0x34566a,edge:0x91b1ac,rock:0x203a4d,moss:0x527d6d,bronze:0xb49561,teal:0x8ef2d7,ink:0x112739};
const materials=new Map(),geometries=new Map();
function mat(color,options={}){const key=JSON.stringify([color,options]);if(!materials.has(key))materials.set(key,new THREE.MeshStandardMaterial({color,roughness:.85,...options}));return materials.get(key);}
function geo(w,h,d,bevel=0){const key=[w,h,d,bevel].join(',');if(!geometries.has(key)){const g=bevel?new RoundedBoxGeometry(w,h,d,2,Math.min(bevel,w/3,h/3,d/3)):new THREE.BoxGeometry(w,h,d);geometries.set(key,g);}return geometries.get(key);}
function box(parent,x,y,z,w,h,d,color,bevel=0,options={}){const m=new THREE.Mesh(geo(w,h,d,bevel),mat(color,options));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function ball(parent,x,y,z,r,color,options={}){const m=new THREE.Mesh(sphere,mat(color,options));m.scale.setScalar(r);m.position.set(x,y,z);m.castShadow=true;parent.add(m);return m;}
const sphere=new THREE.SphereGeometry(1,18,12),cylinder=new THREE.CylinderGeometry(1,1,1,10),cone=new THREE.ConeGeometry(1,1,7),ringGeo=new THREE.TorusGeometry(1,.12,7,24);
function beam(parent,a,b,r,color){const m=new THREE.Mesh(cylinder,mat(color));const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b);m.position.copy(start).add(end).multiplyScalar(.5);m.scale.set(r,start.distanceTo(end),r);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),end.sub(start).normalize());m.castShadow=true;parent.add(m);return m;}
const depthShear=new THREE.Matrix4().set(1,0,-.12,0,0,1,-.22,0,0,0,1,0,0,0,0,1);
function glowTexture(){const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d'),g=x.createRadialGradient(64,64,1,64,64,64);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.15,'rgba(255,255,255,.6)');g.addColorStop(.5,'rgba(255,255,255,.1)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,128,128);return new THREE.CanvasTexture(c);}
let glowMap;
function glow(parent,color,size,x=0,y=0,z=10){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:glowMap,color,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));s.position.set(x,y,z);s.scale.set(size,size,1);parent.add(s);return s;}
function rnd(seed){return (Math.sin(seed*127.1+311.7)*43758.5453)%1*.5+.5;}

class World3D{
constructor(){
this.canvas=document.querySelector('#world');this.renderer=new THREE.WebGLRenderer({canvas:this.canvas,antialias:true,alpha:false,powerPreference:'high-performance'});this.renderer.setSize(WIDTH,HEIGHT,false);this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.25));this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.2;this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
this.scene=new THREE.Scene();this.scene.background=new THREE.Color(0x102b42);this.scene.fog=new THREE.Fog(0x17384d,1550,3700);
this.camera=new THREE.OrthographicCamera(-800,800,450,-450,.1,5000);this.camera.position.set(800,450,1300);
this.scene.add(new THREE.HemisphereLight(0xb9dbf4,0x253b41,2.2));
this.sun=new THREE.DirectionalLight(0xffe3b6,3.3);this.sun.position.set(400,1200,650);this.sun.castShadow=true;this.sun.shadow.mapSize.set(1024,1024);Object.assign(this.sun.shadow.camera,{left:-1000,right:1000,top:750,bottom:-750,near:50,far:2500});this.sun.shadow.bias=-.0007;this.sun.shadow.normalBias=2;this.scene.add(this.sun,this.sun.target);
this.fill=new THREE.DirectionalLight(0x66d9e1,1.5);this.fill.position.set(-600,500,-300);this.scene.add(this.fill);
glowMap=glowTexture();this.platforms=new Map();this.enemyMeshes=new Map();this.ropeMeshes=new Map();this.background=[];this.buildSky();this.buildLandscape();this.hero=this.buildHero();this.orb=this.buildOrb();this.buildGates();
this.particleGeometry=new THREE.BufferGeometry();this.particlePositions=new Float32Array(1536);this.particleColors=new Float32Array(1536);this.particleGeometry.setAttribute('position',new THREE.BufferAttribute(this.particlePositions,3));this.particleGeometry.setAttribute('color',new THREE.BufferAttribute(this.particleColors,3));this.particleSystem=new THREE.Points(this.particleGeometry,new THREE.PointsMaterial({size:5,map:glowMap,transparent:true,vertexColors:true,depthWrite:false,blending:THREE.AdditiveBlending,sizeAttenuation:false}));this.particleSystem.frustumCulled=false;this.scene.add(this.particleSystem);
this.canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();window.dispatchEvent(new Event('blur'));document.querySelector('#renderNotice').textContent='La imagen se pausó. Recargá para volver a jugar.';});this.canvas.addEventListener('webglcontextrestored',()=>location.reload());
window.renderInfo=()=>({engine:'Three.js',revision:THREE.REVISION,drawCalls:this.renderer.info.render.calls,triangles:this.renderer.info.render.triangles,platforms:this.platforms.size});
}
buildSky(){
this.sky=new THREE.Mesh(new THREE.PlaneGeometry(7000,4000),new THREE.ShaderMaterial({depthWrite:false,uniforms:{},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 vUv;void main(){vec3 low=vec3(.09,.24,.28);vec3 high=vec3(.025,.065,.14);gl_FragColor=vec4(mix(low,high,smoothstep(.15,.8,vUv.y)),1.);}',fog:false}));this.sky.position.set(800,700,-2200);this.scene.add(this.sky);
this.moon=new THREE.Group();ball(this.moon,0,0,0,61,0xd2e5d8,{emissive:0x748e83,emissiveIntensity:.7,roughness:1});glow(this.moon,0x9ecac8,430,0,0,-10);this.moon.position.set(1260,735,-1700);this.scene.add(this.moon);
const positions=new Float32Array(600);for(let i=0;i<200;i++){positions[i*3]=rnd(i+10)*3600-1000;positions[i*3+1]=rnd(i+400)*1200+400;positions[i*3+2]=-1800;}this.stars=new THREE.Points(new THREE.BufferGeometry().setAttribute('position',new THREE.BufferAttribute(positions,3)),new THREE.PointsMaterial({color:0xa4d6e4,size:2,sizeAttenuation:false,transparent:true,opacity:.7}));this.scene.add(this.stars);
}
buildLandscape(){
for(let i=0;i<64;i++){const x=i*320-600,z=-550-rnd(i+90)*1000,h=160+rnd(i+120)*420;const g=new THREE.Group();g.position.set(x,50,z);const mountain=new THREE.Mesh(new THREE.ConeGeometry(250+rnd(i)*150,h,5),mat(i%2?0x27495b:0x31515f));mountain.position.y=h/2;mountain.rotation.y=i;g.add(mountain);this.scene.add(g);this.background.push(g);}
for(let i=0;i<42;i++){const g=new THREE.Group(),x=i*420-450,z=-230-(i%3)*120,h=240+(i%5)*60;g.position.set(x,0,z);const col=0x3a5866;box(g,0,h/2,0,45,h,65,col,5);box(g,0,h+12,0,70,25,82,col,4);box(g,0,16,0,74,32,85,col,4);
if(i%3!==1){box(g,235,h/2,0,45,h,65,col,5);const arch=new THREE.Mesh(new THREE.TorusGeometry(117,22,6,22,Math.PI),mat(col));arch.position.set(117,h-30,-8);g.add(arch);box(g,235,h+12,0,70,25,82,col,4);}
this.scene.add(g);this.background.push(g);}
}
buildPlatform(p){
const root=new THREE.Group();root.position.set(p.x,HEIGHT-p.y,0);const stone=new THREE.Group();stone.applyMatrix4(depthShear);root.add(stone);const h=p.h>100?Math.min(p.h,370):45,depth=p.kind==='wall'?95:115;
box(stone,p.w/2,-h/2,-depth/2,p.w,h,depth,palette.rock,6);
const count=Math.ceil(p.w/105),tile=p.w/count;for(let i=0;i<count;i++){box(stone,tile*(i+.5),-9,-depth/2,tile-2,18,depth+6,p.kind==='moving'?palette.bronze:palette.edge,3);if(h>80){for(let row=0;row<Math.min(3,Math.floor(h/58));row++)box(stone,tile*(i+.5),-43-row*58,3,tile-5,50,9,(i+row)%3?palette.stone:0x406171,3);}}
if(p.kind==='moving'||p.kind==='light'){box(stone,p.w/2,-27,8,p.w-20,5,5,palette.teal,1,{emissive:palette.teal,emissiveIntensity:1.6});for(const x of [20,p.w-20]){const gear=new THREE.Mesh(ringGeo,mat(palette.bronze,{metalness:.6}));gear.scale.setScalar(12);gear.position.set(x,-39,13);stone.add(gear);}if(p.kind==='moving'){beam(root,[p.w/2,-180,-140],[p.w/2,130,-140],5,0x3b6870);box(root,p.w/2,-120,-144,42,24,15,palette.bronze,3);}}
else if(p.kind==='wall'){for(let y=32;y<h-15;y+=37){const stripe=box(stone,p.w/2,-y,9,p.w-22,7,4,palette.teal,2,{emissive:0x338977,emissiveIntensity:.5});stripe.rotation.z=.12;}for(let y=20;y<h;y+=50){ball(stone,8,-y,12,3,palette.bronze);ball(stone,p.w-8,-y,12,3,palette.bronze);}}
else{for(let i=0;i<Math.floor(p.w/90);i++){const x=25+i*90;if(i%3===0)box(stone,x,-2,-72,48,5,30,palette.moss,2);const sprig=new THREE.Group();sprig.position.set(x,0,-92);for(let k=0;k<3;k++){const leaf=new THREE.Mesh(cone,mat(k===1?0x669b81:0x427862));leaf.scale.set(6,20+k*6,5);leaf.position.set(k*7,8+k*3,0);leaf.rotation.z=(k-1)*.4;sprig.add(leaf);}stone.add(sprig);}
if(p.h<100){for(const x of [18,p.w-18]){beam(root,[x,-40,-85],[x,-160,-100],4,palette.bronze);box(root,x,-158,-100,30,15,28,palette.stone,3);}box(root,p.w/2,-170,-125,p.w+50,20,45,0x294b60,4);}}
this.scene.add(root);return root;
}
buildHero(){const g=new THREE.Group();this.scene.add(g);const coat=box(g,0,35,12,33,33,24,0x739da1,9);box(g,-1,35,-3,28,28,15,0x345e6c,5);ball(g,0,63,13,18,0xefc7a2);const hair=ball(g,0,72,10,19,0x243446);hair.scale.y=9;box(g,-15,62,14,8,20,14,0x243446,3);
const eyeA=ball(g,7,63,29,2.5,0x132b34),eyeB=ball(g,-4,63,29,2.5,0x132b34);this.heroEyes=[eyeA,eyeB];box(g,0,49,15,39,9,29,0xf37c66,3);this.scarf=box(g,-27,44,10,34,11,5,0xe16759,3);
this.legs=[box(g,-10,13,12,13,23,17,0x253447,4),box(g,10,13,12,13,23,17,0x253447,4)];this.arms=[box(g,-22,34,12,10,26,13,0x96b9b2,4),box(g,22,34,12,10,26,13,0x96b9b2,4)];this.hands=[ball(g,-22,19,13,6,0xeac5a8),ball(g,22,19,13,6,0xeac5a8)];
this.heroShadow=new THREE.Mesh(new THREE.CircleGeometry(1,24),new THREE.MeshBasicMaterial({color:0x071522,transparent:true,opacity:.28,depthWrite:false}));this.heroShadow.scale.set(30,6,1);this.scene.add(this.heroShadow);return g;}
buildOrb(){const g=new THREE.Group();ball(g,0,0,0,16,0xffd16b,{emissive:0xffbe45,emissiveIntensity:1.5,roughness:.3});this.orbEyes=[ball(g,-5,-1,15,2.4,0x4b3528),ball(g,5,-1,15,2.4,0x4b3528)];this.orbGlow=glow(g,0xffb750,170,0,0,0);this.orbLight=new THREE.PointLight(0xffce75,13000,280,1.6);g.add(this.orbLight);this.scene.add(g);return g;}
buildEnemy(){const g=new THREE.Group();const body=ball(g,0,18,10,24,0x816399);body.scale.y=17;const cap=ball(g,0,29,10,23,0xc0a5d2);cap.scale.y=10;for(const x of [-12,0,12])box(g,x,5,13,8,12,12,0x443c61,3);for(const x of [-8,8])ball(g,x,19,31,3.3,0x211e3b);this.scene.add(g);return g;}
buildRope(r){const g=new THREE.Group();g.position.set(r.x,HEIGHT-r.y,0);box(g,0,5,-90,170,25,80,palette.stone,4);beam(g,[-70,10,-50],[0,-5,0],6,palette.bronze);beam(g,[70,10,-50],[0,-5,0],6,palette.bronze);const line=new THREE.Mesh(cylinder,mat(0xc2a978));g.add(line);const handle=new THREE.Mesh(ringGeo,mat(palette.teal,{emissive:0x427366,emissiveIntensity:.5}));handle.scale.setScalar(14);g.add(handle);this.scene.add(g);return{root:g,line,handle};}
buildGates(){this.gates=[];for(const [x,y,h] of [[3770,710,320],[5540,770,240]]){const g=new THREE.Group();g.position.set(x,HEIGHT-y,0);for(const side of [-55,55])box(g,side,h/2,-15,38,h,85,palette.stone,4);box(g,0,h,-15,170,30,90,palette.edge,4);const curtain=box(g,0,h/2,-8,74,h-15,12,palette.teal,2,{transparent:true,opacity:.48,emissive:0x469c83,emissiveIntensity:1});this.gates.push(curtain);this.scene.add(g);}
this.switch=box(this.scene,5250,HEIGHT-750,0,100,24,80,palette.bronze,6);this.switchLamp=ball(this.scene,5250,HEIGHT-730,45,12,palette.teal,{emissive:palette.teal,emissiveIntensity:1});
const mechanism=new THREE.Group();mechanism.position.set(2510,HEIGHT-568,-45);const wheel=new THREE.Mesh(ringGeo,mat(palette.bronze,{metalness:.65}));wheel.scale.setScalar(28);mechanism.add(wheel);ball(mechanism,0,0,0,9,palette.teal,{emissive:palette.teal,emissiveIntensity:1});this.scene.add(mechanism);}
draw(s){
const {t,cam,player:p,orb:o}=s;const blend=s.cinema?.blend||0,focusX=THREE.MathUtils.lerp(cam+800,p.x+60,blend),focusY=THREE.MathUtils.lerp(450,HEIGHT-p.y+4,blend),arc=Math.sin((s.cinema?.time||0)*.22)*.025*blend;
this.camera.zoom=1+1.7*blend;this.camera.position.set(focusX+Math.sin(arc)*1300,focusY+30*blend,1300);this.camera.lookAt(focusX,focusY,0);this.camera.updateProjectionMatrix();this.sky.position.x=cam+800;this.moon.position.x=cam+1260-cam*.035;this.stars.position.x=cam*.8;this.sun.position.set(cam+400,1250,750);this.sun.target.position.set(cam+800,350,-40);this.sun.target.updateMatrixWorld();
for(const b of this.background)b.visible=Math.abs(b.position.x-cam-800)<1600;
const live=new Set(s.platforms);for(const [key,m] of this.platforms)if(!live.has(key)){this.scene.remove(m);this.platforms.delete(key);}for(const p of s.platforms){let m=this.platforms.get(p);if(!m){m=this.buildPlatform(p);this.platforms.set(p,m);}m.position.y=HEIGHT-p.y;m.visible=p.x+p.w>cam-150&&p.x<cam+1750;}
for(const [e,m] of this.enemyMeshes)if(!s.enemies.includes(e)){this.scene.remove(m);this.enemyMeshes.delete(e);}for(const e of s.enemies){let m=this.enemyMeshes.get(e);if(!m){m=this.buildEnemy();this.enemyMeshes.set(e,m);}m.visible=e.alive&&Math.abs(e.x-cam-800)<920;m.position.set(e.x+23,HEIGHT-e.y-36,20);m.rotation.z=Math.sin(t*8+e.min)*.035;}
for(const [r,m] of this.ropeMeshes)if(!s.ropes.includes(r)){this.scene.remove(m.root);this.ropeMeshes.delete(r);}for(const r of s.ropes){let m=this.ropeMeshes.get(r);if(!m){m=this.buildRope(r);this.ropeMeshes.set(r,m);}const dx=r.tipX-r.x,dy=-(r.tipY-r.y);m.line.position.set(dx/2,dy/2,10);m.line.scale.set(3.5,r.len,3.5);m.line.rotation.z=r.angle;m.handle.position.set(dx,dy,12);m.root.visible=Math.abs(r.x-cam-800)<1400;}
this.hero.position.set(p.x+19,HEIGHT-p.y-62,25);this.hero.scale.set(1+p.squash,(1-p.squash)*(1+Math.sin(t*2.2)*.008*blend),1);this.hero.visible=!(p.invincible>0&&Math.sin(t*24)<-.5);const stride=Math.sin(t*17)*Math.min(Math.abs(p.vx)/350,1);this.legs.forEach((m,i)=>{m.rotation.z=(p.ground?stride*.35: .22)*(i?1:-1);});this.arms.forEach((m,i)=>{m.position.y=p.rope?61:34;m.rotation.z=p.rope?(i?-0.25:.25):(i?1:-1)*stride*.22;m.scale.y=p.rope?1.55:1;this.hands[i].position.y=p.rope?82:19;});this.scarf.position.x=-p.face*29;this.scarf.rotation.z=p.face*(.15+Math.sin(t*9)*.12);this.heroEyes.forEach((e,i)=>e.position.x=(blend>.3?Math.sign(o.x-p.x):p.face)*7+(i?-8:3));
const floor=s.platforms.filter(f=>p.x+38>f.x&&p.x<f.x+f.w&&f.y>=p.y+60).sort((a,b)=>a.y-b.y)[0];this.heroShadow.visible=!!floor;if(floor){this.heroShadow.position.set(p.x+19,HEIGHT-floor.y+2,27);this.heroShadow.material.opacity=Math.max(.06,.28-(floor.y-p.y-62)*.0007);}
this.orb.position.set(o.x,HEIGHT-o.y,o.z??55);this.orb.rotation.z=THREE.MathUtils.clamp(-o.vx*.0015,-.22,.22);this.orb.scale.set(1+Math.sin(t*3)*.05,1-Math.sin(t*3)*.035,1);this.orbGlow.material.opacity=.75+Math.sin(t*2)*.1;this.orbEyes.forEach((e,i)=>{e.position.x=(i?5:-5)+Math.max(-3,Math.min(3,(p.x-o.x)*.035));e.scale.y=Math.sin(t*.7)>.995?.5:2.4;});
this.gates[0].visible=!s.gate;this.gates[1].visible=!s.switchOn;this.switchLamp.material=s.switchOn?mat(0xadf9c9,{emissive:0x5cc68d,emissiveIntensity:1}):mat(0xffc76c,{emissive:0xb97926,emissiveIntensity:1});
let n=0;const color=new THREE.Color();for(const v of s.particles){if(n>=512)break;this.particlePositions.set([v.x,HEIGHT-v.y,70],n*3);color.set(v.color).multiplyScalar(Math.max(0,v.life/v.max));this.particleColors.set([color.r,color.g,color.b],n*3);n++;}this.particleGeometry.setDrawRange(0,n);this.particleGeometry.attributes.position.needsUpdate=true;this.particleGeometry.attributes.color.needsUpdate=true;
this.renderer.render(this.scene,this.camera);
// DOM-backed diagnostics for browser QA; no debug controls enter the game UI.
this.frames=(this.frames||0)+1;if(this.frames%120===0){this.canvas.dataset.engine='Three.js '+THREE.REVISION;this.canvas.dataset.drawCalls=String(this.renderer.info.render.calls);this.canvas.dataset.triangles=String(this.renderer.info.render.triangles);this.canvas.dataset.frames=String(this.frames);this.canvas.dataset.cinematic=s.cinema?.stage||'none';this.canvas.dataset.zoom=this.camera.zoom.toFixed(2);}
}
}
try{window.secretWorld=new World3D();}catch(error){console.error('No se pudo iniciar Three.js',error);document.querySelector('#renderNotice').textContent='Este navegador no pudo iniciar los gráficos 3D. Se usará la vista 2D.';document.querySelector('#world').style.display='none';}

