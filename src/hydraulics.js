import {standpipe,intakeElevation,overflowCapacity} from './standpipe.js';
import {endHeights,pipeLength} from './model.js';
import {headLoss} from './hydraulic-loss.js';
export const G=9.80665,RHO=1000;
export const isReservoir=n=>['tank','rect','settling','bio','sump','drum','degas'].includes(n?.type);
const level=(n,levels)=>n.z+(levels?.[n.id]??n.water);
const section=e=>Math.PI*(e.diameter/1000)**2/4;
function solveLoss(head,edges,p,cap){let lo=0,hi=cap??Math.min(...edges.map(e=>section(e)))*Math.sqrt(2*G*head)*3600;for(let i=0;i<35;i++){const q=(lo+hi)/2,loss=edges.reduce((s,e)=>s+headLoss(q,e.diameter,pipeLength(p,e),(e.k||0)+1),0);if(loss>head)hi=q;else lo=q;}return(lo+hi)/2;}
function result(e,q,head,state,reason,extra={}){const velocity=Math.abs(q)/3600/section(e);return{id:e.id,q,direction:Math.sign(q),head,state,reason,velocity,pressureKPa:RHO*G*head/1000,momentumN:RHO*Math.abs(q)/3600*velocity,powerW:RHO*G*Math.abs(q)/3600*head,...extra};}
// Reservoir-to-reservoir, vented system. No primed siphons, trapped air or partially-full conduits.
export function passiveFlow(p,e,levels){
 const a=p.nodes.find(n=>n.id===e.from),b=p.nodes.find(n=>n.id===e.to);
 if(e.mode==='air')return result(e,0,0,'air','Đường khí: không áp dụng công thức nước.');
 if(!e.open)return result(e,0,0,'closed','Van đóng: không có dòng nước.');
 if(!isReservoir(a)||(!isReservoir(b)&&e.mode!=='waste'))return result(e,0,0,'unsupported','Chưa giải được tuyến này: cần hai bể nước hoặc tuyến bơm nối tiếp.');
 const wallHeights=endHeights(p,e),spA=standpipe(p,e,'from'),spB=standpipe(p,e,'to');if([spA,spB].some(s=>s&&!s.valid))return result(e,0,0,'unsupported','Ống đứng không hợp lệ: miệng phải trên cửa nối và dưới mép thùng.');
 const heights={from:intakeElevation(p,e,'from',wallHeights.from),to:intakeElevation(p,e,'to',wallHeights.to)},ha=level(a,levels),hb=level(b,levels),forward=ha>heights.from+1e-7?ha-Math.max(e.mode==='waste'?heights.to:hb,heights.to):0;
 const backward=e.mode!=='waste'&&hb>heights.to+1e-7?hb-Math.max(ha,heights.from):0;
 let dh=0,sign=0;if(forward>1e-7){dh=forward;sign=1;}else if(backward>1e-7){dh=backward;sign=-1;}
 const extra={surfaceA:ha,surfaceB:hb,outletA:heights.from,outletB:heights.to};
 if(!sign){const dry=ha<=heights.from+1e-7&&(e.mode==='waste'||hb<=heights.to+1e-7),equal=Math.abs(ha-hb)<1e-7;return result(e,0,0,'stopped',((spA&&ha<=spA.crest+1e-7&&hb<=spA.crest)||(spB&&hb<=spB.crest+1e-7&&ha<=spB.crest))?'Nước chưa vượt miệng ống đứng: tuyến này giữ mức nước tại cao độ miệng.':dry?(spA||spB?'Nước chưa vượt miệng ống đứng: tuyến này giữ mức nước tại cao độ miệng.':'Cửa hút hở: mực nước không ngập cửa ở phía cấp nước.'):equal&&e.mode!=='waste'?'Hai mặt nước cùng cột áp: độ dốc ống không tự tạo dòng chảy.':'Không đủ cột áp để vượt cao độ cửa nhận; không giả định siphon.',extra);}
 const submergence=sign>0?ha-heights.from:hb-heights.to;if(!(sign>0?spA:spB)&&submergence<e.diameter/2000)return result(e,0,dh,'unsupported','Cửa cấp chưa ngập đủ tiết diện ống: có thể chảy không đầy; chưa tính Q trong mô hình ống đầy.',extra);
 const sourceStandpipe=sign>0?spA:spB,pipeQ=solveLoss(dh,[e],p),q=(sourceStandpipe?Math.min(pipeQ,overflowCapacity(e.diameter,submergence)):pipeQ)*sign;return result(e,q,dh,sign<0?'reverse':'flow',sign<0?'Cột áp phía B lớn hơn: nước chảy B → A, ngược chiều nối.':(sourceStandpipe?'Nước vượt miệng ống đứng: Q giới hạn bởi tràn qua miệng và năng lực đường ống.':'Cột áp phía A đủ thắng tổn thất: nước chảy A → B.'),extra);
}
export function findPumpCircuit(p){
 const pumps=p.nodes.filter(n=>n.type==='pump');if(pumps.length!==1)return{supported:false,reason:'Cần đúng một bơm; chưa hỗ trợ nhiều bơm.'};
 const pump=pumps[0],incoming=p.edges.filter(e=>e.mode==='pressure'&&e.to===pump.id);
 if(incoming.length!==1||!isReservoir(p.nodes.find(n=>n.id===incoming[0].from)))return{supported:false,reason:'Bơm cần một tuyến hút có áp từ bể nước.'};
 let id=pump.id;const edges=[incoming[0]],seen=new Set([id]);for(let i=0;i<p.nodes.length;i++){const out=p.edges.filter(e=>e.mode==='pressure'&&e.from===id);if(out.length!==1)return{supported:false,reason:'Tuyến bơm phân nhánh hoặc thiếu đường đẩy; chưa giải được.'};const e=out[0];edges.push(e);const dst=p.nodes.find(n=>n.id===e.to);if(isReservoir(dst))return{supported:true,pump,source:incoming[0].from,target:e.to,edges};if(seen.has(e.to))break;seen.add(e.to);id=e.to;}return{supported:false,reason:'Tuyến bơm không đi tới bể nhận.'};
}
export function solvePump(p,path,levels,{pumpOn=true}={}){
 if(!path?.supported)return{q:0,head:0,state:'unsupported',reason:path?.reason||'Chưa có tuyến bơm được hỗ trợ.'};
 if(path.edges.some(e=>!e.open))return{q:0,head:0,state:'closed',reason:'Có van đóng trên tuyến hút/đẩy của bơm.'};
 if(!pumpOn)return{q:0,head:0,state:'stopped',reason:'Bơm tắt; chưa mô hình dòng hồi qua bơm/van một chiều.'};
 const src=p.nodes.find(n=>n.id===path.source),dst=p.nodes.find(n=>n.id===path.target),ha=level(src,levels),hb=Math.max(level(dst,levels),endHeights(p,path.edges.at(-1)).to),intake=endHeights(p,path.edges[0]).from;
 if(ha<=intake+1e-7)return{q:0,head:0,state:'stopped',reason:'Đầu hút bơm hở trên mặt nước; cần kiểm tra mực nước/cao độ hút.'};
 if(ha<intake+path.edges[0].diameter/2000)return{q:0,head:0,state:'unsupported',reason:'Cửa hút chưa ngập đủ tiết diện ống; chưa đánh giá dòng hai pha hoặc khả năng tự mồi.'};
 if(!(path.pump.qmax>0&&path.pump.hmax>0))return{q:0,head:0,state:'unsupported',reason:'Thiếu Qmax hoặc Hmax của bơm.'};
 const staticHead=hb-ha,hp=q=>path.pump.hmax*(1-(q/path.pump.qmax)**2),loss=q=>staticHead+path.edges.reduce((s,e)=>s+headLoss(q,e.diameter,pipeLength(p,e),(e.k||0)+1),0);
 if(hp(0)<=staticHead)return{q:0,head:staticHead,state:'stopped',reason:'Bơm không thắng được chênh cột áp giữa nguồn và cửa nhận.'};
 if(loss(path.pump.qmax)<0)return{q:0,head:0,state:'unsupported',reason:'Nguồn cao hơn đích quá nhiều: điểm làm việc ngoài đường bơm 0–Qmax.'};
 let lo=0,hi=path.pump.qmax;for(let i=0;i<35;i++){const q=(lo+hi)/2;if(hp(q)>loss(q))lo=q;else hi=q;}const q=(lo+hi)/2;return{q,head:hp(q),staticHead,state:'pump',reason:'Bơm bổ sung cột áp: giao đường Q–H với tổn thất cả tuyến hút/đẩy và chênh mực nước.'};
}
export function analyzeHydraulics(p,levels,options={}){
 const path=findPumpCircuit(p),pump=solvePump(p,path,levels,options),pumpIds=new Set(path.supported?path.edges.map(e=>e.id):[]);
 const edges=p.edges.map(e=>{if(!pumpIds.has(e.id))return passiveFlow(p,e,levels);return result(e,pump.q,pump.head,pump.state,pump.reason,{pump:true,headScope:'toàn tuyến bơm'});});
 const net=Object.fromEntries(p.nodes.filter(isReservoir).map(n=>[n.id,0]));for(const f of edges){if(f.pump||!f.q)continue;const e=p.edges.find(e=>e.id===f.id);net[e.from]-=f.q;if(e.mode!=='waste')net[e.to]+=f.q;}
 if(path.supported){net[path.source]-=pump.q;net[path.target]+=pump.q;}
 const unknown=edges.some(f=>f.state==='unsupported');
 const balances=p.nodes.filter(isReservoir).map(n=>{const area=n.shape==='round'?Math.PI*n.w**2/4:n.w*n.d,rate=net[n.id]/area,h=levels?.[n.id]??n.water;return{id:n.id,label:n.label,net:unknown?null:net[n.id],rateMph:unknown?null:rate,trend:unknown?'unknown':Math.abs(rate)<.001?'stable':rate>0?'rising':'falling',minutesToRim:rate>0?Math.max(0,n.h-h)/rate*60:null,minutesToEmpty:rate<0?h/-rate*60:null};});
 return{edges,balances,path,pump,assumption:'Ước tính tức thời tại mực nước hiện tại, giả sử ống đầy và bể hở. Không phải nghiệm cân bằng ổn định hoặc CFD; chưa xét siphon, khí kẹt, dòng không đầy, NPSH và tổn thất thiết bị ngoài K đã nhập.'};
}
