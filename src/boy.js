import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

const clamp=THREE.MathUtils.clamp,lerp=THREE.MathUtils.lerp;
const sphere=new THREE.SphereGeometry(1,28,20);
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));

// The rig faces +Z. All limb meshes hang from their actual joint, in game units.
export function createBoy(){
  const root=new THREE.Group(),hips=new THREE.Group(),torso=new THREE.Group(),head=new THREE.Group();
  root.name='boy';hips.name='hips';torso.name='torso';head.name='head';
  root.add(hips);hips.add(torso);torso.add(head);hips.position.y=28;head.position.y=27;
  const materials={};
  for(const [name,color] of Object.entries({skin:0xf2b68e,ear:0xd7826b,hair:0x301911,lock:0x45251b,highlight:0x613529,sweater:0x303c56,rib:0x242e44,seam:0x46516a,pants:0x1c2130,shoe:0x293242,sole:0x6e7782,white:0xfff5e7,iris:0x743a1d,pupil:0x23140e,mouth:0x6a3027})){
    materials[name]=new THREE.MeshStandardMaterial({color,roughness:name==='iris'?.35:.83});
  }
  function mesh(parent,geometry,material,x,y,z,sx=1,sy=1,sz=1){
    const m=new THREE.Mesh(geometry,typeof material==='string'?materials[material]:material);
    m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
  }
  const ell=(p,x,y,z,sx,sy,sz,m)=>mesh(p,sphere,m,x,y,z,sx,sy,sz);
  const soft=(p,x,y,z,w,h,d,r,m)=>mesh(p,new RoundedBoxGeometry(w,h,d,3,r),m,x,y,z);
  function joint(parent,x,y,z,name){const g=new THREE.Group();g.position.set(x,y,z);g.name=name;parent.add(g);return g;}
  function curve(parent,points,r,material){return mesh(parent,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),20,r,6,false),material,0,0,0);}
  function artwork(draw){const c=document.createElement('canvas');c.width=512;c.height=256;draw(c.getContext('2d'));const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;return new THREE.MeshStandardMaterial({map:texture,transparent:true,depthWrite:false,roughness:1});}

  const sweaterProfile=[[0,12.5],[2,14],[6,14.5],[18,15],[22,13.5],[25,9],[26,6]].map(([y,r])=>new THREE.Vector2(r,y));
  mesh(torso,new THREE.LatheGeometry(sweaterProfile,40),'sweater',0,0,0,1,1,.72);
  soft(torso,0,.8,0,29.5,4,20.5,1.5,'rib');
  ell(torso,0,26,0,5.7,7,5.8,'skin');
  const collar=mesh(torso,new THREE.TorusGeometry(6.2,1.5,8,32),'rib',0,25,0);collar.rotation.x=Math.PI/2;
  // Small ribbed cuffs, hem and shoulder seams read well in cinematic closeups.
  for(let x=-12;x<=12;x+=2)curve(torso,[[x,-.6,10.2],[x,2,10.3]],.16,'seam');
  for(const side of [-1,1])curve(torso,[[side*6,25,6],[side*12,22,7],[side*14,18,6]],.28,'seam');
  const logo=artwork(ctx=>{
    ctx.fillStyle='#a8cfe5';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 112px cursive';
    ctx.fillText('Bluey',256,155);ctx.save();ctx.translate(249,49);ctx.rotate(-.15);
    ctx.beginPath();ctx.ellipse(-19,0,12,30,0,0,Math.PI*2);ctx.ellipse(16,0,12,29,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#689ab6';ctx.beginPath();ctx.ellipse(-19,0,5,20,0,0,Math.PI*2);ctx.fill();ctx.restore();
  });
  const printGeometry=new THREE.PlaneGeometry(23,11.5,24,12),printPos=printGeometry.attributes.position;
  for(let i=0;i<printPos.count;i++){
    const y=printPos.getY(i)+15,r=y<=18?14.5+(y-6)/24:15-(y-18)*.375;
    printPos.setZ(i,Math.sqrt(Math.max(0,r*r-printPos.getX(i)**2))*.72+.12);
  }
  printGeometry.computeVertexNormals();mesh(torso,printGeometry,logo,0,15,0).castShadow=false;
  soft(hips,0,-1,-.3,23,8,16,3,'pants');

  // A round forehead, tapered chin, warm ears and a small lifted nose.
  const faceGeometry=sphere.clone(),pos=faceGeometry.attributes.position;
  for(let i=0;i<pos.count;i++){const y=pos.getY(i);pos.setX(i,pos.getX(i)*(1-.12*Math.max(0,-y)));}
  faceGeometry.computeVertexNormals();mesh(head,faceGeometry,'skin',0,13,0,18.5,21,15);
  for(const side of [-1,1]){
    ell(head,side*18.1,12,-.4,4.1,6,3.5,'skin');ell(head,side*19,12,2,2.2,3.7,1.1,'ear');
  }
  ell(head,0,7.7,15,2.6,3,3,'skin');ell(head,0,6.7,17,2.2,1.6,1.3,'skin');
  const cheekMaterial=artwork(ctx=>{const g=ctx.createRadialGradient(256,128,0,256,128,124);g.addColorStop(0,'rgba(233,105,91,.58)');g.addColorStop(1,'rgba(233,105,91,0)');ctx.fillStyle=g;ctx.fillRect(0,0,512,256);});
  for(const side of [-1,1]){const cheek=mesh(head,new THREE.PlaneGeometry(11,7),cheekMaterial,side*10.8,6,12.8);cheek.rotation.y=side*.48;cheek.castShadow=false;}
  const eyes=[];
  for(const side of [-1,1]){
    const eye=joint(head,side*7.2,13.5,14,side<0?'left-eye':'right-eye');eye.rotation.y=side*.38;
    ell(eye,0,0,0,4.9,5.2,1.55,'white');
    const iris=joint(eye,0,-.15,1.3,'iris');ell(iris,0,0,0,3,3.6,.8,'iris');ell(iris,0,0,.65,1.65,2.4,.35,'pupil');
    const shine=ell(iris,-.9,1.45,.95,.95,1.12,.2,'white');shine.castShadow=false;
    ell(iris,.8,-1,.95,.35,.4,.15,'white').castShadow=false;
    curve(eye,[[-4.8,1.4,.5],[-3.3,4.3,1.2],[0,5.3,1.3],[3.2,4.1,1.1],[4.8,1.1,.5]],.43,'hair');
    curve(head,[[side*3,21,13],[side*6.6,22.7,13.4],[side*11.2,21.6,11.5]],.85,'lock');
    eyes.push({eye,iris});
  }
  const mouth=ell(head,0,1.4,12.6,2,1.25,.65,'mouth');
  curve(head,[[-2,-.1,12],[0,-.65,12.7],[2,-.1,12]],.32,'ear');

  // Swept, tapered locks, rather than a flat helmet or stacked spheres.
  const hair=joint(head,0,0,0,'hair');
  mesh(hair,new THREE.SphereGeometry(1,32,20,0,Math.PI*2,0,Math.PI*.59),'hair',0,23,-1.5,20,15.8,16);
  ell(hair,0,18,-9,17,16,8,'hair');
  function lock(points,width,depth,material='lock'){
    const path=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),vertices=[],indices=[],n=22,sides=10;
    const tangent=new THREE.Vector3(),across=new THREE.Vector3(),forward=new THREE.Vector3(0,0,1);
    for(let i=0;i<=n;i++){
      const u=i/n,center=path.getPoint(u);path.getTangent(u,tangent);across.crossVectors(tangent,forward).normalize();
      const taper=Math.max(.025,Math.sin(Math.PI*(.12+u*.88))**.7);
      for(let j=0;j<sides;j++){const a=j/sides*Math.PI*2;vertices.push(center.x+across.x*Math.cos(a)*width*taper,center.y+across.y*Math.cos(a)*width*taper,center.z+Math.sin(a)*depth*taper);}
    }
    for(let i=0;i<n;i++)for(let j=0;j<sides;j++){const a=i*sides+j,b=i*sides+(j+1)%sides;indices.push(a,a+sides,b,b,a+sides,b+sides);}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();mesh(hair,g,material,0,0,0);
  }
  lock([[5,36,4],[-6,33,12],[-14,24,13],[-16,15,8]],6,2.7);
  lock([[5,35,7],[1,30,14],[-7,24,15],[-13,22,12]],4.8,2.2);
  lock([[6,36,6],[11,31,12],[14,23,13],[15,17,9]],5.2,2.6);
  lock([[10,34,2],[18,31,6],[20,24,5],[18,16,1]],4.3,2.6);
  lock([[-8,34,3],[-17,28,7],[-19,19,4],[-17,10,0]],4.5,2.2);
  lock([[5,36,0],[-1,40,0],[-9,38,0]],3,1.5);
  lock([[5,36,-1],[6,42,-1],[11,43,-2]],2.7,1.4);
  lock([[11,34,-1],[19,33,-1],[25,35,-2]],3.8,1.8);
  for(const points of [[[3,36,8],[-4,32,14],[-12,25,15]],[[7,35,9],[10,30,15],[14,24,15]],[[-9,33,9],[-15,27,12],[-18,21,9]]])curve(hair,points,.25,'highlight');

  const legs=[],arms=[];
  for(const side of [-1,1]){
    const thigh=joint(hips,side*7,-1,0,side<0?'left-hip':'right-hip');
    mesh(thigh,new THREE.CapsuleGeometry(5.3,7,6,16),'pants',0,-5.5,0,1,1,1.08);
    const knee=joint(thigh,0,-12,0,'knee');mesh(knee,new THREE.CapsuleGeometry(4.5,7,6,16),'pants',0,-5.3,0,1,1,1.08);
    const ankle=joint(knee,0,-11.5,0,'ankle');
    soft(ankle,0,-1,2,10.5,5,16,2,'shoe');soft(ankle,0,-2.8,2,10.6,1.4,16, .6,'sole');
    for(const y of [1.5,4])curve(ankle,[[-2,.9,y],[2,.9,y]],.28,'seam');
    legs.push({thigh,knee,ankle});
    const shoulder=joint(torso,side*16,22,0,side<0?'left-shoulder':'right-shoulder');
    mesh(shoulder,new THREE.CapsuleGeometry(5,6,6,16),'sweater',side*.6,-5,0,1,1,1.1);
    const elbow=joint(shoulder,side*.7,-11,0,'elbow');mesh(elbow,new THREE.CapsuleGeometry(4.4,5,6,16),'sweater',0,-4.4,0,1,1,1.08);soft(elbow,0,-10,0,8.7,3,10,1,'rib');
    const hand=joint(elbow,0,-13,0,'hand');ell(hand,0,-1.5,.2,3.5,4.6,2.6,'skin');ell(hand,-side*2.6,-.3,1.3,1.4,2.5,1.5,'skin');
    for(const x of [-1.4,0,1.4])ell(hand,x,-4, .7,.8,1.8,1.2,'skin');
    arms.push({shoulder,elbow,hand});
  }

  let lastTime,phase=0,run=0,air=0,wasGround=true,landing=0,lookWeight=0;
  const target=new THREE.Vector3(),localTarget=new THREE.Vector3();
  function update(s,floatWeight=0,floatTime=s.t){
    const {t,player:p,orb:o}=s,elapsed=lastTime===undefined?1/60:t-lastTime;
    const reset=lastTime===undefined||elapsed<0||elapsed>.25,dt=reset?1/60:clamp(elapsed,0,.05);lastTime=t;
    const damp=(v,dest,speed=12)=>lerp(v,dest,1-Math.exp(-speed*dt));
    const turn=(v,dest,speed)=>v+wrap(dest-v)*(1-Math.exp(-speed*dt));
    const speed=Math.abs(p.vx||0),ground=!!p.ground,cinematic=!!s.cinema?.stage||floatWeight>.01;
    if(reset){wasGround=ground;landing=0;air=ground?0:1;}
    if(ground&&!wasGround)landing=1;wasGround=ground;landing*=Math.exp(-11*dt);
    run=damp(run,ground&&!p.rope?clamp(speed/320,0,1):0,9);
    air=damp(air,!ground&&!p.rope&&!floatWeight?1:0,13);
    phase+=dt*speed*.062;
    lookWeight=damp(lookWeight,cinematic?1:0,6);
    const floatHeight=(37+Math.sin(floatTime*1.45)*5+Math.sin(floatTime*.73)*2)*floatWeight;
    root.position.set(p.x+19,900-p.y-62+floatHeight,25);
    root.visible=!(p.invincible>0&&Math.sin(t*24)<-.5);
    const squash=clamp((p.squash||0)*.45,-.1,.1);
    root.scale.set(1+squash,1-squash,1+squash*.4);
    root.rotation.z=(Math.sin(floatTime*.95)*.028-.015)*floatWeight;
    target.set(o.x,900-o.y,o.z??55);
    const facing=(p.face||1)*1.12,orbYaw=Math.atan2(target.x-root.position.x,target.z-root.position.z);
    const desiredYaw=facing+wrap(orbYaw-facing)*lookWeight;
    root.rotation.y=reset?desiredYaw:turn(root.rotation.y,desiredYaw,cinematic?5:11);
    const bounce=(.9-Math.cos(phase*2)*.9)*run;
    hips.position.y=28+bounce-landing*2.1+Math.sin(t*2)*.22*(1-run);
    torso.rotation.x=damp(torso.rotation.x,.13*run-.09*air+.018*Math.sin(t*2));
    torso.rotation.z=damp(torso.rotation.z,Math.sin(phase)*.045*run);
    torso.rotation.y=damp(torso.rotation.y,Math.sin(phase)*.075*run);

    legs.forEach(({thigh,knee,ankle},i)=>{
      const a=phase+i*Math.PI,swing=Math.sin(a),lift=Math.max(0,Math.cos(a));
      let hip=-swing*.78*run,fold=(.13+lift*.95)*run+landing*.28,foot=-hip-fold*.7;
      // Lift-off gathers the knees; descent opens the legs for a soft landing.
      const rising=clamp(-(p.vy||0)/500,0,1),falling=clamp((p.vy||0)/650,0,1);
      hip=lerp(hip,i===0?-.55-.3*rising:.18+.24*falling,air);
      fold=lerp(fold,i===0?.65+.35*rising:.9-.65*falling,air);foot=lerp(foot,-.2,air);
      hip=lerp(hip,i===0?-.16:.12,floatWeight);fold=lerp(fold,.18,floatWeight);
      if(p.rope){hip=i===0?-.6:.12;fold=i===0?1:.45;foot=-.1;}
      thigh.rotation.x=damp(thigh.rotation.x,hip,18);knee.rotation.x=damp(knee.rotation.x,fold,18);ankle.rotation.x=damp(ankle.rotation.x,foot,18);
    });
    arms.forEach(({shoulder,elbow,hand},i)=>{
      const side=i===0?-1:1,a=phase+i*Math.PI;
      let swing=Math.sin(a)*.65*run-.04,bend=-.2-.7*run,spread=side*(.07+air*.22);
      swing=lerp(swing,-.55+clamp((p.vy||0)/800,-.4,.5),air);bend=lerp(bend,-.65,air);
      swing=lerp(swing,-.1+Math.sin(floatTime*1.2+i)*.035,floatWeight);spread+=side*.1*floatWeight;
      if(p.rope){swing=-2.8;spread=side*.12;bend=-.2;}
      if(p.wall&&!ground&&!p.rope){swing=-1.35;bend=-.45;}
      shoulder.rotation.x=damp(shoulder.rotation.x,swing);shoulder.rotation.z=damp(shoulder.rotation.z,spread);elbow.rotation.x=damp(elbow.rotation.x,bend);hand.rotation.z=Math.sin(t*2+i)*.035;
    });
    // Resolve the orb in the neck parent's coordinates, including depth and body
    // turning. Head and eyes lead, while the whole body follows the shortest arc.
    root.updateMatrixWorld(true);localTarget.copy(target);torso.worldToLocal(localTarget);localTarget.sub(head.position);
    const headYaw=clamp(Math.atan2(localTarget.x,localTarget.z),-.95,.95)*lookWeight;
    const headPitch=clamp(-Math.atan2(localTarget.y-13,Math.hypot(localTarget.x,localTarget.z)),-.65,.55)*lookWeight;
    head.rotation.y=turn(head.rotation.y,headYaw,14);head.rotation.x=damp(head.rotation.x,headPitch-.035*run,12);head.rotation.z=damp(head.rotation.z,Math.sin(t*1.8)*.018*(1-run),8);
    const blinkPhase=t%4.7,blink=Math.max(0,1-Math.abs(blinkPhase-4.35)/.1);
    for(const {eye,iris} of eyes){eye.scale.y=1-blink*.94;iris.position.x=damp(iris.position.x,clamp(headYaw*.75,-.7,.7));iris.position.y=damp(iris.position.y,-.15-clamp(headPitch*.8,-.45,.45));}
    mouth.scale.y=s.speaker==='VOS'?1.4+Math.sin(t*13)*.45:1.05;
    hair.rotation.x=damp(hair.rotation.x,-.025*run*Math.sin(phase)-.025*air,9);
  }
  return {root,hips,torso,head,legs,arms,eyes,update};
}
