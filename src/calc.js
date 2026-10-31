export const volume=n=>['tank','rect','settling','bio','sump','drum','degas'].includes(n.type)?(n.shape==='round'?Math.PI*n.w*n.w/4:n.w*n.d)*n.water:0;
export {headLoss} from './hydraulic-loss.js';
import {analyzeHydraulics} from './hydraulics.js';
function reach(start,edges,reverse=false){const found=new Set([start]),stack=[start];while(stack.length){const n=stack.pop();for(const e of edges){const a=reverse?e.to:e.from,b=reverse?e.from:e.to;if(a===n&&!found.has(b)){found.add(b);stack.push(b);}}}return found;}
export function pumpEstimate(p,h=analyzeHydraulics(p)){return h.pump.state==='unsupported'?{available:false,reason:h.pump.reason}:{available:true,q:h.pump.q,head:h.pump.head,lines:h.path.edges||[]};}
export function calculate(p){
 const hydraulics=analyzeHydraulics(p),hydraulicIssues=hydraulics.edges.some(f=>['reverse','stopped','unsupported'].includes(f.state)),hydraulicUnbalanced=hydraulics.balances.some(b=>Math.abs(b.rateMph)>.01);
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
 const flowOK=s.verifiedFlow>0&&s.verifiedFlow>=tankV*s.turnover;const complete=limits.every(l=>l.known)&&flowOK&&connectedTanks.length===tanks.length&&tanks.length>0&&!hydraulicIssues&&!hydraulicUnbalanced;
 const limiting=limits.filter(l=>l.known).sort((a,b)=>a.kg-b.kg)[0];const maxFish=complete?Math.floor(limiting.kg/s.weight):null;
 const notices=[];
 for(const f of hydraulics.edges){if(f.state==='reverse')notices.push({level:'danger',text:`Ống Ø${p.edges.find(e=>e.id===f.id).diameter}: ${f.reason}`});else if(['stopped','unsupported'].includes(f.state))notices.push({level:f.state==='stopped'?'danger':'warning',text:`Tuyến ${p.nodes.find(n=>n.id===p.edges.find(e=>e.id===f.id).from).label}: ${f.reason}`});}
 if(hydraulics.balances.some(b=>Math.abs(b.rateMph)>.01))notices.push({level:'warning',text:'Lưu lượng vào/ra chưa cân bằng ở mực nước hiện tại: có bể tăng/giảm nước. Xem Thủy lực và chạy Mô phỏng.'});if(!tanks.length)notices.push({level:'danger',text:'Chưa có bể nuôi trong thiết kế.'});
 if(connectedTanks.length<tanks.length)notices.push({level:'danger',text:'Có bể chưa có vòng tuần hoàn kín với đường ống đang mở.'});
 if(!limits[1].known)notices.push({level:'warning',text:'Thiếu lọc vi sinh trong vòng tuần hoàn hoặc thông số giá thể.'});
 if(!limits[2].known)notices.push({level:'warning',text:'Chưa có lưu lượng khí và hiệu suất truyền oxy thực tế tại bể. Chưa kết luận sức tải tổng thể.'});
 if(!s.verifiedFlow)notices.push({level:'warning',text:'Chưa nhập lưu lượng nước đo/xác minh. Không dùng Qmax trên nhãn bơm làm lưu lượng vận hành.'});
 if(s.verifiedFlow&&s.verifiedFlow<tankV*s.turnover)notices.push({level:'danger',text:'Lưu lượng xác minh thấp hơn mục tiêu số vòng tuần hoàn/giờ.'});
 for(const l of limits)if(l.known&&biomass>l.kg)notices.push({level:'danger',text:`${l.name}: sinh khối mục tiêu vượt giới hạn có dự phòng.`});
 for(const n of p.nodes){if(['bio','drum','settling','sump','degas'].includes(n.type)&&!active.has(n.id))notices.push({level:'warning',text:`${n.label}: không nằm trong vòng tuần hoàn kín, chưa tính năng lực xử lý.`});if(n.type==='bio'&&n.mediaL/1000>volume(n)*.7)notices.push({level:'warning',text:`${n.label}: giá thể vượt 70% thể tích nước; kiểm tra yêu cầu đảo trộn của nhà sản xuất.`});if(n.type==='drum'&&s.verifiedFlow>(n.ratedFlow||0))notices.push({level:'danger',text:`${n.label}: lưu lượng tổng vượt thông số drum nhập vào (cần kiểm tra phân phối nhánh).`});if(n.x-n.w/2<0||n.y-n.d/2<0||n.x+n.w/2>p.site.w||n.y+n.d/2>p.site.d)notices.push({level:'warning',text:`${n.label}: nằm ngoài ranh giới mặt bằng.`});}
 const watts=p.nodes.reduce((v,n)=>v+(n.watts||0),0),kwh=watts*24/1000;
 return{allTankV,tankV,totalV,biomass,feed,tan,tanCapacity,oxygen,oxygenNeed,limits,limiting,maxFish,complete,notices,watts,kwh,cost:kwh*s.electricity,pump:pumpEstimate(p,hydraulics),hydraulics,active};
}
