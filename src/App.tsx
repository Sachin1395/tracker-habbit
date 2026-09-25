import { useAuth } from '@/lib/auth';
import AuthPage from '@/components/AuthPage';
import Dashboard from '@/components/Dashboard';

function App() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-lg" style={{ color: '#A1A1AA' }}>Loading…</div>
      </div>
    );
  }

  return session ? <Dashboard /> : <AuthPage />;
}

export default App;
