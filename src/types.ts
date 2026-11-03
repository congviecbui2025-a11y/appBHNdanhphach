/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ExamInfo {
  schoolName: string;
  teacherInCharge: string;
  academicYear: string;
  examPeriod: string;
  subject: string;
  grade: string;
  examDate: string;
  notes: string;
}

export interface Room {
  id: string;
  roomNumber: number;
  roomName: string;
  studentCount: number | null; // null represents "Chưa nhập"
  codePrefix: string;
  codeStartNumber: number;
  assignedTeacherId: string | null;
}

export interface Teacher {
  id: string;
  fullName: string;
  phone?: string;
  notes?: string;
}

export interface Student {
  id: string;
  roomId: string;
  stt: number;
  studentCode: string; // Số báo danh
  fullName: string;
  className: string;
  examCode: string | null; // Mã phách được ghép
}

export interface RoomCodePreview {
  roomId: string;
  roomNumber: number;
  roomName: string;
  codeRange: string;
  generatedCodes: string[];
}

export type ShuffleMode = 'random' | 'sequential';

export interface ExamData {
  examInfo: ExamInfo;
  rooms: Room[];
  teachers: Teacher[];
  students: Student[];
  shuffleMode: ShuffleMode;
  lastGeneratedAt: string | null;
}
