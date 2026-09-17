import { apiGet, apiPatch } from "./client";

/** Frontend view type mirroring the backend NotificationRecord response shape. */
export interface NotificationView {
  id: string;
  userId: string;
  title: string;
  body: string | null;
  type: string;
  isRead: boolean;
  createdAt?: string;
}

export const notificationsApi = {
  list: () => apiGet<NotificationView[]>("/api/notifications"),
  markRead: (id: string) => apiPatch<{ ok: true }>(`/api/notifications/${id}`, { isRead: true }),
};
