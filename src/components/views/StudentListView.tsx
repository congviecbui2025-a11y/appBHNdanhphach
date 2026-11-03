/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { useExam } from '../../context/ExamContext';
import { Student } from '../../types';
import * as XLSX from 'xlsx';
import {
  GraduationCap,
  Plus,
  FileSpreadsheet,
  Download,
  Upload,
  Edit2,
  Trash2,
  CheckCircle,
  AlertCircle,
  Filter,
  Search,
  X,
  Check,
  Zap,
} from 'lucide-react';
import { downloadSampleStudentTemplateExcel } from '../../utils/excelExport';

export const StudentListView: React.FC = () => {
  const {
    data,
    addStudent,
    updateStudent,
    deleteStudent,
    importStudents,
    updateRoom,
    setBatchStudentCount,
    syncStudentCountsWithActualList,
    autoFillRoomStudents,
    autoFillAllRoomsStudents,
    showToast,
  } = useExam();

  const [selectedRoomId, setSelectedRoomId] = useState<string>('all');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [quickBatchCount, setQuickBatchCount] = useState<string>('24');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form thêm học sinh mới
  const [newStudentForm, setNewStudentForm] = useState({
    roomId: data.rooms[0]?.id || '',
    studentCode: '',
    fullName: '',
    className: '',
  });

  // Lọc học sinh
  const filteredStudents = data.students.filter((student) => {
    const matchesRoom = selectedRoomId === 'all' || student.roomId === selectedRoomId;
    const matchesKeyword =
      !searchKeyword ||
      student.fullName.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      student.studentCode.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      student.className.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      (student.examCode && student.examCode.toLowerCase().includes(searchKeyword.toLowerCase()));
    return matchesRoom && matchesKeyword;
  });

  const roomMap = new Map(data.rooms.map((r) => [r.id, r]));

  // Xử lý upload file Excel/CSV
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rows: any[] = XLSX.utils.sheet_to_json(ws);

        if (!rows || rows.length === 0) {
          alert('File rỗng hoặc không có dữ liệu học sinh!');
          return;
        }

        const imported: Omit<Student, 'id'>[] = [];
        rows.forEach((row, idx) => {
          // Nhận diện linh hoạt các tên cột phổ biến
          const sbd = row['Số báo danh'] || row['SBD'] || row['studentCode'] || `10${String(idx + 1).padStart(3, '0')}`;
          const hoTen = row['Họ và tên'] || row['Họ tên'] || row['HoTen'] || row['fullName'] || '';
          const lop = row['Lớp'] || row['Lop'] || row['className'] || data.examInfo.grade ? `${data.examInfo.grade}A1` : '10A1';
          const phongStr = String(row['Phòng thi'] || row['Phòng'] || row['Phong'] || '').trim();

          // Tìm roomId tương ứng
          let targetRoomId = data.rooms[0]?.id || '';
          if (phongStr) {
            const foundRoom = data.rooms.find(
              (r) =>
                r.roomName.toLowerCase() === phongStr.toLowerCase() ||
                `phòng ${r.roomNumber}` === phongStr.toLowerCase() ||
                String(r.roomNumber) === phongStr
            );
            if (foundRoom) targetRoomId = foundRoom.id;
          } else if (selectedRoomId !== 'all') {
            targetRoomId = selectedRoomId;
          }

          if (hoTen.trim()) {
            imported.push({
              roomId: targetRoomId,
              stt: idx + 1,
              studentCode: String(sbd).trim(),
              fullName: String(hoTen).trim(),
              className: String(lop).trim(),
              examCode: null,
            });
          }
        });

        if (imported.length > 0) {
          importStudents(imported);
        } else {
          alert('Không tìm thấy bản ghi học sinh hợp lệ. Vui lòng tải file mẫu để xem định dạng chuẩn!');
        }
      } catch (err: any) {
        alert(`Lỗi khi đọc file: ${err.message}`);
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleSaveNewStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentForm.fullName.trim()) return;

    const currentRoomStudents = data.students.filter((s) => s.roomId === newStudentForm.roomId);
    const nextStt = currentRoomStudents.length + 1;

    addStudent({
      roomId: newStudentForm.roomId,
      stt: nextStt,
      studentCode: newStudentForm.studentCode.trim() || `10${String(nextStt).padStart(3, '0')}`,
      fullName: newStudentForm.fullName.trim(),
      className: newStudentForm.className.trim() || `${data.examInfo.grade || '10'}A1`,
      examCode: null,
    });

    setNewStudentForm({
      ...newStudentForm,
      studentCode: '',
      fullName: '',
    });
    setShowAddModal(false);
  };

  const handleSaveEditStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    updateStudent(editingStudent.id, {
      roomId: editingStudent.roomId,
      studentCode: editingStudent.studentCode.trim(),
      fullName: editingStudent.fullName.trim(),
      className: editingStudent.className.trim(),
    });
    setEditingStudent(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Thẻ kiểm tra khớp sĩ số các phòng & Tự nhập sĩ số */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Filter className="w-4 h-4 text-sky-600" />
              Tình trạng đối chiếu sĩ số học sinh theo phòng thi:
            </h3>
            <span className="text-xs text-slate-500">
              * Bấm vào từng phòng để xem danh sách hoặc tự nhập sĩ số cho phòng đó
            </span>
          </div>


        </div>

        <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1">
          <button
            onClick={() => setSelectedRoomId('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              selectedRoomId === 'all'
                ? 'bg-[#0d2f53] text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Tất cả phòng ({data.students.length} HS)
          </button>

          {data.rooms.map((room) => {
            const actualCount = data.students.filter((s) => s.roomId === room.id).length;
            const declared = room.studentCount;
            const isMatch = declared !== null && declared === actualCount && declared > 0;
            const isSelected = selectedRoomId === room.id;

            return (
              <button
                key={room.id}
                onClick={() => setSelectedRoomId(room.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer border ${
                  isSelected
                    ? 'bg-sky-600 text-white border-sky-600 shadow-xs ring-1 ring-sky-400'
                    : declared !== null
                    ? 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                    : 'bg-amber-50/60 hover:bg-amber-100/70 text-amber-900 border-amber-200'
                }`}
                title={`Bấm để chọn và tự nhập sĩ số cho ${room.roomName}`}
              >
                <span className="font-semibold">{room.roomName}:</span>
                {declared !== null ? (
                  <>
                    <strong className="font-mono tabular-nums">{actualCount}</strong>
                    <span className={`text-[11px] ${isSelected ? 'text-sky-200' : 'text-slate-500'}`}>
                      /{declared}
                    </span>
                    {isMatch && <Check className="w-3.5 h-3.5 text-emerald-400 inline" />}
                  </>
                ) : actualCount > 0 ? (
                  <span className="font-mono text-amber-700 font-bold">{actualCount} HS (chưa đặt)</span>
                ) : (
                  <span className="text-[11px] text-amber-700 italic">Chưa nhập</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Cảnh báo và hành động nhanh nếu có phòng chưa có học sinh thực tế */}
        {(() => {
          const unfilledRooms = data.rooms.filter((r) => {
            const act = data.students.filter((s) => s.roomId === r.id).length;
            return act === 0 && (r.studentCount === null || r.studentCount > 0);
          });
          if (unfilledRooms.length > 0) {
            return (
              <div className="mt-3 p-2.5 bg-amber-50/90 border border-amber-200 rounded-lg flex items-center justify-between gap-3 text-xs flex-wrap">
                <div className="flex items-center gap-2 text-amber-800">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Có <strong>{unfilledRooms.length} phòng</strong> chưa có học sinh thực tế trong danh sách (đang hiển thị 0 HS).
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => autoFillAllRoomsStudents(24)}
                  className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-md shadow-2xs cursor-pointer flex items-center gap-1 transition-colors"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Tự động điền học sinh thực tế cho các phòng này ngay</span>
                </button>
              </div>
            );
          }
          return null;
        })()}

        {/* Khung tương tác tự nhập sĩ số trực tiếp */}
        {selectedRoomId !== 'all' ? (
          (() => {
            const currentRoom = roomMap.get(selectedRoomId);
            if (!currentRoom) return null;
            const actualCount = data.students.filter((s) => s.roomId === currentRoom.id).length;

            return (
              <div className="mt-4 p-3.5 bg-sky-50/80 border border-sky-200 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <span className="px-2.5 py-1 bg-sky-600 text-white rounded-md text-xs font-semibold shadow-2xs">
                      {currentRoom.roomName}
                    </span>
                  </div>
                  <span className="text-slate-400">|</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-700">Tự nhập sĩ số phòng:</span>
                    <input
                      type="number"
                      min="0"
                      placeholder="Chưa nhập"
                      value={currentRoom.studentCount === null || currentRoom.studentCount === undefined ? '' : currentRoom.studentCount}
                      onChange={(e) => {
                        const raw = e.target.value;
                        if (raw === '') {
                          updateRoom(currentRoom.id, { studentCount: null });
                          return;
                        }
                        const val = Math.max(0, parseInt(raw, 10));
                        if (!isNaN(val)) {
                          // Tự động điền số lượng học sinh từng phòng thực tế khớp với sĩ số vừa nhập
                          autoFillRoomStudents(currentRoom.id, val);
                        }
                      }}
                      className="w-24 px-2.5 py-1 text-sm font-bold bg-white border border-slate-300 rounded-lg text-center text-slate-900 focus:ring-2 focus:ring-sky-500 shadow-2xs tabular-nums"
                    />
                    <span className="text-slate-600 font-medium">học sinh</span>
                  </div>
                  <span className="text-slate-600">
                    (Thực tế trong danh sách: <strong className="text-slate-900 font-mono font-bold text-sm">{actualCount}</strong> HS)
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      const target =
                        currentRoom.studentCount !== null && currentRoom.studentCount > 0
                          ? currentRoom.studentCount
                          : 24;
                      autoFillRoomStudents(currentRoom.id, target);
                    }}
                    className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer flex items-center gap-1"
                    title="Tự động sinh đủ học sinh thực tế cho phòng này"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Tự điền {currentRoom.studentCount || 24} HS thực tế vào phòng này</span>
                  </button>

                  {actualCount > 0 && actualCount !== currentRoom.studentCount && (
                    <button
                      type="button"
                      onClick={() => updateRoom(currentRoom.id, { studentCount: actualCount })}
                      className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
                    >
                      Đồng bộ sĩ số bằng {actualCount} HS thực tế
                    </button>
                  )}
                </div>
              </div>
            );
          })()
        ) : (
          <div className="mt-4 p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-700">Tự điền sĩ số hàng loạt:</span>
              <input
                type="number"
                min="1"
                placeholder="24"
                value={quickBatchCount}
                onChange={(e) => setQuickBatchCount(e.target.value)}
                className="w-16 px-2 py-1 bg-white border border-slate-300 rounded-md font-bold text-center text-slate-900 focus:ring-2 focus:ring-sky-500"
              />
              <span className="text-slate-500">HS/phòng</span>
              <button
                type="button"
                onClick={() => {
                  const val = Number(quickBatchCount);
                  if (isNaN(val) || val <= 0) {
                    alert('Vui lòng nhập sĩ số hợp lệ (> 0)!');
                    return;
                  }
                  autoFillAllRoomsStudents(val);
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-md shadow-2xs transition-colors cursor-pointer flex items-center gap-1"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Tự điền {quickBatchCount} HS thực tế cho tất cả {data.rooms.length} phòng</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const val = Number(quickBatchCount);
                  if (isNaN(val) || val <= 0) {
                    alert('Vui lòng nhập sĩ số hợp lệ (> 0)!');
                    return;
                  }
                  setBatchStudentCount(val, 'all');
                }}
                className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-md transition-colors cursor-pointer"
              >
                Chỉ đổi chỉ tiêu số
              </button>
            </div>

            {data.students.length > 0 && (
              <button
                type="button"
                onClick={syncStudentCountsWithActualList}
                className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                Tự động đồng bộ theo danh sách HS thực tế
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 overflow-hidden">
        
        {/* Header Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-sky-50 text-sky-700 border border-sky-100">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Danh sách học sinh dự thi</h2>
              <p className="text-xs text-slate-500">
                Quản lý số báo danh, lớp học và mã phách được ghép cho từng thí sinh
              </p>
            </div>
          </div>

          {/* Search + Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Tìm tên, SBD, lớp..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 w-44 focus:w-56 focus:outline-hidden focus:ring-1 focus:ring-sky-500 transition-all"
              />
            </div>

            <button
              onClick={() => {
                if (data.rooms.length === 0) {
                  alert('Vui lòng tạo phòng thi trước khi thêm học sinh!');
                  return;
                }
                setNewStudentForm({
                  roomId: selectedRoomId !== 'all' ? selectedRoomId : data.rooms[0]?.id || '',
                  studentCode: '',
                  fullName: '',
                  className: `${data.examInfo.grade || '10'}A1`,
                });
                setShowAddModal(true);
              }}
              className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Thêm học sinh
            </button>

            {/* Input file ẩn */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".xlsx,.xls,.csv"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              Nhập Excel/CSV
            </button>

            <button
              onClick={downloadSampleStudentTemplateExcel}
              title="Tải file Excel mẫu để điền danh sách"
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg border border-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              File mẫu
            </button>
          </div>
        </div>

        {/* Bảng danh sách học sinh */}
        {filteredStudents.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-600">Chưa có học sinh nào trong phòng được chọn.</p>
            <p className="text-xs text-slate-400 mt-1">
              Bạn có thể bấm "Thêm học sinh", nhập từ file Excel hoặc tạo mã phách trực tiếp theo số lượng phòng.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 w-14 text-center">STT</th>
                  <th className="py-3 px-4">Số báo danh</th>
                  <th className="py-3 px-4">Họ và tên thí sinh</th>
                  <th className="py-3 px-4">Lớp</th>
                  <th className="py-3 px-4">Phòng thi</th>
                  <th className="py-3 px-4">Mã phách</th>
                  <th className="py-3 px-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((student, idx) => {
                  const room = roomMap.get(student.roomId);

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 text-center font-medium text-slate-400 tabular-nums">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-sky-800">
                        {student.studentCode}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {student.fullName}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        <span className="inline-block px-2 py-0.5 text-xs bg-slate-100 rounded-md font-medium">
                          {student.className}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">
                        {room ? room.roomName : 'Phòng không xác định'}
                      </td>
                      <td className="py-3 px-4">
                        {student.examCode ? (
                          <span className="inline-block px-2.5 py-0.5 text-xs font-mono font-bold bg-amber-50 text-amber-800 border border-amber-300 rounded-md">
                            {student.examCode}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Chưa ghép mã</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setEditingStudent({ ...student })}
                            title="Sửa học sinh"
                            className="p-1 text-slate-600 hover:text-sky-600 rounded-md hover:bg-slate-100"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Xóa học sinh ${student.fullName}?`)) {
                                deleteStudent(student.id);
                              }
                            }}
                            title="Xóa học sinh"
                            className="p-1 text-rose-500 hover:text-rose-700 rounded-md hover:bg-rose-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* MODAL THÊM HỌC SINH */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-slate-900 pb-3 border-b border-slate-100">
              Thêm học sinh dự thi
            </h3>
            <form onSubmit={handleSaveNewStudent} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Chọn phòng thi <span className="text-rose-500">*</span>
                </label>
                <select
                  value={newStudentForm.roomId}
                  onChange={(e) => setNewStudentForm({ ...newStudentForm, roomId: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-semibold"
                >
                  {data.rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.roomName} ({r.studentCount !== null ? `${r.studentCount} HS` : 'Chưa có sĩ số'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Số báo danh (SBD)
                </label>
                <input
                  type="text"
                  placeholder="Tự động nếu để trống"
                  value={newStudentForm.studentCode}
                  onChange={(e) => setNewStudentForm({ ...newStudentForm, studentCode: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Họ và tên thí sinh <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Nguyễn Văn An"
                  value={newStudentForm.fullName}
                  onChange={(e) => setNewStudentForm({ ...newStudentForm, fullName: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lớp
                </label>
                <input
                  type="text"
                  placeholder="10A1"
                  value={newStudentForm.className}
                  onChange={(e) => setNewStudentForm({ ...newStudentForm, className: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm rounded-lg"
                >
                  Thêm học sinh
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SỬA HỌC SINH */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-slate-900 pb-3 border-b border-slate-100">
              Sửa thông tin học sinh
            </h3>
            <form onSubmit={handleSaveEditStudent} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phòng thi
                </label>
                <select
                  value={editingStudent.roomId}
                  onChange={(e) => setEditingStudent({ ...editingStudent, roomId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-semibold"
                >
                  {data.rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.roomName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Số báo danh (SBD)
                </label>
                <input
                  type="text"
                  value={editingStudent.studentCode}
                  onChange={(e) => setEditingStudent({ ...editingStudent, studentCode: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Họ và tên thí sinh
                </label>
                <input
                  type="text"
                  value={editingStudent.fullName}
                  onChange={(e) => setEditingStudent({ ...editingStudent, fullName: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lớp
                </label>
                <input
                  type="text"
                  value={editingStudent.className}
                  onChange={(e) => setEditingStudent({ ...editingStudent, className: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
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
