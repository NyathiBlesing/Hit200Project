import React, { useState } from "react";
import { useAlert } from "../components/AlertContext";
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  Alert,
  useTheme,
  Rating,
  Grid,
} from "@mui/material";
import {
  Send as SendIcon,
  Feedback as FeedbackIcon,
} from "@mui/icons-material";
import Sidebar from "../components/Sidebar";

const Feedback = () => {
  const { showAlert } = useAlert();
  const theme = useTheme();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  
  const [feedbackList, setFeedbackList] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // TODO: Implement feedback submission
      showAlert("Thank you for your feedback!", "success");
      setRating(0);
      setComment('');
      setFeedbackList([...feedbackList, { rating, comment, date: new Date() }]);
    } catch (error) {
      showAlert('Failed to submit feedback', 'error');
      console.error('Error submitting feedback:', error);
    }
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar />
      <Box sx={{ 
        flexGrow: 1, 
        p: 3, 
        ml: '250px',
        backgroundColor: theme.palette.background.default,
        minHeight: '100vh'
      }}>
        <Typography 
          variant="h4" 
          component="h1" 
          sx={{ 
            fontWeight: 600,
            color: theme.palette.text.primary,
            fontFamily: "'Poppins', sans-serif",
            mb: 3
          }}
        >
          Feedback
        </Typography>

        

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ 
              backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : 'white',
              color: theme.palette.text.primary,
              borderRadius: '12px',
              border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
              transition: 'transform 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)',
              },
            }}>
              <CardContent>
                <Box component="form" onSubmit={handleSubmit}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 600,
                      color: theme.palette.text.primary,
                      mb: 2,
                    }}
                  >
                    Rate Your Experience
                  </Typography>

                  <Box sx={{ mb: 3 }}>
                    <Rating
                      value={rating}
                      onChange={(event, newValue) => {
                        setRating(newValue);
                      }}
                      size="large"
                      sx={{
                        '& .MuiRating-iconFilled': {
                          color: '#f59e0b',
                        },
                        '& .MuiRating-iconHover': {
                          color: '#f59e0b',
                        },
                      }}
                    />
                  </Box>

                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Your Feedback"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    required
                    sx={{ mb: 3 }}
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<SendIcon />}
                    disabled={!rating || !comment}
                    sx={{
                      backgroundColor: theme.palette.primary.main,
                      '&:hover': {
                        backgroundColor: theme.palette.primary.dark,
                      },
                    }}
                  >
                    Submit Feedback
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{ 
              backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : 'white',
              color: theme.palette.text.primary,
              borderRadius: '12px',
              border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
              transition: 'transform 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)',
              },
            }}>
              <Box sx={{ 
                p: 2, 
                display: 'flex', 
                alignItems: 'center',
                borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
              }}>
                <FeedbackIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                <Typography 
                  variant="h6" 
                  sx={{ 
                    color: theme.palette.text.primary,
                    fontFamily: "'Poppins', sans-serif",
                    fontWeight: 500,
                  }}
                >
                  Submitted Feedback
                </Typography>
              </Box>
              <List sx={{ p: 0 }}>
                {feedbackList.length > 0 ? (
                  feedbackList.map((item, index) => (
                    <React.Fragment key={index}>
                      {index > 0 && <Divider />}
                      <ListItem 
                        sx={{
                          '&:hover': {
                            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                          },
                        }}
                      >
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <Rating value={item.rating} readOnly size="small" sx={{ mr: 1 }} />
                              <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                                {new Date(item.date).toLocaleDateString()}
                              </Typography>
                            </Box>
                          }
                          secondary={
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: theme.palette.text.secondary,
                                fontFamily: "'Poppins', sans-serif",
                              }}
                            >
                              {item.comment}
                            </Typography>
                          }
                        />
                      </ListItem>
                    </React.Fragment>
                  ))
                ) : (
                  <ListItem>
                    <ListItemText
                      primary={
                        <Typography 
                          sx={{ 
                            color: theme.palette.text.secondary,
                            fontFamily: "'Poppins', sans-serif",
                            textAlign: 'center',
                          }}
                        >
                          No feedback submitted yet
                        </Typography>
                      }
                    />
                  </ListItem>
                )}
              </List>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default Feedback;
