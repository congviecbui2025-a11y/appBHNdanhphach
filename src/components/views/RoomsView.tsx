/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useExam } from '../../context/ExamContext';
import { Room } from '../../types';
import { getCodeRange } from '../../utils/examUtils';
import {
  DoorClosed,
  Plus,
  Minus,
  Edit2,
  Trash2,
  Printer,
  FileSpreadsheet,
  Settings,
  Users,
  Barcode,
  AlertTriangle,
  Info,
  Check,
  X,
  ListFilter,
} from 'lucide-react';
import { exportExaminerAnonymizedExcel } from '../../utils/excelExport';

export const RoomsView: React.FC = () => {
  const {
    data,
    setRoomCount,
    addRoom,
    updateRoom,
    deleteRoom,
    setActiveTab,
    validation,
    generateExamCodes,
    setBatchStudentCount,
    syncStudentCountsWithActualList,
  } = useExam();

  const [stepperCount, setStepperCount] = useState<number>(data.rooms.length || 2);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [batchCountInput, setBatchCountInput] = useState<string>('24');

  // Form thêm phòng mới
  const [newRoomForm, setNewRoomForm] = useState({
    roomNumber: (data.rooms.length > 0 ? Math.max(...data.rooms.map((r) => r.roomNumber)) + 1 : 1),
    roomName: `Phòng ${data.rooms.length + 1}`,
    studentCount: '' as string | number,
    codePrefix: '',
    codeStartNumber: 1,
    assignedTeacherId: '',
  });

  const handleApplyStepper = (newCount: number) => {
    if (newCount < 1) newCount = 1;
    if (newCount > 100) newCount = 100;
    setStepperCount(newCount);
    setRoomCount(newCount);
  };

  const handleOpenAddModal = () => {
    const nextNum = data.rooms.length > 0 ? Math.max(...data.rooms.map((r) => r.roomNumber)) + 1 : 1;
    setNewRoomForm({
      roomNumber: nextNum,
      roomName: `Phòng ${nextNum}`,
      studentCount: '',
      codePrefix: '',
      codeStartNumber: 1,
      assignedTeacherId: '',
    });
    setShowAddModal(true);
  };

  const handleSaveNewRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const countVal = newRoomForm.studentCount === '' ? null : Number(newRoomForm.studentCount);
    if (countVal !== null && (isNaN(countVal) || countVal < 0)) {
      alert('Số lượng học sinh phải là số nguyên không âm!');
      return;
    }

    addRoom({
      roomNumber: Number(newRoomForm.roomNumber) || 1,
      roomName: newRoomForm.roomName.trim() || `Phòng ${newRoomForm.roomNumber}`,
      studentCount: countVal,
      codePrefix: newRoomForm.codePrefix.trim(),
      codeStartNumber: Number(newRoomForm.codeStartNumber) || 1,
      assignedTeacherId: newRoomForm.assignedTeacherId || null,
    });

    setShowAddModal(false);
  };

  const handleSaveEditRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoom) return;

    if (editingRoom.studentCount !== null && (isNaN(editingRoom.studentCount) || editingRoom.studentCount < 0)) {
      alert('Số lượng học sinh phải là số nguyên không âm!');
      return;
    }

    if (!editingRoom.roomName.trim()) {
      alert('Tên phòng thi không được để trống!');
      return;
    }

    if (!editingRoom.codePrefix.trim()) {
      alert('Tiền tố mã phách không được để trống!');
      return;
    }

    updateRoom(editingRoom.id, {
      ...editingRoom,
      roomName: editingRoom.roomName.trim(),
      codePrefix: editingRoom.codePrefix.trim(),
      codeStartNumber: Number(editingRoom.codeStartNumber) || 1,
    });

    setEditingRoom(null);
  };

  const teacherMap = new Map(data.teachers.map((t) => [t.id, t.fullName]));

  return (
    <div className="space-y-6">
      {/* Cảnh báo xung đột nếu có */}
      {(validation.duplicatePrefixes.length > 0 || validation.duplicateCodes.length > 0) && (
        <div className="bg-rose-50 border border-rose-300 rounded-xl p-4 text-rose-900 text-sm space-y-1">
          <div className="flex items-center gap-2 font-bold text-rose-800">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>Phát hiện trùng lặp mã phòng thi:</span>
          </div>
          {validation.duplicatePrefixes.map((d, i) => (
            <p key={i} className="text-xs sm:text-sm pl-6">
              • Tiền tố <strong>"{d.prefix}"</strong> bị trùng giữa các phòng: {d.roomNames.join(', ')}. Hãy đổi tiền tố để tránh trùng mã phách!
            </p>
          ))}
          {validation.duplicateCodes.map((d, i) => (
            <p key={i} className="text-xs sm:text-sm pl-6">
              • Mã phách <strong>"{d.code}"</strong> bị trùng giữa các phòng: {d.roomNames.join(', ')}!
            </p>
          ))}
        </div>
      )}

      {/* Main Container */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-5 sm:p-6">
        
        {/* Top Header of Room List */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-teal-50 text-teal-700 border border-teal-100">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Danh sách phòng thi</h2>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                <Info className="w-3.5 h-3.5 text-slate-400" />
                <span>Có thể thêm, xóa hoặc chỉnh sửa phòng thi</span>
              </div>
            </div>
          </div>

          {/* Stepper + Add Button */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-slate-100/90 p-1.5 rounded-lg border border-slate-200">
              <span className="text-xs font-semibold text-slate-700 px-2 whitespace-nowrap">
                Số phòng thi:
              </span>
              <button
                type="button"
                onClick={() => handleApplyStepper(data.rooms.length - 1)}
                disabled={data.rooms.length <= 1}
                className="w-8 h-8 rounded-md bg-[#0d2f53] hover:bg-[#0a2540] text-white flex items-center justify-center font-bold disabled:opacity-40 transition-colors cursor-pointer"
                title="Giảm 1 phòng"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-10 text-center font-bold text-slate-900 text-sm tabular-nums">
                {data.rooms.length}
              </span>
              <button
                type="button"
                onClick={() => handleApplyStepper(data.rooms.length + 1)}
                disabled={data.rooms.length >= 100}
                className="w-8 h-8 rounded-md bg-[#0d2f53] hover:bg-[#0a2540] text-white flex items-center justify-center font-bold disabled:opacity-40 transition-colors cursor-pointer"
                title="Tăng 1 phòng"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold text-sm rounded-lg shadow-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Thêm phòng thi
            </button>
          </div>
        </div>

        {/* Action Toolbar Row */}
        <div className="flex items-center gap-2.5 my-5 flex-wrap">
          <button
            onClick={() => {
              generateExamCodes();
              setActiveTab('generate');
            }}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold text-xs sm:text-sm rounded-lg shadow-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <Settings className="w-4 h-4" />
            Tạo mã phách
          </button>

          <button
            onClick={() => setActiveTab('students')}
            className="px-4 py-2 bg-[#0d2f53] hover:bg-[#0a2540] text-white font-semibold text-xs sm:text-sm rounded-lg shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
          >
            <ListFilter className="w-4 h-4" />
            Xem danh sách học sinh
          </button>

          <button
            onClick={() => setActiveTab('print')}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs sm:text-sm rounded-lg shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            In danh sách
          </button>

          <button
            onClick={() => exportExaminerAnonymizedExcel(data)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm rounded-lg shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Tải Excel
          </button>
        </div>

        {/* Thanh công cụ nhập nhanh sĩ số hàng loạt */}
        {data.rooms.length > 0 && (
          <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3.5 mb-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <Users className="w-4 h-4 text-sky-600 shrink-0" />
              <span>Nhập nhanh sĩ số hàng loạt:</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="text-slate-600 font-medium">Sĩ số:</span>
              <input
                type="number"
                min="1"
                placeholder="24"
                value={batchCountInput}
                onChange={(e) => setBatchCountInput(e.target.value)}
                className="w-16 px-2 py-1 bg-white border border-slate-300 rounded-md font-bold text-center text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
              />
              <span className="text-slate-500">HS/phòng</span>
              <button
                type="button"
                onClick={() => {
                  const val = Number(batchCountInput);
                  if (isNaN(val) || val <= 0) {
                    alert('Vui lòng nhập sĩ số lớn hơn 0!');
                    return;
                  }
                  setBatchStudentCount(val, 'all');
                }}
                className="px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-md shadow-2xs transition-colors cursor-pointer"
              >
                Gán cho tất cả {data.rooms.length} phòng
              </button>
              <button
                type="button"
                onClick={() => {
                  const val = Number(batchCountInput);
                  if (isNaN(val) || val <= 0) {
                    alert('Vui lòng nhập sĩ số lớn hơn 0!');
                    return;
                  }
                  setBatchStudentCount(val, 'unentered');
                }}
                className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-md transition-colors cursor-pointer"
              >
                Chỉ gán phòng chưa nhập
              </button>
              {data.students.length > 0 && (
                <button
                  type="button"
                  onClick={syncStudentCountsWithActualList}
                  className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-md shadow-2xs transition-colors cursor-pointer"
                >
                  Lấy theo danh sách HS thực tế
                </button>
              )}
            </div>
          </div>
        )}

        {/* Danh sách các thẻ phòng thi */}
        {data.rooms.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
            <DoorClosed className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-600 font-medium">Hiện chưa có phòng thi nào.</p>
            <p className="text-xs text-slate-400 mt-1">Sử dụng bộ tăng số phòng ở trên hoặc bấm "Thêm phòng thi".</p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {data.rooms.map((room, index) => {
              const codeRange = getCodeRange(room);
              const teacherName = room.assignedTeacherId ? teacherMap.get(room.assignedTeacherId) : null;
              const isEven = index % 2 === 0;
              const actualCount = data.students.filter((s) => s.roomId === room.id).length;

              return (
                <div
                  key={room.id}
                  className={`
                    flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 rounded-xl border transition-all
                    ${isEven ? 'bg-sky-50/40 border-sky-100 hover:border-sky-200' : 'bg-teal-50/30 border-teal-100 hover:border-teal-200'}
                  `}
                >
                  {/* Left: Room Icon & Name */}
                  <div className="flex items-center gap-4 min-w-[180px] mb-3 sm:mb-0">
                    <div
                      className={`
                        w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-xs
                        ${isEven ? 'bg-sky-600 text-white' : 'bg-teal-600 text-white'}
                      `}
                    >
                      <DoorClosed className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-slate-900">{room.roomName}</h4>
                      <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>Tiền tố: <strong className="font-mono text-slate-800">{room.codePrefix}</strong></span>
                        <span>·</span>
                        <span>Bắt đầu: <strong className="font-mono text-slate-800">{room.codeStartNumber}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Student Count & Code Range */}
                  <div className="flex-1 sm:px-6 grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3 sm:mb-0">
                    {/* Học sinh & Giáo viên - Ô TỰ NHẬP TRỰC TIẾP */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Users className="w-4 h-4 text-slate-500 shrink-0" />
                        <span className="text-xs font-bold text-slate-700">Sĩ số:</span>
                        <input
                          type="number"
                          min="0"
                          placeholder="Chưa nhập"
                          value={room.studentCount === null || room.studentCount === undefined ? '' : room.studentCount}
                          onChange={(e) => {
                            const val = e.target.value === '' ? null : Math.max(0, parseInt(e.target.value, 10));
                            updateRoom(room.id, { studentCount: isNaN(val as number) ? null : val });
                          }}
                          className="w-24 px-2 py-1 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:border-sky-500 shadow-2xs tabular-nums text-center"
                          title="Tự nhập trực tiếp số lượng học sinh cho phòng này"
                        />
                        <span className="text-xs text-slate-500 font-medium">HS</span>

                        {/* Nút lấy nhanh theo số lượng thực tế nếu có danh sách */}
                        {actualCount > 0 && actualCount !== room.studentCount && (
                          <button
                            type="button"
                            onClick={() => updateRoom(room.id, { studentCount: actualCount })}
                            title={`Lấy ${actualCount} học sinh có trong danh sách`}
                            className="text-[11px] font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                          >
                            Lấy {actualCount} HS
                          </button>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 pl-6 flex items-center gap-1.5 flex-wrap">
                        <span className="shrink-0 font-medium">GV làm phách:</span>
                        <select
                          value={room.assignedTeacherId || ''}
                          onChange={(e) => updateRoom(room.id, { assignedTeacherId: e.target.value || null })}
                          className={`text-xs font-semibold px-2 py-0.5 bg-white border rounded-md max-w-[180px] truncate transition-colors ${
                            room.assignedTeacherId
                              ? 'border-slate-300 text-slate-800'
                              : 'border-amber-300 bg-amber-50/50 text-amber-700'
                          }`}
                        >
                          <option value="">-- Chưa phân công --</option>
                          {data.teachers.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.fullName}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Mã phách Barcode */}
                    <div className="flex items-center gap-2">
                      <Barcode className="w-5 h-5 text-slate-600 shrink-0" />
                      <div>
                        <span className="text-xs text-slate-400 block">Dải mã phách:</span>
                        <span className="text-sm font-bold font-mono text-slate-900">
                          {codeRange === 'Chưa nhập' ? (
                            <span className="text-slate-400 italic font-sans font-normal">Chưa nhập sĩ số</span>
                          ) : (
                            codeRange
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Edit & Delete Buttons */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      onClick={() => setEditingRoom({ ...room })}
                      className="px-3 py-1.5 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200/80 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Sửa
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Bạn có chắc chắn muốn xóa ${room.roomName}?`)) {
                          deleteRoom(room.id);
                        }
                      }}
                      className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Xóa
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Dotted Box: Thêm phòng thi ở dưới cùng (giống ảnh mẫu) */}
        <div className="mt-6 border-2 border-dashed border-sky-200 rounded-xl p-5 text-center bg-sky-50/20">
          <button
            onClick={handleOpenAddModal}
            className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm rounded-lg shadow-xs inline-flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Thêm phòng thi
          </button>
          <p className="text-xs text-slate-500 mt-2">
            Có thể thêm, xóa hoặc chỉnh sửa phòng thi để phù hợp với số lượng học sinh và điều kiện tổ chức.
          </p>
        </div>

      </div>

      {/* MODAL SỬA PHÒNG THI */}
      {editingRoom && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-sky-600" />
                Chỉnh sửa thông tin phòng thi
              </h3>
              <button
                onClick={() => setEditingRoom(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditRoom} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Số thứ tự phòng:
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editingRoom.roomNumber}
                    onChange={(e) => setEditingRoom({ ...editingRoom, roomNumber: Number(e.target.value) })}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tên phòng thi:
                  </label>
                  <input
                    type="text"
                    value={editingRoom.roomName}
                    onChange={(e) => setEditingRoom({ ...editingRoom, roomName: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Số lượng học sinh:
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Chưa nhập"
                    value={editingRoom.studentCount === null ? '' : editingRoom.studentCount}
                    onChange={(e) =>
                      setEditingRoom({
                        ...editingRoom,
                        studentCount: e.target.value === '' ? null : Math.max(0, parseInt(e.target.value, 10)),
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                  />
                  <span className="text-[11px] text-slate-400">Để trống = Chưa nhập</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tiền tố mã phách:
                  </label>
                  <input
                    type="text"
                    value={editingRoom.codePrefix}
                    onChange={(e) => setEditingRoom({ ...editingRoom, codePrefix: e.target.value })}
                    placeholder="a, b, c... hoặc A, B, C..."
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Số bắt đầu:
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editingRoom.codeStartNumber}
                    onChange={(e) => setEditingRoom({ ...editingRoom, codeStartNumber: Number(e.target.value) || 1 })}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Giáo viên làm phách phụ trách:
                </label>
                <select
                  value={editingRoom.assignedTeacherId || ''}
                  onChange={(e) => setEditingRoom({ ...editingRoom, assignedTeacherId: e.target.value || null })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                >
                  <option value="">-- Chưa phân công --</option>
                  {data.teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.fullName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Xem trước dải mã */}
              <div className="p-3 bg-slate-100 rounded-lg text-xs flex items-center justify-between">
                <span className="text-slate-600 font-medium">Khoảng mã phách dự kiến:</span>
                <span className="font-mono font-bold text-slate-900">{getCodeRange(editingRoom)}</span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingRoom(null)}
                  className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm rounded-lg shadow-xs"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL THÊM PHÒNG THI MỚI */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-teal-600" />
                Thêm phòng thi mới
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewRoom} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Số thứ tự phòng:
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newRoomForm.roomNumber}
                    onChange={(e) => setNewRoomForm({ ...newRoomForm, roomNumber: Number(e.target.value) })}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tên phòng thi:
                  </label>
                  <input
                    type="text"
                    value={newRoomForm.roomName}
                    onChange={(e) => setNewRoomForm({ ...newRoomForm, roomName: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Số lượng học sinh:
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Chưa nhập"
                    value={newRoomForm.studentCount}
                    onChange={(e) => setNewRoomForm({ ...newRoomForm, studentCount: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                  />
                  <span className="text-[11px] text-slate-400">Để trống = Chưa nhập</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tiền tố mã phách:
                  </label>
                  <input
                    type="text"
                    value={newRoomForm.codePrefix}
                    onChange={(e) => setNewRoomForm({ ...newRoomForm, codePrefix: e.target.value })}
                    placeholder="Tự động nếu để trống (a..z, A..Z)"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Số bắt đầu:
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newRoomForm.codeStartNumber}
                    onChange={(e) => setNewRoomForm({ ...newRoomForm, codeStartNumber: Number(e.target.value) || 1 })}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Giáo viên làm phách phụ trách:
                </label>
                <select
                  value={newRoomForm.assignedTeacherId}
                  onChange={(e) => setNewRoomForm({ ...newRoomForm, assignedTeacherId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                >
                  <option value="">-- Chưa phân công --</option>
                  {data.teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm rounded-lg shadow-xs"
                >
                  Thêm phòng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
