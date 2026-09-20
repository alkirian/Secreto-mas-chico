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
  for(const [name,color] of Object.entries({skin:0xf3b59e,ear:0xdf8d82,hair:0x42281e,lock:0x513125,highlight:0x704839,sweater:0x607b9a,rib:0x516c87,seam:0x8ba1b7,pants:0x414454,shoe:0x85939e,sole:0xd5c9b5,white:0xfff5e7,mouth:0x884d42})){
    materials[name]=new THREE.MeshStandardMaterial({color,roughness:1,emissive:color,emissiveIntensity:name==='skin'?.16:.055});
  }
  function mesh(parent,geometry,material,x,y,z,sx=1,sy=1,sz=1){
    const m=new THREE.Mesh(geometry,typeof material==='string'?materials[material]:material);
    m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;m.receiveShadow=false;parent.add(m);return m;
  }
  const ell=(p,x,y,z,sx,sy,sz,m)=>mesh(p,sphere,m,x,y,z,sx,sy,sz);
  const soft=(p,x,y,z,w,h,d,r,m)=>mesh(p,new RoundedBoxGeometry(w,h,d,3,r),m,x,y,z);
  function joint(parent,x,y,z,name){const g=new THREE.Group();g.position.set(x,y,z);g.name=name;parent.add(g);return g;}
  function curve(parent,points,r,material){return mesh(parent,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),20,r,6,false),material,0,0,0);}
  function artwork(draw){const c=document.createElement('canvas');c.width=512;c.height=256;draw(c.getContext('2d'));const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;return new THREE.MeshStandardMaterial({map:texture,transparent:true,depthWrite:false,roughness:1});}

  function roundedProfile(points){return new THREE.CatmullRomCurve3(points.map(([y,r])=>new THREE.Vector3(r,y,0))).getPoints(48).map(p=>new THREE.Vector2(Math.max(0,p.x),p.y));}
  const sweaterProfile=roundedProfile([[0,0],[0,12.5],[2,14.5],[8,16],[17,15.8],[22,13.5],[25,9],[26,6]]);
  mesh(torso,new THREE.LatheGeometry(sweaterProfile,40),'sweater',0,0,0,1,1,.76);
  function knitRing(parent,y,r,tube,depth=1){const ring=mesh(parent,new THREE.TorusGeometry(r,tube,10,40),'rib',0,y,0,1,depth,1);ring.rotation.x=Math.PI/2;return ring;}
  knitRing(torso,1.6,13.9,1.5,.76);
  ell(torso,0,26,0,5.7,7,5.8,'skin');
  const collar=mesh(torso,new THREE.TorusGeometry(6.2,1.5,8,32),'rib',0,25,0);collar.rotation.x=Math.PI/2;
  // Small ribbed cuffs, hem and shoulder seams read well in cinematic closeups.
  for(const side of [-1,1])curve(torso,[[side*7,24,6],[side*11,22,7.5],[side*13,19,7.5]],.16,'seam');
  const logo=artwork(ctx=>{
    ctx.fillStyle='#e5edf0';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 112px cursive';
    ctx.fillText('Bluey',256,155);ctx.save();ctx.translate(249,49);ctx.rotate(-.15);
    ctx.beginPath();ctx.ellipse(-19,0,12,30,0,0,Math.PI*2);ctx.ellipse(16,0,12,29,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#689ab6';ctx.beginPath();ctx.ellipse(-19,0,5,20,0,0,Math.PI*2);ctx.fill();ctx.restore();
  });
  const printGeometry=new THREE.PlaneGeometry(23,11.5,24,12),printPos=printGeometry.attributes.position;
  for(let i=0;i<printPos.count;i++){
    const y=printPos.getY(i)+15;
    let r=0;for(let j=1;j<sweaterProfile.length;j++){const a=sweaterProfile[j-1],b=sweaterProfile[j];if(y>=a.y&&y<=b.y)r=lerp(a.x,b.x,(y-a.y)/(b.y-a.y));}
    printPos.setZ(i,Math.sqrt(Math.max(0,r*r-printPos.getX(i)**2))*.76+.1);
  }
  printGeometry.computeVertexNormals();mesh(torso,printGeometry,logo,0,15,0).castShadow=false;
  soft(hips,0,-1,-.3,23,8,16,3,'pants');

  // Broad cheeks and a short chin. The face artwork is fitted to the actual
  // ellipsoid, so eyes have no projecting eyeballs or silhouette in profile.
  const faceRadius={x:20,y:18.5,z:17},faceCenter=14;
  ell(head,0,faceCenter,0,faceRadius.x,faceRadius.y,faceRadius.z,'skin');
  for(const side of [-1,1]){
    ell(head,side*19,12,-.8,3.5,4.5,2.7,'skin');
    ell(head,side*20,12,1.2,1.6,2.6,.55,'ear');
  }
  ell(head,0,8.8,16.2,2.15,1.7,1.5,'skin');
  function paint(draw){
    const c=document.createElement('canvas');c.width=c.height=256;draw(c.getContext('2d'));
    const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;
    return new THREE.MeshBasicMaterial({map,transparent:true,depthWrite:false,toneMapped:false});
  }
  function facePatch(x,y,w,h,material,name){
    const g=new THREE.PlaneGeometry(w,h,20,16),p=g.attributes.position;
    for(let i=0;i<p.count;i++){
      const px=p.getX(i)+x,py=p.getY(i)+y-faceCenter;
      p.setZ(i,faceRadius.z*Math.sqrt(Math.max(.001,1-(px/faceRadius.x)**2-(py/faceRadius.y)**2))+.065);
    }
    g.computeVertexNormals();const m=mesh(head,g,material,x,y,0);m.name=name;m.castShadow=false;m.renderOrder=2;return m;
  }
  const blush=paint(ctx=>{
    const g=ctx.createRadialGradient(128,128,8,128,128,120);g.addColorStop(0,'rgba(232,117,112,.62)');g.addColorStop(.48,'rgba(232,117,112,.30)');g.addColorStop(1,'rgba(232,117,112,0)');ctx.fillStyle=g;ctx.fillRect(0,0,256,256);
  });
  for(const side of [-1,1])facePatch(side*11.4,7.7,11,8.2,blush,'blush');
  function eyePaint(openness){return paint(ctx=>{
    ctx.lineCap='round';
    if(openness<.1){ctx.strokeStyle='#50372d';ctx.lineWidth=11;ctx.beginPath();ctx.moveTo(53,136);ctx.quadraticCurveTo(128,175,203,130);ctx.stroke();return;}
    ctx.save();ctx.translate(128,133);ctx.scale(1,openness);ctx.translate(-128,-133);
    ctx.fillStyle='#fff1dc';ctx.beginPath();ctx.ellipse(128,133,82,92,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#634030';ctx.beginPath();ctx.ellipse(130,138,69,83,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#39291f';ctx.beginPath();ctx.ellipse(131,130,53,67,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#a16b43';ctx.beginPath();ctx.ellipse(132,191,30,10,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#fff9eb';ctx.beginPath();ctx.ellipse(104,99,15,18,-.25,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=.78;ctx.beginPath();ctx.arc(156,153,7,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
    ctx.strokeStyle='#50372d';ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(50,104);ctx.bezierCurveTo(65,39,175,24,207,102);ctx.stroke();ctx.restore();
  });}
  const eyeFrames=[eyePaint(1),eyePaint(.5),eyePaint(0)],eyes=[];
  const brow=paint(ctx=>{ctx.strokeStyle='#674436';ctx.lineCap='round';ctx.lineWidth=30;ctx.beginPath();ctx.moveTo(43,158);ctx.quadraticCurveTo(120,81,211,139);ctx.stroke();});
  for(const side of [-1,1]){
    eyes.push({eye:facePatch(side*7.6,13.3,10.8,11.8,eyeFrames[0],side<0?'left-eye':'right-eye')});
    facePatch(side*7.8,21,8,2.7,brow,'eyebrow');
  }
  const smile=paint(ctx=>{ctx.strokeStyle='#995d50';ctx.lineWidth=13;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(58,99);ctx.bezierCurveTo(93,153,161,155,199,98);ctx.stroke();});
  const talkingMouth=paint(ctx=>{ctx.fillStyle='#965649';ctx.beginPath();ctx.ellipse(128,132,44,45,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#e7a196';ctx.beginPath();ctx.ellipse(128,153,29,15,0,0,Math.PI*2);ctx.fill();});
  const mouth=facePatch(0,3.8,7,4.3,smile,'smile');

  // One soft cap with an asymmetric fringe; no sharp spikes or etched strands.
  const hair=joint(head,0,0,0,'hair');
  const capVertices=[],capIndices=[],rows=24,columns=56;
  for(let row=0;row<=rows;row++)for(let col=0;col<=columns;col++){
    const phi=col/columns*Math.PI*2,front=(Math.cos(phi)+1)/2;
    const theta=row/rows*lerp(2.14,1.28,front);
    capVertices.push(21.1*Math.sin(theta)*Math.sin(phi),16+20*Math.cos(theta),18.5*Math.sin(theta)*Math.cos(phi)-.8);
  }
  for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){
    const a=row*(columns+1)+col,b=a+columns+1;capIndices.push(a,b,a+1,b,b+1,a+1);
  }
  const capGeometry=new THREE.BufferGeometry();capGeometry.setAttribute('position',new THREE.Float32BufferAttribute(capVertices,3));capGeometry.setIndex(capIndices);capGeometry.computeVertexNormals();mesh(hair,capGeometry,'hair',0,0,0);
  function lock(points,width,depth){
    const path=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),vertices=[],indices=[],n=24,sides=16;
    const tangent=new THREE.Vector3(),across=new THREE.Vector3(),forward=new THREE.Vector3(0,0,1);
    for(let i=0;i<=n;i++){
      const u=i/n,center=path.getPoint(u);path.getTangent(u,tangent);across.crossVectors(tangent,forward).normalize();
      const taper=Math.max(.035,Math.sin(Math.PI*(.1+u*.9))**.55);
      for(let j=0;j<sides;j++){const a=j/sides*Math.PI*2;vertices.push(center.x+across.x*Math.cos(a)*width*taper,center.y+across.y*Math.cos(a)*width*taper,center.z+Math.sin(a)*depth*taper);}
    }
    for(let i=0;i<n;i++)for(let j=0;j<sides;j++){const a=i*sides+j,b=i*sides+(j+1)%sides;indices.push(a,a+sides,b,b,a+sides,b+sides);}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();mesh(hair,g,'lock',0,0,0);
  }
  lock([[10,32,7],[2,30,15],[-9,25,17],[-16,19,11]],6.5,3);
  lock([[11,31,7],[15,28,12],[17,22,11],[17,18,7]],5,2.7);
  lock([[-10,29,9],[-17,23,10],[-19,16,5],[-18,13,2]],3.8,2.2);
  lock([[2,34,0],[-1,37,1],[-6,37,1]],2.6,1.5);

  // Weighted cloth bends across the elbow/knee instead of exposing hard seams.
  function clothLimb(parent,points,length,material,depth=1){
    const upper=new THREE.Bone(),bend=new THREE.Bone();parent.add(upper);upper.add(bend);bend.position.y=-length;
    const geometry=new THREE.LatheGeometry(roundedProfile(points),24),p=geometry.attributes.position,indices=[],weights=[];
    for(let i=0;i<p.count;i++){
      p.setZ(i,p.getZ(i)*depth);const w=THREE.MathUtils.smoothstep(-p.getY(i),length-4,length+4);
      indices.push(0,1,0,0);weights.push(1-w,w,0,0);
    }
    geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(indices,4));geometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weights,4));geometry.computeVertexNormals();
    const sleeve=new THREE.SkinnedMesh(geometry,materials[material]);sleeve.castShadow=true;parent.add(sleeve);
    root.updateMatrixWorld(true);sleeve.bind(new THREE.Skeleton([upper,bend]));return bend;
  }

  const legs=[],arms=[];
  for(const side of [-1,1]){
    const thigh=joint(hips,side*7,-1,0,side<0?'left-hip':'right-hip');
    const knee=clothLimb(thigh,[[-23,0],[-23,4.4],[-19,4.6],[-12,5.1],[-5,5.6],[1,5.4],[3,0]],12,'pants',1.08);knee.name='knee';
    const ankle=joint(knee,0,-11.5,0,'ankle');
    ell(ankle,0,-.7,2,5.6,3,7.5,'shoe');soft(ankle,0,-2.8,2,10.4,1.4,14, .6,'sole');
    for(const z of [2,4])curve(ankle,[[-1.8,1.6,z],[1.8,1.6,z]],.22,'white');
    legs.push({thigh,knee,ankle});
    const shoulder=joint(torso,side*16,22,0,side<0?'left-shoulder':'right-shoulder');
    const elbow=clothLimb(shoulder,[[-21,0],[-21,4.3],[-17,5],[-10,5.8],[-3,6],[1,5],[4,0]],11,'sweater',1.05);elbow.name='elbow';
    knitRing(elbow,-9.4,4.3,.8,1.04);
    const hand=joint(elbow,0,-12.4,0,'hand');ell(hand,0,-1.5,.2,3.6,4.1,2.9,'skin');ell(hand,-side*2.5,-.2,1.2,1.45,2.2,1.5,'skin');
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
    air=damp(air,!ground&&!p.rope&&!p.vine&&!floatWeight?1:0,13);
    phase+=dt*speed*.062;
    lookWeight=damp(lookWeight,cinematic?1:0,6);
    const floatHeight=(37+Math.sin(floatTime*1.45)*5+Math.sin(floatTime*.73)*2)*floatWeight;
    root.position.set(p.x+19,900-p.y-62+floatHeight,25);
    root.visible=!(p.invincible>0&&Math.sin(t*24)<-.5);
    const squash=clamp((p.squash||0)*.45,-.1,.1);
    root.scale.set(1+squash,1-squash,1+squash*.4);
    root.rotation.z=(Math.sin(floatTime*.95)*.028-.015)*floatWeight;
    target.set(o.x,900-o.y,o.z??55);
    const farewell=s.mode==='end'?THREE.MathUtils.smoothstep(s.ending||0,0,3.5):0;
    const facing=(p.face||1)*1.12,orbYaw=Math.atan2(target.x-root.position.x,target.z-root.position.z);
    const desiredYaw=p.vine?Math.PI:lerp(facing+wrap(orbYaw-facing)*lookWeight,Math.PI/2,farewell);
    root.rotation.y=reset?desiredYaw:turn(root.rotation.y,desiredYaw,cinematic?5:11);
    const bounce=(.9-Math.cos(phase*2)*.9)*run;
    hips.position.y=28+(bounce-landing*2.1)*(1-farewell)+Math.sin(t*2)*.22*(1-run);
    // Drift forward in profile; the torso leads and the limbs trail with a delay.
    hips.rotation.x=damp(hips.rotation.x,(.3+Math.sin(floatTime*.8)*.035)*farewell,4);
    torso.rotation.x=damp(torso.rotation.x,lerp(lerp(.13*run-.09*air,.17,floatWeight)+.018*Math.sin(t*2),.16+Math.sin(floatTime*.8-.45)*.025,farewell));
    torso.rotation.z=damp(torso.rotation.z,Math.sin(phase)*.045*run*(1-farewell));
    torso.rotation.y=damp(torso.rotation.y,Math.sin(phase)*.075*run*(1-farewell));

    legs.forEach(({thigh,knee,ankle},i)=>{
      const a=phase+i*Math.PI,swing=Math.sin(a),lift=Math.max(0,Math.cos(a));
      let hip=-swing*.78*run,fold=(.13+lift*.95)*run+landing*.28,foot=-hip-fold*.7;
      // Lift-off gathers the knees; descent opens the legs for a soft landing.
      const rising=clamp(-(p.vy||0)/500,0,1),falling=clamp((p.vy||0)/650,0,1);
      hip=lerp(hip,i===0?-.55-.3*rising:.18+.24*falling,air);
      fold=lerp(fold,i===0?.65+.35*rising:.9-.65*falling,air);foot=lerp(foot,-.2,air);
      hip=lerp(hip,(i===0?-.38:-.23)+Math.sin(floatTime*.9+i)*.04,floatWeight);fold=lerp(fold,(i===0?.72:.55)+Math.sin(floatTime*1.1+i)*.05,floatWeight);foot=lerp(foot,-.23,floatWeight);
      hip=lerp(hip,(i===0?.42:.58)+Math.sin(floatTime*.8-.8+i*.7)*.06,farewell);
      fold=lerp(fold,(i===0?.72:.88)+Math.sin(floatTime*.8-1.2+i*.7)*.07,farewell);foot=lerp(foot,-.3,farewell);
      if(p.rope){hip=i===0?-.6:.12;fold=i===0?1:.45;foot=-.1;}
      if(p.vine){const climb=Math.sin(p.y*.075+i*Math.PI);hip=-.55-climb*.35;fold=.9+climb*.4;foot=-.2;}
      thigh.rotation.x=damp(thigh.rotation.x,hip,18);knee.rotation.x=damp(knee.rotation.x,fold,18);ankle.rotation.x=damp(ankle.rotation.x,foot,18);
    });
    arms.forEach(({shoulder,elbow,hand},i)=>{
      const side=i===0?-1:1,a=phase+i*Math.PI;
      let swing=Math.sin(a)*.65*run-.04,bend=-.2-.7*run,spread=side*(.07+air*.22);
      swing=lerp(swing,-.55+clamp((p.vy||0)/800,-.4,.5),air);bend=lerp(bend,-.65,air);
      swing=lerp(swing,-.1+Math.sin(floatTime*1.2+i)*.035,floatWeight);bend=lerp(bend,-.38,floatWeight);spread+=side*.1*floatWeight;
      swing=lerp(swing,.26+Math.sin(floatTime*.8-.65+i*.6)*.05,farewell);bend=lerp(bend,-.28,farewell);
      if(p.rope){swing=-2.8;spread=side*.12;bend=-.2;}
      if(p.wall&&!ground&&!p.rope){swing=-1.35;bend=-.45;}
      if(p.vine){swing=-2.3+Math.sin(p.y*.075+i*Math.PI)*.4;bend=-.55;spread=side*.18;}
      shoulder.rotation.x=damp(shoulder.rotation.x,swing);shoulder.rotation.z=damp(shoulder.rotation.z,spread);elbow.rotation.x=damp(elbow.rotation.x,bend);hand.rotation.z=Math.sin(t*2+i)*.035;
    });
    // Resolve the orb in the neck parent's coordinates, including depth and body
    // turning. Head and eyes lead, while the whole body follows the shortest arc.
    root.updateMatrixWorld(true);localTarget.copy(target);torso.worldToLocal(localTarget);localTarget.sub(head.position);
    const headYaw=clamp(Math.atan2(localTarget.x,localTarget.z),-.95,.95)*lookWeight;
    const headPitch=clamp(-Math.atan2(localTarget.y-13,Math.hypot(localTarget.x,localTarget.z)),-.65,.55)*lookWeight;
    head.rotation.y=turn(head.rotation.y,headYaw*(1-farewell),8);head.rotation.x=damp(head.rotation.x,lerp(headPitch-.035*run,-.46,farewell),8);head.rotation.z=damp(head.rotation.z,Math.sin(t*1.8)*.018*(1-run),8);
    const blinkPhase=t%4.7,blink=Math.max(0,1-Math.abs(blinkPhase-4.35)/.1);
    for(const {eye} of eyes)eye.material=eyeFrames[blink>.8?2:blink>.3?1:0];
    mouth.material=s.speaker==='VOS'&&Math.sin(t*13)>-.2?talkingMouth:smile;
    hair.rotation.x=damp(hair.rotation.x,-.025*run*Math.sin(phase)-.025*air,9);
  }
  return {root,hips,torso,head,legs,arms,eyes,update};
}
