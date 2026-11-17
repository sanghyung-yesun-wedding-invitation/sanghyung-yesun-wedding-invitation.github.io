const photos=[{file:'photo-01.webp',width:1280,height:1920},{file:'photo-03.webp',width:1280,height:1920},{file:'photo-15.webp',width:1280,height:1920}];
const storageKey='wedding-gallery-crops-v3';
let selected=0,image=null,drag=null,loadVersion=0;
const editor=document.querySelector('#editor'),ctx=editor.getContext('2d'),preview=document.querySelector('#preview'),form=document.querySelector('#coordinates'),status=document.querySelector('#status');
function clamp(value,min,max){return Math.min(max,Math.max(min,Math.round(Number(value)||0)));}
// Integer multiples of 2 × 3 keep the crop ratio exact, including at image edges.
function normalize(rect,photo){
 const x=clamp(rect?.x,0,photo.width-2),y=clamp(rect?.y,0,photo.height-3);
 const requested=rect?.z!=null?Number(rect.z)/2:rect?.w!=null?Number(rect.w)/3:photo.width/2;
 const units=clamp(requested,1,Math.min(Math.floor((photo.width-x)/2),Math.floor((photo.height-y)/3)));
 return {x,y,z:units*2,w:units*3};
}
function dragRect(start,end,photo){
 const dx=end.x-start.x,dy=end.y-start.y;
 const sx=Math.sign(dx)||(start.x>photo.width/2?-1:1),sy=Math.sign(dy)||(start.y>photo.height/2?-1:1);
 const maxUnits=Math.min(Math.floor((sx>0?photo.width-start.x:start.x)/2),Math.floor((sy>0?photo.height-start.y:start.y)/3));
 if(maxUnits<1)return null;
 const units=clamp(Math.max(Math.abs(dx)/2,Math.abs(dy)/3),1,maxUnits);
 return {x:sx>0?start.x:start.x-units*2,y:sy>0?start.y:start.y-units*3,z:units*2,w:units*3};
}
let saved;try{saved=JSON.parse(localStorage.getItem(storageKey)||localStorage.getItem('wedding-gallery-crops-v2')||localStorage.getItem('wedding-gallery-crops-v1'));}catch{}
const crops=photos.map((photo,i)=>saved?.[i]?normalize(saved[i],photo):null);
function save(){try{localStorage.setItem(storageKey,JSON.stringify(crops));}catch{}}
function line(i){const r=crops[i];if(!r)return `사진 ${i+1}: 선택 없음 (원본 유지)`;return `사진 ${i+1}: x=${r.x}, y=${r.y}, z=${r.z}, w=${r.w}`;}
const clearButton=document.querySelector('#clear-selection');
function render(){
 if(!image)return;
 const r=crops[selected];ctx.clearRect(0,0,editor.width,editor.height);ctx.drawImage(image,0,0);
 clearButton.hidden=!r;document.querySelector('#copy').disabled=!r;
 if(r){
  ctx.fillStyle='rgba(20,17,14,.55)';ctx.beginPath();ctx.rect(0,0,editor.width,editor.height);ctx.rect(r.x,r.y,r.z,r.w);ctx.fill('evenodd');
  ctx.strokeStyle='#fff';ctx.lineWidth=Math.max(3,editor.width/240);ctx.strokeRect(r.x,r.y,r.z,r.w);
  ctx.strokeStyle='rgba(255,255,255,.5)';ctx.lineWidth=2;
  for(let i=1;i<3;i++){ctx.beginPath();ctx.moveTo(r.x+r.z*i/3,r.y);ctx.lineTo(r.x+r.z*i/3,r.y+r.w);ctx.moveTo(r.x,r.y+r.w*i/3);ctx.lineTo(r.x+r.z,r.y+r.w*i/3);ctx.stroke();}
  clearButton.style.left=`clamp(0px, calc(${(r.x+r.z)/editor.width*100}% - 40px), calc(100% - 36px))`;
  clearButton.style.top=`clamp(0px, calc(${r.y/editor.height*100}% + 4px), calc(100% - 36px))`;
 }
 const shown=r||normalize({},photos[selected]);preview.width=400;preview.height=600;
 preview.getContext('2d').drawImage(image,shown.x,shown.y,shown.z,shown.w,0,0,preview.width,preview.height);
 for(const key of ['x','y','z','w'])form.elements[key].value=shown[key];
 form.elements.x.max=editor.width-2;form.elements.y.max=editor.height-3;form.elements.z.max=editor.width;
 document.querySelector('#output').value=line(selected);
}
function clearSelection(){drag=null;crops[selected]=null;clearButton.hidden=true;editor.style.cursor='crosshair';render();save();status.textContent='선택을 삭제했습니다. 사진을 드래그해 새 사각형을 만드세요.';}
clearButton.onclick=clearSelection;
function contains(r,p){return !!r&&p.x>=r.x&&p.x<=r.x+r.z&&p.y>=r.y&&p.y<=r.y+r.w;}
function moveRect(rect,dx,dy,photo){return {...rect,x:clamp(rect.x+dx,0,photo.width-rect.z),y:clamp(rect.y+dy,0,photo.height-rect.w)};}

async function selectPhoto(index){const version=++loadVersion;selected=index;drag=null;image=null;clearButton.hidden=true;editor.style.cursor='crosshair';ctx.clearRect(0,0,editor.width,editor.height);status.textContent='사진을 불러오는 중입니다.';document.querySelectorAll('[data-photo]').forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));document.querySelector('#photo-title').textContent=`사진 ${index+1}`;const next=new Image();next.src='assets/'+photos[index].file;try{await next.decode();if(version!==loadVersion)return;image=next;editor.width=next.naturalWidth;editor.height=next.naturalHeight;document.querySelector('#dimensions').textContent=`${editor.width} × ${editor.height}px`;status.textContent='';render();}catch{if(version===loadVersion)status.textContent='사진을 불러오지 못했습니다. 다시 선택해 주세요.';}}
function point(event){const b=editor.getBoundingClientRect();return {x:clamp((event.clientX-b.left)/b.width*editor.width,0,editor.width),y:clamp((event.clientY-b.top)/b.height*editor.height,0,editor.height)};}
editor.addEventListener('pointerdown',event=>{
 if(!image||drag||event.button!==0)return;event.preventDefault();const p=point(event),r=crops[selected];
 drag={...p,id:event.pointerId,mode:contains(r,p)?'move':'create',before:r?{...r}:null};
 editor.style.cursor=drag.mode==='move'?'grabbing':'crosshair';editor.setPointerCapture(event.pointerId);
});
editor.addEventListener('pointermove',event=>{
 const p=point(event);
 if(!drag){editor.style.cursor=contains(crops[selected],p)?'grab':'crosshair';return;}
 if(event.pointerId!==drag.id)return;
 const rect=drag.mode==='move'?moveRect(drag.before,p.x-drag.x,p.y-drag.y,photos[selected]):dragRect(drag,p,photos[selected]);
 if(rect){crops[selected]=rect;render();}
});
editor.addEventListener('pointerup',event=>{
 if(!drag||event.pointerId!==drag.id)return;
 const moved=drag.mode==='move';drag=null;editor.style.cursor=contains(crops[selected],point(event))?'grab':'crosshair';save();
 status.textContent=moved?'사각형 위치를 저장했습니다.':'선택 영역을 저장했습니다.';
});
editor.addEventListener('pointercancel',()=>{if(drag){crops[selected]=drag.before;drag=null;editor.style.cursor='crosshair';render();}});
form.elements.z.addEventListener('input',()=>{form.elements.w.value=Math.max(1,Math.round(Number(form.elements.z.value)/2))*3;});
form.addEventListener('submit',event=>{event.preventDefault();if(!image)return;crops[selected]=normalize(Object.fromEntries(new FormData(form)),photos[selected]);render();save();status.textContent='좌표를 적용했습니다.';});
document.querySelectorAll('[data-photo]').forEach(b=>b.onclick=()=>selectPhoto(Number(b.dataset.photo)));
document.querySelector('#reset').onclick=()=>{crops[selected]=normalize({},photos[selected]);render();save();status.textContent='원본 전체로 초기화했습니다.';};
async function copy(all){const output=document.querySelector('#output');output.value=(all?photos.map((_,i)=>line(i)).join('\n'):line(selected))+'\n단위: 원본 픽셀 / x=왼쪽, y=위쪽, z=너비, w=높이 / 비율 2:3 고정 / 최종 출력 1280×1920px';try{await navigator.clipboard.writeText(output.value);status.textContent='좌표를 복사했습니다. 대화창에 붙여 넣어 주세요.';}catch{output.focus();output.select();status.textContent='아래 선택된 좌표를 복사해 주세요.';}}
document.querySelector('#copy').onclick=()=>copy(false);document.querySelector('#copy-all').onclick=()=>copy(true);
selectPhoto(0);
