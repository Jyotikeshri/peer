// src/pages/Profile/components/ReviewsList.jsx
import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Paper,
  Avatar,
  Rating,
  Divider,
  List,
  ListItem,
  Card,
  CardContent,
  Button,
  Pagination
} from '@mui/material';
import ReviewsIcon from '@mui/icons-material/Reviews';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';

const ReviewsList = ({ reviews = [] }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [reviewsData, setReviewsData] = useState([]);
  const [page, setPage] = useState(1);
  const reviewsPerPage = 3;

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        if (reviews && reviews.length > 0) {
          // In a real implementation, you would fetch review details if they're not already included
          // For now, we'll just use mock data
          const mockReviewsData = [
            { 
              id: '1', 
              rating: 5, 
              text: 'Absolutely fantastic to work with! Really helped me understand React hooks and context API. Highly recommend!',
              date: '2025-04-10',
              reviewer: {
                id: 'r1',
                username: 'sarahj',
                avatar: 'https://randomuser.me/api/portraits/women/65.jpg'
              }
            },
            { 
              id: '2', 
              rating: 4, 
              text: 'Very knowledgeable about database design and helped me optimize my MongoDB queries. Would definitely study together again.',
              date: '2025-03-22',
              reviewer: {
                id: 'r2',
                username: 'davidc',
                avatar: 'https://randomuser.me/api/portraits/men/42.jpg'
              }
            },
            { 
              id: '3', 
              rating: 5, 
              text: 'One of the best peers I\'ve worked with! Extremely patient and explains complex concepts in a way that\'s easy to understand.',
              date: '2025-03-15',
              reviewer: {
                id: 'r3',
                username: 'alexw',
                avatar: 'https://randomuser.me/api/portraits/women/22.jpg'
              }
            },
            { 
              id: '4', 
              rating: 5, 
              text: 'Helped me prepare for my technical interview. The mock interview sessions were invaluable. Got the job!',
              date: '2025-02-28',
              reviewer: {
                id: 'r4',
                username: 'robertm',
                avatar: 'https://randomuser.me/api/portraits/men/13.jpg'
              }
            }
          ];
          
          // In a real implementation, you would use the actual data from the API
          setReviewsData(mockReviewsData);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchReviews();
  }, [reviews]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <ReviewsIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          No reviews yet
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Reviews from your peers will appear here
        </Typography>
      </Box>
    );
  }

  // Calculate pagination
  const totalPages = Math.ceil(reviewsData.length / reviewsPerPage);
  const currentReviews = reviewsData.slice(
    (page - 1) * reviewsPerPage,
    page * reviewsPerPage
  );

  return (
    <Box>
      <List sx={{ width: '100%' }}>
        {currentReviews.map((review, index) => (
          <React.Fragment key={review.id}>
            <ListItem sx={{ px: 0, py: 2, display: 'block' }}>
              <Card elevation={0} sx={{ bgcolor: 'background.default', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                    <Avatar 
                      src={review.reviewer.avatar} 
                      alt={review.reviewer.username}
                      sx={{ mr: 2 }}
                    />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1">
                        {review.reviewer.username}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Rating value={review.rating} readOnly size="small" sx={{ mr: 1 }} />
                        <Typography variant="body2" color="text.secondary">
                          {new Date(review.date).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex' }}>
                    <FormatQuoteIcon sx={{ transform: 'rotate(180deg)', opacity: 0.3, mr: 1 }} />
                    <Typography variant="body1">
                      {review.text}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </ListItem>
            {index < currentReviews.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </List>
      
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Pagination 
            count={totalPages} 
            page={page} 
            onChange={handleChangePage} 
            color="primary"
          />
        </Box>
      )}
    </Box>
  );
};

export default ReviewsList;