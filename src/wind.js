import * as THREE from 'three';

const noise=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);};
// One travelling gust field for grass, tree crowns and airborne debris.
export const windGLSL=`float windField(float t,float x){return 0.65+0.35*sin(t*1.15-x*.006);}`;
export const windStrength=(t,x)=>.65+.35*Math.sin(t*1.15-x*.006);
const time={value:0};
const crownGeometry=new THREE.IcosahedronGeometry(1,1);
const barkGeometry=new THREE.CylinderGeometry(.6,1,1,7);
const bark=new THREE.MeshStandardMaterial({color:0x30423c,roughness:1});
const foliage=new THREE.MeshStandardMaterial({roughness:1});
foliage.onBeforeCompile=shader=>{
  shader.uniforms.forestTime=time;
  shader.vertexShader='uniform float forestTime;\n'+windGLSL+'\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',`
    vec4 leafPosition=instanceMatrix*vec4(transformed,1.0);
    float worldX=(modelMatrix*leafPosition).x;
    float heightWeight=smoothstep(18.0,90.0,leafPosition.y);
    float gust=windField(forestTime,worldX);
    leafPosition.x+=heightWeight*(gust*2.5+sin(forestTime*1.5+worldX*.011)*1.1);
    leafPosition.y+=heightWeight*sin(forestTime*2.6+worldX*.018)*.65*gust;
    leafPosition.z+=heightWeight*sin(forestTime*1.8+worldX*.013)*.9;
    vec4 mvPosition=modelViewMatrix*leafPosition;
    gl_Position=projectionMatrix*mvPosition;
  `);
};

export function windTree(parent,scale,seed){
  const tree=new THREE.Group();tree.scale.setScalar(scale);parent.add(tree);
  function branch(a,b,r){const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),m=new THREE.Mesh(barkGeometry,bark);m.position.copy(start).add(end).multiplyScalar(.5);m.scale.set(r,start.distanceTo(end),r);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),end.sub(start).normalize());tree.add(m);}
  branch([0,0,0],[2,63,0],3.3);
  for(let i=0;i<5;i++){const side=i%2?1:-1,y=29+i*6;branch([1,y,0],[side*(12+noise(seed+i)*7),y+18,(noise(seed+i*2)-.5)*10],1.1);}
  const crown=new THREE.InstancedMesh(crownGeometry,foliage,19),dummy=new THREE.Object3D(),color=new THREE.Color();
  for(let i=0;i<19;i++){
    const layer=Math.floor(i/6),angle=i*2.399+seed,spread=layer===3?0:19-layer*4;
    dummy.position.set(Math.cos(angle)*spread,49+layer*12+(noise(seed+i)-.5)*8,Math.sin(angle)*spread*.6);
    dummy.scale.set(12+noise(seed+i*3)*7,12+noise(seed+i*7)*8,10+noise(seed+i*5)*6);
    dummy.rotation.set(noise(seed+i),angle,noise(seed+i*9)*.4);dummy.updateMatrix();crown.setMatrixAt(i,dummy.matrix);
    color.setHSL(.39+noise(seed)*.07,.23+noise(seed+i)*.16,.17+noise(seed+i*4)*.085+layer*.014);crown.setColorAt(i,color);
  }
  // Shader sway extends beyond the static bounds; the grove handles culling.
  crown.frustumCulled=false;tree.add(crown);return tree;
}

export function createWind(scene){
  const root=new THREE.Group();scene.add(root);
  const shape=new THREE.Shape();shape.moveTo(-1,0);shape.quadraticCurveTo(0,.85,1,0);shape.quadraticCurveTo(0,-.7,-1,0);
  const leaves=new THREE.InstancedMesh(new THREE.ShapeGeometry(shape),new THREE.MeshBasicMaterial({color:0xffffff,side:THREE.DoubleSide,transparent:true,opacity:.65,depthWrite:false}),64);
  leaves.frustumCulled=false;root.add(leaves);
  const dummy=new THREE.Object3D(),color=new THREE.Color();
  for(let i=0;i<64;i++){color.set(i%4===0?0xb9a66a:i%3===0?0x9cbd79:0x689d7b);leaves.setColorAt(i,color);}
  const dustPositions=new Float32Array(180*3),dustGeometry=new THREE.BufferGeometry().setAttribute('position',new THREE.BufferAttribute(dustPositions,3));
  const dust=new THREE.Points(dustGeometry,new THREE.PointsMaterial({color:0xc6dcb0,size:2,transparent:true,opacity:.43,depthWrite:false,sizeAttenuation:false}));dust.frustumCulled=false;root.add(dust);
  const trailPositions=new Float32Array(12*10*6),trailColors=new Float32Array(trailPositions.length);
  const trailGeometry=new THREE.BufferGeometry().setAttribute('position',new THREE.BufferAttribute(trailPositions,3)).setAttribute('color',new THREE.BufferAttribute(trailColors,3));
  const trails=new THREE.LineSegments(trailGeometry,new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:.2,depthWrite:false,blending:THREE.AdditiveBlending}));trails.frustumCulled=false;root.add(trails);
  const wrap=(x,cam)=>cam-350+((x-(cam-350))%2300+2300)%2300;
  return {update(t,cam){
    time.value=t;
    // Analytic advection avoids frame-rate dependence and jumps after pausing.
    const travel=t*62-15*Math.cos(t*1.15);
    for(let i=0;i<64;i++){
      const x=wrap(noise(i*3)*2300+travel*(.65+noise(i)*.6),cam),phase=t*1.7+i*2.4;
      dummy.position.set(x,110+noise(i*7)*710+Math.sin(phase*.57)*28+Math.sin(x*.009+t)*12,-150+noise(i*13)*235);
      dummy.rotation.set(phase,Math.sin(phase*.8)*.7,-.3+Math.sin(phase*.63)*.8);
      const size=3+noise(i*17)*3;dummy.scale.set(size,size*.7,1);dummy.updateMatrix();leaves.setMatrixAt(i,dummy.matrix);
    }
    leaves.instanceMatrix.needsUpdate=true;
    for(let i=0;i<180;i++)dustPositions.set([wrap(noise(i*5)*2300+travel*(.8+noise(i)*.6),cam),60+noise(i*9)*850+Math.sin(t*1.3+i)*16,-240+noise(i*11)*320],i*3);
    dustGeometry.attributes.position.needsUpdate=true;
    for(let i=0;i<12;i++){
      const x=wrap(noise(i*21)*2300+travel*1.4,cam),y=170+noise(i*23)*610,gust=windStrength(t,x);
      for(let j=0;j<10;j++)for(let k=0;k<2;k++){
        const u=(j+k)/10,offset=(i*20+j*2+k)*3;
        trailPositions.set([x-u*95,y+Math.sin(u*2.5+t*.8+i)*9,-110],offset);
        const fade=Math.sin(u*Math.PI)*gust*.65;trailColors.set([fade*.64,fade*.83,fade*.73],offset);
      }
    }
    trailGeometry.attributes.position.needsUpdate=true;trailGeometry.attributes.color.needsUpdate=true;
  }};
}
