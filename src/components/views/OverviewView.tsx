/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useExam } from '../../context/ExamContext';
import {
  Calendar,
  BookOpen,
  GraduationCap,
  DoorClosed,
  Users,
  Barcode,
  ArrowRight,
  PlusCircle,
  Database,
  Sparkles,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { getCodeRange, formatDateVN } from '../../utils/examUtils';

export const OverviewView: React.FC = () => {
  const {
    data,
    setActiveTab,
    loadSampleData,
    clearAllData,
    totalRooms,
    totalStudents,
    totalTeachers,
    totalCodesGenerated,
    validation,
  } = useExam();

  const isDataEmpty = data.rooms.length === 0;

  return (
    <div className="space-y-6">
      {/* Top Banner: Kỳ kiểm tra hiện tại */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-5 sm:p-6 transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-teal-600 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200/60">
              Kỳ kiểm tra đang thực hiện
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
              {data.examInfo.examPeriod} – Môn {data.examInfo.subject} (Khối {data.examInfo.grade})
            </h2>
            <div className="flex items-center gap-4 text-xs sm:text-sm text-slate-500 mt-1 flex-wrap">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" /> Năm học: <strong>{data.examInfo.academicYear}</strong>
              </span>
              <span>·</span>
              <span>Ngày thi: <strong>{formatDateVN(data.examInfo.examDate) || 'Chưa đặt'}</strong></span>
              <span>·</span>
              <span>Trường: <strong>{data.examInfo.schoolName}</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              onClick={() => setActiveTab('examInfo')}
              className="px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Sửa thông tin kỳ thi
            </button>
            <button
              onClick={() => setActiveTab('rooms')}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              Tiếp tục kỳ kiểm tra
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200/60">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-medium">Tổng số phòng thi</span>
              <DoorClosed className="w-4 h-4 text-sky-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 tabular-nums">
              {totalRooms}
            </div>
            <div className="text-xs text-slate-400 mt-1">Phòng thi được quản lý</div>
          </div>

          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200/60">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-medium">Tổng số học sinh</span>
              <GraduationCap className="w-4 h-4 text-teal-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 tabular-nums">
              {totalStudents}
            </div>
            <div className="text-xs text-slate-400 mt-1">Học sinh dự thi</div>
          </div>

          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200/60">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-medium">Giáo viên phân công</span>
              <Users className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 tabular-nums">
              {totalTeachers}
            </div>
            <div className="text-xs text-slate-400 mt-1">Làm nhiệm vụ đánh phách</div>
          </div>

          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200/60">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-medium">Tổng số mã phách</span>
              <Barcode className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 tabular-nums">
              {totalCodesGenerated}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {data.lastGeneratedAt ? `Đã tạo ${data.lastGeneratedAt.slice(11, 16)}` : 'Chưa sinh mã'}
            </div>
          </div>
        </div>
      </div>

      {/* Cảnh báo hệ thống nếu có */}
      {(validation.hasErrors || validation.unassignedRooms.length > 0 || validation.studentCountMismatches.length > 0) && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 text-amber-900 text-sm space-y-2">
          <div className="flex items-center gap-2 font-semibold text-amber-800">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <span>Lưu ý cần kiểm tra trước khi đánh phách:</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-amber-900/90 pl-1">
            {validation.duplicatePrefixes.map((d, i) => (
              <li key={i}>
                Trùng tiền tố <strong>"{d.prefix}"</strong> giữa các phòng: {d.roomNames.join(', ')}.
              </li>
            ))}
            {validation.unassignedRooms.length > 0 && (
              <li>
                Có <strong>{validation.unassignedRooms.length} phòng</strong> chưa được phân công giáo viên làm phách: {validation.unassignedRooms.map((r) => r.roomName).join(', ')}.
              </li>
            )}
            {validation.studentCountMismatches.map((m, i) => (
              <li key={i}>
                Phòng <strong>{m.room.roomName}</strong>: Sĩ số khai báo là {m.declared} nhưng danh sách thực tế có {m.actual} học sinh.
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Trạng thái rỗng: Hướng dẫn bắt đầu nếu chưa có dữ liệu */}
      {isDataEmpty ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-slate-300 p-8 sm:p-12 text-center max-w-3xl mx-auto">
          <div className="w-16 h-16 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center mx-auto mb-4 border border-sky-100">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-2">
            Chưa có dữ liệu phòng thi nào được thiết lập
          </h3>
          <p className="text-slate-500 text-sm max-w-lg mx-auto mb-6">
            Hệ thống đang ở trạng thái mới hoàn toàn. Bạn có thể tự tạo danh sách phòng thi và phân công giáo viên, hoặc bấm nút dưới đây để tải dữ liệu mẫu 16 phòng minh họa.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={loadSampleData}
              className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-200" />
              Tải dữ liệu mẫu minh họa (16 phòng)
            </button>
            <button
              onClick={() => setActiveTab('rooms')}
              className="w-full sm:w-auto px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-medium rounded-lg shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              Tạo phòng thi mới
            </button>
          </div>
        </div>
      ) : (
        /* Bảng tóm tắt phân công */
        <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Bảng tóm tắt phân công giáo viên làm phách
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Tổng hợp theo giáo viên, danh sách phòng, sĩ số và dải mã phách dự kiến
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('teachers')}
                className="text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors"
              >
                Chỉnh sửa phân công →
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">STT</th>
                  <th className="py-3 px-4">Giáo viên làm phách</th>
                  <th className="py-3 px-4">Phòng được giao</th>
                  <th className="py-3 px-4 text-center">Số phòng</th>
                  <th className="py-3 px-4 text-center">Số học sinh</th>
                  <th className="py-3 px-4">Khoảng mã phách</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.teachers.map((teacher, idx) => {
                  const assignedRooms = data.rooms.filter((r) => r.assignedTeacherId === teacher.id);
                  const totalHs = assignedRooms.reduce((sum, r) => sum + (r.studentCount || 0), 0);
                  const roomRanges = assignedRooms
                    .map((r) => `${r.roomName}: ${getCodeRange(r)}`)
                    .join('; ');

                  return (
                    <tr key={teacher.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 text-center text-slate-400 font-medium">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {teacher.fullName}
                        {teacher.phone && (
                          <span className="block text-xs font-normal text-slate-400">{teacher.phone}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        {assignedRooms.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {assignedRooms.map((r) => (
                              <span
                                key={r.id}
                                className="inline-block px-2 py-0.5 text-xs bg-slate-100 text-slate-700 rounded-md border border-slate-200/60"
                              >
                                {r.roomName}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Chưa giao phòng</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-800 tabular-nums">
                        {assignedRooms.length}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-teal-700 tabular-nums">
                        {totalHs}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-mono text-slate-600">
                        {roomRanges || <span className="text-slate-400 italic">Chưa xác định</span>}
                      </td>
                    </tr>
                  );
                })}

                {/* Dòng cảnh báo nếu có phòng chưa phân công */}
                {validation.unassignedRooms.length > 0 && (
                  <tr className="bg-amber-50/50">
                    <td className="py-3 px-4 text-center font-bold text-amber-700">!</td>
                    <td className="py-3 px-4 font-semibold text-amber-800">
                      Chưa phân công giáo viên
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {validation.unassignedRooms.map((r) => (
                          <span
                            key={r.id}
                            className="inline-block px-2 py-0.5 text-xs bg-amber-100 text-amber-800 rounded-md border border-amber-300"
                          >
                            {r.roomName}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-amber-800 tabular-nums">
                      {validation.unassignedRooms.length}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-amber-800 tabular-nums">
                      {validation.unassignedRooms.reduce((s, r) => s + (r.studentCount || 0), 0)}
                    </td>
                    <td className="py-3 px-4 text-xs text-amber-700 italic">
                      Cần gán giáo viên phụ trách
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Khối nút thao tác nhanh phía dưới */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('rooms')}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm rounded-lg shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
          >
            <DoorClosed className="w-4 h-4" />
            Quản lý phòng thi
          </button>
          <button
            onClick={() => setActiveTab('teachers')}
            className="px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white font-semibold text-sm rounded-lg shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Users className="w-4 h-4" />
            Phân công giáo viên
          </button>
          <button
            onClick={() => setActiveTab('generate')}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm rounded-lg shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Barcode className="w-4 h-4" />
            Tạo mã phách
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadSampleData}
            title="Nạp lại dữ liệu 16 phòng minh họa theo đề bài"
            className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Tải lại dữ liệu mẫu
          </button>
          <button
            onClick={() => {
              if (window.confirm('Bạn có chắc chắn muốn tạo kỳ kiểm tra mới? Dữ liệu hiện tại sẽ được làm mới.')) {
                clearAllData();
                setActiveTab('examInfo');
              }
            }}
            className="px-3.5 py-2 text-xs font-medium text-rose-600 hover:text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors cursor-pointer"
          >
            Tạo kỳ kiểm tra mới
          </button>
        </div>
      </div>
    </div>
  );
};
