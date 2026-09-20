import * as THREE from 'three';

// The front perimeter matches the solid rectangle used for wall jumps.
// Relief lives inside that outline, so visible ledges never imply new footholds.
export function rockWall(p,shear){
  const root=new THREE.Group(),stone=new THREE.Group();stone.applyMatrix4(shear);root.add(stone);
  const seed=p.x*.13+p.y*.19,depth=95;
  const random=n=>{const v=Math.sin(n*127.1+seed)*43758.5453;return v-Math.floor(v);};
  const nx=Math.max(2,Math.ceil(p.w/36)),ny=Math.max(2,Math.ceil(p.h/48));
  const base=new THREE.BoxGeometry(p.w,p.h,depth,nx,ny,2),pos=base.attributes.position;
  for(let i=0;i<pos.count;i++){
    let x=pos.getX(i)+p.w/2,y=pos.getY(i)-p.h/2,z=pos.getZ(i)-depth/2;
    const edgeX=x<.01||x>p.w-.01,edgeY=y>-.01||y<-p.h+.01;
    const key=x*.73+y*1.39+z*.17;
    if(!edgeX)x+=(random(key)-.5)*p.w/nx*.55;
    if(!edgeY)y+=(random(key+8)-.5)*p.h/ny*.55;
    if(z>-.01)z=edgeX||edgeY?0:3+random(key+16)*15;
    else if(z<-depth+.01)z+=random(key+23)*12;
    pos.setXYZ(i,x,y,z);
  }
  const geometry=base.toNonIndexed();base.dispose();
  const colors=new Float32Array(geometry.attributes.position.count*3),color=new THREE.Color();
  for(let i=0;i<geometry.attributes.position.count;i+=3){
    const y=(geometry.attributes.position.getY(i)+geometry.attributes.position.getY(i+1)+geometry.attributes.position.getY(i+2))/3;
    color.set(y>-22&&random(i+6)>.55?0x52624c:random(i+4)>.6?0x65716e:0x4a5352).multiplyScalar(.82+random(i)*.33);
    for(let j=0;j<3;j++)colors.set([color.r,color.g,color.b],(i+j)*3);
  }
  geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));geometry.computeVertexNormals();
  const material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,flatShading:true});
  const mesh=new THREE.Mesh(geometry,material);mesh.castShadow=true;mesh.receiveShadow=true;stone.add(mesh);
  root.userData.disposeTerrain=()=>{geometry.dispose();material.dispose();};
  return root;
}
