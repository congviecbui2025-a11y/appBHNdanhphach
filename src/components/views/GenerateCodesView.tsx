/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useExam } from '../../context/ExamContext';
import { ShuffleMode } from '../../types';
import { getCodeRange, generateRoomCodes } from '../../utils/examUtils';
import {
  Barcode,
  Shuffle,
  ListOrdered,
  AlertTriangle,
  CheckCircle2,
  Settings,
  Layers,
  Users,
  Eye,
  RefreshCw,
} from 'lucide-react';

export const GenerateCodesView: React.FC = () => {
  const {
    data,
    generateExamCodes,
    validation,
    totalCodesGenerated,
    setActiveTab,
  } = useExam();

  const [selectedMode, setSelectedMode] = useState<ShuffleMode>(data.shuffleMode || 'random');
  const [selectedRoomPreview, setSelectedRoomPreview] = useState<string>('all');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const teacherMap = new Map(data.teachers.map((t) => [t.id, t.fullName]));

  const handleStartGenerate = () => {
    if (data.lastGeneratedAt) {
      setShowConfirmModal(true);
    } else {
      executeGenerate();
    }
  };

  const executeGenerate = () => {
    generateExamCodes(selectedMode);
    setShowConfirmModal(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Cảnh báo trước khi tạo mã nếu có lỗi */}
      {(validation.hasErrors || validation.unassignedRooms.length > 0) && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 text-amber-900 text-sm space-y-1">
          <div className="flex items-center gap-2 font-bold text-amber-800">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <span>Cảnh báo trước khi tạo mã phách:</span>
          </div>
          {validation.duplicatePrefixes.map((d, i) => (
            <p key={i} className="text-xs sm:text-sm pl-6">
              • Tiền tố <strong>"{d.prefix}"</strong> bị trùng giữa các phòng ({d.roomNames.join(', ')}). Cần sửa lại tiền tố!
            </p>
          ))}
          {validation.unassignedRooms.length > 0 && (
            <p className="text-xs sm:text-sm pl-6">
              • Có <strong>{validation.unassignedRooms.length} phòng</strong> chưa có giáo viên phụ trách ({validation.unassignedRooms.map((r) => r.roomName).join(', ')}).
            </p>
          )}
        </div>
      )}

      {/* Thẻ cấu hình tạo mã phách */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-100">
              <Barcode className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Thiết lập & Sinh mã phách</h2>
              <p className="text-xs text-slate-500">
                Tạo mã định danh bí mật cho từng bài thi nhằm bảo đảm tính khách quan khi chấm bài
              </p>
            </div>
          </div>

          {totalCodesGenerated > 0 && (
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3.5 py-1.5 rounded-lg text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Đã tạo: {totalCodesGenerated} mã</span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-600">({data.shuffleMode === 'random' ? 'Xáo trộn ngẫu nhiên' : 'Theo thứ tự SBD'})</span>
            </div>
          )}
        </div>

        {/* Lựa chọn phương pháp ghép mã */}
        <div className="mt-5 space-y-4">
          <label className="block text-sm font-bold text-slate-800">
            Chọn phương thức ghép mã phách với bài thi:
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Phương án 1: Trộn ngẫu nhiên (Mặc định) */}
            <div
              onClick={() => setSelectedMode('random')}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                selectedMode === 'random'
                  ? 'border-amber-500 bg-amber-50/40 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                  <Shuffle className="w-4 h-4 text-amber-600" />
                  <span>Xáo trộn ngẫu nhiên (Fisher-Yates)</span>
                </div>
                <input
                  type="radio"
                  name="shuffleMode"
                  checked={selectedMode === 'random'}
                  onChange={() => setSelectedMode('random')}
                  className="text-amber-600 focus:ring-amber-500"
                />
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Các mã phách trong phòng được xáo trộn ngẫu nhiên trước khi gán cho học sinh. Độ bảo mật và tính khách quan cao nhất, người chấm không thể đoán được thứ tự bài thi.
              </p>
              <span className="inline-block mt-2 text-[11px] font-bold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-md">
                ★ Khuyên dùng cho thi định kỳ
              </span>
            </div>

            {/* Phương án 2: Tuần tự */}
            <div
              onClick={() => setSelectedMode('sequential')}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                selectedMode === 'sequential'
                  ? 'border-sky-500 bg-sky-50/40 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                  <ListOrdered className="w-4 h-4 text-sky-600" />
                  <span>Ghép tuần tự theo số thứ tự SBD</span>
                </div>
                <input
                  type="radio"
                  name="shuffleMode"
                  checked={selectedMode === 'sequential'}
                  onChange={() => setSelectedMode('sequential')}
                  className="text-sky-600 focus:ring-sky-500"
                />
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Mã phách được gán theo thứ tự tăng dần từ số báo danh nhỏ nhất đến lớn nhất (VD: SBD 1 nhận a1, SBD 2 nhận a2...). Phù hợp khi cần rà soát bài nhanh.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100 flex-wrap gap-3">
            <div className="text-xs text-slate-500">
              * Nếu chỉ có sĩ số phòng mà chưa có danh sách tên học sinh, hệ thống vẫn sẽ sinh dãy mã chuẩn theo tiền tố và số bắt đầu.
            </div>

            <button
              onClick={handleStartGenerate}
              disabled={data.rooms.length === 0}
              className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-40 text-white font-bold text-sm rounded-lg shadow-sm flex items-center gap-2 transition-all cursor-pointer"
            >
              <Barcode className="w-5 h-5" />
              {data.lastGeneratedAt ? 'Tạo lại mã phách toàn bộ' : 'Tạo mã phách ngay'}
            </button>
          </div>
        </div>
      </div>

      {/* Bảng thống kê mã đã tạo theo phòng và theo giáo viên */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Cột 1: Thống kê theo Giáo viên */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-5">
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-sky-600" />
            Mã phách theo Giáo viên làm phách:
          </h3>
          <div className="space-y-2.5">
            {data.teachers.map((teacher) => {
              const assignedRooms = data.rooms.filter((r) => r.assignedTeacherId === teacher.id);
              const teacherCodes = assignedRooms.reduce((sum, r) => sum + (r.studentCount || 0), 0);

              return (
                <div key={teacher.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200/60">
                  <div className="flex items-center justify-between font-bold text-sm text-slate-800">
                    <span>{teacher.fullName}</span>
                    <span className="font-mono text-teal-700 tabular-nums">{teacherCodes} mã</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex justify-between">
                    <span>Phụ trách: {assignedRooms.length} phòng</span>
                    <span className="truncate max-w-[150px]">
                      {assignedRooms.map((r) => r.roomName).join(', ') || 'Chưa có'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cột 2 & 3: Thống kê và xem nhanh theo Phòng thi */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-xs border border-slate-200/80 p-5">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-600" />
              Chi tiết mã phách theo từng phòng thi:
            </h3>

            <select
              value={selectedRoomPreview}
              onChange={(e) => setSelectedRoomPreview(e.target.value)}
              className="text-xs px-2.5 py-1 bg-slate-50 border border-slate-300 rounded-md font-medium"
            >
              <option value="all">Xem tất cả các phòng</option>
              {data.rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.roomName}
                </option>
              ))}
            </select>
          </div>

          <div className="max-h-96 overflow-y-auto space-y-3">
            {data.rooms
              .filter((r) => selectedRoomPreview === 'all' || r.id === selectedRoomPreview)
              .map((room) => {
                const roomStudents = data.students.filter((s) => s.roomId === room.id);
                const codes = generateRoomCodes(room);
                const teacherName = room.assignedTeacherId ? teacherMap.get(room.assignedTeacherId) : 'Chưa phân công';

                return (
                  <div key={room.id} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{room.roomName}</span>
                        <span className="text-xs text-slate-500">
                          (Tiền tố: <strong className="font-mono text-slate-700">{room.codePrefix}</strong>, Bắt đầu: {room.codeStartNumber})
                        </span>
                      </div>
                      <div className="text-xs font-mono font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
                        {getCodeRange(room)}
                      </div>
                    </div>

                    <div className="text-xs text-slate-500 mb-2 flex items-center justify-between">
                      <span>GV: <strong>{teacherName}</strong></span>
                      <span>Sĩ số: <strong>{room.studentCount !== null ? `${room.studentCount} HS` : 'Chưa nhập'}</strong></span>
                    </div>

                    {/* Dải mã hoặc danh sách mã đã ghép */}
                    {codes.length > 0 ? (
                      <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-2 bg-white rounded-md border border-slate-200">
                        {roomStudents.length > 0 ? (
                          roomStudents.map((s) => (
                            <span
                              key={s.id}
                              title={`${s.studentCode} - ${s.fullName}`}
                              className="px-2 py-0.5 text-xs font-mono font-bold bg-amber-50 text-amber-900 border border-amber-200 rounded-sm"
                            >
                              {s.examCode || '(chưa có)'}
                            </span>
                          ))
                        ) : (
                          codes.map((c, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 text-xs font-mono font-medium bg-slate-100 text-slate-700 rounded-sm"
                            >
                              {c}
                            </span>
                          ))
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 italic">
                        Chưa có sĩ số học sinh để sinh mã phách.
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>

      </div>

      {/* HỘP THOẠI XÁC NHẬN TẠO LẠI MÃ PHÁCH */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-amber-600 mb-3">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-bold text-slate-900">Xác nhận tạo lại mã phách</h3>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              Kỳ kiểm tra này đã được tạo mã phách trước đó. <strong>Nếu bạn tạo lại mã phách mới, bảng đối chiếu cũ sẽ bị thay đổi hoàn toàn</strong> và các bài thi đã đánh phách trước đây sẽ không còn khớp.
            </p>

            <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-xs text-amber-800 mb-5">
              ⚠️ Chỉ tiếp tục nếu bạn chưa phát bài cho giáo viên chấm hoặc muốn tổ chức làm phách lại từ đầu.
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={executeGenerate}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm rounded-lg shadow-xs"
              >
                Xác nhận tạo lại mã
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
