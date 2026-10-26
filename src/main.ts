import './ui/style.css';
import { startHub } from './view/game.ts';

const host = document.getElementById('game');
if (!host) throw new Error('Missing game host');
const loading = document.createElement('p');
loading.className = 'loading';
loading.textContent = 'Preparing the gathering…';
host.append(loading);
let stopped = false;
let dispose: (() => void) | undefined;
function stop() {
  stopped = true;
  dispose?.();
  window.removeEventListener('pagehide', stop);
}
window.addEventListener('pagehide', stop);
if (import.meta.hot) import.meta.hot.dispose(stop);
void startHub(host)
  .then((cleanup) => {
    loading.remove();
    dispose = cleanup;
    if (stopped) cleanup();
  })
  .catch((error: unknown) => {
    loading.textContent = 'The hub could not load. Reload to try again.';
    console.error(error);
  });
