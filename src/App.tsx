/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ExamProvider, useExam } from './context/ExamContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { OverviewView } from './components/views/OverviewView';
import { ExamInfoView } from './components/views/ExamInfoView';
import { RoomsView } from './components/views/RoomsView';
import { TeacherAssignmentView } from './components/views/TeacherAssignmentView';
import { StudentListView } from './components/views/StudentListView';
import { GenerateCodesView } from './components/views/GenerateCodesView';
import { PrintView } from './components/views/PrintView';
import { ExportView } from './components/views/ExportView';
import { SettingsView } from './components/views/SettingsView';
import { CheckCircle2 } from 'lucide-react';

const AppContent: React.FC = () => {
  const { activeTab, toastMessage } = useExam();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f3f6fa] flex flex-col font-sans text-slate-800">
      {/* Header */}
      <Header mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />

      {/* Main Layout Area */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto relative">
        {/* Sidebar */}
        <Sidebar mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />

        {/* Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          {activeTab === 'overview' && <OverviewView />}
          {activeTab === 'examInfo' && <ExamInfoView />}
          {activeTab === 'rooms' && <RoomsView />}
          {activeTab === 'teachers' && <TeacherAssignmentView />}
          {activeTab === 'students' && <StudentListView />}
          {activeTab === 'generate' && <GenerateCodesView />}
          {activeTab === 'print' && <PrintView />}
          {activeTab === 'export' && <ExportView />}
          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="no-print fixed bottom-5 right-5 z-50 bg-[#0d2f53] text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-sm border border-sky-400/30 animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <ExamProvider>
      <AppContent />
    </ExamProvider>
  );
}
