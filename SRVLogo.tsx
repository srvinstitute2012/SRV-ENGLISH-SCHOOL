import React, { useState } from 'react';
import { GraduationCap, Maximize2, X } from 'lucide-react';

// Paste your direct image link (URL or Base64 data string) below:
export const SCHOOL_LOGO_SRC = "https://i.ibb.co/yFcWhYwm/logo.png";
export const SCHOOL_LOGO = SCHOOL_LOGO_SRC;

interface SRVLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  lightMode?: boolean;
  allowPreview?: boolean;
}

export const SRVLogo: React.FC<SRVLogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
  lightMode = false,
  allowPreview = true,
}) => {
  const [imgError, setImgError] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const dimensions = {
    sm: { height: '36px', container: 'p-1 rounded-xl', icon: 'w-5 h-5', textTitle: 'text-base sm:text-lg' },
    md: { height: '48px', container: 'p-1 rounded-2xl', icon: 'w-7 h-7', textTitle: 'text-lg sm:text-xl md:text-2xl' },
    lg: { height: '60px', container: 'p-1.5 rounded-2xl', icon: 'w-8 h-8', textTitle: 'text-xl sm:text-2xl md:text-3xl' },
    xl: { height: '76px', container: 'p-2 rounded-2xl sm:rounded-3xl', icon: 'w-10 h-10', textTitle: 'text-2xl sm:text-3xl md:text-4xl' },
  }[size];

  return (
    <>
      <div className={`flex items-center gap-3 shrink-0 ${className}`}>
        {!imgError && SCHOOL_LOGO_SRC ? (
          <div className={`relative group flex items-center justify-center shrink-0 ${dimensions.container} bg-white/90 backdrop-blur-sm border border-red-500/30 shadow-sm overflow-hidden transition-all duration-200 hover:scale-105`}>
            <img
              src={SCHOOL_LOGO_SRC}
              alt="SRV English School Emblem"
              onError={() => setImgError(true)}
              onClick={(e) => {
                if (allowPreview) {
                  e.stopPropagation();
                  setShowPreviewModal(true);
                }
              }}
              style={{ height: dimensions.height, width: 'auto', maxWidth: 'none', objectFit: 'contain' }}
              className={`shrink-0 transition-all duration-200 ${
                allowPreview ? 'cursor-pointer hover:drop-shadow-xl' : ''
              }`}
              title={allowPreview ? "Click to view full school emblem" : "SRV English School"}
            />
            {allowPreview && (
              <span className="absolute -bottom-1 right-0 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/90 text-amber-300 p-0.5 rounded text-[9px] shadow pointer-events-none">
                <Maximize2 className="w-2.5 h-2.5" />
              </span>
            )}
          </div>
        ) : (
          <div
            style={{ height: dimensions.height, width: dimensions.height }}
            className={`rounded-2xl bg-gradient-to-tr from-red-900 via-red-800 to-red-600 text-amber-300 flex items-center justify-center p-2 shadow-md border border-amber-400/40 shrink-0`}
            title="SRV English School"
          >
            <GraduationCap className={dimensions.icon} />
          </div>
        )}

        {showText && (
          <div className="flex flex-col justify-center text-left">
            <span className={`font-curved-title font-extrabold ${dimensions.textTitle} tracking-wide text-white drop-shadow-md select-none leading-none`}>
              SRV ENGLISH SCHOOL
            </span>
          </div>
        )}
      </div>

      {/* Lightbox Emblem Preview Modal */}
      {showPreviewModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setShowPreviewModal(false)}
        >
          <div
            className="bg-slate-900 border border-slate-700/80 rounded-2xl p-6 max-w-lg w-full text-slate-100 shadow-2xl relative flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowPreviewModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
              title="Close preview"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-xs uppercase font-bold tracking-widest text-amber-400 mb-1">
              Official School Seal
            </div>
            <h3 className="text-lg font-bold text-white mb-4">
              Sree Ramakrishna Vivekananda English School
            </h3>

            <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 my-2 max-h-[60vh] flex items-center justify-center w-full">
              <img
                src={SCHOOL_LOGO_SRC}
                alt="Sree Ramakrishna Vivekananda English School Full Emblem"
                className="max-h-[50vh] max-w-full object-contain drop-shadow-2xl"
              />
            </div>

            <p className="text-xs text-slate-400 mt-3 italic">
              "Purity of Education"
            </p>

            <button
              onClick={() => setShowPreviewModal(false)}
              className="mt-4 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition"
            >
              Close Emblem View
            </button>
          </div>
        </div>
      )}
    </>
  );
};

