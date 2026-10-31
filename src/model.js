import {standpipeLength,standpipe} from './standpipe.js';
export const TYPES={
 tank:{name:'Bể cá tròn',icon:'circle',color:'#2d9ca1',w:2.5,d:2.5,h:1.2,water:.8,shape:'round'},
 rect:{name:'Bể cá chữ nhật',icon:'rectangle-horizontal',color:'#2d9ca1',w:3,d:2,h:1.2,water:.8,shape:'rect'},
 settling:{name:'Bể lắng',icon:'funnel',color:'#b58b49',w:.65,d:.65,h:.95,water:.75,shape:'round'},
 drum:{name:'Drum filter',icon:'filter',color:'#71858a',w:1.15,d:.7,h:.8,water:.45,shape:'rect',ratedFlow:15},
 bio:{name:'Lọc vi sinh',icon:'sprout',color:'#79a36a',w:.6,d:.6,h:.95,water:.75,shape:'round',mediaL:100,ssa:500,tanRate:.2},
 sump:{name:'Bồn bơm',icon:'container',color:'#7c91b4',w:.7,d:.7,h:.95,water:.55,shape:'round'},
 pump:{name:'Bơm nước',icon:'zap',color:'#c3954d',w:.45,d:.45,h:.4,water:0,shape:'rect',watts:90,qmax:9,hmax:4},
 air:{name:'Máy sục khí',icon:'wind',color:'#a28cc4',w:.5,d:.4,h:.35,water:0,shape:'rect',watts:180,airLpm:120,ote:0},
 degas:{name:'Tháp khử khí',icon:'waves',color:'#729f91',w:.6,d:.6,h:1.4,water:.3,shape:'round'}
};
export const uid=()=>globalThis.crypto?.randomUUID?.()||`id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
export function device(type,x=2,y=2){return{id:uid(),type,label:TYPES[type].name,x,y,z:0,rotation:0,...structuredClone(TYPES[type])};}
export function example(){
 const t=device('tank',2.5,3),s=device('settling',5,2),d=device('drum',6.6,2),b1=device('bio',8.4,1),b2=device('bio',8.4,2.2),b3=device('bio',8.4,3.4),su=device('sump',10.2,2.2),p=device('pump',10.2,4.2),a=device('air',7,5.3);
 const nodes=[t,s,d,b1,b2,b3,su,p,a];t.label='Bể nuôi 01';s.label='Lắng 200 L';d.label='Drum 15 m³/h';[b1,b2,b3].forEach((b,i)=>b.label=`Vi sinh 0${i+1}`);su.label='Bồn bơm';p.label='Bơm tuần hoàn';a.label='Sục khí';
 const edge=(from,to,diameter=90,mode='gravity',extra={})=>({id:uid(),from:from.id,to:to.id,fromPort:'out',toPort:'in',diameter,mode,material:'PVC',extraLength:0,k:1.5,open:true,bend:null,...extra});
 const edges=[edge(t,s),edge(s,d,110),...[b1,b2,b3].map(b=>edge(d,b)),...[b1,b2,b3].map(b=>edge(b,su)),edge(su,p,60,'pressure'),edge(p,t,60,'pressure',{k:4.5}),edge(a,t,16,'air')];
 return{version:1,name:'Hệ RAS mẫu · bể Ø2,5 m',nodes,edges,settings:{species:'Cá nuôi tùy chỉnh',count:250,weight:.8,feedPct:1.5,protein:40,tanFactor:30,fishO2:400,otherO2:20,maxDensity:25,safety:20,verifiedFlow:0,turnover:1,temp:29,salinity:0,ph:7.2,electricity:3000,staticHead:.8},site:{w:13,d:8}};
}
const finite=(v,min,max)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
export function validateProject(p){
 if(!p||p.version!==1||typeof p.name!=='string'||p.name.length>120||!Array.isArray(p.nodes)||p.nodes.length>200||!Array.isArray(p.edges)||p.edges.length>600)throw Error('Định dạng dự án không hợp lệ (version 1, tối đa 200 thiết bị / 600 ống).');
 if(!p.site||!finite(p.site.w,3,100)||!finite(p.site.d,3,100))throw Error('Mặt bằng phải từ 3 đến 100 m.');
 const ids=new Set();
 for(const n of p.nodes){if(!n||typeof n.id!=='string'||ids.has(n.id)||!TYPES[n.type]||typeof n.label!=='string'||n.label.length>100)throw Error('Thiết bị không hợp lệ hoặc trùng ID.');ids.add(n.id);for(const k of ['x','y','z','rotation','w','d','h','water'])if(!finite(n[k],k==='rotation'?-360:0,100))throw Error(`Thông số ${k} không hợp lệ.`);if(n.w<.1||n.d<.1||n.h<.1||n.water>n.h)throw Error('Kích thước/mực nước thiết bị không hợp lệ.');if(!['round','rect'].includes(n.shape))throw Error('Hình dạng không hợp lệ.');for(const k of ['mediaL','ssa','tanRate','watts','qmax','hmax','airLpm','ote','ratedFlow'])if(n[k]!==undefined&&!finite(n[k],0,1e6))throw Error(`Thông số ${k} không hợp lệ.`);}
 const edgeIds=new Set();for(const e of p.edges){if(!e||typeof e.id!=='string'||(edgeIds.has(e.id)||ids.has(e.id))||!ids.has(e.from)||!ids.has(e.to)||e.from===e.to||!['gravity','pressure','air','waste'].includes(e.mode)||!finite(e.diameter,5,1000)||!finite(e.k,0,1000)||!finite(e.extraLength,0,1000)||typeof e.open!=='boolean'||!['in','out'].includes(e.fromPort)||!['in','out'].includes(e.toPort))throw Error('Đường ống hoặc đầu nối không hợp lệ.');edgeIds.add(e.id);for(const key of ['fromHeight','toHeight','fromStandpipe','toStandpipe'])if(e[key]!==undefined&&!finite(e[key],0,100))throw Error('Cao độ đầu ống không hợp lệ.');for(const end of ['from','to']){const sp=standpipe(p,e,end);if(sp&&!sp.valid)throw Error('Ống đứng chỉ dùng tuyến tự chảy/xả: miệng phải nằm từ cao độ cửa tới mép thùng.');}if(e.bend!==null&&e.bend!==undefined&&!finite(e.bend,0,p.site.w))throw Error('Điểm gấp ống không hợp lệ.');}
 const bounds={count:[0,1e7],weight:[.001,100],feedPct:[.01,20],protein:[1,80],tanFactor:[1,200],fishO2:[1,10000],otherO2:[0,1000],maxDensity:[1,500],safety:[0,80],verifiedFlow:[0,1e5],turnover:[.1,20],temp:[0,45],salinity:[0,50],ph:[0,14],electricity:[0,1e5],staticHead:[0,100]};
 if(!p.settings||typeof p.settings.species!=='string'||p.settings.species.length>100)throw Error('Thiếu cấu hình nuôi.');for(const [k,[lo,hi]]of Object.entries(bounds))if(!finite(p.settings[k],lo,hi))throw Error(`Thông số nuôi ${k} không hợp lệ.`);
 return structuredClone(p);
}
export function port(n,side){const a=n.rotation*Math.PI/180;const dx=(side==='out'?1:-1)*n.w/2;return{x:n.x+Math.cos(a)*dx,y:n.y+Math.sin(a)*dx};}
export function route(p,e){const a=port(p.nodes.find(n=>n.id===e.from),e.fromPort),b=port(p.nodes.find(n=>n.id===e.to),e.toPort);const x=e.bend??(a.x+b.x)/2;return[a,{x,y:a.y},{x,y:b.y},b];}
export function endHeights(p,e){const a=p.nodes.find(n=>n.id===e.from),b=p.nodes.find(n=>n.id===e.to);return{from:a.z+(e.fromHeight??Math.min(a.h,Math.max(.12,a.water*.5))),to:b.z+(e.toHeight??Math.min(b.h,Math.max(.12,b.water*.5)))};}
export function route3D(p,e){const points=route(p,e),heights=endHeights(p,e),segments=points.slice(1).map((v,i)=>Math.hypot(v.x-points[i].x,v.y-points[i].y)),total=segments.reduce((s,x)=>s+x,0);let distance=0;return points.map((v,i)=>{if(i)distance+=segments[i-1];return{...v,z:heights.from+(heights.to-heights.from)*(total?distance/total:i/(points.length-1))};});}
export function pipeGeometry(p,e){const points=route(p,e),heights=endHeights(p,e);let horizontal=0;for(let i=1;i<points.length;i++)horizontal+=Math.hypot(points[i].x-points[i-1].x,points[i].y-points[i-1].y);const drop=heights.from-heights.to;return{...heights,horizontal,drop,slope:horizontal?drop/horizontal:null,length:Math.hypot(horizontal,drop)+(e.extraLength||0)+standpipeLength(p,e),volume:Math.PI*(e.diameter/1000)**2/4*(Math.hypot(horizontal,drop)+(e.extraLength||0)+standpipeLength(p,e))};}
export function pipeLength(p,e){return pipeGeometry(p,e).length;}
