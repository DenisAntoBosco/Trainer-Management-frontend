import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Edit,
  Camera,
  Save,
  Plus,
  X,
  Briefcase,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';

const roleColors = {
  admin: 'bg-primary text-primary-foreground',
  hr: 'bg-purple-500 text-white',
  trainer: 'bg-success text-white',
  project_manager: 'bg-warning text-white',
};

const roleLabels = {
  admin: 'Administrator',
  hr: 'HR Manager',
  trainer: 'Trainer',
  project_manager: 'Project Manager',
};

export default function ProfilePage() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingSkills, setIsEditingSkills] = useState(false);
  const [trainerProfile, setTrainerProfile] = useState<any>(null);
  const [expertise, setExpertise] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '+1 234-567-8900',
    location: 'San Francisco, CA',
    bio: 'Experienced professional with expertise in training management and operations.',
  });

  useEffect(() => {
    const fetchTrainerProfile = async () => {
      if (user?.role === 'trainer') {
        try {
          const profile = await apiClient.getMyTrainerProfile();
          setTrainerProfile(profile);
          setExpertise(profile.expertise || []);
        } catch (error) {
          console.error('Error fetching trainer profile:', error);
        }
      }
    };
    fetchTrainerProfile();
  }, [user]);

  const handleAddSkill = () => {
    if (newSkill.trim() && !expertise.includes(newSkill.trim())) {
      setExpertise([...expertise, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setExpertise(expertise.filter(s => s !== skill));
  };

  const handleSaveSkills = async () => {
    try {
      setLoading(true);
      await apiClient.updateMyExpertise(expertise);
      setIsEditingSkills(false);
      toast({
        title: 'Skills updated',
        description: 'Your expertise has been updated successfully.',
      });
      // Refresh profile
      const profile = await apiClient.getMyTrainerProfile();
      setTrainerProfile(profile);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update skills. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    setIsEditing(false);
    toast({
      title: 'Profile updated',
      description: 'Your profile has been saved successfully.',
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold">My Profile</h1>
        <p className="text-muted-foreground mt-1">
          Manage your personal information and preferences
        </p>
      </div>

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Avatar Section */}
              <div className="flex flex-col items-center">
                <div className="relative">
                  <Avatar className="w-32 h-32 border-4 border-muted">
                    <AvatarImage src={user?.avatar} />
                    <AvatarFallback className="text-3xl bg-primary text-primary-foreground">
                      {user?.name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute bottom-0 right-0 rounded-full"
                  >
                    <Camera className="w-4 h-4" />
                  </Button>
                </div>
                <Badge className={`mt-4 ${roleColors[user?.role || 'admin']}`}>
                  <Shield className="w-3 h-3 mr-1" />
                  {roleLabels[user?.role || 'admin']}
                </Badge>
              </div>

              {/* Info Section */}
              <div className="flex-1 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold">{user?.name}</h2>
                    <p className="text-muted-foreground">{user?.email}</p>
                  </div>
                  <Button
                    variant={isEditing ? 'default' : 'outline'}
                    onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
                  >
                    {isEditing ? (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    ) : (
                      <>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Profile
                      </>
                    )}
                  </Button>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Full Name
                    </Label>
                    {isEditing ? (
                      <Input
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                      />
                    ) : (
                      <p className="font-medium">{formData.name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-muted-foreground flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email Address
                    </Label>
                    {isEditing ? (
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                      />
                    ) : (
                      <p className="font-medium">{formData.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-muted-foreground flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Phone Number
                    </Label>
                    {isEditing ? (
                      <Input
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                      />
                    ) : (
                      <p className="font-medium">{formData.phone}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-muted-foreground flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Location
                    </Label>
                    {isEditing ? (
                      <Input
                        value={formData.location}
                        onChange={(e) =>
                          setFormData({ ...formData, location: e.target.value })
                        }
                      />
                    ) : (
                      <p className="font-medium">{formData.location}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground">Bio</Label>
                  {isEditing ? (
                    <Input
                      value={formData.bio}
                      onChange={(e) =>
                        setFormData({ ...formData, bio: e.target.value })
                      }
                    />
                  ) : (
                    <p className="text-sm">{formData.bio}</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Trainer Skills Section */}
      {user?.role === 'trainer' && trainerProfile && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-display flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-primary" />
                  My Skills & Expertise
                </CardTitle>
                {!isEditingSkills ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingSkills(true)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Skills
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsEditingSkills(false);
                        setExpertise(trainerProfile.expertise || []);
                        setNewSkill('');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveSkills}
                      disabled={loading}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isEditingSkills && (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add new skill (e.g., Python, React, AWS)"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                    />
                    <Button onClick={handleAddSkill} size="sm">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                
                <div className="flex flex-wrap gap-2">
                  {expertise.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No skills added yet</p>
                  ) : (
                    expertise.map((skill, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-sm py-1.5 px-3"
                      >
                        {skill}
                        {isEditingSkills && (
                          <button
                            onClick={() => handleRemoveSkill(skill)}
                            className="ml-2 hover:text-destructive"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </Badge>
                    ))
                  )}
                </div>

                {!isEditingSkills && (
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <Label className="text-muted-foreground text-xs">Employment Type</Label>
                      <p className="font-medium capitalize">
                        {trainerProfile.employment_type?.replace('_', ' ')}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Experience Level</Label>
                      <p className="font-medium capitalize">{trainerProfile.experience_level}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Max Batches</Label>
                      <p className="font-medium">{trainerProfile.max_batches}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Current Batches</Label>
                      <p className="font-medium">{trainerProfile.current_batches}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Activity Card */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { action: 'Logged in', time: 'Just now' },
              { action: 'Updated batch allocation for Project X', time: '2 hours ago' },
              { action: 'Added new trainer to the system', time: 'Yesterday' },
              { action: 'Confirmed 3 batch allocations', time: '2 days ago' },
            ].map((activity, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                <span className="text-sm">{activity.action}</span>
                <span className="text-xs text-muted-foreground">{activity.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
