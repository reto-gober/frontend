import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const MODAL_ROOT_ID = 'modal-root';

function ensureModalRoot(): HTMLElement {
  let root = document.getElementById(MODAL_ROOT_ID);
  if (!root) {
    root = document.createElement('div');
    root.id = MODAL_ROOT_ID;
    document.body.appendChild(root);
  }
  return root;
}

export function ModalPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  const root = ensureModalRoot();
  return createPortal(children, root);
}
