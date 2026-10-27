import React, { useRef, useEffect } from 'react';

interface OtpInputProps {
  length?: number;
  value: string[];
  onChange: (value: string[]) => void;
  onComplete?: (code: string) => void;
  disabled?: boolean;
  hasError?: boolean;
}

export const OtpInput: React.FC<OtpInputProps> = ({
  length = 6,
  value,
  onChange,
  onComplete,
  disabled = false,
  hasError = false,
}) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus first empty box on mount
    const firstEmptyIndex = value.findIndex((val) => !val);
    const indexToFocus = firstEmptyIndex === -1 ? length - 1 : firstEmptyIndex;
    inputRefs.current[indexToFocus]?.focus();
  }, []);

  const handleChange = (index: number, digit: string) => {
    if (disabled) return;
    const cleanDigit = digit.replace(/\D/g, '');
    if (!cleanDigit && digit !== '') return;

    const newOtp = [...value];
    newOtp[index] = cleanDigit.slice(-1);
    onChange(newOtp);

    // Auto focus next input
    if (cleanDigit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Trigger onComplete when all filled
    const code = newOtp.join('');
    if (code.length === length && !newOtp.some((val) => !val)) {
      onComplete?.(code);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    if (e.key === 'Backspace') {
      if (!value[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    if (disabled) return;
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pasteData) return;

    const newOtp = Array(length).fill('');
    for (let i = 0; i < pasteData.length; i++) {
      newOtp[i] = pasteData[i];
    }
    onChange(newOtp);

    const focusIndex = Math.min(pasteData.length, length - 1);
    inputRefs.current[focusIndex]?.focus();

    if (pasteData.length === length) {
      onComplete?.(pasteData);
    }
  };

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-2.5 my-3" onPaste={handlePaste}>
      {Array.from({ length }).map((_, i) => {
        const val = value[i] || '';
        return (
          <input
            key={i}
            ref={(el) => {
              inputRefs.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={val}
            disabled={disabled}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-xl border outline-none transition-all ${
              disabled ? 'bg-slate-100 text-slate-400 border-slate-200' : ''
            } ${
              hasError
                ? 'border-rose-400 bg-rose-50/50 text-rose-600 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                : val
                ? 'border-blue-600 bg-blue-50/60 text-blue-700 ring-2 ring-blue-600/10'
                : 'border-slate-200 bg-white text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20'
            }`}
          />
        );
      })}
    </div>
  );
};
