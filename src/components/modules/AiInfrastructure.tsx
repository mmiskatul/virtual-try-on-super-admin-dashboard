import React from 'react';
import { Cpu } from 'lucide-react';

export function AiInfrastructure() {
  return (
    <div className="space-y-6">
      <div className="admin-card p-6 rounded-2xl space-y-4">
        <h3 className="font-bold text-base text-white flex items-center gap-2">
          <Cpu className="w-5 h-5 text-amber-400" /> Virtual Try-On Model Architecture
        </h3>

        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <span className="text-slate-400 font-semibold">Active Model Adapter</span>
            <p className="text-base font-bold text-white">ProductionVitonHDAdapter (v2.4.0-prod)</p>
            <p className="text-slate-400 text-[11px]">Asynchronous flow warping, garment texture synthesis & edge blending</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <span className="text-slate-400 font-semibold">Supported Categories</span>
            <p className="text-base font-bold text-emerald-400">tops, bottoms, dresses, outerwear</p>
            <p className="text-slate-400 text-[11px]">Automatic torso & anatomical boundary calibration</p>
          </div>
        </div>
      </div>
    </div>
  );
}
