import React, { useEffect, useState } from 'react';
import { I18nStrings } from '../game/i18n';

interface ZoneTransitionModalProps {
  t: I18nStrings;
  onClose: () => void;
}

export const ZoneTransitionModal: React.FC<ZoneTransitionModalProps> = ({ t, onClose }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
  }, []);

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/90 backdrop-blur-md p-4 transition-opacity duration-700 ${visible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="w-full max-w-lg flex flex-col items-center text-center p-8 rounded-3xl bg-slate-900 border-4 border-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.4)] animate-pop-in">
        <div className="text-6xl mb-6">🌿</div>
        <h2 className="text-3xl font-black text-emerald-300 mb-2 tracking-tight">
          {t.zone2Title}
        </h2>
        <p className="text-lg text-emerald-100 mb-8 font-medium">
          {t.zone2Subtitle}
        </p>
        
        <button
          type="button"
          onClick={() => {
            setVisible(false);
            setTimeout(onClose, 500);
          }}
          className="px-8 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-lg shadow-lg shadow-emerald-900 transition-transform active:scale-95"
        >
          {t.playBtn}
        </button>
      </div>
    </div>
  );
};
