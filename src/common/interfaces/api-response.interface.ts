export interface ApiResponse<T> {
  errorCode: string;
  data?: T; // Dữ liệu trả về khi thành công
  errors?: any; // Object lỗi chi tiết khi thất bại
  timestamp: string;
  path: string;
}
