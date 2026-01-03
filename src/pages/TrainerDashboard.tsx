import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, BookOpen, Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Assignment {
  batch_id: string;
  batch_name: string;
  start_date: string;
  end_date: string;
  status: string;
  project_name: string;
  engagement_name: string;
  domain: string;
}

export default function TrainerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        setLoading(true);
        const data = await apiClient.getMyAssignments();
        console.log('Fetched assignments:', data);
        setAssignments(data || []);
      } catch (error) {
        console.error('Error fetching assignments:', error);
        setAssignments([]);
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === 'trainer') {
      fetchAssignments();
    }
  }, [user]);

  const upcomingBatches = assignments.filter(a => 
    new Date(a.start_date) > new Date()
  );

  const ongoingBatches = assignments.filter(a => {
    const now = new Date();
    return new Date(a.start_date) <= now && new Date(a.end_date) >= now;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {user?.name}!</h1>
        <p className="text-muted-foreground mt-2">Here's your training schedule and attendance</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignments.length}</div>
            <p className="text-xs text-muted-foreground">
              {ongoingBatches.length} ongoing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Batches</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingBatches.length}</div>
            <p className="text-xs text-muted-foreground">
              Starting soon
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Skills</CardTitle>
            <Edit className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => navigate('/profile')}
            >
              Update Skills
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-4">
        <Button 
          variant="outline" 
          onClick={() => navigate('/calendar')}
          className="flex items-center gap-2"
        >
          <Calendar className="h-4 w-4" />
          View Calendar
        </Button>
        <Button 
          variant="outline" 
          onClick={() => navigate('/attendance')}
          className="flex items-center gap-2"
        >
          <Clock className="h-4 w-4" />
          Mark Attendance
        </Button>
      </div>

      {/* Ongoing Batches */}
      {ongoingBatches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Ongoing Training Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {ongoingBatches.map(batch => (
                <div key={batch.batch_id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">{batch.project_name} - {batch.engagement_name}</h3>
                    <p className="text-sm font-medium text-primary">{batch.batch_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(batch.start_date).toLocaleDateString()} - {new Date(batch.end_date).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-muted-foreground">Domain: {batch.domain}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Ongoing
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Batches */}
      {upcomingBatches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Training Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingBatches.map(batch => (
                <div key={batch.batch_id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">{batch.project_name} - {batch.engagement_name}</h3>
                    <p className="text-sm font-medium text-primary">{batch.batch_name}</p>
                    <p className="text-sm text-muted-foreground">
                      Starts: {new Date(batch.start_date).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-muted-foreground">Domain: {batch.domain}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Upcoming
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {assignments.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">No training sessions assigned yet</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
