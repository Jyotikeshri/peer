import { 
    Dialog, 
    DialogContent, 
    IconButton, 
    Box, 
    Typography, 
    Avatar, 
    Chip, 
    Divider, 
    Link, 
    Button,
    Grid,
    Rating,
    Badge,
    Stack,
    CircularProgress
  } from '@mui/material';
  import { styled } from '@mui/material/styles';
  import CloseIcon from '@mui/icons-material/Close';
  import GitHubIcon from '@mui/icons-material/GitHub';
  import LinkedInIcon from '@mui/icons-material/LinkedIn';
  import CodeIcon from '@mui/icons-material/Code';
  import LanguageIcon from '@mui/icons-material/Language';
  import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
  import useUserStore from '../../../contexts/userStore';
  
  const StyledBadge = styled(Badge)(({ theme }) => ({
    '& .MuiBadge-badge': {
      backgroundColor: '#44b700',
      color: '#44b700',
      boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
      '&::after': {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        animation: 'ripple 1.2s infinite ease-in-out',
        border: '1px solid currentColor',
        content: '""',
      },
    },
    '@keyframes ripple': {
      '0%': {
        transform: 'scale(.8)',
        opacity: 1,
      },
      '100%': {
        transform: 'scale(2.4)',
        opacity: 0,
      },
    },
  }));
  
  const ProfileSection = ({ title, children }) => (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
        {title}
      </Typography>
      {children}
    </Box>
  );
  
  const SocialLink = ({ icon, link, label }) => {
    if (!link) return null;
    
    return (
      <Link 
        href={link.startsWith('http') ? link : `https://${link}`} 
        target="_blank" 
        rel="noopener noreferrer"
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          color: 'text.secondary',
          textDecoration: 'none',
          '&:hover': {
            color: 'primary.main',
            textDecoration: 'underline'
          },
          mb: 1
        }}
      >
        {icon}
        <Typography variant="body2" sx={{ ml: 1 }}>
          {label}
        </Typography>
      </Link>
    );
  };
  
  const PeerProfileModal = ({ 
    open, 
    onClose, 
    peer,
    isConnected,
    connecting,
    disconnecting,
    handleConnect,
    handleDisconnect,
    setSnackbar
  }) => {
    const { user } = useUserStore();
    
    // Get initials for the avatar
    const getInitials = (name) => {
      if (!name) return '';
      return name
        .split(' ')
        .map(part => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    };
    
    const handleConnectToggle = () => {
      if (isConnected) {
        handleDisconnect();
      } else {
        handleConnect();
      }
    };
    
    if (!peer) return null;
    
    return (
      <Dialog 
        open={open} 
        onClose={onClose}
        fullWidth
        maxWidth="md"
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: 2,
            backgroundColor: '#F7F9FC',
          }
        }}
      >
        <DialogContent sx={{ p: 0, overflow: 'hidden' }}>
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: 'text.secondary',
              zIndex: 10
            }}
          >
            <CloseIcon />
          </IconButton>
          
          <Box sx={{ p: 0 }}>
            {/* Header Banner */}
            <Box 
              sx={{ 
                height: 120, 
                bgcolor: 'primary.main', 
                position: 'relative'
              }}
            />
            
            {/* Profile Section */}
            <Box sx={{ px: 3, mt: -6 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                {/* Avatar */}
                {peer.isOnline ? (
                  <StyledBadge
                    overlap="circular"
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    variant="dot"
                  >
                    <Avatar
                      sx={{
                        width: 100,
                        height: 100,
                        border: '4px solid white',
                        bgcolor: peer.avatarColor || '#3672F8',
                        fontSize: '2rem',
                        fontWeight: 600,
                      }}
                      src={peer.avatar || null}
                    >
                      {!peer.avatar && getInitials(peer.name || peer.username)}
                    </Avatar>
                  </StyledBadge>
                ) : (
                  <Avatar
                    sx={{
                      width: 100,
                      height: 100,
                      border: '4px solid white',
                      bgcolor: peer.avatarColor || '#3672F8',
                      fontSize: '2rem',
                      fontWeight: 600,
                    }}
                    src={peer.avatar || null}
                  >
                    {!peer.avatar && getInitials(peer.name || peer.username)}
                  </Avatar>
                )}
                
                {/* Connect Button */}
                {user && peer && user._id !== peer._id && (
                  <Button
                    variant={isConnected ? "outlined" : "contained"}
                    color="primary"
                    onClick={handleConnectToggle}
                    disabled={connecting || disconnecting}
                    sx={{
                      mt: 8,
                      borderRadius: 6,
                      px: 3,
                      py: 1,
                      textTransform: 'none',
                    }}
                    startIcon={connecting || disconnecting ? 
                      <CircularProgress size={16} color="inherit" /> : null}
                  >
                    {connecting || disconnecting ? 
                      "Processing..." : 
                      (isConnected ? "Connected" : "Connect")}
                  </Button>
                )}
              </Box>
            </Box>
            
            <Grid container spacing={2} sx={{ p: 3 }}>
              <Grid item xs={12} md={7}>
                {/* Name and Online Status */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="h5" fontWeight={600}>
                    {peer.name || peer.username}
                  </Typography>
                  {peer.isOnline && (
                    <Chip 
                      icon={<FiberManualRecordIcon sx={{ fontSize: '0.8rem !important', color: '#44b700 !important' }} />} 
                      label="Online" 
                      variant="outlined" 
                      size="small"
                      sx={{ ml: 2, borderColor: '#44b700', color: '#44b700' }}
                    />
                  )}
                </Box>
                
                {/* Bio */}
                {peer.bio && (
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    {peer.bio}
                  </Typography>
                )}
                
                <Divider sx={{ mb: 3 }} />
                
                {/* Strengths */}
                {peer.strengths && peer.strengths.length > 0 && (
                  <ProfileSection title="Strengths">
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {peer.strengths.map((skill, index) => (
                        <Chip 
                          key={`strength-${index}`} 
                          label={skill}
                          color="primary"
                          variant="outlined"
                          size="small"
                        />
                      ))}
                    </Box>
                  </ProfileSection>
                )}
                
                {/* Needs Help With */}
                {peer.needsHelpWith && peer.needsHelpWith.length > 0 && (
                  <ProfileSection title="Looking for Help With">
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {peer.needsHelpWith.map((skill, index) => (
                        <Chip 
                          key={`need-${index}`} 
                          label={skill}
                          color="warning"
                          variant="outlined"
                          size="small"
                        />
                      ))}
                    </Box>
                  </ProfileSection>
                )}
                
                {/* Interests */}
                {peer.interests && peer.interests.length > 0 && (
                  <ProfileSection title="Interests">
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {peer.interests.map((interest, index) => (
                        <Chip 
                          key={`interest-${index}`} 
                          label={interest}
                          color="secondary"
                          variant="outlined"
                          size="small"
                        />
                      ))}
                    </Box>
                  </ProfileSection>
                )}
  
                {/* Groups */}
                {peer.groups && peer.groups.length > 0 && (
                  <ProfileSection title="Study Groups">
                    <Typography variant="body2" color="text.secondary">
                      Member of {peer.groups.length} study groups
                    </Typography>
                  </ProfileSection>
                )}
                
                {/* Badges */}
                {peer.badges && peer.badges.length > 0 && (
                  <ProfileSection title="Badges">
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {peer.badges.map((badge, index) => (
                        <Chip 
                          key={`badge-${index}`}
                          icon={<CodeIcon />} 
                          label={typeof badge === 'object' ? badge.name : `Badge ${index + 1}`}
                          variant="filled"
                          size="small"
                          sx={{ bgcolor: '#6E56CF', color: 'white' }}
                        />
                      ))}
                    </Stack>
                  </ProfileSection>
                )}
              </Grid>
              
              <Grid item xs={12} md={5}>
                <Box sx={{ bgcolor: 'white', p: 2, borderRadius: 2, mb: 3 }}>
                  {/* Rating */}
                  <ProfileSection title="Rating">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Rating 
                        value={peer.rating || 0} 
                        precision={0.5} 
                        readOnly 
                      />
                      <Typography variant="body2" sx={{ ml: 1 }}>
                        {peer.rating || 0}/5 ({peer.reviews?.length || 0} reviews)
                      </Typography>
                    </Box>
                  </ProfileSection>
                  
                  {/* Social Links */}
                  <ProfileSection title="Social Links">
                    <SocialLink 
                      icon={<GitHubIcon sx={{ fontSize: 18 }} />} 
                      link={peer.github} 
                      label="GitHub" 
                    />
                    <SocialLink 
                      icon={<LinkedInIcon sx={{ fontSize: 18 }} />} 
                      link={peer.linkedin} 
                      label="LinkedIn" 
                    />
                    <SocialLink 
                      icon={<CodeIcon sx={{ fontSize: 18 }} />} 
                      link={peer.leetcode} 
                      label="LeetCode" 
                    />
                    <SocialLink 
                      icon={<LanguageIcon sx={{ fontSize: 18 }} />} 
                      link={peer.portfolio} 
                      label="Portfolio" 
                    />
                  </ProfileSection>
                </Box>
                
                {/* Member Since */}
                <Box sx={{ bgcolor: 'white', p: 2, borderRadius: 2 }}>
                  <ProfileSection title="Member Since">
                    <Typography variant="body2" color="text.secondary">
                      {peer.createdAt ? new Date(peer.createdAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      }) : 'Unknown'}
                    </Typography>
                  </ProfileSection>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
      </Dialog>
    );
  };
  
  export default PeerProfileModal;