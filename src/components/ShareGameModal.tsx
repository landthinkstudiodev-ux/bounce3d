import React, { useState } from 'react';
import { I18nStrings } from '../game/i18n';
import { ArcadeIconTile, ShareNodes3DIcon } from './ArcadeIcons';

interface ShareGameModalProps {
  t: I18nStrings;
  onClose: () => void;
}

export const ShareGameModal: React.FC<ShareGameModalProps> = ({ t, onClose }) => {
  const [copied, setCopied] = useState(false);

  const getShareUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.href;
    }
    return 'https://bounce-rolling-3d.web.app';
  };

  const shareText = `${t.shareGameTitle}\n\n${t.shareGameDesc}\nMainkan sekarang: ${getShareUrl()}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getShareUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: t.shareGameTitle,
          text: t.shareGameDesc,
          url: getShareUrl(),
        });
        onClose();
      } catch {
        // User cancelled share
      }
    } else {
      handleCopyLink();
    }
  };

  const shareToWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const shareToTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(getShareUrl())}&text=${encodeURIComponent(t.shareGameDesc)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const shareToTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(t.shareGameDesc)}&url=${encodeURIComponent(getShareUrl())}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="w-full max-w-sm rounded-3xl border-2 border-amber-400/50 bg-slate-950/95 p-5 shadow-[0_0_35px_rgba(251,191,36,0.22)] modal-juice-pop">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <ArcadeIconTile glowColor="cyan" className="w-10 h-10 shrink-0">
              <ShareNodes3DIcon className="w-6 h-6" />
            </ArcadeIconTile>
            <h3 className="text-base font-black text-amber-400">
              {t.shareGameBtn}
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

        {/* Content with high-res asset image */}
        <div className="mt-4 text-center">
          <img
            src="/assets/aistudio/image_f1216a49.png"
            alt="Bounce 3D"
            className="w-20 h-20 mx-auto rounded-2xl border-2 border-amber-400 object-cover shadow-lg shadow-amber-500/20 mb-3"
          />
          <h4 className="text-sm font-black text-white mb-1">
            {t.shareGameTitle}
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed px-2">
            {t.shareGameDesc}
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="mt-4 space-y-2">
          {typeof navigator !== 'undefined' && 'share' in navigator ? (
            <button
              type="button"
              onClick={handleNativeShare}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs tracking-wide shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <span>{t.shareNative}</span>
            </button>
          ) : null}

          <button
            type="button"
            onClick={handleCopyLink}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <span>{copied ? t.shareSuccess : t.copyLink}</span>
          </button>
        </div>

        {/* Crisp Vector Social Buttons */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex justify-center items-center gap-2">
          <button
            type="button"
            onClick={shareToWhatsApp}
            className="flex-1 py-2 px-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer"
            title="WhatsApp"
          >
            <svg className="w-4 h-4 fill-emerald-400" viewBox="0 0 24 24">
              <path d="M12.012 2c-5.506 0-9.989 4.478-9.989 9.984 0 1.762.459 3.48 1.332 5.001l-1.416 5.174 5.297-1.389c1.472.803 3.134 1.226 4.776 1.226 5.507 0 9.989-4.478 9.989-9.984s-4.482-9.984-9.989-9.984zm5.836 14.129c-.244.686-1.42 1.309-1.961 1.389-.49.073-1.129.132-3.273-.755-2.738-1.134-4.502-3.921-4.639-4.106-.137-.184-1.111-1.478-1.111-2.818s.696-1.996.945-2.268c.244-.272.531-.341.708-.341.177 0 .354.002.508.009.163.008.382-.062.597.454.225.539.768 1.875.835 2.012.067.137.112.298.022.476-.09.178-.135.289-.27.447-.135.158-.283.354-.404.476-.135.135-.276.282-.119.551.157.269.699 1.155 1.503 1.871 1.033.92 1.903 1.206 2.172 1.341.269.135.426.112.584-.067.158-.178.673-.785.852-1.054.179-.269.359-.224.597-.135.239.09 1.516.715 1.776.845.26.13.434.195.498.305.064.11.064.636-.18 1.322z"/>
            </svg>
            <span>WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={shareToTelegram}
            className="flex-1 py-2 px-2.5 rounded-xl bg-sky-600/20 hover:bg-sky-600/30 border border-sky-500/40 text-sky-300 text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer"
            title="Telegram"
          >
            <svg className="w-4 h-4 fill-sky-400" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.67-.52.36-1 .54-1.43.53-.47-.01-1.37-.27-2.04-.49-.82-.27-1.47-.42-1.42-.88.03-.24.37-.49 1.02-.75 3.99-1.74 6.66-2.88 8.01-3.44 3.82-1.58 4.61-1.86 5.13-1.87.11 0 .37.03.54.17.14.12.18.28.2.45-.02.07-.02.16-.04.28z"/>
            </svg>
            <span>Telegram</span>
          </button>

          <button
            type="button"
            onClick={shareToTwitter}
            className="flex-1 py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer"
            title="X / Twitter"
          >
            <svg className="w-4 h-4 fill-slate-200" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            <span>Post</span>
          </button>
        </div>
      </div>
    </div>
  );
};
