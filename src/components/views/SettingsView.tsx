/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { useExam } from '../../context/ExamContext';
import {
  Settings,
  School,
  User,
  Save,
  Download,
  Upload,
  Trash2,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    data,
    updateExamInfo,
    loadSampleData,
    clearAllData,
    backupDataToJson,
    restoreDataFromJson,
    showToast,
  } = useExam();

  const [schoolName, setSchoolName] = useState(data.examInfo.schoolName || 'THPT Bùi Hữu Nghĩa');
  const [teacherInCharge, setTeacherInCharge] = useState(data.examInfo.teacherInCharge || 'Giáo dục VN');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');

  const jsonInputRef = useRef<HTMLInputElement>(null);

  const handleSaveUnitInfo = (e: React.FormEvent) => {
    e.preventDefault();
    updateExamInfo({
      schoolName: schoolName.trim(),
      teacherInCharge: teacherInCharge.trim(),
    });
    showToast('Đã lưu thông tin đơn vị thành công!');
  };

  const handleJsonRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        const result = restoreDataFromJson(content);
        if (!result.success) {
          alert(result.message);
        }
      }
    };
    reader.readAsText(file);
    if (jsonInputRef.current) jsonInputRef.current.value = '';
  };

  const handleConfirmClear = () => {
    if (confirmInput.trim().toUpperCase() === 'XOA') {
      clearAllData();
      setShowDeleteConfirm(false);
      setConfirmInput('');
    } else {
      alert('Vui lòng gõ chính xác chữ "XOA" để xác nhận xóa dữ liệu kỳ kiểm tra.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      
      {/* Thẻ 1: Thông tin đơn vị & Giáo viên phụ trách */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-5 sm:p-6">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="p-2.5 rounded-lg bg-sky-50 text-sky-700 border border-sky-100">
            <School className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Thông tin đơn vị & Trách nhiệm</h2>
            <p className="text-xs text-slate-500">
              Thông tin hiển thị ở đầu trang (Header) và xuất hiện trên tiêu đề các biểu mẫu in ấn
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveUnitInfo} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tên trường THPT:
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="THPT Bùi Hữu Nghĩa"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white font-medium"
                />
              </div>

            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Giáo viên phụ trách chung:
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={teacherInCharge}
                  onChange={(e) => setTeacherInCharge(e.target.value)}
                  placeholder="Giáo dục VN"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white font-medium"
                />
              </div>

            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm rounded-lg shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              Lưu thông tin đơn vị
            </button>
          </div>
        </form>
      </div>

      {/* Thẻ 2: Sao lưu & Khôi phục dữ liệu (JSON) */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-5 sm:p-6">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="p-2.5 rounded-lg bg-teal-50 text-teal-700 border border-teal-100">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Sao lưu & Khôi phục (Backup / Restore)</h2>
            <p className="text-xs text-slate-500">
              Dữ liệu được lưu trữ an toàn ngay trên trình duyệt máy tính của bạn (localStorage)
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-4">
          <div className="p-4 bg-teal-50/50 rounded-lg border border-teal-200/80 text-xs text-teal-900 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Bảo mật dữ liệu học sinh tuyệt đối:</span>
              <p className="mt-1 leading-relaxed text-teal-800">
                Toàn bộ thông tin học sinh, phòng thi, giáo viên và mã phách được xử lý và lưu hoàn toàn trên máy tính của bạn thông qua localStorage. Hệ thống không gửi bất kỳ thông tin nào lên máy chủ hoặc dịch vụ bên ngoài.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            
            {/* Sao lưu JSON */}
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-sm text-slate-900 mb-1 flex items-center gap-2">
                  <Download className="w-4 h-4 text-sky-600" />
                  Sao lưu dữ liệu ra file JSON
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Xuất toàn bộ cấu hình kỳ thi, phòng, giáo viên và học sinh ra một tệp JSON để lưu trữ hoặc chuyển sang máy tính khác.
                </p>
              </div>
              <button
                type="button"
                onClick={backupDataToJson}
                className="mt-4 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-lg shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Tải tệp sao lưu (.json)
              </button>
            </div>

            {/* Khôi phục JSON */}
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-sm text-slate-900 mb-1 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-teal-600" />
                  Khôi phục dữ liệu từ file JSON
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Nhập tệp sao lưu JSON đã tải về trước đó để phục hồi lại toàn bộ trạng thái kỳ thi.
                </p>
              </div>

              <input
                type="file"
                ref={jsonInputRef}
                onChange={handleJsonRestore}
                accept=".json"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => jsonInputRef.current?.click()}
                className="mt-4 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-lg shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                Chọn tệp JSON để khôi phục
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Thẻ 3: Quản lý dữ liệu mẫu & Xóa kỳ thi */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-5 sm:p-6">
        <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 mb-4">
          Hành động Quản trị Dữ liệu
        </h3>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-lg bg-amber-50/50 border border-amber-200/80">
          <div>
            <h4 className="font-bold text-sm text-amber-950 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              Nạp dữ liệu mẫu minh họa 16 phòng
            </h4>
            <p className="text-xs text-amber-800 mt-1">
              Nạp dữ liệu minh họa 16 phòng (Phòng 1: 30 HS a1–a30, Phòng 2: 24 HS b1–b24, để trống giáo viên cho bạn tự nhập tên).
            </p>
          </div>
          <button
            onClick={loadSampleData}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs rounded-lg shadow-xs shrink-0 transition-colors cursor-pointer"
          >
            Nạp dữ liệu mẫu
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-lg bg-rose-50/50 border border-rose-200/80 mt-4">
          <div>
            <h4 className="font-bold text-sm text-rose-950 flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-rose-600" />
              Xóa kỳ kiểm tra hiện tại
            </h4>
            <p className="text-xs text-rose-800 mt-1">
              Xóa sạch danh sách phòng thi, giáo viên, danh sách học sinh và các mã phách đã tạo để bắt đầu kỳ thi mới.
            </p>
          </div>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-lg shadow-xs shrink-0 transition-colors cursor-pointer"
          >
            Xóa kỳ kiểm tra
          </button>
        </div>
      </div>

      {/* HỘP THOẠI XÁC NHẬN XÓA KỲ KIỂM TRA AN TOÀN */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-bold text-slate-900">Xác nhận xóa sạch dữ liệu</h3>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              Hành động này sẽ xóa toàn bộ phòng thi, giáo viên và danh sách học sinh. <strong>Dữ liệu không thể khôi phục</strong> trừ khi bạn đã tải bản sao lưu JSON trước đó.
            </p>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Gõ chữ <strong className="text-rose-600 font-mono">XOA</strong> để xác nhận:
              </label>
              <input
                type="text"
                placeholder="XOA"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold uppercase focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setConfirmInput('');
                }}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmClear}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded-lg shadow-xs"
              >
                Xóa vĩnh viễn
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
