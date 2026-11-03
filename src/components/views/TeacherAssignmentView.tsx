/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useExam } from '../../context/ExamContext';
import { Teacher, Room } from '../../types';
import { getCodeRange } from '../../utils/examUtils';
import {
  Users,
  UserPlus,
  Edit2,
  Trash2,
  Layers,
  Save,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Phone,
  DoorClosed,
} from 'lucide-react';

export const TeacherAssignmentView: React.FC = () => {
  const {
    data,
    addTeacher,
    updateTeacher,
    deleteTeacher,
    assignRoomsToTeacher,
    assignRangeToTeacher,
    assignRangeToTeacherByName,
    removeSampleTeachers,
    validation,
    showToast,
    setActiveTab,
  } = useExam();

  // Thêm giáo viên mới
  const [newTeacherName, setNewTeacherName] = useState('');
  const [newTeacherPhone, setNewTeacherPhone] = useState('');
  const [newTeacherNotes, setNewTeacherNotes] = useState('');

  // Chỉnh sửa giáo viên
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

  // Phân công theo dải phòng - TỰ NHẬP HỌ TÊN
  const [rangeTeacherName, setRangeTeacherName] = useState('');
  const [rangeFrom, setRangeFrom] = useState<number>(1);
  const [rangeTo, setRangeTo] = useState<number>(8);

  // Phân công từng phòng riêng lẻ (modal/popover)
  const [selectedTeacherForManual, setSelectedTeacherForManual] = useState<Teacher | null>(null);
  const [manualRoomSelection, setManualRoomSelection] = useState<string[]>([]);

  const handleAddTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeacherName.trim()) return;
    addTeacher({
      fullName: newTeacherName.trim(),
      phone: newTeacherPhone.trim(),
      notes: newTeacherNotes.trim(),
    });
    setNewTeacherName('');
    setNewTeacherPhone('');
    setNewTeacherNotes('');
  };

  const handleApplyRange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rangeTeacherName.trim()) {
      alert('Vui lòng tự nhập họ và tên giáo viên phụ trách!');
      return;
    }
    assignRangeToTeacherByName(rangeTeacherName.trim(), Number(rangeFrom), Number(rangeTo));
    setRangeTeacherName('');
  };

  const openManualModal = (teacher: Teacher) => {
    setSelectedTeacherForManual(teacher);
    // Lấy các phòng đang thuộc về giáo viên này
    const currentRooms = data.rooms.filter((r) => r.assignedTeacherId === teacher.id).map((r) => r.id);
    setManualRoomSelection(currentRooms);
  };

  const handleSaveManualAssignment = () => {
    if (!selectedTeacherForManual) return;
    assignRoomsToTeacher(selectedTeacherForManual.id, manualRoomSelection);
    setSelectedTeacherForManual(null);
  };

  const handleToggleRoom = (roomId: string) => {
    setManualRoomSelection((prev) =>
      prev.includes(roomId) ? prev.filter((id) => id !== roomId) : [...prev, roomId]
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Cảnh báo phòng chưa phân công */}
      {validation.unassignedRooms.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 text-amber-900 text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Cảnh báo: Có {validation.unassignedRooms.length} phòng chưa được phân công giáo viên!</span>
            <p className="text-xs text-amber-800 mt-1">
              Các phòng: {validation.unassignedRooms.map((r) => r.roomName).join(', ')}. Hãy gán giáo viên phụ trách để đảm bảo quy trình bảo mật đánh phách.
            </p>
          </div>
        </div>
      )}

      {/* Banner dọn dẹp nếu còn giáo viên mẫu A hoặc B */}
      {data.teachers.some((t) => ['giáo viên a', 'giáo viên b', 'giao vien a', 'giao vien b'].includes(t.fullName.toLowerCase().trim())) && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs text-amber-900">
          <span>Hệ thống phát hiện còn "Giáo viên A" hoặc "Giáo viên B" trong danh sách.</span>
          <button
            type="button"
            onClick={removeSampleTeachers}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            Bỏ Giáo viên A & B để tự nhập tên mới
          </button>
        </div>
      )}

      {/* Grid 2 Cột: Thêm giáo viên & Phân công theo dải phòng */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Cột 1: Thêm Giáo viên làm phách */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-5 sm:p-6">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="p-2 bg-sky-50 text-sky-700 rounded-lg">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Thêm giáo viên làm phách</h3>
              <p className="text-xs text-slate-500">Không giới hạn số lượng giáo viên trong hội đồng</p>
            </div>
          </div>

          <form onSubmit={handleAddTeacher} className="mt-4 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Họ và tên giáo viên <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="VD: Thầy Nguyễn Văn Nam, Cô Trần Thị Mai..."
                value={newTeacherName}
                onChange={(e) => setNewTeacherName(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Số điện thoại (tùy chọn)
                </label>
                <input
                  type="text"
                  placeholder="0912..."
                  value={newTeacherPhone}
                  onChange={(e) => setNewTeacherPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ghi chú nhiệm vụ
                </label>
                <input
                  type="text"
                  placeholder="Tổ trưởng, phòng 1-8..."
                  value={newTeacherNotes}
                  onChange={(e) => setNewTeacherNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white font-semibold text-sm rounded-lg shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              Thêm vào danh sách giáo viên
            </button>
          </form>
        </div>

        {/* Cột 2: Phân công theo dải phòng nhanh - TỰ NHẬP HỌ TÊN */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-5 sm:p-6">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="p-2 bg-teal-50 text-teal-700 rounded-lg">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Phân công theo dải phòng</h3>
              <p className="text-xs text-slate-500">Tự nhập tên giáo viên để gán nhanh khoảng phòng (VD: Phòng 1 đến 8)</p>
            </div>
          </div>

          <form onSubmit={handleApplyRange} className="mt-4 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tự nhập họ và tên giáo viên phụ trách <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  list="teachers-range-datalist"
                  placeholder="Tự gõ tên giáo viên (VD: Thầy Nguyễn Văn Nam)..."
                  value={rangeTeacherName}
                  onChange={(e) => setRangeTeacherName(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:border-teal-500 shadow-2xs"
                />
                <datalist id="teachers-range-datalist">
                  {data.teachers.map((t) => (
                    <option key={t.id} value={t.fullName} />
                  ))}
                </datalist>
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                * Có thể tự gõ tên giáo viên mới bất kỳ hoặc chọn từ danh sách đã nhập
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Từ Phòng số:
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={rangeFrom}
                  onChange={(e) => setRangeFrom(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-bold text-center"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Đến Phòng số:
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={rangeTo}
                  onChange={(e) => setRangeTo(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-bold text-center"
                />
              </div>
            </div>

            <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              💡 <em>Lưu ý:</em> Chuyển phòng không làm thay đổi tiền tố và số bắt đầu của phòng thi.
            </div>

            <button
              type="submit"
              disabled={data.rooms.length === 0 || !rangeTeacherName.trim()}
              className="w-full px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white font-semibold text-sm rounded-lg shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              Áp dụng phân công dải phòng
            </button>
          </form>
        </div>
      </div>

      {/* Bảng danh sách và phân công chi tiết của từng giáo viên */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Chi tiết phân công theo giáo viên
            </h3>
            <p className="text-xs text-slate-500">
              Hiển thị số phòng, số học sinh và dải mã phách dự kiến của từng giáo viên
            </p>
          </div>

          <button
            onClick={() => showToast('Phân công giáo viên đã được lưu và bảo toàn!')}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            Lưu phân công
          </button>
        </div>

        {data.teachers.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            Chưa có giáo viên nào trong danh sách. Hãy thêm giáo viên ở khung phía trên.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">STT</th>
                  <th className="py-3 px-4">Giáo viên làm phách</th>
                  <th className="py-3 px-4">Số ĐT / Ghi chú</th>
                  <th className="py-3 px-4 text-center">Số phòng</th>
                  <th className="py-3 px-4">Các phòng được giao</th>
                  <th className="py-3 px-4 text-center">Tổng số HS</th>
                  <th className="py-3 px-4">Khoảng mã phách</th>
                  <th className="py-3 px-4 text-center">Thao tác</th>
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
                    <tr key={teacher.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-center text-slate-400 font-medium">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {teacher.fullName}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500">
                        {teacher.phone && <div className="font-mono text-slate-700">{teacher.phone}</div>}
                        {teacher.notes && <div className="italic text-slate-400">{teacher.notes}</div>}
                        {!teacher.phone && !teacher.notes && <span className="text-slate-300">-</span>}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-900 tabular-nums">
                        {assignedRooms.length}
                      </td>
                      <td className="py-3 px-4">
                        {assignedRooms.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-md">
                            {assignedRooms.map((r) => (
                              <span
                                key={r.id}
                                className="inline-block px-2 py-0.5 text-xs bg-sky-50 text-sky-800 rounded-md border border-sky-200"
                              >
                                {r.roomName}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-amber-600 italic">Chưa giao phòng</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-teal-700 tabular-nums">
                        {totalHs}
                      </td>
                      <td className="py-3 px-4 text-xs font-mono text-slate-700 max-w-xs truncate" title={roomRanges}>
                        {roomRanges || <span className="text-slate-400 italic">Chưa có mã</span>}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openManualModal(teacher)}
                            title="Chọn phòng cụ thể"
                            className="p-1.5 text-teal-700 hover:bg-teal-50 rounded-md text-xs font-semibold border border-teal-200/80"
                          >
                            Chọn phòng
                          </button>
                          <button
                            onClick={() => setEditingTeacher({ ...teacher })}
                            title="Sửa thông tin giáo viên"
                            className="p-1.5 text-slate-600 hover:text-sky-700 hover:bg-slate-100 rounded-md"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Xóa giáo viên ${teacher.fullName}? Các phòng đang gán sẽ trở về trạng thái chưa phân công.`)) {
                                deleteTeacher(teacher.id);
                              }
                            }}
                            title="Xóa giáo viên"
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL CHỌN PHÒNG CỤ THỂ CHO GIÁO VIÊN */}
      {selectedTeacherForManual && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-2xl w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Phân công phòng cho: <span className="text-sky-600">{selectedTeacherForManual.fullName}</span>
                </h3>
                <p className="text-xs text-slate-500">Tích chọn các phòng muốn giao cho giáo viên này</p>
              </div>
              <button
                onClick={() => setSelectedTeacherForManual(null)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                Đóng ✕
              </button>
            </div>

            <div className="mt-4 max-h-80 overflow-y-auto">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {data.rooms.map((room) => {
                  const isChecked = manualRoomSelection.includes(room.id);
                  const currentTeacher = data.teachers.find((t) => t.id === room.assignedTeacherId);
                  const isOtherTeacher = currentTeacher && currentTeacher.id !== selectedTeacherForManual.id;

                  return (
                    <div
                      key={room.id}
                      onClick={() => handleToggleRoom(room.id)}
                      className={`
                        p-3 rounded-lg border text-sm cursor-pointer transition-all flex flex-col justify-between
                        ${
                          isChecked
                            ? 'bg-teal-50 border-teal-500 text-teal-900 shadow-xs'
                            : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700'
                        }
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold">{room.roomName}</span>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // Đã xử lý ở thẻ cha
                          className="rounded-sm text-teal-600 focus:ring-teal-500"
                        />
                      </div>
                      <div className="text-[11px] text-slate-500 mt-2">
                        {room.studentCount !== null ? `${room.studentCount} HS` : 'Chưa có sĩ số'}
                      </div>
                      {isOtherTeacher && (
                        <div className="text-[10px] text-amber-600 mt-1 truncate" title={`Đang gán: ${currentTeacher.fullName}`}>
                          Đang gán: {currentTeacher.fullName}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
              <span className="text-xs text-slate-500">
                Đã chọn: <strong className="text-slate-800">{manualRoomSelection.length}</strong> phòng
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTeacherForManual(null)}
                  className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSaveManualAssignment}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm rounded-lg shadow-xs"
                >
                  Xác nhận lưu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SỬA GIÁO VIÊN */}
      {editingTeacher && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-slate-900 pb-3 border-b border-slate-100">
              Chỉnh sửa thông tin giáo viên
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateTeacher(editingTeacher.id, editingTeacher);
                setEditingTeacher(null);
              }}
              className="mt-4 space-y-3"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Họ và tên
                </label>
                <input
                  type="text"
                  value={editingTeacher.fullName}
                  onChange={(e) => setEditingTeacher({ ...editingTeacher, fullName: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Số điện thoại
                </label>
                <input
                  type="text"
                  value={editingTeacher.phone || ''}
                  onChange={(e) => setEditingTeacher({ ...editingTeacher, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ghi chú
                </label>
                <input
                  type="text"
                  value={editingTeacher.notes || ''}
                  onChange={(e) => setEditingTeacher({ ...editingTeacher, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingTeacher(null)}
                  className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm rounded-lg"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
