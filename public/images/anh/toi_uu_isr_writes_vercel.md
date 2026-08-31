**Tối ưu ISR Writes của Vercel cho web [http://novalyticdeals.com](http://novalyticdeals.com)**

Dưới đây là tất cả các cách tối ưu nhất dành cho Next.js **App Router** được chia theo từng tầng kiến trúc:

1\. Tối ưu cơ chế Revalidation (Tầng dữ liệu)

* **Chuyển từ Time-based sang On-Demand Revalidation:** Tuyệt đối tránh việc đặt thời gian ngắn như revalidate \= 60. Hãy chuyển sang dùng revalidateTag() hoặc revalidatePath(). Trang web sẽ được lưu cache vĩnh viễn trên CDN và chỉ tốn 1 lượt ISR Write duy nhất khi bạn chủ động gọi lệnh (ví dụ: khi bấm "Lưu" trong trang quản trị/CMS).  
* **Kéo dài thời gian cache (nếu bắt buộc dùng Time-based):** Đối với các trang ít thay đổi (Blog, Điều khoản, Giới thiệu), hãy đặt thời gian revalidate tối thiểu là **1 ngày (86400)** hoặc **1 tuần (604800)**.  
* **Xử lý conditional revalidate:** Khi gọi API revalidate thủ công, hãy kiểm tra xem dữ liệu thực tế có thay đổi hay không trước khi kích hoạt lệnh xóa cache để tránh lãng phí lượt ghi.

2\. Tối ưu cấu hình Prefetching (Tầng Client/UI)

Mặc định, Next.js sẽ tự động tải trước (prefetch) dữ liệu của các trang khi thẻ \<Link\> xuất hiện trên màn hình người dùng, điều này vô tình kích hoạt các lượt ISR Writes ẩn.

**Tắt prefetch trên các danh sách dài:** Với các trang có hàng chục link (như danh sách coupon, danh mục sản phẩm), hãy tắt prefetch:

* Hãy thận trọng khi sử dụng mã.**Sử dụng Prefetch Mode mặc định (null):** Trong Next.js mới, nếu không đặt prefetch={false}, hãy đảm bảo bạn chỉ prefetch các thành phần tĩnh (static layout) chứ không tải trước toàn bộ dữ liệu động (dynamic data).

3\. Tối ưu dung lượng trang (Tập trung vào "Write Units")

Vercel tính **1 ISR Write Unit \= 8 KB**. Nếu trang của bạn quá nặng, một lần revalidate sẽ tốn nhiều Unit cùng lúc.

* **Giảm kích thước React Server Component (RSC) Payload:** Không truyền thừa dữ liệu từ API vào Component. Chỉ select các trường cần thiết (ví dụ: chỉ lấy id, title, code thay vì lấy toàn bộ object JSON nặng nề của coupon).  
* **Tách nhỏ trang tĩnh và thành phần động:** Chuyển các thành phần thay đổi liên tục (như số lượt click coupon, bình luận, số người đang xem) sang phía Client-side fetching (dùng SWR hoặc React Query) hoặc dùng loading.tsx / Suspense để stream dữ liệu. Phần khung trang tĩnh còn lại sẽ được ISR tối ưu với dung lượng cực nhẹ.

4\. Cấu hình Stale-While-Revalidate hợp lý (Tầng Vercel CDN)

* **Tận dụng cơ chế nhận diện dữ liệu trùng lặp:** Vercel có tính năng thông minh: nếu hành động ISR diễn ra nhưng mã HTML và RSC Payload tạo ra **giống hệt** bản đang có trên CDN, Vercel sẽ tự động hủy bỏ lệnh ghi và **không tính phí** lượt ISR Write đó. Hãy đảm bảo hàm format thời gian hoặc mã ngẫu nhiên (như Math.random(), new Date()) không bị render trực tiếp trên server vì nó làm thay đổi HTML liên tục sau mỗi lần build.

5\. Quản lý Route động (Dynamic Routes) đúng cách

**Sử dụng generateStaticParams:** Đối với các trang động (như /stores/\[slug\]), hãy định nghĩa trước các slug phổ biến nhất ngay trong lúc build:

* **Cấu hình dynamicParams \= true hoặc 'force-static':** Đảm bảo các trang không nằm trong danh sách build sẵn vẫn được xử lý như một trang tĩnh sau lượt truy cập đầu tiên, thay vì bị biến thành trang Dynamic hoàn toàn (Server-side Rendering) gây tốn tài nguyên khác.

---

