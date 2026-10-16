export interface Team {
  id: string;
  name: string;
  description: string;
  managerId: string;
  memberIds: string[];
  avgWeeklyHours: number;
  attendanceRate: number;
}
