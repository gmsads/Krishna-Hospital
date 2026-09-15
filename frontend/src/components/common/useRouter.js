import { useState, useEffect } from 'react';

export function useRouter() {
  const [path, setPath] = useState(window.location.pathname || '/');

  useEffect(() => {
    const handlePopState = () => {
      setPath(window.location.pathname || '/');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (toPath) => {
    if (window.location.pathname !== toPath) {
      window.history.pushState({}, '', toPath);
      setPath(toPath);
    }
  };

  return { path, navigate };
}

export default useRouter;
