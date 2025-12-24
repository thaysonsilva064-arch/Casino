
import React, { useState } from 'react';

interface AuthProps {
  onLogin: () => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      await onLogin();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#0b0e14] p-4 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[120px] rounded-full"></div>

      <div className="z-10 text-center space-y-10 max-w-md w-full">
        <div className="inline-block p-6 rounded-[40px] bg-glass border-blue-500/20 mb-4 animate-floating">
          <span className="text-8xl drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">🎰</span>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-6xl font-rajdhani font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-white to-purple-500">
            NEXUS CASINO
          </h1>
          <p className="text-blue-400 font-black uppercase tracking-[0.4em] text-xs">Aposta • Anime • Global</p>
        </div>

        <button 
          onClick={handleLogin}
          disabled={loading}
          className={`w-full py-5 px-6 bg-white text-black font-black rounded-[30px] flex items-center justify-center gap-4 transition-all active:scale-95 shadow-2xl hover:shadow-white/20 uppercase tracking-widest ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {loading ? (
            <div className="w-6 h-6 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/layout/google.svg" className="w-6 h-6" alt="Google" />
              Entrar com Google
            </>
          )}
        </button>

        <div className="pt-8 flex justify-center gap-8 opacity-40">
           <span className="text-2xl">🛡️</span>
           <span className="text-2xl">🔥</span>
           <span className="text-2xl">⚡</span>
        </div>
      </div>
    </div>
  );
};

export default Auth;
