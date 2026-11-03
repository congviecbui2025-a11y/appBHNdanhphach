/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useExam } from '../context/ExamContext';
import {
  Home,
  FileText,
  DoorClosed,
  Users,
  GraduationCap,
  Barcode,
  Printer,
  CloudDownload,
  Settings,
  AlertTriangle,
} from 'lucide-react';

interface SidebarProps {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileMenuOpen, setMobileMenuOpen }) => {
  const { activeTab, setActiveTab, validation, totalRooms } = useExam();

  const navItems = [
    {
      id: 'overview',
      label: 'Tổng quan',
      icon: Home,
    },
    {
      id: 'examInfo',
      label: 'Thông tin kỳ kiểm tra',
      icon: FileText,
    },
    {
      id: 'rooms',
      label: 'Quản lý phòng thi',
      icon: DoorClosed,
      badge: totalRooms > 0 ? `${totalRooms}` : undefined,
      badgeColor: 'bg-sky-700/60 text-sky-200',
    },
    {
      id: 'teachers',
      label: 'Phân công giáo viên',
      icon: Users,
      badge: validation.unassignedRooms.length > 0 ? `${validation.unassignedRooms.length} chưa giao` : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-400/30',
    },
    {
      id: 'students',
      label: 'Danh sách học sinh',
      icon: GraduationCap,
    },
    {
      id: 'generate',
      label: 'Tạo mã phách',
      icon: Barcode,
    },
    {
      id: 'print',
      label: 'In danh sách',
      icon: Printer,
    },
    {
      id: 'export',
      label: 'Tải dữ liệu',
      icon: CloudDownload,
    },
    {
      id: 'settings',
      label: 'Cài đặt',
      icon: Settings,
    },
  ];

  const handleSelectTab = (tabId: string) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-30 transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`
          no-print fixed lg:static top-0 bottom-0 left-0 z-40
          w-64 bg-[#0d2238] text-slate-300 flex flex-col shrink-0
          border-r border-sky-950/80 shadow-xl transition-transform duration-300 ease-in-out
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Mobile Header Inside Drawer */}
        <div className="lg:hidden px-5 py-4 border-b border-sky-900/60 flex items-center justify-between">
          <div className="font-bold text-white text-base">Hệ Thống Đánh Phách</div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="text-slate-400 hover:text-white text-sm"
          >
            Đóng ✕
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`
                  w-full flex items-center justify-between px-3.5 py-3 rounded-lg text-sm font-medium
                  transition-all duration-150 text-left group cursor-pointer
                  ${
                    isActive
                      ? 'bg-gradient-to-r from-teal-600 to-sky-600 text-white font-semibold shadow-md shadow-teal-900/40'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }
                `}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`w-5 h-5 shrink-0 transition-transform ${
                      isActive ? 'text-white scale-105' : 'text-slate-400 group-hover:text-sky-300'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ml-2 shrink-0 ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Warning Indicator at bottom if conflict exists */}
        {(validation.hasErrors || validation.unassignedRooms.length > 0) && (
          <div className="p-3 mx-2 mb-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-amber-300 mb-1">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>Cảnh báo hệ thống</span>
            </div>
            {validation.duplicatePrefixes.length > 0 && (
              <p>• Trùng tiền tố: {validation.duplicatePrefixes.map((d) => d.prefix).join(', ')}</p>
            )}
            {validation.unassignedRooms.length > 0 && (
              <p>• {validation.unassignedRooms.length} phòng chưa có GV</p>
            )}
          </div>
        )}


      </aside>
    </>
  );
};
