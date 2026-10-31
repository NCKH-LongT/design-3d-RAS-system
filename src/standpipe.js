// An open, vented internal standpipe; heights are measured from the vessel floor.
export const standpipeKey=end=>end==='from'?'fromStandpipe':'toStandpipe';
export function standpipe(p,e,end){const n=p.nodes.find(n=>n.id===e[end]),height=e[standpipeKey(end)];if(height===undefined)return null;const wall=end==='from'?e.fromHeight:e.toHeight,wallHeight=wall??Math.min(n.h,Math.max(.12,n.water*.5));return{end,node:n,height,crest:n.z+height,wall:n.z+wallHeight,valid:['gravity','waste'].includes(e.mode)&&['tank','rect','settling','bio','sump','drum','degas'].includes(n.type)&&height>=wallHeight&&height<=n.h};}
export function standpipePath(p,e,end){const s=standpipe(p,e,end);if(!s)return[];const n=s.node,angle=n.rotation*Math.PI/180,sign=e[end+'Port']==='out'?1:-1;return[{x:n.x+Math.cos(angle)*sign*n.w/2,y:n.y+Math.sin(angle)*sign*n.w/2,z:s.wall},{x:n.x+Math.cos(angle)*sign*n.w/4,y:n.y+Math.sin(angle)*sign*n.w/4,z:s.wall},{x:n.x+Math.cos(angle)*sign*n.w/4,y:n.y+Math.sin(angle)*sign*n.w/4,z:s.crest}];}
export function intakeElevation(p,e,end,base){return standpipe(p,e,end)?.crest??base;}
export function standpipeLength(p,e){let length=0;for(const end of ['from','to']){const points=standpipePath(p,e,end);for(let i=1;i<points.length;i++)length+=Math.hypot(points[i].x-points[i-1].x,points[i].y-points[i-1].y,points[i].z-points[i-1].z);}return length;}
// Circular sharp lip weir approximation (Cw=1.7 m^0.5/s), capped by downstream pipe capacity.
export function overflowCapacity(diameterMm,head){return 1.7*Math.PI*diameterMm/1000*Math.max(0,head)**1.5*3600;}
