# Kế hoạch Triển khai: Hệ thống Quản lý Đánh phách Bài kiểm tra Định kỳ THPT

Hệ thống ứng dụng web chuyên biệt dành cho các trường THPT và Hội đồng ra đề - chấm thi để quản lý phòng thi, phân công giáo viên làm phách, sinh mã phách ngẫu nhiên/tuần tự, in ấn các biểu mẫu A4 chuẩn và xuất file Excel đối chiếu quản lý với độ bảo mật tuyệt đối.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> Dưới đây là các quyết định chính đã được thống nhất sau vòng làm rõ yêu cầu:

- **Dữ liệu khởi đầu**: Bắt đầu ở trạng thái trống kèm hướng dẫn rõ ràng và nút bấm **"Tải dữ liệu mẫu minh họa (16 phòng)"** để người dùng có thể kích hoạt trải nghiệm ngay mọi tính năng kiểm thử (Phòng 1–8 GV A, Phòng 9–16 GV B, a1–a30, b1–b24) hoặc bắt đầu tạo mới từ đầu.
- **Thuật toán sinh mã phách**: Mặc định kích hoạt chế độ **Trộn ngẫu nhiên bảo mật cao (Fisher-Yates Shuffle)** nhằm bảo đảm tính khách quan khi ghép phách bài kiểm tra, đồng thời cung cấp tùy chọn **Ghép tuần tự theo số báo danh** khi hội đồng thi yêu cầu.
- **Định dạng xuất dữ liệu**: Hỗ trợ xuất trực tiếp file **Microsoft Excel (.xlsx)** được định dạng ô, kẻ khung bảng biểu, tiêu đề tiếng Việt chuẩn mực cho 3 biểu mẫu: Bảng phân công giáo viên, Danh sách mã phách gửi người chấm (ẩn danh), và Bảng đối chiếu quản lý (bảo mật).

---

## 1. Tổng quan & Luồng Nghiệp vụ

### Mục tiêu & Đối tượng
- **Đối tượng**: Ban Giám hiệu, Thư ký Hội đồng coi/chấm thi, Tổ trưởng chuyên môn và Giáo viên đánh phách các trường THPT.
- **Giá trị cốt lõi**:
  - Tự động hóa quy trình phân chia mã phách, loại bỏ sai sót tính toán thủ công.
  - Tách biệt hoàn toàn thông tin học sinh khi gửi bài cho giáo viên chấm (bảo đảm tính công bằng tuyệt đối).
  - Quản lý phân công linh hoạt theo dải phòng (VD: Phòng 1–8) hoặc phòng cụ thể.
  - Cảnh báo trực quan ngay lập tức các xung đột (tiền tố trùng, phòng chưa phân công, phòng được giao cho nhiều giáo viên, lệch sĩ số).

---

## 2. Trải nghiệm Người dùng & Thiết kế Giao diện

### Định hướng Thị giác & Bảng màu
Tuân thủ chính xác hình ảnh mẫu tham chiếu và nhận diện thi cử giáo dục Việt Nam:
- **Tone chủ đạo**: Xanh Navy sâu (`#0a2540` / `#0f1f38`) cho Header và Sidebar.
- **Điểm nhấn Thương hiệu**: Vàng Gold hoàng gia (`#f59e0b` / `#fbbf24`) cho chữ "ĐÁNH PHÁCH" và các huy hiệu biểu tượng.
- **Màu tương tác / Active State**: Xanh ngọc / Cyan biển (`#0284c7` / `#0ea5e9`) cho tab đang chọn trên thanh điều hướng bên trái và các nút hành động chính.
- **Nền & Bề mặt (Light Theme)**: Nền xám nhạt dịu mắt (`#f8fafc`), thẻ màu trắng tinh (`#ffffff`) với viền hairline mỏng (`#e2e8f0`), đổ bóng nhẹ `shadow-sm`.
- **Phông chữ**: Display & Header dùng `Plus Jakarta Sans` / `Outfit`, dữ liệu số và mã phách sử dụng `tabular-nums` với phông Mono chuyên dụng (`JetBrains Mono` / `font-mono`) giúp thẳng hàng tuyệt đối.

### Bố cục & 9 Phân hệ Điều hướng

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [Logo] HỆ THỐNG ĐÁNH PHÁCH BÀI KIỂM TRA           [👤 Giáo viên: Giáo dục VN | THPT..]  │
├──────────────┬─────────────────────────────────────────────────────────────────────────┤
│ 1. Tổng quan │ [Nội dung theo từng phân hệ]                                            │
│ 2. Kỳ KT     │                                                                         │
│ 3. Phòng thi │ • Thẻ tóm tắt thông số, bộ đếm mã phách, cảnh báo hợp lệ               │
│ 4. Phân công │ • Danh sách phòng / giáo viên / học sinh trực quan                      │
│ 5. Học sinh  │ • Thao tác nhanh: Thêm, Sửa, Xóa, Nhập/Xuất Excel, In A4               │
│ 6. Tạo mã    │                                                                         │
│ 7. In danh s.│                                                                         │
│ 8. Tải dữ li.│                                                                         │
│ 9. Cài đặt   │                                                                         │
└──────────────┴─────────────────────────────────────────────────────────────────────────┘
```

1. **Tổng quan**: Thống kê số phòng, số học sinh, số giáo viên, tổng số mã phách đã tạo; bảng phân công tổng hợp; các nút điều hướng nhanh; nút Tải dữ liệu mẫu khi rỗng.
2. **Thông tin kỳ kiểm tra**: Năm học, Kỳ kiểm tra (Giữa kỳ I, Cuối kỳ I, Giữa kỳ II, Cuối kỳ II), Môn học, Khối lớp, Ngày kiểm tra, Ghi chú; nút "Lưu thông tin kỳ kiểm tra".
3. **Quản lý phòng thi**:
   - Bộ chọn tăng/giảm nhanh số phòng (`-` `[Số phòng]` `+`), nút "Tạo danh sách phòng".
   - Tự động sinh tiền tố chữ thường: `a, b, c... z, aa, ab...` (có thể sửa).
   - Công thức mã phách: `Tiền tố + số bắt đầu` đến `Tiền tố + (số bắt đầu + số lượng HS - 1)`. Ví dụ: `a1–a30`, `b1–b24`.
   - Hiển thị "Chưa nhập" nếu phòng chưa có sĩ số.
   - Thêm/sửa/xóa từng phòng không làm ảnh hưởng đến mã phòng khác. Kiểm tra trùng tiền tố/mã phách.
4. **Phân công giáo viên đánh phách**:
   - Thêm, sửa, xóa giáo viên (không giới hạn số lượng).
   - Phân công theo dải phòng nhanh (từ Phòng X đến Phòng Y) hoặc tích chọn phòng riêng lẻ.
   - Bảng tóm tắt nhiệm vụ theo giáo viên (số phòng, danh sách phòng, tổng HS, các dải mã phách).
   - Cảnh báo trực quan phòng chưa có ai phụ trách hoặc phòng bị giao trùng 2 giáo viên.
5. **Danh sách học sinh**:
   - Quản lý theo từng phòng: STT, Số báo danh, Họ và tên, Lớp, Phòng thi.
   - Thêm/Sửa/Xóa học sinh trực tiếp trên giao diện; Hỗ trợ Import file Excel/CSV và tải file Excel mẫu.
   - Kiểm tra đối chiếu số lượng HS trong danh sách với sĩ số đã khai báo ở phòng thi.
6. **Tạo mã phách**:
   - Tùy chọn: Trộn ngẫu nhiên (Fisher-Yates) hoặc Tuần tự theo SBD.
   - Hộp thoại cảnh báo xác nhận trước khi tạo lại mã (tránh làm thay đổi bảng đối chiếu cũ).
   - Kiểm tra tính đầy đủ trước khi sinh mã (báo cáo phòng thiếu giáo viên, phòng thiếu sĩ số).
   - Hiển thị chi tiết danh sách ghép mã theo từng phòng.
7. **In danh sách (A4 Chuẩn In Ấn)**:
   - Bản xem trước A4 trực quan, ẩn hoàn toàn Sidebar và các nút bấm khi bấm In (`window.print()`).
   - Tùy chọn in:
     - Danh sách phòng & dải mã phách.
     - Phiếu phân công giáo viên đánh phách (có thể in riêng từng giáo viên).
     - Danh sách gửi người chấm (đã ẩn danh họ tên học sinh và giáo viên làm phách).
     - Bảng đối chiếu mã phách với học sinh (kèm nhãn đậm cảnh báo đỏ: **"TÀI LIỆU QUẢN LÝ – KHÔNG PHÁT CHO NGƯỜI CHẤM"**).
8. **Tải dữ liệu**:
   - Xuất file Excel (.xlsx) chuẩn hóa chuyên nghiệp dùng thư viện `xlsx`:
     - Bảng phân công giáo viên.
     - Danh sách mã phách gửi người chấm thi.
     - Bảng đối chiếu mã phách bảo mật.
   - Tên file chuẩn: `[Kỳ KT]_[Môn]_[Khối]_[Loại_Báo_Cáo].xlsx`.
9. **Cài đặt & Lưu trữ**:
   - Chỉnh sửa Thông tin trường ("THPT Trần Phú") và Giáo viên phụ trách ("Giáo dục VN").
   - Toàn bộ dữ liệu tự động lưu liên tục trong `localStorage`. Tải lại trang giữ nguyên trạng thái.
   - Tính năng Xuất file sao lưu (JSON Backup) và Phục hồi từ file JSON (Restore).
   - Nút Xóa dữ liệu kỳ kiểm tra (có hộp thoại gõ xác nhận an toàn).
   - Đảm bảo bảo mật 100%: Dữ liệu chỉ xử lý và lưu cục bộ trên trình duyệt của người dùng.

---

## 3. Kiến trúc Kỹ thuật & Cấu trúc Dữ liệu

### Mô hình Luồng Dữ liệu (State Architecture)

```
┌─────────────────────────────────────────────────────────────┐
│                      localStorage                           │
│  (examInfo, rooms, teachers, students, codeAssignments)     │
└───────────────┬─────────────────────────────▲───────────────┘
                │ Khởi tạo / Sync             │ Auto-save
                ▼                             │
┌─────────────────────────────────────────────────────────────┐
│                      ExamContext / State                    │
├──────────────────────────────┬──────────────────────────────┤
│ Validation Engine:           │ Generator Engine:            │
│ • Trùng tiền tố phòng        │ • Tự sinh tiền tố (a, b...)  │
│ • Trùng giáo viên phụ trách  │ • Tính dải mã (a1-a30)       │
│ • Phòng chưa phân công       │ • Xáo trộn mã (Fisher-Yates) │
│ • Lệch sĩ số HS thực tế      │ • Xuất Excel (.xlsx) & In A4 │
└──────────────────────────────┴──────────────────────────────┘
```

### Các Entity Chính trong TypeScript
- `ExamInfo`: Năm học, kỳ kiểm tra, môn học, khối, ngày thi, ghi chú, tên trường, giáo viên phụ trách.
- `Room`: `id`, `roomNumber`, `roomName`, `studentCount` (number | null), `codePrefix`, `codeStartNumber`, `assignedTeacherId`.
- `Teacher`: `id`, `fullName`, `phone`, `assignedRoomIds`.
- `Student`: `id`, `roomId`, `studentCode` (SBD), `fullName`, `className`, `examCode` (mã phách đã ghép).

---

## 4. Kế hoạch Kiểm thử & Xác minh Toàn diện

1. **Kiểm tra dữ liệu mẫu (16 phòng)**: Bấm nạp dữ liệu mẫu -> GV A phụ trách P1-P8, GV B phụ trách P9-P16, P1 (30 HS, a1–a30), P2 (24 HS, b1–b24), các phòng khác hiển thị "Chưa nhập".
2. **Kiểm tra công thức mã phách**: Phòng 1 với tiền tố `a`, bắt đầu `1`, sĩ số `30` -> đúng `a1–a30`.
3. **Kiểm tra cảnh báo**: Gán cùng 1 phòng cho 2 GV; tạo 2 phòng cùng tiền tố `a` -> hiển thị thông báo lỗi/cảnh báo rõ ràng.
4. **Kiểm tra sinh mã phách**: Sinh mã ngẫu nhiên cho phòng có học sinh -> ghép 1-1 không trùng, tạo lại mã có xác nhận.
5. **Kiểm tra Xuất file Excel (.xlsx)**: Xuất từng loại file tải về máy mở bình thường trong Excel.
6. **Kiểm tra In ấn A4**: Bật chế độ xem trước in và `window.print()` kiểm tra bản in không bị tràn lề, ẩn sidebar.
7. **Kiểm tra Lưu trữ & Backup**: F5 reload trang giữ nguyên dữ liệu; xuất JSON và khôi phục hoạt động trơn tru.
