export let cloud=null,workspace=null,currentUser=null;
export function setSession(session){cloud=session.cloud;workspace=session.workspace;currentUser=session.user;}
export function clearSession(){workspace?.close();cloud=null;workspace=null;currentUser=null;}
