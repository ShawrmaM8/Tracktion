// src/services/autosync.ts
import SimplePeer from 'simple-peer';
import Automerge from 'automerge';

export function createPeerConnection(signalCallback: (s: any)=>void, onRemotePatch: (patch:any)=>void) {
  const p = new SimplePeer({ initiator: true, trickle: false });
  p.on('signal', signalCallback);
  p.on('data', (d)=>{
    const msg = JSON.parse(d.toString());
    if(msg.type === 'patch') onRemotePatch(msg.patch);
  });
  return p;
}

export function applyAutomergePatch(doc: Automerge.Doc<any>, patch: any): Automerge.Doc<any> {
  return Automerge.applyChanges(doc, patch);
}
