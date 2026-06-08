import { useState } from 'react';
import { supabase } from './supabaseClient';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // isLogin menentukan apakah pemain melihat form Login atau Register
  const [isLogin, setIsLogin] = useState(true);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // Proses Masuk (Login)
        const { error } = await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        });
        if (error) throw error;
        alert('Berhasil masuk! Selamat bermain.');
      } else {
        // Proses Mendaftar (Register)
        const { error } = await supabase.auth.signUp({
          email: email,
          password: password,
        });
        if (error) throw error;
        alert('Pendaftaran berhasil! Silakan tekan tombol Masuk.');
        setIsLogin(true); // Langsung pindah ke halaman login setelah daftar
      }
    } catch (error) {
      alert(error.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#072530] text-white p-4">
      <div className="bg-white/10 p-8 rounded-xl shadow-lg w-full max-w-sm backdrop-blur-sm">
        <h1 className="text-3xl font-bold text-center mb-6 font-['Fredoka']">
          {isLogin ? 'Masuk' : 'Daftar'} Akun
        </h1>
        
        <form onSubmit={handleAuth} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Alamat Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="p-3 rounded-lg text-black font-semibold border-2 border-transparent focus:border-[#023e8a] outline-none"
            required
          />
          <input
            type="password"
            placeholder="Kata Sandi (Min. 6 Karakter)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="p-3 rounded-lg text-black font-semibold border-2 border-transparent focus:border-[#023e8a] outline-none"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-[#023e8a] hover:bg-blue-600 text-white p-3 rounded-lg font-bold text-lg transition-colors mt-2"
          >
            {loading ? 'Memproses...' : (isLogin ? 'Mulai Petualangan' : 'Buat Akun')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)} 
            className="text-sm text-gray-300 hover:text-white underline transition-colors"
          >
            {isLogin ? 'Pemain baru? Daftar di sini' : 'Sudah punya akun? Masuk di sini'}
          </button>
        </div>
      </div>
    </div>
  );
}