
import React from 'react';
import { LOTTERY_CONFIGS, LotteryType } from '../types';

interface LotteryGridProps {
  type: LotteryType;
  selectedNumbers: number[];
  selectedExtras?: number[];
  onToggleNumber: (num: number) => void;
  onToggleExtra?: (num: number) => void;
}

const LotteryGrid: React.FC<LotteryGridProps> = ({ 
  type, 
  selectedNumbers, 
  selectedExtras = [], 
  onToggleNumber,
  onToggleExtra 
}) => {
  const config = LOTTERY_CONFIGS[type];
  const numbers = Array.from({ length: config.range }, (_, i) => i + 1);
  const extras = config.extraRange ? Array.from({ length: config.extraRange }, (_, i) => i + 1) : [];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex justify-between items-end mb-4">
          <h4 className="font-bold text-slate-700">Selecione os números ({selectedNumbers.length})</h4>
          <span className="text-xs text-slate-400">Min: {config.minNumbers} | Max: {config.maxNumbers}</span>
        </div>
        <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${config.gridCols}, minmax(0, 1fr))` }}>
          {numbers.map((num) => {
            const isSelected = selectedNumbers.includes(num);
            return (
              <button
                key={num}
                onClick={() => onToggleNumber(num)}
                className={`
                  aspect-square flex items-center justify-center rounded-lg text-sm font-bold transition-all
                  ${isSelected 
                    ? `${config.color} text-white shadow-md scale-110 z-10` 
                    : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-400'}
                `}
              >
                {num.toString().padStart(2, '0')}
              </button>
            );
          })}
        </div>
      </div>

      {config.extraRange && (
        <div className="pt-4 border-t border-slate-100">
          <h4 className="font-bold text-slate-700 mb-4">Selecione os Trevos ({selectedExtras.length})</h4>
          <div className="flex space-x-3">
            {extras.map((num) => {
              const isSelected = selectedExtras.includes(num);
              return (
                <button
                  key={num}
                  onClick={() => onToggleExtra?.(num)}
                  className={`
                    w-12 h-12 flex items-center justify-center rounded-full text-lg font-bold transition-all
                    ${isSelected 
                      ? 'bg-orange-500 text-white shadow-md scale-110' 
                      : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-400'}
                  `}
                >
                  🍀{num}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default LotteryGrid;
