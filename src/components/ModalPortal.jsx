import { useEffect } from 'react';
import { createPortal } from 'react-dom';

let openModalCount = 0;

export default function ModalPortal({ children }) {
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    openModalCount += 1;
    if (openModalCount === 1) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      openModalCount = Math.max(0, openModalCount - 1);
      if (openModalCount === 0) {
        document.body.style.overflow = '';
      }
    };
  }, []);

  if (typeof document === 'undefined') return children;
  return createPortal(children, document.body);
}
