/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useExam } from '../context/ExamContext';
import { User, School, CheckCircle2, Menu, X, Sparkles } from 'lucide-react';

interface HeaderProps {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({ mobileMenuOpen, setMobileMenuOpen }) => {
  const { data, totalCodesGenerated, setActiveTab } = useExam();

  return (
    <header className="no-print relative bg-gradient-to-r from-[#0a2540] via-[#0d2f53] to-[#123b68] text-white shadow-lg border-b border-sky-900/50 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
        
        {/* Left: Emblem & Title & Unit Info */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          {/* Golden School Laurel Emblem */}
          <div className="relative shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-amber-400/20 via-amber-500/10 to-transparent border border-amber-400/40 shadow-inner">
            <svg
              className="w-8 h-8 text-amber-400 drop-shadow-md"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              {/* Laurel Wreath with Open Book */}
              <path d="M12 4.5C7.5 4.5 4 6 4 6v11s3.5-1.5 8-1.5 8 1.5 8 1.5V6s-3.5-1.5-8-1.5zm0 2.25c2.9 0 5.4.74 6.5 1.25v7.25c-1.3-.4-3.8-1-6.5-1s-5.2.6-6.5 1V8c1.1-.51 3.6-1.25 6.5-1.25z" />
              <path d="M12 2a9.96 9.96 0 0 0-7.07 2.93l1.41 1.41A7.96 7.96 0 0 1 12 4c4.42 0 8 3.58 8 8 0 1.85-.63 3.55-1.69 4.9l1.43 1.43A9.93 9.93 0 0 0 22 12c0-5.52-4.48-10-10-10z" opacity="0.4" />
            </svg>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-white whitespace-nowrap">
                HỆ THỐNG <span className="text-amber-400 font-extrabold drop-shadow-sm">ĐÁNH PHÁCH</span> BÀI KIỂM TRA
              </h1>
            </div>

            {/* Subline Unit Info */}
            <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-sky-200/90 mt-0.5 flex-wrap">
              <button
                onClick={() => setActiveTab('settings')}
                title="Bấm để chỉnh sửa trong Cài đặt"
                className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer text-left"
              >
                <User className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span className="text-slate-300">Giáo viên:</span>
                <span className="font-semibold text-white underline decoration-dotted decoration-amber-400/60 underline-offset-2">
                  {data.examInfo.teacherInCharge || 'Giáo dục VN'}
                </span>
              </button>

              <span className="text-sky-400/50 hidden sm:inline">|</span>

              <button
                onClick={() => setActiveTab('settings')}
                title="Bấm để chỉnh sửa trong Cài đặt"
                className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer text-left"
              >
                <School className="w-3.5 h-3.5 text-teal-300 shrink-0" />
                <span className="text-slate-300">Trường:</span>
                <span className="font-semibold text-white underline decoration-dotted decoration-teal-400/60 underline-offset-2">
                  {data.examInfo.schoolName || 'THPT Bùi Hữu Nghĩa'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Status badge & Profile / Mobile toggle */}
        <div className="flex items-center gap-3 shrink-0">
          {totalCodesGenerated > 0 && (
            <div className="hidden md:flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 px-3 py-1.5 rounded-lg text-xs font-semibold backdrop-blur-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Đã tạo {totalCodesGenerated} mã phách</span>
            </div>
          )}

          {/* User profile avatar */}
          <div
            onClick={() => setActiveTab('settings')}
            className="w-9 h-9 rounded-full bg-sky-800/80 border border-sky-400/30 flex items-center justify-center text-white cursor-pointer hover:bg-sky-700 transition-colors shadow-sm"
            title="Tài khoản / Cài đặt"
          >
            <User className="w-5 h-5 text-sky-200" />
          </div>

          {/* Mobile hamburger menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg bg-sky-800/60 text-sky-200 hover:text-white hover:bg-sky-700/80 transition-colors"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

      </div>
    </header>
  );
};
