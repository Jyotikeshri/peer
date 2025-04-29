// src/pages/Profile/components/GroupsList.jsx
import { useState, useEffect } from 'react';
import { 
  Box, 
  Grid, 
  Typography, 
  CircularProgress, 
  Paper,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Avatar,
  AvatarGroup,
  Divider
} from '@mui/material';
import GroupIcon from '@mui/icons-material/Group';
import GroupsIcon from '@mui/icons-material/Groups';
import PeopleIcon from '@mui/icons-material/People';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';

const GroupsList = ({ groups = [] }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [groupsData, setGroupsData] = useState([]);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        if (groups && groups.length > 0) {
          // In a real implementation, you would fetch group details if they're not already included
          // For now, we'll just use mock data
          const mockGroupsData = [
            { 
              id: '1', 
              name: 'React Study Group', 
              description: 'Weekly meetups to discuss React concepts and work on projects together.',
              members: 12,
              topics: ['React', 'JavaScript', 'Frontend'],
              nextMeeting: '2025-04-30T18:00:00',
              avatars: [
                'https://randomuser.me/api/portraits/men/32.jpg',
                'https://randomuser.me/api/portraits/women/44.jpg',
                'https://randomuser.me/api/portraits/men/58.jpg',
                'https://randomuser.me/api/portraits/women/65.jpg',
              ]
            },
            { 
              id: '2', 
              name: 'Algorithm Wizards', 
              description: 'Solving coding challenges and discussing algorithm strategies.',
              members: 8,
              topics: ['Algorithms', 'Data Structures', 'Problem Solving'],
              nextMeeting: '2025-05-02T19:00:00',
              avatars: [
                'https://randomuser.me/api/portraits/women/22.jpg',
                'https://randomuser.me/api/portraits/men/13.jpg',
                'https://randomuser.me/api/portraits/women/11.jpg',
              ]
            },
            { 
              id: '3', 
              name: 'Full Stack Developers', 
              description: 'Building full-stack applications with the MERN stack.',
              members: 15,
              topics: ['MongoDB', 'Express', 'React', 'Node.js'],
              nextMeeting: '2025-05-05T17:30:00',
              avatars: [
                'https://randomuser.me/api/portraits/men/42.jpg',
                'https://randomuser.me/api/portraits/women/65.jpg',
                'https://randomuser.me/api/portraits/men/32.jpg',
                'https://randomuser.me/api/portraits/women/44.jpg',
              ]
            }
          ];
          
          // In a real implementation, you would use the actual data from the API
          setGroupsData(mockGroupsData);
        }
      } catch (error) {
        console.error('Error fetching groups:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchGroups();
  }, [groups]);

  const formatMeetingDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!groups || groups.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <GroupsIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          No groups joined yet
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Join study groups to collaborate with peers
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          sx={{ mt: 2 }}
          startIcon={<GroupIcon />}
        >
          Find Groups
        </Button>
      </Box>
    );
  }

  return (
    <Grid container spacing={2}>
      {groupsData.map((group) => (
        <Grid item xs={12} key={group.id}>
          <Card sx={{ 
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                  <Typography variant="h5" sx={{ mb: 0.5 }}>
                    {group.name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <PeopleIcon sx={{ fontSize: 18, mr: 0.5, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {group.members} members
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CalendarTodayIcon sx={{ fontSize: 18, mr: 1, color: 'primary.main' }} />
                  <Typography variant="body2" color="primary">
                    Next meeting: {formatMeetingDate(group.nextMeeting)}
                  </Typography>
                </Box>
              </Box>
              
              <Typography variant="body1" sx={{ mb: 2 }}>
                {group.description}
              </Typography>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {group.topics.map((topic, index) => (
                  <Chip key={index} label={topic} size="small" />
                ))}
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <AvatarGroup max={4}>
                  {group.avatars.map((avatar, index) => (
                    <Avatar key={index} src={avatar} alt={`Member ${index + 1}`} />
                  ))}
                </AvatarGroup>
                <Button 
                  variant="outlined"
                  color="primary"
                  size="small"
                >
                  View Group
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default GroupsList;