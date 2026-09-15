import React from 'react';
import { AuthProvider } from './lib/auth';
import AuthGate from './components/AuthGate';

function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}

export default App;