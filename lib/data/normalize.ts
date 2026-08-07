// `unstable_cache` lưu kết quả bằng JSON, mà JSON.stringify xoá hẳn key có giá
// trị undefined. Hệ quả: cùng một object, bản vừa tính (cache miss) có key
// `bannerUrl: undefined` còn bản đọc lại từ cache (cache hit) thì không có key
// đó nữa. React Flight serialize hai bản này khác nhau (`"$undefined"` vs
// không in gì), nên payload của trang ISR đổi byte sau mỗi lần cache hết hạn —
// kể cả khi nội dung thật sự không đổi.
//
// Vercel chỉ miễn phí lượt ghi khi nội dung regenerate giống hệt bản cũ, nên
// khác biệt "ảo" này khiến MỌI lần revalidate đều bị tính Write Unit.
//
// Vì vậy: mapper trong lib/data/* không được trả về property mang giá trị
// undefined. Gọi stripUndefined() ở cuối mapper để bảo đảm bất biến đó.
// Kiểm tra tự động trong lib/data/serialization.test.ts.
export function stripUndefined<T extends object>(obj: T): T {
  for (const key of Object.keys(obj)) {
    if ((obj as Record<string, unknown>)[key] === undefined) {
      delete (obj as Record<string, unknown>)[key];
    }
  }
  return obj;
}
