import * as THREE from 'three';
import {windGLSL} from './wind.js';

const random = n => { const v=Math.sin(n*127.1+311.7)*43758.5453; return v-Math.floor(v); };

// All terrain is local to its collider; the top front edge stays at y=0.
export function floatingTerrain(p, shear) {
  const root=new THREE.Group(), land=new THREE.Group();
  land.applyMatrix4(shear);root.add(land);
  const seed=p.x*.17+p.y*.31, depth=115;
  const height=Math.min(225,65+p.w*.095), segments=Math.max(3,Math.ceil(p.w/65));
  const perimeter=[];
  for(let i=0;i<=segments;i++)perimeter.push([p.w*i/segments,0]);
  perimeter.push([p.w,-depth*.5]);
  for(let i=segments;i>=0;i--)perimeter.push([p.w*i/segments,-depth]);
  perimeter.push([0,-depth*.5]);
  const rings=[0,1,2,3].map(level=>perimeter.map(([x,z],i)=>{
    const taper=[1,1,.87,.58][level];
    return [p.w/2+(x-p.w/2)*taper,level===0?0:level===1?-12-random(seed+i)*9:level===2?-height*(.42+random(seed+i)*.19):-height*(.75+random(seed+i*3)*.35),-depth/2+(z+depth/2)*taper];
  }));
  const vertices=[],colors=[],color=new THREE.Color();
  function triangle(a,b,c,tone,jitter=1){color.set(tone).multiplyScalar(jitter);for(const v of [a,b,c]){vertices.push(...v);colors.push(color.r,color.g,color.b);}}
  const soil=p.kind==='crumble'?[0x56733a,0x886047,0x49392f]:[0x527c39,0x765039,0x40332c];
  for(let i=0;i<perimeter.length;i++){
    const next=(i+1)%perimeter.length;
    triangle([p.w/2,0,-depth/2],rings[0][next],rings[0][i],0x547f3b,.85+random(seed+i)*.3);
    for(let j=0;j<3;j++){
      triangle(rings[j][i],rings[j][next],rings[j+1][i],soil[j],.8+random(seed+i+j)*.4);
      triangle(rings[j][next],rings[j+1][next],rings[j+1][i],soil[j],.8+random(seed+i*2+j)*.4);
    }
    triangle(rings[3][i],rings[3][next],[p.w/2,-height*.9,-depth/2],0x352c26);
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.computeVertexNormals();
  const earth=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,side:THREE.DoubleSide}));earth.castShadow=true;earth.receiveShadow=true;land.add(earth);

  // The landing edge follows the collider and stays legible through the forest veil.
  // Its own layer is drawn only during darkness, without lighting the whole island.
  const landingEdge=new THREE.Mesh(new THREE.PlaneGeometry(p.w,5),new THREE.MeshBasicMaterial({color:0xd3dfad,transparent:true,opacity:0,depthWrite:false,toneMapped:false}));
  landingEdge.name='landing-edge';landingEdge.position.set(p.w/2,-2.5,2);landingEdge.layers.set(2);landingEdge.visible=false;root.add(landingEdge);

  // Thin branching roots merge into a single draw call.
  const roots=[];
  for(let i=0;i<Math.ceil(p.w/85);i++){
    const x=15+random(seed+i*9)*Math.max(1,p.w-30),y=-height*(.55+random(seed+i)*.25),z=-12-random(seed+i*4)*65;
    const end=[x-8+random(seed+i*8)*16,y-22-random(seed+i*6)*38,z];
    roots.push(x,y,z,...end,...end,end[0]+10,end[1]-13,z-4);
  }
  land.add(new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(roots,3)),new THREE.LineBasicMaterial({color:0x594632})));

  const bladePositions=[],bladeColors=[],anchors=[],weights=[];
  const count=Math.ceil(p.w*1.5);
  for(let i=0;i<count;i++){
    // Keep the grass in front of the character's depth plane so the blades
    // naturally occlude the lower body while walking through the platform.
    const x=2+random(seed+i*3.13)*Math.max(1,p.w-4),z=32+random(seed+i*7.7)*12;
    const h=10+random(seed+i*4.6)*19,w=1.1+random(seed+i*8.2)*1.8,lean=-random(seed+i*1.7)*8;
    const points=[[x-w,0,z],[x+w,0,z],[x+lean+w*.4,h*.55,z],[x-w,0,z],[x+lean+w*.4,h*.55,z],[x+lean-w*.4,h*.55,z],[x+lean-w*.4,h*.55,z],[x+lean+w*.4,h*.55,z],[x+lean*1.6,h,z]];
    const shade=random(seed+i*2.9);
    for(const v of points){bladePositions.push(...v);anchors.push(x,z);weights.push(v[1]/h);color.setHSL(.22+shade*.065,.38+shade*.2,.24+shade*.12+v[1]/h*.13);bladeColors.push(color.r,color.g,color.b);}
  }
  const grassGeometry=new THREE.BufferGeometry();grassGeometry.setAttribute('position',new THREE.Float32BufferAttribute(bladePositions,3));grassGeometry.setAttribute('color',new THREE.Float32BufferAttribute(bladeColors,3));grassGeometry.setAttribute('anchor',new THREE.Float32BufferAttribute(anchors,2));grassGeometry.setAttribute('weight',new THREE.Float32BufferAttribute(weights,1));grassGeometry.computeVertexNormals();
  const uniforms={windTime:{value:0},heroLocal:{value:new THREE.Vector2(-10000,10000)},heroSpeed:{value:0},islandX:{value:p.x}};
  const grassMaterial=new THREE.MeshStandardMaterial({vertexColors:true,side:THREE.DoubleSide,roughness:1});
  grassMaterial.onBeforeCompile=shader=>{
    Object.assign(shader.uniforms,uniforms);
    shader.vertexShader='attribute vec2 anchor; attribute float weight; uniform float windTime; uniform vec2 heroLocal; uniform float heroSpeed; uniform float islandX;\n'+windGLSL+'\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
      float phase=(anchor.x+islandX)*.027+anchor.y*.045;
      float gust=windField(windTime,anchor.x+islandX);
      float wind=-gust*(10.0+sin(windTime*2.4+phase)*3.8+sin(windTime*4.2+phase*1.7)*1.8);
      float dx=anchor.x-heroLocal.x;
      float contact=(1.0-smoothstep(12.0,60.0,abs(dx)))*(1.0-smoothstep(8.0,48.0,abs(heroLocal.y)))*(1.0-smoothstep(22.0,105.0,-anchor.y));
      float bend=weight*weight;
      transformed.x+=(wind+contact*(sign(dx)*19.0+heroSpeed*.025))*bend;
      transformed.y-=(contact*position.y*.62+gust*2.0)*weight;
    `);
  };
  const grass=new THREE.Mesh(grassGeometry,grassMaterial);grass.frustumCulled=false;land.add(grass);
  // Pollen and loose grass fragments ride the same gusts above the sod.
  const moteCount=Math.max(5,Math.ceil(p.w/45)),motePositions=new Float32Array(moteCount*3);
  const moteGeometry=new THREE.BufferGeometry().setAttribute('position',new THREE.BufferAttribute(motePositions,3));
  const motes=new THREE.Points(moteGeometry,new THREE.PointsMaterial({color:0xb5ce77,size:2.5,transparent:true,opacity:.48,depthWrite:false,sizeAttenuation:false}));motes.frustumCulled=false;land.add(motes);
  if(p.kind==='moving'||p.kind==='light'){
    const light=new THREE.Mesh(new THREE.TorusGeometry(8,1.7,5,16),new THREE.MeshBasicMaterial({color:0x8ef2d7}));light.position.set(p.w/2,-32,2);land.add(light);
  }
  if(p.kind==='crumble'){
    const cracks=[];for(let i=0;i<Math.ceil(p.w/65);i++){const x=20+i*65;cracks.push(x,-5,1,x+8,-24,1,x+8,-24,1,x+2,-39,-2);}
    land.add(new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(cracks,3)),new THREE.LineBasicMaterial({color:0x30231d})));
  }
  // Separate wedges of the actual island rise and fit back into its final mesh.
  const enchanted=!!(p.coopReveal||p.coopStep),original=enchanted?Float32Array.from(vertices):null;
  const pieces=[];
  if(enchanted){
    for(let k=0;k<vertices.length;k+=72)pieces.push({start:k,end:Math.min(k+72,vertices.length),delay:random(seed+k)*.18,angle:(random(seed+k+3)-.5)*1.1,spread:(random(seed+k+7)-.5)*170});
  }
  const magicGeometry=enchanted?new THREE.BufferGeometry().setAttribute('position',new THREE.BufferAttribute(new Float32Array(180),3)):null;
  const magic=enchanted?new THREE.Points(magicGeometry,new THREE.PointsMaterial({color:0xffdc8a,size:4,transparent:true,opacity:.8,blending:THREE.AdditiveBlending,depthWrite:false,sizeAttenuation:false})):null;
  if(magic){magic.frustumCulled=false;root.add(magic);}
  let lastFormation=-1;
  root.userData.updateTerrain=(t,hero,orb,low=false,darkness=0)=>{
    const formed=!p.hidden&&!p.retired&&!p.falling&&(!enchanted||(p.formation??1)>=1);
    landingEdge.visible=formed&&darkness>.001;
    landingEdge.material.opacity=darkness*.8;
    if(enchanted){
      const progress=p.formation??(p.hidden?0:1);
      if(progress!==lastFormation){
        const positions=geometry.attributes.position;
        for(const piece of pieces){
          const u=THREE.MathUtils.clamp((progress-piece.delay)/(1-piece.delay),0,1),ease=u*u*(3-2*u),rest=1-ease;
          const angle=piece.angle*rest,cos=Math.cos(angle),sin=Math.sin(angle);
          for(let k=piece.start;k<piece.end;k+=3){const x=original[k]-p.w/2,y=original[k+1]+height/2;
            positions.setXYZ(k/3,p.w/2+x*cos-y*sin+piece.spread*rest,-height/2+x*sin+y*cos-(350+random(seed+piece.start)*100)*rest,original[k+2]);}
        }
        positions.needsUpdate=true;geometry.computeVertexNormals();earth.frustumCulled=false;
        for(const child of land.children)if(child!==earth)child.visible=progress>.88;
        grass.scale.y=THREE.MathUtils.smoothstep(progress,.88,1);
        lastFormation=progress;
      }
      magic.visible=progress>0&&progress<1;
      if(magic.visible){
        const positions=magicGeometry.attributes.position;
        for(let i=0;i<60;i++){
          const u=(i/60+t*.6)%1,angle=i*2.4+t*3,radius=(1-u)*(p.w*.55)+8;
          const ox=orb?orb.x-root.position.x:p.w/2,oy=orb?900-orb.y-root.position.y:85;
          positions.setXYZ(i,THREE.MathUtils.lerp(p.w/2,ox,u)+Math.cos(angle)*radius,THREE.MathUtils.lerp(-350*(1-progress),oy,u),40+Math.sin(angle)*35*(1-u));
        }positions.needsUpdate=true;magic.material.opacity=Math.sin(progress*Math.PI)*.85;
      }
    }
    grassGeometry.setDrawRange(0,Math.floor(count*(low?.16:1))*9);motes.visible=!low;
    uniforms.windTime.value=t;uniforms.islandX.value=root.position.x;
    uniforms.heroLocal.value.set(hero.x+19-root.position.x,900-hero.y-62-root.position.y);uniforms.heroSpeed.value=hero.vx;
    for(let i=0;i<(low?0:moteCount);i++){
      const x=((random(seed+i*5)*p.w-(t*26-5*Math.cos(t*1.15))*(.7+random(seed+i)*.6))%p.w+p.w)%p.w;
      const near=Math.max(0,1-Math.abs(x-uniforms.heroLocal.value.x)/60)*Math.max(0,1-Math.abs(uniforms.heroLocal.value.y)/45);
      motePositions.set([x,12+random(seed+i*8)*25+Math.sin(t*1.8+i)*8+near*Math.min(18,Math.abs(hero.vx)*.06),-random(seed+i*3)*depth],i*3);
    }
    moteGeometry.attributes.position.needsUpdate=true;
  };
  root.userData.disposeTerrain=()=>root.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material)o.material.dispose();});
  return root;
}
