/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { ExamData, ExamInfo, Room, Student, Teacher, ShuffleMode } from '../types';
import {
  getAlphabetPrefix,
  getInitialEmptyData,
  getSampleExamData,
  shuffleArray,
  validateExamData,
  ValidationResult,
  generateRoomCodes,
  generateStudentName,
} from '../utils/examUtils';

const STORAGE_KEY = 'he_thong_danh_phach_data_v1';

interface ExamContextType {
  data: ExamData;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  updateExamInfo: (info: Partial<ExamInfo>) => void;
  setRoomCount: (count: number) => void;
  addRoom: (roomData?: Partial<Room>) => void;
  updateRoom: (id: string, updates: Partial<Room>) => void;
  deleteRoom: (id: string) => void;
  addTeacher: (teacherData: { fullName: string; phone?: string; notes?: string }) => void;
  updateTeacher: (id: string, updates: Partial<Teacher>) => void;
  deleteTeacher: (id: string) => void;
  assignRoomsToTeacher: (teacherId: string, roomIds: string[]) => void;
  assignRangeToTeacher: (teacherId: string, fromRoomNum: number, toRoomNum: number) => void;
  assignRangeToTeacherByName: (teacherName: string, fromRoomNum: number, toRoomNum: number) => void;
  removeSampleTeachers: () => void;
  setBatchStudentCount: (count: number, scope?: 'all' | 'unentered') => void;
  syncStudentCountsWithActualList: () => void;
  autoFillRoomStudents: (roomId: string, targetCount?: number) => void;
  autoFillAllRoomsStudents: (defaultPerRoom?: number) => void;
  addStudent: (student: Omit<Student, 'id'>) => void;
  updateStudent: (id: string, updates: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  importStudents: (newStudents: Omit<Student, 'id'>[], replaceRoomId?: string) => void;
  generateExamCodes: (mode?: ShuffleMode) => { count: number; unassignedCount: number };
  clearAllData: () => void;
  loadSampleData: () => void;
  backupDataToJson: () => void;
  restoreDataFromJson: (jsonStr: string) => { success: boolean; message: string };
  validation: ValidationResult;
  totalRooms: number;
  totalStudents: number;
  totalTeachers: number;
  totalCodesGenerated: number;
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const ExamContext = createContext<ExamContextType | null>(null);

export const ExamProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<ExamData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.examInfo) {
          // Bỏ Giáo viên A và Giáo viên B nếu đang có trong dữ liệu lưu cũ
          const sampleNames = ['giáo viên a', 'giáo viên b', 'giao vien a', 'giao vien b'];
          if (Array.isArray(parsed.teachers)) {
            const sampleIds = parsed.teachers
              .filter((t: any) => sampleNames.includes((t.fullName || '').toLowerCase().trim()))
              .map((t: any) => t.id);

            if (sampleIds.length > 0) {
              parsed.teachers = parsed.teachers.filter((t: any) => !sampleIds.includes(t.id));
              if (Array.isArray(parsed.rooms)) {
                parsed.rooms = parsed.rooms.map((r: any) =>
                  r.assignedTeacherId && sampleIds.includes(r.assignedTeacherId)
                    ? { ...r, assignedTeacherId: null }
                    : r
                );
              }
            }
          }

          // Chuyển đổi tiền tố các phòng từ phòng 27 trở đi sang chữ in HOA: A, B, C...
          if (Array.isArray(parsed.rooms)) {
            const oldPrefixes = ['aa', 'ab', 'ac', 'ad', 'ae', 'af', 'ag', 'ah', 'ai', 'aj', 'ak', 'al', 'am', 'an', 'ao', 'ap', 'aq', 'ar', 'as', 'at', 'au', 'av', 'aw', 'ax', 'ay', 'az'];
            parsed.rooms = parsed.rooms.map((r: any) => {
              if (r.roomNumber >= 27 && oldPrefixes.includes(r.codePrefix)) {
                return { ...r, codePrefix: getAlphabetPrefix(r.roomNumber - 1) };
              }
              return r;
            });
          }

          // Cập nhật tên trường thành THPT Bùi Hữu Nghĩa
          if (parsed.examInfo && (!parsed.examInfo.schoolName || parsed.examInfo.schoolName === 'THPT Trần Phú')) {
            parsed.examInfo.schoolName = 'THPT Bùi Hữu Nghĩa';
          }

          return parsed;
        }
      }
    } catch (e) {
      console.error('Lỗi khi đọc localStorage:', e);
    }
    // Mặc định khởi đầu với dữ liệu trống (theo câu trả lời của user)
    return getInitialEmptyData();
  });

  const [activeTab, setActiveTab] = useState<string>('overview');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  // Tự động lưu vào localStorage mỗi khi data thay đổi
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Lỗi khi lưu localStorage:', e);
    }
  }, [data]);

  // Cập nhật thông tin kỳ kiểm tra / thông tin đơn vị
  const updateExamInfo = (info: Partial<ExamInfo>) => {
    setData((prev) => ({
      ...prev,
      examInfo: { ...prev.examInfo, ...info },
    }));
    showToast('Đã lưu thông tin kỳ kiểm tra!');
  };

  // Tạo hoặc cập nhật số phòng hàng loạt (tăng / giảm số phòng)
  const setRoomCount = (targetCount: number) => {
    if (targetCount < 1) targetCount = 1;
    if (targetCount > 100) targetCount = 100;

    setData((prev) => {
      const currentRooms = [...prev.rooms];
      const currentLength = currentRooms.length;

      if (targetCount > currentLength) {
        // Thêm phòng mới
        for (let i = currentLength; i < targetCount; i++) {
          const roomNum = i + 1;
          currentRooms.push({
            id: `room_${Date.now()}_${i}`,
            roomNumber: roomNum,
            roomName: `Phòng ${roomNum}`,
            studentCount: null, // "Chưa nhập"
            codePrefix: getAlphabetPrefix(i),
            codeStartNumber: 1,
            assignedTeacherId: null,
          });
        }
      } else if (targetCount < currentLength) {
        // Cắt bớt các phòng cuối (chỉ giữ targetCount phòng)
        currentRooms.splice(targetCount);
      }

      return {
        ...prev,
        rooms: currentRooms,
      };
    });
    showToast(`Đã cập nhật danh sách gồm ${targetCount} phòng thi!`);
  };

  // Thêm một phòng thi riêng lẻ
  const addRoom = (roomData?: Partial<Room>) => {
    setData((prev) => {
      const nextNum = prev.rooms.length > 0 ? Math.max(...prev.rooms.map((r) => r.roomNumber)) + 1 : 1;
      const newRoom: Room = {
        id: `room_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        roomNumber: nextNum,
        roomName: `Phòng ${nextNum}`,
        studentCount: null,
        codePrefix: getAlphabetPrefix(prev.rooms.length),
        codeStartNumber: 1,
        assignedTeacherId: null,
        ...roomData,
      };
      return {
        ...prev,
        rooms: [...prev.rooms, newRoom],
      };
    });
    showToast('Đã thêm phòng thi mới!');
  };

  // Chỉnh sửa phòng thi (không làm đổi mã của các phòng khác)
  const updateRoom = (id: string, updates: Partial<Room>) => {
    setData((prev) => ({
      ...prev,
      rooms: prev.rooms.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    }));
    showToast('Đã cập nhật phòng thi!');
  };

  // Xóa một phòng thi
  const deleteRoom = (id: string) => {
    setData((prev) => {
      const updatedRooms = prev.rooms.filter((r) => r.id !== id);
      const updatedStudents = prev.students.filter((s) => s.roomId !== id);
      return {
        ...prev,
        rooms: updatedRooms,
        students: updatedStudents,
      };
    });
    showToast('Đã xóa phòng thi!');
  };

  // Quản lý Giáo viên
  const addTeacher = (teacherData: { fullName: string; phone?: string; notes?: string }) => {
    const newTeacher: Teacher = {
      id: `teacher_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      fullName: teacherData.fullName.trim(),
      phone: teacherData.phone?.trim() || '',
      notes: teacherData.notes?.trim() || '',
    };
    setData((prev) => ({
      ...prev,
      teachers: [...prev.teachers, newTeacher],
    }));
    showToast(`Đã thêm giáo viên: ${newTeacher.fullName}`);
  };

  const updateTeacher = (id: string, updates: Partial<Teacher>) => {
    setData((prev) => ({
      ...prev,
      teachers: prev.teachers.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }));
    showToast('Đã cập nhật thông tin giáo viên!');
  };

  const deleteTeacher = (id: string) => {
    setData((prev) => {
      // Bỏ gán giáo viên này khỏi các phòng đã phân công
      const updatedRooms = prev.rooms.map((r) =>
        r.assignedTeacherId === id ? { ...r, assignedTeacherId: null } : r
      );
      return {
        ...prev,
        teachers: prev.teachers.filter((t) => t.id !== id),
        rooms: updatedRooms,
      };
    });
    showToast('Đã xóa giáo viên và cập nhật phân công phòng!');
  };

  // Phân công danh sách phòng cho giáo viên
  const assignRoomsToTeacher = (teacherId: string, roomIds: string[]) => {
    setData((prev) => {
      const updatedRooms = prev.rooms.map((r) => {
        if (roomIds.includes(r.id)) {
          return { ...r, assignedTeacherId: teacherId };
        } else if (r.assignedTeacherId === teacherId) {
          // Bỏ gán nếu không còn trong danh sách
          return { ...r, assignedTeacherId: null };
        }
        return r;
      });
      return {
        ...prev,
        rooms: updatedRooms,
      };
    });
    showToast('Đã lưu phân công giáo viên!');
  };

  // Phân công theo dải phòng (Ví dụ: từ phòng 1 đến phòng 8)
  const assignRangeToTeacher = (teacherId: string, fromRoomNum: number, toRoomNum: number) => {
    setData((prev) => {
      const min = Math.min(fromRoomNum, toRoomNum);
      const max = Math.max(fromRoomNum, toRoomNum);
      const updatedRooms = prev.rooms.map((r) => {
        if (r.roomNumber >= min && r.roomNumber <= max) {
          return { ...r, assignedTeacherId: teacherId };
        }
        return r;
      });
      return {
        ...prev,
        rooms: updatedRooms,
      };
    });
    showToast(`Đã phân công từ Phòng ${fromRoomNum} đến Phòng ${toRoomNum}!`);
  };

  // Phân công theo dải phòng bằng cách tự nhập trực tiếp tên giáo viên (tự động tạo giáo viên mới nếu chưa có)
  const assignRangeToTeacherByName = (teacherName: string, fromRoomNum: number, toRoomNum: number) => {
    const trimmed = teacherName.trim();
    if (!trimmed) {
      alert('Vui lòng nhập họ và tên giáo viên phụ trách!');
      return;
    }

    setData((prev) => {
      let targetTeacher = prev.teachers.find(
        (t) => t.fullName.toLowerCase() === trimmed.toLowerCase()
      );
      let updatedTeachers = [...prev.teachers];
      if (!targetTeacher) {
        targetTeacher = {
          id: `teacher_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          fullName: trimmed,
          phone: '',
          notes: `Phụ trách Phòng ${fromRoomNum} đến Phòng ${toRoomNum}`,
        };
        updatedTeachers.push(targetTeacher);
      }

      const min = Math.min(fromRoomNum, toRoomNum);
      const max = Math.max(fromRoomNum, toRoomNum);
      const updatedRooms = prev.rooms.map((r) => {
        if (r.roomNumber >= min && r.roomNumber <= max) {
          return { ...r, assignedTeacherId: targetTeacher!.id };
        }
        return r;
      });

      return {
        ...prev,
        teachers: updatedTeachers,
        rooms: updatedRooms,
      };
    });
    showToast(`Đã phân công ${trimmed} phụ trách từ Phòng ${fromRoomNum} đến Phòng ${toRoomNum}!`);
  };

  // Bỏ Giáo viên A và Giáo viên B nếu đang có trong danh sách
  const removeSampleTeachers = () => {
    setData((prev) => {
      const sampleNames = ['giáo viên a', 'giáo viên b', 'giao vien a', 'giao vien b'];
      const sampleTeachers = prev.teachers.filter((t) => sampleNames.includes(t.fullName.toLowerCase().trim()));
      const sampleIds = sampleTeachers.map((t) => t.id);

      if (sampleIds.length === 0) {
        return prev;
      }

      const updatedRooms = prev.rooms.map((r) =>
        r.assignedTeacherId && sampleIds.includes(r.assignedTeacherId) ? { ...r, assignedTeacherId: null } : r
      );

      return {
        ...prev,
        teachers: prev.teachers.filter((t) => !sampleIds.includes(t.id)),
        rooms: updatedRooms,
      };
    });
    showToast('Đã xóa bỏ Giáo viên A và Giáo viên B. Hãy tự nhập tên giáo viên mới!');
  };

  // Gán sĩ số nhanh hàng loạt cho các phòng
  const setBatchStudentCount = (count: number, scope: 'all' | 'unentered' = 'all') => {
    const validCount = Math.max(0, count);
    setData((prev) => {
      const updatedRooms = prev.rooms.map((r) => {
        if (scope === 'all' || r.studentCount === null || r.studentCount === undefined || r.studentCount === 0) {
          return { ...r, studentCount: validCount };
        }
        return r;
      });
      return {
        ...prev,
        rooms: updatedRooms,
      };
    });
    showToast(`Đã gán sĩ số ${validCount} học sinh cho ${scope === 'all' ? 'tất cả' : 'các'} phòng!`);
  };

  // Tự động đồng bộ sĩ số phòng theo số lượng học sinh thực tế trong danh sách
  const syncStudentCountsWithActualList = () => {
    setData((prev) => {
      let syncedCount = 0;
      const updatedRooms = prev.rooms.map((room) => {
        const actualCount = prev.students.filter((s) => s.roomId === room.id).length;
        if (actualCount > 0) {
          syncedCount++;
          return { ...room, studentCount: actualCount };
        }
        return room;
      });
      return {
        ...prev,
        rooms: updatedRooms,
      };
    });
    showToast('Đã tự động đồng bộ sĩ số phòng theo danh sách học sinh thực tế!');
  };

  // Tự động điền/cập nhật danh sách học sinh thực tế cho một phòng cụ thể để khớp đúng sĩ số
  const autoFillRoomStudents = (roomId: string, targetCount?: number) => {
    setData((prev) => {
      const room = prev.rooms.find((r) => r.id === roomId);
      if (!room) return prev;

      const count =
        targetCount !== undefined && targetCount !== null
          ? Math.max(0, targetCount)
          : room.studentCount !== null && room.studentCount > 0
          ? room.studentCount
          : 24;

      const existingInRoom = prev.students.filter((s) => s.roomId === roomId);
      let updatedRoomStudents: Student[] = [];

      if (count === 0) {
        updatedRoomStudents = [];
      } else if (existingInRoom.length >= count) {
        // Giữ lại số lượng tương ứng
        updatedRoomStudents = existingInRoom.slice(0, count).map((s, idx) => ({
          ...s,
          stt: idx + 1,
        }));
      } else {
        // Giữ các học sinh hiện tại và sinh thêm cho đủ sĩ số
        updatedRoomStudents = [...existingInRoom];
        const needed = count - existingInRoom.length;
        const grade = prev.examInfo.grade || '10';
        const startStt = existingInRoom.length;

        for (let i = 0; i < needed; i++) {
          const stt = startStt + i + 1;
          const sbd = `${grade}${String(room.roomNumber).padStart(2, '0')}${String(stt).padStart(2, '0')}`;
          const seed = (room.roomNumber - 1) * 50 + stt;
          updatedRoomStudents.push({
            id: `std_auto_${room.id}_${Date.now()}_${i}`,
            roomId: room.id,
            stt,
            studentCode: sbd,
            fullName: generateStudentName(seed),
            className: `${grade}A${room.roomNumber}`,
            examCode: null,
          });
        }
      }

      // Cập nhật lại toàn bộ danh sách học sinh
      const otherStudents = prev.students.filter((s) => s.roomId !== roomId);
      const allStudents = [...otherStudents, ...updatedRoomStudents];

      // Cập nhật sĩ số phòng tương ứng
      const updatedRooms = prev.rooms.map((r) =>
        r.id === roomId ? { ...r, studentCount: count } : r
      );

      return {
        ...prev,
        rooms: updatedRooms,
        students: allStudents,
      };
    });
    showToast(`Đã tự động điền danh sách ${targetCount !== undefined ? targetCount : ''} học sinh thực tế cho phòng!`);
  };

  // Tự động điền danh sách học sinh theo sĩ số thực tế cho tất cả các phòng
  const autoFillAllRoomsStudents = (defaultPerRoom = 24) => {
    setData((prev) => {
      const grade = prev.examInfo.grade || '10';
      let allUpdatedStudents: Student[] = [];
      const updatedRooms = prev.rooms.map((room) => {
        const count = room.studentCount && room.studentCount > 0 ? room.studentCount : defaultPerRoom;
        const existingInRoom = prev.students.filter((s) => s.roomId === room.id);
        let roomStudents: Student[] = [];

        if (existingInRoom.length === count) {
          roomStudents = existingInRoom;
        } else if (existingInRoom.length > count) {
          roomStudents = existingInRoom.slice(0, count).map((s, idx) => ({ ...s, stt: idx + 1 }));
        } else {
          roomStudents = [...existingInRoom];
          const needed = count - existingInRoom.length;
          const startStt = existingInRoom.length;
          for (let i = 0; i < needed; i++) {
            const stt = startStt + i + 1;
            const sbd = `${grade}${String(room.roomNumber).padStart(2, '0')}${String(stt).padStart(2, '0')}`;
            const seed = (room.roomNumber - 1) * 50 + stt;
            roomStudents.push({
              id: `std_auto_${room.id}_${Date.now()}_${i}`,
              roomId: room.id,
              stt,
              studentCode: sbd,
              fullName: generateStudentName(seed),
              className: `${grade}A${room.roomNumber}`,
              examCode: null,
            });
          }
        }

        allUpdatedStudents = [...allUpdatedStudents, ...roomStudents];
        return { ...room, studentCount: count };
      });

      return {
        ...prev,
        rooms: updatedRooms,
        students: allUpdatedStudents,
      };
    });
    showToast('Đã tự động điền danh sách học sinh theo sĩ số thực tế cho tất cả các phòng!');
  };

  // Quản lý Học sinh
  const addStudent = (studentData: Omit<Student, 'id'>) => {
    const newStudent: Student = {
      id: `std_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      ...studentData,
    };
    setData((prev) => {
      // Tự động cập nhật sĩ số phòng nếu phòng chưa có sĩ số hoặc sĩ số nhỏ hơn số HS thực tế
      const roomStudentsCount = prev.students.filter((s) => s.roomId === studentData.roomId).length + 1;
      const updatedRooms = prev.rooms.map((r) => {
        if (r.id === studentData.roomId && (r.studentCount === null || r.studentCount < roomStudentsCount)) {
          return { ...r, studentCount: roomStudentsCount };
        }
        return r;
      });
      return {
        ...prev,
        rooms: updatedRooms,
        students: [...prev.students, newStudent],
      };
    });
    showToast(`Đã thêm học sinh: ${newStudent.fullName}`);
  };

  const updateStudent = (id: string, updates: Partial<Student>) => {
    setData((prev) => ({
      ...prev,
      students: prev.students.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    }));
    showToast('Đã cập nhật học sinh!');
  };

  const deleteStudent = (id: string) => {
    setData((prev) => ({
      ...prev,
      students: prev.students.filter((s) => s.id !== id),
    }));
    showToast('Đã xóa học sinh!');
  };

  // Nhập hàng loạt danh sách học sinh
  const importStudents = (newStudents: Omit<Student, 'id'>[], replaceRoomId?: string) => {
    setData((prev) => {
      let filtered = prev.students;
      if (replaceRoomId) {
        filtered = filtered.filter((s) => s.roomId !== replaceRoomId);
      }
      const prepared: Student[] = newStudents.map((s, idx) => ({
        id: `std_imp_${Date.now()}_${idx}`,
        ...s,
      }));
      const allStudents = [...filtered, ...prepared];

      // Tự động cập nhật sĩ số cho các phòng có học sinh được import
      const updatedRooms = prev.rooms.map((room) => {
        const countInRoom = allStudents.filter((s) => s.roomId === room.id).length;
        if (countInRoom > 0 && (room.studentCount === null || room.studentCount === 0)) {
          return { ...room, studentCount: countInRoom };
        }
        return room;
      });

      return {
        ...prev,
        rooms: updatedRooms,
        students: allStudents,
      };
    });
    showToast(`Đã nhập ${newStudents.length} học sinh thành công và tự cập nhật sĩ số phòng!`);
  };

  // Thuật toán sinh và ghép mã phách
  const generateExamCodes = (mode: ShuffleMode = data.shuffleMode || 'random') => {
    let totalGenerated = 0;
    let unassignedCount = 0;

    setData((prev) => {
      // Đảm bảo tiền tố các phòng từ phòng 27 trở đi chuyển tiếp từ x, y, z sang chữ in HOA: A, B, C...
      const oldPrefixes = ['aa', 'ab', 'ac', 'ad', 'ae', 'af', 'ag', 'ah', 'ai', 'aj', 'ak', 'al', 'am', 'an', 'ao', 'ap', 'aq', 'ar', 'as', 'at', 'au', 'av', 'aw', 'ax', 'ay', 'az'];
      const updatedRooms = prev.rooms.map((room) => {
        if (room.roomNumber >= 27 && oldPrefixes.includes(room.codePrefix)) {
          return { ...room, codePrefix: getAlphabetPrefix(room.roomNumber - 1) };
        }
        return room;
      });

      const updatedStudents = [...prev.students];

      updatedRooms.forEach((room) => {
        const roomStudents = updatedStudents
          .filter((s) => s.roomId === room.id)
          .sort((a, b) => a.stt - b.stt);

        // Sinh danh sách mã phách đầy đủ theo tiền tố và số bắt đầu
        let codes = generateRoomCodes(room);

        if (codes.length > 0) {
          totalGenerated += codes.length;

          // Xáo trộn ngẫu nhiên hoặc để tuần tự
          if (mode === 'random') {
            codes = shuffleArray(codes);
          }

          // Ghép vào danh sách học sinh nếu có
          roomStudents.forEach((student, index) => {
            const assignedCode = codes[index] || null;
            const targetStudent = updatedStudents.find((s) => s.id === student.id);
            if (targetStudent) {
              targetStudent.examCode = assignedCode;
            }
          });
        }

        if (!room.assignedTeacherId) {
          unassignedCount++;
        }
      });

      return {
        ...prev,
        rooms: updatedRooms,
        students: updatedStudents,
        shuffleMode: mode,
        lastGeneratedAt: new Date().toLocaleString('vi-VN'),
      };
    });

    showToast(`Đã sinh thành công ${totalGenerated} mã phách (${mode === 'random' ? 'Trộn ngẫu nhiên' : 'Tuần tự'})!`);
    return { count: totalGenerated, unassignedCount };
  };

  // Tải dữ liệu mẫu 16 phòng
  const loadSampleData = () => {
    const sample = getSampleExamData();
    setData(sample);
    showToast('Đã tải thành công dữ liệu mẫu minh họa 16 phòng thi!');
  };

  // Xóa trắng toàn bộ dữ liệu
  const clearAllData = () => {
    setData(getInitialEmptyData());
    showToast('Đã xóa dữ liệu kỳ kiểm tra!');
  };

  // Sao lưu JSON
  const backupDataToJson = () => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Sao_Luu_Danh_Phach_${data.examInfo.subject || 'Mon'}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Đã tải file sao lưu JSON về máy tính!');
  };

  // Khôi phục từ JSON
  const restoreDataFromJson = (jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (!parsed || !parsed.examInfo || !Array.isArray(parsed.rooms)) {
        return { success: false, message: 'Tệp JSON không đúng cấu trúc của Hệ thống Đánh phách!' };
      }
      setData(parsed);
      showToast('Khôi phục dữ liệu từ file JSON thành công!');
      return { success: true, message: 'Khôi phục thành công!' };
    } catch (e: any) {
      return { success: false, message: `Lỗi đọc file: ${e.message}` };
    }
  };

  // Các giá trị tính toán
  const validation = useMemo(() => {
    return validateExamData(data.rooms, data.teachers, data.students);
  }, [data.rooms, data.teachers, data.students]);

  const totalRooms = data.rooms.length;

  const totalStudents = useMemo(() => {
    // Nếu có danh sách học sinh thì lấy số HS trong danh sách, nếu không thì lấy tổng sĩ số phòng khai báo
    const studentCountInList = data.students.length;
    const studentCountInRooms = data.rooms.reduce((sum, r) => sum + (r.studentCount || 0), 0);
    return studentCountInList > 0 ? studentCountInList : studentCountInRooms;
  }, [data.rooms, data.students]);

  const totalTeachers = data.teachers.length;

  const totalCodesGenerated = useMemo(() => {
    // Đếm tổng số mã phách đã sinh
    return data.rooms.reduce((sum, r) => {
      if (r.studentCount && r.studentCount > 0) {
        return sum + r.studentCount;
      }
      return sum;
    }, 0);
  }, [data.rooms]);

  return (
    <ExamContext.Provider
      value={{
        data,
        activeTab,
        setActiveTab,
        updateExamInfo,
        setRoomCount,
        addRoom,
        updateRoom,
        deleteRoom,
        addTeacher,
        updateTeacher,
        deleteTeacher,
        assignRoomsToTeacher,
        assignRangeToTeacher,
        assignRangeToTeacherByName,
        removeSampleTeachers,
        setBatchStudentCount,
        syncStudentCountsWithActualList,
        autoFillRoomStudents,
        autoFillAllRoomsStudents,
        addStudent,
        updateStudent,
        deleteStudent,
        importStudents,
        generateExamCodes,
        clearAllData,
        loadSampleData,
        backupDataToJson,
        restoreDataFromJson,
        validation,
        totalRooms,
        totalStudents,
        totalTeachers,
        totalCodesGenerated,
        toastMessage,
        showToast,
      }}
    >
      {children}
    </ExamContext.Provider>
  );
};

export const useExam = () => {
  const context = useContext(ExamContext);
  if (!context) {
    throw new Error('useExam must be used within an ExamProvider');
  }
  return context;
};
