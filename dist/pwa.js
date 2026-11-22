// Same scope as the game; embedded previews do not install a worker.
if (window === window.top && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' })
      .catch(error => console.warn('Kierki offline setup failed', error));
  });
}
