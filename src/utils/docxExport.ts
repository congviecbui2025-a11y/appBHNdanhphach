/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  AlignmentType,
  WidthType,
  BorderStyle,
  ShadingType,
  VerticalAlign,
} from 'docx';
import { ExamData, Room, Student } from '../types';
import { getCodeRange, generateRoomCodes, formatDateVN } from './examUtils';

type PrintDocumentType =
  | 'rooms_range'
  | 'teacher_assignment'
  | 'students_with_codes'
  | 'cross_reference'
  | 'examiner_anonymous';

const FONT_NAME = 'Times New Roman';

/**
 * Tạo viền chuẩn cho bảng trong file Word
 */
const tableBorders = {
  top: { style: BorderStyle.SINGLE, size: 4, color: '888888' },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: '888888' },
  left: { style: BorderStyle.SINGLE, size: 4, color: '888888' },
  right: { style: BorderStyle.SINGLE, size: 4, color: '888888' },
  insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: 'CCCCCC' },
  insideVertical: { style: BorderStyle.SINGLE, size: 2, color: 'CCCCCC' },
};

const noBorder = {
  top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
};

type AlignmentTypeValue = (typeof AlignmentType)[keyof typeof AlignmentType];

function createCell(
  text: string,
  options: {
    bold?: boolean;
    italic?: boolean;
    align?: AlignmentTypeValue;
    widthPercent?: number;
    isHeader?: boolean;
    color?: string;
  } = {}
): TableCell {
  return new TableCell({
    width: options.widthPercent ? { size: options.widthPercent, type: WidthType.PERCENTAGE } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    shading: options.isHeader
      ? { type: ShadingType.CLEAR, fill: 'E2E8F0' }
      : undefined,
    margins: {
      top: 100,
      bottom: 100,
      left: 120,
      right: 120,
    },
    children: [
      new Paragraph({
        alignment: options.align || AlignmentType.LEFT,
        children: [
          new TextRun({
            text,
            bold: options.bold || options.isHeader,
            italics: options.italic,
            font: FONT_NAME,
            size: options.isHeader ? 21 : 20, // 10.5pt hoặc 10pt
            color: options.color,
          }),
        ],
      }),
    ],
  });
}

export async function exportDocxDocument(
  docType: PrintDocumentType,
  data: ExamData,
  filteredRooms: Room[],
  selectedTeacherId: string = 'all'
): Promise<void> {
  const teacherMap = new Map(data.teachers.map((t) => [t.id, t.fullName]));
  const schoolUpper = (data.examInfo.schoolName || 'TRƯỜNG THPT BÙI HỮU NGHĨA').toUpperCase();

  // 1. Tiêu đề văn bản & tên file
  let title = '';
  let fileName = 'Bieu_Mau_Thi.docx';

  if (docType === 'examiner_anonymous') {
    title = 'DANH SÁCH BÀI THI KÈM MÃ PHÁCH GỬI NGƯỜI CHẤM';
    fileName = 'Danh_Sach_Gui_Nguoi_Cham.docx';
  } else if (docType === 'cross_reference') {
    title = 'BẢNG ĐỐI CHIẾU MÃ PHÁCH VỚI THÔNG TIN HỌC SINH';
    fileName = 'Bang_Doi_Chieu_Quan_Ly_Bao_Mat.docx';
  } else if (docType === 'teacher_assignment') {
    title = 'PHIẾU PHÂN CÔNG GIÁO VIÊN ĐÁNH PHÁCH BÀI THI';
    fileName = 'Phan_Cong_Giao_Vien_Lam_Phach.docx';
  } else if (docType === 'rooms_range') {
    title = 'DANH SÁCH PHÒNG THI VÀ KHOẢNG MÃ PHÁCH';
    fileName = 'Danh_Sach_Phong_Va_Khoang_Ma.docx';
  } else if (docType === 'students_with_codes') {
    title = 'DANH SÁCH THÍ SINH DỰ THI VÀ MÃ PHÁCH';
    fileName = 'Danh_Sach_Thi_Sinh_Va_Ma_Phach.docx';
  }

  // 2. Khối Quốc hiệu & Tiêu đề cơ quan (Bảng 2 cột không viền)
  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: noBorder.top,
      bottom: noBorder.bottom,
      left: noBorder.left,
      right: noBorder.right,
      insideHorizontal: noBorder.top,
      insideVertical: noBorder.top,
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 45, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'SỞ GD&ĐT THÀNH PHỐ CẦN THƠ',
                    font: FONT_NAME,
                    size: 20,
                    bold: true,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: schoolUpper,
                    font: FONT_NAME,
                    size: 21,
                    bold: true,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'Hội đồng thi định kỳ',
                    font: FONT_NAME,
                    size: 19,
                    italics: true,
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 55, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM',
                    font: FONT_NAME,
                    size: 21,
                    bold: true,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'Độc lập – Tự do – Hạnh phúc',
                    font: FONT_NAME,
                    size: 21,
                    bold: true,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: '-----------------------',
                    font: FONT_NAME,
                    size: 18,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  // 3. Khối tiêu đề
  const titleParagraphs: Paragraph[] = [
    new Paragraph({
      spacing: { before: 240, after: 120 },
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: title,
          font: FONT_NAME,
          size: 28, // 14pt
          bold: true,
        }),
      ],
    }),
  ];

  if (docType === 'cross_reference') {
    titleParagraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
        children: [
          new TextRun({
            text: '⚠️ TÀI LIỆU QUẢN LÝ BẢO MẬT – KHÔNG PHÁT CHO NGƯỜI CHẤM',
            font: FONT_NAME,
            size: 20,
            bold: true,
            color: 'C53030',
          }),
        ],
      })
    );
  }

  const sublineText = [
    `Kỳ kiểm tra: ${data.examInfo.examPeriod}`,
    `Môn: ${data.examInfo.subject}`,
    `Khối: ${data.examInfo.grade}`,
    `Năm học: ${data.examInfo.academicYear}`,
    data.examInfo.examDate ? `Ngày kiểm tra: ${formatDateVN(data.examInfo.examDate)}` : '',
  ]
    .filter(Boolean)
    .join('  ·  ');

  titleParagraphs.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: sublineText,
          font: FONT_NAME,
          size: 20,
          italics: true,
        }),
      ],
    })
  );

  // 4. Xây dựng Bảng dữ liệu theo docType
  let mainTable: Table;

  if (docType === 'examiner_anonymous') {
    const rows: TableRow[] = [
      new TableRow({
        tableHeader: true,
        children: [
          createCell('STT', { isHeader: true, align: AlignmentType.CENTER, widthPercent: 6 }),
          createCell('Phòng thi', { isHeader: true, align: AlignmentType.CENTER, widthPercent: 14 }),
          createCell('Mã phách', { isHeader: true, align: AlignmentType.CENTER, widthPercent: 14 }),
          createCell('Điểm V1', { isHeader: true, align: AlignmentType.CENTER, widthPercent: 10 }),
          createCell('Điểm V2', { isHeader: true, align: AlignmentType.CENTER, widthPercent: 10 }),
          createCell('Điểm thống nhất', { isHeader: true, align: AlignmentType.CENTER, widthPercent: 14 }),
          createCell('Ký tên GK1', { isHeader: true, align: AlignmentType.CENTER, widthPercent: 14 }),
          createCell('Ký tên GK2', { isHeader: true, align: AlignmentType.CENTER, widthPercent: 14 }),
          createCell('Ghi chú', { isHeader: true, widthPercent: 4 }),
        ],
      }),
    ];

    let globalStt = 1;
    filteredRooms.forEach((room) => {
      const roomStudents = data.students.filter((s) => s.roomId === room.id);
      if (roomStudents.length > 0) {
        roomStudents.forEach((student) => {
          rows.push(
            new TableRow({
              children: [
                createCell(String(globalStt++), { align: AlignmentType.CENTER }),
                createCell(room.roomName, { align: AlignmentType.CENTER }),
                createCell(student.examCode || '(Chưa có)', { align: AlignmentType.CENTER, bold: true }),
                createCell(''),
                createCell(''),
                createCell(''),
                createCell(''),
                createCell(''),
                createCell(''),
              ],
            })
          );
        });
      } else if (room.studentCount && room.studentCount > 0) {
        const codes = generateRoomCodes(room);
        codes.forEach((c) => {
          rows.push(
            new TableRow({
              children: [
                createCell(String(globalStt++), { align: AlignmentType.CENTER }),
                createCell(room.roomName, { align: AlignmentType.CENTER }),
                createCell(c, { align: AlignmentType.CENTER, bold: true }),
                createCell(''),
                createCell(''),
                createCell(''),
                createCell(''),
                createCell(''),
                createCell(''),
              ],
            })
          );
        });
      }
    });

    mainTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: tableBorders,
      rows,
    });
  } else if (docType === 'cross_reference') {
    const rows: TableRow[] = [
      new TableRow({
        tableHeader: true,
        children: [
          createCell('STT', { isHeader: true, align: AlignmentType.CENTER, widthPercent: 6 }),
          createCell('Phòng thi', { isHeader: true, align: AlignmentType.CENTER, widthPercent: 12 }),
          createCell('SBD', { isHeader: true, align: AlignmentType.CENTER, widthPercent: 10 }),
          createCell('Họ và tên thí sinh', { isHeader: true, widthPercent: 26 }),
          createCell('Lớp', { isHeader: true, align: AlignmentType.CENTER, widthPercent: 10 }),
          createCell('Mã phách', { isHeader: true, align: AlignmentType.CENTER, widthPercent: 14 }),
          createCell('Giáo viên làm phách', { isHeader: true, widthPercent: 22 }),
        ],
      }),
    ];

    let globalStt = 1;
    filteredRooms.forEach((room) => {
      const roomStudents = data.students.filter((s) => s.roomId === room.id);
      const teacherName = room.assignedTeacherId ? teacherMap.get(room.assignedTeacherId) || 'Chưa rõ' : 'Chưa phân công';

      if (roomStudents.length > 0) {
        roomStudents.forEach((student) => {
          rows.push(
            new TableRow({
              children: [
                createCell(String(globalStt++), { align: AlignmentType.CENTER }),
                createCell(room.roomName, { align: AlignmentType.CENTER }),
                createCell(student.studentCode, { align: AlignmentType.CENTER }),
                createCell(student.fullName, { bold: true }),
                createCell(student.className, { align: AlignmentType.CENTER }),
                createCell(student.examCode || '(Chưa ghép)', { align: AlignmentType.CENTER, bold: true, color: 'C53030' }),
                createCell(teacherName),
              ],
            })
          );
        });
      } else if (room.studentCount && room.studentCount > 0) {
        const codes = generateRoomCodes(room);
        codes.forEach((c) => {
          rows.push(
            new TableRow({
              children: [
                createCell(String(globalStt++), { align: AlignmentType.CENTER }),
                createCell(room.roomName, { align: AlignmentType.CENTER }),
                createCell('-', { align: AlignmentType.CENTER }),
                createCell('(Chưa nhập danh sách tên)', { italic: true }),
                createCell('-', { align: AlignmentType.CENTER }),
                createCell(c, { align: AlignmentType.CENTER, bold: true, color: 'C53030' }),
                createCell(teacherName),
              ],
            })
          );
        });
      }
    });

    mainTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: tableBorders,
      rows,
    });
  } else if (docType === 'teacher_assignment') {
    const rows: TableRow[] = [
      new TableRow({
        tableHeader: true,
        children: [
          createCell('STT', { isHeader: true, align: AlignmentType.CENTER, widthPercent: 6 }),
          createCell('Họ và tên giáo viên', { isHeader: true, widthPercent: 22 }),
          createCell('Số ĐT', { isHeader: true, align: AlignmentType.CENTER, widthPercent: 12 }),
          createCell('Số phòng', { isHeader: true, align: AlignmentType.CENTER, widthPercent: 10 }),
          createCell('Danh sách phòng', { isHeader: true, widthPercent: 18 }),
          createCell('Tổng HS', { isHeader: true, align: AlignmentType.CENTER, widthPercent: 10 }),
          createCell('Khoảng mã phách', { isHeader: true, widthPercent: 12 }),
          createCell('Ký nhận bài', { isHeader: true, align: AlignmentType.CENTER, widthPercent: 10 }),
        ],
      }),
    ];

    const selectedTeachers = data.teachers.filter(
      (t) => selectedTeacherId === 'all' || t.id === selectedTeacherId
    );

    selectedTeachers.forEach((teacher, idx) => {
      const assignedRooms = data.rooms.filter((r) => r.assignedTeacherId === teacher.id);
      const totalHs = assignedRooms.reduce((sum, r) => sum + (r.studentCount || 0), 0);
      const roomRanges = assignedRooms.map((r) => `${r.roomName}: ${getCodeRange(r)}`).join('; ');

      rows.push(
        new TableRow({
          children: [
            createCell(String(idx + 1), { align: AlignmentType.CENTER }),
            createCell(teacher.fullName, { bold: true }),
            createCell(teacher.phone || '-', { align: AlignmentType.CENTER }),
            createCell(String(assignedRooms.length), { align: AlignmentType.CENTER, bold: true }),
            createCell(assignedRooms.map((r) => r.roomName).join(', ') || 'Chưa có'),
            createCell(String(totalHs), { align: AlignmentType.CENTER, bold: true }),
            createCell(roomRanges || 'Chưa có'),
            createCell(''),
          ],
        })
      );
    });

    mainTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: tableBorders,
      rows,
    });
  } else if (docType === 'rooms_range') {
    const rows: TableRow[] = [
      new TableRow({
        tableHeader: true,
        children: [
          createCell('Số phòng', { isHeader: true, align: AlignmentType.CENTER, widthPercent: 10 }),
          createCell('Tên phòng thi', { isHeader: true, widthPercent: 20 }),
          createCell('Số lượng HS', { isHeader: true, align: AlignmentType.CENTER, widthPercent: 14 }),
          createCell('Tiền tố', { isHeader: true, align: AlignmentType.CENTER, widthPercent: 10 }),
          createCell('Số bắt đầu', { isHeader: true, align: AlignmentType.CENTER, widthPercent: 12 }),
          createCell('Khoảng mã phách', { isHeader: true, widthPercent: 16 }),
          createCell('Giáo viên phụ trách', { isHeader: true, widthPercent: 18 }),
        ],
      }),
    ];

    filteredRooms.forEach((room) => {
      const teacherName = room.assignedTeacherId ? teacherMap.get(room.assignedTeacherId) || 'Chưa rõ' : 'Chưa phân công';

      rows.push(
        new TableRow({
          children: [
            createCell(String(room.roomNumber), { align: AlignmentType.CENTER, bold: true }),
            createCell(room.roomName, { bold: true }),
            createCell(room.studentCount !== null ? String(room.studentCount) : 'Chưa nhập', { align: AlignmentType.CENTER }),
            createCell(room.codePrefix, { align: AlignmentType.CENTER, bold: true }),
            createCell(String(room.codeStartNumber), { align: AlignmentType.CENTER }),
            createCell(getCodeRange(room), { bold: true }),
            createCell(teacherName),
          ],
        })
      );
    });

    mainTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: tableBorders,
      rows,
    });
  } else {
    // students_with_codes
    const rows: TableRow[] = [
      new TableRow({
        tableHeader: true,
        children: [
          createCell('STT', { isHeader: true, align: AlignmentType.CENTER, widthPercent: 6 }),
          createCell('Số báo danh', { isHeader: true, align: AlignmentType.CENTER, widthPercent: 14 }),
          createCell('Họ và tên thí sinh', { isHeader: true, widthPercent: 28 }),
          createCell('Lớp', { isHeader: true, align: AlignmentType.CENTER, widthPercent: 12 }),
          createCell('Phòng thi', { isHeader: true, align: AlignmentType.CENTER, widthPercent: 14 }),
          createCell('Mã phách', { isHeader: true, align: AlignmentType.CENTER, widthPercent: 14 }),
          createCell('Ký nộp bài', { isHeader: true, align: AlignmentType.CENTER, widthPercent: 12 }),
        ],
      }),
    ];

    let globalStt = 1;
    filteredRooms.forEach((room) => {
      const roomStudents = data.students.filter((s) => s.roomId === room.id);
      roomStudents.forEach((student) => {
        rows.push(
          new TableRow({
            children: [
              createCell(String(globalStt++), { align: AlignmentType.CENTER }),
              createCell(student.studentCode, { align: AlignmentType.CENTER }),
              createCell(student.fullName, { bold: true }),
              createCell(student.className, { align: AlignmentType.CENTER }),
              createCell(room.roomName, { align: AlignmentType.CENTER }),
              createCell(student.examCode || '-', { align: AlignmentType.CENTER, bold: true }),
              createCell(''),
            ],
          })
        );
      });
    });

    mainTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: tableBorders,
      rows,
    });
  }

  // 5. Khối chữ ký cuối văn bản (Bảng 3 cột không viền)
  const now = new Date();
  const dateStr = `......, ngày ${now.getDate()} tháng ${now.getMonth() + 1} năm ${now.getFullYear()}`;
  const teacherLeader = data.examInfo.teacherInCharge || 'Giáo dục VN';

  const signatureTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: noBorder.top,
      bottom: noBorder.bottom,
      left: noBorder.left,
      right: noBorder.right,
      insideHorizontal: noBorder.top,
      insideVertical: noBorder.top,
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 33, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'CÁN BỘ LÀM PHÁCH',
                    font: FONT_NAME,
                    size: 20,
                    bold: true,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: '(Ký và ghi rõ họ tên)',
                    font: FONT_NAME,
                    size: 18,
                    italics: true,
                  }),
                ],
              }),
              new Paragraph({ text: '', spacing: { before: 800 } }),
            ],
          }),
          new TableCell({
            width: { size: 33, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'THƯ KÝ HỘI ĐỒNG',
                    font: FONT_NAME,
                    size: 20,
                    bold: true,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: '(Ký và ghi rõ họ tên)',
                    font: FONT_NAME,
                    size: 18,
                    italics: true,
                  }),
                ],
              }),
              new Paragraph({ text: '', spacing: { before: 800 } }),
            ],
          }),
          new TableCell({
            width: { size: 34, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: dateStr,
                    font: FONT_NAME,
                    size: 18,
                    italics: true,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'CHỦ TỊCH HỘI ĐỒNG THI',
                    font: FONT_NAME,
                    size: 20,
                    bold: true,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: '(Ký tên và đóng dấu)',
                    font: FONT_NAME,
                    size: 18,
                    italics: true,
                  }),
                ],
              }),
              new Paragraph({ text: '', spacing: { before: 600 } }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: teacherLeader,
                    font: FONT_NAME,
                    size: 20,
                    bold: true,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  // 6. Đóng gói Document và tải xuống (.docx)
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1134, // ~20mm
              bottom: 1134,
              left: 1417, // ~25mm
              right: 1134,
            },
          },
        },
        children: [
          headerTable,
          ...titleParagraphs,
          mainTable,
          new Paragraph({ text: '', spacing: { before: 240 } }),
          signatureTable,
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
