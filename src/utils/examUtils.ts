/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExamData, ExamInfo, Room, Student, Teacher } from '../types';

/**
 * Tạo tiền tố theo số thứ tự (0-indexed):
 * 0..25 -> a, b, c, ..., x, y, z (chữ thường)
 * 26..51 -> A, B, C, ..., X, Y, Z (chữ in HOA theo yêu cầu sau x, y, z)
 * 52 trở lên -> AA, AB, AC...
 */
export function getAlphabetPrefix(index: number): string {
  if (index < 0) return 'a';
  // 0..25 -> a, b, c, ..., x, y, z (26 chữ thường)
  if (index < 26) {
    return String.fromCharCode(97 + index);
  }
  // 26..51 -> A, B, C, ..., X, Y, Z (26 chữ in HOA)
  if (index < 52) {
    return String.fromCharCode(65 + (index - 26));
  }
  // 52 trở lên -> AA, AB, AC...
  let result = '';
  let temp = index - 52;
  while (temp >= 0) {
    result = String.fromCharCode(65 + (temp % 26)) + result;
    temp = Math.floor(temp / 26) - 1;
  }
  if (result.length < 2) {
    result = 'A' + result;
  }
  return result;
}

/**
 * Định dạng ngày theo thứ tự Việt Nam: ngày/tháng/năm (DD/MM/YYYY)
 */
export function formatDateVN(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const trimmed = dateStr.trim();
  const parts = trimmed.split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts;
    if (y.length === 4) {
      return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
    }
  }
  return trimmed;
}

/**
 * Tính khoảng mã phách theo công thức:
 * Tiền tố + số bắt đầu đến Tiền tố + (số bắt đầu + số lượng học sinh - 1)
 * Không thêm số 0 đằng trước.
 */
export function getCodeRange(room: Room): string {
  if (room.studentCount === null || room.studentCount === undefined) {
    return 'Chưa nhập';
  }
  if (room.studentCount <= 0) {
    return '0 học sinh';
  }
  const prefix = (room.codePrefix || '').trim();
  const start = Number(room.codeStartNumber) || 1;
  const end = start + Number(room.studentCount) - 1;
  return `${prefix}${start} – ${prefix}${end}`;
}

/**
 * Sinh danh sách mã phách đầy đủ cho một phòng
 */
export function generateRoomCodes(room: Room): string[] {
  if (!room.studentCount || room.studentCount <= 0) return [];
  const prefix = (room.codePrefix || '').trim();
  const start = Number(room.codeStartNumber) || 1;
  const count = Number(room.studentCount);
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    codes.push(`${prefix}${start + i}`);
  }
  return codes;
}

/**
 * Thuật toán xáo trộn ngẫu nhiên Fisher-Yates (độ bảo mật cao)
 */
export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Kiểm tra các xung đột và cảnh báo trong kỳ thi:
 * 1. Trùng tiền tố phòng
 * 2. Trùng mã phách giữa các phòng
 * 3. Phòng chưa có giáo viên phụ trách
 * 4. Lệch sĩ số giữa danh sách học sinh và phòng thi
 */
export interface ValidationResult {
  hasErrors: boolean;
  duplicatePrefixes: { prefix: string; roomNames: string[] }[];
  duplicateCodes: { code: string; roomNames: string[] }[];
  unassignedRooms: Room[];
  studentCountMismatches: { room: Room; declared: number; actual: number }[];
}

export function validateExamData(rooms: Room[], teachers: Teacher[], students: Student[]): ValidationResult {
  const duplicatePrefixes: { prefix: string; roomNames: string[] }[] = [];
  const prefixMap = new Map<string, string[]>();

  rooms.forEach((r) => {
    const p = (r.codePrefix || '').trim();
    if (!p) return;
    if (!prefixMap.has(p)) prefixMap.set(p, []);
    prefixMap.get(p)!.push(r.roomName);
  });

  prefixMap.forEach((roomNames, prefix) => {
    if (roomNames.length > 1) {
      duplicatePrefixes.push({ prefix, roomNames });
    }
  });

  // Kiểm tra trùng mã phách giữa các phòng (phân biệt chính xác chữ hoa và chữ thường)
  const codeToRooms = new Map<string, string[]>();
  rooms.forEach((r) => {
    if (r.studentCount && r.studentCount > 0) {
      const codes = generateRoomCodes(r);
      codes.forEach((c) => {
        const codeKey = c.trim();
        if (!codeToRooms.has(codeKey)) codeToRooms.set(codeKey, []);
        codeToRooms.get(codeKey)!.push(r.roomName);
      });
    }
  });

  const duplicateCodes: { code: string; roomNames: string[] }[] = [];
  codeToRooms.forEach((roomNames, code) => {
    // Chỉ tính nếu xuất hiện ở nhiều hơn 1 phòng
    const uniqueRooms = Array.from(new Set(roomNames));
    if (uniqueRooms.length > 1) {
      duplicateCodes.push({ code, roomNames: uniqueRooms });
    }
  });

  // Kiểm tra phòng chưa phân công
  const teacherIds = new Set(teachers.map((t) => t.id));
  const unassignedRooms = rooms.filter(
    (r) => !r.assignedTeacherId || !teacherIds.has(r.assignedTeacherId)
  );

  // Kiểm tra lệch sĩ số
  const studentCountMismatches: { room: Room; declared: number; actual: number }[] = [];
  rooms.forEach((r) => {
    if (r.studentCount !== null && r.studentCount > 0) {
      const actualCount = students.filter((s) => s.roomId === r.id).length;
      if (actualCount > 0 && actualCount !== r.studentCount) {
        studentCountMismatches.push({
          room: r,
          declared: r.studentCount,
          actual: actualCount,
        });
      }
    }
  });

  return {
    hasErrors: duplicatePrefixes.length > 0 || duplicateCodes.length > 0,
    duplicatePrefixes,
    duplicateCodes,
    unassignedRooms,
    studentCountMismatches,
  };
}

/**
 * Trạng thái rỗng ban đầu chuẩn
 */
export function getInitialEmptyData(): ExamData {
  return {
    examInfo: {
      schoolName: 'THPT Bùi Hữu Nghĩa',
      teacherInCharge: 'Giáo dục VN',
      academicYear: '2026 – 2027',
      examPeriod: 'Giữa học kỳ I',
      subject: 'Toán',
      grade: '10',
      examDate: '2026-11-15',
      notes: 'Kỳ kiểm tra định kỳ học kỳ I',
    },
    rooms: [],
    teachers: [],
    students: [],
    shuffleMode: 'random',
    lastGeneratedAt: null,
  };
}

/**
 * Danh sách họ tên học sinh mẫu Việt Nam chân thực
 */
const SAMPLE_NAMES = [
  'Nguyễn Văn An', 'Trần Thị Bích', 'Lê Hoàng Cường', 'Phạm Thu Dung', 'Hoàng Minh Đức',
  'Vũ Hải Yến', 'Đặng Quốc Hưng', 'Bùi Mai Khanh', 'Đỗ Thành Long', 'Ngô Ngọc Mai',
  'Dương Trọng Nam', 'Lý Phương Oanh', 'Hồ Quang Phúc', 'Mai Thúy Quỳnh', 'Võ Tuấn Sơn',
  'Trịnh Cẩm Tú', 'Lương Đức Thắng', 'Phan Thanh Uyên', 'Tạ Minh Vương', 'Cao Mỹ Duyên',
  'Đinh Văn Bình', 'Chu Kim Chi', 'Lâm Hữu Đạt', 'Quách Thảo Giang', 'Hà Quang Huy',
  'Nghiêm Thu Hà', 'Tô Quốc Khánh', 'Thái Kim Liên', 'Lưu Hồng Nhung', 'Đào Vĩnh Phát',
  'Phùng Bảo Trâm', 'Đoàn Nhật Quang', 'Tống Ngọc Linh', 'Châu Gia Bảo', 'Vương Thảo Nguyên',
  'Phó Minh Châu', 'Triệu Ánh Dương', 'La Trường Giang', 'Ân Bảo Ngọc', 'Tiêu Hữu Phước',
  'Biện Thùy Dương', 'Diệp Quốc Anh', 'Cù Minh Tuấn', 'Tôn Thất Minh', 'Khổng Thị Loan',
  'Bạch Gia Huy', 'Giáp Thu Trang', 'Trác Thế Bảo', 'Nông Hoài Nam', 'Mã Thanh Thảo',
  'Cáp Xuân Bách', 'Ôn Thúy Hằng', 'Uông Minh Quân', 'Việt Tuấn Anh'
];

/**
 * Sinh họ tên học sinh Việt Nam thực tế theo chỉ số hạt giống (seed)
 */
export function generateStudentName(seedIndex: number): string {
  if (seedIndex < SAMPLE_NAMES.length) {
    return SAMPLE_NAMES[seedIndex];
  }
  const lastNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý', 'Đinh', 'Đoàn', 'Trương'];
  const middleNames = ['Văn', 'Thị', 'Đức', 'Minh', 'Hải', 'Ngọc', 'Xuân', 'Thu', 'Thanh', 'Đình', 'Hữu', 'Tuấn', 'Thùy', 'Kim', 'Bảo', 'Quốc', 'Phương', 'Anh'];
  const firstNames = ['An', 'Bình', 'Cường', 'Dũng', 'Đạt', 'Giang', 'Hà', 'Hải', 'Hưng', 'Huy', 'Khánh', 'Linh', 'Long', 'Mai', 'Nam', 'Nghĩa', 'Phúc', 'Quân', 'Sơn', 'Trang', 'Tuấn', 'Tùng', 'Việt', 'Vy', 'Yến', 'Anh', 'Khoa', 'Tâm', 'Hương', 'Huyền', 'Thảo', 'Trí', 'Phát', 'Duyên'];

  const last = lastNames[seedIndex % lastNames.length];
  const mid = middleNames[(Math.floor(seedIndex / lastNames.length) * 3 + 2) % middleNames.length];
  const first = firstNames[(seedIndex * 7 + 5) % firstNames.length];
  return `${last} ${mid} ${first}`;
}

/**
 * Tạo dữ liệu mẫu 16 phòng minh họa chính xác theo yêu cầu đề bài
 */
export function getSampleExamData(): ExamData {
  const rooms: Room[] = [];
  for (let i = 1; i <= 16; i++) {
    const prefix = getAlphabetPrefix(i - 1);
    let count: number | null = null;
    if (i === 1) count = 30; // Phòng 1: 30 học sinh
    if (i === 2) count = 24; // Phòng 2: 24 học sinh

    rooms.push({
      id: `room_${i}`,
      roomNumber: i,
      roomName: `Phòng ${i}`,
      studentCount: count,
      codePrefix: prefix,
      codeStartNumber: 1,
      assignedTeacherId: null, // Để trống cho người dùng tự nhập tên giáo viên
    });
  }

  // Tạo danh sách học sinh mẫu cho Phòng 1 (30 HS) và Phòng 2 (24 HS)
  const students: Student[] = [];

  // Phòng 1: 30 học sinh (SBD 10001 - 10030)
  for (let i = 0; i < 30; i++) {
    students.push({
      id: `std_p1_${i + 1}`,
      roomId: 'room_1',
      stt: i + 1,
      studentCode: `10${String(i + 1).padStart(3, '0')}`,
      fullName: SAMPLE_NAMES[i] || `Học sinh 1.${i + 1}`,
      className: '10A1',
      examCode: `a${i + 1}`, // Đã ghép phách a1..a30
    });
  }

  // Phòng 2: 24 học sinh (SBD 10031 - 10054)
  for (let i = 0; i < 24; i++) {
    students.push({
      id: `std_p2_${i + 1}`,
      roomId: 'room_2',
      stt: i + 1,
      studentCode: `10${String(31 + i).padStart(3, '0')}`,
      fullName: SAMPLE_NAMES[30 + i] || `Học sinh 2.${i + 1}`,
      className: '10A2',
      examCode: `b${i + 1}`, // Đã ghép phách b1..b24
    });
  }

  return {
    examInfo: {
      schoolName: 'THPT Bùi Hữu Nghĩa',
      teacherInCharge: 'Giáo dục VN',
      academicYear: '2026 – 2027',
      examPeriod: 'Giữa học kỳ I',
      subject: 'Toán',
      grade: '10',
      examDate: '2026-11-15',
      notes: 'Dữ liệu minh họa 16 phòng thi theo yêu cầu phân công THPT Bùi Hữu Nghĩa.',
    },
    rooms,
    teachers: [], // Bỏ Giáo viên A và Giáo viên B, để trống cho người dùng tự nhập tên
    students,
    shuffleMode: 'random',
    lastGeneratedAt: '2026-11-01 22:30:00',
  };
}
