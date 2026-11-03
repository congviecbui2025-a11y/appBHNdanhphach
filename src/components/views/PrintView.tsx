/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useExam } from '../../context/ExamContext';
import { getCodeRange, generateRoomCodes, formatDateVN } from '../../utils/examUtils';
import {
  Printer,
  FileText,
  Users,
  ShieldAlert,
  EyeOff,
  Building,
  CheckCircle,
  FileDown,
} from 'lucide-react';
import { exportDocxDocument } from '../../utils/docxExport';

type PrintDocumentType =
  | 'rooms_range'
  | 'teacher_assignment'
  | 'students_with_codes'
  | 'cross_reference'
  | 'examiner_anonymous';

export const PrintView: React.FC = () => {
  const { data, showToast } = useExam();

  const [docType, setDocType] = useState<PrintDocumentType>('examiner_anonymous');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('all');
  const [isExportingDocx, setIsExportingDocx] = useState(false);

  const teacherMap = new Map(data.teachers.map((t) => [t.id, t.fullName]));

  // Lọc phòng theo giáo viên được chọn nếu có
  const filteredRooms = data.rooms.filter((r) => {
    if (selectedTeacherId === 'all') return true;
    return r.assignedTeacherId === selectedTeacherId;
  });

  const handleTriggerPrint = () => {
    window.print();
  };

  const handleExportDocx = async () => {
    try {
      setIsExportingDocx(true);
      await exportDocxDocument(docType, data, filteredRooms, selectedTeacherId);
      showToast('Đã xuất file Word (.docx) thành công!');
    } catch (err: any) {
      alert(`Lỗi khi tạo file DOCX: ${err.message}`);
    } finally {
      setIsExportingDocx(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Khung cấu hình in ấn (Ẩn hoàn toàn khi in) */}
      <div className="no-print bg-white rounded-xl shadow-xs border border-slate-200/80 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Printer className="w-6 h-6 text-sky-600" />
              In danh sách & Biểu mẫu A4
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Bản in được định dạng chuẩn khổ giấy A4, tự động tối ưu hóa lề trang và ẩn toàn bộ thanh menu.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
            <button
              onClick={handleExportDocx}
              disabled={isExportingDocx}
              className="px-5 py-2.5 bg-[#1b5e20] hover:bg-[#144818] text-white font-bold text-sm rounded-lg shadow-sm flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              title="Xuất nội dung biểu mẫu đang xem ra tệp Word (.docx)"
            >
              <FileDown className="w-5 h-5 text-emerald-200" />
              <span>{isExportingDocx ? 'Đang xuất...' : 'Xuất file DOCX'}</span>
            </button>

            <button
              onClick={handleTriggerPrint}
              className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm rounded-lg shadow-sm flex items-center gap-2 transition-all cursor-pointer"
            >
              <Printer className="w-5 h-5" />
              Bấm để In ngay (Print)
            </button>
          </div>
        </div>

        {/* Lựa chọn loại tài liệu */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mt-4">
          
          <button
            onClick={() => setDocType('examiner_anonymous')}
            className={`p-3 rounded-lg border text-left text-xs font-semibold transition-all cursor-pointer ${
              docType === 'examiner_anonymous'
                ? 'bg-teal-50 border-teal-500 text-teal-900 shadow-xs ring-1 ring-teal-500'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
            }`}
          >
            <div className="flex items-center gap-2 mb-1 text-teal-700">
              <EyeOff className="w-4 h-4" />
              <span>Gửi người chấm</span>
            </div>
            <p className="font-normal text-[11px] text-slate-500">Đã ẩn danh học sinh & GV</p>
          </button>

          <button
            onClick={() => setDocType('cross_reference')}
            className={`p-3 rounded-lg border text-left text-xs font-semibold transition-all cursor-pointer ${
              docType === 'cross_reference'
                ? 'bg-rose-50 border-rose-500 text-rose-900 shadow-xs ring-1 ring-rose-500'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
            }`}
          >
            <div className="flex items-center gap-2 mb-1 text-rose-700">
              <ShieldAlert className="w-4 h-4" />
              <span>Bảng đối chiếu quản lý</span>
            </div>
            <p className="font-normal text-[11px] text-slate-500">Tài liệu bảo mật cao</p>
          </button>

          <button
            onClick={() => setDocType('teacher_assignment')}
            className={`p-3 rounded-lg border text-left text-xs font-semibold transition-all cursor-pointer ${
              docType === 'teacher_assignment'
                ? 'bg-sky-50 border-sky-500 text-sky-900 shadow-xs ring-1 ring-sky-500'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
            }`}
          >
            <div className="flex items-center gap-2 mb-1 text-sky-700">
              <Users className="w-4 h-4" />
              <span>Phiếu phân công GV</span>
            </div>
            <p className="font-normal text-[11px] text-slate-500">Nhiệm vụ làm phách</p>
          </button>

          <button
            onClick={() => setDocType('rooms_range')}
            className={`p-3 rounded-lg border text-left text-xs font-semibold transition-all cursor-pointer ${
              docType === 'rooms_range'
                ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-xs ring-1 ring-amber-500'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
            }`}
          >
            <div className="flex items-center gap-2 mb-1 text-amber-700">
              <Building className="w-4 h-4" />
              <span>Phòng & khoảng mã</span>
            </div>
            <p className="font-normal text-[11px] text-slate-500">Danh mục tổng hợp</p>
          </button>

          <button
            onClick={() => setDocType('students_with_codes')}
            className={`p-3 rounded-lg border text-left text-xs font-semibold transition-all cursor-pointer ${
              docType === 'students_with_codes'
                ? 'bg-indigo-50 border-indigo-500 text-indigo-900 shadow-xs ring-1 ring-indigo-500'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
            }`}
          >
            <div className="flex items-center gap-2 mb-1 text-indigo-700">
              <FileText className="w-4 h-4" />
              <span>Học sinh & mã phách</span>
            </div>
            <p className="font-normal text-[11px] text-slate-500">Kiểm diện theo phòng</p>
          </button>
        </div>

        {/* Lựa chọn in theo giáo viên */}
        <div className="flex items-center gap-3 mt-4 pt-3 border-t border-slate-100 flex-wrap text-xs">
          <span className="font-semibold text-slate-700">Phạm vi in:</span>
          <select
            value={selectedTeacherId}
            onChange={(e) => setSelectedTeacherId(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-md font-medium text-slate-800"
          >
            <option value="all">Toàn bộ kỳ kiểm tra (Tất cả giáo viên)</option>
            {data.teachers.map((t) => (
              <option key={t.id} value={t.id}>
                Chỉ in cho: {t.fullName}
              </option>
            ))}
          </select>
          <span className="text-slate-400">
            (Đang hiển thị {filteredRooms.length} phòng thi tương ứng)
          </span>
        </div>
      </div>

      {/* KHU VỰC TRANG IN A4 TRỰC QUAN (Hiện trên màn hình và in ra giấy) */}
      <div className="bg-white rounded-xl shadow-md border border-slate-300 p-8 sm:p-12 max-w-4xl mx-auto text-slate-900 print:p-0 print:shadow-none print:border-none print:max-w-none">
        
        {/* Quốc hiệu & Tiêu đề trường */}
        <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4 mb-6">
          <div className="text-center sm:text-left">
            <p className="text-xs font-semibold uppercase text-slate-600">SỞ GD&ĐT THÀNH PHỐ CẦN THƠ</p>
            <p className="text-sm font-bold uppercase text-slate-900">{data.examInfo.schoolName || 'TRƯỜNG THPT BÙI HỮU NGHĨA'}</p>
            <p className="text-[11px] text-slate-500 italic">Hội đồng thi định kỳ</p>
          </div>

          <div className="text-center sm:text-right">
            <p className="text-xs font-bold uppercase text-slate-900">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
            <p className="text-xs font-semibold text-slate-700">Độc lập – Tự do – Hạnh phúc</p>
            <div className="w-32 h-0.5 bg-slate-400 mx-auto sm:ml-auto mt-1" />
          </div>
        </div>

        {/* Tiêu đề văn bản */}
        <div className="text-center mb-6">
          <h1 className="text-xl sm:text-2xl font-extrabold uppercase tracking-tight text-slate-950">
            {docType === 'examiner_anonymous' && 'DANH SÁCH BÀI THI KÈM MÃ PHÁCH GỬI NGƯỜI CHẤM'}
            {docType === 'cross_reference' && 'BẢNG ĐỐI CHIẾU MÃ PHÁCH VỚI THÔNG TIN HỌC SINH'}
            {docType === 'teacher_assignment' && 'PHIẾU PHÂN CÔNG GIÁO VIÊN ĐÁNH PHÁCH BÀI THI'}
            {docType === 'rooms_range' && 'DANH SÁCH PHÒNG THI VÀ KHOẢNG MÃ PHÁCH'}
            {docType === 'students_with_codes' && 'DANH SÁCH THÍ SINH DỰ THI VÀ MÃ PHÁCH'}
          </h1>

          {/* Nhãn cảnh báo bảo mật nếu là Bảng đối chiếu quản lý */}
          {docType === 'cross_reference' && (
            <div className="inline-block mt-2 px-4 py-1.5 bg-rose-100 border-2 border-rose-600 text-rose-800 text-xs sm:text-sm font-black uppercase tracking-wider rounded-md">
              ⚠️ TÀI LIỆU QUẢN LÝ – KHÔNG PHÁT CHO NGƯỜI CHẤM
            </div>
          )}

          <div className="flex justify-center items-center gap-4 text-xs sm:text-sm text-slate-700 mt-3 flex-wrap">
            <span>Kỳ kiểm tra: <strong>{data.examInfo.examPeriod}</strong></span>
            <span>·</span>
            <span>Môn: <strong>{data.examInfo.subject}</strong></span>
            <span>·</span>
            <span>Khối: <strong>{data.examInfo.grade}</strong></span>
            <span>·</span>
            <span>Năm học: <strong>{data.examInfo.academicYear}</strong></span>
            {data.examInfo.examDate && (
              <>
                <span>·</span>
                <span>Ngày kiểm tra: <strong>{formatDateVN(data.examInfo.examDate)}</strong></span>
              </>
            )}
          </div>
        </div>

        {/* NỘI DUNG THEO TỪNG LOẠI TÀI LIỆU */}

        {/* 1. Danh sách gửi người chấm (ĐÃ ẨN DANH) */}
        {docType === 'examiner_anonymous' && (
          <div className="space-y-4">
            <p className="text-xs italic text-slate-600">
              * Ghi chú cho cán bộ chấm thi: Danh sách bài thi đã được rọc phách ẩn danh. Vui lòng ghi điểm và ký tên vào các cột tương ứng.
            </p>
            <table className="w-full text-left text-xs border-collapse border border-slate-400">
              <thead>
                <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-400">
                  <th className="p-2 border border-slate-400 text-center w-10">STT</th>
                  <th className="p-2 border border-slate-400 text-center w-24">Phòng thi</th>
                  <th className="p-2 border border-slate-400 text-center w-28">Mã phách</th>
                  <th className="p-2 border border-slate-400 text-center w-20">Điểm V1</th>
                  <th className="p-2 border border-slate-400 text-center w-20">Điểm V2</th>
                  <th className="p-2 border border-slate-400 text-center w-24">Điểm thống nhất</th>
                  <th className="p-2 border border-slate-400 text-center w-28">Ký tên GK1</th>
                  <th className="p-2 border border-slate-400 text-center w-28">Ký tên GK2</th>
                  <th className="p-2 border border-slate-400">Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  let globalStt = 1;
                  return filteredRooms.map((room) => {
                    const roomStudents = data.students.filter((s) => s.roomId === room.id);
                    if (roomStudents.length > 0) {
                      return roomStudents.map((student) => (
                        <tr key={student.id} className="border-b border-slate-300">
                          <td className="p-2 border border-slate-300 text-center tabular-nums">{globalStt++}</td>
                          <td className="p-2 border border-slate-300 text-center font-medium">{room.roomName}</td>
                          <td className="p-2 border border-slate-300 text-center font-mono font-bold text-slate-900">
                            {student.examCode || '(Chưa có)'}
                          </td>
                          <td className="p-2 border border-slate-300"></td>
                          <td className="p-2 border border-slate-300"></td>
                          <td className="p-2 border border-slate-300"></td>
                          <td className="p-2 border border-slate-300"></td>
                          <td className="p-2 border border-slate-300"></td>
                          <td className="p-2 border border-slate-300"></td>
                        </tr>
                      ));
                    } else if (room.studentCount && room.studentCount > 0) {
                      const codes = generateRoomCodes(room);
                      return codes.map((c, i) => (
                        <tr key={i} className="border-b border-slate-300">
                          <td className="p-2 border border-slate-300 text-center tabular-nums">{globalStt++}</td>
                          <td className="p-2 border border-slate-300 text-center font-medium">{room.roomName}</td>
                          <td className="p-2 border border-slate-300 text-center font-mono font-bold text-slate-900">
                            {c}
                          </td>
                          <td className="p-2 border border-slate-300"></td>
                          <td className="p-2 border border-slate-300"></td>
                          <td className="p-2 border border-slate-300"></td>
                          <td className="p-2 border border-slate-300"></td>
                          <td className="p-2 border border-slate-300"></td>
                          <td className="p-2 border border-slate-300"></td>
                        </tr>
                      ));
                    }
                    return null;
                  });
                })()}
              </tbody>
            </table>
          </div>
        )}

        {/* 2. Bảng đối chiếu quản lý (BẢO MẬT) */}
        {docType === 'cross_reference' && (
          <div className="space-y-4">
            <table className="w-full text-left text-xs border-collapse border border-slate-400">
              <thead>
                <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-400">
                  <th className="p-2 border border-slate-400 text-center w-10">STT</th>
                  <th className="p-2 border border-slate-400 text-center w-20">Phòng thi</th>
                  <th className="p-2 border border-slate-400 text-center w-20">SBD</th>
                  <th className="p-2 border border-slate-400">Họ và tên thí sinh</th>
                  <th className="p-2 border border-slate-400 text-center w-16">Lớp</th>
                  <th className="p-2 border border-slate-400 text-center w-24">Mã phách</th>
                  <th className="p-2 border border-slate-400">Giáo viên làm phách</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  let globalStt = 1;
                  return filteredRooms.map((room) => {
                    const roomStudents = data.students.filter((s) => s.roomId === room.id);
                    const teacherName = room.assignedTeacherId ? teacherMap.get(room.assignedTeacherId) : 'Chưa phân công';

                    if (roomStudents.length > 0) {
                      return roomStudents.map((student) => (
                        <tr key={student.id} className="border-b border-slate-300">
                          <td className="p-2 border border-slate-300 text-center tabular-nums">{globalStt++}</td>
                          <td className="p-2 border border-slate-300 text-center font-medium">{room.roomName}</td>
                          <td className="p-2 border border-slate-300 text-center font-mono font-semibold">{student.studentCode}</td>
                          <td className="p-2 border border-slate-300 font-bold text-slate-900">{student.fullName}</td>
                          <td className="p-2 border border-slate-300 text-center">{student.className}</td>
                          <td className="p-2 border border-slate-300 text-center font-mono font-bold text-rose-700 bg-rose-50/50">
                            {student.examCode || '(Chưa ghép)'}
                          </td>
                          <td className="p-2 border border-slate-300">{teacherName}</td>
                        </tr>
                      ));
                    } else if (room.studentCount && room.studentCount > 0) {
                      const codes = generateRoomCodes(room);
                      return codes.map((c, i) => (
                        <tr key={i} className="border-b border-slate-300">
                          <td className="p-2 border border-slate-300 text-center tabular-nums">{globalStt++}</td>
                          <td className="p-2 border border-slate-300 text-center font-medium">{room.roomName}</td>
                          <td className="p-2 border border-slate-300 text-center font-mono text-slate-400">-</td>
                          <td className="p-2 border border-slate-300 italic text-slate-400">(Chưa nhập danh sách tên)</td>
                          <td className="p-2 border border-slate-300 text-center text-slate-400">-</td>
                          <td className="p-2 border border-slate-300 text-center font-mono font-bold text-rose-700 bg-rose-50/50">
                            {c}
                          </td>
                          <td className="p-2 border border-slate-300">{teacherName}</td>
                        </tr>
                      ));
                    }
                    return null;
                  });
                })()}
              </tbody>
            </table>
          </div>
        )}

        {/* 3. Phiếu phân công giáo viên */}
        {docType === 'teacher_assignment' && (
          <div className="space-y-4">
            <table className="w-full text-left text-xs border-collapse border border-slate-400">
              <thead>
                <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-400">
                  <th className="p-2 border border-slate-400 text-center w-10">STT</th>
                  <th className="p-2 border border-slate-400">Họ và tên giáo viên</th>
                  <th className="p-2 border border-slate-400">Số ĐT</th>
                  <th className="p-2 border border-slate-400 text-center w-20">Số phòng</th>
                  <th className="p-2 border border-slate-400">Danh sách phòng được giao</th>
                  <th className="p-2 border border-slate-400 text-center w-20">Tổng HS</th>
                  <th className="p-2 border border-slate-400">Khoảng mã phách</th>
                  <th className="p-2 border border-slate-400 text-center w-28">Ký nhận bài</th>
                </tr>
              </thead>
              <tbody>
                {data.teachers
                  .filter((t) => selectedTeacherId === 'all' || t.id === selectedTeacherId)
                  .map((teacher, idx) => {
                    const assignedRooms = data.rooms.filter((r) => r.assignedTeacherId === teacher.id);
                    const totalHs = assignedRooms.reduce((sum, r) => sum + (r.studentCount || 0), 0);
                    const roomRanges = assignedRooms.map((r) => `${r.roomName}: ${getCodeRange(r)}`).join('; ');

                    return (
                      <tr key={teacher.id} className="border-b border-slate-300">
                        <td className="p-2 border border-slate-300 text-center tabular-nums">{idx + 1}</td>
                        <td className="p-2 border border-slate-300 font-bold text-slate-900">{teacher.fullName}</td>
                        <td className="p-2 border border-slate-300 text-slate-600">{teacher.phone || '-'}</td>
                        <td className="p-2 border border-slate-300 text-center font-bold tabular-nums">{assignedRooms.length}</td>
                        <td className="p-2 border border-slate-300">{assignedRooms.map((r) => r.roomName).join(', ') || 'Chưa có'}</td>
                        <td className="p-2 border border-slate-300 text-center font-bold tabular-nums">{totalHs}</td>
                        <td className="p-2 border border-slate-300 font-mono text-[11px]">{roomRanges || 'Chưa có'}</td>
                        <td className="p-2 border border-slate-300"></td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. Danh sách phòng & khoảng mã phách */}
        {docType === 'rooms_range' && (
          <div className="space-y-4">
            <table className="w-full text-left text-xs border-collapse border border-slate-400">
              <thead>
                <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-400">
                  <th className="p-2 border border-slate-400 text-center w-12">Số phòng</th>
                  <th className="p-2 border border-slate-400">Tên phòng thi</th>
                  <th className="p-2 border border-slate-400 text-center w-24">Số lượng HS</th>
                  <th className="p-2 border border-slate-400 text-center w-20">Tiền tố</th>
                  <th className="p-2 border border-slate-400 text-center w-20">Số bắt đầu</th>
                  <th className="p-2 border border-slate-400">Khoảng mã phách</th>
                  <th className="p-2 border border-slate-400">Giáo viên phụ trách</th>
                </tr>
              </thead>
              <tbody>
                {filteredRooms.map((room) => {
                  const teacherName = room.assignedTeacherId ? teacherMap.get(room.assignedTeacherId) : 'Chưa phân công';

                  return (
                    <tr key={room.id} className="border-b border-slate-300">
                      <td className="p-2 border border-slate-300 text-center font-bold">{room.roomNumber}</td>
                      <td className="p-2 border border-slate-300 font-bold text-slate-900">{room.roomName}</td>
                      <td className="p-2 border border-slate-300 text-center font-semibold tabular-nums">
                        {room.studentCount !== null ? room.studentCount : 'Chưa nhập'}
                      </td>
                      <td className="p-2 border border-slate-300 text-center font-mono font-bold">{room.codePrefix}</td>
                      <td className="p-2 border border-slate-300 text-center font-mono">{room.codeStartNumber}</td>
                      <td className="p-2 border border-slate-300 font-mono font-bold text-sky-900 bg-sky-50/50">
                        {getCodeRange(room)}
                      </td>
                      <td className="p-2 border border-slate-300">{teacherName}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 5. Danh sách học sinh kèm mã phách */}
        {docType === 'students_with_codes' && (
          <div className="space-y-4">
            <table className="w-full text-left text-xs border-collapse border border-slate-400">
              <thead>
                <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-400">
                  <th className="p-2 border border-slate-400 text-center w-10">STT</th>
                  <th className="p-2 border border-slate-400 text-center w-20">Số báo danh</th>
                  <th className="p-2 border border-slate-400">Họ và tên thí sinh</th>
                  <th className="p-2 border border-slate-400 text-center w-16">Lớp</th>
                  <th className="p-2 border border-slate-400 text-center w-20">Phòng thi</th>
                  <th className="p-2 border border-slate-400 text-center w-24">Mã phách</th>
                  <th className="p-2 border border-slate-400 text-center w-24">Ký nộp bài</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  let globalStt = 1;
                  return filteredRooms.map((room) => {
                    const roomStudents = data.students.filter((s) => s.roomId === room.id);
                    return roomStudents.map((student) => (
                      <tr key={student.id} className="border-b border-slate-300">
                        <td className="p-2 border border-slate-300 text-center tabular-nums">{globalStt++}</td>
                        <td className="p-2 border border-slate-300 text-center font-mono font-semibold">{student.studentCode}</td>
                        <td className="p-2 border border-slate-300 font-bold text-slate-900">{student.fullName}</td>
                        <td className="p-2 border border-slate-300 text-center">{student.className}</td>
                        <td className="p-2 border border-slate-300 text-center font-medium">{room.roomName}</td>
                        <td className="p-2 border border-slate-300 text-center font-mono font-bold text-slate-900">
                          {student.examCode || '-'}
                        </td>
                        <td className="p-2 border border-slate-300"></td>
                      </tr>
                    ));
                  });
                })()}
              </tbody>
            </table>
          </div>
        )}

        {/* Khối chữ ký xác nhận chuẩn hành chính sư phạm */}
        <div className="mt-12 pt-6 border-t border-slate-200 grid grid-cols-3 gap-4 text-center text-xs print-break-inside-avoid">
          <div>
            <p className="font-bold uppercase text-slate-800">CÁN BỘ LÀM PHÁCH</p>
            <p className="text-[11px] text-slate-400 italic mb-16">(Ký và ghi rõ họ tên)</p>
          </div>

          <div>
            <p className="font-bold uppercase text-slate-800">THƯ KÝ HỘI ĐỒNG</p>
            <p className="text-[11px] text-slate-400 italic mb-16">(Ký và ghi rõ họ tên)</p>
          </div>

          <div>
            <p className="italic text-[11px] text-slate-500 mb-1">
              ......, ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}
            </p>
            <p className="font-bold uppercase text-slate-800">CHỦ TỊCH HỘI ĐỒNG THI</p>
            <p className="text-[11px] text-slate-400 italic mb-16">(Ký tên và đóng dấu)</p>
            <p className="font-bold text-slate-900">{data.examInfo.teacherInCharge || 'Giáo dục VN'}</p>
          </div>
        </div>

      </div>

    </div>
  );
};
