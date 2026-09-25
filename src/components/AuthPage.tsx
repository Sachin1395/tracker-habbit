import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Trophy, Zap, Target, Flame } from 'lucide-react';

export default function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);

    if (mode === 'signup') {
      if (name.trim().length < 1) {
        setError('Please enter your name.');
        setBusy(false);
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        setBusy(false);
        return;
      }
      const { error } = await signUp(name.trim(), email.trim(), password);
      if (error) setError(error);
    } else {
      const { error } = await signIn(email.trim(), password);
      if (error) setError(error);
    }
    setBusy(false);
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left: branding */}
        <div className="hidden lg:flex flex-col gap-8 text-white p-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Trophy className="w-7 h-7 text-slate-950" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">XP Tracker</h1>
          </div>
          <div className="space-y-6">
            <h2 className="text-4xl font-bold leading-tight">
              Turn your daily tasks
              <br />
              <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                into a game.
              </span>
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed">
              Compete with friends, climb the leaderboard, and build streaks — one task at a time.
            </p>
            <div className="grid grid-cols-3 gap-4 pt-4">
              <FeatureCard icon={<Zap className="w-6 h-6" />} title="Earn XP" desc="Complete tasks to gain points" />
              <FeatureCard icon={<Flame className="w-6 h-6" />} title="Build Streaks" desc="Track habits over time" />
              <FeatureCard icon={<Target className="w-6 h-6" />} title="Compete" desc="Climb the leaderboard" />
            </div>
          </div>
        </div>

        {/* Right: auth form */}
        <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-slate-800">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-slate-950" />
            </div>
            <h1 className="text-2xl font-bold text-white">XP Tracker</h1>
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">
            {mode === 'signup' ? 'Create your account' : 'Welcome back'}
          </h2>
          <p className="text-slate-400 text-sm mb-6">
            {mode === 'signup' ? 'Start earning XP today.' : 'Sign in to continue your journey.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
                  placeholder="Your name"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full py-2.5 rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-semibold hover:from-amber-300 hover:to-orange-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {busy ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-400">
            {mode === 'signup' ? (
              <>
                Already have an account?{' '}
                <button onClick={() => { setMode('login'); setError(null); }} className="text-amber-400 hover:text-amber-300 font-medium transition">
                  Sign in
                </button>
              </>
            ) : (
              <>
                New here?{' '}
                <button onClick={() => { setMode('signup'); setError(null); }} className="text-amber-400 hover:text-amber-300 font-medium transition">
                  Create an account
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
      <div className="text-amber-400 mb-2">{icon}</div>
      <div className="text-sm font-semibold text-white">{title}</div>
      <div className="text-xs text-slate-400 mt-0.5">{desc}</div>
    </div>
  );
}
