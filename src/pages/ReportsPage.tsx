import { motion } from 'framer-motion';
import { useData } from '@/contexts/DataContext';
import {
  BarChart3,
  Users,
  FolderKanban,
  TrendingUp,
  Download,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ClipboardCheck,
  Percent,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState, useEffect, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { apiClient } from '@/lib/api-client';
import { format, subDays, startOfMonth, endOfMonth, subMonths, startOfWeek, endOfWeek, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from 'date-fns';

interface AttendanceRecord {
  id: string;
  trainer_id: string;
  trainer_name: string;
  batch_id: string;
  project_id: string;
  engagement_id: string;
  date: string;
  punch_in: string | null;
  punch_out: string | null;
  status: string;
  completion_notes: string | null;
}

export default function ReportsPage() {
  const { projects = [], trainers = [], hrRequests = [] } = useData();
  const [timeRange, setTimeRange] = useState('month');
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState(true);

  // Calculate date range based on selection
  const dateRange = useMemo(() => {
    const now = new Date();
    switch (timeRange) {
      case 'week':
        return { start: startOfWeek(now), end: endOfWeek(now) };
      case 'month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'quarter':
        return { start: startOfQuarter(now), end: endOfQuarter(now) };
      case 'year':
        return { start: startOfYear(now), end: endOfYear(now) };
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  }, [timeRange]);

  // Fetch attendance records
  useEffect(() => {
    const fetchAttendance = async () => {
      setLoadingAttendance(true);
      try {
        const data = await apiClient.getAttendance({
          date_from: format(dateRange.start, 'yyyy-MM-dd'),
          date_to: format(dateRange.end, 'yyyy-MM-dd')
        });
        setAttendanceRecords(data || []);
      } catch (error) {
        console.error('Error fetching attendance:', error);
      }
      setLoadingAttendance(false);
    };
    fetchAttendance();
  }, [dateRange]);

  // Calculate statistics
  const totalBatches = projects.reduce(
    (acc, p) => acc + p.engagements.reduce((a, e) => a + e.batches.length, 0),
    0
  );
  const confirmedBatches = projects.reduce(
    (acc, p) =>
      acc +
      p.engagements.reduce(
        (a, e) => a + e.batches.filter((b) => b.status === 'confirmed').length,
        0
      ),
    0
  );
  const pendingBatches = projects.reduce(
    (acc, p) =>
      acc +
      p.engagements.reduce(
        (a, e) => a + e.batches.filter((b) => b.status === 'pending').length,
        0
      ),
    0
  );

  const trainerStatusData = [
    { name: 'Available', value: trainers.filter((t) => t.status === 'available').length },
    { name: 'Partially Allocated', value: trainers.filter((t) => t.status === 'partially_allocated').length },
    { name: 'Fully Allocated', value: trainers.filter((t) => t.status === 'fully_allocated').length },
    { name: 'On Leave', value: trainers.filter((t) => t.status === 'on_leave').length },
  ];

  const COLORS = ['hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--primary))', 'hsl(var(--muted-foreground))'];

  const batchAllocationData = projects.map((p) => ({
    name: p.name.split(' ')[0],
    confirmed: p.engagements.reduce(
      (a, e) => a + e.batches.filter((b) => b.status === 'confirmed').length,
      0
    ),
    pending: p.engagements.reduce(
      (a, e) => a + e.batches.filter((b) => b.status === 'pending').length,
      0
    ),
    awaiting: p.engagements.reduce(
      (a, e) => a + e.batches.filter((b) => b.status === 'awaiting_confirmation').length,
      0
    ),
  }));

  const monthlyTrendData: any[] = [];

  // Attendance Statistics
  const attendanceStats = useMemo(() => {
    const total = attendanceRecords.length;
    const completed = attendanceRecords.filter(r => r.status === 'completed').length;
    const pending = attendanceRecords.filter(r => r.status === 'pending').length;
    const inProgress = attendanceRecords.filter(r => r.status === 'in_progress').length;
    
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    // Calculate average working hours for completed records
    const completedWithHours = attendanceRecords.filter(r => r.punch_in && r.punch_out);
    let avgHours = 0;
    if (completedWithHours.length > 0) {
      const totalHours = completedWithHours.reduce((acc, r) => {
        const punchIn = new Date(r.punch_in!);
        const punchOut = new Date(r.punch_out!);
        return acc + (punchOut.getTime() - punchIn.getTime()) / (1000 * 60 * 60);
      }, 0);
      avgHours = totalHours / completedWithHours.length;
    }

    return { total, completed, pending, inProgress, completionRate, avgHours };
  }, [attendanceRecords]);

  // Trainer utilization data
  const trainerUtilizationData = useMemo(() => {
    const trainerMap = new Map<string, { name: string; sessions: number; completed: number }>();
    
    attendanceRecords.forEach(r => {
      if (!trainerMap.has(r.trainer_id)) {
        trainerMap.set(r.trainer_id, { name: r.trainer_name, sessions: 0, completed: 0 });
      }
      const data = trainerMap.get(r.trainer_id)!;
      data.sessions++;
      if (r.status === 'completed') data.completed++;
    });
    
    return Array.from(trainerMap.values())
      .map(t => ({
        name: t.name.split(' ')[0],
        sessions: t.sessions,
        completed: t.completed,
        rate: t.sessions > 0 ? Math.round((t.completed / t.sessions) * 100) : 0,
      }))
      .slice(0, 8); // Top 8 trainers
  }, [attendanceRecords]);

  // Attendance status distribution
  const attendanceStatusData = useMemo(() => [
    { name: 'Completed', value: attendanceStats.completed },
    { name: 'In Progress', value: attendanceStats.inProgress },
    { name: 'Pending', value: attendanceStats.pending },
  ], [attendanceStats]);

  const ATTENDANCE_COLORS = ['hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--muted-foreground))'];

  const statCards = [
    {
      title: 'Total Projects',
      value: projects.length,
      icon: FolderKanban,
      change: '+2 this month',
      color: 'text-primary',
    },
    {
      title: 'Active Trainers',
      value: trainers.filter((t) => t.status !== 'on_leave').length,
      icon: Users,
      change: `${trainers.length} total`,
      color: 'text-success',
    },
    {
      title: 'Confirmed Batches',
      value: confirmedBatches,
      icon: CheckCircle2,
      change: `${totalBatches} total`,
      color: 'text-warning',
    },
    {
      title: 'Pending Requests',
      value: hrRequests.filter((r) => r.status === 'pending').length,
      icon: AlertTriangle,
      change: `${hrRequests.length} total`,
      color: 'text-danger',
    },
  ];

  // Attendance stat cards
  const attendanceStatCards = [
    {
      title: 'Total Sessions',
      value: attendanceStats.total,
      icon: ClipboardCheck,
      change: `${timeRange === 'week' ? 'This week' : timeRange === 'month' ? 'This month' : timeRange === 'quarter' ? 'This quarter' : 'This year'}`,
      color: 'text-primary',
    },
    {
      title: 'Completion Rate',
      value: `${attendanceStats.completionRate}%`,
      icon: Percent,
      change: `${attendanceStats.completed} completed`,
      color: 'text-success',
    },
    {
      title: 'In Progress',
      value: attendanceStats.inProgress,
      icon: Clock,
      change: 'Currently active',
      color: 'text-warning',
    },
    {
      title: 'Avg. Hours',
      value: attendanceStats.avgHours.toFixed(1),
      icon: TrendingUp,
      change: 'Per session',
      color: 'text-primary',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Reports</h1>
          <p className="text-muted-foreground mt-1">
            Analytics and insights for your training operations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-3xl font-bold mt-1">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
                  </div>
                  <div className={`p-3 rounded-xl bg-muted ${stat.color}`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Batch Allocation Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Batch Allocation by Project
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={batchAllocationData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="confirmed" stackId="a" fill="hsl(var(--success))" name="Confirmed" />
                <Bar dataKey="awaiting" stackId="a" fill="hsl(var(--warning))" name="Awaiting" />
                <Bar dataKey="pending" stackId="a" fill="hsl(var(--danger))" name="Pending" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Trainer Status Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Trainer Availability
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={trainerStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {trainerStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {trainerStatusData.map((item, index) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index] }}
                  />
                  <span className="text-sm text-muted-foreground">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trend Chart - Hidden when no data */}
      {monthlyTrendData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Monthly Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrendData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="batches"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  name="Batches"
                />
                <Line
                  type="monotone"
                  dataKey="trainers"
                  stroke="hsl(var(--success))"
                  strokeWidth={2}
                  name="Active Trainers"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Attendance Reports Section */}
      <div className="pt-4">
        <h2 className="text-2xl font-display font-bold mb-4 flex items-center gap-2">
          <ClipboardCheck className="w-6 h-6 text-primary" />
          Attendance Reports
        </h2>
      </div>

      {/* Attendance Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {attendanceStatCards.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-3xl font-bold mt-1">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
                  </div>
                  <div className={`p-3 rounded-xl bg-muted ${stat.color}`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Attendance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trainer Utilization Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Trainer Utilization
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingAttendance ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Loading attendance data...
              </div>
            ) : trainerUtilizationData.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No attendance data available for this period
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={trainerUtilizationData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis dataKey="name" type="category" className="text-xs" width={80} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value, name) => {
                      if (name === 'rate') return [`${value}%`, 'Completion Rate'];
                      return [value, name === 'sessions' ? 'Total Sessions' : 'Completed'];
                    }}
                  />
                  <Bar dataKey="sessions" fill="hsl(var(--muted-foreground))" name="sessions" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="completed" fill="hsl(var(--success))" name="completed" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Completion Rate Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <Percent className="w-5 h-5 text-primary" />
              Session Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingAttendance ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Loading attendance data...
              </div>
            ) : attendanceStats.total === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No attendance data available for this period
              </div>
            ) : (
              <>
                <div className="flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={attendanceStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        fill="#8884d8"
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
                      >
                        {attendanceStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={ATTENDANCE_COLORS[index % ATTENDANCE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap justify-center gap-4 mt-4">
                  {attendanceStatusData.map((item, index) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: ATTENDANCE_COLORS[index] }}
                      />
                      <span className="text-sm text-muted-foreground">{item.name}: {item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Trainer Completion Rates */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Trainer Completion Rates
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingAttendance ? (
            <div className="py-8 text-center text-muted-foreground">
              Loading attendance data...
            </div>
          ) : trainerUtilizationData.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No attendance data available for this period
            </div>
          ) : (
            <div className="space-y-4">
              {trainerUtilizationData.map((trainer) => (
                <div key={trainer.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-[120px]">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{trainer.name}</span>
                  </div>
                  <div className="flex items-center gap-4 flex-1 max-w-md">
                    <Progress value={trainer.rate} className="h-2 flex-1" />
                    <span className="text-sm font-medium w-12 text-right">{trainer.rate}%</span>
                  </div>
                  <div className="text-xs text-muted-foreground ml-4 min-w-[80px] text-right">
                    {trainer.completed}/{trainer.sessions} sessions
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Allocation Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display">Allocation Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-success" />
                <span>Confirmed Batches</span>
              </div>
              <div className="flex items-center gap-4">
                <Progress value={totalBatches > 0 ? (confirmedBatches / totalBatches) * 100 : 0} className="w-32 h-2" />
                <span className="text-sm font-medium w-16 text-right">
                  {confirmedBatches}/{totalBatches}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-warning" />
                <span>Awaiting Confirmation</span>
              </div>
              <div className="flex items-center gap-4">
                <Progress
                  value={totalBatches > 0 ? ((totalBatches - confirmedBatches - pendingBatches) / totalBatches) * 100 : 0}
                  className="w-32 h-2"
                />
                <span className="text-sm font-medium w-16 text-right">
                  {totalBatches - confirmedBatches - pendingBatches}/{totalBatches}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-danger" />
                <span>Pending Allocation</span>
              </div>
              <div className="flex items-center gap-4">
                <Progress value={totalBatches > 0 ? (pendingBatches / totalBatches) * 100 : 0} className="w-32 h-2" />
                <span className="text-sm font-medium w-16 text-right">
                  {pendingBatches}/{totalBatches}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
