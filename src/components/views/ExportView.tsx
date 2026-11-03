/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useExam } from '../../context/ExamContext';
import {
  FileSpreadsheet,
  Download,
  CheckCircle2,
  Users,
  EyeOff,
  ShieldAlert,
  FileText,
  AlertCircle,
} from 'lucide-react';
import {
  exportTeacherAssignmentExcel,
  exportExaminerAnonymizedExcel,
  exportManagementCrossReferenceExcel,
  exportToCsv,
} from '../../utils/excelExport';
import { getCodeRange, generateRoomCodes } from '../../utils/examUtils';

export const ExportView: React.FC = () => {
  const { data, showToast } = useExam();
  const [downloadStatus, setDownloadStatus] = useState<string | null>(null);

  const handleExport = (type: 'teacher' | 'examiner' | 'crossref' | 'csv_all') => {
    try {
      if (type === 'teacher') {
        exportTeacherAssignmentExcel(data);
        showToast('Đã xuất Bảng phân công giáo viên (.xlsx)!');
        setDownloadStatus('Tải thành công: Bảng phân công giáo viên (.xlsx)');
      } else if (type === 'examiner') {
        exportExaminerAnonymizedExcel(data);
        showToast('Đã xuất Danh sách gửi người chấm (.xlsx)!');
        setDownloadStatus('Tải thành công: Danh sách gửi người chấm (.xlsx)');
      } else if (type === 'crossref') {
        exportManagementCrossReferenceExcel(data);
        showToast('Đã xuất Bảng đối chiếu quản lý (.xlsx)!');
        setDownloadStatus('Tải thành công: Bảng đối chiếu quản lý (.xlsx)');
      } else if (type === 'csv_all') {
        // Xuất CSV tổng hợp phòng & mã
        const csvRows = data.rooms.map((r, i) => ({
          'STT': i + 1,
          'Phòng thi': r.roomName,
          'Sĩ số': r.studentCount !== null ? r.studentCount : 'Chưa nhập',
          'Tiền tố': r.codePrefix,
          'Số bắt đầu': r.codeStartNumber,
          'Khoảng mã phách': getCodeRange(r),
          'Giáo viên phụ trách': data.teachers.find((t) => t.id === r.assignedTeacherId)?.fullName || 'Chưa gán',
        }));
        exportToCsv(`Danh_sach_phong_va_ma_phach_${data.examInfo.subject || 'Mon'}.csv`, csvRows);
        showToast('Đã xuất Danh sách mã phách chuẩn CSV UTF-8!');
        setDownloadStatus('Tải thành công: Tệp dữ liệu CSV UTF-8');
      }
    } catch (e: any) {
      alert(`Lỗi khi xuất file: ${e.message}`);
      setDownloadStatus(`Lỗi tải dữ liệu: ${e.message}`);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      
      {/* Header Card */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-5 sm:p-6">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Tải & Xuất Dữ Liệu Báo Cáo</h2>
            <p className="text-xs text-slate-500">
              Xuất các tệp bảng tính Microsoft Excel (.xlsx) và CSV theo định dạng chuẩn ngành giáo dục
            </p>
          </div>
        </div>

        {downloadStatus && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-800 text-xs sm:text-sm font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{downloadStatus}</span>
          </div>
        )}

        {/* Thông tin quy ước đặt tên file */}
        <div className="mt-4 p-3 bg-slate-50 rounded-lg text-xs text-slate-600 border border-slate-200">
          💡 <strong>Quy ước tên file tự động:</strong> Tên file gồm Kỳ kiểm tra, Môn học và Khối lớp.
          <br />
          Ví dụ: <code className="font-mono text-slate-800 font-bold">Giua_hoc_ky_I_Toan_Khoi_10_Bang_Phan_Cong_Giao_Vien.xlsx</code>
        </div>
      </div>

      {/* 3 Thẻ xuất file Excel chuyên biệt */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Thẻ 1: Phân công giáo viên */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-5 flex flex-col justify-between hover:border-sky-300 transition-all">
          <div>
            <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center mb-3">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Bảng phân công giáo viên</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Bao gồm họ tên giáo viên, số điện thoại, danh sách phòng được giao, tổng số học sinh và khoảng mã phách từng phòng.
            </p>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100">
            <button
              onClick={() => handleExport('teacher')}
              className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-lg shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Tải Excel (.xlsx)
            </button>
          </div>
        </div>

        {/* Thẻ 2: Gửi người chấm (Ẩn danh) */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-5 flex flex-col justify-between hover:border-teal-300 transition-all">
          <div>
            <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center mb-3">
              <EyeOff className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Danh sách gửi người chấm</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Đã <strong>ẩn hoàn toàn</strong> thông tin học sinh và giáo viên làm phách. Cung cấp sẵn các cột Điểm V1, V2, Thống nhất và Chữ ký.
            </p>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100">
            <button
              onClick={() => handleExport('examiner')}
              className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-lg shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Tải Excel (.xlsx)
            </button>
          </div>
        </div>

        {/* Thẻ 3: Bảng đối chiếu quản lý (Bảo mật) */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-5 flex flex-col justify-between hover:border-rose-300 transition-all">
          <div>
            <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center mb-3">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Bảng đối chiếu quản lý</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Tài liệu mật dành riêng cho Chủ tịch và Thư ký Hội đồng. Chứa đầy đủ Số báo danh, Họ tên, Lớp, Mã phách và Cán bộ làm phách.
            </p>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100">
            <button
              onClick={() => handleExport('crossref')}
              className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-lg shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Tải Excel (.xlsx)
            </button>
          </div>
        </div>

      </div>

      {/* Thẻ bổ sung: Tải file CSV UTF-8 */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-5 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-600" />
            Tải dữ liệu định dạng CSV UTF-8 (Mở bằng Excel)
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Phù hợp với các hệ thống quản lý học sinh và phần mềm cơ sở dữ liệu ngành
          </p>
        </div>

        <button
          onClick={() => handleExport('csv_all')}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg border border-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4" />
          Tải tệp CSV UTF-8
        </button>
      </div>

    </div>
  );
};
