import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  ping: () => console.log('pong')
});
