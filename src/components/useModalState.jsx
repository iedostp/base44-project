import { useEffect, useState } from 'react';

export function useModalState(modalName) {
  const [isOpen, setIsOpen] = useState(false);

  const getUrlParams = () => {
    if (typeof window === 'undefined') return { modal: null };
    const params = new URLSearchParams(window.location.search);
    return {
      modal: params.get('modal') || null,
    };
  };

  // Update local state when URL changes
  useEffect(() => {
    const urlState = getUrlParams();
    setIsOpen(urlState.modal === modalName);

    const handlePopState = () => {
      const updated = getUrlParams();
      setIsOpen(updated.modal === modalName);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [modalName]);

  const open = () => {
    const params = new URLSearchParams(window.location.search);
    params.set('modal', modalName);
    window.history.pushState({}, '', `?${params.toString()}`);
    setIsOpen(true);
  };

  const close = () => {
    const params = new URLSearchParams(window.location.search);
    params.delete('modal');
    window.history.pushState({}, '', `?${params.toString()}`);
    setIsOpen(false);
  };

  return { isOpen, open, close };
}