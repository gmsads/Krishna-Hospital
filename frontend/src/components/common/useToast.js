import { useState } from 'react';

export function useToast() {
  const [toast, setToast] = useState('');
  const notify = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2800);
  };
  return { toast, notify };
}
