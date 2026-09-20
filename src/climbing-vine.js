import * as THREE from 'three';

// The stems and roots share the physics vine's endpoints; foliage is visual only.
export function climbingVine(v){
  const root=new THREE.Group(),owned=[];
  const bark=new THREE.MeshStandardMaterial({color:0x735334,roughness:1});
  const stems=[0x466b32,0x799c49,0xadc774].map(color=>new THREE.MeshStandardMaterial({color,roughness:.85}));
  const greens=[0x719c43,0x96bc60].map(color=>new THREE.MeshStandardMaterial({color,roughness:.8,side:THREE.DoubleSide}));
  function tendril(points,r,material){
    const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
    const geometry=new THREE.TubeGeometry(curve,Math.max(12,points.length*3),r,6,false);owned.push(geometry);
    const m=new THREE.Mesh(geometry,material);m.castShadow=true;m.receiveShadow=true;root.add(m);
  }
  const height=v.bottom-v.top;
  for(let strand=0;strand<3;strand++){
    const points=[];for(let y=0;y<height;y+=18)points.push([Math.sin(y*.035+strand*2.1)*12,y,Math.cos(y*.035+strand*2.1)*8]);
    points.push([Math.sin(height*.035+strand*2.1)*12,height,0]);tendril(points,7-strand*1.5,stems[strand]);
  }
  tendril([[0,height-32,0],[9,height+9,0],[40,height+12,0],[65,height+2,-5]],4,stems[1]);
  for(let i=0;i<7;i++){
    const a=i/7*Math.PI*2,dx=Math.cos(a),dz=Math.sin(a);
    tendril([[0,65,0],[dx*20,22,dz*13],[dx*58,4,dz*29],[dx*110,-5,dz*44],[dx*126,-22,dz*47]],5.5-i*.35,bark);
  }
  const shape=new THREE.Shape();shape.moveTo(0,0);shape.bezierCurveTo(8,19,31,28,51,20);shape.bezierCurveTo(38,-4,15,-16,0,0);
  const leafGeometry=new THREE.ShapeGeometry(shape);owned.push(leafGeometry);
  const leaves=[];
  for(let y=65,i=0;y<height;y+=43,i++){
    const side=i%2?1:-1;
    tendril([[side*7,y,0],[side*20,y+6,1],[side*31,y+13,2]],1.7,stems[1]);
    const leaf=new THREE.Mesh(leafGeometry,greens[i%2]);leaf.position.set(side*19,y+7,4);leaf.scale.x=side;leaf.rotation.z=side*.12;leaf.castShadow=true;root.add(leaf);leaves.push(leaf);
  }
  root.position.set(v.x,900-v.bottom,0);
  root.userData.animate=t=>leaves.forEach((leaf,i)=>{leaf.rotation.x=Math.sin(t*1.6+i)*.12;});
  root.userData.dispose=()=>{owned.forEach(g=>g.dispose());[bark,...stems,...greens].forEach(m=>m.dispose());};
  return root;
}
