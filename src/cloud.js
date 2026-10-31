import{initializeApp}from'firebase/app';
import{getAuth,setPersistence,browserLocalPersistence,browserSessionPersistence,connectAuthEmulator,onAuthStateChanged,signInWithEmailAndPassword,createUserWithEmailAndPassword,updateProfile,signOut,sendPasswordResetEmail}from'firebase/auth';
import{getFirestore,collection,doc,getDoc,getDocs,query,orderBy,limit,setDoc,runTransaction,serverTimestamp,connectFirestoreEmulator}from'firebase/firestore';
import{validateProject}from'./model.js';import{serializeModel,SaveConflict}from'./project-store.js';
export async function connectCloud(){
 const response=await fetch(`${import.meta.env.BASE_URL}firebase-config.json`,{cache:'no-store'});if(!response.ok)throw Object.assign(Error('Chưa có cấu hình Firebase.'),{code:'setup'});const cfg=await response.json();if(!cfg.apiKey||!cfg.projectId||!cfg.appId||!cfg.authDomain)throw Object.assign(Error('Chưa có cấu hình Firebase.'),{code:'setup'});
 const app=initializeApp(cfg),auth=getAuth(app),db=getFirestore(app);
 // Emulators are opt-in at development build time only, never accepted from a URL or production JSON.
 if(import.meta.env.DEV&&import.meta.env.VITE_USE_EMULATORS==='true'){connectAuthEmulator(auth,'http://127.0.0.1:9099',{disableWarnings:true});connectFirestoreEmulator(db,'127.0.0.1',8080);}

 const ref=(uid,id)=>doc(db,'users',uid,'projects',id),col=uid=>collection(db,'users',uid,'projects');
 const decode=s=>{if(!s.exists())throw Error('Không tìm thấy mô hình.');const d=s.data();return{id:s.id,revision:d.revision,archived:d.archived,name:d.name,project:validateProject(JSON.parse(d.model)),createdAt:d.createdAt?.toMillis?.()||0,updatedAt:d.updatedAt?.toMillis?.()||0};};
 const repo={
  async list(uid){const docs=await getDocs(query(col(uid),orderBy('updatedAt','desc'),limit(100)));return docs.docs.map(decode);},
  async get(uid,id){return decode(await getDoc(ref(uid,id)));},
  async create(uid,project){const model=serializeModel(project),r=doc(col(uid));await setDoc(r,{ownerUid:uid,schemaVersion:1,name:project.name,model,revision:1,archived:false,createdAt:serverTimestamp(),updatedAt:serverTimestamp()});return this.get(uid,r.id);},
  async save(uid,id,project,revision){const model=serializeModel(project),r=ref(uid,id);let saved;await runTransaction(db,async tx=>{const s=await tx.get(r);if(!s.exists()||s.data().revision!==revision||s.data().archived)throw new SaveConflict();saved={...decode(s),project:JSON.parse(model),name:project.name,revision:revision+1,updatedAt:Date.now()};tx.update(r,{model,name:project.name,revision:revision+1,updatedAt:serverTimestamp()});});return saved;},
  async archive(uid,id,archived,revision){const r=ref(uid,id);let saved;await runTransaction(db,async tx=>{const s=await tx.get(r);if(!s.exists()||s.data().revision!==revision)throw new SaveConflict();saved={...decode(s),archived,revision:revision+1,updatedAt:Date.now()};tx.update(r,{archived,revision:revision+1,updatedAt:serverTimestamp()});});return saved;}
 };
 return{mode:'firebase',auth,repo,watch:callback=>onAuthStateChanged(auth,callback),
  async login(email,password,remember){await setPersistence(auth,remember?browserLocalPersistence:browserSessionPersistence);return signInWithEmailAndPassword(auth,email,password);},
  async register(email,password,name){await setPersistence(auth,browserSessionPersistence);const r=await createUserWithEmailAndPassword(auth,email,password);if(name)await updateProfile(r.user,{displayName:name});return r;},
  logout:()=>signOut(auth),reset:email=>sendPasswordResetEmail(auth,email)};
}
