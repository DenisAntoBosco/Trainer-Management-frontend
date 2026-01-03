import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Link } from 'react-router-dom';
import {
  FolderKanban,
  Users,
  Calendar,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  Clock,
  XCircle,
  Bell,
  Plus,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const { user } = useAuth();
  const { projects = [], trainers = [], hrRequests = [] } = useData();

  // Calculate metrics
  const activeProjects = projects.filter(p => p.status === 'active').length;
  const totalBatches = projects.reduce((acc, p) => 
    acc + (p.engagements || []).reduce((eAcc, e) => eAcc + (e.batches || []).length, 0), 0
  );
  const confirmedBatches = projects.reduce((acc, p) => 
    acc + (p.engagements || []).reduce((eAcc, e) => 
      eAcc + (e.batches || []).filter(b => b.status === 'confirmed').length, 0
    ), 0
  );
  const pendingBatches = projects.reduce((acc, p) => 
    acc + (p.engagements || []).reduce((eAcc, e) => 
      eAcc + (e.batches || []).filter(b => b.status === 'pending').length, 0
    ), 0
  );
  const availableTrainers = trainers.filter(t => 
    t.status === 'available' || t.status === 'partially_allocated'
  ).length;
  const pendingHRRequests = hrRequests.filter(r => r.status === 'pending').length;

  // Domain distribution for chart
  const domainCounts = trainers.reduce((acc, t) => {
    (t.expertise || []).forEach(e => {
      const domain = e.toLowerCase();
      if (domain.includes('java')) acc['Java'] = (acc['Java'] || 0) + 1;
      else if (domain.includes('python')) acc['Python'] = (acc['Python'] || 0) + 1;
      else if (domain.includes('data') || domain.includes('ml')) acc['Data Science'] = (acc['Data Science'] || 0) + 1;
      else if (domain.includes('react') || domain.includes('node')) acc['Web Dev'] = (acc['Web Dev'] || 0) + 1;
      else if (domain.includes('soft') || domain.includes('communication')) acc['Soft Skills'] = (acc['Soft Skills'] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  const maxDomainCount = Math.max(...Object.values(domainCounts));

  const stats = [
    {
      title: 'Active Projects',
      value: activeProjects,
      change: '+2 this month',
      icon: FolderKanban,
      color: 'bg-primary/10 text-primary',
      trend: 'up',
    },
    {
      title: 'Available Trainers',
      value: `${availableTrainers}/${trainers.length}`,
      change: `${trainers.filter(t => t.status === 'on_leave').length} on leave`,
      icon: Users,
      color: 'bg-success/10 text-success',
      trend: 'neutral',
    },
    {
      title: 'Active Batches',
      value: totalBatches,
      change: `${confirmedBatches} confirmed`,
      icon: Calendar,
      color: 'bg-warning/10 text-warning',
      trend: 'up',
    },
    {
      title: 'Pending Allocations',
      value: pendingBatches,
      change: pendingBatches > 0 ? 'Needs attention' : 'All clear',
      icon: AlertTriangle,
      color: pendingBatches > 0 ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success',
      trend: pendingBatches > 0 ? 'warning' : 'neutral',
    },
  ];

  const recentActivities: any[] = [];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">
            Welcome back, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's what's happening with your trainer allocations today.
          </p>
        </div>
        {user?.role === 'admin' && (
          <Button asChild className="gradient-primary hover:opacity-90">
            <Link to="/projects/new">
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Link>
          </Button>
        )}
      </div>

      {/* Alert Banner */}
      {(pendingBatches > 0 || pendingHRRequests > 0) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-danger/10 border border-danger/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-danger/20">
              <Bell className="w-5 h-5 text-danger" />
            </div>
            <div>
              <p className="font-semibold text-danger">Attention Required</p>
              <p className="text-sm text-danger/80">
                {pendingBatches > 0 && `${pendingBatches} batches need trainer allocation. `}
                {pendingHRRequests > 0 && `${pendingHRRequests} HR requests pending.`}
              </p>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" size="sm" className="border-danger/30 text-danger hover:bg-danger/10 flex-1 sm:flex-none" asChild>
              <Link to="/projects">View Details</Link>
            </Button>
            {user?.role === 'admin' && pendingHRRequests > 0 && (
              <Button size="sm" className="bg-danger hover:bg-danger/90 flex-1 sm:flex-none" asChild>
                <Link to="/hr-requests">Notify HR</Link>
              </Button>
            )}
          </div>
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="hover:shadow-card-hover transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className={cn("p-3 rounded-xl", stat.color)}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  {stat.trend === 'up' && (
                    <Badge variant="secondary" className="bg-success/10 text-success border-0">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Up
                    </Badge>
                  )}
                </div>
                <div className="mt-4">
                  <p className="text-3xl font-display font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground mt-1">{stat.title}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-2">{stat.change}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trainer by Domain Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-display">Trainers by Domain</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/trainers">
                View all <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(domainCounts).map(([domain, count]) => (
                <div key={domain} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{domain}</span>
                    <span className="text-muted-foreground">{count} trainers</span>
                  </div>
                  <Progress 
                    value={(count / maxDomainCount) * 100} 
                    className="h-2"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Allocation Status */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display">Allocation Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-success/10">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-success" />
                  <span className="font-medium">Confirmed</span>
                </div>
                <Badge className="bg-success text-white">{confirmedBatches}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-warning/10">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-warning" />
                  <span className="font-medium">Awaiting</span>
                </div>
                <Badge className="bg-warning text-white">
                  {totalBatches - confirmedBatches - pendingBatches}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-danger/10">
                <div className="flex items-center gap-3">
                  <XCircle className="w-5 h-5 text-danger" />
                  <span className="font-medium">Pending</span>
                </div>
                <Badge className="bg-danger text-white">{pendingBatches}</Badge>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t">
              <p className="text-sm text-muted-foreground mb-3">Overall Progress</p>
              <div className="relative pt-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-success">
                    {totalBatches > 0 ? Math.round((confirmedBatches / totalBatches) * 100) : 0}% Complete
                  </span>
                </div>
                <Progress value={totalBatches > 0 ? (confirmedBatches / totalBatches) * 100 : 0} className="h-3" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-display">Recent Activity</CardTitle>
            <Button variant="ghost" size="sm">View all</Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className={cn(
                    "p-2 rounded-lg",
                    activity.type === 'create' && "bg-primary/10 text-primary",
                    activity.type === 'assign' && "bg-success/10 text-success",
                    activity.type === 'alert' && "bg-warning/10 text-warning",
                    activity.type === 'confirm' && "bg-success/10 text-success",
                  )}>
                    {activity.type === 'create' && <Plus className="w-4 h-4" />}
                    {activity.type === 'assign' && <Users className="w-4 h-4" />}
                    {activity.type === 'alert' && <AlertTriangle className="w-4 h-4" />}
                    {activity.type === 'confirm' && <CheckCircle2 className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">
                      by {activity.user} · {activity.time}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Projects Overview */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-display">Projects Overview</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/projects">
                View all <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {projects.slice(0, 3).map((project, i) => {
                const totalBatches = (project.engagements || []).reduce(
                  (acc, e) => acc + (e.batches || []).length, 0
                );
                const confirmedBatches = (project.engagements || []).reduce(
                  (acc, e) => acc + (e.batches || []).filter(b => b.status === 'confirmed').length, 0
                );
                const progress = totalBatches > 0 ? (confirmedBatches / totalBatches) * 100 : 0;

                return (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Link
                      to={`/projects/${project.id}`}
                      className="block p-4 rounded-xl border border-border hover:border-primary hover:shadow-md transition-all group"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold group-hover:text-primary transition-colors">
                            {project.name}
                          </h4>
                          <p className="text-sm text-muted-foreground">{project.clientName || project.client_name}</p>
                        </div>
                        <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                          {project.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                        <span>{(project.engagements || []).length} engagements</span>
                        <span>{totalBatches} batches</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Allocation Progress</span>
                          <span className="font-medium">{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
