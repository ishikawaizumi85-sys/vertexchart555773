import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'motion/react';
import { 
  Upload, Activity, Target, ShieldAlert, TrendingUp, 
  TrendingDown, RefreshCw, FileText, BarChart3, 
  History, Trash2, Clock, ChevronRight, Maximize2, 
  Zap, Info, Settings, LayoutGrid, Sparkles, User, Camera, Check, X, Bell, Search,
  ArrowUpRight, ArrowDownRight, Minus, LogIn, UserPlus, ShieldCheck, ExternalLink, Lock, Mail, Key
} from 'lucide-react';
import { analyzeChart, TradingAnalysis } from '../services/gemini';
import { cn } from '../lib/utils';
import { DrawingCanvas } from './DrawingCanvas';

// --- Types ---
interface HistoryItem {
  id: string;
  timestamp: number;
  image: string;
  result: TradingAnalysis;
}

interface UserProfile {
  email: string;
  name: string;
  avatar: string | null;
  isVerified: boolean;
  expiryDate: number | null; // timestamp
  isAdmin: boolean;
}

interface AppUser extends UserProfile {
  password?: string;
}

const ADMIN_CODE = "102231913104822";
const WA_LINK = "https://wa.me/85640326164";

export default function ChartAnalyzer() {
  // --- Auth State ---
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [allUsers, setAllUsers] = useState<AppUser[]>([]);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'admin-login'>('login');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [adminCodeInput, setAdminCodeInput] = useState('');
  const [authError, setAuthError] = useState('');

  // --- App State ---
  const [image, setImage] = useState<string | null>(null);
  const [markedImage, setMarkedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<TradingAnalysis | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [tempProfile, setTempProfile] = useState<{name: string, avatar: string | null}>({ name: '', avatar: null });
  const [view, setView] = useState<'app' | 'admin-panel'>('app');
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (image && canvasContainerRef.current) {
      const updateSize = () => {
        if (canvasContainerRef.current) {
          const { width, height } = canvasContainerRef.current.getBoundingClientRect();
          setCanvasSize({ width, height });
        }
      };
      updateSize();
      window.addEventListener('resize', updateSize);
      return () => window.removeEventListener('resize', updateSize);
    }
  }, [image]);

  // --- Initialization ---
  useEffect(() => {
    const savedUsers = localStorage.getItem('vertex_users');
    if (savedUsers) {
      setAllUsers(JSON.parse(savedUsers));
    }

    const session = localStorage.getItem('vertex_session');
    if (session) {
      const user = JSON.parse(session);
      const latestUsers = JSON.parse(localStorage.getItem('vertex_users') || '[]');
      const latestUser = latestUsers.find((u: AppUser) => u.email === user.email);
      if (latestUser) {
        setCurrentUser(latestUser);
      }
    }

    const savedHistory = localStorage.getItem('vertex_chart_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to parse history', e);
      }
    }
  }, []);

  // --- Persistence ---
  useEffect(() => {
    localStorage.setItem('vertex_users', JSON.stringify(allUsers));
  }, [allUsers]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('vertex_session', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('vertex_session');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('vertex_chart_history', JSON.stringify(history));
  }, [history]);

  // --- Auth Handlers ---
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !passwordInput || !nameInput) {
      setAuthError('All fields are required');
      return;
    }
    if (allUsers.find(u => u.email === emailInput)) {
      setAuthError('Email already registered');
      return;
    }

    const newUser: AppUser = {
      email: emailInput,
      password: passwordInput,
      name: nameInput,
      avatar: null,
      isVerified: false,
      expiryDate: null,
      isAdmin: false
    };

    setAllUsers([...allUsers, newUser]);
    setCurrentUser(newUser);
    setAuthError('');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = allUsers.find(u => u.email === emailInput && u.password === passwordInput);
    if (user) {
      setCurrentUser(user);
      setAuthError('');
    } else {
      setAuthError('Invalid email or password');
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminCodeInput === ADMIN_CODE) {
      const adminUser: AppUser = {
        email: 'admin@vertex.chart',
        name: 'System Admin',
        avatar: null,
        isVerified: true,
        expiryDate: null,
        isAdmin: true
      };
      setCurrentUser(adminUser);
      setView('admin-panel');
      setAuthError('');
    } else {
      setAuthError('Invalid Admin Code');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setView('app');
    setImage(null);
    setResult(null);
  };

  // --- Admin Handlers ---
  const verifyUser = (email: string, days: number) => {
    const expiry = Date.now() + (days * 24 * 60 * 60 * 1000);
    setAllUsers(prev => prev.map(u => 
      u.email === email ? { ...u, isVerified: true, expiryDate: expiry } : u
    ));
  };

  const deleteUser = (email: string) => {
    setAllUsers(prev => prev.filter(u => u.email !== email));
  };

  // --- App Handlers ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setMarkedImage(reader.result as string);
        setResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const startAnalysis = async () => {
    const targetImage = markedImage || image;
    if (!targetImage) return;
    setIsAnalyzing(true);
    const analysis = await analyzeChart(targetImage);
    if (analysis) {
      setResult(analysis);
      const newItem: HistoryItem = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        image: targetImage,
        result: analysis
      };
      setHistory(prev => [newItem, ...prev].slice(0, 20));
    }
    setIsAnalyzing(false);
  };

  const loadFromHistory = (item: HistoryItem) => {
    setImage(item.image);
    setResult(item.result);
    if (window.innerWidth < 1024) setShowHistory(false);
  };

  const deleteHistoryItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const reset = () => {
    setImage(null);
    setMarkedImage(null);
    setResult(null);
  };

  const openProfileEdit = () => {
    setTempProfile({ name: currentUser?.name || '', avatar: currentUser?.avatar || null });
    setIsEditingProfile(true);
  };

  const saveProfile = () => {
    if (tempProfile.name.trim() && currentUser) {
      const updatedUser = { ...currentUser, name: tempProfile.name, avatar: tempProfile.avatar };
      setCurrentUser(updatedUser);
      setAllUsers(prev => prev.map(u => u.email === currentUser.email ? updatedUser : u));
      setIsEditingProfile(false);
    }
  };

  // --- Subscription Check ---
  const isSubscriptionActive = () => {
    if (!currentUser) return false;
    if (currentUser.isAdmin) return true;
    if (!currentUser.isVerified || !currentUser.expiryDate) return false;
    return Date.now() < currentUser.expiryDate;
  };

  // --- Render Helpers ---
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-black text-zinc-400 font-sans flex overflow-hidden">
        {/* Left Side: Atmospheric Branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-black relative overflow-hidden items-center justify-center p-20">
          <div className="absolute inset-0 opacity-20">
            <img 
              src="https://picsum.photos/seed/trading/1920/1080?blur=10" 
              alt="Background" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 via-purple-900/20 to-black" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 atmosphere-glow opacity-30" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 atmosphere-glow opacity-20" />
          <div className="absolute inset-0 technical-grid opacity-5" />
          
          <div className="relative z-10 max-w-lg">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <div className="w-16 h-16 bg-white/5 backdrop-blur-xl rounded-2xl flex items-center justify-center mb-10 border border-white/10 glow-indigo">
                <BarChart3 className="text-white w-8 h-8" />
              </div>
              <h1 className="text-4xl md:text-7xl font-black tracking-tighter text-white leading-[0.9] italic mb-8">
                Vertex <br />
                <span className="text-indigo-500 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]">Intelligence.</span>
              </h1>
              <p className="text-lg md:text-xl text-zinc-400 font-medium leading-relaxed mb-12">
                The next generation of quantitative market analysis. Powered by advanced neural networks and institutional-grade technical models.
              </p>
              
              <div className="grid grid-cols-2 gap-8 border-t border-white/5 pt-12">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] font-black text-zinc-600 mb-2">Accuracy Rate</p>
                  <p className="text-3xl font-mono font-bold text-white">94.2%</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] font-black text-zinc-600 mb-2">Latency</p>
                  <p className="text-3xl font-mono font-bold text-white">&lt; 120ms</p>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="absolute left-10 bottom-10 flex items-center gap-4">
            <div className="w-1 h-1 rounded-full bg-indigo-500 animate-pulse glow-indigo" />
            <p className="text-[9px] uppercase tracking-[0.4em] font-black text-zinc-600">System Status: Operational</p>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-20 bg-black relative">
          <div className="absolute top-10 right-10 lg:hidden">
            <div className="flex items-center gap-3">
              <BarChart3 className="text-indigo-500 w-6 h-6" />
              <span className="text-xl font-black tracking-tighter uppercase italic text-white">Vertex</span>
            </div>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="w-full max-w-md"
          >
            <div className="mb-8 md:mb-12">
              <h2 className="text-2xl md:text-4xl font-black tracking-tighter text-white mb-3 italic uppercase">
                {authMode === 'login' ? 'Welcome Back' : authMode === 'register' ? 'Join Vertex' : 'Admin Access'}
              </h2>
              <p className="text-sm md:text-base text-zinc-500 font-medium">
                {authMode === 'login' ? 'Enter your credentials to access the terminal.' : 
                 authMode === 'register' ? 'Create your institutional account today.' : 
                 'Authorized personnel only beyond this point.'}
              </p>
            </div>

            <form onSubmit={authMode === 'login' ? handleLogin : authMode === 'register' ? handleRegister : handleAdminLogin} className="space-y-6 md:space-y-8">
              {authMode === 'register' && (
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-black text-zinc-600 ml-1">Full Name</label>
                  <div className="group relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-700 group-focus-within:text-indigo-500 transition-colors" />
                    <input 
                      type="text" 
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl pl-12 pr-5 py-5 text-white focus:outline-none focus:border-indigo-500/50 focus:bg-zinc-900 transition-all text-sm font-medium"
                      placeholder="John Doe"
                    />
                  </div>
                </div>
              )}

              {authMode !== 'admin-login' ? (
                <>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-black text-zinc-600 ml-1">Email Address</label>
                    <div className="group relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-700 group-focus-within:text-indigo-500 transition-colors" />
                      <input 
                        type="email" 
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl pl-12 pr-5 py-5 text-white focus:outline-none focus:border-indigo-500/50 focus:bg-zinc-900 transition-all text-sm font-medium"
                        placeholder="name@example.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between ml-1">
                      <label className="text-[10px] uppercase tracking-widest font-black text-zinc-600">Password</label>
                      {authMode === 'login' && (
                        <button type="button" className="text-[9px] uppercase tracking-widest font-black text-indigo-500 hover:text-indigo-400 transition-colors">Forgot?</button>
                      )}
                    </div>
                    <div className="group relative">
                      <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-700 group-focus-within:text-indigo-500 transition-colors" />
                      <input 
                        type="password" 
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl pl-12 pr-5 py-5 text-white focus:outline-none focus:border-indigo-500/50 focus:bg-zinc-900 transition-all text-sm font-medium"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-black text-zinc-600 ml-1">Admin Access Code</label>
                  <div className="group relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-700 group-focus-within:text-indigo-500 transition-colors" />
                    <input 
                      type="password" 
                      value={adminCodeInput}
                      onChange={(e) => setAdminCodeInput(e.target.value)}
                      className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl pl-12 pr-5 py-5 text-white focus:outline-none focus:border-indigo-500/50 focus:bg-zinc-900 transition-all text-sm font-medium"
                      placeholder="Enter secure code..."
                    />
                  </div>
                </div>
              )}

              {authError && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-[10px] font-bold uppercase tracking-widest text-center"
                >
                  {authError}
                </motion.div>
              )}

              <button 
                type="submit"
                className="w-full py-5 md:py-6 bg-white text-black rounded-2xl font-black text-[10px] md:text-[11px] uppercase tracking-[0.3em] md:tracking-[0.4em] hover:bg-zinc-200 active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(255,255,255,0.1)]"
              >
                {authMode === 'login' ? <LogIn className="w-5 h-5" /> : authMode === 'register' ? <UserPlus className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                {authMode === 'login' ? 'Initialize Session' : authMode === 'register' ? 'Create Account' : 'Admin Access'}
              </button>
            </form>

            <div className="mt-12 flex flex-col gap-6 text-center">
              <div className="flex items-center gap-4">
                <div className="h-[1px] flex-1 bg-white/5" />
                <span className="text-[9px] uppercase tracking-widest font-black text-zinc-700">Alternative Options</span>
                <div className="h-[1px] flex-1 bg-white/5" />
              </div>

              <div className="flex flex-col gap-4">
                {authMode === 'login' ? (
                  <>
                    <button onClick={() => setAuthMode('register')} className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-indigo-500 transition-colors">
                      New to Vertex? <span className="text-indigo-500 ml-1">Register Account</span>
                    </button>
                    <button onClick={() => setAuthMode('admin-login')} className="text-[10px] font-bold uppercase tracking-widest text-zinc-700 hover:text-zinc-500 transition-colors">
                      Access Admin Terminal
                    </button>
                  </>
                ) : (
                  <button onClick={() => setAuthMode('login')} className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-indigo-500 transition-colors">
                    Already have an account? <span className="text-indigo-500 ml-1">Log In</span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>

          {/* Footer removed as per user request */}
        </div>
      </div>
    );
  }

  if (!isSubscriptionActive() && !currentUser.isAdmin) {
    return (
      <div className="min-h-screen bg-black text-zinc-400 font-sans flex items-center justify-center p-6 technical-grid">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-lg bg-[#0a0a0a] p-12 rounded-[40px] border border-white/5 text-center shadow-2xl"
        >
          <div className="w-20 h-20 bg-amber-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-amber-500/20">
            <ShieldAlert className="text-amber-500 w-10 h-10" />
          </div>
          <h2 className="text-3xl font-black tracking-tighter text-white mb-4 uppercase italic">Activation Required</h2>
          <p className="text-zinc-500 leading-relaxed mb-10">
            Akun Anda belum aktif atau masa berlangganan telah habis. Silakan hubungi administrator melalui WhatsApp untuk verifikasi dan aktivasi paket.
          </p>
          
          <div className="space-y-4">
            <a 
              href={WA_LINK} 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full py-6 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-indigo-500/20"
            >
              <ExternalLink className="w-5 h-5" />
              Konfirmasi via WhatsApp
            </a>
            <button 
              onClick={handleLogout}
              className="w-full py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-700 hover:text-white transition-colors"
            >
              Logout
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (view === 'admin-panel') {
    return (
      <div className="min-h-screen bg-black text-zinc-400 font-sans flex flex-col technical-grid">
        <header className="h-20 border-b border-white/5 bg-black/80 backdrop-blur-xl flex items-center justify-between px-8 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <ShieldCheck className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight uppercase text-white">Admin Control</h1>
              <p className="text-[9px] text-zinc-600 uppercase tracking-widest font-bold">User Management</p>
            </div>
          </div>
          <button onClick={() => setView('app')} className="px-6 py-2.5 bg-white text-black text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-zinc-200 transition-all">
            Exit Admin
          </button>
        </header>

        <main className="flex-1 p-8 lg:p-12 max-w-5xl mx-auto w-full">
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Pending & Active Users</h2>
              <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">Total Users: {allUsers.length}</div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {allUsers.length === 0 ? (
                <div className="p-20 text-center opacity-20 border border-dashed border-white/5 rounded-3xl">
                  <User className="w-12 h-12 mx-auto mb-4" />
                  <p className="text-xs uppercase tracking-widest font-bold">No users registered yet</p>
                </div>
              ) : (
                allUsers.map((user) => (
                  <div key={user.email} className="modern-card p-4 md:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-zinc-900 flex items-center justify-center border border-white/5">
                        {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover rounded-xl" /> : <User className="w-5 h-5 md:w-6 md:h-6 text-zinc-800" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{user.name}</p>
                        <p className="text-[10px] text-zinc-600 font-mono truncate max-w-[150px] md:max-w-none">{user.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={cn(
                            "text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest",
                            user.isVerified ? "bg-indigo-500/10 text-indigo-500" : "bg-amber-500/10 text-amber-500"
                          )}>
                            {user.isVerified ? 'Active' : 'Pending'}
                          </span>
                          {user.expiryDate && (
                            <span className="text-[8px] text-zinc-600 font-mono">
                              Exp: {new Date(user.expiryDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
                      <button onClick={() => verifyUser(user.email, 3)} className="flex-1 sm:flex-none px-3 py-2 bg-zinc-900 text-zinc-400 text-[8px] md:text-[9px] font-bold uppercase tracking-widest rounded-lg hover:bg-indigo-600 hover:text-white transition-all whitespace-nowrap">3D</button>
                      <button onClick={() => verifyUser(user.email, 7)} className="flex-1 sm:flex-none px-3 py-2 bg-zinc-900 text-zinc-400 text-[8px] md:text-[9px] font-bold uppercase tracking-widest rounded-lg hover:bg-indigo-600 hover:text-white transition-all whitespace-nowrap">7D</button>
                      <button onClick={() => verifyUser(user.email, 30)} className="flex-1 sm:flex-none px-3 py-2 bg-zinc-900 text-zinc-400 text-[8px] md:text-[9px] font-bold uppercase tracking-widest rounded-lg hover:bg-indigo-600 hover:text-white transition-all whitespace-nowrap">30D</button>
                      <button onClick={() => deleteUser(user.email)} className="p-2 text-zinc-800 hover:text-red-500 transition-colors ml-auto sm:ml-2">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-400 font-sans selection:bg-indigo-500/30 flex overflow-hidden technical-grid">
      <LayoutGroup>
        {/* Profile Edit Modal */}
        <AnimatePresence>
          {isEditingProfile && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsEditingProfile(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              />
              <motion.div
                layoutId="profile-modal"
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-[40px] overflow-hidden shadow-2xl"
              >
                <div className="h-32 bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-transparent relative">
                  <div className="absolute inset-0 technical-grid opacity-20" />
                </div>
                <div className="px-8 pb-8">
                  <div className="relative -mt-16 mb-8 flex justify-center">
                    <div className="relative group">
                      <div className="w-32 h-32 rounded-[40px] bg-[#0a0a0a] border-8 border-[#0a0a0a] overflow-hidden shadow-xl transition-transform group-hover:scale-105 duration-500">
                        {tempProfile.avatar ? (
                          <img src={tempProfile.avatar} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                            <User className="w-12 h-12 text-zinc-800" />
                          </div>
                        )}
                      </div>
                      <button 
                        onClick={() => avatarInputRef.current?.click()}
                        className="absolute inset-0 flex items-center justify-center bg-indigo-600/60 opacity-0 group-hover:opacity-100 transition-all rounded-[40px] backdrop-blur-sm"
                      >
                        <Camera className="w-8 h-8 text-white" />
                      </button>
                      <input 
                        type="file" 
                        ref={avatarInputRef} 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => setTempProfile(prev => ({ ...prev, avatar: reader.result as string }));
                            reader.readAsDataURL(file);
                          }
                        }} 
                        className="hidden" 
                        accept="image/*"
                      />
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-600 block ml-1">Identity</label>
                      <input 
                        type="text" 
                        value={tempProfile.name}
                        onChange={(e) => setTempProfile(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full bg-zinc-900/50 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 transition-all text-sm font-medium"
                        placeholder="Enter username..."
                      />
                    </div>

                    <div className="flex gap-4">
                      <button 
                        onClick={() => setIsEditingProfile(false)}
                        className="flex-1 py-4 bg-zinc-900 text-zinc-500 rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-zinc-800 transition-all"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={saveProfile}
                        className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
                      >
                        <Check className="w-4 h-4" />
                        Update
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Sidebar History */}
        <AnimatePresence>
          {showHistory && (
            <motion.aside
              initial={{ x: -320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -320, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-50 w-full sm:w-80 bg-black border-r border-white/5 flex flex-col shadow-2xl lg:relative lg:z-10"
            >
              <div className="p-8 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                    <History className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div>
                    <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-white">Archives</h2>
                    <p className="text-[9px] text-zinc-600 font-medium uppercase tracking-widest mt-0.5">Vertex History</p>
                  </div>
                </div>
                <button onClick={() => setShowHistory(false)} className="lg:hidden p-2 text-zinc-500 hover:text-white transition-colors">
                  <ChevronRight className="w-5 h-5 rotate-180" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
                {history.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-20">
                    <Clock className="w-12 h-12 mb-4 stroke-[1px] text-zinc-900" />
                    <p className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-800">No Data</p>
                  </div>
                ) : (
                  history.map((item) => (
                    <motion.div
                      layout
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      onClick={() => loadFromHistory(item)}
                      className="group relative bg-[#0a0a0a] border border-white/5 rounded-2xl p-4 cursor-pointer transition-all hover:border-indigo-500/20 hover:bg-indigo-500/5"
                    >
                      <div className="flex gap-4">
                        <div className="w-20 h-14 bg-black rounded-xl overflow-hidden flex-shrink-0 border border-white/5">
                          <img src={item.image} className="w-full h-full object-cover opacity-40 group-hover:opacity-100 transition-all duration-500" />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <div className="flex items-center justify-between mb-2">
                            <span className={cn(
                              "text-[9px] font-black px-2 py-0.5 rounded-md tracking-tighter",
                              item.result.signal === 'BUY' ? "bg-emerald-500/10 text-emerald-500" : 
                              item.result.signal === 'SELL' ? "bg-red-500/10 text-red-500" : 
                              "bg-zinc-900 text-zinc-500"
                            )}>
                              {item.result.signal}
                            </span>
                            <span className="text-[9px] text-zinc-700 font-mono">
                              {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[10px] text-zinc-600 truncate font-mono tracking-tighter">E: {item.result.entry}</p>
                        </div>
                      </div>
                      <button 
                        onClick={(e) => deleteHistoryItem(e, item.id)}
                        className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 p-2 bg-zinc-900 text-zinc-600 rounded-full border border-white/5 shadow-xl transition-all hover:bg-red-500 hover:text-white"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </motion.div>
                  ))
                )}
              </div>
              
              <div className="p-6 border-t border-white/5">
                <button 
                  onClick={() => setHistory([])}
                  className="w-full py-4 text-[9px] uppercase tracking-[0.3em] font-black text-zinc-700 hover:text-red-500 transition-all border border-dashed border-white/5 rounded-2xl hover:bg-red-500/5"
                >
                  Purge Archives
                </button>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        <div className="flex-1 relative z-10 overflow-y-auto flex flex-col">
          {/* Top Navigation Bar */}
          <header className="h-16 md:h-20 border-b border-white/5 bg-black/80 backdrop-blur-xl flex items-center justify-between px-4 md:px-8 sticky top-0 z-40">
            <div className="flex items-center gap-3 md:gap-8">
              <button 
                onClick={() => setShowHistory(!showHistory)}
                className={cn(
                  "w-9 h-9 md:w-11 md:h-11 rounded-xl md:rounded-2xl flex items-center justify-center transition-all border",
                  showHistory ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/20" : "bg-zinc-900 text-zinc-600 border-white/5 hover:text-indigo-500 hover:border-indigo-500/20"
                )}
              >
                <History className="w-4 h-4 md:w-5 md:h-5" />
              </button>
              <div className="h-6 w-[1px] bg-white/5 hidden md:block" />
              <div className="flex items-center gap-2 md:gap-4">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-indigo-600 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <BarChart3 className="text-white w-5 h-5 md:w-6 md:h-6" />
                </div>
                <div className="leading-none">
                  <h1 className="text-sm md:text-base font-black tracking-tight uppercase text-white italic">VertexChart</h1>
                  <p className="text-[8px] md:text-[9px] text-zinc-700 uppercase tracking-[0.1em] md:tracking-[0.2em] font-bold mt-0.5 md:mt-1">AI Quant Analysis</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 md:gap-8">
              <div className="hidden lg:flex items-center gap-10">
                {['Terminal', 'Signals', 'Community'].map((item) => (
                  <button key={item} className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-600 hover:text-white transition-all relative group">
                    {item}
                    <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-indigo-500 transition-all group-hover:w-full" />
                  </button>
                ))}
                {currentUser.isAdmin && (
                  <button onClick={() => setView('admin-panel')} className="text-[10px] uppercase tracking-[0.2em] font-black text-indigo-500 hover:text-indigo-400 transition-all">
                    Admin Panel
                  </button>
                )}
              </div>
              
              <div className="h-6 w-[1px] bg-white/5 hidden md:block" />
              
              <div className="flex items-center gap-2 md:gap-4">
                <button onClick={handleLogout} className="p-2 text-zinc-700 hover:text-red-500 transition-colors">
                  <X className="w-4 h-4 md:w-5 md:h-5" />
                </button>
                
                {/* Discord-style Profile Menu */}
                <button 
                  onClick={openProfileEdit}
                  className="group flex items-center gap-2 md:gap-4 bg-zinc-900/50 border border-white/5 pl-1.5 pr-3 md:pl-2 md:pr-5 py-1.5 md:py-2 rounded-xl md:rounded-2xl hover:bg-zinc-900 hover:border-white/10 transition-all shadow-sm"
                >
                  <div className="w-7 h-7 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-zinc-800 overflow-hidden border border-white/10 shadow-inner transition-transform group-hover:scale-105">
                    {currentUser.avatar ? (
                      <img src={currentUser.avatar} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                        <User className="w-4 h-4 md:w-5 md:h-5 text-zinc-700" />
                      </div>
                    )}
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="text-[10px] md:text-[11px] font-black text-white leading-none mb-1 md:mb-1.5 tracking-tight">{currentUser.name}</p>
                    <div className="flex items-center gap-1.5 md:gap-2">
                      <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                      <p className="text-[7px] md:text-[8px] text-zinc-600 uppercase tracking-widest font-black">Online</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </header>

          <main className="flex-1 p-6 md:p-12 lg:p-20 max-w-7xl mx-auto w-full">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-20">
              {/* Left Column: Input Terminal */}
              <div className="lg:col-span-7 space-y-8 md:space-y-12">
                <div className="space-y-4 md:space-y-6">
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-flex items-center gap-2 md:gap-3 px-3 md:px-4 py-1.5 md:py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full"
                  >
                    <Sparkles className="w-2.5 h-2.5 md:w-3 md:h-3 text-indigo-500" />
                    <span className="text-[8px] md:text-[9px] uppercase tracking-[0.15em] md:tracking-[0.2em] font-black text-indigo-500">Vertex Intelligence Engine</span>
                  </motion.div>
                  <h2 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tighter text-white leading-[0.95]">
                    Precision <br />
                    <span className="text-zinc-800">Market Decoding.</span>
                  </h2>
                  <p className="text-zinc-500 text-sm md:text-lg max-w-md leading-relaxed font-medium">
                    Automated technical analysis using SMC, SNR, and Macro fundamentals.
                  </p>
                </div>

                <div className="relative group">
                  <div className="absolute -inset-4 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent rounded-[48px] blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                  <div className="relative modern-card p-4 md:p-6 min-h-[300px] md:min-h-[400px] flex flex-col" ref={canvasContainerRef}>
                    {!image ? (
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 flex flex-col items-center justify-center cursor-pointer hover:bg-white/[0.01] transition-all border-2 border-dashed border-white/5 rounded-[24px] md:rounded-[32px] group/upload p-6"
                      >
                        <div className="w-16 h-16 md:w-20 md:h-20 bg-zinc-900 rounded-[24px] md:rounded-[28px] flex items-center justify-center mb-6 md:mb-8 group-hover/upload:scale-110 transition-all duration-500 border border-white/5 shadow-sm">
                          <Upload className="w-6 h-6 md:w-7 md:h-7 text-zinc-700 group-hover/upload:text-indigo-500 transition-colors" />
                        </div>
                        <p className="text-sm md:text-base font-bold text-zinc-600 tracking-tight text-center">Initialize Market Sequence</p>
                        <p className="text-[8px] md:text-[10px] text-zinc-800 mt-2 md:mt-3 uppercase tracking-[0.2em] md:tracking-[0.3em] font-black">Drop Chart Data Here</p>
                      </div>
                    ) : (
                      <div className="relative flex-1 flex flex-col">
                        <div className="flex-1 min-h-[250px] md:min-h-[300px]">
                          {canvasSize.width > 0 && (
                            <DrawingCanvas 
                              imageUrl={image} 
                              onExport={setMarkedImage}
                              width={canvasSize.width}
                              height={canvasSize.height - (window.innerWidth < 768 ? 60 : 80)}
                            />
                          )}
                        </div>
                        {isAnalyzing && <div className="absolute inset-x-0 scanline pointer-events-none" />}
                        <div className="absolute top-2 right-2 md:top-4 md:right-4 flex gap-2 md:gap-3 z-30">
                          <button 
                            onClick={reset}
                            className="p-2.5 md:p-3.5 bg-black border border-white/10 rounded-xl md:rounded-2xl hover:bg-red-500/10 hover:border-red-500/20 transition-all group/reset shadow-xl"
                          >
                            <RefreshCw className="w-4 h-4 md:w-5 md:h-5 text-zinc-700 group-hover/reset:text-red-500 transition-colors" />
                          </button>
                        </div>
                      </div>
                    )}
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileChange} 
                      className="hidden" 
                      accept="image/*"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 md:gap-5">
                  <button
                    disabled={!image || isAnalyzing}
                    onClick={startAnalysis}
                    className={cn(
                      "flex-1 py-5 md:py-6 rounded-[20px] md:rounded-[24px] font-black text-[10px] md:text-[11px] uppercase tracking-[0.3em] md:tracking-[0.4em] transition-all flex items-center justify-center gap-3 md:gap-4 relative overflow-hidden group",
                      !image ? "bg-zinc-900 text-zinc-700 cursor-not-allowed border border-white/5" : 
                      isAnalyzing ? "bg-indigo-500/10 text-indigo-500 border border-indigo-500/20" : 
                      "bg-white text-black hover:bg-zinc-200 active:scale-[0.98] shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                    )}
                  >
                    {isAnalyzing ? (
                      <>
                        <RefreshCw className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 md:w-5 md:h-5 fill-current" />
                        Execute Analysis
                      </>
                    )}
                  </button>
                  <button className="px-6 md:px-8 py-5 md:py-6 bg-black border border-white/5 rounded-[20px] md:rounded-[24px] text-zinc-700 hover:text-white hover:border-white/10 transition-all shadow-sm flex items-center justify-center">
                    <LayoutGrid className="w-5 h-5" />
                  </button>
                </div>

                {/* Technical Specs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
                  {[
                    { label: 'SMC', value: 'Active', icon: Activity },
                    { label: 'SNR', value: 'Neutral', icon: Target },
                    { label: 'Macro', value: 'Sync', icon: FileText },
                    { label: 'STD', value: '1.2σ', icon: Zap }
                  ].map((spec, i) => (
                    <div key={i} className="modern-card p-4 md:p-6 flex flex-col gap-3 md:gap-4 group hover:border-white/10">
                      <div className="flex items-center justify-between">
                        <spec.icon className="w-3.5 h-3.5 md:w-4 md:h-4 text-zinc-800 group-hover:text-indigo-500 transition-colors" />
                        <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-zinc-900" />
                      </div>
                      <div>
                        <p className="text-[8px] md:text-[9px] uppercase tracking-widest font-black text-zinc-700 mb-1 md:mb-1.5">{spec.label}</p>
                        <p className="text-[10px] md:text-[11px] font-mono font-bold text-zinc-500">{spec.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Intelligence Output */}
              <div className="lg:col-span-5">
                <div className="sticky top-24 md:top-32">
                  <AnimatePresence mode="wait">
                    {result ? (
                      <motion.div
                        initial={{ opacity: 0, y: 30, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 30, scale: 0.95 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="space-y-6 md:space-y-8"
                      >
                        {/* Signal Header */}
                        <div className={cn(
                          "p-8 md:p-12 rounded-[32px] md:rounded-[40px] flex flex-col items-center text-center relative overflow-hidden modern-card",
                          result.signal === 'BUY' ? "border-emerald-500/20 bg-emerald-500/5 glow-indigo" : 
                          result.signal === 'SELL' ? "border-red-500/20 bg-red-500/5 glow-purple" : 
                          "border-white/5"
                        )}>
                          <div className={cn(
                            "w-16 h-16 md:w-20 md:h-20 rounded-[24px] md:rounded-[28px] flex items-center justify-center mb-6 md:mb-8 shadow-2xl transition-transform hover:scale-110 duration-500",
                            result.signal === 'BUY' ? "bg-emerald-500 text-white shadow-[0_0_30px_rgba(16,185,129,0.3)]" : 
                            result.signal === 'SELL' ? "bg-red-500 text-white shadow-[0_0_30px_rgba(239,68,68,0.3)]" : 
                            "bg-zinc-800 text-white"
                          )}>
                            {result.signal === 'BUY' ? <TrendingUp className="w-8 h-8 md:w-10 md:h-10" /> : 
                             result.signal === 'SELL' ? <TrendingDown className="w-8 h-8 md:w-10 md:h-10" /> : 
                             <Activity className="w-8 h-8 md:w-10 md:h-10" />}
                          </div>
                          
                          <h2 className={cn(
                            "text-3xl md:text-5xl font-black tracking-tighter mb-2 md:mb-3 italic",
                            result.signal === 'BUY' ? "text-emerald-500 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]" : 
                            result.signal === 'SELL' ? "text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]" : 
                            "text-white"
                          )}>
                            {result.signal}
                          </h2>
                          <div className="flex items-center gap-3 md:gap-4">
                            <span className="text-[9px] md:text-[10px] uppercase tracking-[0.2em] md:tracking-[0.3em] font-black text-zinc-700">Confidence</span>
                            <div className="flex gap-1 md:gap-1.5">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <div key={s} className={cn(
                                  "w-3 h-1 md:w-4 md:h-1.5 rounded-full",
                                  s <= (result.confidence / 20) ? (result.signal === 'BUY' ? "bg-emerald-500" : "bg-red-500") : "bg-zinc-900"
                                )} />
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Execution Levels */}
                        <div className="grid grid-cols-1 gap-3 md:gap-4">
                          {[
                            { label: 'Entry Point', value: result.entry, icon: Target, color: 'text-zinc-500' },
                            { label: 'Take Profit', value: result.tp, icon: TrendingUp, color: 'text-emerald-500' },
                            { label: 'Stop Loss', value: result.sl, icon: ShieldAlert, color: 'text-red-500' }
                          ].map((level, i) => (
                            <div key={i} className="modern-card p-5 md:p-7 flex items-center justify-between group hover:border-white/10">
                              <div className="flex items-center gap-4 md:gap-5">
                                <div className="w-10 h-10 md:w-12 md:h-12 bg-zinc-900 rounded-xl md:rounded-2xl flex items-center justify-center border border-white/5">
                                  <level.icon className={cn("w-4 h-4 md:w-5 md:h-5", level.color)} />
                                </div>
                                <div>
                                  <p className="text-[8px] md:text-[9px] uppercase tracking-[0.15em] md:tracking-[0.2em] font-black text-zinc-700 mb-0.5 md:mb-1">{level.label}</p>
                                  <p className={cn("text-lg md:text-xl font-mono font-black", level.color === 'text-zinc-500' ? 'text-white' : level.color)}>
                                    {level.value}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Analysis Summary */}
                        <div className="bg-[#0a0a0a] border border-white/5 p-6 md:p-10 rounded-[32px] md:rounded-[40px] relative overflow-hidden shadow-inner">
                          <div className="absolute top-0 right-0 p-4 md:p-6 opacity-10">
                            <Info className="w-5 h-5 md:w-6 md:h-6" />
                          </div>
                          <h4 className="text-[9px] md:text-[10px] uppercase tracking-[0.2em] md:tracking-[0.3em] font-black text-zinc-800 mb-6 md:mb-8 flex items-center gap-3 md:gap-4">
                            <div className="w-3 md:w-4 h-[1px] bg-zinc-900" />
                            Strategic Reasoning
                          </h4>
                          <p className="text-xs md:text-sm text-zinc-400 leading-relaxed font-medium italic">
                            "{result.reasoning}"
                          </p>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="h-[400px] md:h-[560px] flex flex-col items-center justify-center text-center p-10 md:p-16 bg-[#0a0a0a] border border-white/5 border-dashed rounded-[32px] md:rounded-[40px]">
                        <div className="w-20 h-20 md:w-24 md:h-24 bg-zinc-900 rounded-[28px] md:rounded-[32px] flex items-center justify-center mb-8 md:mb-10 relative border border-white/5 shadow-sm">
                          <div className="absolute inset-0 rounded-[28px] md:rounded-[32px] border border-indigo-500/20 animate-pulse" />
                          <Activity className="w-8 h-8 md:w-10 md:h-10 text-zinc-800" />
                        </div>
                        <h3 className="text-sm md:text-base font-black text-zinc-800 uppercase tracking-[0.3em] md:tracking-[0.4em]">System Idle</h3>
                        <p className="text-[8px] md:text-[10px] text-zinc-700 mt-4 md:mt-5 max-w-[200px] md:max-w-[220px] uppercase tracking-[0.15em] md:tracking-[0.2em] font-bold leading-relaxed">
                          Awaiting market sequence for quantitative processing.
                        </p>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </main>

          {/* Global Footer Stats */}
          <footer className="h-20 border-t border-white/5 bg-black/80 backdrop-blur-xl flex items-center justify-center px-4 md:px-8 mt-auto">
            <div className="flex gap-8 md:gap-16 overflow-x-auto scrollbar-hide py-4 w-full justify-start md:justify-center">
              {[
                { label: 'Global Bias', value: 'BULLISH', color: 'text-emerald-500' },
                { label: 'Volatility', value: '18.4', color: 'text-zinc-600' },
                { label: 'Liquidity', value: 'HIGH', color: 'text-emerald-500' },
                { label: 'Session', value: 'LONDON', color: 'text-zinc-600' },
                { label: 'Spread', value: '0.2 Pips', color: 'text-zinc-600' }
              ].map((stat, i) => (
                <div key={i} className="flex flex-col items-center min-w-max">
                  <span className="text-[8px] md:text-[9px] uppercase tracking-widest font-bold text-zinc-700 mb-1 md:mb-1.5">{stat.label}</span>
                  <span className={cn("text-[8px] md:text-[9px] font-mono font-bold", stat.color)}>{stat.value}</span>
                </div>
              ))}
            </div>
          </footer>
        </div>
      </LayoutGroup>
    </div>
  );
}
