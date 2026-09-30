import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Trophy, Zap, Target, Flame, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

const ORANGE = '#FF9F1C';
const PRIMARY = '#F5F5F5';
const SECONDARY = '#A1A1AA';
const MUTED = '#71717A';

type View = 'login' | 'signup' | 'forgot';

export default function AuthPage() {
  const { signIn, signUp, resetPassword } = useAuth();
  const [view, setView] = useState<View>('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);

    if (view === 'signup') {
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
    } else if (view === 'login') {
      const { error } = await signIn(email.trim(), password);
      if (error) setError(error);
    } else if (view === 'forgot') {
      const { error } = await resetPassword(email.trim());
      if (error) {
        setError(error);
      } else {
        setInfo('If that email is registered, a reset link has been sent. Check your inbox.');
      }
    }
    setBusy(false);
  }

  function switchView(v: View) {
    setView(v);
    setError(null);
    setInfo(null);
  }

  const title =
    view === 'signup' ? 'Create your account' :
    view === 'login' ? 'Welcome back' :
    'Reset your password';

  const subtitle =
    view === 'signup' ? 'Start earning XP today.' :
    view === 'login' ? 'Sign in to continue your journey.' :
    "Enter your email and we'll send you a link to set a new password.";

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      <div className="ambient-glow ambient-glow-orange" style={{ top: '-100px', right: '-100px', width: '400px', height: '400px' }} />
      <div className="ambient-glow ambient-glow-white" style={{ bottom: '-100px', left: '-50px', width: '350px', height: '350px' }} />

      <div className="relative w-full max-w-5xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left: branding */}
        <div className="hidden lg:flex flex-col gap-8 p-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,159,28,0.12)', border: '1px solid rgba(255,159,28,0.18)' }}>
              <Trophy className="w-7 h-7" style={{ color: ORANGE }} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight" style={{ color: PRIMARY }}>XP Tracker</h1>
          </div>
          <div className="space-y-6">
            <h2 className="text-4xl font-bold leading-tight" style={{ color: PRIMARY }}>
              Turn your daily tasks
              <br />
              <span style={{ color: ORANGE }}>into a game.</span>
            </h2>
            <p className="text-lg leading-relaxed" style={{ color: SECONDARY }}>
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
        <div className="glass rounded-[20px] p-8">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,159,28,0.12)', border: '1px solid rgba(255,159,28,0.18)' }}>
              <Trophy className="w-6 h-6" style={{ color: ORANGE }} />
            </div>
            <h1 className="text-2xl font-bold" style={{ color: PRIMARY }}>XP Tracker</h1>
          </div>

          {view === 'forgot' && (
            <button
              onClick={() => switchView('login')}
              className="flex items-center gap-1.5 text-sm mb-4 transition"
              style={{ color: SECONDARY }}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to sign in
            </button>
          )}

          <h2 className="text-2xl font-bold mb-2" style={{ color: PRIMARY }}>{title}</h2>
          <p className="text-sm mb-6" style={{ color: SECONDARY }}>{subtitle}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {view === 'signup' && (
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: SECONDARY }}>Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="glass-input w-full px-4 py-2.5 rounded-xl"
                  style={{ color: PRIMARY }}
                  placeholder="Your name"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: SECONDARY }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="glass-input w-full px-4 py-2.5 rounded-xl"
                style={{ color: PRIMARY }}
                placeholder="you@example.com"
                required
              />
            </div>
            {view !== 'forgot' && (
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: SECONDARY }}>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-input w-full px-4 py-2.5 rounded-xl"
                  style={{ color: PRIMARY }}
                  placeholder="••••••••"
                  required
                />
              </div>
            )}

            {error && (
              <div className="text-sm rounded-lg px-4 py-2.5" style={{ color: '#EF4444', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
                {error}
              </div>
            )}

            {info && (
              <div className="text-sm rounded-lg px-4 py-2.5 flex items-start gap-2" style={{ color: '#22C55E', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)' }}>
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{info}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="btn-primary w-full py-2.5"
            >
              {busy ? 'Please wait…' :
                view === 'signup' ? 'Create account' :
                view === 'login' ? 'Sign in' :
                'Send reset link'}
            </button>
          </form>

          <div className="mt-6 space-y-2 text-center text-sm" style={{ color: SECONDARY }}>
            {view === 'signup' && (
              <div>
                Already have an account?{' '}
                <button onClick={() => switchView('login')} className="font-medium transition" style={{ color: ORANGE }}>
                  Sign in
                </button>
              </div>
            )}
            {view === 'login' && (
              <>
                <div>
                  New here?{' '}
                  <button onClick={() => switchView('signup')} className="font-medium transition" style={{ color: ORANGE }}>
                    Create an account
                  </button>
                </div>
                <div>
                  <button
                    onClick={() => switchView('forgot')}
                    className="font-medium transition inline-flex items-center gap-1"
                    style={{ color: SECONDARY }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = ORANGE; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = SECONDARY; }}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    Forgot your password?
                  </button>
                </div>
              </>
            )}
            {view === 'forgot' && (
              <div>
                Remembered it?{' '}
                <button onClick={() => switchView('login')} className="font-medium transition" style={{ color: ORANGE }}>
                  Back to sign in
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="mb-2" style={{ color: ORANGE }}>{icon}</div>
      <div className="text-sm font-semibold" style={{ color: PRIMARY }}>{title}</div>
      <div className="text-xs mt-0.5" style={{ color: MUTED }}>{desc}</div>
    </div>
  );
}
