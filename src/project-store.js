import {validateProject,example} from './model.js';
export class SaveConflict extends Error {constructor(){super('Mô hình đã thay đổi ở phiên khác. Lưu thành bản sao hoặc tải lại để tiếp tục.');this.code='conflict';}}
export const serializeModel=p=>{const validated=validateProject(p),model=JSON.stringify(validated);if(new TextEncoder().encode(model).length>700000)throw Error('Mô hình vượt giới hạn 700 KB. Hãy xuất JSON để sao lưu.');return model;};
// One writer at a time. Edits during an in-flight save replace the pending snapshot,
// never the base revision. A failed write retains its unsaved draft for retry/export.
export class ProjectWorkspace {
 constructor(repo,uid,onStatus=()=>{}){this.repo=repo;this.uid=uid;this.onStatus=onStatus;this.current=null;this.pending=null;this.running=null;this.timer=null;this.error=null;this.closed=false;this.listeners=new Set();}
 async start(){const list=await this.list();const first=list.find(r=>!r.archived);this.current=first||await this.repo.create(this.uid,example());return this.current;}
 list(){return this.repo.list(this.uid);}
 get dirty(){return !!this.pending||!!this.running;}
 status(s,error=null){if(this.closed&&s!=='closed')return;this.onStatus({state:s,error});}
 queue(project){if(this.closed||!this.current)return;this.pending={id:this.current.id,model:serializeModel(project)};this.error=null;this.status('pending');clearTimeout(this.timer);this.timer=setTimeout(()=>this.flush().catch(()=>{}),900);}
 async flush(){clearTimeout(this.timer);if(this.closed)throw Error('Phiên làm việc đã đóng.');if(this.running){await this.running;if(this.error)throw this.error;if(this.pending)return this.flush();return;}
 if(!this.pending){if(this.error)throw this.error;return;}
 this.running=this.drain();try{await this.running;}finally{this.running=null;}
 }
 async drain(){while(this.pending&&!this.closed){const draft=this.pending;this.pending=null;this.status('saving');try{if(draft.id!==this.current.id)throw Error('Mô hình đang lưu không khớp phiên hiện tại.');const saved=await this.repo.save(this.uid,draft.id,JSON.parse(draft.model),this.current.revision);if(this.closed)return;this.current=saved;this.error=null;this.status(this.pending?'pending':'saved');}catch(error){if(!this.pending)this.pending=draft;this.error=error;this.status(error.code==='conflict'?'conflict':'error',error);throw error;}}}
 async open(record){await this.flush();const next=await this.repo.get(this.uid,record.id);if(next.archived)throw Error('Khôi phục mô hình trước khi mở.');this.current=next;this.pending=null;this.error=null;this.status('saved');return this.current;}
 async create(project,{discardDraft=false}={}){if(!discardDraft)await this.flush();else{clearTimeout(this.timer);if(this.running){try{await this.running;}catch{}}}const record=await this.repo.create(this.uid,project);this.pending=null;this.error=null;this.current=record;this.status('saved');return record;}
 async archive(record,archived){if(record.id===this.current.id&&!archived)await this.flush();if(record.id===this.current.id&&archived)throw Error('Hãy mở mô hình khác trước khi lưu trữ mô hình hiện tại.');return this.repo.archive(this.uid,record.id,archived,record.revision);}
 close(){this.closed=true;clearTimeout(this.timer);this.pending=null;this.current=null;this.status('closed');}
}
