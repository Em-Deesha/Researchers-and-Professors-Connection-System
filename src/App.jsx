import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Routes, Route, Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, query, onSnapshot, addDoc, serverTimestamp, where, arrayUnion, arrayRemove, getDocs, deleteDoc, orderBy, limit as limitFn } from 'firebase/firestore';
import { User, GraduationCap, Globe, BookOpen, Send, Loader2, LogOut, CheckCheck, MessageSquare, Heart, Edit2, Clock, Search, Zap, XCircle, Bell, BellRing, Users, ArrowLeft, FileText, Brain, Share2, UserPlus, UserCheck, UserX, MoreVertical, Trash2, Mail, Phone, MapPin, Paperclip, Image as ImageIcon, Plus } from 'lucide-react';

// --- Import Firebase Configuration ---
import { firebaseConfig, appId } from './firebase-config.js';

// --- Import Floating Chatbot Component ---
import ProfileChatAssistant from './components/floating-chatbot/ProfileChatAssistant.jsx';

// --- Utility Functions ---

// Helper function to format Firestore Timestamp
const formatTimestamp = (timestamp) => {
  if (!timestamp || !timestamp.toDate) return 'Just now';
  const date = timestamp.toDate();
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// --- Post Creator Component (Enhanced) ---
const PostCreator = ({ db, userId, userName, userTitle, onPostCreated }) => {
  const [postContent, setPostContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [postType, setPostType] = useState('text'); // 'text', 'image', 'document'
  
  if (!db || !userId) return null;

  const postsCollection = collection(db, `artifacts/${appId}/public/data/posts`);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (postContent.trim() === '' && selectedFiles.length === 0) return;

    setIsSubmitting(true);
    setMessage('');

    try {
      // Convert files to base64 for storage
      const fileData = await Promise.all(
        selectedFiles.map(async (file) => ({
          name: file.name,
          type: file.type,
          size: file.size,
          data: await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(file);
          })
        }))
      );

      const postData = {
        authorId: userId,
        authorName: userName || 'Anonymous Researcher',
        authorTitle: userTitle || 'Academic Member',
        content: postContent,
        files: fileData,
        postType: postType,
        timestamp: serverTimestamp(), 
        likes: 0,
        comments: [],
        isEdited: false,
      };
      
      await addDoc(postsCollection, postData);
      
      setPostContent('');
      setSelectedFiles([]);
      setPostType('text');
      setMessage('Post published successfully!');
      onPostCreated();
    } catch (error) {
      console.error('Error adding post:', error);
      setMessage(`Error publishing post: ${error.message}`);
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg mb-6 border border-gray-100">
      <h3 className="text-xl font-semibold text-indigo-700 mb-4 flex items-center">
        <BookOpen className="w-5 h-5 mr-2" /> Share Your Research
      </h3>
      <form onSubmit={handleSubmit}>
        {/* Post Type Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Post Type</label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="postType"
                value="text"
                checked={postType === 'text'}
                onChange={(e) => setPostType(e.target.value)}
                className="mr-2"
              />
              Text Post
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="postType"
                value="image"
                checked={postType === 'image'}
                onChange={(e) => setPostType(e.target.value)}
                className="mr-2"
              />
              Image/Media
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="postType"
                value="document"
                checked={postType === 'document'}
                onChange={(e) => setPostType(e.target.value)}
                className="mr-2"
              />
              Document
            </label>
          </div>
        </div>

        {/* Content Textarea */}
        <textarea
          value={postContent}
          onChange={(e) => setPostContent(e.target.value)}
          rows="3"
          placeholder="What new discovery or collaboration opportunity are you working on today?"
          className="w-full rounded-lg border border-gray-300 p-3 mb-3 focus:border-indigo-500 focus:ring-indigo-500 transition duration-150"
          disabled={isSubmitting}
        />

        {/* File Upload */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Attach Files</label>
          <input
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx"
            onChange={handleFileSelect}
            className="w-full p-2 border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-indigo-500"
            disabled={isSubmitting}
          />
          
          {/* Selected Files Preview */}
          {selectedFiles.length > 0 && (
            <div className="mt-2 space-y-2">
              <p className="text-sm text-gray-600">Selected files:</p>
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                  <span className="text-sm text-gray-700">{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center">
          <button
            type="submit"
            disabled={isSubmitting || (postContent.trim() === '' && selectedFiles.length === 0)}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition duration-150 disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : <Send className="w-5 h-5 mr-2" />}
            Publish Post
          </button>
          {message && <p className={`text-sm ${message.includes('Error') ? 'text-red-500' : 'text-green-600'}`}>{message}</p>}
        </div>
      </form>
    </div>
  );
};

// --- Posts Feed Component (Enhanced) ---
const PostsFeed = ({ db, isAuthReady, userId, onSendNotification }) => {
  const [posts, setPosts] = useState([]);
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);
  const [expandedComments, setExpandedComments] = useState({});
  const [newComments, setNewComments] = useState({});
  const [followingStatus, setFollowingStatus] = useState({}); // Track who user is following
  const [followRequests, setFollowRequests] = useState({}); // Track pending follow requests
  const [sharedPosts, setSharedPosts] = useState({}); // Track shared posts for feedback
  const [openDropdowns, setOpenDropdowns] = useState({}); // Track which post dropdown is open

  const fetchPosts = useCallback(() => {
    if (!db || !isAuthReady) return;
    
    setIsLoadingFeed(true);
    const postsCollectionRef = collection(db, `artifacts/${appId}/public/data/posts`);
    const postsQuery = query(postsCollectionRef);
    
    const unsubscribe = onSnapshot(postsQuery, (snapshot) => {
      const fetchedPosts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Client-side sorting by timestamp (descending)
      fetchedPosts.sort((a, b) => {
        if (!a.timestamp) return 1;
        if (!b.timestamp) return -1;
        return b.timestamp.toMillis() - a.timestamp.toMillis();
      });
      
      setPosts(fetchedPosts);
      setIsLoadingFeed(false);
    }, (error) => {
      console.error("Error fetching posts:", error);
      setIsLoadingFeed(false);
    });

    return unsubscribe;
  }, [db, isAuthReady]);

  useEffect(() => {
    return fetchPosts();
  }, [fetchPosts]);

  // Fetch follow relationships
  useEffect(() => {
    if (!db || !userId || !isAuthReady) return;

    const fetchFollowStatus = async () => {
      try {
        // Fetch user's following list
        const userFollowRef = doc(db, `artifacts/${appId}/public/data/users/${userId}/follows`, userId);
        const followSnap = await getDoc(userFollowRef);
        
        if (followSnap.exists()) {
          const followData = followSnap.data();
          const following = followData.following || [];
          const statusMap = {};
          following.forEach((followedId) => {
            statusMap[followedId] = 'following';
          });
          setFollowingStatus(statusMap);
        }

        // Fetch pending follow requests sent by current user
        const followRequestsRef = collection(db, `artifacts/${appId}/public/data/followRequests`);
        const sentRequestsQuery = query(followRequestsRef, where('followerId', '==', userId), where('status', '==', 'pending'));
        const sentRequestsSnap = await getDocs(sentRequestsQuery);
        
        const requestsMap = {};
        sentRequestsSnap.docs.forEach((doc) => {
          const data = doc.data();
          requestsMap[data.followedId] = 'pending';
        });
        setFollowRequests(requestsMap);
      } catch (error) {
        console.error('Error fetching follow status:', error);
      }
    };

    fetchFollowStatus();
  }, [db, userId, isAuthReady]);

  const handleLike = async (postId, currentLikes) => {
    if (!db || !userId) return;
    
    try {
      const postRef = doc(db, `artifacts/${appId}/public/data/posts`, postId);
      await setDoc(postRef, {
        likes: currentLikes + 1,
        likedBy: arrayUnion(userId)
      }, { merge: true });
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleComment = async (postId) => {
    if (!db || !userId || !newComments[postId]?.trim()) return;
    
    try {
      const postRef = doc(db, `artifacts/${appId}/public/data/posts`, postId);
      const newComment = {
        id: Date.now().toString(),
        authorId: userId,
        authorName: 'You', // This should be fetched from user profile
        text: newComments[postId],
        timestamp: serverTimestamp()
      };
      
      await setDoc(postRef, {
        comments: arrayUnion(newComment)
      }, { merge: true });
      
      setNewComments(prev => ({ ...prev, [postId]: '' }));
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const toggleComments = (postId) => {
    setExpandedComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  // Share post functionality
  const handleShare = async (postId, authorName, content) => {
    try {
      const postUrl = `${window.location.origin}/feed?post=${postId}`;
      const shareText = `${authorName}: ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`;
      
      if (navigator.share) {
        await navigator.share({
          title: `Post by ${authorName}`,
          text: shareText,
          url: postUrl
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(`${shareText}\n${postUrl}`);
        setSharedPosts(prev => ({ ...prev, [postId]: true }));
        setTimeout(() => {
          setSharedPosts(prev => ({ ...prev, [postId]: false }));
        }, 2000);
      }
    } catch (error) {
      // User cancelled share or error occurred
      if (error.name !== 'AbortError') {
        console.error('Error sharing post:', error);
      }
    }
  };

  // Follow user functionality
  const handleFollow = async (authorId, authorName) => {
    if (!db || !userId || !authorId || authorId === userId) return;

    try {
      // Create follow request
      const followRequestsRef = collection(db, `artifacts/${appId}/public/data/followRequests`);
      const existingRequestQuery = query(
        followRequestsRef,
        where('followerId', '==', userId),
        where('followedId', '==', authorId)
      );
      const existingSnap = await getDocs(existingRequestQuery);

      if (!existingSnap.empty) {
        // Request already exists
        return;
      }

      // Create new follow request
      await addDoc(followRequestsRef, {
        followerId: userId,
        followedId: authorId,
        status: 'pending',
        createdAt: serverTimestamp()
      });

      // Update local state
      setFollowRequests(prev => ({ ...prev, [authorId]: 'pending' }));

      // Get current user's name for notification - check all collections
      let currentUserName = 'Someone';
      try {
        // Check users collection
        const currentUserRef = doc(db, `artifacts/${appId}/public/data/users`, userId);
        const currentUserSnap = await getDoc(currentUserRef);
        if (currentUserSnap.exists()) {
          currentUserName = currentUserSnap.data().name || 'Someone';
        } else {
          // Check professors collection
          const profRef = doc(db, `artifacts/${appId}/public/data/professors`, userId);
          const profSnap = await getDoc(profRef);
          if (profSnap.exists()) {
            currentUserName = profSnap.data().name || 'Someone';
          } else {
            // Check students collection
            const studentRef = doc(db, `artifacts/${appId}/public/data/students`, userId);
            const studentSnap = await getDoc(studentRef);
            if (studentSnap.exists()) {
              currentUserName = studentSnap.data().name || 'Someone';
            }
          }
        }
      } catch (error) {
        console.error('Error fetching user name for notification:', error);
      }

      // Send notification to the user being followed
      if (onSendNotification && typeof onSendNotification === 'function') {
        try {
          await onSendNotification({
            recipientId: authorId,
            senderId: userId,
            senderName: currentUserName,
            type: 'follow_request',
            title: 'New Follow Request',
            message: `${currentUserName} wants to follow you`,
            followRequestId: '', // Will be set after doc creation
            timestamp: serverTimestamp()
          });
        } catch (error) {
          console.error('Error sending notification via callback:', error);
        }
      }

      // Also create notification document directly
      const notificationsRef = collection(db, `artifacts/${appId}/public/data/notifications`);
      await addDoc(notificationsRef, {
        recipientId: authorId,
        senderId: userId,
        senderName: currentUserName,
        type: 'follow_request',
        title: 'New Follow Request',
        message: `${currentUserName} wants to follow you`,
        status: 'pending',
        isRead: false,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Error sending follow request:', error);
    }
  };

  // Unfollow user functionality
  const handleUnfollow = async (authorId) => {
    if (!db || !userId || !authorId) return;

    try {
      // Remove from following list
      const userFollowRef = doc(db, `artifacts/${appId}/public/data/users/${userId}/follows`, userId);
      const followSnap = await getDoc(userFollowRef);
      
      if (followSnap.exists()) {
        const followData = followSnap.data();
        const following = (followData.following || []).filter(id => id !== authorId);
        await setDoc(userFollowRef, {
          following: following
        }, { merge: true });
      }

      // Update local state
      setFollowingStatus(prev => {
        const updated = { ...prev };
        delete updated[authorId];
        return updated;
      });
    } catch (error) {
      console.error('Error unfollowing user:', error);
    }
  };

  const getFollowStatus = (authorId) => {
    if (!authorId) return 'not_following';
    if (followRequests[authorId] === 'pending') return 'pending';
    if (followingStatus[authorId] === 'following') return 'following';
    return 'not_following';
  };

  // Toggle dropdown menu
  const toggleDropdown = (postId, e) => {
    e?.stopPropagation();
    setOpenDropdowns(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.post-dropdown') && !event.target.closest('.post-dropdown-toggle')) {
        setOpenDropdowns({});
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Delete post functionality
  const handleDeletePost = async (postId) => {
    if (!db || !userId || !postId) return;
    
    if (!window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    try {
      const postRef = doc(db, `artifacts/${appId}/public/data/posts`, postId);
      await deleteDoc(postRef);
      // Close dropdown
      setOpenDropdowns(prev => {
        const updated = { ...prev };
        delete updated[postId];
        return updated;
      });
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post. Please try again.');
    }
  };

  if (!isAuthReady) {
    return <p className="text-center p-8 text-gray-500">Awaiting authentication...</p>;
  }

  if (isLoadingFeed) {
    return (
      <div className="flex justify-center items-center p-10">
        <Loader2 className="animate-spin h-6 w-6 text-indigo-500 mr-2" />
        <p className="text-gray-600">Loading academic feed...</p>
      </div>
    );
  }

  if (posts.length === 0) {
    return <p className="text-center p-8 text-gray-500 bg-white rounded-xl shadow-lg">No posts yet. Be the first to share an update!</p>;
  }

  return (
    <div className="space-y-6">
      {posts.map(post => {
        if (!post || !post.id) return null;
        const followStatus = post.authorId && post.authorId !== userId ? getFollowStatus(post.authorId) : null;
        const isShared = sharedPosts[post.id];
        
        return (
        <div key={post.id} className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-100 overflow-hidden group">
          {/* Enhanced Header */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 border-b border-gray-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center flex-1">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg mr-4 shadow-md">
                  {post.authorName?.[0] || 'A'}
            </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <p className="font-bold text-lg text-gray-900">{post.authorName}</p>
                    {followStatus === 'following' && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                        Following
                      </span>
                    )}
                    {followStatus === 'pending' && (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
                        Request Sent
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-indigo-600 font-medium">{post.authorTitle}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {post.authorId && post.authorId !== userId && (
                  <>
                    {followStatus === 'following' ? (
                      <button
                        onClick={() => handleUnfollow(post.authorId)}
                        className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all shadow-sm"
                      >
                        <UserCheck className="w-4 h-4 mr-2" /> Following
                      </button>
                    ) : followStatus === 'pending' ? (
                      <button
                        disabled
                        className="flex items-center px-4 py-2 bg-yellow-100 text-yellow-700 font-semibold rounded-xl cursor-not-allowed shadow-sm"
                      >
                        <UserPlus className="w-4 h-4 mr-2" /> Request Sent
                      </button>
                    ) : (
                      <button
                        onClick={() => handleFollow(post.authorId, post.authorName)}
                        className="flex items-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg transform hover:scale-105"
                      >
                        <UserPlus className="w-4 h-4 mr-2" /> Follow
                      </button>
                    )}
                  </>
                )}
                <div className="text-xs text-gray-500 flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {formatTimestamp(post.timestamp)}
                </div>
                {/* 3-dots menu for post owner */}
                {post.authorId === userId && (
                  <div className="relative post-dropdown">
                    <button
                      onClick={(e) => toggleDropdown(post.id, e)}
                      className="post-dropdown-toggle p-2 rounded-lg hover:bg-gray-100 transition-all text-gray-500 hover:text-gray-700"
                      title="More options"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                    {openDropdowns[post.id] && (
                      <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50">
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            await handleDeletePost(post.id);
                          }}
                          className="w-full flex items-center px-4 py-3 text-red-600 hover:bg-red-50 transition-all text-left"
                        >
                          <Trash2 className="w-4 h-4 mr-3" />
                          <span className="font-medium">Delete Post</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Post Content */}
          <div className="p-6">
            <p className="text-gray-700 whitespace-pre-wrap mb-4 text-base leading-relaxed">{post.content}</p>
          
          {/* File Attachments */}
          {post.files && post.files.length > 0 && (
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Attachments:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {post.files.map((file, index) => (
                  <div key={index} className="border rounded-lg p-3 bg-gray-50">
                    {file.type.startsWith('image/') ? (
                      <div>
                        <img 
                          src={file.data} 
                          alt={file.name}
                          className="max-w-full h-48 object-cover rounded"
                        />
                        <p className="text-sm text-gray-600 mt-2">{file.name}</p>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-indigo-100 rounded flex items-center justify-center mr-3">
                          <BookOpen className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{file.name}</p>
                          <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Post Type Badge */}
          {post.postType && post.postType !== 'text' && (
            <div className="mb-4">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                {post.postType === 'image' ? '📷 Image Post' : '📄 Document Post'}
              </span>
            </div>
          )}
          
            {/* Enhanced Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="flex items-center gap-4">
            <button 
              onClick={() => handleLike(post.id, post.likes || 0)}
                  className="flex items-center text-indigo-600 hover:text-indigo-700 transition-all duration-150 text-sm font-semibold hover:scale-105"
            >
                  <Heart className="w-5 h-5 mr-1.5" />
                  Like <span className="ml-1">({post.likes || 0})</span>
            </button>
            <button 
              onClick={() => toggleComments(post.id)}
                  className="flex items-center text-gray-600 hover:text-gray-700 transition-all duration-150 text-sm font-semibold hover:scale-105"
            >
                  <MessageSquare className="w-5 h-5 mr-1.5" />
                  Comment <span className="ml-1">({post.comments?.length || 0})</span>
            </button>
              </div>
              <button
                onClick={() => handleShare(post.id, post.authorName, post.content)}
                className={`flex items-center px-4 py-2 rounded-xl font-semibold text-sm transition-all shadow-sm ${
                  isShared 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } hover:scale-105`}
              >
                {isShared ? (
                  <>
                    <CheckCheck className="w-4 h-4 mr-2" /> Copied!
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 mr-2" /> Share
                  </>
                )}
              </button>
            </div>
          </div>
          
          {/* Enhanced Comments Section */}
          {expandedComments[post.id] && (
            <div className="px-6 pb-6 border-t border-gray-200 bg-gray-50">
              <h4 className="text-base font-semibold text-gray-800 mb-4 mt-4 flex items-center">
                <MessageSquare className="w-4 h-4 mr-2 text-indigo-600" />
                Comments ({post.comments?.length || 0})
              </h4>
              
              {/* Existing Comments */}
              {post.comments && post.comments.length > 0 ? (
                <div className="space-y-3 mb-4">
                  {post.comments.map((comment, index) => (
                    <div key={index} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                      <div className="flex items-center mb-2">
                        <span className="text-sm font-semibold text-gray-900">{comment.authorName}</span>
                        <span className="text-xs text-gray-500 ml-2">
                          {comment.timestamp ? formatTimestamp(comment.timestamp) : 'Just now'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">{comment.text}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 mb-4">
                  <p className="text-sm text-gray-500">No comments yet. Be the first to comment!</p>
                </div>
              )}
              
              {/* Enhanced Add Comment Form */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Write a comment..."
                  value={newComments[post.id] || ''}
                  onChange={(e) => setNewComments(prev => ({ ...prev, [post.id]: e.target.value }))}
                  className="flex-1 rounded-xl border-2 border-gray-200 p-3 text-sm focus:border-indigo-500 focus:ring-indigo-500 transition-all"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && newComments[post.id]?.trim()) {
                      handleComment(post.id);
                    }
                  }}
                />
                <button
                  onClick={() => handleComment(post.id)}
                  disabled={!newComments[post.id]?.trim()}
                  className="px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 shadow-md hover:shadow-lg"
                >
                  Post
                </button>
              </div>
            </div>
          )}
        </div>
        );
      })}
    </div>
  );
};


// --- Chat Window Component (Real Firestore) ---
const ChatWindow = ({ db, currentUserId, partner, onEndChat, onSendNotification, currentUserName }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatId, setChatId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Helper to scroll to the bottom of the chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 1. Find or Create Chat Document (Real Firestore)
  useEffect(() => {
    if (!db || !currentUserId || !partner.userId) {
      console.log('🚫 ChatWindow: Missing required data:', { db: !!db, currentUserId, partnerUserId: partner?.userId });
      return;
    }

    console.log('🚀 ChatWindow: Starting chat setup for:', partner);
    setIsLoading(true);
    // Participants array is sorted alphabetically to create a canonical chat ID
    const participants = [currentUserId, partner.userId].sort();
    const chatId = participants.join('_');
    
    console.log('🔍 ChatWindow: Looking for chat with ID:', chatId);
    console.log('🔍 ChatWindow: Chat path:', `artifacts/${appId}/public/data/chats/${chatId}`);
    const chatRef = doc(db, `artifacts/${appId}/public/data/chats`, chatId);

    const unsubscribe = onSnapshot(chatRef, async (doc) => {
      if (doc.exists()) {
        console.log('✅ Found existing chat:', chatId);
        setChatId(chatId);
        setIsLoading(false);
      } else {
        // Chat does not exist, create it
        try {
          await setDoc(chatRef, {
          participants: participants,
          createdAt: serverTimestamp(),
            lastMessage: '',
            lastMessageTime: serverTimestamp(),
            lastMessageSender: ''
          });
          console.log('✅ Created new chat:', chatId);
          setChatId(chatId);
      setIsLoading(false);
        } catch (error) {
          console.error('Error creating chat:', error);
          setIsLoading(false);
        }
      }
    }, (error) => {
      console.error('Error fetching chat:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [db, currentUserId, partner.userId]);

  // 2. Listen for Messages (Real Firestore)
  useEffect(() => {
    if (!db || !chatId) {
      console.log('🚫 Messages: Missing required data:', { db: !!db, chatId });
      return;
    }

    console.log('📨 Messages: Listening for messages in chat:', chatId);
    const messagesCollectionRef = collection(db, `artifacts/${appId}/public/data/chats/${chatId}/messages`);
    console.log('📨 Messages collection path:', `artifacts/${appId}/public/data/chats/${chatId}/messages`);
    const messagesQuery = query(messagesCollectionRef); 

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      console.log('📨 Messages: Received snapshot with', snapshot.docs.length, 'messages');
      const fetchedMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Client-side sorting by timestamp
      fetchedMessages.sort((a, b) => {
        if (!a.timestamp) return 1;
        if (!b.timestamp) return -1;
        return a.timestamp.toMillis() - b.timestamp.toMillis();
      });

      console.log('📨 Messages: Processed messages:', fetchedMessages);
      setMessages(fetchedMessages);
      // Wait for messages to load, then scroll
      setTimeout(scrollToBottom, 100); 
    }, (error) => {
      console.error("📨 Messages: Error fetching messages:", error);
    });

    return () => unsubscribe();
  }, [db, chatId]);

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        setFilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  // Clear selected file
  const clearFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 3. Send Message Handler (Real Firestore) - Updated to support files
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((newMessage.trim() === '' && !selectedFile) || !chatId) {
      console.log('🚫 Cannot send message:', { newMessage: newMessage.trim(), selectedFile: !!selectedFile, chatId });
      return;
    }

    console.log('📤 Sending message:', {
      text: newMessage,
      senderId: currentUserId,
      chatId: chatId,
      partner: partner,
      hasFile: !!selectedFile
    });

    const messagesCollectionRef = collection(db, `artifacts/${appId}/public/data/chats/${chatId}/messages`);
    console.log('📤 Messages collection path:', `artifacts/${appId}/public/data/chats/${chatId}/messages`);
    
    try {
      let fileData = null;
      let fileType = null;
      let fileName = null;

      // Process file if selected
      if (selectedFile) {
        if (selectedFile.type.startsWith('image/')) {
          // Convert image to base64
          const reader = new FileReader();
          fileData = await new Promise((resolve) => {
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(selectedFile);
          });
          fileType = 'image';
          fileName = selectedFile.name;
        } else {
          // For non-image files, convert to base64 (for small files)
          const reader = new FileReader();
          fileData = await new Promise((resolve) => {
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(selectedFile);
          });
          fileType = 'file';
          fileName = selectedFile.name;
        }
      }

      // Send the message
      const messageData = {
        senderId: currentUserId,
        text: newMessage || '',
        timestamp: serverTimestamp(),
      };

      if (fileData) {
        messageData.file = fileData;
        messageData.fileType = fileType;
        messageData.fileName = fileName;
        messageData.fileSize = selectedFile.size;
      }

      const messageDoc = await addDoc(messagesCollectionRef, messageData);
      
      console.log('✅ Message sent successfully:', messageDoc.id);

      // Update chat with last message info
      const lastMessageText = selectedFile 
        ? (newMessage || `Sent ${selectedFile.type.startsWith('image/') ? 'an image' : 'a file'}: ${selectedFile.name}`)
        : newMessage;

      const chatRef = doc(db, `artifacts/${appId}/public/data/chats`, chatId);
      await setDoc(chatRef, {
        lastMessage: lastMessageText,
        lastMessageTime: serverTimestamp(),
        lastMessageSender: currentUserId
      }, { merge: true });

      // Create notification for the recipient
      if (onSendNotification && partner.userId) {
        // Use passed currentUserName or fallback
        const senderName = currentUserName || 'Someone';
        
        console.log('📨 Creating notification for:', {
          recipientId: partner.userId,
          senderId: currentUserId,
          senderName: senderName,
          message: lastMessageText
        });
        
        await onSendNotification({
          recipientId: partner.userId,
          senderId: currentUserId,
          senderName: senderName,
          type: 'message',
          title: 'New Message',
          message: `${senderName} sent you a message: "${lastMessageText}"`,
          chatId: chatId,
          timestamp: serverTimestamp()
        });
      }

      // Clear message and file
      setNewMessage('');
      clearFile();
    } catch (error) {
      console.error("Error sending message:", error);
      alert('Failed to send message. Please try again.');
    }
  };


  if (isLoading || !chatId) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px] bg-gray-100 rounded-xl">
        <Loader2 className="animate-spin h-6 w-6 text-indigo-500 mr-2" />
        <p className="text-gray-600">Setting up chat...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Enhanced Header */}
      <div className="p-5 border-b bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-md">
            <span className="text-lg font-bold text-indigo-600">
              {partner.name?.charAt(0) || 'U'}
            </span>
          </div>
          <h3 className="font-bold text-lg text-white flex items-center">
            {partner.name || 'Unknown User'}
        </h3>
        </div>
        <button 
          onClick={onEndChat} 
          className="text-white hover:bg-white/20 rounded-full p-2 transition-all"
          title="Close chat"
        >
          <XCircle className="w-6 h-6" />
        </button>
      </div>

      {/* Enhanced Message Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-gradient-to-b from-gray-50 to-white">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-indigo-400" />
              </div>
              <p className="text-xl font-semibold text-gray-700 mb-2">No messages yet</p>
              <p className="text-sm text-gray-500">Start the conversation!</p>
            </div>
          </div>
        ) : (
          messages.map((msg, index) => {
            console.log('📨 Rendering message:', msg);
            const isOwnMessage = msg.senderId === currentUserId;
            return (
          <div key={index} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs sm:max-w-md px-4 py-3 rounded-2xl shadow-md text-sm ${
              isOwnMessage 
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-none' 
                : 'bg-white text-gray-800 rounded-tl-none border border-gray-200'
            }`}>
              {/* Display file/image if present */}
              {msg.file && (
                <div className="mb-2">
                  {msg.fileType === 'image' ? (
                    <img 
                      src={msg.file} 
                      alt={msg.fileName || 'Shared image'} 
                      className="max-w-full rounded-lg mb-2 cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => {
                        // Open image in new window for full view
                        const newWindow = window.open();
                        newWindow.document.write(`<img src="${msg.file}" style="max-width: 100%; height: auto;" />`);
                      }}
                    />
                  ) : (
                    <div className={`p-3 rounded-lg border-2 border-dashed mb-2 ${
                      isOwnMessage ? 'bg-white/10 border-white/30' : 'bg-gray-50 border-gray-300'
                    }`}>
                      <div className="flex items-center gap-2">
                        <FileText className={`w-5 h-5 ${isOwnMessage ? 'text-white' : 'text-indigo-600'}`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${isOwnMessage ? 'text-white' : 'text-gray-900'}`}>
                            {msg.fileName || 'File'}
                          </p>
                          {msg.fileSize && (
                            <p className={`text-xs ${isOwnMessage ? 'text-white/80' : 'text-gray-500'}`}>
                              {(msg.fileSize / 1024).toFixed(1)} KB
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {/* Display text message */}
              {msg.text && (
                <p className="leading-relaxed">{msg.text}</p>
              )}
              <span className={`text-xs mt-2 block ${
                isOwnMessage ? 'opacity-80' : 'text-gray-500'
              }`}>
                    {msg.timestamp ? 
                      (msg.timestamp.toDate ? 
                        msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) :
                        new Date(msg.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      ) : 'Just now'}
              </span>
            </div>
          </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Enhanced Input Area */}
      <form onSubmit={handleSendMessage} className="border-t bg-white">
        {/* File Preview */}
        {selectedFile && (
          <div className="p-3 border-b bg-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {filePreview ? (
                <img 
                  src={filePreview} 
                  alt="Preview" 
                  className="w-16 h-16 object-cover rounded-lg"
                />
              ) : (
                <div className="w-16 h-16 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-8 h-8 text-indigo-600" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-gray-500">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                  {selectedFile.type.startsWith('image/') && ' • Image'}
                </p>
              </div>
              <button
                type="button"
                onClick={clearFile}
                className="text-gray-400 hover:text-red-500 transition-colors"
                title="Remove file"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
        <div className="p-5 flex gap-3">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf,.doc,.docx,.txt"
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload-input"
          />
          {/* File upload button */}
          <label
            htmlFor="file-upload-input"
            className="px-4 py-4 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl hover:from-gray-200 hover:to-gray-300 transition-all shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center"
            title="Attach file or image"
          >
            <Paperclip className="w-5 h-5" />
          </label>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={selectedFile ? "Add a message (optional)..." : "Type your message..."}
            className="flex-1 rounded-xl border-2 border-gray-200 p-4 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || (newMessage.trim() === '' && !selectedFile)}
            className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 shadow-lg hover:shadow-xl flex items-center justify-center"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
};

// --- Chat List Component ---
const ChatList = ({ db, currentUserId, onSelectChat, onBack }) => {
  const [chats, setChats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userProfiles, setUserProfiles] = useState({});
  const [profilesLoading, setProfilesLoading] = useState(false);

  // Fetch user profiles for chat participants
  useEffect(() => {
    if (!db || !currentUserId || chats.length === 0) return;

    const fetchUserProfiles = async (userIds) => {
      console.log('🔍 Fetching profiles for user IDs:', userIds);
      setProfilesLoading(true);
      const profiles = {};
      
      for (const userId of userIds) {
        if (userId === currentUserId) continue;
        
        try {
          // Try professors collection first
          const professorRef = doc(db, `artifacts/${appId}/public/data/professors`, userId);
          const professorSnap = await getDoc(professorRef);
          
          if (professorSnap.exists()) {
            const data = professorSnap.data();
            profiles[userId] = { ...data, userId, userType: 'professor' };
            console.log(`✅ Found professor profile for ${userId}:`, data.name);
            continue;
          }
          
          // Try students collection
          const studentRef = doc(db, `artifacts/${appId}/public/data/students`, userId);
          const studentSnap = await getDoc(studentRef);
          
          if (studentSnap.exists()) {
            const data = studentSnap.data();
            profiles[userId] = { ...data, userId, userType: 'student' };
            console.log(`✅ Found student profile for ${userId}:`, data.name);
            continue;
          }
          
          // Fallback to users collection
          const userRef = doc(db, `artifacts/${appId}/public/data/users`, userId);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            const data = userSnap.data();
            profiles[userId] = { ...data, userId };
            console.log(`✅ Found user profile for ${userId}:`, data.name);
          } else {
            console.log(`❌ No profile found for ${userId} in any collection`);
          }
        } catch (error) {
          console.error(`Error fetching profile for ${userId}:`, error);
        }
      }
      
      console.log('📊 Final profiles:', profiles);
      setUserProfiles(profiles);
      setProfilesLoading(false);
    };

    // Get all unique user IDs from chats
    const allUserIds = new Set();
    chats.forEach(chat => {
      console.log('📝 Chat participants:', chat.participants);
      chat.participants.forEach(participant => allUserIds.add(participant));
    });
    
    console.log('👥 All unique user IDs:', Array.from(allUserIds));
    
    if (allUserIds.size > 0) {
      fetchUserProfiles(Array.from(allUserIds));
    }
  }, [db, currentUserId, chats]);

  // Listen for user's chats
  useEffect(() => {
    if (!db || !currentUserId) return;

    setIsLoading(true);
    
    const chatsCollectionRef = collection(db, `artifacts/${appId}/public/data/chats`);
    const userChatsQuery = query(chatsCollectionRef, where('participants', 'array-contains', currentUserId));

    const unsubscribe = onSnapshot(userChatsQuery, (snapshot) => {
      const userChats = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log('💬 Loaded chats:', userChats.length);
      userChats.forEach(chat => {
        console.log(`📝 Chat ${chat.id}:`, {
          participants: chat.participants,
          lastMessage: chat.lastMessage,
          lastMessageTime: chat.lastMessageTime
        });
      });

      // Sort chats by last message timestamp
      userChats.sort((a, b) => {
        const aTime = a.lastMessageTime?.toMillis() || a.createdAt?.toMillis() || 0;
        const bTime = b.lastMessageTime?.toMillis() || b.createdAt?.toMillis() || 0;
        return bTime - aTime;
      });

      setChats(userChats);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching chats:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [db, currentUserId]);

  // Get the other participant in a chat
  const getOtherParticipant = (chat) => {
    return chat.participants.find(participant => participant !== currentUserId);
  };

  // Format last message time
  const formatLastMessageTime = (timestamp) => {
    if (!timestamp) return '';
    
    const now = new Date();
    const messageTime = timestamp.toDate();
    const diffInHours = (now - messageTime) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return messageTime.toLocaleDateString();
    }
  };

  if (isLoading || profilesLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px] bg-gray-100 rounded-xl">
        <Loader2 className="animate-spin h-6 w-6 text-indigo-500 mr-2" />
        <p className="text-gray-600">
          {isLoading ? 'Loading chats...' : 'Loading user profiles...'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-xl shadow-2xl border border-gray-100">
      {/* Header */}
      <div className="p-4 border-b bg-indigo-50 rounded-t-xl flex items-center justify-between">
        <div className="flex items-center">
          <button onClick={onBack} className="mr-3 text-gray-600 hover:text-gray-800 transition">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h3 className="font-bold text-lg text-indigo-700 flex items-center">
            <MessageSquare className="w-5 h-5 mr-2" /> Recent Chats
          </h3>
        </div>
        <div className="text-sm text-gray-600">
          {chats.length} conversation{chats.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <MessageSquare className="w-12 h-12 mb-4 text-gray-300" />
            <p className="text-lg font-medium">No conversations yet</p>
            <p className="text-sm">Start a conversation from the Matchmaker tab</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {chats
              .filter((chat) => {
                const otherUserId = getOtherParticipant(chat);
                return userProfiles[otherUserId]; // Only show chats where we have the user profile
              })
              .map((chat) => {
                const otherUserId = getOtherParticipant(chat);
                const otherUser = userProfiles[otherUserId];
                
                return (
                  <button
                    key={chat.id}
                    onClick={() => onSelectChat(otherUser)}
                    className="w-full p-4 hover:bg-gray-50 transition text-left"
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-indigo-600">
                          {otherUser.name?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div className="ml-3 flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-gray-900 truncate">
                            {otherUser.name || 'Unknown User'}
                          </p>
                          <span className="text-xs text-gray-500">
                            {formatLastMessageTime(chat.lastMessageTime)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-sm text-gray-500 truncate">
                            {chat.lastMessage || 'No messages yet'}
                          </p>
                          {chat.unreadCount > 0 && (
                            <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                              {chat.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            
            {/* Show message if all chats have unknown users */}
            {chats.length > 0 && chats.every((chat) => {
              const otherUserId = getOtherParticipant(chat);
              return !userProfiles[otherUserId];
            }) && (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
                <User className="w-12 h-12 mb-4 text-gray-300" />
                <p className="text-lg font-medium">No valid conversations found</p>
                <p className="text-sm">User profiles may not be available</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// --- Notification Component ---
const NotificationCenter = ({ db, currentUserId, notifications, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    if (!db || !notificationId) return;
    
    try {
      const notificationRef = doc(db, `artifacts/${appId}/public/data/notifications`, notificationId);
      await setDoc(notificationRef, {
        isRead: true,
        readAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!db || !currentUserId) return;
    
    setIsLoading(true);
    try {
      const unreadNotifications = notifications.filter(n => !n.isRead);
      
      for (const notification of unreadNotifications) {
        await markAsRead(notification.id);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[600px] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b bg-indigo-50 rounded-t-xl flex items-center justify-between">
          <h3 className="font-bold text-lg text-indigo-700 flex items-center">
            <Bell className="w-5 h-5 mr-2" /> Notifications
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 ml-2">
                {unreadCount}
              </span>
            )}
          </h3>
          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                disabled={isLoading}
                className="text-sm text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
              >
                Mark all read
              </button>
            )}
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
              <Bell className="w-12 h-12 mb-4 text-gray-300" />
              <p className="text-lg font-medium">No notifications</p>
              <p className="text-sm">You're all caught up!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 transition ${
                    !notification.isRead ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      {notification.type === 'message' ? (
                        <MessageSquare className="w-5 h-5 text-blue-500" />
                      ) : notification.type === 'follow_request' ? (
                        <UserPlus className="w-5 h-5 text-purple-500" />
                      ) : (
                        <Bell className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {notification.timestamp?.toDate().toLocaleString()}
                      </p>
                      
                      {/* Accept/Reject buttons for follow requests */}
                      {notification.type === 'follow_request' && notification.status === 'pending' && (
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={async () => {
                              // Accept follow request
                              if (!db || !notification.senderId || !notification.recipientId) return;
                              
                              try {
                                // Update follow request status
                                const followRequestsRef = collection(db, `artifacts/${appId}/public/data/followRequests`);
                                const requestQuery = query(
                                  followRequestsRef,
                                  where('followerId', '==', notification.senderId),
                                  where('followedId', '==', notification.recipientId || currentUserId),
                                  where('status', '==', 'pending')
                                );
                                const requestSnap = await getDocs(requestQuery);
                                
                                if (!requestSnap.empty) {
                                  const requestDoc = requestSnap.docs[0];
                                  await setDoc(requestDoc.ref, {
                                    status: 'accepted',
                                    respondedAt: serverTimestamp()
                                  }, { merge: true });

                                  // Add to following list of the person who requested
                                  const userFollowRef = doc(db, `artifacts/${appId}/public/data/users/${notification.senderId}/follows`, notification.senderId);
                                  const followSnap = await getDoc(userFollowRef);
                                  
                                  if (followSnap.exists()) {
                                    await setDoc(userFollowRef, {
                                      following: arrayUnion(notification.recipientId || currentUserId)
                                    }, { merge: true });
                                  } else {
                                    await setDoc(userFollowRef, {
                                      following: [notification.recipientId || currentUserId]
                                    });
                                  }

                                  // Update notification
                                  await markAsRead(notification.id);
                                  const notificationRef = doc(db, `artifacts/${appId}/public/data/notifications`, notification.id);
                                  await setDoc(notificationRef, {
                                    status: 'accepted',
                                    isRead: true
                                  }, { merge: true });
                                }
                              } catch (error) {
                                console.error('Error accepting follow request:', error);
                              }
                            }}
                            className="px-3 py-1.5 bg-green-500 text-white text-xs font-semibold rounded-lg hover:bg-green-600 transition-all flex items-center"
                          >
                            <UserCheck className="w-3 h-3 mr-1" /> Accept
                          </button>
                          <button
                            onClick={async () => {
                              // Reject follow request
                              if (!db || !notification.senderId || !notification.recipientId) return;
                              
                              try {
                                // Update follow request status
                                const followRequestsRef = collection(db, `artifacts/${appId}/public/data/followRequests`);
                                const requestQuery = query(
                                  followRequestsRef,
                                  where('followerId', '==', notification.senderId),
                                  where('followedId', '==', notification.recipientId || currentUserId),
                                  where('status', '==', 'pending')
                                );
                                const requestSnap = await getDocs(requestQuery);
                                
                                if (!requestSnap.empty) {
                                  const requestDoc = requestSnap.docs[0];
                                  await setDoc(requestDoc.ref, {
                                    status: 'rejected',
                                    respondedAt: serverTimestamp()
                                  }, { merge: true });

                                  // Update notification
                                  await markAsRead(notification.id);
                                  const notificationRef = doc(db, `artifacts/${appId}/public/data/notifications`, notification.id);
                                  await setDoc(notificationRef, {
                                    status: 'rejected',
                                    isRead: true
                                  }, { merge: true });
                                }
                              } catch (error) {
                                console.error('Error rejecting follow request:', error);
                              }
                            }}
                            className="px-3 py-1.5 bg-red-500 text-white text-xs font-semibold rounded-lg hover:bg-red-600 transition-all flex items-center"
                          >
                            <UserX className="w-3 h-3 mr-1" /> Reject
                          </button>
                    </div>
                      )}
                    </div>
                    {!notification.isRead && notification.type !== 'follow_request' && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="ml-2 text-xs text-blue-600 hover:text-blue-800"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Chats Manager Component ---
const ChatsManager = ({ db, userId, userName, userType, pendingConversation, onConversationStarted }) => {
  const [activeChat, setActiveChat] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [chats, setChats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userProfiles, setUserProfiles] = useState({});

  // Handle pending conversation from Matchmaker
  useEffect(() => {
    if (pendingConversation && !activeChat) {
      console.log('🚀 Starting pending conversation with:', pendingConversation);
      setActiveChat(pendingConversation);
      // Don't clear pending conversation immediately - let it persist
      // onConversationStarted(); 
    }
  }, [pendingConversation, activeChat]);

  // Handle opening chat from notifications
  useEffect(() => {
    const handleOpenChatFromNotification = (event) => {
      const { partner } = event.detail;
      console.log('🔔 Opening chat from notification:', partner);
      console.log('🔔 Available chats:', chats);
      console.log('🔔 Available user profiles:', userProfiles);
      
      // Try to find the correct chat participant by matching the notification sender
      let correctParticipant = null;
      let matchingChat = null;
      
      // First, try to find by exact userId match
      for (const chat of chats) {
        const otherParticipant = getOtherParticipant(chat);
        if (otherParticipant === partner.userId) {
          const profile = userProfiles[otherParticipant];
          if (profile) {
            correctParticipant = profile;
            matchingChat = chat;
            console.log('✅ Found exact userId match:', profile);
            break;
          }
        }
      }
      
      // If not found, try to find by name match in existing chats
      if (!correctParticipant) {
        for (const chat of chats) {
          const otherParticipant = getOtherParticipant(chat);
          const profile = userProfiles[otherParticipant];
          
          if (profile && profile.name && partner.name) {
            const nameMatch = profile.name.toLowerCase().includes(partner.name.toLowerCase()) ||
                             partner.name.toLowerCase().includes(profile.name.toLowerCase());
            
            if (nameMatch) {
              correctParticipant = profile;
              matchingChat = chat;
              console.log('✅ Found name match:', profile);
              break;
            }
          }
        }
      }
      
      // If still not found, try to find by partial ID match
      if (!correctParticipant) {
        for (const chat of chats) {
          const otherParticipant = getOtherParticipant(chat);
          
          if (otherParticipant.includes(partner.userId) || partner.userId.includes(otherParticipant)) {
            const profile = userProfiles[otherParticipant];
            if (profile) {
              correctParticipant = profile;
              matchingChat = chat;
              console.log('✅ Found partial ID match:', profile);
              break;
            }
          }
        }
      }
      
      // If we found a matching chat, use the actual participant ID from that chat
      const chatPartner = correctParticipant ? {
        userId: getOtherParticipant(matchingChat), // Use the actual chat participant ID
        name: correctParticipant.name,
        userType: correctParticipant.userType || 'unknown'
      } : {
        userId: partner.userId,
        name: partner.name || partner.userId,
        userType: partner.userType || 'unknown'
      };
      
      console.log('🔔 Setting active chat with:', chatPartner);
      setActiveChat(chatPartner);
    };

    const handleMarkNotificationAsRead = (event) => {
      const { notificationId } = event.detail;
      console.log('📖 Marking notification as read:', notificationId);
      markNotificationAsRead(notificationId);
    };

    window.addEventListener('openChatFromNotification', handleOpenChatFromNotification);
    window.addEventListener('markNotificationAsRead', handleMarkNotificationAsRead);
    
    return () => {
      window.removeEventListener('openChatFromNotification', handleOpenChatFromNotification);
      window.removeEventListener('markNotificationAsRead', handleMarkNotificationAsRead);
    };
  }, [chats, userProfiles]);

  // Close dropdown menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.chat-dropdown') && !event.target.closest('button[title="Chat options"]')) {
        document.querySelectorAll('.chat-dropdown').forEach(dropdown => {
          dropdown.classList.add('hidden');
        });
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Listen for user's chats
  useEffect(() => {
    if (!db || !userId) return;

    console.log('🔍 Fetching chats for userId:', userId);
    setIsLoading(true);
    
    const chatsCollectionRef = collection(db, `artifacts/${appId}/public/data/chats`);
    
    // Try the array-contains query first, but also have a fallback
    const userChatsQuery = query(chatsCollectionRef, where('participants', 'array-contains', userId));
    
    // Fallback: get all chats and filter client-side
    const allChatsQuery = query(chatsCollectionRef);

    const unsubscribe = onSnapshot(userChatsQuery, (snapshot) => {
      console.log('📊 Primary query result:', snapshot.docs.length, 'docs');
      
      if (snapshot.docs.length === 0) {
        console.log('🔄 Primary query empty, trying fallback...');
        // Try fallback query
        const unsubscribeFallback = onSnapshot(allChatsQuery, (fallbackSnapshot) => {
          console.log('📊 Fallback query result:', fallbackSnapshot.docs.length, 'docs');
          const allChats = fallbackSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          // Filter client-side
          const userChats = allChats.filter(chat => 
            chat.participants && chat.participants.includes(userId)
          );
          
          console.log('💬 Filtered chats:', userChats.length);
          console.log('💬 All chats:', allChats);
          console.log('💬 User chats:', userChats);
          
          processChats(userChats);
        });
        
        return () => unsubscribeFallback();
      } else {
        processChats(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    }, (error) => {
      console.error("Error fetching chats:", error);
      setIsLoading(false);
    });

    const processChats = (userChats) => {
      console.log('💬 Processing chats:', userChats.length);
      console.log('💬 Chat documents:', userChats);

      // Sort chats: pinned first, then by last message timestamp
      userChats.sort((a, b) => {
        // First, sort by pinned status
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        
        // If both have same pinned status, sort by timestamp
        const aTime = a.lastMessageTime?.toMillis() || a.createdAt?.toMillis() || 0;
        const bTime = b.lastMessageTime?.toMillis() || b.createdAt?.toMillis() || 0;
        return bTime - aTime;
      });

      setChats(userChats);
      setIsLoading(false);
    };

    return () => unsubscribe();
  }, [db, userId]);

  // Fetch user profiles for chat participants
  useEffect(() => {
    if (!db || !userId || chats.length === 0) return;

    const fetchUserProfiles = async (userIds) => {
      console.log('🔍 Fetching profiles for user IDs:', userIds);
      const profiles = {};
      
      for (const participantId of userIds) {
        if (participantId === userId) continue;
        
        try {
          // Check if this is a Firebase UID (long random string) or custom ID
          const isFirebaseUID = participantId.length > 20 && /^[a-zA-Z0-9]+$/.test(participantId);
          
          if (isFirebaseUID) {
            // For Firebase UIDs, check all collections
            let found = false;
            
            // Try users collection first
            const userRef = doc(db, `artifacts/${appId}/public/data/users`, participantId);
            const userSnap = await getDoc(userRef);
            
            if (userSnap.exists()) {
              const data = userSnap.data();
              profiles[participantId] = { ...data, userId: participantId };
              console.log(`✅ Found Firebase user profile in users collection for ${participantId}:`, data.name);
              found = true;
            }
            
            // If not found in users, try professors collection
            if (!found) {
              const professorRef = doc(db, `artifacts/${appId}/public/data/professors`, participantId);
              const professorSnap = await getDoc(professorRef);
              
              if (professorSnap.exists()) {
                const data = professorSnap.data();
                profiles[participantId] = { ...data, userId: participantId, userType: 'professor' };
                console.log(`✅ Found Firebase user profile in professors collection for ${participantId}:`, data.name);
                found = true;
              }
            }
            
            // If still not found, try students collection
            if (!found) {
              const studentRef = doc(db, `artifacts/${appId}/public/data/students`, participantId);
              const studentSnap = await getDoc(studentRef);
              
              if (studentSnap.exists()) {
                const data = studentSnap.data();
                profiles[participantId] = { ...data, userId: participantId, userType: 'student' };
                console.log(`✅ Found Firebase user profile in students collection for ${participantId}:`, data.name);
                found = true;
              }
            }
            
            if (found) continue;
          } else {
              // For custom IDs, try direct lookup first
              // Try professors collection first
              const professorRef = doc(db, `artifacts/${appId}/public/data/professors`, participantId);
              const professorSnap = await getDoc(professorRef);
              
              if (professorSnap.exists()) {
                const data = professorSnap.data();
                profiles[participantId] = { ...data, userId: participantId, userType: 'professor' };
                console.log(`✅ Found professor profile for ${participantId}:`, data.name);
                continue;
              }
              
              // Try students collection
              const studentRef = doc(db, `artifacts/${appId}/public/data/students`, participantId);
              const studentSnap = await getDoc(studentRef);
              
              if (studentSnap.exists()) {
                const data = studentSnap.data();
                profiles[participantId] = { ...data, userId: participantId, userType: 'student' };
                console.log(`✅ Found student profile for ${participantId}:`, data.name);
                continue;
              }
              
              // If direct lookup fails, search all collections for partial matches
              console.log(`🔍 Direct lookup failed for ${participantId}, searching all collections...`);
              
              // Search in professors collection
              const professorsQuery = query(collection(db, `artifacts/${appId}/public/data/professors`));
              const professorsSnapshot = await getDocs(professorsQuery);
              
              console.log(`🔍 Searching ${professorsSnapshot.docs.length} professors for ${participantId}`);
              
              for (const doc of professorsSnapshot.docs) {
                const data = doc.data();
                console.log(`🔍 Checking professor ${doc.id}: name="${data.name}", customId="${data.customId}", userId="${data.userId}"`);
                
                // Check multiple matching criteria
                const nameMatch = data.name && data.name.toLowerCase().includes(participantId.toLowerCase());
                const customIdMatch = data.customId === participantId;
                const userIdMatch = data.userId === participantId;
                const reverseMatch = participantId.toLowerCase().includes(data.name?.toLowerCase() || '');
                
                if (nameMatch || customIdMatch || userIdMatch || reverseMatch) {
                  profiles[participantId] = { ...data, userId: doc.id, userType: 'professor' };
                  console.log(`✅ Found professor profile by search for ${participantId}:`, data.name);
                  break;
                }
              }
              
              if (profiles[participantId]) continue;
              
              // Search in students collection
              const studentsQuery = query(collection(db, `artifacts/${appId}/public/data/students`));
              const studentsSnapshot = await getDocs(studentsQuery);
              
              console.log(`🔍 Searching ${studentsSnapshot.docs.length} students for ${participantId}`);
              
              for (const doc of studentsSnapshot.docs) {
                const data = doc.data();
                console.log(`🔍 Checking student ${doc.id}: name="${data.name}", customId="${data.customId}", userId="${data.userId}"`);
                
                // Check multiple matching criteria
                const nameMatch = data.name && data.name.toLowerCase().includes(participantId.toLowerCase());
                const customIdMatch = data.customId === participantId;
                const userIdMatch = data.userId === participantId;
                const reverseMatch = participantId.toLowerCase().includes(data.name?.toLowerCase() || '');
                
                if (nameMatch || customIdMatch || userIdMatch || reverseMatch) {
                  profiles[participantId] = { ...data, userId: doc.id, userType: 'student' };
                  console.log(`✅ Found student profile by search for ${participantId}:`, data.name);
                  break;
                }
              }
            }
          
          console.log(`❌ No profile found for ${participantId} in any collection`);
        } catch (error) {
          console.error(`Error fetching profile for ${participantId}:`, error);
        }
      }
      
      console.log('📊 Final profiles:', profiles);
      setUserProfiles(profiles);
    };

    // Get all unique user IDs from chats
    const allUserIds = new Set();
    chats.forEach(chat => {
      chat.participants.forEach(participant => allUserIds.add(participant));
    });
    
    if (allUserIds.size > 0) {
      fetchUserProfiles(Array.from(allUserIds));
    }
  }, [db, userId, chats]);

  // Listen for notifications
  useEffect(() => {
    if (!db || !userId) return;

    const notificationsCollectionRef = collection(db, `artifacts/${appId}/public/data/notifications`);
    const userNotificationsQuery = query(notificationsCollectionRef, where('recipientId', '==', userId));

    const unsubscribe = onSnapshot(userNotificationsQuery, (snapshot) => {
      const userNotifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Sort by timestamp (newest first)
      userNotifications.sort((a, b) => {
        const aTime = a.timestamp?.toMillis() || 0;
        const bTime = b.timestamp?.toMillis() || 0;
        return bTime - aTime;
      });

      setNotifications(userNotifications);
      
      // Count unread notifications
      const unreadCount = userNotifications.filter(n => !n.isRead).length;
      setUnreadNotificationCount(unreadCount);
    }, (error) => {
      console.error("Error fetching notifications:", error);
    });

    return () => unsubscribe();
  }, [db, userId]);

  // Send notification function
  const sendNotification = async (notificationData) => {
    if (!db) return;
    
    try {
      console.log('🔔 Sending notification:', notificationData);
      const notificationsCollectionRef = collection(db, `artifacts/${appId}/public/data/notifications`);
      const docRef = await addDoc(notificationsCollectionRef, {
        ...notificationData,
        isRead: false,
        createdAt: serverTimestamp()
      });
      console.log('✅ Notification sent successfully:', docRef.id);
    } catch (error) {
      console.error('❌ Error sending notification:', error);
    }
  };

  // Mark notification as read
  const markNotificationAsRead = async (notificationId) => {
    if (!db || !notificationId) return;
    
    try {
      console.log('📖 Marking notification as read:', notificationId);
      const notificationRef = doc(db, `artifacts/${appId}/public/data/notifications`, notificationId);
      await setDoc(notificationRef, {
        isRead: true,
        readAt: serverTimestamp()
      }, { merge: true });
      
      console.log('✅ Notification marked as read:', notificationId);
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
    }
  };

  // Test notification function
  const testNotification = async () => {
    await sendNotification({
      recipientId: userId,
      senderId: 'test-sender',
      senderName: 'Test User',
      type: 'message',
      title: 'Test Notification',
      message: 'This is a test notification',
      timestamp: serverTimestamp()
    });
  };

  // Delete chat function
  const deleteChat = async (chatId) => {
    if (!db) return;
    
    try {
      // Delete the chat document
      const chatRef = doc(db, `artifacts/${appId}/public/data/chats`, chatId);
      await deleteDoc(chatRef);
      
      // Also delete all messages in the chat
      const messagesRef = collection(db, `artifacts/${appId}/public/data/chats/${chatId}/messages`);
      const messagesSnapshot = await getDocs(messagesRef);
      
      const deletePromises = messagesSnapshot.docs.map(messageDoc => 
        deleteDoc(doc(db, `artifacts/${appId}/public/data/chats/${chatId}/messages`, messageDoc.id))
      );
      
      await Promise.all(deletePromises);
      
      console.log('✅ Chat deleted successfully:', chatId);
      
      // If this was the active chat, clear it
      if (activeChat && chats.find(chat => chat.id === chatId)) {
        setActiveChat(null);
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
      alert('Failed to delete chat. Please try again.');
    }
  };

  // Get the other participant in a chat
  const getOtherParticipant = (chat) => {
    if (!chat || !chat.participants || !Array.isArray(chat.participants)) {
      console.log('⚠️ Invalid chat data:', chat);
      return null;
    }
    
    const otherParticipant = chat.participants.find(participant => participant !== userId);
    console.log('🔍 getOtherParticipant:', { 
      chatId: chat.id, 
      participants: chat.participants, 
      userId, 
      otherParticipant 
    });
    
    return otherParticipant || null;
  };

  // Format last message time
  const formatLastMessageTime = (timestamp) => {
    if (!timestamp) return '';
    
    const now = new Date();
    const messageTime = timestamp.toDate();
    const diffInHours = (now - messageTime) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return messageTime.toLocaleDateString();
    }
  };

  // Enhanced WhatsApp-like interface
  return (
    <div className="h-[700px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex overflow-hidden">
      {/* Left Sidebar - Recent Chats */}
      <div className="w-1/3 border-r border-gray-200 flex flex-col bg-gradient-to-b from-gray-50 to-white">
        {/* Enhanced Sidebar Header */}
        <div className="p-6 border-b bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-xl text-white flex items-center">
              <MessageSquare className="w-6 h-6 mr-3" /> Messages
            </h3>
            <button
              onClick={() => {
                // Show notifications modal
                const notificationModal = document.createElement('div');
                notificationModal.innerHTML = `
                  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onclick="if(event.target === this) this.remove()">
                    <div class="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[600px] flex flex-col" onclick="event.stopPropagation()">
                      <div class="p-4 border-b bg-indigo-50 rounded-t-xl flex items-center justify-between">
                        <h3 class="font-bold text-lg text-indigo-700 flex items-center">
                          <Bell class="w-5 h-5 mr-2" /> Notifications
                          ${unreadNotificationCount > 0 ? `<span class="bg-red-500 text-white text-xs rounded-full px-2 py-1 ml-2">${unreadNotificationCount}</span>` : ''}
                        </h3>
                        <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700">
                          <XCircle class="w-5 h-5" />
                        </button>
                      </div>
                      <div class="flex-1 overflow-y-auto p-4">
                        ${notifications.length === 0 ? 
                          '<div class="flex flex-col items-center justify-center h-full text-gray-500 p-8"><Bell class="w-12 h-12 mb-4 text-gray-300" /><p class="text-lg font-medium">No notifications</p><p class="text-sm">You\'re all caught up!</p></div>' :
                          notifications.map(n => `
                            <div class="p-4 hover:bg-gray-50 transition-all duration-300 cursor-pointer ${!n.isRead ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}" onclick="
                              // Find the sender's profile and open chat
                              const senderId = '${n.senderId}';
                              const senderName = '${n.senderName}';
                              const notificationId = '${n.id}';
                              const partner = { userId: senderId, name: senderName };
                              console.log('🔔 Notification clicked - dispatching event with partner:', partner);
                              
                              // Mark notification as read
                              window.dispatchEvent(new CustomEvent('markNotificationAsRead', { 
                                detail: { notificationId: notificationId } 
                              }));
                              
                              // Remove this notification from the UI immediately
                              this.style.opacity = '0';
                              this.style.transform = 'translateX(100%)';
                              setTimeout(() => {
                                this.remove();
                              }, 300);
                              
                              // Close modal after a short delay
                              setTimeout(() => {
                                this.closest('.fixed').remove();
                              }, 350);
                              
                              // Trigger chat opening (this will be handled by the parent component)
                              window.dispatchEvent(new CustomEvent('openChatFromNotification', { 
                                detail: { partner: partner } 
                              }));
                            ">
                              <div class="flex items-start">
                                <div class="flex-shrink-0">
                                  ${n.type === 'message' ? '<MessageSquare class="w-5 h-5 text-blue-500" />' : '<Bell class="w-5 h-5 text-gray-400" />'}
                                </div>
                                <div class="ml-3 flex-1 min-w-0">
                                  <p class="text-sm font-medium text-gray-900">${n.title}</p>
                                  <p class="text-sm text-gray-500 mt-1">${n.message}</p>
                                  <p class="text-xs text-gray-400 mt-1">${n.timestamp?.toDate().toLocaleString()}</p>
                                </div>
                              </div>
                            </div>
                          `).join('')
                        }
                      </div>
                    </div>
                  </div>
                `;
                document.body.appendChild(notificationModal);
              }}
              className="relative flex items-center px-4 py-2 bg-white/20 text-white text-sm font-semibold rounded-xl hover:bg-white/30 transition-all duration-200 shadow-md"
            >
              <Bell className="w-5 h-5" />
              {unreadNotificationCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full px-2 py-0.5 min-w-[20px] text-center shadow-lg">
                  {unreadNotificationCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Enhanced Chat List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full p-8">
              <Loader2 className="animate-spin h-10 w-10 text-indigo-500 mb-4" />
              <p className="text-gray-600 font-medium">Loading conversations...</p>
            </div>
          ) : chats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 flex items-center justify-center mb-6">
                <MessageSquare className="w-10 h-10 text-indigo-400" />
              </div>
              <p className="text-xl font-semibold text-gray-700 mb-2">No conversations yet</p>
              <p className="text-sm text-gray-500 text-center max-w-xs">Start a conversation from the Matchmaker tab to connect with researchers</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {chats
                .map((chat) => {
                  const otherUserId = getOtherParticipant(chat);
                  
                  // Skip if we can't determine the other participant
                  if (!otherUserId) {
                    console.log('⚠️ Skipping chat with undefined otherUserId:', chat);
                    return null;
                  }
                  
                  const otherUser = userProfiles[otherUserId];
                  const isActive = activeChat?.userId === otherUserId;
                  
                  // If we don't have the user profile, create a fallback
                  const displayUser = otherUser || {
                    userId: otherUserId,
                    name: otherUserId && otherUserId.includes('_') ? otherUserId.split('_')[0] : otherUserId || 'Unknown User',
                    userType: 'unknown'
                  };
                  
                  return (
                    <div key={chat.id} className="relative group">
                      <button
                        onClick={() => {
                          console.log('🖱️ Chat clicked:', displayUser);
                          setActiveChat(displayUser);
                        }}
                        className={`w-full p-4 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all duration-200 text-left border-l-4 ${
                          isActive 
                            ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border-l-indigo-600 shadow-sm' 
                            : 'border-l-transparent hover:border-l-indigo-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-md flex-shrink-0 ${
                            isActive 
                              ? 'bg-gradient-to-r from-indigo-500 to-purple-500' 
                              : 'bg-gradient-to-r from-gray-400 to-gray-500'
                          }`}>
                            <span className="text-xl font-bold text-white">
                              {displayUser.name?.charAt(0) || 'U'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <p className={`font-semibold truncate ${
                                  isActive ? 'text-indigo-900' : 'text-gray-900'
                                }`}>
                                  {displayUser.name || 'Unknown User'}
                                </p>
                                {chat.isPinned && (
                                  <svg className="w-4 h-4 text-yellow-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                )}
                              </div>
                              <span className={`text-xs font-medium flex-shrink-0 ml-2 ${
                                isActive ? 'text-indigo-600' : 'text-gray-500'
                              }`}>
                                {formatLastMessageTime(chat.lastMessageTime)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <p className={`text-sm truncate ${
                                isActive ? 'text-indigo-700' : 'text-gray-600'
                              }`}>
                                {chat.lastMessage || 'No messages yet'}
                              </p>
                              {chat.unreadCount > 0 && (
                                <span className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full px-2.5 py-1 min-w-[24px] text-center shadow-md flex-shrink-0">
                                  {chat.unreadCount}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                      
                      {/* 3-dots menu - appears on hover */}
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Close all other dropdowns first
                              document.querySelectorAll('.chat-dropdown').forEach(dropdown => {
                                dropdown.classList.add('hidden');
                              });
                              // Toggle current dropdown
                              const dropdown = e.currentTarget.parentElement.querySelector('.chat-dropdown');
                              dropdown.classList.toggle('hidden');
                            }}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full p-1"
                            title="Chat options"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                            </svg>
                          </button>
                          
                          {/* Dropdown menu */}
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 hidden chat-dropdown">
                            <div className="py-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Toggle pin status
                                  const chatRef = doc(db, `artifacts/${appId}/public/data/chats`, chat.id);
                                  const isPinned = chat.isPinned || false;
                                  
                                  setDoc(chatRef, {
                                    isPinned: !isPinned,
                                    pinnedAt: !isPinned ? serverTimestamp() : null
                                  }, { merge: true }).then(() => {
                                    console.log(`✅ Chat ${!isPinned ? 'pinned' : 'unpinned'}:`, chat.id);
                                  }).catch((error) => {
                                    console.error('❌ Error pinning/unpinning chat:', error);
                                  });
                                  
                                  e.target.closest('.relative').querySelector('.chat-dropdown').classList.add('hidden');
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                </svg>
                                {chat.isPinned ? 'Unpin Chat' : 'Pin Chat'}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const newName = prompt(`Rename chat with ${displayUser.name || 'Unknown User'}:`, displayUser.name || 'Unknown User');
                                  if (newName && newName.trim() !== '') {
                                    // TODO: Implement rename functionality
                                    console.log('Rename chat:', chat.id, 'to:', newName);
                                  }
                                  e.target.closest('.relative').querySelector('.chat-dropdown').classList.add('hidden');
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Rename Chat
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm(`Are you sure you want to delete this chat with ${displayUser.name || 'Unknown User'}?`)) {
                                    deleteChat(chat.id);
                                  }
                                  e.target.closest('.relative').querySelector('.chat-dropdown').classList.add('hidden');
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                              >
                                <XCircle className="w-4 h-4 mr-3" />
                                Delete Chat
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
                .filter(chat => chat !== null)}
            </div>
          )}
        </div>
      </div>

      {/* Right Side - Active Chat */}
      <div className="flex-1 flex flex-col">
        {activeChat ? (
          <ChatWindow 
            db={db}
            currentUserId={userId}
            partner={activeChat}
            onEndChat={() => setActiveChat(null)}
            onSendNotification={sendNotification}
            currentUserName={userName}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 via-indigo-50 to-purple-50">
            <div className="text-center text-gray-600 px-8">
              <div className="w-24 h-24 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center mx-auto mb-6 shadow-xl">
                <MessageSquare className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">Select a conversation</h3>
              <p className="text-base text-gray-600 max-w-md mx-auto">Choose a chat from the sidebar to start messaging, or find new connections in the Matchmaker tab</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Matchmaker Component ---
const Matchmaker = ({ db, userId, userName, userType, onStartConversation }) => {
  // Restore search state from sessionStorage on mount
  const getStoredSearchState = () => {
    try {
      const stored = sessionStorage.getItem('matchmaker_search_state');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Only restore if it's from the same session (within last hour)
        if (parsed.timestamp && Date.now() - parsed.timestamp < 3600000) {
          return { query: parsed.query || '', results: parsed.results || [], audience: parsed.audience || 'both' };
        }
      }
    } catch (e) {
      console.warn('Failed to restore search state:', e);
    }
    return { query: '', results: [], audience: 'both' };
  };

  const storedState = getStoredSearchState();
  const [searchQuery, setSearchQuery] = useState(storedState.query);
  const [searchResults, setSearchResults] = useState(storedState.results);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');
  const [audience, setAudience] = useState(storedState.audience); // 'professors' | 'students' | 'both'

  // Save search state to sessionStorage whenever it changes
  useEffect(() => {
    if (searchResults.length > 0 || searchQuery) {
      try {
        sessionStorage.setItem('matchmaker_search_state', JSON.stringify({
          query: searchQuery,
          results: searchResults,
          audience: audience,
          timestamp: Date.now()
        }));
      } catch (e) {
        console.warn('Failed to save search state:', e);
      }
    }
  }, [searchResults, searchQuery, audience]);

  const runLocalFirestoreSearch = useCallback(async (term, who) => {
    if (!db) return [];
    const lc = term.toLowerCase();
    const paths = [];
    if (who === 'professors' || who === 'both') paths.push(`artifacts/${appId}/public/data/professors`);
    if (who === 'students' || who === 'both') {
      // prefer students collection; fall back to users where userType=='student'
      paths.push(`artifacts/${appId}/public/data/students`);
    }

    const collectAll = async (path) => {
      try {
        const snap = await getDocs(collection(db, path));
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
      } catch {
        return [];
      }
    };

    const all = (await Promise.all(paths.map(collectAll))).flat();
    const enriched = all.map(item => {
      const hay = [item.name, item.title, item.degree, item.university, item.department, item.researchArea, Array.isArray(item.keywords) ? item.keywords.join(' ') : item.keywords]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      const matched = lc.split(/\s+/).filter(w => w && hay.includes(w));
      const score = Math.min(0.99, matched.length / Math.max(1, lc.split(/\s+/).length));
      return {
        id: item.id,
        name: item.name || 'Unknown',
        title: item.title || item.degree || '',
        university: item.university || '',
        researchArea: item.researchArea || (Array.isArray(item.keywords) ? item.keywords.join(', ') : (item.keywords || '')),
        role: item.userType || (item.degree ? 'student' : 'professor'),
        justification: 'Matches your search for data based on research interests and academic profile.',
        similarityScore: score,
      };
    }).filter(r => r.similarityScore > 0 || lc.length === 0);

    // sort by score desc
    enriched.sort((a, b) => b.similarityScore - a.similarityScore);
    return enriched;
  }, [db]);

  // Production RAG Smart Search Handler with Authentication
  const handleSearch = async (e) => {
    e.preventDefault();
    
    setError('');
    setIsSearching(true);
    setSearchResults([]);

    const term = searchQuery.trim();
    if (term.length < 3) {
      setError('Please enter at least 3 characters to search.');
      setIsSearching(false);
      return;
    }

    try {
      console.log(`🔍 Sending production RAG query: "${term}" for user type: ${userType}`);
      
      // Use the public endpoint for all users (it handles userType internally)
      const endpoint = 'http://localhost:3003/smart-match-public';
      
      if (userType === 'professor') {
        console.log('🎓 Professor searching for students');
      } else {
        console.log('👨‍🏫 Student searching for professors');
      }
      
      // Create an AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      // Prefer Firestore audience-aware search for deterministic filtering
      const results = await runLocalFirestoreSearch(term, audience);
      setSearchResults(results);
      setError('');

      // Log search activity for dashboard
      try {
        if (db && userId) {
          await addDoc(collection(db, `artifacts/${appId}/public/data/users/${userId}/activity`), {
            type: 'search',
            query: term,
            resultCount: Array.isArray(results) ? results.length : 0,
            createdAt: serverTimestamp(),
          });
        }
      } catch (logErr) {
        console.warn('Failed to log search activity', logErr);
      }
      
      if (results.length === 0) {
        setError(`No smart matches found for "${term}". Try different research interests or keywords.`);
      }

    } catch (err) {
      console.error("Error in production RAG smart matching:", err);
      
      // Check if it's a network/CORS error or timeout
      if (err.name === 'AbortError' || err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        setError(`⚠️ Backend server is not responding. Please ensure the RAG backend is running on port 3003. Run 'npm start' in the rag-backend directory.`);
      } else if (err.message.includes('CORS')) {
        setError(`⚠️ CORS error detected. The backend may not be properly configured. Check rag-backend CORS settings allow http://localhost:3000`);
      } else {
        setError(`❌ ${err.message || 'Failed to connect to backend. Make sure the RAG backend is running on port 3003.'}`);
      }
      
      // Set empty results on error
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };


  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Enhanced Header Section */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 p-8 rounded-2xl shadow-2xl mb-8 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
              <Zap className="w-8 h-8 text-white" />
        </div>
            <div>
              <h3 className="text-3xl font-bold text-white flex items-center">
                ResearchLink
              </h3>
              <p className="text-indigo-100 mt-1 text-sm">
                {audience === 'students' && userType !== 'student' && 'Find talented students to collaborate or supervise'}
                {audience === 'professors' && 'Find professors or supervisors to collaborate with'}
                {audience === 'both' && 'Discover the perfect academic collaborators across professors and students'}
              </p>
            </div>
          </div>
        </div>
        
        {/* Enhanced Search Section */}
        <div className="mt-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <label className="text-white font-medium text-sm sm:text-base flex items-center whitespace-nowrap">
              <Users className="w-4 h-4 mr-2" /> I want to find:
            </label>
            <select 
              value={audience} 
              onChange={(e) => setAudience(e.target.value)} 
              className="flex-1 rounded-xl border-2 border-white/30 bg-white/10 backdrop-blur-sm text-white px-4 py-3 text-sm sm:text-base font-medium focus:border-white focus:bg-white/20 transition-all cursor-pointer"
            >
              <option value="both" className="bg-indigo-600">Professors and Students</option>
              <option value="professors" className="bg-indigo-600">Professors only</option>
              <option value="students" className="bg-indigo-600">Students only</option>
          </select>
        </div>
          
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={audience === 'students' ? "Describe what kind of students you're looking for (e.g., 'ML students for healthcare')..." : audience === 'professors' ? "Describe the kind of professors you seek (e.g., 'NLP professor for RAG')..." : "Describe your interests (we'll search professors and students)..."}
              className="flex-1 rounded-xl border-2 border-white/30 bg-white/10 backdrop-blur-sm text-white placeholder-white/70 px-5 py-4 text-sm sm:text-base focus:border-white focus:bg-white/20 focus:ring-2 focus:ring-white/50 transition-all outline-none"
            disabled={isSearching}
          />
          <button
            type="submit"
            disabled={isSearching || searchQuery.length < 3}
              className="flex items-center justify-center px-6 py-4 bg-white text-indigo-600 font-bold rounded-xl hover:bg-indigo-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 min-w-[140px]"
            >
              {isSearching ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5 mr-2" /> Searching...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5 mr-2" /> Search
                </>
              )}
          </button>
        </form>
          {error && (
            <div className="bg-red-500/90 backdrop-blur-sm text-white px-4 py-3 rounded-xl text-sm font-medium shadow-lg">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Search Results */}
      <div className="space-y-6">
        {searchResults.length > 0 && (
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xl font-semibold text-gray-700">
              Found {searchResults.length} {searchResults.length === 1 ? 'Match' : 'Matches'}
            </h4>
            <div className="text-sm text-gray-500">
              Sorted by relevance
            </div>
          </div>
        )}
        
        {searchResults.map((match, index) => (
          <div 
            key={match.id} 
            className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-100 overflow-hidden group"
          >
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 border-b border-gray-200">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-2xl text-gray-900 mb-2 group-hover:text-indigo-700 transition-colors">
                        <Link 
                          to={`/profile/${match.id}`} 
                          state={{ match }} 
                          onClick={async () => {
                      try {
                        if (db && userId) {
                          await addDoc(collection(db, `artifacts/${appId}/public/data/users/${userId}/activity`), {
                            type: 'profile_view',
                            profileId: match.id,
                            name: match.name,
                            createdAt: serverTimestamp(),
                          });
                        }
                      } catch {}
                          }} 
                          className="hover:text-indigo-700 transition-colors"
                        >
                      {match.name}
                    </Link>
                  </h3>
                      <p className="text-lg text-indigo-600 font-medium mb-1">
                        {match.title} {match.university && `at ${match.university}`}
                      </p>
                      {match.researchArea && (
                        <p className="text-sm text-gray-600 mb-2">
                          <span className="font-semibold text-gray-700">Research Area:</span> {match.researchArea}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 ml-4">
                      <span className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
                      Match #{index + 1}
                    </span>
                      <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
                      {Math.round(match.similarityScore * 100)}% Match
                    </span>
                  </div>
                </div>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              {/* Enhanced Justification Section */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-xl border-l-4 border-indigo-500 mb-6 shadow-sm">
                <h4 className="font-bold text-indigo-900 mb-2 flex items-center text-base">
                  <div className="bg-indigo-500 p-1.5 rounded-lg mr-2">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                    Why This Match?
                  </h4>
                <p className="text-indigo-800 text-sm leading-relaxed">{match.justification}</p>
            </div>
            
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200">
              <Link
                to={`/profile/${match.id}`}
                state={{ match }}
                onClick={async () => {
                  try {
                    if (db && userId) {
                      await addDoc(collection(db, `artifacts/${appId}/public/data/users/${userId}/activity`), {
                        type: 'profile_view',
                        profileId: match.id,
                        name: match.name,
                        createdAt: serverTimestamp(),
                      });
                    }
                  } catch {}
                }}
                  className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                  <User className="w-5 h-5 mr-2" /> View Full Profile
              </Link>
              <button
                onClick={() => onStartConversation && onStartConversation({ userId: match.id, name: match.name })}
                  className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <MessageSquare className="w-5 h-5 mr-2" /> Start Conversation
              </button>
              </div>
            </div>
          </div>
        ))}
        
        {searchResults.length === 0 && !isSearching && searchQuery.length >= 3 && !error && (
          <div className="text-center p-12 bg-gradient-to-br from-gray-50 to-indigo-50 rounded-2xl shadow-lg border-2 border-dashed border-gray-300">
            <div className="bg-indigo-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-10 h-10 text-indigo-600" />
            </div>
            <h4 className="text-xl font-semibold text-gray-700 mb-2">No matches found</h4>
            <p className="text-gray-500 mb-1">We couldn't find any matches for "{searchQuery}"</p>
            <p className="text-sm text-gray-400">Try different keywords or research areas</p>
            </div>
        )}
      </div>
    </div>
  );
};

// --- Public Professor Profile Page ---
const ProfessorProfilePage = ({ db }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!db || !id) return;
        // 1) Try direct doc id
        const directRef = doc(db, `artifacts/${appId}/public/data/professors`, id);
        const directSnap = await getDoc(directRef);
        if (directSnap.exists()) {
          setProfile({ id: directSnap.id, ...directSnap.data() });
          return;
        }

        // 1b) Try users and students collections with same id
        const userIdRef = doc(db, `artifacts/${appId}/public/data/users`, id);
        const userIdSnap = await getDoc(userIdRef);
        if (userIdSnap.exists()) {
          setProfile({ id: userIdSnap.id, ...userIdSnap.data() });
          return;
        }
        const studentIdRef = doc(db, `artifacts/${appId}/public/data/students`, id);
        const studentIdSnap = await getDoc(studentIdRef);
        if (studentIdSnap.exists()) {
          setProfile({ id: studentIdSnap.id, ...studentIdSnap.data() });
          return;
        }

        // 2) Try by exact name if available from router state
        const stateMatch = location.state?.match;
        if (stateMatch?.name) {
          const qRef = collection(db, `artifacts/${appId}/public/data/professors`);
          const nameQuery = query(qRef, where('name', '==', stateMatch.name));
          const nameSnap = await getDocs(nameQuery);
          if (!nameSnap.empty) {
            const docSnap = nameSnap.docs[0];
            setProfile({ id: docSnap.id, ...docSnap.data() });
            return;
          }
          // also try users and students by name
          const usersRef = collection(db, `artifacts/${appId}/public/data/users`);
          const usersQ = query(usersRef, where('name', '==', stateMatch.name));
          const usersSnap = await getDocs(usersQ);
          if (!usersSnap.empty) {
            const docSnap = usersSnap.docs[0];
            setProfile({ id: docSnap.id, ...docSnap.data() });
            return;
          }
          const studentsRef = collection(db, `artifacts/${appId}/public/data/students`);
          const studentsQ = query(studentsRef, where('name', '==', stateMatch.name));
          const studentsSnap = await getDocs(studentsQ);
          if (!studentsSnap.empty) {
            const docSnap = studentsSnap.docs[0];
            setProfile({ id: docSnap.id, ...docSnap.data() });
            return;
          }
        }

        // 3) Try slug-to-name fallback (dr_alina_mehta -> Dr. Alina Mehta)
        const slugToName = id.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
        const qRef2 = collection(db, `artifacts/${appId}/public/data/professors`);
        const nameQuery2 = query(qRef2, where('name', '==', slugToName));
        const nameSnap2 = await getDocs(nameQuery2);
        if (!nameSnap2.empty) {
          const docSnap = nameSnap2.docs[0];
          setProfile({ id: docSnap.id, ...docSnap.data() });
          return;
        }
        const usersRef2 = collection(db, `artifacts/${appId}/public/data/users`);
        const usersQ2 = query(usersRef2, where('name', '==', slugToName));
        const usersSnap2 = await getDocs(usersQ2);
        if (!usersSnap2.empty) {
          const docSnap = usersSnap2.docs[0];
          setProfile({ id: docSnap.id, ...docSnap.data() });
          return;
        }
        const studentsRef2 = collection(db, `artifacts/${appId}/public/data/students`);
        const studentsQ2 = query(studentsRef2, where('name', '==', slugToName));
        const studentsSnap2 = await getDocs(studentsQ2);
        if (!studentsSnap2.empty) {
          const docSnap = studentsSnap2.docs[0];
          setProfile({ id: docSnap.id, ...docSnap.data() });
          return;
        }

        // As a last resort, if router state has match data, show that
        if (stateMatch) {
          setProfile({ ...stateMatch, fromStateOnly: true });
          setError('');
          return;
        }

        setError('Profile not found');
      } catch (e) {
        setError(e.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [db, id, location.state]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="animate-spin h-8 w-8 text-indigo-500 mr-3" />
        <p className="text-lg text-gray-700">Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow p-6">
          <p className="text-red-600">{error}</p>
          <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg">Back</button>
        </div>
      </div>
    );
  }

  // Check if there are stored search results
  const hasStoredSearchResults = () => {
    try {
      const stored = sessionStorage.getItem('matchmaker_search_state');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.results && parsed.results.length > 0 && Date.now() - parsed.timestamp < 3600000;
      }
    } catch (e) {
      return false;
    }
    return false;
  };

  const handleBackToResults = () => {
    // Navigate to home with a flag to open matchmaker tab
    if (hasStoredSearchResults()) {
      navigate('/', { state: { openMatchmaker: true } });
    } else {
      navigate(-1);
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <button onClick={handleBackToResults} className="mb-4 inline-flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors px-3 py-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="w-4 h-4 mr-1" /> {hasStoredSearchResults() ? 'Back to Search Results' : 'Back'}
        </button>
        <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-6">
          <div className="flex items-start gap-4 border-b pb-4">
            <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-2xl font-semibold">
              {profile?.name?.[0] || 'P'}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{profile?.name}</h1>
              <p className="text-indigo-700">{profile?.title}</p>
              <p className="text-gray-600">{profile?.university}</p>
              {profile?.fromStateOnly && (
                <p className="text-xs text-amber-600 mt-1">Showing AI match details. Not yet verified from database.</p>
              )}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h2 className="text-sm font-semibold text-gray-700 mb-2">Primary Research Area</h2>
              <p className="text-gray-800">{profile?.researchArea || '—'}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h2 className="text-sm font-semibold text-gray-700 mb-2">Keywords for Matching</h2>
              <div className="flex flex-wrap gap-2">
                {(Array.isArray(profile?.keywords) ? profile.keywords : (profile?.keywords ? String(profile.keywords).split(',').map(s => s.trim()).filter(Boolean) : [])).map((k, i) => (
                  <span key={i} className="px-2 py-1 text-xs rounded-full bg-indigo-100 text-indigo-800">{k}</span>
                ))}
                {(!profile?.keywords || (Array.isArray(profile.keywords) ? profile.keywords.length === 0 : String(profile.keywords).trim().length === 0)) && <span className="text-gray-500">—</span>}
              </div>
            </div>
            {profile?.bio && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h2 className="text-sm font-semibold text-gray-700 mb-2">About / Bio</h2>
                <p className="text-gray-800 whitespace-pre-wrap">{profile.bio}</p>
              </div>
            )}

            {/* Education */}
            {(profile?.degree || profile?.eduInstitution) && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h2 className="text-sm font-semibold text-gray-700 mb-2">Education</h2>
                <div className="space-y-1 text-gray-800">
                  <div className="font-medium">{profile.degree}</div>
                  <div>{profile.eduInstitution}</div>
                  <div className="text-sm text-gray-600">
                    {profile.eduStartDate || '—'} {profile.eduEndDate ? `→ ${profile.eduEndDate}` : ''}
                    {profile.gpa ? ` • GPA: ${profile.gpa}` : ''}
                  </div>
                </div>
              </div>
            )}

            {/* Experience */}
            {(profile?.expTitle || profile?.expOrganization) && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h2 className="text-sm font-semibold text-gray-700 mb-2">Experience</h2>
                <div className="space-y-1 text-gray-800">
                  <div className="font-medium">{profile.expTitle}</div>
                  <div>{profile.expOrganization}</div>
                  <div className="text-sm text-gray-600">{profile.expStartDate || '—'} {profile.expEndDate ? `→ ${profile.expEndDate}` : ''}</div>
                  {profile.expDescription && <p className="text-gray-800 mt-1">{profile.expDescription}</p>}
                </div>
              </div>
            )}

            {/* Publications */}
            {(profile?.pubTitle || profile?.pubJournal) && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h2 className="text-sm font-semibold text-gray-700 mb-2">Publications & Research</h2>
                <div className="space-y-1 text-gray-800">
                  <div className="font-medium">{profile.pubTitle} {profile.pubYear && <span className="text-sm text-gray-600">({profile.pubYear})</span>}</div>
                  {profile.pubAuthors && <div className="text-sm text-gray-700">{profile.pubAuthors}</div>}
                  {profile.pubJournal && <div className="text-sm text-gray-700">{profile.pubJournal}</div>}
                  {profile.pubLink && (
                    <a href={profile.pubLink} target="_blank" rel="noreferrer" className="text-indigo-700 text-sm hover:underline">View Publication</a>
                  )}
                </div>
              </div>
            )}

            {/* Skills */}
            {(profile?.keywords && (Array.isArray(profile.keywords) ? profile.keywords.length > 0 : String(profile.keywords).length > 0)) && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h2 className="text-sm font-semibold text-gray-700 mb-2">Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {(Array.isArray(profile.keywords) ? profile.keywords : String(profile.keywords).split(',')).map((k, i) => (
                    <span key={`skill-${i}`} className="px-2 py-1 text-xs rounded-full bg-gray-200 text-gray-800">{typeof k === 'string' ? k.trim() : k}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Projects */}
            {(profile?.projTitle || profile?.projDescription) && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h2 className="text-sm font-semibold text-gray-700 mb-2">Projects</h2>
                <div className="space-y-1 text-gray-800">
                  <div className="font-medium">{profile.projTitle}</div>
                  {profile.projRole && <div className="text-sm text-gray-700">Role: {profile.projRole}</div>}
                  <div className="text-sm text-gray-600">{profile.projStartDate || '—'} {profile.projEndDate ? `→ ${profile.projEndDate}` : ''}</div>
                  {profile.projDescription && <p className="text-gray-800 mt-1">{profile.projDescription}</p>}
                  {profile.projLink && (
                    <a href={profile.projLink} target="_blank" rel="noreferrer" className="text-indigo-700 text-sm hover:underline">View Project</a>
                  )}
                </div>
              </div>
            )}

            {/* Achievements */}
            {(profile?.achTitle || profile?.achYear) && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h2 className="text-sm font-semibold text-gray-700 mb-2">Achievements & Certifications</h2>
                <div className="space-y-1 text-gray-800">
                  <div className="font-medium">{profile.achTitle} {profile.achYear && <span className="text-sm text-gray-600">({profile.achYear})</span>}</div>
                  {profile.achDescription && <p className="text-gray-800 mt-1">{profile.achDescription}</p>}
                </div>
              </div>
            )}
            {(profile?.papers || profile?.projects) && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h2 className="text-sm font-semibold text-gray-700 mb-2">Research Papers / Projects</h2>
                <ul className="list-disc pl-5 text-gray-800 space-y-1">
                  {(profile.papers || []).map((p, i) => <li key={`p-${i}`}>{p}</li>)}
                  {(profile.projects || []).map((p, i) => <li key={`pr-${i}`}>{p}</li>)}
                </ul>
              </div>
            )}
              <div className="bg-gray-50 rounded-lg p-4">
                <h2 className="text-sm font-semibold text-gray-700 mb-2">Contact</h2>
                <p className="text-gray-800">{profile?.email || '—'}</p>
                {profile?.website && (
                  <a className="text-indigo-700 text-sm hover:underline" href={profile.website} target="_blank" rel="noreferrer">Website</a>
                )}
              </div>
              </div>
            </div>
          </div>
      {/* Floating Chat Assistant */}
      {profile && <ProfileChatAssistant profile={profile} />}
    </div>
  );
};

const ProfessorManagement = ({ db, userId, userType }) => {
  const [professors, setProfessors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [csvData, setCsvData] = useState([]);
  const [newProfessor, setNewProfessor] = useState({
    name: '',
    title: '',
    university: '',
    researchArea: '',
    email: '',
    website: '',
    department: '',
    lab: '',
    bio: '',
    keywords: '',
    availability: 'Available for collaborations'
  });

  // Load professors from Firestore
  useEffect(() => {
    if (!db) return;
    
    const professorsCollection = collection(db, `artifacts/${appId}/public/data/professors`);
    const unsubscribe = onSnapshot(professorsCollection, (snapshot) => {
      const fetchedProfessors = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProfessors(fetchedProfessors);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [db]);

  const handleAddProfessor = async (e) => {
    e.preventDefault();
    if (!db) return;

    try {
      const professorData = {
        ...newProfessor,
        keywords: typeof newProfessor.keywords === 'string' 
          ? newProfessor.keywords.split(',').map(k => k.trim().toLowerCase()).filter(k => k.length > 0)
          : Array.isArray(newProfessor.keywords) 
            ? newProfessor.keywords.map(k => k.trim().toLowerCase()).filter(k => k.length > 0)
            : [],
        createdAt: serverTimestamp(),
        addedBy: userId,
        isActive: true
      };

      await addDoc(collection(db, `artifacts/${appId}/public/data/professors`), professorData);
      setNewProfessor({
        name: '',
        title: '',
        university: '',
        researchArea: '',
        email: '',
        website: '',
        department: '',
        lab: '',
        bio: '',
        keywords: '',
        availability: 'Available for collaborations'
      });
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding professor:', error);
    }
  };

  const handleCsvUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const csv = event.target.result;
      const lines = csv.split('\n');
      const headers = lines[0].split(',');
      const data = lines.slice(1).map(line => {
        const values = line.split(',');
        const obj = {};
        headers.forEach((header, index) => {
          obj[header.trim()] = values[index]?.trim() || '';
        });
        return obj;
      });
      setCsvData(data);
    };
    reader.readAsText(file);
  };

  const handleCsvImport = async () => {
    if (!db || csvData.length === 0) return;

    try {
      for (const professor of csvData) {
        const professorData = {
          name: professor.name || '',
          title: professor.title || '',
          university: professor.university || '',
          researchArea: professor.researchArea || '',
          email: professor.email || '',
          website: professor.website || '',
          department: professor.department || '',
          lab: professor.lab || '',
          bio: professor.bio || '',
          keywords: professor.keywords 
            ? (typeof professor.keywords === 'string' 
                ? professor.keywords.split(',').map(k => k.trim().toLowerCase()).filter(k => k.length > 0)
                : Array.isArray(professor.keywords) 
                  ? professor.keywords.map(k => k.trim().toLowerCase()).filter(k => k.length > 0)
                  : [])
            : [],
          availability: professor.availability || 'Available for collaborations',
          createdAt: serverTimestamp(),
          addedBy: userId,
          isActive: true
        };

        await addDoc(collection(db, `artifacts/${appId}/public/data/professors`), professorData);
      }
      setCsvData([]);
      setCsvFile(null);
    } catch (error) {
      console.error('Error importing CSV:', error);
    }
  };


  if (userType !== 'professor' && userType !== 'admin') {
    return (
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h3 className="text-xl font-semibold text-indigo-700 mb-4">Professor Management</h3>
        <p className="text-gray-600">Only professors and admins can manage professor data.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white p-6 rounded-xl shadow-lg mb-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-semibold text-indigo-700">Professor Management</h3>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              Add Professor
            </button>
            <label className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition cursor-pointer">
              Import CSV
              <input
                type="file"
                accept=".csv"
                onChange={handleCsvUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Add Professor Form */}
        {showAddForm && (
          <form onSubmit={handleAddProfessor} className="mb-6 p-4 border rounded-lg">
            <h4 className="text-lg font-semibold mb-4">Add New Professor</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Full Name"
                value={newProfessor.name}
                onChange={(e) => setNewProfessor({...newProfessor, name: e.target.value})}
                className="p-2 border rounded"
                required
              />
              <input
                type="text"
                placeholder="Title/Position"
                value={newProfessor.title}
                onChange={(e) => setNewProfessor({...newProfessor, title: e.target.value})}
                className="p-2 border rounded"
                required
              />
              <input
                type="text"
                placeholder="University"
                value={newProfessor.university}
                onChange={(e) => setNewProfessor({...newProfessor, university: e.target.value})}
                className="p-2 border rounded"
                required
              />
              <input
                type="text"
                placeholder="Research Area"
                value={newProfessor.researchArea}
                onChange={(e) => setNewProfessor({...newProfessor, researchArea: e.target.value})}
                className="p-2 border rounded"
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={newProfessor.email}
                onChange={(e) => setNewProfessor({...newProfessor, email: e.target.value})}
                className="p-2 border rounded"
              />
              <input
                type="url"
                placeholder="Website"
                value={newProfessor.website}
                onChange={(e) => setNewProfessor({...newProfessor, website: e.target.value})}
                className="p-2 border rounded"
              />
              <input
                type="text"
                placeholder="Department"
                value={newProfessor.department}
                onChange={(e) => setNewProfessor({...newProfessor, department: e.target.value})}
                className="p-2 border rounded"
              />
              <input
                type="text"
                placeholder="Lab/Research Group"
                value={newProfessor.lab}
                onChange={(e) => setNewProfessor({...newProfessor, lab: e.target.value})}
                className="p-2 border rounded"
              />
              <textarea
                placeholder="Bio/Description"
                value={newProfessor.bio}
                onChange={(e) => setNewProfessor({...newProfessor, bio: e.target.value})}
                className="p-2 border rounded md:col-span-2"
                rows="3"
              />
              <input
                type="text"
                placeholder="Keywords (comma-separated)"
                value={newProfessor.keywords}
                onChange={(e) => setNewProfessor({...newProfessor, keywords: e.target.value})}
                className="p-2 border rounded md:col-span-2"
              />
            </div>
            <div className="flex justify-end space-x-3 mt-4">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                Add Professor
              </button>
            </div>
          </form>
        )}

        {/* CSV Import */}
        {csvData.length > 0 && (
          <div className="mb-6 p-4 border rounded-lg bg-green-50">
            <h4 className="text-lg font-semibold mb-2">CSV Import Preview ({csvData.length} professors)</h4>
            <div className="max-h-40 overflow-y-auto mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 text-left">Name</th>
                    <th className="p-2 text-left">University</th>
                    <th className="p-2 text-left">Research Area</th>
                  </tr>
                </thead>
                <tbody>
                  {csvData.slice(0, 5).map((prof, index) => (
                    <tr key={index}>
                      <td className="p-2">{prof.name}</td>
                      <td className="p-2">{prof.university}</td>
                      <td className="p-2">{prof.researchArea}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {csvData.length > 5 && <p className="text-sm text-gray-500">... and {csvData.length - 5} more</p>}
            </div>
            <button
              onClick={handleCsvImport}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              Import All Professors
            </button>
          </div>
        )}

        {/* Professors List */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold">Current Professors ({professors.length})</h4>
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="animate-spin h-6 w-6 text-indigo-500 mr-2" />
              <p className="text-gray-600">Loading professors...</p>
            </div>
          ) : professors.length === 0 ? (
            <p className="text-center p-8 text-gray-500">No professors found. Add some professors to get started!</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {professors.map(professor => (
                <div key={professor.id} className="bg-gray-50 p-4 rounded-lg border">
                  <h5 className="font-semibold text-lg">{professor.name}</h5>
                  <p className="text-indigo-600 text-sm">{professor.title}</p>
                  <p className="text-gray-600 text-sm">{professor.university}</p>
                  <p className="text-gray-700 text-sm mt-2">{professor.researchArea}</p>
                  {professor.email && (
                    <p className="text-xs text-gray-500 mt-1">{professor.email}</p>
                  )}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {professor.keywords?.slice(0, 3).map((keyword, index) => (
                      <span key={index} className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded">
                        {keyword}
                      </span>
                    ))}
                    {professor.keywords?.length > 3 && (
                      <span className="text-xs text-gray-500">+{professor.keywords.length - 3} more</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Admin Dashboard Component ---
const AdminDashboard = ({ db, userId }) => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPosts: 0,
    totalMatches: 0,
    activeUsers: 0
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentPosts, setRecentPosts] = useState([]);

  useEffect(() => {
    if (!db) return;

    // Fetch user statistics
    const usersCollection = collection(db, `artifacts/${appId}/public/data/users`);
    const postsCollection = collection(db, `artifacts/${appId}/public/data/posts`);

    const unsubscribeUsers = onSnapshot(usersCollection, (snapshot) => {
      const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRecentUsers(users.slice(-5)); // Last 5 users
      setStats(prev => ({ ...prev, totalUsers: users.length }));
    });

    const unsubscribePosts = onSnapshot(postsCollection, (snapshot) => {
      const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRecentPosts(posts.slice(-5)); // Last 5 posts
      setStats(prev => ({ ...prev, totalPosts: posts.length }));
    });

    return () => {
      unsubscribeUsers();
      unsubscribePosts();
    };
  }, [db]);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white p-6 rounded-xl shadow-lg mb-6">
        <h2 className="text-3xl font-bold text-indigo-700 mb-6 flex items-center">
          <User className="w-8 h-8 mr-3" />
          Admin Dashboard
        </h2>
        
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
            <div className="flex items-center">
              <User className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-blue-700">{stats.totalUsers}</p>
                <p className="text-blue-600">Total Users</p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 p-6 rounded-lg border border-green-200">
            <div className="flex items-center">
              <MessageSquare className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-green-700">{stats.totalPosts}</p>
                <p className="text-green-600">Total Posts</p>
              </div>
            </div>
          </div>
          
          <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
            <div className="flex items-center">
              <Zap className="w-8 h-8 text-purple-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-purple-700">{stats.totalMatches}</p>
                <p className="text-purple-600">Smart Matches</p>
              </div>
            </div>
          </div>
          
          <div className="bg-orange-50 p-6 rounded-lg border border-orange-200">
            <div className="flex items-center">
              <Globe className="w-8 h-8 text-orange-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-orange-700">{stats.activeUsers}</p>
                <p className="text-orange-600">Active Users</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Recent Users</h3>
            <div className="space-y-3">
              {recentUsers.map(user => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div>
                    <p className="font-medium">{user.name || 'Anonymous'}</p>
                    <p className="text-sm text-gray-500">{user.userType || 'Unknown'}</p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {user.createdAt ? formatTimestamp(user.createdAt) : 'Unknown'}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Recent Posts</h3>
            <div className="space-y-3">
              {recentPosts.map(post => (
                <div key={post.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div>
                    <p className="font-medium">{post.authorName || 'Anonymous'}</p>
                    <p className="text-sm text-gray-500 truncate max-w-xs">{post.content}</p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {formatTimestamp(post.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main App Component ---
const App = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  // Check if we should open matchmaker tab (from profile page back button)
  const [activeTab, setActiveTab] = useState(location.state?.openMatchmaker ? 'matchmaker' : 'dashboard'); // Default to dashboard tab
  
  // Clear the navigation state after using it
  useEffect(() => {
    if (location.state?.openMatchmaker) {
      // Clear the state to prevent it from persisting on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);
  const [activeProfileTab, setActiveProfileTab] = useState('overview'); // Profile tabs: overview, education, experience, publications, skills, projects, achievements, contact
  const [recentActivities, setRecentActivities] = useState([]);
  const [activeChatsCount, setActiveChatsCount] = useState(0);
  const [lastSearchCount, setLastSearchCount] = useState(0);
  const [notifications, setNotifications] = useState([]); // Notifications for dashboard
  const [followers, setFollowers] = useState([]); // People following the current user
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [authForm, setAuthForm] = useState({ email: '', password: '', name: '' });
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [userType, setUserType] = useState(''); // 'student' or 'professor'
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [pendingConversation, setPendingConversation] = useState(null); // Track conversation to start
  
  // Paper Analysis and Mentorship - Page State
  const [paperAnalysisLoading, setPaperAnalysisLoading] = useState(false);
  const [mentorshipLoading, setMentorshipLoading] = useState(false);
  const [paperAnalysisResult, setPaperAnalysisResult] = useState(null);
  const [mentorshipResult, setMentorshipResult] = useState(null);
  const [mentorshipInput, setMentorshipInput] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [activeFeature, setActiveFeature] = useState('paper-analysis'); // 'paper-analysis' or 'mentorship'
  
  // Multi-Agent Mentorship State
  const [multiAgentSelectedAgent, setMultiAgentSelectedAgent] = useState('skill_coach');
  const [multiAgentMessages, setMultiAgentMessages] = useState({});
  const [multiAgentInput, setMultiAgentInput] = useState('');
  const [multiAgentLoading, setMultiAgentLoading] = useState(false);
  const [multiAgentProvider, setMultiAgentProvider] = useState('gemini');
  const [multiAgentSessionIds, setMultiAgentSessionIds] = useState({});

  // Profile Data
  const [profileData, setProfileData] = useState({
    name: '',
    title: '',
    university: '',
    researchArea: '',
    keywords: '',
    bio: '',
    profilePicture: '', // Profile picture (base64)
    yearsExperience: 0,
    isVerified: false,
    userType: '', // 'student' or 'professor'
    department: '',
    degree: '', // For students (legacy - keep for backward compatibility)
    advisor: '', // For students
    lab: '', // For professors
    publications: [], // Array of publication objects
    courses: [], // For professors
    interests: [], // For students
    skills: [], // Array of skill strings
    gpa: '', // For students
    graduationYear: '', // For students
    funding: '', // For professors
    availability: '', // For professors
    timezone: '',
    languages: [],
    // Array-based sections
    education: [], // Array of education objects
    experience: [], // Array of experience objects
    projects: [], // Array of project objects
    achievements: [], // Array of achievement objects
    socialLinks: {
      linkedin: '',
      github: '',
      website: '',
      orcid: ''
    }
  });

  // 1. FIREBASE INITIALIZATION (Without Auto-Auth)
  useEffect(() => {
    if (!firebaseConfig.apiKey) {
      setMessage('Error: Firebase config is missing. Cannot initialize database.');
      setLoading(false);
      return;
    }

    const initFirebase = async () => {
      try {
        const app = initializeApp(firebaseConfig);
        const newAuth = getAuth(app);
        const newDb = getFirestore(app);

        setAuth(newAuth);
        setDb(newDb);

        const unsubscribe = onAuthStateChanged(newAuth, async (user) => {
          console.log('🔐 Auth state changed:', user ? `User ${user.uid} logged in` : 'User logged out');
          
          if (user) {
            setUserId(user.uid);
            setShowAuth(false);
            console.log('🔍 Checking user profile for:', user.uid);
            
            // Check if user has completed onboarding in any collection
            let userProfile = null;
            let userType = null;
            
            try {
              // Check professors collection first
              const professorRef = doc(newDb, `artifacts/${appId}/public/data/professors`, user.uid);
              const professorSnap = await getDoc(professorRef);
              
              if (professorSnap.exists()) {
                userProfile = professorSnap.data();
                userType = 'professor';
              } else {
                // Check students collection
                const studentRef = doc(newDb, `artifacts/${appId}/public/data/students`, user.uid);
                const studentSnap = await getDoc(studentRef);
                
                if (studentSnap.exists()) {
                  userProfile = studentSnap.data();
                  userType = 'student';
                } else {
                  // Fallback to users collection
                  const userRef = doc(newDb, `artifacts/${appId}/public/data/users`, user.uid);
                  const userSnap = await getDoc(userRef);
                  
                  if (userSnap.exists()) {
                    userProfile = userSnap.data();
                    userType = userProfile.userType;
                  }
                }
              }
              
              if (userProfile && userType) {
              // User has completed onboarding
                console.log(`✅ User ${user.uid} found in ${userType} collection, skipping onboarding`);
                console.log('User profile data:', userProfile);
              setShowOnboarding(false);
                setUserType(userType);
                setProfileData(prev => ({ ...prev, ...userProfile, userType }));
            } else {
              // User needs to complete onboarding
                console.log(`⚠️ User ${user.uid} not found in any collection, showing onboarding`);
                setShowOnboarding(true);
                setUserType('');
                setProfileData(prev => ({ ...prev, userType: '' }));
              }
            } catch (error) {
              console.error('Error checking user profile:', error);
              setShowOnboarding(true);
            }
          } else {
            console.log('🚪 User logged out, showing auth form');
            setUserId(null);
            setShowAuth(true);
            setShowOnboarding(false);
            setUserType('');
            setProfileData(prev => ({ ...prev, userType: '' }));
          }
          setIsAuthReady(true);
          setLoading(false);
        });
        
        return () => unsubscribe();
      } catch (e) {
        console.error('Initialization Error:', e);
        setMessage(`Failed to initialize application: ${e.message}`);
        setLoading(false);
      }
    };
    initFirebase();
  }, []);

  // 2. FETCH USER PROFILE DATA (Real Firestore)
  const fetchProfile = useCallback(async (uid) => {
    if (!db || !uid) return;
    try {
      const userDocRef = doc(db, `artifacts/${appId}/public/data/users`, uid);
      const docSnap = await getDoc(userDocRef);

      if (docSnap.exists()) {
        const userData = docSnap.data();
        setProfileData(userData);
        // Set userType from profile data
        if (userData.userType) {
          setUserType(userData.userType);
        }
      } else {
        setMessage('Welcome! Please complete your academic profile.');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setMessage(`Failed to load profile: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [db]);

  useEffect(() => {
    if (isAuthReady && userId) {
      fetchProfile(userId);
    }
  }, [isAuthReady, userId, fetchProfile]);

  // 2b. Subscribe to recent activities and chats for dashboard
  useEffect(() => {
    if (!db || !userId) return;
    const actRef = collection(db, `artifacts/${appId}/public/data/users/${userId}/activity`);
    const actQuery = query(actRef, orderBy('createdAt', 'desc'), limitFn(5));
    const unsubAct = onSnapshot(actQuery, (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setRecentActivities(items);
      const latestSearch = items.find(i => i.type === 'search' && typeof i.resultCount === 'number');
      if (latestSearch) setLastSearchCount(latestSearch.resultCount);
    });

    const chatsRef = collection(db, `artifacts/${appId}/public/data/chats`);
    const chatsQuery = query(chatsRef, where('participants', 'array-contains', userId));
    const unsubChats = onSnapshot(chatsQuery, (snap) => {
      setActiveChatsCount(snap.size || 0);
    });

    return () => {
      unsubAct();
      unsubChats();
    };
  }, [db, userId]);

  // Fetch notifications for dashboard (especially follow requests)
  useEffect(() => {
    if (!db || !userId) return;

    const notificationsCollectionRef = collection(db, `artifacts/${appId}/public/data/notifications`);
    const userNotificationsQuery = query(
      notificationsCollectionRef, 
      where('recipientId', '==', userId)
    );

    const unsubscribe = onSnapshot(userNotificationsQuery, async (snapshot) => {
      const userNotifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Enrich notifications with sender names if missing
      const enrichedNotifications = await Promise.all(
        userNotifications.map(async (notification) => {
          // If senderName is missing or "Someone", try to fetch the actual name
          if ((!notification.senderName || notification.senderName === 'Someone') && notification.senderId) {
            try {
              // Check users collection
              const senderRef = doc(db, `artifacts/${appId}/public/data/users`, notification.senderId);
              const senderSnap = await getDoc(senderRef);
              if (senderSnap.exists()) {
                const senderName = senderSnap.data().name;
                if (senderName) {
                  notification.senderName = senderName;
                  // Update the notification in Firestore
                  const notifRef = doc(db, `artifacts/${appId}/public/data/notifications`, notification.id);
                  await setDoc(notifRef, { senderName }, { merge: true });
                  return notification;
                }
              }
              
              // Check professors collection
              const profRef = doc(db, `artifacts/${appId}/public/data/professors`, notification.senderId);
              const profSnap = await getDoc(profRef);
              if (profSnap.exists()) {
                const senderName = profSnap.data().name;
                if (senderName) {
                  notification.senderName = senderName;
                  const notifRef = doc(db, `artifacts/${appId}/public/data/notifications`, notification.id);
                  await setDoc(notifRef, { senderName }, { merge: true });
                  return notification;
                }
              }
              
              // Check students collection
              const studentRef = doc(db, `artifacts/${appId}/public/data/students`, notification.senderId);
              const studentSnap = await getDoc(studentRef);
              if (studentSnap.exists()) {
                const senderName = studentSnap.data().name;
                if (senderName) {
                  notification.senderName = senderName;
                  const notifRef = doc(db, `artifacts/${appId}/public/data/notifications`, notification.id);
                  await setDoc(notifRef, { senderName }, { merge: true });
                  return notification;
                }
              }
            } catch (error) {
              console.error('Error fetching sender name for notification:', error);
            }
          }
          return notification;
        })
      );

      // Sort by timestamp (newest first) - client-side sorting
      enrichedNotifications.sort((a, b) => {
        const aTime = a.timestamp?.toMillis() || a.createdAt?.toMillis() || 0;
        const bTime = b.timestamp?.toMillis() || b.createdAt?.toMillis() || 0;
        return bTime - aTime;
      });

      // Limit to 10 most recent
      setNotifications(enrichedNotifications.slice(0, 10));
    }, (error) => {
      console.error("Error fetching notifications:", error);
    });

    return () => unsubscribe();
  }, [db, userId]);

  // Fetch followers (people who have current user in their following list)
  useEffect(() => {
    if (!db || !userId) return;

    const fetchFollowers = async () => {
      try {
        // Get all users and check their following arrays
        const usersRef = collection(db, `artifacts/${appId}/public/data/users`);
        const usersSnapshot = await getDocs(usersRef);
        
        const followerList = [];
        
        for (const userDoc of usersSnapshot.docs) {
          if (userDoc.id === userId) continue; // Skip self
          
          const followsRef = doc(db, `artifacts/${appId}/public/data/users/${userDoc.id}/follows`, userDoc.id);
          const followsSnap = await getDoc(followsRef);
          
          if (followsSnap.exists()) {
            const following = followsSnap.data().following || [];
            if (following.includes(userId)) {
              // This user is following the current user
              const userData = userDoc.data();
              followerList.push({
                id: userDoc.id,
                name: userData.name || 'Unknown User',
                title: userData.title || userData.degree || '',
                userType: userData.userType || 'user'
              });
            }
          }
        }
        
        // Also check professors and students collections
        const professorsRef = collection(db, `artifacts/${appId}/public/data/professors`);
        const professorsSnapshot = await getDocs(professorsRef);
        
        for (const profDoc of professorsSnapshot.docs) {
          if (profDoc.id === userId) continue;
          
          const followsRef = doc(db, `artifacts/${appId}/public/data/users/${profDoc.id}/follows`, profDoc.id);
          const followsSnap = await getDoc(followsRef);
          
          if (followsSnap.exists()) {
            const following = followsSnap.data().following || [];
            if (following.includes(userId)) {
              const profData = profDoc.data();
              followerList.push({
                id: profDoc.id,
                name: profData.name || 'Unknown User',
                title: profData.title || profData.degree || '',
                userType: 'professor'
              });
            }
          }
        }
        
        const studentsRef = collection(db, `artifacts/${appId}/public/data/students`);
        const studentsSnapshot = await getDocs(studentsRef);
        
        for (const studentDoc of studentsSnapshot.docs) {
          if (studentDoc.id === userId) continue;
          
          const followsRef = doc(db, `artifacts/${appId}/public/data/users/${studentDoc.id}/follows`, studentDoc.id);
          const followsSnap = await getDoc(followsRef);
          
          if (followsSnap.exists()) {
            const following = followsSnap.data().following || [];
            if (following.includes(userId)) {
              const studentData = studentDoc.data();
              followerList.push({
                id: studentDoc.id,
                name: studentData.name || 'Unknown User',
                title: studentData.degree || studentData.title || '',
                userType: 'student'
              });
            }
          }
        }
        
        setFollowers(followerList);
      } catch (error) {
        console.error('Error fetching followers:', error);
      }
    };
    
    fetchFollowers();
    
    // Set up a listener to refresh followers periodically or on changes
    const interval = setInterval(fetchFollowers, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, [db, userId]);

  // Send notification function (for use in Feed and other components)
  const sendNotification = async (notificationData) => {
    if (!db) return;
    
    try {
      console.log('🔔 Sending notification:', notificationData);
      const notificationsCollectionRef = collection(db, `artifacts/${appId}/public/data/notifications`);
      const docRef = await addDoc(notificationsCollectionRef, {
        ...notificationData,
        isRead: false,
        createdAt: serverTimestamp()
      });
      console.log('✅ Notification sent successfully:', docRef.id);
    } catch (error) {
      console.error('❌ Error sending notification:', error);
    }
  };

  // --- HANDLERS ---

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value,
    }));
  };

  // Helper function to handle array input changes (for multiple entries)
  const handleArrayInputChange = (arrayName, index, field, value) => {
    setProfileData(prev => {
      const newArray = [...(prev[arrayName] || [])];
      if (!newArray[index]) {
        newArray[index] = {};
      }
      newArray[index] = {
        ...newArray[index],
        [field]: value
      };
      return {
        ...prev,
        [arrayName]: newArray
      };
    });
  };

  // Helper function to add a new entry to an array
  const addArrayEntry = (arrayName, defaultEntry = {}) => {
    setProfileData(prev => ({
      ...prev,
      [arrayName]: [...(prev[arrayName] || []), defaultEntry]
    }));
  };

  // Helper function to remove an entry from an array
  const removeArrayEntry = (arrayName, index) => {
    setProfileData(prev => {
      const newArray = [...(prev[arrayName] || [])];
      newArray.splice(index, 1);
      return {
        ...prev,
        [arrayName]: newArray
      };
    });
  };

  // Set user type manually (for existing users)
  const setUserTypeManually = async (newUserType) => {
    if (!db || !userId) return;
    
    try {
      // Determine the correct collection based on newUserType
      let collectionPath;
      if (newUserType === 'professor') {
        collectionPath = `artifacts/${appId}/public/data/professors`;
      } else if (newUserType === 'student') {
        collectionPath = `artifacts/${appId}/public/data/students`;
      } else {
        collectionPath = `artifacts/${appId}/public/data/users`;
      }
      
      console.log(`🔄 Setting user type to ${newUserType} in collection: ${collectionPath}`);
      
      const userDocRef = doc(db, collectionPath, userId);
      await setDoc(userDocRef, {
        userType: newUserType,
        lastUpdated: new Date()
      }, { merge: true });
      
      setUserType(newUserType);
      setProfileData(prev => ({ ...prev, userType: newUserType }));
      setMessage(`User type set to ${newUserType}`);
    } catch (error) {
      console.error('Error setting user type:', error);
      setMessage('Error setting user type. Please try again.');
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!db || !userId) {
      setMessage('Authentication not ready. Please wait.');
      return;
    }
    setLoading(true);
    try {
      // CRITICAL: Convert keywords string to a lowercase array for searching
      let keywordsArray = [];
      if (profileData.keywords) {
        if (typeof profileData.keywords === 'string') {
          keywordsArray = profileData.keywords.split(',').map(k => k.trim().toLowerCase()).filter(k => k.length > 0);
        } else if (Array.isArray(profileData.keywords)) {
          keywordsArray = profileData.keywords.map(k => k.trim().toLowerCase()).filter(k => k.length > 0);
        }
      }
      
      const dataToSave = {
          ...profileData,
          keywords: keywordsArray, // Store as array for the 'array-contains' query to work
      };

      // Save to appropriate collection based on user type
      let collectionPath;
      if (profileData.userType === 'professor') {
        collectionPath = `artifacts/${appId}/public/data/professors`;
      } else if (profileData.userType === 'student') {
        collectionPath = `artifacts/${appId}/public/data/students`;
      } else {
        // Fallback to users collection for backward compatibility
        collectionPath = `artifacts/${appId}/public/data/users`;
      }

      console.log(`💾 Saving profile to: ${collectionPath} for userType: ${profileData.userType}`);
      const userDocRef = doc(db, collectionPath, userId);
      await setDoc(userDocRef, dataToSave, { merge: true });
      console.log(`✅ Profile saved successfully to ${collectionPath}`);
      
      setMessage('Profile saved successfully! Ready to connect.');
      
      // Update local state to reflect the data structure sent to Firestore for the keywords field
      setProfileData(prev => ({ ...prev, keywords: profileData.keywords })); 
      
    } catch (error) {
      console.error('Error saving profile:', error);
      setMessage(`Error saving profile: ${error.message}`);
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  // Authentication Handlers
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    if (!auth) return;

    setLoading(true);
    try {
      if (authMode === 'signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, authForm.email, authForm.password);
        // Don't save incomplete profile data - wait for onboarding completion
        if (userCredential.user) {
          console.log('User created successfully, proceeding to onboarding');
        }
        setMessage('Account created successfully!');
      } else {
        await signInWithEmailAndPassword(auth, authForm.email, authForm.password);
        setMessage('Signed in successfully!');
      }
    } catch (error) {
      console.error('Auth error:', error);
      setMessage(`Authentication error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthInputChange = (e) => {
    const { name, value } = e.target;
    setAuthForm(prev => ({ ...prev, [name]: value }));
  };

  const handleLogout = async () => {
    if (auth) {
      try {
        await signOut(auth);
        setMessage('You have been signed out.');
        setProfileData({});
      } catch (error) {
        console.error('Logout error:', error);
        setMessage('Logout failed. Try again.');
      }
    }
  };

  // --- ONBOARDING FLOW ---
  const renderOnboarding = () => {
    const onboardingSteps = [
      {
        title: "Welcome to ResearchLink!",
        subtitle: "Let's set up your profile to connect you with the right academic collaborators.",
        content: (
          <div className="space-y-6">
            <div className="text-center">
              <GraduationCap className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Role</h2>
              <p className="text-gray-600">Are you a student looking for research opportunities or a professor seeking collaborators?</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <button
                onClick={() => {
                  setUserType('student');
                  setProfileData(prev => ({ ...prev, userType: 'student' }));
                  setOnboardingStep(1);
                }}
                className="p-6 border-2 border-gray-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left"
              >
                <div className="flex items-center mb-3">
                  <BookOpen className="w-8 h-8 text-blue-600 mr-3" />
                  <h3 className="text-lg font-semibold">I'm a Student</h3>
                </div>
                <p className="text-gray-600 text-sm">
                  Looking for research opportunities, mentors, and academic collaborations
                </p>
              </button>
              
              <button
                onClick={() => {
                  setUserType('professor');
                  setProfileData(prev => ({ ...prev, userType: 'professor' }));
                  setOnboardingStep(1);
                }}
                className="p-6 border-2 border-gray-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left"
              >
                <div className="flex items-center mb-3">
                  <User className="w-8 h-8 text-green-600 mr-3" />
                  <h3 className="text-lg font-semibold">I'm a Professor</h3>
                </div>
                <p className="text-gray-600 text-sm">
                  Seeking research collaborators, students, and academic partnerships
                </p>
              </button>
            </div>
          </div>
        )
      },
      {
        title: userType === 'student' ? "Student Profile Setup" : "Professor Profile Setup",
        subtitle: "Tell us about your academic background and interests.",
        content: (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 p-3 focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Dr. Jane Smith"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {userType === 'student' ? 'Degree Program' : 'Current Title/Position'} *
                </label>
                <input
                  type="text"
                  value={userType === 'student' ? profileData.degree : profileData.title}
                  onChange={(e) => setProfileData(prev => ({ 
                    ...prev, 
                    [userType === 'student' ? 'degree' : 'title']: e.target.value 
                  }))}
                  className="w-full rounded-lg border border-gray-300 p-3 focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder={userType === 'student' ? 'PhD in Computer Science' : 'Professor of Biology'}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  University/Institution *
                </label>
                <input
                  type="text"
                  value={profileData.university}
                  onChange={(e) => setProfileData(prev => ({ ...prev, university: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 p-3 focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Stanford University"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department *
                </label>
                <input
                  type="text"
                  value={profileData.department}
                  onChange={(e) => setProfileData(prev => ({ ...prev, department: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 p-3 focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Computer Science"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Research Area *
                </label>
                <input
                  type="text"
                  value={profileData.researchArea}
                  onChange={(e) => setProfileData(prev => ({ ...prev, researchArea: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 p-3 focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Machine Learning, Quantum Computing, etc."
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Keywords for Matching (comma-separated) *
                </label>
                <input
                  type="text"
                  value={profileData.keywords}
                  onChange={(e) => setProfileData(prev => ({ ...prev, keywords: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 p-3 focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="AI, machine learning, deep learning, neural networks"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  About Me / Professional Bio *
                </label>
                <textarea
                  value={profileData.bio}
                  onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 p-3 focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Tell us about your research interests, experience, and what you're looking for in collaborations..."
                />
              </div>
            </div>
            
            <div className="flex justify-between pt-6">
              <button
                onClick={() => setOnboardingStep(0)}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={() => setOnboardingStep(2)}
                disabled={!profileData.name || !profileData.university || !profileData.researchArea}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </div>
        )
      },
      {
        title: "Additional Information",
        subtitle: "Help us personalize your experience with some additional details.",
        content: (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {userType === 'student' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Advisor/Supervisor
                    </label>
                    <input
                      type="text"
                      value={profileData.advisor}
                      onChange={(e) => setProfileData(prev => ({ ...prev, advisor: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 p-3 focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="Dr. John Smith"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expected Graduation Year
                    </label>
                    <input
                      type="text"
                      value={profileData.graduationYear}
                      onChange={(e) => setProfileData(prev => ({ ...prev, graduationYear: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 p-3 focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="2025"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      GPA (Optional)
                    </label>
                    <input
                      type="text"
                      value={profileData.gpa}
                      onChange={(e) => setProfileData(prev => ({ ...prev, gpa: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 p-3 focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="3.8"
                    />
                  </div>
                </>
              )}
              
              {userType === 'professor' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lab/Research Group
                    </label>
                    <input
                      type="text"
                      value={profileData.lab}
                      onChange={(e) => setProfileData(prev => ({ ...prev, lab: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 p-3 focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="AI Research Lab"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Years of Experience
                    </label>
                    <input
                      type="number"
                      value={profileData.yearsExperience}
                      onChange={(e) => setProfileData(prev => ({ ...prev, yearsExperience: parseInt(e.target.value) || 0 }))}
                      className="w-full rounded-lg border border-gray-300 p-3 focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="10"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Research Funding Available
                    </label>
                    <select
                      value={profileData.funding}
                      onChange={(e) => setProfileData(prev => ({ ...prev, funding: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 p-3 focus:border-indigo-500 focus:ring-indigo-500"
                    >
                      <option value="">Select funding status</option>
                      <option value="yes">Yes, I have funding</option>
                      <option value="limited">Limited funding available</option>
                      <option value="no">No funding available</option>
                    </select>
                  </div>
                </>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Timezone
                </label>
                <select
                  value={profileData.timezone}
                  onChange={(e) => setProfileData(prev => ({ ...prev, timezone: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 p-3 focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="">Select your timezone</option>
                  <option value="UTC-12">UTC-12 (Baker Island)</option>
                  <option value="UTC-8">UTC-8 (Pacific Time)</option>
                  <option value="UTC-5">UTC-5 (Eastern Time)</option>
                  <option value="UTC+0">UTC+0 (GMT)</option>
                  <option value="UTC+1">UTC+1 (Central European)</option>
                  <option value="UTC+5">UTC+5 (Pakistan Standard Time)</option>
                  <option value="UTC+8">UTC+8 (China Standard Time)</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-between pt-6">
              <button
                onClick={() => setOnboardingStep(1)}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={handleCompleteOnboarding}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Complete Setup
              </button>
            </div>
          </div>
        )
      }
    ];

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-2xl max-w-4xl w-full">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-900">{onboardingSteps[onboardingStep].title}</h1>
              <div className="flex space-x-2">
                {onboardingSteps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-3 h-3 rounded-full ${
                      index <= onboardingStep ? 'bg-indigo-600' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
            <p className="text-gray-600">{onboardingSteps[onboardingStep].subtitle}</p>
          </div>
          
          {onboardingSteps[onboardingStep].content}
        </div>
      </div>
    );
  };

  // Handle onboarding completion
  const handleCompleteOnboarding = async () => {
    if (!db || !userId) return;
    
    try {
      // Determine the correct collection based on userType
      let collectionPath;
      if (userType === 'professor') {
        collectionPath = `artifacts/${appId}/public/data/professors`;
      } else if (userType === 'student') {
        collectionPath = `artifacts/${appId}/public/data/students`;
      } else {
        collectionPath = `artifacts/${appId}/public/data/users`;
      }
      
      console.log(`🎯 Completing onboarding for ${userType} in collection: ${collectionPath}`);
      
      const userDocRef = doc(db, collectionPath, userId);
      await setDoc(userDocRef, {
        ...profileData,
        userType,
        createdAt: new Date(),
        lastUpdated: new Date()
      });
      
      // Update the main userType state
      setUserType(userType);
      
      setShowOnboarding(false);
      setMessage('Profile setup completed successfully!');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      setMessage('Error completing setup. Please try again.');
    }
  };

  // --- AUTHENTICATION FORM ---
  const renderAuthForm = () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full">
        <div className="text-center mb-6">
          <GraduationCap className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">ResearchLink</h1>
          <p className="text-gray-600 mt-2">Connect with researchers worldwide</p>
        </div>

        <form onSubmit={handleAuthSubmit} className="space-y-4">
          {authMode === 'signup' && (
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={authForm.name}
                onChange={handleAuthInputChange}
                required={authMode === 'signup'}
                className="w-full rounded-lg border border-gray-300 p-3 focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Dr. Jane Smith"
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={authForm.email}
              onChange={handleAuthInputChange}
              required
              className="w-full rounded-lg border border-gray-300 p-3 focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="jane.smith@university.edu"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={authForm.password}
              onChange={handleAuthInputChange}
              required
              className="w-full rounded-lg border border-gray-300 p-3 focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <Loader2 className="animate-spin h-5 w-5 mr-2" />
                {authMode === 'signup' ? 'Creating Account...' : 'Signing In...'}
              </div>
            ) : (
              authMode === 'signup' ? 'Create Account' : 'Sign In'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
              className="text-indigo-600 hover:text-indigo-700 font-semibold"
            >
              {authMode === 'login' ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );

  // --- DASHBOARD COMPONENT ---
  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">
              Welcome back, {profileData.name || 'Academic'}!
            </h2>
            <p className="text-indigo-100">
              {profileData.userType === 'student' 
                ? 'Ready to find your next research opportunity?' 
                : 'Ready to connect with talented researchers?'}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{profileData.userType === 'student' ? '🎓' : '👨‍🏫'}</div>
            <div className="text-sm text-indigo-200">{profileData.userType === 'student' ? 'Student' : 'Professor'}</div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Search className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Smart Matches</p>
              <p className="text-lg font-semibold text-gray-900">{lastSearchCount}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <MessageSquare className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Active Chats</p>
              <p className="text-lg font-semibold text-gray-900">{activeChatsCount}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Globe className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Connections</p>
              <p className="text-lg font-semibold text-gray-900">{followers.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <BookOpen className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Research Areas</p>
              <p className="text-lg font-semibold text-gray-900">{profileData.researchArea ? '1' : '0'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Paper Analysis, Academic Mentorship, and Multi-Agent Buttons */}
      <div className="grid md:grid-cols-3 gap-4">
        <button
            onClick={() => {
              setActiveFeature('paper-analysis');
              setActiveTab('paper-analysis');
              // Clear mentorship results when switching to paper analysis
              setMentorshipResult(null);
              setMentorshipInput('');
            }}
          className="flex items-center justify-center p-6 bg-blue-50 hover:bg-blue-100 rounded-xl shadow-md transition-all duration-200 border-2 border-blue-200 hover:border-blue-400"
        >
          <FileText className="w-8 h-8 text-blue-600 mr-4" />
          <div className="text-left">
            <h3 className="text-lg font-semibold text-blue-900">Paper Analysis</h3>
            <p className="text-sm text-blue-700">Upload and analyze research papers with AI</p>
          </div>
        </button>
        
        <button
            onClick={() => {
              setActiveFeature('mentorship');
              setActiveTab('paper-analysis'); // Use the same tab component
              // Clear paper analysis results when switching to mentorship
              setPaperAnalysisResult(null);
              setSelectedFile(null);
              document.getElementById('paper-upload-input')?.setAttribute('value', '');
            }}
          className="flex items-center justify-center p-6 bg-purple-50 hover:bg-purple-100 rounded-xl shadow-md transition-all duration-200 border-2 border-purple-200 hover:border-purple-400"
        >
          <Brain className="w-8 h-8 text-purple-600 mr-4" />
          <div className="text-left">
            <h3 className="text-lg font-semibold text-purple-900">Academic Mentorship</h3>
            <p className="text-sm text-purple-700">Get personalized learning plans and guidance</p>
          </div>
        </button>
        
        <button
            onClick={() => {
              setActiveTab('multi-agent-mentorship');
              // Clear other features when switching to multi-agent
              setPaperAnalysisResult(null);
              setMentorshipResult(null);
              setSelectedFile(null);
              setMentorshipInput('');
            }}
          className="flex items-center justify-center p-6 bg-green-50 hover:bg-green-100 rounded-xl shadow-md transition-all duration-200 border-2 border-green-200 hover:border-green-400"
        >
          <Users className="w-8 h-8 text-green-600 mr-4" />
          <div className="text-left">
            <h3 className="text-lg font-semibold text-green-900">Multi-Agent Mentorship</h3>
            <p className="text-sm text-green-700">Chat with specialized AI mentors</p>
          </div>
        </button>
      </div>

      {/* Followers Section */}
      {followers.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 shadow-lg mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Users className="w-6 h-6 mr-2 text-blue-600" />
            Followers ({followers.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {followers.map((follower) => (
              <button
                key={follower.id}
                onClick={() => {
                  navigate(`/profile/${follower.id}`);
                }}
                className="bg-white rounded-xl p-4 shadow-md border border-blue-200 hover:shadow-lg hover:border-blue-400 transition-all text-left group"
              >
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-lg mr-4 shadow-md">
                    {follower.name?.[0] || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                      {follower.name}
                    </p>
                    {follower.title && (
                      <p className="text-sm text-gray-600 truncate">{follower.title}</p>
                    )}
                    <p className="text-xs text-gray-500 capitalize">{follower.userType}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Notifications Section */}
      {notifications.filter(n => n.type === 'follow_request' && n.status === 'pending').length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-xl p-6 shadow-lg mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Bell className="w-6 h-6 mr-2 text-purple-600" />
            Follow Requests
          </h3>
          <div className="space-y-4">
            {notifications
              .filter(n => n.type === 'follow_request' && n.status === 'pending')
              .map((notification) => (
                <div
                  key={notification.id}
                  className="bg-white rounded-xl p-4 shadow-md border border-purple-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center flex-1">
                      <button
                        onClick={() => {
                          if (notification.senderId) {
                            navigate(`/profile/${notification.senderId}`);
                          }
                        }}
                        className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold text-lg mr-4 shadow-md hover:shadow-lg hover:scale-105 transition-all cursor-pointer"
                      >
                        {notification.senderName?.[0] || 'U'}
                      </button>
                      <div className="flex-1">
                        <button
                          onClick={() => {
                            if (notification.senderId) {
                              navigate(`/profile/${notification.senderId}`);
                            }
                          }}
                          className="text-left hover:opacity-80 transition-opacity w-full"
                        >
                          <p className="font-semibold text-gray-900 hover:text-purple-600 transition-colors cursor-pointer">
                            {notification.senderName || 'Someone'}
                          </p>
                        </button>
                        <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {notification.timestamp?.toDate ? formatTimestamp(notification.timestamp) : 'Just now'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={async () => {
                          // Accept follow request
                          if (!db || !notification.senderId || !userId) return;
                          
                          try {
                            // Update follow request status
                            const followRequestsRef = collection(db, `artifacts/${appId}/public/data/followRequests`);
                            const requestQuery = query(
                              followRequestsRef,
                              where('followerId', '==', notification.senderId),
                              where('followedId', '==', userId),
                              where('status', '==', 'pending')
                            );
                            const requestSnap = await getDocs(requestQuery);
                            
                            if (!requestSnap.empty) {
                              const requestDoc = requestSnap.docs[0];
                              await setDoc(requestDoc.ref, {
                                status: 'accepted',
                                respondedAt: serverTimestamp()
                              }, { merge: true });

                              // Add to following list of the person who requested
                              const userFollowRef = doc(db, `artifacts/${appId}/public/data/users/${notification.senderId}/follows`, notification.senderId);
                              const followSnap = await getDoc(userFollowRef);
                              
                              if (followSnap.exists()) {
                                await setDoc(userFollowRef, {
                                  following: arrayUnion(userId)
                                }, { merge: true });
                              } else {
                                await setDoc(userFollowRef, {
                                  following: [userId]
                                });
                              }

                              // Delete notification
                              const notificationRef = doc(db, `artifacts/${appId}/public/data/notifications`, notification.id);
                              await deleteDoc(notificationRef);
                            }
                          } catch (error) {
                            console.error('Error accepting follow request:', error);
                          }
                        }}
                        className="px-4 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-all shadow-md hover:shadow-lg flex items-center"
                      >
                        <UserCheck className="w-4 h-4 mr-1" /> Accept
                      </button>
                      <button
                        onClick={async () => {
                          // Reject follow request
                          if (!db || !notification.senderId || !userId) return;
                          
                          try {
                            // Update follow request status
                            const followRequestsRef = collection(db, `artifacts/${appId}/public/data/followRequests`);
                            const requestQuery = query(
                              followRequestsRef,
                              where('followerId', '==', notification.senderId),
                              where('followedId', '==', userId),
                              where('status', '==', 'pending')
                            );
                            const requestSnap = await getDocs(requestQuery);
                            
                            if (!requestSnap.empty) {
                              const requestDoc = requestSnap.docs[0];
                              await setDoc(requestDoc.ref, {
                                status: 'rejected',
                                respondedAt: serverTimestamp()
                              }, { merge: true });

                              // Delete notification
                              const notificationRef = doc(db, `artifacts/${appId}/public/data/notifications`, notification.id);
                              await deleteDoc(notificationRef);
                            }
                          } catch (error) {
                            console.error('Error rejecting follow request:', error);
                          }
                        }}
                        className="px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-all shadow-md hover:shadow-lg flex items-center"
                      >
                        <UserX className="w-4 h-4 mr-1" /> Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {recentActivities.length === 0 && (
              <p className="text-sm text-gray-500">No recent activity yet.</p>
            )}
            {recentActivities.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  if (item.type === 'profile_view' && item.profileId) {
                    window.location.href = `/profile/${item.profileId}`;
                  } else if (item.type === 'chat_start' && item.partnerId) {
                    setPendingConversation({ userId: item.partnerId, name: item.name || 'Contact' });
                    setActiveTab('chats');
                  } else if (item.type === 'search') {
                    setActiveTab('matchmaker');
                    // best-effort set search term for user to re-run
                    if (item.query) {
                      // This depends on Matchmaker state; user can hit Search
                      // We cannot programmatically submit here cleanly.
                    }
                  }
                }}
                className="w-full text-left flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${item.type === 'search' ? 'bg-blue-100' : item.type === 'chat_start' ? 'bg-green-100' : 'bg-indigo-100'}`}>
                  {item.type === 'search' ? <Search className="w-5 h-5 text-blue-600" /> : item.type === 'chat_start' ? <MessageSquare className="w-5 h-5 text-green-600" /> : <User className="w-5 h-5 text-indigo-600" />}
                </div>
                <div className="ml-3">
                  {item.type === 'search' && (
                    <>
                      <p className="font-medium text-gray-900">Searched: "{item.query}"</p>
                      <p className="text-sm text-gray-500">{item.resultCount || 0} matches • {item.createdAt ? formatTimestamp(item.createdAt) : ''}</p>
                    </>
                  )}
                  {item.type === 'profile_view' && (
                    <>
                      <p className="font-medium text-gray-900">Viewed profile: {item.name || item.profileId}</p>
                      <p className="text-sm text-gray-500">{item.createdAt ? formatTimestamp(item.createdAt) : ''}</p>
                    </>
                  )}
                  {item.type === 'chat_start' && (
                    <>
                      <p className="font-medium text-gray-900">Started chat with {item.name || item.partnerId}</p>
                      <p className="text-sm text-gray-500">{item.createdAt ? formatTimestamp(item.createdAt) : ''}</p>
                    </>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button
              onClick={() => setActiveTab('matchmaker')}
              className="w-full flex items-center p-3 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              <Search className="w-5 h-5 text-indigo-600 mr-3" />
              <span className="font-medium text-indigo-900">Find Collaborators</span>
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className="w-full flex items-center p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <User className="w-5 h-5 text-green-600 mr-3" />
              <span className="font-medium text-green-900">Update Profile</span>
            </button>
            <button
              onClick={() => setActiveTab('feed')}
              className="w-full flex items-center p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <Globe className="w-5 h-5 text-purple-600 mr-3" />
              <span className="font-medium text-purple-900">Browse Feed</span>
            </button>
          </div>
        </div>
      </div>

    </div>
  );

  // --- RENDERING TABS ---

  const renderProfileTab = () => {
    // User Type Selector for existing users
    if (!userType) {
      return (
    <div className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl max-w-4xl mx-auto">
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="text-lg font-medium text-yellow-800 mb-2">Set Your Role</h3>
          <p className="text-yellow-700 mb-4">Please select your role to access all features:</p>
          <div className="flex space-x-4">
            <button
                onClick={() => {
                  setProfileData(prev => ({ ...prev, userType: 'student' }));
                  setShowOnboarding(true);
                }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              I'm a Student
            </button>
            <button
                onClick={() => {
                  setProfileData(prev => ({ ...prev, userType: 'professor' }));
                  setShowOnboarding(true);
                }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              I'm a Professor
            </button>
          </div>
        </div>
        </div>
      );
    }

    const tabs = [
      { id: 'overview', label: 'Overview' },
      { id: 'education', label: 'Education' },
      { id: 'experience', label: 'Experience' },
      { id: 'publications', label: 'Publications & Research' },
      { id: 'skills', label: 'Skills' },
      { id: 'projects', label: 'Projects' },
      { id: 'achievements', label: 'Achievements & Certifications' },
      { id: 'contact', label: 'Contact & Social' }
    ];

    const renderTabContent = () => {
      switch(activeProfileTab) {
        case 'overview':
          return (
      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* Profile Picture Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">Profile Picture</label>
          <div className="flex items-center gap-6">
            <div className="relative">
              {profileData.profilePicture ? (
                <img 
                  src={profileData.profilePicture} 
                  alt="Profile" 
                  className="w-32 h-32 rounded-full object-cover border-4 border-indigo-200 shadow-lg"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white text-4xl font-bold border-4 border-indigo-200 shadow-lg">
                  {profileData.name?.[0] || 'U'}
                </div>
              )}
              {profileData.profilePicture && (
                <button
                  type="button"
                  onClick={() => {
                    setProfileData(prev => ({ ...prev, profilePicture: '' }));
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-all shadow-md"
                  title="Remove picture"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex-1">
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (file) {
                    // Validate file size (max 5MB)
                    if (file.size > 5 * 1024 * 1024) {
                      alert('Image size must be less than 5MB');
                      return;
                    }
                    
                    // Validate file type
                    if (!file.type.startsWith('image/')) {
                      alert('Please select a valid image file');
                      return;
                    }
                    
                    // Convert to base64
                    const reader = new FileReader();
                    reader.onload = () => {
                      setProfileData(prev => ({ ...prev, profilePicture: reader.result }));
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 file:cursor-pointer"
              />
              <p className="text-xs text-gray-500 mt-2">Recommended: Square image, max 5MB (JPG, PNG, etc.)</p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                  <input type="text" name="name" value={profileData.name} onChange={handleInputChange} required className="w-full rounded-lg border border-gray-300 p-3 focus:border-indigo-500 focus:ring-indigo-500" placeholder="Enter your full name"/>
          </div>
          <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {userType === 'student' ? 'Degree Program *' : 'Current Title/Position *'}
                  </label>
                  <input type="text" name="title" value={profileData.title} onChange={handleInputChange} required className="w-full rounded-lg border border-gray-300 p-3 focus:border-indigo-500 focus:ring-indigo-500" placeholder={userType === 'student' ? 'PhD in Computer Science' : 'Associate Professor'}/>
          </div>
          <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">University/Institution *</label>
                  <input type="text" name="university" value={profileData.university} onChange={handleInputChange} required className="w-full rounded-lg border border-gray-300 p-3 focus:border-indigo-500 focus:ring-indigo-500" placeholder="Enter university/institution"/>
          </div>
          <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {userType === 'student' ? 'Current Semester/Year' : 'Department *'}
                  </label>
                  <input type="text" name="department" value={profileData.department} onChange={handleInputChange} className="w-full rounded-lg border border-gray-300 p-3 focus:border-indigo-500 focus:ring-indigo-500" placeholder={userType === 'student' ? 'Fall 2024, 3rd Year' : 'Computer Science'}/>
          </div>
          <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {userType === 'student' ? 'Research Interests' : 'Primary Research Area *'}
                  </label>
                  <input type="text" name="researchArea" value={profileData.researchArea} onChange={handleInputChange} className="w-full rounded-lg border border-gray-300 p-3 focus:border-indigo-500 focus:ring-indigo-500" placeholder="Machine Learning, AI, etc."/>
          </div>
          <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">About Me / Professional Bio *</label>
                  <textarea name="bio" rows="4" value={profileData.bio} onChange={handleInputChange} required className="w-full rounded-lg border border-gray-300 p-3 focus:border-indigo-500 focus:ring-indigo-500" placeholder="Tell us about yourself..."></textarea>
          </div>
        </div>
              <div className="flex justify-end mt-6">
                <button type="submit" disabled={loading} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50">
                  {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Save Changes'}
                </button>
        </div>
            </form>
          );
        case 'education':
          return (
            <div className="space-y-6">
              {(profileData.education || []).map((edu, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-6 bg-gray-50 relative">
                  {(profileData.education && profileData.education.length > 1) && (
                    <button
                      type="button"
                      onClick={() => removeArrayEntry('education', index)}
                      className="absolute top-4 right-4 text-red-500 hover:text-red-700 transition-colors"
                      title="Remove this education entry"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Degree/Certification *</label>
                      <input type="text" value={edu.degree || ''} onChange={(e) => handleArrayInputChange('education', index, 'degree', e.target.value)} className="w-full rounded-lg border border-gray-300 p-3 focus:border-indigo-500 focus:ring-indigo-500" placeholder="PhD, Masters, etc."/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Institution *</label>
                      <input type="text" value={edu.institution || ''} onChange={(e) => handleArrayInputChange('education', index, 'institution', e.target.value)} className="w-full rounded-lg border border-gray-300 p-3 focus:border-indigo-500 focus:ring-indigo-500" placeholder="University name"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                      <input type="date" value={edu.startDate || ''} onChange={(e) => handleArrayInputChange('education', index, 'startDate', e.target.value)} className="w-full rounded-lg border border-gray-300 p-3 focus:border-indigo-500 focus:ring-indigo-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date / Expected</label>
                      <input type="date" value={edu.endDate || ''} onChange={(e) => handleArrayInputChange('education', index, 'endDate', e.target.value)} className="w-full rounded-lg border border-gray-300 p-3 focus:border-indigo-500 focus:ring-indigo-500"/>
                </div>
                {userType === 'student' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">GPA (Optional)</label>
                        <input type="text" value={edu.gpa || ''} onChange={(e) => handleArrayInputChange('education', index, 'gpa', e.target.value)} className="w-full rounded-lg border border-gray-300 p-3 focus:border-indigo-500 focus:ring-indigo-500" placeholder="3.8"/>
                  </div>
                )}
              </div>
                </div>
              ))}
              {(!profileData.education || profileData.education.length === 0) && (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50">
                  <p className="text-center text-gray-500 mb-4">No education entries yet. Click the + button to add one.</p>
                </div>
              )}
              <button
                type="button"
                onClick={() => addArrayEntry('education', { degree: '', institution: '', startDate: '', endDate: '', gpa: '' })}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
              >
                <Plus className="w-5 h-5" />
                <span>Add Education</span>
              </button>
              <div className="flex justify-end mt-6">
                <button type="button" onClick={handleSaveProfile} disabled={loading} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50">
                  {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Save Changes'}
                </button>
              </div>
            </div>
          );
        case 'experience':
          return (
            <div className="space-y-6">
              {(profileData.experience || []).map((exp, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-6 bg-gray-50 relative">
                  {(profileData.experience && profileData.experience.length > 1) && (
                    <button
                      type="button"
                      onClick={() => removeArrayEntry('experience', index)}
                      className="absolute top-4 right-4 text-red-500 hover:text-red-700 transition-colors"
                      title="Remove this experience entry"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Position/Title *</label>
                      <input type="text" value={exp.title || ''} onChange={(e) => handleArrayInputChange('experience', index, 'title', e.target.value)} className="w-full rounded-lg border border-gray-300 p-3 focus:border-indigo-500 focus:ring-indigo-500" placeholder="Research Assistant, etc."/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Organization *</label>
                      <input type="text" value={exp.organization || ''} onChange={(e) => handleArrayInputChange('experience', index, 'organization', e.target.value)} className="w-full rounded-lg border border-gray-300 p-3 focus:border-indigo-500 focus:ring-indigo-500" placeholder="Organization name"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                      <input type="date" value={exp.startDate || ''} onChange={(e) => handleArrayInputChange('experience', index, 'startDate', e.target.value)} className="w-full rounded-lg border border-gray-300 p-3 focus:border-indigo-500 focus:ring-indigo-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                      <input type="date" value={exp.endDate || ''} onChange={(e) => handleArrayInputChange('experience', index, 'endDate', e.target.value)} className="w-full rounded-lg border border-gray-300 p-3 focus:border-indigo-500 focus:ring-indigo-500"/>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                      <textarea rows="3" value={exp.description || ''} onChange={(e) => handleArrayInputChange('experience', index, 'description', e.target.value)} className="w-full rounded-lg border border-gray-300 p-3 focus:border-indigo-500 focus:ring-indigo-500" placeholder="Describe your role and responsibilities..."></textarea>
                </div>
              </div>
                </div>
              ))}
              {(!profileData.experience || profileData.experience.length === 0) && (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50">
                  <p className="text-center text-gray-500 mb-4">No experience entries yet. Click the + button to add one.</p>
                </div>
              )}
              <button
                type="button"
                onClick={() => addArrayEntry('experience', { title: '', organization: '', startDate: '', endDate: '', description: '' })}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
              >
                <Plus className="w-5 h-5" />
                <span>Add Experience</span>
              </button>
              <div className="flex justify-end mt-6">
                <button type="button" onClick={handleSaveProfile} disabled={loading} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50">
                  {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Save Changes'}
                </button>
              </div>
            </div>
          );
        case 'publications':
          return (
            <div className="space-y-6">
              {(profileData.publications || []).map((pub, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-6 bg-gray-50 relative">
                  {(profileData.publications && profileData.publications.length > 1) && (
                    <button
                      type="button"
                      onClick={() => removeArrayEntry('publications', index)}
                      className="absolute top-4 right-4 text-red-500 hover:text-red-700 transition-colors"
                      title="Remove this publication entry"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                      <input type="text" value={pub.title || ''} onChange={(e) => handleArrayInputChange('publications', index, 'title', e.target.value)} className="w-full rounded-lg border border-gray-300 p-3 focus:border-indigo-500 focus:ring-indigo-500" placeholder="Paper/Publication title"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Publication Year</label>
                      <input type="number" value={pub.year || ''} onChange={(e) => handleArrayInputChange('publications', index, 'year', e.target.value)} className="w-full rounded-lg border border-gray-300 p-3 focus:border-indigo-500 focus:ring-indigo-500" placeholder="2024"/>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Authors/Co-authors</label>
                      <input type="text" value={pub.authors || ''} onChange={(e) => handleArrayInputChange('publications', index, 'authors', e.target.value)} className="w-full rounded-lg border border-gray-300 p-3 focus:border-indigo-500 focus:ring-indigo-500" placeholder="Author names"/>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Journal/Conference</label>
                      <input type="text" value={pub.journal || ''} onChange={(e) => handleArrayInputChange('publications', index, 'journal', e.target.value)} className="w-full rounded-lg border border-gray-300 p-3 focus:border-indigo-500 focus:ring-indigo-500" placeholder="Journal or conference name"/>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Link/DOI</label>
                      <input type="url" value={pub.link || ''} onChange={(e) => handleArrayInputChange('publications', index, 'link', e.target.value)} className="w-full rounded-lg border border-gray-300 p-3 focus:border-indigo-500 focus:ring-indigo-500" placeholder="https://..."/>
                </div>
              </div>
                </div>
              ))}
              {(!profileData.publications || profileData.publications.length === 0) && (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50">
                  <p className="text-center text-gray-500 mb-4">No publications yet. Click the + button to add one.</p>
                </div>
              )}
              <button
                type="button"
                onClick={() => addArrayEntry('publications', { title: '', year: '', authors: '', journal: '', link: '' })}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
              >
                <Plus className="w-5 h-5" />
                <span>Add Publication</span>
              </button>
              <div className="flex justify-end mt-6">
                <button type="button" onClick={handleSaveProfile} disabled={loading} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50">
                  {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Save Changes'}
                </button>
              </div>
            </div>
          );
        case 'skills':
          return (
            <div className="space-y-6">
              {(profileData.skills || []).map((skill, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50 relative flex items-center gap-4">
                  <input
                    type="text"
                    value={skill || ''}
                    onChange={(e) => {
                      const newSkills = [...(profileData.skills || [])];
                      newSkills[index] = e.target.value;
                      setProfileData(prev => ({ ...prev, skills: newSkills }));
                    }}
                    className="flex-1 rounded-lg border border-gray-300 p-3 focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Enter skill name"
                  />
                  <button
                    type="button"
                    onClick={() => removeArrayEntry('skills', index)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                    title="Remove this skill"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
              </div>
              ))}
              {(!profileData.skills || profileData.skills.length === 0) && (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50">
                  <p className="text-center text-gray-500 mb-4">No skills yet. Click the + button to add one.</p>
                </div>
              )}
              <button
                type="button"
                onClick={() => addArrayEntry('skills', '')}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
              >
                <Plus className="w-5 h-5" />
                <span>Add Skill</span>
              </button>
              <div className="flex justify-end mt-6">
                <button type="button" onClick={handleSaveProfile} disabled={loading} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50">
                  {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Save Changes'}
                </button>
              </div>
            </div>
          );
        case 'projects':
          return (
            <div className="space-y-6">
              {(profileData.projects || []).map((proj, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-6 bg-gray-50 relative">
                  {(profileData.projects && profileData.projects.length > 1) && (
                    <button
                      type="button"
                      onClick={() => removeArrayEntry('projects', index)}
                      className="absolute top-4 right-4 text-red-500 hover:text-red-700 transition-colors"
                      title="Remove this project entry"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Project Title *</label>
                      <input type="text" value={proj.title || ''} onChange={(e) => handleArrayInputChange('projects', index, 'title', e.target.value)} className="w-full rounded-lg border border-gray-300 p-3 focus:border-indigo-500 focus:ring-indigo-500" placeholder="Project name"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                      <input type="text" value={proj.role || ''} onChange={(e) => handleArrayInputChange('projects', index, 'role', e.target.value)} className="w-full rounded-lg border border-gray-300 p-3 focus:border-indigo-500 focus:ring-indigo-500" placeholder="Lead Developer, etc."/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                      <input type="date" value={proj.startDate || ''} onChange={(e) => handleArrayInputChange('projects', index, 'startDate', e.target.value)} className="w-full rounded-lg border border-gray-300 p-3 focus:border-indigo-500 focus:ring-indigo-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                      <input type="date" value={proj.endDate || ''} onChange={(e) => handleArrayInputChange('projects', index, 'endDate', e.target.value)} className="w-full rounded-lg border border-gray-300 p-3 focus:border-indigo-500 focus:ring-indigo-500"/>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                      <textarea rows="3" value={proj.description || ''} onChange={(e) => handleArrayInputChange('projects', index, 'description', e.target.value)} className="w-full rounded-lg border border-gray-300 p-3 focus:border-indigo-500 focus:ring-indigo-500" placeholder="Project description..."></textarea>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Link/Repository</label>
                      <input type="url" value={proj.link || ''} onChange={(e) => handleArrayInputChange('projects', index, 'link', e.target.value)} className="w-full rounded-lg border border-gray-300 p-3 focus:border-indigo-500 focus:ring-indigo-500" placeholder="https://github.com/..."/>
                </div>
              </div>
                </div>
              ))}
              {(!profileData.projects || profileData.projects.length === 0) && (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50">
                  <p className="text-center text-gray-500 mb-4">No projects yet. Click the + button to add one.</p>
                </div>
              )}
              <button
                type="button"
                onClick={() => addArrayEntry('projects', { title: '', role: '', startDate: '', endDate: '', description: '', link: '' })}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
              >
                <Plus className="w-5 h-5" />
                <span>Add Project</span>
              </button>
              <div className="flex justify-end mt-6">
                <button type="button" onClick={handleSaveProfile} disabled={loading} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50">
                  {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Save Changes'}
                </button>
              </div>
            </div>
          );
        case 'achievements':
          return (
            <div className="space-y-6">
              {(profileData.achievements || []).map((ach, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-6 bg-gray-50 relative">
                  {(profileData.achievements && profileData.achievements.length > 1) && (
                    <button
                      type="button"
                      onClick={() => removeArrayEntry('achievements', index)}
                      className="absolute top-4 right-4 text-red-500 hover:text-red-700 transition-colors"
                      title="Remove this achievement entry"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Achievement/Certification *</label>
                      <input type="text" value={ach.title || ''} onChange={(e) => handleArrayInputChange('achievements', index, 'title', e.target.value)} className="w-full rounded-lg border border-gray-300 p-3 focus:border-indigo-500 focus:ring-indigo-500" placeholder="Award or certification name"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Issuing Organization</label>
                      <input type="text" value={ach.organization || ''} onChange={(e) => handleArrayInputChange('achievements', index, 'organization', e.target.value)} className="w-full rounded-lg border border-gray-300 p-3 focus:border-indigo-500 focus:ring-indigo-500" placeholder="Organization name"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                      <input type="date" value={ach.date || ''} onChange={(e) => handleArrayInputChange('achievements', index, 'date', e.target.value)} className="w-full rounded-lg border border-gray-300 p-3 focus:border-indigo-500 focus:ring-indigo-500"/>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                      <textarea rows="3" value={ach.description || ''} onChange={(e) => handleArrayInputChange('achievements', index, 'description', e.target.value)} className="w-full rounded-lg border border-gray-300 p-3 focus:border-indigo-500 focus:ring-indigo-500" placeholder="Brief description..."></textarea>
                </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Link/Certificate URL (Optional)</label>
                      <input type="url" value={ach.link || ''} onChange={(e) => handleArrayInputChange('achievements', index, 'link', e.target.value)} className="w-full rounded-lg border border-gray-300 p-3 focus:border-indigo-500 focus:ring-indigo-500" placeholder="https://..."/>
              </div>
                  </div>
                </div>
              ))}
              {(!profileData.achievements || profileData.achievements.length === 0) && (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50">
                  <p className="text-center text-gray-500 mb-4">No achievements yet. Click the + button to add one.</p>
                </div>
              )}
              <button
                type="button"
                onClick={() => addArrayEntry('achievements', { title: '', organization: '', date: '', description: '', link: '' })}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
              >
                <Plus className="w-5 h-5" />
                <span>Add Achievement</span>
              </button>
              <div className="flex justify-end mt-6">
                <button type="button" onClick={handleSaveProfile} disabled={loading} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50">
                  {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Save Changes'}
                </button>
              </div>
            </div>
          );
        case 'contact':
          return (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                  <input type="email" name="email" value={profileData.email || ''} onChange={handleInputChange} className="w-full rounded-lg border border-gray-300 p-3 focus:border-indigo-500 focus:ring-indigo-500" placeholder="your.email@university.edu"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input type="tel" name="phone" value={profileData.phone || ''} onChange={handleInputChange} className="w-full rounded-lg border border-gray-300 p-3 focus:border-indigo-500 focus:ring-indigo-500" placeholder="+1 (555) 123-4567"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn</label>
                  <input type="url" name="linkedin" value={profileData.linkedin || ''} onChange={handleInputChange} className="w-full rounded-lg border border-gray-300 p-3 focus:border-indigo-500 focus:ring-indigo-500" placeholder="https://linkedin.com/in/..."/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Website/Portfolio</label>
                  <input type="url" name="website" value={profileData.website || ''} onChange={handleInputChange} className="w-full rounded-lg border border-gray-300 p-3 focus:border-indigo-500 focus:ring-indigo-500" placeholder="https://..."/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">GitHub</label>
                  <input type="url" name="github" value={profileData.github || ''} onChange={handleInputChange} className="w-full rounded-lg border border-gray-300 p-3 focus:border-indigo-500 focus:ring-indigo-500" placeholder="https://github.com/..."/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Twitter/X</label>
                  <input type="url" name="twitter" value={profileData.twitter || ''} onChange={handleInputChange} className="w-full rounded-lg border border-gray-300 p-3 focus:border-indigo-500 focus:ring-indigo-500" placeholder="https://twitter.com/..."/>
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <button type="button" onClick={handleSaveProfile} disabled={loading} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50">
                  {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Save Changes'}
                </button>
              </div>
            </div>
          );
        default:
          return null;
      }
    };

    return (
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl mx-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-800">{profileData.name || 'Academic Profile'}</h2>
              <p className="text-gray-600 mt-1">
                {profileData.title || userType === 'student' ? 'Student' : 'Professor'} 
                {profileData.university && ` • ${profileData.university}`}
                {profileData.department && ` • ${profileData.department}`}
              </p>
          </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
          <button
                key={tab.id}
                onClick={() => setActiveProfileTab(tab.id)}
                className={`px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeProfileTab === tab.id
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
          </button>
            ))}
        </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {renderTabContent()}
        </div>
    </div>
  );
  };

  const renderFeedTab = () => (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Enhanced Post Creator Section */}
      <div className="mb-8">
      <PostCreator 
        db={db} 
        userId={userId} 
        userName={profileData.name} 
        userTitle={profileData.title} 
        onPostCreated={() => {}}
      />
      </div>
      
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 p-6 rounded-2xl shadow-2xl mb-6 text-white">
        <h3 className="text-3xl font-bold text-white flex items-center">
          <Globe className="w-8 h-8 mr-3" />
        Global Academic Feed
      </h3>
        <p className="text-indigo-100 mt-2 text-sm">Discover research updates, collaborations, and academic insights from your network</p>
      </div>
      
      <PostsFeed 
        db={db} 
        isAuthReady={isAuthReady} 
        userId={userId} 
        onSendNotification={sendNotification}
      />
    </div>
  );

  // Contact Us Form State (moved to component level to follow Rules of Hooks)
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    category: 'general'
  });
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  // Update contact form when profile data is available
  useEffect(() => {
    if (profileData.name && auth?.currentUser?.email) {
      setContactForm(prev => ({
        ...prev,
        name: profileData.name,
        email: auth.currentUser.email
      }));
    }
  }, [profileData.name, auth?.currentUser?.email]);

  // --- Contact Us Tab Component ---
  const renderContactUsTab = () => {

    const handleContactInputChange = (e) => {
      const { name, value } = e.target;
      setContactForm(prev => ({ ...prev, [name]: value }));
    };

    const handleContactSubmit = async (e) => {
      e.preventDefault();
      if (!db || !contactForm.name || !contactForm.email || !contactForm.subject || !contactForm.message) {
        setSubmitMessage('Please fill in all required fields.');
        setTimeout(() => setSubmitMessage(''), 5000);
        return;
      }

      setIsSubmittingContact(true);
      setSubmitMessage('');

      try {
        // Store in Firestore
        const contactsRef = collection(db, `artifacts/${appId}/public/data/contacts`);
        await addDoc(contactsRef, {
          ...contactForm,
          userId: userId || null,
          status: 'new',
          createdAt: serverTimestamp(),
          isRead: false
        });

        // Also send email to your inbox
        try {
          const emailResponse = await fetch('http://localhost:3003/api/contact', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: contactForm.name,
              email: contactForm.email,
              subject: contactForm.subject,
              message: contactForm.message,
              category: contactForm.category,
              userId: userId || null
            })
          });

          if (emailResponse.ok) {
            console.log('✅ Contact email sent successfully');
          } else {
            console.warn('⚠️ Failed to send contact email, but message saved to database');
          }
        } catch (emailError) {
          console.error('Error sending contact email:', emailError);
          // Don't show error to user - message is still saved in Firestore
        }

        setSubmitMessage('Thank you! Your message has been sent successfully. We\'ll get back to you soon.');
        setContactForm({
          name: profileData.name || '',
          email: auth?.currentUser?.email || '',
          subject: '',
          message: '',
          category: 'general'
        });
        
        setTimeout(() => setSubmitMessage(''), 8000);
      } catch (error) {
        console.error('Error submitting contact form:', error);
        setSubmitMessage('Error: Failed to send message. Please try again.');
        setTimeout(() => setSubmitMessage(''), 5000);
      } finally {
        setIsSubmittingContact(false);
      }
    };

    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 p-8 rounded-2xl shadow-2xl mb-8 text-white">
          <h2 className="text-4xl font-bold mb-3 flex items-center">
            <Mail className="w-10 h-10 mr-3" />
            Contact Us
          </h2>
          <p className="text-indigo-100 text-lg">
            Have a question, suggestion, or need help? We'd love to hear from you!
          </p>
        </div>

        {/* Contact Information Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all">
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
              <Mail className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Email Us</h3>
            <p className="text-gray-600 text-sm">researchlinksupport@gmail.com</p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
              <Phone className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Call Us</h3>
            <p className="text-gray-600 text-sm">+1 (555) 123-4567</p>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Send us a Message</h3>
          
          {submitMessage && (
            <div className={`mb-6 p-4 rounded-lg ${submitMessage.includes('Thank you') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {submitMessage}
            </div>
          )}

          <form onSubmit={handleContactSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={contactForm.name}
                  onChange={handleContactInputChange}
                  required
                  className="w-full rounded-lg border border-gray-300 p-3 focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="John Doe"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={contactForm.email}
                  onChange={handleContactInputChange}
                  required
                  className="w-full rounded-lg border border-gray-300 p-3 focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="john@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                name="category"
                value={contactForm.category}
                onChange={handleContactInputChange}
                required
                className="w-full rounded-lg border border-gray-300 p-3 focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="general">General Inquiry</option>
                <option value="technical">Technical Support</option>
                <option value="feature">Feature Request</option>
                <option value="bug">Bug Report</option>
                <option value="partnership">Partnership</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject *
              </label>
              <input
                type="text"
                name="subject"
                value={contactForm.subject}
                onChange={handleContactInputChange}
                required
                className="w-full rounded-lg border border-gray-300 p-3 focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="What is your message about?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message *
              </label>
              <textarea
                name="message"
                value={contactForm.message}
                onChange={handleContactInputChange}
                required
                rows={6}
                className="w-full rounded-lg border border-gray-300 p-3 focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Please provide details about your inquiry..."
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmittingContact}
                className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center"
              >
                {isSubmittingContact ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Send Message
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* FAQ Section */}
        <div className="mt-12 bg-gradient-to-r from-gray-50 to-indigo-50 rounded-xl p-8 border border-gray-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">How do I update my profile?</h4>
              <p className="text-gray-600 text-sm">Go to the Profile tab and fill in your information. Make sure to save your changes.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">How does the matching system work?</h4>
              <p className="text-gray-600 text-sm">Our AI-powered matchmaker analyzes your research interests and connects you with compatible researchers.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Can I collaborate with researchers from other universities?</h4>
              <p className="text-gray-600 text-sm">Yes! ResearchLink connects researchers globally, regardless of institution.</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMatchmakerTab = () => (
    <Matchmaker 
      db={db} 
      userId={userId} 
      userName={profileData.name} 
      userType={userType}
      onStartConversation={async (partner) => {
        // Create chat document immediately to persist it
        if (db && userId && partner.userId) {
          try {
            const participants = [userId, partner.userId].sort();
            const chatId = participants.join('_');
            
            const chatRef = doc(db, `artifacts/${appId}/public/data/chats`, chatId);
            const chatSnap = await getDoc(chatRef);
            
            if (!chatSnap.exists()) {
              await setDoc(chatRef, {
                participants: participants,
                createdAt: serverTimestamp(),
                lastMessage: '',
                lastMessageTime: serverTimestamp(),
                lastMessageSender: ''
              });
              console.log('✅ Created new chat:', chatId, 'with participants:', participants);
            } else {
              console.log('✅ Chat already exists:', chatId, 'with participants:', participants);
            }

            // Log activity for dashboard
            try {
              await addDoc(collection(db, `artifacts/${appId}/public/data/users/${userId}/activity`), {
                type: 'chat_start',
                chatId,
                partnerId: partner.userId,
                name: partner.name,
                createdAt: serverTimestamp(),
              });
            } catch {}
          } catch (error) {
            console.error('Error creating chat:', error);
          }
        }
        
        setPendingConversation(partner);
        setActiveTab('chats');
      }}
    />
  );

  const renderChatsTab = () => (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <ChatsManager 
        db={db} 
        userId={userId} 
        userName={profileData.name || 'User'} 
        userType={userType}
        pendingConversation={pendingConversation}
        onConversationStarted={() => setPendingConversation(null)}
      />
    </div>
  );

  // Fetch matching professors from Firebase based on paper analysis
  const fetchMatchingProfessors = async (db, analysisResult) => {
    if (!db) return [];
    
    try {
      // Extract keywords from analysis - prioritize key_concepts field
      const allText = [
        analysisResult.summary || '',
        analysisResult.key_concepts || '',
        analysisResult.paper_title || ''
      ].join(' ').toLowerCase();
      
      // First, extract explicit key concepts (they're often formatted with ** or numbered)
      const keyConceptsText = (analysisResult.key_concepts || '').toLowerCase();
      const conceptMatches = keyConceptsText.match(/\*\*([^*]+?):?\*\*/g) || [];
      const explicitConcepts = conceptMatches.map(m => m.replace(/\*\*/g, '').replace(/:/g, '').trim().toLowerCase());
      
      // Also extract from numbered/bulleted lists in key concepts
      const listItems = keyConceptsText.match(/(?:^|\n)[-•*]\s+(.+?)(?:\n|$)/g) || [];
      listItems.forEach(item => {
        const text = item.replace(/^[-•*]\s+/, '').trim();
        if (text.length > 3) explicitConcepts.push(text.toLowerCase());
      });
      
      // Extract common keywords from all text (4+ letter words that appear multiple times)
      const words = allText.match(/\b[a-z]{4,}\b/gi) || [];
      const keywordMap = {};
      words.forEach(word => {
        const lower = word.toLowerCase();
        // Skip common stop words
        const stopWords = ['the', 'this', 'that', 'with', 'from', 'they', 'have', 'been', 'were', 'their', 'there', 'analysis', 'research', 'study', 'paper', 'document', 'provide'];
        if (!stopWords.includes(lower)) {
          keywordMap[lower] = (keywordMap[lower] || 0) + 1;
        }
      });
      
      // Combine explicit concepts with top keywords (remove duplicates)
      const allKeywords = [
        ...explicitConcepts.filter(c => c.length > 3),
        ...Object.entries(keywordMap)
          .filter(([_, count]) => count >= 2)
          .sort(([_, a], [__, b]) => b - a)
          .slice(0, 10)
          .map(([word]) => word)
      ];
      
      // Remove duplicates and limit to top 15
      const topKeywords = [...new Set(allKeywords)].slice(0, 15);
      
      console.log('🔍 Searching professors with keywords:', topKeywords);
      
      // Query professors collection
      const professorsCollection = collection(db, `artifacts/${appId}/public/data/professors`);
      const professorsSnapshot = await getDocs(professorsCollection);
      
      const professors = [];
      professorsSnapshot.forEach(doc => {
        const data = doc.data();
        if (!data.isActive && data.isActive !== undefined) return; // Skip inactive
        
        const professorKeywords = Array.isArray(data.keywords) 
          ? data.keywords.map(k => k.toLowerCase())
          : (typeof data.keywords === 'string' 
              ? data.keywords.split(',').map(k => k.trim().toLowerCase())
              : []);
        
        const researchArea = (data.researchArea || '').toLowerCase();
        const department = (data.department || '').toLowerCase();
        const bio = (data.bio || '').toLowerCase();
        
        // Calculate match score
        let matchScore = 0;
        topKeywords.forEach(keyword => {
          if (professorKeywords.includes(keyword)) matchScore += 3;
          if (researchArea.includes(keyword)) matchScore += 2;
          if (department.includes(keyword)) matchScore += 1;
          if (bio.includes(keyword)) matchScore += 1;
        });
        
        // Also check if researchArea or keywords contain any major terms from the paper
        const paperLower = allText.toLowerCase();
        if (researchArea && paperLower.includes(researchArea.substring(0, 10))) {
          matchScore += 5;
        }
        
        if (matchScore > 0) {
          professors.push({
            id: doc.id,
            ...data,
            matchScore
          });
        }
      });
      
      // Sort by match score and return top 5-8 professors
      professors.sort((a, b) => b.matchScore - a.matchScore);
      return professors.slice(0, 8);
      
    } catch (error) {
      console.error('Error fetching professors:', error);
      return [];
    }
  };
  
  // Format Firebase professors into a formatted suggestion list
  const formatProfessorSuggestions = (professors, analysisResult) => {
    if (!professors || professors.length === 0) {
      return analysisResult.professor_suggestions || 'No matching professors found in the database.';
    }
    
    let formatted = `**Based on your paper analysis, here are matching professors from our database:**\n\n`;
    
    professors.forEach((prof, index) => {
      formatted += `${index + 1}. **${prof.name || 'Professor'}**\n`;
      if (prof.title) formatted += `   ${prof.title}\n`;
      if (prof.university) formatted += `   ${prof.university}`;
      if (prof.department) formatted += `, ${prof.department}`;
      if (prof.university || prof.department) formatted += `\n`;
      if (prof.researchArea) formatted += `   **Research Area:** ${prof.researchArea}\n`;
      if (prof.lab) formatted += `   **Lab/Group:** ${prof.lab}\n`;
      if (prof.email) formatted += `   **Email:** ${prof.email}\n`;
      if (prof.website) formatted += `   **Website:** ${prof.website}\n`;
      if (prof.bio && prof.bio.length > 0) {
        const shortBio = prof.bio.length > 150 ? prof.bio.substring(0, 150) + '...' : prof.bio;
        formatted += `   ${shortBio}\n`;
      }
      if (prof.availability) formatted += `   **Availability:** ${prof.availability}\n`;
      formatted += `\n`;
    });
    
    formatted += `\n*To connect with these professors, visit their profiles in the Matchmaker section.*`;
    
    return formatted;
  };
  
  // Format text content with proper headings, lists, and structure
  const formatTextContent = (text, section) => {
    if (!text) return '';
    
    // Split into lines for processing
    const lines = text.split('\n');
    const output = [];
    let currentParagraph = [];
    let currentList = [];
    let inList = false;
    let listType = 'ul'; // 'ul' or 'ol'
    
    const closeParagraph = () => {
      if (currentParagraph.length > 0) {
        const paraText = currentParagraph.join(' ').trim();
        if (paraText) {
          // Process bold text
          let processed = paraText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
          processed = processed.replace(/\*(.*?)\*/g, '<strong>$1</strong>');
          output.push(`<p class="mb-4">${processed}</p>`);
        }
        currentParagraph = [];
      }
    };
    
    const closeList = () => {
      if (inList && currentList.length > 0) {
        const listClass = listType === 'ol' ? 'list-decimal ml-6 mb-4 space-y-2' : 'list-disc ml-6 mb-4 space-y-2';
        if (listType === 'ol') {
          output.push(`<ol class="${listClass}">${currentList.join('')}</ol>`);
        } else {
          output.push(`<ul class="${listClass}">${currentList.join('')}</ul>`);
        }
        currentList = [];
        inList = false;
      }
    };
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const nextLine = i < lines.length - 1 ? lines[i + 1].trim() : '';
      
      // Detect markdown headers (# Header) - check for 1-6 hashes
      if (line.startsWith('#')) {
        closeParagraph();
        closeList();
        const headerText = line.replace(/^#+\s+/, '').trim();
        // Process bold and italic in headers
        let processedHeader = headerText.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        processedHeader = processedHeader.replace(/\*([^*]+)\*/g, '<em>$1</em>');
        
        if (line.startsWith('######')) {
          output.push(`<h6 class="text-base font-bold mt-4 mb-2 text-gray-900">${processedHeader}</h6>`);
        } else if (line.startsWith('#####')) {
          output.push(`<h5 class="text-lg font-bold mt-5 mb-2 text-gray-900">${processedHeader}</h5>`);
        } else if (line.startsWith('####')) {
          output.push(`<h4 class="text-lg font-bold mt-5 mb-2 text-gray-900">${processedHeader}</h4>`);
        } else if (line.startsWith('###')) {
          output.push(`<h3 class="text-lg font-bold mt-4 mb-3 text-gray-900">${processedHeader}</h3>`);
        } else if (line.startsWith('##')) {
          output.push(`<h2 class="text-xl font-bold mt-5 mb-3 text-gray-900">${processedHeader}</h2>`);
        } else {
          output.push(`<h1 class="text-2xl font-bold mt-5 mb-4 text-gray-900">${processedHeader}</h1>`);
        }
        continue;
      }
      
      // Detect Activity headings (e.g., "Activity 1:", "**Activity 1:**", "Activity 1: Description")
      const activityMatch = line.match(/^\*?\*?Activity\s+(\d+)[:.]\*?\*?\s*(.+)?$/i);
      if (activityMatch) {
        closeParagraph();
        closeList();
        const activityTitle = `Activity ${activityMatch[1]}`;
        const activityDesc = activityMatch[2]?.trim();
        output.push(`<h3 class="text-xl font-bold mt-6 mb-3 text-gray-900">${activityTitle}</h3>`);
        if (activityDesc) {
          let processed = activityDesc.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
          processed = processed.replace(/\*(.*?)\*/g, '<strong>$1</strong>');
          output.push(`<p class="mb-4">${processed}</p>`);
        }
        continue;
      }
      
      // Detect numbered sections with colons (e.g., "1. What You'll Need:", "2. What You'll Create:")
      const numberedSectionMatch = line.match(/^(\d+)\.\s+\*\*?([^*]+)\*\*?:?\s*(.+)?$/);
      if (numberedSectionMatch) {
        closeParagraph();
        closeList();
        const sectionTitle = numberedSectionMatch[2].trim();
        const sectionDesc = numberedSectionMatch[3]?.trim();
        output.push(`<h3 class="text-xl font-bold mt-6 mb-3 text-gray-900">${sectionTitle}</h3>`);
        if (sectionDesc) {
          let processed = sectionDesc.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
          processed = processed.replace(/\*(.*?)\*/g, '<strong>$1</strong>');
          output.push(`<p class="mb-4">${processed}</p>`);
        }
        continue;
      }
      
      // Detect bold headings (e.g., "**Paper Overview:**" or "**Text:**")
      const boldHeadingMatch = line.match(/^\*\*([^*:]+):?\*\*\s*$/);
      if (boldHeadingMatch) {
        closeParagraph();
        closeList();
        output.push(`<h3 class="text-xl font-bold mt-6 mb-3 text-gray-900">${boldHeadingMatch[1].trim()}</h3>`);
        continue;
      }
      
      // Detect numbered lists (1., 2., etc.) - but not if it's already a section heading
      const numberedMatch = line.match(/^(\d+)\.\s+(.+)$/);
      if (numberedMatch) {
        closeParagraph();
        if (inList && listType !== 'ol') {
          closeList();
        }
        inList = true;
        listType = 'ol';
        // Process bold text in list items
        let itemText = numberedMatch[2].replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        itemText = itemText.replace(/\*(.*?)\*/g, '<strong>$1</strong>');
        currentList.push(`<li class="mb-2">${itemText}</li>`);
        continue;
      }
      
      // Detect bullet lists (-, •, *)
      const bulletMatch = line.match(/^[•*\-]\s+(.+)$/);
      if (bulletMatch) {
        closeParagraph();
        if (inList && listType !== 'ul') {
          closeList();
        }
        inList = true;
        listType = 'ul';
        // Process bold text in list items
        let itemText = bulletMatch[1].replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        itemText = itemText.replace(/\*(.*?)\*/g, '<strong>$1</strong>');
        currentList.push(`<li class="mb-2">${itemText}</li>`);
        continue;
      }
      
      // Regular text line
      if (line) {
        // If we're in a list, close it first
        if (inList) {
          closeList();
        }
        
        // Check if this line is a bold heading followed by text (e.g., "**Heading:** text")
        const headingWithTextMatch = line.match(/^\*\*([^*:]+):\*\*\s*(.+)$/);
        if (headingWithTextMatch) {
          closeParagraph();
          output.push(`<h3 class="text-xl font-bold mt-6 mb-3 text-gray-900">${headingWithTextMatch[1].trim()}</h3>`);
          // Add the text as a paragraph
          const remainingText = headingWithTextMatch[2].trim();
          if (remainingText) {
            let processed = remainingText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            processed = processed.replace(/\*(.*?)\*/g, '<strong>$1</strong>');
            output.push(`<p class="mb-4">${processed}</p>`);
          }
        } else {
          // Regular paragraph line - process markdown formatting
          let processedLine = line;
          // Replace **bold** with <strong>
          processedLine = processedLine.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold">$1</strong>');
          // Replace *italic* but only if not part of **bold**
          processedLine = processedLine.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
          // Replace horizontal rules (---)
          if (processedLine.trim() === '---' || processedLine.trim().match(/^[-]{3,}$/)) {
            closeParagraph();
            output.push('<hr class="my-4 border-gray-300" />');
            continue;
          }
          currentParagraph.push(processedLine);
        }
      } else {
        // Empty line - close current paragraph and list
        closeParagraph();
        if (inList && nextLine && !nextLine.match(/^[•*\-]/) && !nextLine.match(/^\d+\./)) {
          closeList();
        }
      }
    }
    
    // Close any remaining paragraph or list
    closeParagraph();
    closeList();
    
    return output.join('');
  };

  // --- PAPER ANALYSIS TAB ---
  const renderPaperAnalysisTab = () => (
    <div className="max-w-[1400px] mx-auto px-4">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center mb-4">
          <Brain className="w-16 h-16 text-purple-600 mr-4" />
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Multi-Tool Research Hub
          </h1>
        </div>
        <p className="text-gray-600 text-xl">
          AI-powered paper analysis with automatic summarization, concept extraction, and resource suggestions. Plus comprehensive academic mentorship workflows with personalized learning plans and guidance.
        </p>
      </div>

      {/* Paper Analysis Content */}
      {activeFeature === 'paper-analysis' && (
        <div className="bg-white rounded-2xl shadow-xl p-10 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-3 flex items-center">
            <FileText className="w-8 h-8 mr-3 text-blue-600" />
            Upload Research Paper
          </h2>
          <p className="text-gray-700 mb-8 text-lg">
            Upload a PDF, DOCX, or TXT file to get AI-powered analysis including summarization, key concepts, resources, and professor suggestions.
          </p>

          {!paperAnalysisResult ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Research Paper</label>
              <div className="flex items-center gap-4 mb-4">
                <label className="flex-1 cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf,.docx,.doc,.txt"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setSelectedFile(file);
                        setMessage('');
                      }
                    }}
                    className="hidden"
                    disabled={paperAnalysisLoading}
                    id="paper-upload-input"
                  />
                  <div className={`w-full p-4 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${
                    selectedFile 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 hover:border-blue-400'
                  }`}>
                    {selectedFile ? (
                      <div className="flex flex-col items-center justify-center gap-2">
                        <FileText className="w-8 h-8 text-blue-600" />
                        <span className="text-gray-700 font-medium">{selectedFile.name}</span>
                        <span className="text-sm text-gray-500">({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-2">
                        <FileText className="w-10 h-10 text-gray-400" />
                        <span className="text-gray-500">Choose File or drag and drop</span>
                        <span className="text-xs text-gray-400">Click to browse</span>
                      </div>
                    )}
                  </div>
                </label>
                {selectedFile && (
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      document.getElementById('paper-upload-input').value = '';
                    }}
                    className="px-4 py-2 text-red-600 hover:text-red-700 border border-red-300 rounded-lg"
                    disabled={paperAnalysisLoading}
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                )}
              </div>
              <p className="text-sm text-gray-500 mb-6">Supported formats: PDF, DOCX, DOC, TXT (Max 16MB)</p>
              
              <button
                onClick={async () => {
                  if (!selectedFile) {
                    setMessage('Please select a file first');
                    setTimeout(() => setMessage(''), 3000);
                    return;
                  }
                  
                  // Validate file size
                  if (selectedFile.size > 16 * 1024 * 1024) {
                    setMessage('File size exceeds 16MB limit');
                    setTimeout(() => setMessage(''), 3000);
                    return;
                  }
                  
                  setPaperAnalysisLoading(true);
                  setMessage('');
                  
                  const formData = new FormData();
                  formData.append('file', selectedFile);
                  
                  try {
                    const response = await fetch('http://localhost:8080/api/paper-analysis', {
                      method: 'POST',
                      body: formData,
                    });
                    
                    if (!response.ok) {
                      const errorData = await response.json().catch(() => ({ error: 'Analysis failed' }));
                      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
                    }
                    
                    const result = await response.json();
                    
                    // Fetch matching professors from Firebase based on analysis
                    let professorSuggestions = result.professor_suggestions || '';
                    try {
                      const matchingProfessors = await fetchMatchingProfessors(db, result);
                      if (matchingProfessors && matchingProfessors.length > 0) {
                        // Format Firebase professors into a formatted suggestion list
                        professorSuggestions = formatProfessorSuggestions(matchingProfessors, result);
                      }
                    } catch (profError) {
                      console.error('Error fetching professors from Firebase:', profError);
                      // Keep the AI-generated suggestions if Firebase lookup fails
                    }
                    
                    // Update result with Firebase professor suggestions
                    const enhancedResult = {
                      ...result,
                      professor_suggestions: professorSuggestions
                    };
                    
                    setPaperAnalysisResult(enhancedResult);
                    setSelectedFile(null);
                    document.getElementById('paper-upload-input').value = '';
                  } catch (error) {
                    console.error('Paper analysis error:', error);
                    let errorMsg = error.message;
                    if (errorMsg.includes('Failed to fetch') || errorMsg.includes('NetworkError') || errorMsg.includes('CORS')) {
                      errorMsg = 'Cannot connect to Python service. Please ensure the Python Flask service is running on port 8080. Start it with: cd Academic-Mentorship-workflow-using-Langraph && python3 app.py';
                    }
                    setMessage(`Error: ${errorMsg}`);
                    setTimeout(() => setMessage(''), 6000);
                  } finally {
                    setPaperAnalysisLoading(false);
                  }
                }}
                disabled={paperAnalysisLoading || !selectedFile}
                className="w-full py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg flex items-center justify-center"
              >
                {paperAnalysisLoading ? (
                  <>
                    <Loader2 className="animate-spin h-6 w-6 mr-3" />
                    Analyzing Paper...
                  </>
                ) : (
                  <>
                    <Search className="w-6 h-6 mr-3" />
                    Analyze Paper
                  </>
                )}
              </button>
              {paperAnalysisLoading && (
                <p className="text-sm text-gray-500 mt-4 text-center">
                  Processing your paper... This may take a minute.
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-6 mt-8">
              {/* Paper Summary Card */}
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                <div 
                  className="bg-gray-50 px-6 py-4 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => {
                    const content = document.getElementById('summary-card-content');
                    const icon = document.getElementById('summary-card-icon');
                    if (content) {
                      content.classList.toggle('hidden');
                      if (icon) {
                        icon.style.transform = content.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(180deg)';
                      }
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">📄</span>
                      <h3 className="text-xl font-semibold text-gray-900">Paper Summary</h3>
                    </div>
                    <span id="summary-card-icon" className="text-gray-500 transition-transform">▼</span>
                  </div>
                </div>
                <div id="summary-card-content" className="p-6 max-h-[400px] overflow-y-auto">
                  <div 
                    className="paper-result-text"
                    dangerouslySetInnerHTML={{ __html: formatTextContent(paperAnalysisResult.summary || '', 'summary') }}
                  />
                </div>
              </div>

              {/* Key Concepts Card */}
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                <div 
                  className="bg-gray-50 px-6 py-4 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => {
                    const content = document.getElementById('concepts-card-content');
                    const icon = document.getElementById('concepts-card-icon');
                    if (content) {
                      content.classList.toggle('hidden');
                      if (icon) {
                        icon.style.transform = content.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(180deg)';
                      }
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🧠</span>
                      <h3 className="text-xl font-semibold text-gray-900">Key Concepts</h3>
                    </div>
                    <span id="concepts-card-icon" className="text-gray-500 transition-transform">▼</span>
                  </div>
                </div>
                <div id="concepts-card-content" className="p-6 max-h-[400px] overflow-y-auto">
                  <div 
                    className="paper-result-text"
                    dangerouslySetInnerHTML={{ __html: formatTextContent(paperAnalysisResult.key_concepts || '', 'key_concepts') }}
                  />
                </div>
              </div>

              {/* Related Resources Card */}
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                <div 
                  className="bg-gray-50 px-6 py-4 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => {
                    const content = document.getElementById('resources-card-content');
                    const icon = document.getElementById('resources-card-icon');
                    if (content) {
                      content.classList.toggle('hidden');
                      if (icon) {
                        icon.style.transform = content.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(180deg)';
                      }
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">📚</span>
                      <h3 className="text-xl font-semibold text-gray-900">Related Resources</h3>
                    </div>
                    <span id="resources-card-icon" className="text-gray-500 transition-transform">▼</span>
                  </div>
                </div>
                <div id="resources-card-content" className="p-6 max-h-[400px] overflow-y-auto">
                  <div 
                    className="paper-result-text"
                    dangerouslySetInnerHTML={{ __html: formatTextContent(paperAnalysisResult.related_resources || '', 'related_resources') }}
                  />
                </div>
              </div>

              {/* Professor Suggestions Card */}
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                <div 
                  className="bg-gray-50 px-6 py-4 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => {
                    const content = document.getElementById('professors-card-content');
                    const icon = document.getElementById('professors-card-icon');
                    if (content) {
                      content.classList.toggle('hidden');
                      if (icon) {
                        icon.style.transform = content.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(180deg)';
                      }
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">👨‍🏫</span>
                      <h3 className="text-xl font-semibold text-gray-900">Professor Suggestions</h3>
                    </div>
                    <span id="professors-card-icon" className="text-gray-500 transition-transform">▼</span>
                  </div>
                </div>
                <div id="professors-card-content" className="p-6 max-h-[400px] overflow-y-auto">
                  <div 
                    className="paper-result-text"
                    dangerouslySetInnerHTML={{ __html: formatTextContent(paperAnalysisResult.professor_suggestions || '', 'professor_suggestions') }}
                  />
                </div>
              </div>
              
              <div className="mt-4">
                <button
                  onClick={() => {
                    setPaperAnalysisResult(null);
                    setSelectedFile(null);
                    document.getElementById('paper-upload-input')?.setAttribute('value', '');
                  }}
                  className="w-full py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold text-lg shadow-lg"
                >
                  Analyze Another Paper
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mentorship Content (shown when activeFeature is 'mentorship') */}
      {activeFeature === 'mentorship' && (
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
            <Brain className="w-6 h-6 mr-2 text-purple-600" />
            Academic Mentorship Workflow
          </h2>
          <p className="text-gray-700 mb-6">
            Get comprehensive academic guidance through AI agent collaboration.
          </p>

          {!mentorshipResult ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Your Academic Request</label>
              <textarea
                value={mentorshipInput}
                onChange={(e) => setMentorshipInput(e.target.value)}
                placeholder="e.g., I want to research machine learning in healthcare"
                className="w-full h-32 p-4 border-2 border-gray-300 rounded-lg mb-6 focus:border-purple-500 focus:ring-purple-500"
                disabled={mentorshipLoading}
              />
              <button
                onClick={async () => {
                  if (!mentorshipInput.trim()) {
                    setMessage('Please enter your academic request');
                    setTimeout(() => setMessage(''), 3000);
                    return;
                  }
                  
                  setMentorshipLoading(true);
                  setMessage('');
                  try {
                    const response = await fetch('http://localhost:3003/api/mentorship', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ user_input: mentorshipInput }),
                    });
                    
                    if (!response.ok) {
                      const errorData = await response.json().catch(() => ({ 
                        error: `HTTP ${response.status}: ${response.statusText}` 
                      }));
                      throw new Error(errorData.error || errorData.details || 'Mentorship workflow failed');
                    }
                    
                    const result = await response.json();
                    setMentorshipResult(result);
                  } catch (error) {
                    console.error('Mentorship workflow error:', error);
                    let errorMsg = error.message;
                    
                    // Check for network/connection errors
                    if (errorMsg.includes('Failed to fetch') || errorMsg.includes('NetworkError') || error.name === 'TypeError') {
                      errorMsg = '⚠️ Backend server is not responding. Please ensure the Node.js backend is running on port 3003. Run: cd rag-backend && npm start';
                    } else if (errorMsg.includes('Python mentorship service is not available')) {
                      errorMsg = '⚠️ Python mentorship service is not available. Please ensure the Python Flask service is running on port 8080. Run: cd Academic-Mentorship-workflow-using-Langraph && python3 app.py';
                    } else if (errorMsg.includes('CORS')) {
                      errorMsg = '⚠️ CORS error detected. The backend may not be properly configured.';
                    }
                    
                    setMessage(`Error: ${errorMsg}`);
                    setTimeout(() => setMessage(''), 6000);
                  } finally {
                    setMentorshipLoading(false);
                  }
                }}
                disabled={mentorshipLoading || !mentorshipInput.trim()}
                className="w-full py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 font-semibold text-lg flex items-center justify-center"
              >
                {mentorshipLoading ? (
                  <>
                    <Loader2 className="animate-spin h-6 w-6 mr-3" />
                    Running Workflow...
                  </>
                ) : (
                  <>
                    <Zap className="w-6 h-6 mr-3" />
                    Run Workflow
                  </>
                )}
              </button>
              {mentorshipLoading && (
                <p className="text-sm text-gray-500 mt-4 text-center">
                  This may take 30-60 seconds as our AI agents work through your request...
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Learning Plan Section */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-xl p-6 shadow-lg">
                <h3 className="text-2xl font-bold text-purple-900 mb-4 flex items-center">
                  <GraduationCap className="w-6 h-6 mr-3" />
                  Learning Plan (Research Scope)
                </h3>
                <div 
                  className="mentorship-content text-purple-900 max-w-none leading-relaxed"
                  style={{
                    lineHeight: '1.75',
                  }}
                  dangerouslySetInnerHTML={{ __html: formatTextContent(mentorshipResult.research_scope, 'research_scope') }}
                />
              </div>
              
              {/* Practical Advice Section */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-xl p-6 shadow-lg">
                <h3 className="text-2xl font-bold text-purple-900 mb-4 flex items-center">
                  <BookOpen className="w-6 h-6 mr-3 text-purple-600" />
                  Practical Advice & Methodology
                </h3>
                <div 
                  className="mentorship-content text-purple-900 max-w-none leading-relaxed"
                  style={{
                    lineHeight: '1.75',
                  }}
                  dangerouslySetInnerHTML={{ __html: formatTextContent(mentorshipResult.analyst_report, 'analyst_report') }}
                />
              </div>
              
              {/* Learning Resources Section */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-xl p-6 shadow-lg">
                <h3 className="text-2xl font-bold text-purple-900 mb-4 flex items-center">
                  <Globe className="w-6 h-6 mr-3 text-purple-600" />
                  Learning Resources
                </h3>
                <div 
                  className="mentorship-content text-purple-900 max-w-none leading-relaxed"
                  style={{
                    lineHeight: '1.75',
                  }}
                  dangerouslySetInnerHTML={{ __html: formatTextContent(mentorshipResult.resource_map, 'resource_map') }}
                />
              </div>
              
              {/* Timeline Section */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-xl p-6 shadow-lg">
                <h3 className="text-2xl font-bold text-purple-900 mb-4 flex items-center">
                  <Clock className="w-6 h-6 mr-3 text-purple-600" />
                  Timeline & Success Criteria
                </h3>
                <div 
                  className="mentorship-content text-purple-900 max-w-none leading-relaxed"
                  style={{
                    lineHeight: '1.75',
                  }}
                  dangerouslySetInnerHTML={{ __html: formatTextContent(mentorshipResult.final_report, 'final_report') }}
                />
              </div>
              
              <button
                onClick={() => {
                  setMentorshipResult(null);
                  setMentorshipInput('');
                }}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all font-semibold text-lg shadow-lg"
              >
                Start New Mentorship Request
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // --- MULTI-AGENT MENTORSHIP TAB ---
  const AGENTS = {
    skill_coach: {
      name: 'Skill Coach',
      description: 'Get personalized course recommendations and learning paths',
      type: 'skill_coach',
      icon: '📚'
    },
    career_guide: {
      name: 'Career Guide',
      description: 'Discover scholarships and international opportunities',
      type: 'career_guide',
      icon: '🎓'
    },
    writing_agent: {
      name: 'Writing Assistant',
      description: 'Improve your academic writing and papers',
      type: 'writing_agent',
      icon: '✍️'
    },
    networking_agent: {
      name: 'Networking Guide',
      description: 'Find conferences and networking opportunities',
      type: 'networking_agent',
      icon: '🤝'
    }
  };

  const getExampleQuestions = (agentType) => {
    const questions = {
      skill_coach: [
        "I want to learn machine learning from scratch, where should I start?",
        "Recommend the best Python courses for beginners",
        "What certifications are valuable for data science careers?",
        "I'm interested in web development, suggest a learning path"
      ],
      career_guide: [
        "What scholarships are available for Pakistani students studying abroad?",
        "Tell me about Fulbright scholarship requirements and application process",
        "How can I find research opportunities in Europe?",
        "What are good fellowship programs for PhD students in Computer Science?"
      ],
      writing_agent: [
        "Help me write an abstract for my research paper on artificial intelligence",
        "Review my CV and suggest improvements for academic positions",
        "How should I structure a research proposal for a grant application?",
        "I need help improving the introduction section of my research paper"
      ],
      networking_agent: [
        "What are the best AI and machine learning conferences to attend this year?",
        "Suggest networking opportunities for computer science students in Pakistan",
        "What professional organizations should I join as a researcher?",
        "Recommend online communities and platforms for data science networking"
      ]
    };
    return questions[agentType] || ["How can I help you today?"];
  };

  const handleMultiAgentSubmit = async (e) => {
    e.preventDefault();
    if (!multiAgentInput.trim() || multiAgentLoading) return;

    const userMessage = {
      type: 'user',
      content: multiAgentInput,
    };

    // Add user message
    setMultiAgentMessages(prev => ({
      ...prev,
      [multiAgentSelectedAgent]: [...(prev[multiAgentSelectedAgent] || []), userMessage]
    }));
    
    const queryText = multiAgentInput;
    setMultiAgentInput('');
    setMultiAgentLoading(true);

    try {
      const response = await fetch('http://localhost:3003/api/multi-agent/mentorship', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_type: multiAgentSelectedAgent,
          query: queryText,
          preferred_provider: 'gemini', // Default to Gemini
          session_id: multiAgentSessionIds[multiAgentSelectedAgent] || undefined,
          user_id: userId || undefined
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(errorData.error || errorData.detail || 'Request failed');
      }

      const result = await response.json();

      // Store session ID
      if (result.session_id && !multiAgentSessionIds[multiAgentSelectedAgent]) {
        setMultiAgentSessionIds(prev => ({ ...prev, [multiAgentSelectedAgent]: result.session_id }));
      }

      const agentMessage = {
        type: 'agent',
        content: result.response || result.detail || 'No response',
        response: result,
      };

      // Add agent message
      setMultiAgentMessages(prev => ({
        ...prev,
        [multiAgentSelectedAgent]: [...(prev[multiAgentSelectedAgent] || []), agentMessage]
      }));
    } catch (error) {
      const errorMessage = {
        type: 'agent',
        content: `Sorry, I encountered an error: ${error.message}. Please ensure the Multi-Agent backend is running and the Node.js backend on port 3003 can reach it.`,
      };
      setMultiAgentMessages(prev => ({
        ...prev,
        [multiAgentSelectedAgent]: [...(prev[multiAgentSelectedAgent] || []), errorMessage]
      }));
    } finally {
      setMultiAgentLoading(false);
    }
  };

  const renderMultiAgentMentorshipTab = () => {
    const currentMessages = multiAgentMessages[multiAgentSelectedAgent] || [];
    const agentsList = Object.values(AGENTS);

    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Multi-Agent Mentorship
          </h1>
          <p className="text-gray-600">
            Choose an AI mentor to guide your academic and career journey
          </p>
        </header>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Sidebar - Agent Selection */}
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">
                Select Your Mentor
              </h2>
              <div className="space-y-3">
                {agentsList.map((agent) => (
                  <button
                    key={agent.type}
                    onClick={() => setMultiAgentSelectedAgent(agent.type)}
                    className={`w-full p-6 rounded-xl text-left transition-all duration-200 ${
                      multiAgentSelectedAgent === agent.type
                        ? 'bg-blue-50 border-2 border-blue-500 shadow-lg'
                        : 'bg-white border-2 border-gray-200 hover:border-blue-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="text-4xl flex-shrink-0">{agent.icon}</div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {agent.name}
                        </h3>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {agent.description}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

          </aside>

          {/* Main Chat Area */}
          <main className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-[600px]">
              <div className="border-b border-gray-200 px-6 py-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {AGENTS[multiAgentSelectedAgent]?.icon}
                  </span>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {AGENTS[multiAgentSelectedAgent]?.name}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {AGENTS[multiAgentSelectedAgent]?.description}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                {currentMessages.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center text-gray-500 max-w-md">
                      <p className="text-lg font-semibold mb-4 text-gray-700">
                        👋 Start a conversation with {AGENTS[multiAgentSelectedAgent]?.name}
                      </p>
                      <p className="text-sm mb-6">
                        {AGENTS[multiAgentSelectedAgent]?.description}
                      </p>
                      <div className="space-y-2 text-left">
                        <p className="text-xs font-semibold text-gray-600 mb-2">💡 Example questions:</p>
                        {getExampleQuestions(multiAgentSelectedAgent).map((question, idx) => (
                          <button
                            key={idx}
                            onClick={() => setMultiAgentInput(question)}
                            className="w-full text-left text-xs bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg px-3 py-2 text-gray-700 hover:text-blue-700 transition-colors"
                          >
                            "{question}"
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  currentMessages.map((message, index) => (
                    <div key={index}>
                      {message.type === 'user' ? (
                        <div className="flex gap-3 justify-end">
                          <div className="bg-blue-500 text-white rounded-2xl rounded-tr-sm px-4 py-3 max-w-2xl">
                            <p className="text-sm leading-relaxed">{message.content}</p>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                            <User className="w-5 h-5 text-white" />
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                            <Brain className="w-5 h-5 text-white" />
                          </div>
                          <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 max-w-2xl shadow-sm">
                            {message.response && (
                              <div className="mb-3 flex items-center gap-2 pb-2 border-b border-gray-100">
                                <span className="text-xs font-semibold text-blue-600">
                                  {message.response.agent_name || AGENTS[multiAgentSelectedAgent]?.name}
                                </span>
                              </div>
                            )}
                            <div 
                              className="multi-agent-content text-sm text-gray-800"
                              style={{ lineHeight: '1.75' }}
                              dangerouslySetInnerHTML={{ __html: formatTextContent(message.content, 'multi_agent') }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
                {multiAgentLoading && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    </div>
                    <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3">
                      <p className="text-sm text-gray-600">Thinking...</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 px-6 py-4">
                <form onSubmit={handleMultiAgentSubmit} className="flex gap-2">
                  <input
                    type="text"
                    value={multiAgentInput}
                    onChange={(e) => setMultiAgentInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleMultiAgentSubmit(e);
                      }
                    }}
                    placeholder={currentMessages.length === 0 ? `Ask ${AGENTS[multiAgentSelectedAgent]?.name} anything...` : "Continue the conversation..."}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={multiAgentLoading}
                  />
                  <button
                    type="submit"
                    disabled={multiAgentLoading || !multiAgentInput.trim()}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {multiAgentLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Send
                  </button>
                </form>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  };

  // --- UI RENDER ---

  if (loading && !isAuthReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="animate-spin h-8 w-8 text-indigo-500 mr-3" />
        <p className="text-lg text-gray-700">Connecting to Academic Network...</p>
      </div>
    );
  }

  // Show authentication form if user is not logged in
  if (showAuth && !userId) {
    return renderAuthForm();
  }

  // Show onboarding if user is logged in but hasn't completed setup
  if (showOnboarding && userId) {
    console.log('📝 Showing onboarding for user:', userId);
    return renderOnboarding();
  }

  const mainAppElement = (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8 font-inter">
      <style>{`
        .mentorship-content {
          font-size: 1rem;
          line-height: 1.75;
        }
        .mentorship-content h1 {
          font-size: 1.875rem;
          font-weight: 700;
          margin-top: 1.5rem;
          margin-bottom: 1rem;
          color: #111827;
        }
        .mentorship-content h2 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-top: 1.5rem;
          margin-bottom: 1rem;
          color: #111827;
        }
        .mentorship-content h3 {
          font-size: 1.25rem;
          font-weight: 700;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          color: #111827;
        }
        .mentorship-content h4 {
          font-size: 1.125rem;
          font-weight: 700;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          color: #111827;
        }
        .mentorship-content p {
          margin-bottom: 1rem;
          line-height: 1.75;
        }
        .mentorship-content ul,
        .mentorship-content ol {
          margin-left: 1.5rem;
          margin-bottom: 1rem;
          padding-left: 0.5rem;
        }
        .mentorship-content ul {
          list-style-type: disc;
        }
        .mentorship-content ol {
          list-style-type: decimal;
        }
        .mentorship-content li {
          margin-bottom: 0.5rem;
          line-height: 1.75;
        }
        .mentorship-content strong {
          font-weight: 600;
        }
        .multi-agent-content {
          font-size: 0.875rem;
          line-height: 1.75;
          color: #1f2937;
        }
        .multi-agent-content h1 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-top: 1.5rem;
          margin-bottom: 1rem;
          color: #111827;
          line-height: 1.4;
        }
        .multi-agent-content h2 {
          font-size: 1.25rem;
          font-weight: 700;
          margin-top: 1.25rem;
          margin-bottom: 0.75rem;
          color: #111827;
          line-height: 1.4;
        }
        .multi-agent-content h3 {
          font-size: 1.125rem;
          font-weight: 700;
          margin-top: 1rem;
          margin-bottom: 0.75rem;
          color: #111827;
          line-height: 1.4;
        }
        .multi-agent-content h4 {
          font-size: 1rem;
          font-weight: 700;
          margin-top: 0.875rem;
          margin-bottom: 0.625rem;
          color: #111827;
          line-height: 1.4;
        }
        .multi-agent-content h5,
        .multi-agent-content h6 {
          font-size: 0.9375rem;
          font-weight: 600;
          margin-top: 0.75rem;
          margin-bottom: 0.5rem;
          color: #111827;
          line-height: 1.4;
        }
        .multi-agent-content p {
          margin-bottom: 0.875rem;
          line-height: 1.75;
          color: #1f2937;
        }
        .multi-agent-content ul,
        .multi-agent-content ol {
          margin-left: 1.5rem;
          margin-bottom: 0.875rem;
          margin-top: 0.5rem;
          padding-left: 0.5rem;
        }
        .multi-agent-content ul {
          list-style-type: disc;
        }
        .multi-agent-content ol {
          list-style-type: decimal;
        }
        .multi-agent-content li {
          margin-bottom: 0.5rem;
          line-height: 1.75;
          color: #1f2937;
        }
        .multi-agent-content li ul,
        .multi-agent-content li ol {
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
        }
        .multi-agent-content strong {
          font-weight: 600;
          color: #111827;
        }
        .multi-agent-content em {
          font-style: italic;
        }
        .multi-agent-content code {
          background-color: #f3f4f6;
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          font-family: 'Courier New', monospace;
          font-size: 0.875em;
          color: #dc2626;
        }
        .multi-agent-content a {
          color: #2563eb;
          text-decoration: underline;
        }
        .multi-agent-content a:hover {
          color: #1d4ed8;
        }
        .multi-agent-content hr {
          margin: 1.25rem 0;
          border: none;
          border-top: 2px solid #e5e7eb;
        }
        .multi-agent-content blockquote {
          border-left: 4px solid #3b82f6;
          padding-left: 1rem;
          padding-top: 0.5rem;
          padding-bottom: 0.5rem;
          margin: 1rem 0;
          background-color: #f9fafb;
          color: #4b5563;
        }
      `}</style>
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-white shadow-lg rounded-xl mb-6 sticky top-4 z-10">
        <h1 className="text-3xl font-bold text-indigo-700 flex items-center mb-2 sm:mb-0">
          <GraduationCap className="w-8 h-8 mr-2" />
          ResearchLink
        </h1>
        {userId && (
          <div className="text-sm text-gray-600 flex items-center space-x-4">
            <span className="truncate hidden md:inline">
              **User ID:** <code className="bg-gray-100 p-1 rounded text-xs text-indigo-600 font-mono">{userId}</code>
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center px-3 py-1 bg-red-500 text-white text-xs font-semibold rounded-lg hover:bg-red-600 transition duration-150 shadow"
            >
              <LogOut className="w-4 h-4 mr-1" /> Logout
            </button>
          </div>
        )}
      </header>
      
      {/* Message and Status Area */}
      {message && (
        <div className={`p-3 mb-4 rounded-lg shadow-md ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'} transition-opacity duration-300`}>
          {message}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 mb-6 max-w-4xl mx-auto">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2 flex items-center font-medium ${activeTab === 'dashboard' ? 'border-b-4 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <BookOpen className="w-5 h-5 mr-2" /> Dashboard
        </button>
        <button
          onClick={() => setActiveTab('matchmaker')}
          className={`px-4 py-2 flex items-center font-medium ${activeTab === 'matchmaker' ? 'border-b-4 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Zap className="w-5 h-5 mr-2" /> Matchmaker
        </button>
        <button
          onClick={() => setActiveTab('feed')}
          className={`px-4 py-2 flex items-center font-medium ${activeTab === 'feed' ? 'border-b-4 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Globe className="w-5 h-5 mr-2" /> Global Feed
        </button>
        <button
          onClick={() => setActiveTab('chats')}
          className={`px-4 py-2 flex items-center font-medium ${activeTab === 'chats' ? 'border-b-4 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <MessageSquare className="w-5 h-5 mr-2" /> Chats
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 flex items-center font-medium ${activeTab === 'profile' ? 'border-b-4 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Edit2 className="w-5 h-5 mr-2" /> Profile
        </button>
        <button
          onClick={() => setActiveTab('contact')}
          className={`px-4 py-2 flex items-center font-medium ${activeTab === 'contact' ? 'border-b-4 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <MessageSquare className="w-5 h-5 mr-2" /> Contact Us
        </button>
        {userType === 'admin' && (
          <button
            onClick={() => setActiveTab('admin')}
            className={`px-4 py-2 flex items-center font-medium ${activeTab === 'admin' ? 'border-b-4 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <User className="w-5 h-5 mr-2" /> Admin
          </button>
        )}
      </div>
      
      {/* Content Area */}
      <main>
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'profile' && renderProfileTab()}
        {activeTab === 'feed' && renderFeedTab()}
        {activeTab === 'matchmaker' && renderMatchmakerTab()}
        {activeTab === 'chats' && renderChatsTab()}
        {activeTab === 'paper-analysis' && renderPaperAnalysisTab()}
        {activeTab === 'multi-agent-mentorship' && renderMultiAgentMentorshipTab()}
        {activeTab === 'contact' && renderContactUsTab()}
        {activeTab === 'admin' && <AdminDashboard db={db} userId={userId} />}
      </main>

      <footer className="text-center mt-10 text-gray-500 text-sm">
        <p>Built using React, Tailwind CSS, and Google Firestore.</p>
      </footer>
    </div>
  );

  return (
    <Routes>
      <Route path="/" element={mainAppElement} />
      <Route path="/profile/:id" element={<ProfessorProfilePage db={db} />} />
    </Routes>
  );
};

export default App;
