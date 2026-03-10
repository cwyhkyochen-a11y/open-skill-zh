// API 请求工具函数
const basePath = process.env.NEXT_PUBLIC_APP_URL || '';

export function apiUrl(path: string): string {
  // 如果是完整 URL，直接返回
  if (path.startsWith('http')) {
    return path;
  }
  // 如果路径不以 / 开头，添加 /
  if (!path.startsWith('/')) {
    path = '/' + path;
  }
  // 返回完整路径
  return basePath + path;
}

export async function apiFetch(path: string, options?: RequestInit) {
  return fetch(apiUrl(path), options);
}
