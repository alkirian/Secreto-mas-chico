const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
class Node {
  constructor(tag,id=''){this.tagName=tag.toUpperCase();this.id=id;this.children=[];this.value='low';this.classList={add(){},remove(){},toggle(){}};}
  append(node){this.children.push(node);node.parentElement=this;}
  remove(){this.parentElement.children=this.parentElement.children.filter(n=>n!==this);}
  setAttribute(){}
  focus(){document.activeElement=this;}
  scrollIntoView(){}
  getClientRects(){return [1];}
  click(){this.onclick?.();}
  dispatchEvent(event){this.onchange?.(event);}
  querySelectorAll(){return this.children.flatMap(n=>[n,...n.querySelectorAll()]).filter(n=>['BUTTON','SELECT','A'].includes(n.tagName));}
  querySelector(){return this.querySelectorAll().find(n=>n.tagName==='SELECT');}
}
const cover=new Node('div','cover'),pause=new Node('div','pause'),start=new Node('button','start'),resume=new Node('button','resume'),restart=new Node('button','restart'),mainSelect=new Node('select'),pauseSelect=new Node('select');
let mode='title',choice='low',restarts=0,now=0;
for(const select of [mainSelect,pauseSelect]){select.options=['auto','high','balanced','low','2d'].map(value=>({value,textContent:value}));select.onchange=()=>choice=select.value;}
cover.append(start);cover.append(mainSelect);pause.append(resume);pause.append(restart);pause.append(pauseSelect);
start.onclick=()=>mode='play';resume.onclick=()=>mode='play';restart.onclick=()=>{restarts++;mode='play';};
const document={activeElement:null,head:new Node('head'),createElement:tag=>new Node(tag),querySelector(selector){return {'#cover':cover,'#pause':pause,'#resume':resume,'#sound':new Node('button')}[selector]||null;}};
const listeners={};const window={gameStatus:()=>({mode}),addEventListener(type,fn){listeners[type]=fn;}};
vm.runInNewContext(fs.readFileSync('src/menu-controls.js','utf8'),{document,window,performance:{now:()=>now},Event:class{constructor(type){this.type=type;}}});
const tick=gp=>{now+=17;return window.secretMenus.handle(gp||{});};
const tap=gp=>{tick(gp);tick({});};
tick();assert.equal(document.activeElement,start);
tap({vertical:1});assert.equal(document.activeElement,mainSelect);
for(const value of ['2d','auto','high','balanced','low']){tap({jump:true});tap({vertical:1});tap({jump:true});assert.equal(choice,value,'every graphics option can be selected');assert.equal(mode,'title');}
tap({jump:true});tap({vertical:1});tap({back:true});assert.equal(choice,'low','B cancels without applying highlighted option');
tap({vertical:-1});tap({jump:true});assert.equal(mode,'play');
assert.equal(tick({}),false,'releasing confirm returns control to gameplay');
mode='pause';tick();tap({vertical:1});tap({vertical:1});assert.equal(document.activeElement,pauseSelect);
tap({jump:true});tap({vertical:1});tap({jump:true});assert.equal(choice,'2d');assert.equal(mode,'pause','graphics never resumes or restarts the game');assert.equal(restarts,0);
tap({back:true});assert.equal(mode,'play','B resumes pause');
mode='pause';tick();tap({vertical:1});tap({jump:true});assert.equal(restarts,1,'restart requires selecting its button');
mode='title';tick();
function key(type,code){listeners[type]({code,preventDefault(){},stopImmediatePropagation(){}});}
key('keydown','ArrowDown');key('keyup','ArrowDown');assert.equal(document.activeElement,mainSelect,'short Android key taps navigate even between animation frames');
key('keydown','Space');key('keyup','Space');key('keydown','ArrowUp');key('keyup','ArrowUp');key('keydown','Space');key('keyup','Space');assert.equal(choice,'balanced','Android A and arrows select an option');
console.log('PASS: all five graphics choices, cancel, pause navigation, explicit restart, native short taps and confirm release');
