import React, { useState } from 'react';
import { I18nStrings } from '../game/i18n';
import { ArcadeIconTile, LockShield3DIcon } from './ArcadeIcons';
import {
  PlayerUser,
  loginWithGoogle,
  playAsGuest,
  logoutPlayer,
  updateUserProfileName,
  updatePlayerAvatar,
} from '../services/authService';

const AVATAR_PRESETS = ['🔴', '🏀', '⚽', '🎾', '🎱', '🟡', '🔮', '👑', '🏆', '🚀', '⚡', '💎'];

interface AuthModalProps {
  t: I18nStrings;
  player: PlayerUser | null;
  onClose: () => void;
  onAuthSuccess: (player: PlayerUser | null) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  t,
  player,
  onClose,
  onAuthSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState<string>(player?.displayName || '');
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState<boolean>(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const p = await loginWithGoogle();
      onAuthSuccess(p);
      onClose();
    } catch (err: unknown) {
      console.warn('Google login issue:', err);
      setErrorMsg('Gagal masuk dengan Google. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestPlay = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const p = await playAsGuest();
      onAuthSuccess(p);
      onClose();
    } catch (err: unknown) {
      console.warn('Guest login issue:', err);
      setErrorMsg('Gagal memulai sesi tamu.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAvatar = async (emoji: string) => {
    setLoading(true);
    try {
      const updated = await updatePlayerAvatar(emoji);
      if (updated) {
        onAuthSuccess(updated);
        setShowAvatarPicker(false);
      }
    } catch (err) {
      console.warn('Failed to update avatar:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    setLoading(true);
    try {
      const updated = await updateUserProfileName(nameInput);
      if (updated) {
        onAuthSuccess(updated);
        setIsEditingName(false);
      }
    } catch (err) {
      console.warn('Failed to update name:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logoutPlayer();
      onAuthSuccess(null);
      onClose();
    } catch (err) {
      console.warn('Logout issue:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="w-full max-w-sm rounded-3xl border border-amber-500/40 bg-slate-950 p-5 sm:p-6 shadow-2xl modal-juice-pop text-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <ArcadeIconTile glowColor="amber" className="w-10 h-10 shrink-0">
              <LockShield3DIcon className="w-6 h-6" />
            </ArcadeIconTile>
            <h3 className="text-base font-black text-amber-400">
              {t.accountTitle}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="mt-3 p-2 rounded-xl bg-red-900/40 border border-red-500/50 text-red-200 text-xs text-center">
            {errorMsg}
          </div>
        )}

        {player ? (
          <div className="mt-4 text-center">
            <div className="relative group cursor-pointer inline-block" onClick={() => setShowAvatarPicker(!showAvatarPicker)}>
              {player.photoURL && player.photoURL.length > 5 ? (
                <img
                  src={player.photoURL}
                  alt=""
                  className="w-16 h-16 rounded-full mx-auto border-2 border-amber-400 object-cover shadow-lg mb-1"
                />
              ) : (
                <div className="w-16 h-16 rounded-full mx-auto bg-slate-800 border-2 border-amber-400 flex items-center justify-center text-3xl font-black text-amber-300 shadow-lg mb-1">
                  {player.photoURL || (player.displayName ? player.displayName[0].toUpperCase() : 'P')}
                </div>
              )}
              <span className="text-[10px] text-amber-300 block font-bold hover:underline mb-2">Pilih Avatar 🎨</span>
            </div>

            {showAvatarPicker && (
              <div className="p-2.5 bg-slate-900 border border-amber-400/40 rounded-2xl my-2 grid grid-cols-6 gap-2">
                {AVATAR_PRESETS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => handleSelectAvatar(icon)}
                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-amber-500/30 text-lg text-center cursor-pointer transition"
                  >
                    {icon}
                  </button>
                ))}
              </div>
            )}

            {isEditingName ? (
              <form onSubmit={handleSaveName} className="mt-2 flex items-center gap-1.5 justify-center">
                <input
                  type="text"
                  maxLength={24}
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="px-2.5 py-1 rounded-xl bg-slate-900 border border-amber-400/60 text-white text-xs font-bold text-center focus:outline-none"
                  placeholder="Nama Pemain"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-2.5 py-1 rounded-xl btn-3d-green text-white text-xs font-bold cursor-pointer"
                >
                  ✓
                </button>
              </form>
            ) : (
              <div className="flex items-center justify-center gap-1.5 mt-1">
                <h4 className="text-base font-black text-white">{player.displayName}</h4>
                <button
                  type="button"
                  onClick={() => setIsEditingName(true)}
                  className="text-slate-400 hover:text-amber-300 text-xs p-1"
                  title="Ubah Nama"
                >
                  ✏️
                </button>
              </div>
            )}

            <span
              className={`inline-block px-2.5 py-0.5 mt-1 text-[11px] font-bold rounded-full border ${
                player.isAnonymous
                  ? 'bg-slate-800 text-slate-300 border-slate-700'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}
            >
              {player.isAnonymous ? 'Mode Tamu (Guest)' : 'Akun Google Terverifikasi'}
            </span>

            {player.isAnonymous && (
              <div className="mt-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-left">
                <p className="text-xs text-amber-200 mb-2 leading-relaxed">
                  Hubungkan dengan akun Google agar nama dan foto profil Anda permanen di leaderboard global!
                </p>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleGoogleLogin}
                  className="w-full py-2 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>{t.loginWithGoogle}</span>
                </button>
              </div>
            )}

            <button
              type="button"
              disabled={loading}
              onClick={handleLogout}
              className="mt-5 w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-red-300 transition cursor-pointer"
            >
              {t.signOut}
            </button>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <p className="text-xs text-slate-300 text-center leading-relaxed">
              Pilih cara masuk untuk mencatat skor tertinggi dan bersaing di Papan Peringkat Global:
            </p>

            <button
              type="button"
              disabled={loading}
              onClick={handleGoogleLogin}
              className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-black text-xs flex items-center justify-center gap-2.5 shadow-lg shadow-white/10 transition cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{t.loginWithGoogle}</span>
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={handleGuestPlay}
              className="w-full py-2.5 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <span>👤</span>
              <span>{t.playAsGuest}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
