import * as THREE from 'three';
import {windStrength} from './wind.js';

// Only feathered light: no surface, outline, or shadow-casting body.
export function createLifeOrb(map){
  const root=new THREE.Group(),lightBody=new THREE.Group(),face=new THREE.Group();
  root.add(lightBody,face);
  function sprite(parent,color,size,opacity=1,texture=map,additive=true){
    const s=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,color,transparent:true,opacity,depthWrite:false,blending:additive?THREE.AdditiveBlending:THREE.NormalBlending}));
    s.scale.set(size,size,1);parent.add(s);return s;
  }
  function drawing(draw){
    const canvas=document.createElement('canvas');canvas.width=canvas.height=128;
    draw(canvas.getContext('2d'));
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
  }
  const halo=sprite(lightBody,0xffbb53,172,.62);
  const heart=sprite(lightBody,0xffeab0,78,1);
  const inner=sprite(lightBody,0xfff4cf,49,.85);inner.position.set(-2,3,1);
  const wisps=Array.from({length:5},(_,i)=>sprite(lightBody,i%2?0xffd480:0xffbd56,48,.28));
  const eyeMap=drawing(ctx=>{
    ctx.fillStyle='#513426';ctx.beginPath();ctx.ellipse(64,64,30,40,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#fff8de';ctx.beginPath();ctx.ellipse(54,48,10,12,0,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=.55;ctx.beginPath();ctx.arc(73,79,5,0,Math.PI*2);ctx.fill();
  });
  const eyes=[-1,1].map(side=>{const eye=sprite(face,0xffffff,10,1,eyeMap,false);eye.position.set(side*5.5,1,22);return eye;});
  const smileMap=drawing(ctx=>{ctx.strokeStyle='#815039';ctx.lineWidth=9;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(33,51);ctx.quadraticCurveTo(64,86,95,51);ctx.stroke();});
  const smile=sprite(face,0xffffff,9,.9,smileMap,false);smile.position.set(0,-5,23);
  const blush=[-1,1].map(side=>{const cheek=sprite(face,0xff967d,14,.48,map,false);cheek.position.set(side*10,-4,21);return cheek;});
  const sparks=Array.from({length:9},()=>sprite(root,0xffe2a0,6,.6));
  const light=new THREE.PointLight(0xffce75,13000,280,1.6);root.add(light);
  let lastTime,tilt=0,tiltVelocity=0;
  return {root,update(t,orb,player,speaker){
    const elapsed=lastTime===undefined?0:t-lastTime,dt=Math.max(0,Math.min(elapsed,.05));lastTime=t;
    if(elapsed<0||elapsed>.25){tilt=0;tiltVelocity=0;}
    const gust=windStrength(t,orb.x),vx=orb.vx||0,vy=orb.vy||0,speed=Math.min(Math.hypot(vx,vy)/320,1);
    const target=THREE.MathUtils.clamp(-vx*.001-gust*.12+Math.sin(t*1.9)*.055,-.3,.3);
    // A damped angular spring lets the little face settle after each gust.
    let remaining=dt;while(remaining>0){const step=Math.min(remaining,1/120);tiltVelocity+=((target-tilt)*32-tiltVelocity*7)*step;tilt+=tiltVelocity*step;remaining-=step;}
    root.position.set(orb.x,900-orb.y,orb.z??55);face.rotation.z=tilt;
    const breath=Math.sin(t*2.4)*.045;
    heart.scale.set(78*(1+breath+speed*.12),78*(1-breath-speed*.06),1);
    halo.scale.set(172+gust*16,166+Math.sin(t*1.6)*10,1);halo.material.opacity=.56+Math.sin(t*2.4)*.06;
    inner.position.set(Math.sin(t*1.7)*2,3+Math.cos(t*2.1)*2,1);
    for(let i=0;i<wisps.length;i++){
      const u=(i+1)/wisps.length,phase=t*(1.7+u*.3)+i*1.6;
      wisps[i].position.set((-vx*.075-gust*22)*u+Math.sin(phase)*5,(vy*.06+12)*u+Math.cos(phase)*6,-2-i);
      wisps[i].scale.set(48-u*18+gust*9,42-u*12,1);wisps[i].material.opacity=(1-u*.7)*(.26+Math.sin(phase)*.035);
    }
    const look=THREE.MathUtils.clamp((player.x-orb.x)*.022,-2.5,2.5),lookY=THREE.MathUtils.clamp((orb.y-player.y-20)*.015,-1.3,1.3);
    const cycle=t%5.7,blink=Math.max(0,1-Math.abs(cycle-4.6)/.11, .85*(1-Math.abs(cycle-4.88)/.08));
    eyes.forEach((eye,i)=>{eye.position.set((i?5.5:-5.5)+look,1+lookY,22);eye.scale.set(10,10*(1-blink*.9),1);});
    const talking=speaker==='PUNTO';smile.scale.y=talking?9+Math.sin(t*13)*2:9;smile.position.x=look*.65;
    blush.forEach(cheek=>cheek.material.opacity=.42+Math.sin(t*2.4)*.06);
    sparks.forEach((spark,i)=>{
      const age=(t*.3+i/9)%1,phase=i*2.399;
      spark.position.set(Math.cos(phase)*(17+age*19)-gust*age*26-vx*.09*age,Math.sin(phase)*13+age*38+vy*.06*age,-4);
      spark.material.opacity=Math.sin(age*Math.PI)*.55; spark.scale.setScalar(3+Math.sin(age*Math.PI)*3);
    });
    const magic=orb.magic||0;
    halo.scale.multiplyScalar(1+magic*.4);halo.material.opacity+=magic*.2;
    wisps.forEach((w,i)=>{if(magic)w.position.set(Math.cos(t*4+i*1.26)*32,Math.sin(t*4+i*1.26)*25,-2-i);});
    light.intensity=13000*(1+Math.sin(t*2.4)*.06+magic*.7);
  }};
}
