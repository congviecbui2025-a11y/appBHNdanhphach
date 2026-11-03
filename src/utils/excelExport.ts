/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as XLSX from 'xlsx';
import { ExamData, Room, Student, Teacher } from '../types';
import { generateRoomCodes, getCodeRange } from './examUtils';

/**
 * Chuẩn hóa tên file không dấu cho tương thích tuyệt đối
 */
function sanitizeFileName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^a-zA-Z0-9_\-]/g, '_')
    .replace(/_+/g, '_');
}

function getFilePrefix(data: ExamData): string {
  const p = sanitizeFileName(data.examInfo.examPeriod || 'Ky_KT');
  const s = sanitizeFileName(data.examInfo.subject || 'Mon');
  const g = sanitizeFileName(`Khoi_${data.examInfo.grade || '10'}`);
  return `${p}_${s}_${g}`;
}

/**
 * 1. Xuất file Excel: Bảng phân công giáo viên đánh phách
 */
export function exportTeacherAssignmentExcel(data: ExamData): void {
  const teacherRows: Record<string, any>[] = [];
  
  data.teachers.forEach((teacher, idx) => {
    const assignedRooms = data.rooms.filter((r) => r.assignedTeacherId === teacher.id);
    const roomNames = assignedRooms.map((r) => r.roomName).join(', ') || 'Chưa giao phòng';
    const totalStudents = assignedRooms.reduce((sum, r) => sum + (r.studentCount || 0), 0);
    const codeRanges = assignedRooms.map((r) => `${r.roomName}: ${getCodeRange(r)}`).join('; ') || 'Chưa có';

    teacherRows.push({
      'STT': idx + 1,
      'Họ và tên Giáo viên': teacher.fullName,
      'Số điện thoại': teacher.phone || '',
      'Số phòng được giao': assignedRooms.length,
      'Danh sách phòng': roomNames,
      'Tổng số học sinh': totalStudents,
      'Khoảng mã phách các phòng': codeRanges,
      'Ghi chú': teacher.notes || '',
    });
  });

  // Thêm dòng cho các phòng chưa được phân công nếu có
  const teacherIds = new Set(data.teachers.map((t) => t.id));
  const unassigned = data.rooms.filter((r) => !r.assignedTeacherId || !teacherIds.has(r.assignedTeacherId));
  if (unassigned.length > 0) {
    teacherRows.push({
      'STT': 'CẢNH BÁO',
      'Họ và tên Giáo viên': '[CHƯA PHÂN CÔNG GIÁO VIÊN]',
      'Số điện thoại': '-',
      'Số phòng được giao': unassigned.length,
      'Danh sách phòng': unassigned.map((r) => r.roomName).join(', '),
      'Tổng số học sinh': unassigned.reduce((sum, r) => sum + (r.studentCount || 0), 0),
      'Khoảng mã phách các phòng': unassigned.map((r) => `${r.roomName}: ${getCodeRange(r)}`).join('; '),
      'Ghi chú': 'Cần phân công giáo viên trước ngày thi',
    });
  }

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(teacherRows);

  // Chỉnh độ rộng cột
  ws['!cols'] = [
    { wch: 6 },
    { wch: 24 },
    { wch: 14 },
    { wch: 18 },
    { wch: 30 },
    { wch: 16 },
    { wch: 45 },
    { wch: 25 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'PhanCongGiaoVien');
  const fileName = `${getFilePrefix(data)}_Bang_Phan_Cong_Giao_Vien.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/**
 * 2. Xuất file Excel: Danh sách mã phách gửi người chấm (Đã ẩn danh hoàn toàn)
 */
export function exportExaminerAnonymizedExcel(data: ExamData): void {
  const rows: Record<string, any>[] = [];
  let globalStt = 1;

  data.rooms.forEach((room) => {
    const roomStudents = data.students.filter((s) => s.roomId === room.id);

    if (roomStudents.length > 0) {
      // Có danh sách học sinh
      roomStudents.forEach((student) => {
        rows.push({
          'STT Toàn kỳ': globalStt++,
          'Phòng thi': room.roomName,
          'Mã phách': student.examCode || '(Chưa tạo)',
          'Điểm chấm vòng 1': '',
          'Điểm chấm vòng 2': '',
          'Điểm thống nhất': '',
          'Chữ ký GK 1': '',
          'Chữ ký GK 2': '',
          'Ghi chú': '',
        });
      });
    } else if (room.studentCount && room.studentCount > 0) {
      // Chỉ có số lượng, chưa có danh sách tên
      const codes = generateRoomCodes(room);
      codes.forEach((code) => {
        rows.push({
          'STT Toàn kỳ': globalStt++,
          'Phòng thi': room.roomName,
          'Mã phách': code,
          'Điểm chấm vòng 1': '',
          'Điểm chấm vòng 2': '',
          'Điểm thống nhất': '',
          'Chữ ký GK 1': '',
          'Chữ ký GK 2': '',
          'Ghi chú': '',
        });
      });
    }
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);

  ws['!cols'] = [
    { wch: 12 },
    { wch: 14 },
    { wch: 16 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 14 },
    { wch: 14 },
    { wch: 20 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'GuiNguoiCham_AnDanh');
  const fileName = `${getFilePrefix(data)}_Danh_Sach_Ma_Phach_Gui_Nguoi_Cham.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/**
 * 3. Xuất file Excel: Bảng đối chiếu mã phách quản lý (Bảo mật - Có SBD, Tên, Mã phách, GV)
 */
export function exportManagementCrossReferenceExcel(data: ExamData): void {
  const teacherMap = new Map(data.teachers.map((t) => [t.id, t.fullName]));
  const rows: Record<string, any>[] = [];
  let globalStt = 1;

  data.rooms.forEach((room) => {
    const teacherName = room.assignedTeacherId ? teacherMap.get(room.assignedTeacherId) || 'Chưa rõ' : 'Chưa phân công';
    const roomStudents = data.students.filter((s) => s.roomId === room.id);

    if (roomStudents.length > 0) {
      roomStudents.forEach((student, rIdx) => {
        rows.push({
          'STT': globalStt++,
          'Phòng thi': room.roomName,
          'STT Phòng': rIdx + 1,
          'Số báo danh': student.studentCode,
          'Họ và tên': student.fullName,
          'Lớp': student.className,
          'Mã phách': student.examCode || '(Chưa tạo)',
          'Giáo viên làm phách': teacherName,
        });
      });
    } else if (room.studentCount && room.studentCount > 0) {
      const codes = generateRoomCodes(room);
      codes.forEach((code, cIdx) => {
        rows.push({
          'STT': globalStt++,
          'Phòng thi': room.roomName,
          'STT Phòng': cIdx + 1,
          'Số báo danh': '(Chưa nhập SBD)',
          'Họ và tên': '(Chưa nhập tên)',
          'Lớp': '',
          'Mã phách': code,
          'Giáo viên làm phách': teacherName,
        });
      });
    }
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);

  ws['!cols'] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 12 },
    { wch: 14 },
    { wch: 25 },
    { wch: 10 },
    { wch: 16 },
    { wch: 24 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'DoiChieu_BaoMat');
  const fileName = `${getFilePrefix(data)}_Bang_Doi_Chieu_Quan_Ly_Bao_Mat.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/**
 * Tải file Excel mẫu để giáo viên nhập danh sách học sinh
 */
export function downloadSampleStudentTemplateExcel(): void {
  const sampleRows = [
    {
      'STT': 1,
      'Số báo danh': '10001',
      'Họ và tên': 'Nguyễn Văn An',
      'Lớp': '10A1',
      'Phòng thi': 'Phòng 1',
    },
    {
      'STT': 2,
      'Số báo danh': '10002',
      'Họ và tên': 'Trần Thị Bích',
      'Lớp': '10A1',
      'Phòng thi': 'Phòng 1',
    },
    {
      'STT': 3,
      'Số báo danh': '10003',
      'Họ và tên': 'Lê Hoàng Cường',
      'Lớp': '10A2',
      'Phòng thi': 'Phòng 1',
    },
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(sampleRows);
  ws['!cols'] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 24 },
    { wch: 10 },
    { wch: 14 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'MauDanhSachHocSinh');
  XLSX.writeFile(wb, 'Mau_Danh_Sach_Hoc_Sinh_Thi.xlsx');
}

/**
 * Xuất dữ liệu ra file CSV chuẩn UTF-8
 */
export function exportToCsv(filename: string, rows: Record<string, any>[]): void {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const val = row[h] === null || row[h] === undefined ? '' : String(row[h]);
          return `"${val.replace(/"/g, '""')}"`;
        })
        .join(',')
    ),
  ].join('\r\n');

  // Thêm BOM \uFEFF để Excel mở tiếng Việt không bị lỗi font
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
