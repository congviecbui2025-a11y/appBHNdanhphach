/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useExam } from '../../context/ExamContext';
import { ExamInfo } from '../../types';
import { Calendar, Save, CheckCircle2, BookOpen, School, User } from 'lucide-react';

export const ExamInfoView: React.FC = () => {
  const { data, updateExamInfo, setActiveTab, totalCodesGenerated } = useExam();

  const [formData, setFormData] = useState<ExamInfo>({
    schoolName: data.examInfo.schoolName || 'THPT Bùi Hữu Nghĩa',
    teacherInCharge: data.examInfo.teacherInCharge || 'Giáo dục VN',
    academicYear: data.examInfo.academicYear || '2026 – 2027',
    examPeriod: data.examInfo.examPeriod || 'Giữa học kỳ I',
    subject: data.examInfo.subject || 'Toán',
    grade: data.examInfo.grade || '10',
    examDate: data.examInfo.examDate || '',
    notes: data.examInfo.notes || '',
  });

  const [isSaved, setIsSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateExamInfo(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Card: Thiết kế giống hệt ảnh đính kèm */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-5 sm:p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-sky-50 text-sky-700 border border-sky-100">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Thông tin kỳ kiểm tra</h2>
              <p className="text-xs text-slate-500">Cấu hình các thông số kỳ thi để đưa vào biểu mẫu in ấn và báo cáo</p>
            </div>
          </div>

          {totalCodesGenerated > 0 && (
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-3.5 py-1.5 rounded-lg text-sm font-semibold shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Đã tạo {totalCodesGenerated} mã phách</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            
            {/* Năm học */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Năm học:
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.academicYear}
                  onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                  placeholder="2026 – 2027"
                  required
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all font-medium"
                />
              </div>
            </div>

            {/* Kỳ kiểm tra */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Kỳ kiểm tra:
              </label>
              <select
                value={formData.examPeriod}
                onChange={(e) => setFormData({ ...formData, examPeriod: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all font-medium"
              >
                <option value="Giữa học kỳ I">Giữa học kỳ I</option>
                <option value="Cuối học kỳ I">Cuối học kỳ I</option>
                <option value="Giữa học kỳ II">Giữa học kỳ II</option>
                <option value="Cuối học kỳ II">Cuối học kỳ II</option>
              </select>
            </div>

            {/* Môn học */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Môn:
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Toán, Văn, Anh..."
                required
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all font-medium"
              />
            </div>

            {/* Khối */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Khối:
              </label>
              <select
                value={formData.grade}
                onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all font-medium"
              >
                <option value="10">Khối 10</option>
                <option value="11">Khối 11</option>
                <option value="12">Khối 12</option>
                <option value="Toàn trường">Toàn trường</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
            {/* Ngày kiểm tra */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Ngày kiểm tra:
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={formData.examDate}
                  onChange={(e) => setFormData({ ...formData, examDate: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Trường */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Tên trường THPT:
              </label>
              <input
                type="text"
                value={formData.schoolName}
                onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                placeholder="THPT Bùi Hữu Nghĩa"
                required
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
              />
            </div>

            {/* Giáo viên phụ trách chung */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Giáo viên phụ trách chung:
              </label>
              <input
                type="text"
                value={formData.teacherInCharge}
                onChange={(e) => setFormData({ ...formData, teacherInCharge: e.target.value })}
                placeholder="Giáo dục VN"
                required
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Ghi chú */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Ghi chú thêm:
            </label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Ghi chú về phân công, thời gian hoàn thành làm phách, số lượng túi bài thi..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100 flex-wrap gap-3">
            <div className="text-xs text-slate-500">
              * Mọi thông tin sau khi lưu sẽ tự động đồng bộ lên Header và tiêu đề các văn bản in.
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('rooms')}
                className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                Chuyển sang Quản lý phòng thi →
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm rounded-lg shadow-sm flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" />
                Lưu thông tin kỳ kiểm tra
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
