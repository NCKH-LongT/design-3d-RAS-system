import {pipeLength} from './model.js';
export const volume=n=>['tank','rect','settling','bio','sump','drum','degas'].includes(n.type)?(n.shape==='round'?Math.PI*n.w*n.w/4:n.w*n.d)*n.water:0;
export function headLoss(qM3h,diameterMm,length,k=0,roughnessMm=.0015){
 if(qM3h<=0)return 0;const D=diameterMm/1000,q=qM3h/3600,v=q/(Math.PI*D*D/4),re=v*D/1e-6;
 const f=re<2300?64/re:.25/Math.log10(roughnessMm/1000/(3.7*D)+5.74/Math.pow(re,.9))**2;
 return(f*length/D+k)*v*v/(2*9.80665);
}
function reach(start,edges,reverse=false){const found=new Set([start]),stack=[start];while(stack.length){const n=stack.pop();for(const e of edges){const a=reverse?e.to:e.from,b=reverse?e.from:e.to;if(a===n&&!found.has(b)){found.add(b);stack.push(b);}}}return found;}
export function pumpEstimate(p){
 const pumps=p.nodes.filter(n=>n.type==='pump');if(pumps.length!==1)return{available:false,reason:'Ước tính tuyến bơm chỉ hỗ trợ đúng một bơm.'};
 const pump=pumps[0],lines=[];let id=pump.id;const seen=new Set([id]);
 while(true){const out=p.edges.filter(e=>e.from===id&&e.open&&e.mode!=='air'&&e.mode!=='waste');if(out.length!==1)return{available:false,reason:'Tuyến đẩy cần một đường nối tiếp, không phân nhánh.'};const e=out[0];if(e.mode!=='pressure')return{available:false,reason:'Tuyến đẩy chưa được đặt loại ống có áp.'};lines.push(e);const next=p.nodes.find(n=>n.id===e.to);if(['tank','rect'].includes(next.type))break;if(seen.has(next.id))return{available:false,reason:'Tuyến đẩy tạo vòng kín không có bể nhận.'};seen.add(next.id);id=next.id;}
 if(!pump.qmax||!pump.hmax)return{available:false,reason:'Thiếu Qmax hoặc Hmax của bơm.'};
 const loss=q=>p.settings.staticHead+lines.reduce((s,e)=>s+headLoss(q,e.diameter,pipeLength(p,e),e.k),0);
 const hp=q=>pump.hmax*(1-(q/pump.qmax)**2);
 if(p.settings.staticHead>=pump.hmax)return{available:true,q:0,head:p.settings.staticHead,lines};let lo=0,hi=pump.qmax;for(let i=0;i<70;i++){const m=(lo+hi)/2;if(hp(m)>loss(m))lo=m;else hi=m;}
 const q=(lo+hi)/2;return{available:true,q,head:loss(q),lines};
}
export function calculate(p){
 const s=p.settings,tanks=p.nodes.filter(n=>['tank','rect'].includes(n.type)),waterEdges=p.edges.filter(e=>e.open&&['gravity','pressure'].includes(e.mode));const active=new Set();
 for(const t of tanks){const a=reach(t.id,waterEdges),b=reach(t.id,waterEdges,true);for(const id of a)if(b.has(id))active.add(id);}
 const connectedTanks=tanks.filter(t=>active.has(t.id)&&waterEdges.some(e=>e.from===t.id)&&waterEdges.some(e=>e.to===t.id));
 const allTankV=tanks.reduce((v,n)=>v+volume(n),0),tankV=connectedTanks.reduce((v,n)=>v+volume(n),0),totalV=p.nodes.reduce((v,n)=>v+volume(n),0),biomass=s.count*s.weight,feed=biomass*s.feedPct/100,tan=feed*s.tanFactor;
 const bios=p.nodes.filter(n=>n.type==='bio'&&active.has(n.id));let tanCapacity=0;for(const b of bios)tanCapacity+=(b.mediaL||0)/1000*(b.ssa||0)*(b.tanRate||0);
 // air mass at approximately 20 C, dry air; site correction belongs in user-entered field OTE.
 const oxygenSources=p.nodes.filter(n=>n.type==='air'&&p.edges.some(e=>e.from===n.id&&e.open&&e.mode==='air'&&connectedTanks.some(t=>t.id===e.to)));
 const oxygen=oxygenSources.reduce((v,n)=>v+(n.airLpm||0)*60/1000*.279*((n.ote||0)/100),0);
 const fishO2=biomass*s.fishO2/1e6, nitrificationO2=tan/1000*4.57/24,otherO2=feed*s.otherO2/100/24,oxygenNeed=fishO2+nitrificationO2+otherO2;
 const reserve=1-s.safety/100,perKgFeed=s.feedPct/100,perKgO2=s.fishO2/1e6+perKgFeed*s.tanFactor/1000*4.57/24+perKgFeed*s.otherO2/100/24;
 const limits=[{key:'density',name:'Mật độ thiết kế',kg:tankV*s.maxDensity*reserve,known:tankV>0,unit:'kg/m³',basis:s.maxDensity},
 {key:'bio',name:'Lọc vi sinh',kg:tanCapacity/(perKgFeed*s.tanFactor)*reserve,known:bios.length>0&&bios.every(b=>b.mediaL>0&&b.ssa>0&&b.tanRate>0)},
 {key:'oxygen',name:'Cấp oxy',kg:oxygen/perKgO2*reserve,known:oxygenSources.length>0&&oxygenSources.every(a=>a.airLpm>0&&a.ote>0)}];
 const flowOK=s.verifiedFlow>0&&s.verifiedFlow>=tankV*s.turnover;const complete=limits.every(l=>l.known)&&flowOK&&connectedTanks.length===tanks.length&&tanks.length>0;
 const limiting=limits.filter(l=>l.known).sort((a,b)=>a.kg-b.kg)[0];const maxFish=complete?Math.floor(limiting.kg/s.weight):null;
 const notices=[];if(!tanks.length)notices.push({level:'danger',text:'Chưa có bể nuôi trong thiết kế.'});
 if(connectedTanks.length<tanks.length)notices.push({level:'danger',text:'Có bể chưa có vòng tuần hoàn kín với đường ống đang mở.'});
 if(!limits[1].known)notices.push({level:'warning',text:'Thiếu lọc vi sinh trong vòng tuần hoàn hoặc thông số giá thể.'});
 if(!limits[2].known)notices.push({level:'warning',text:'Chưa có lưu lượng khí và hiệu suất truyền oxy thực tế tại bể. Chưa kết luận sức tải tổng thể.'});
 if(!s.verifiedFlow)notices.push({level:'warning',text:'Chưa nhập lưu lượng nước đo/xác minh. Không dùng Qmax trên nhãn bơm làm lưu lượng vận hành.'});
 if(s.verifiedFlow&&s.verifiedFlow<tankV*s.turnover)notices.push({level:'danger',text:'Lưu lượng xác minh thấp hơn mục tiêu số vòng tuần hoàn/giờ.'});
 for(const l of limits)if(l.known&&biomass>l.kg)notices.push({level:'danger',text:`${l.name}: sinh khối mục tiêu vượt giới hạn có dự phòng.`});
 for(const n of p.nodes){if(['bio','drum','settling','sump','degas'].includes(n.type)&&!active.has(n.id))notices.push({level:'warning',text:`${n.label}: không nằm trong vòng tuần hoàn kín, chưa tính năng lực xử lý.`});if(n.type==='bio'&&n.mediaL/1000>volume(n)*.7)notices.push({level:'warning',text:`${n.label}: giá thể vượt 70% thể tích nước; kiểm tra yêu cầu đảo trộn của nhà sản xuất.`});if(n.type==='drum'&&s.verifiedFlow>(n.ratedFlow||0))notices.push({level:'danger',text:`${n.label}: lưu lượng tổng vượt thông số drum nhập vào (cần kiểm tra phân phối nhánh).`});if(n.x-n.w/2<0||n.y-n.d/2<0||n.x+n.w/2>p.site.w||n.y+n.d/2>p.site.d)notices.push({level:'warning',text:`${n.label}: nằm ngoài ranh giới mặt bằng.`});}
 const watts=p.nodes.reduce((v,n)=>v+(n.watts||0),0),kwh=watts*24/1000;
 return{allTankV,tankV,totalV,biomass,feed,tan,tanCapacity,oxygen,oxygenNeed,limits,limiting,maxFish,complete,notices,watts,kwh,cost:kwh*s.electricity,pump:pumpEstimate(p),active};
}
