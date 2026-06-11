import React from "react";
import { School, Layers, Award, Sparkles } from "lucide-react";

export default function Header() {
  return (
    <header className="bg-white/5 backdrop-blur-xl text-white shadow-xl border-b border-white/10 no-print" id="app-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="bg-gradient-to-tr from-purple-500/20 to-blue-600/30 p-2.5 rounded-xl shadow-lg border border-white/15">
              <School className="h-7 w-7 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-widest text-blue-400">SMK Negeri 1 Teluknaga</span>
                <span className="bg-blue-500/15 text-blue-300 text-[10px] px-1.5 py-0.5 rounded font-mono border border-blue-500/25">DKV</span>
              </div>
              <h1 className="text-2xl font-bold font-display tracking-tight mt-0.5 flex items-center gap-2 text-white">
                Administrasi Kajur DKV
                <span className="text-xs font-normal text-white/30 font-mono italic">v1.0</span>
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex flex-col text-right">
              <span className="text-[11px] text-white/40">Status Sistem</span>
              <span className="text-xs font-medium text-emerald-400 flex items-center justify-end gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Autopilot Mode Aktif
              </span>
            </div>
            <div className="h-8 w-[1px] bg-white/10 hidden lg:block"></div>
            <div className="bg-white/5 px-4 py-2 rounded-lg border border-white/10 flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-300" />
              <span className="text-xs font-medium text-white/70">Tahun pelajaran: <strong className="text-white">2025/2026</strong></span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
