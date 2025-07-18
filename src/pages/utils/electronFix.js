// src/utils/electronFix.js
export const fixElectronInputs = () => {
  // Detectar si estamos en Electron
  const isElectron = window && window.process && window.process.type;
  
  if (!isElectron) return;
  
  // Fix para inputs en Electron
  document.addEventListener('mousedown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      e.target.focus();
      setTimeout(() => {
        e.target.click();
      }, 0);
    }
  });
  
  // Forzar focus en inputs cuando se hace click
  document.addEventListener('click', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      e.preventDefault();
      e.stopPropagation();
      e.target.focus();
      
      // Simular click nativo
      const evt = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true
      });
      e.target.dispatchEvent(evt);
    }
  }, true);
};