// Configuration
const SERVER_URL = 'https://principal-emacs-apartment-moore.trycloudflare.com';

// Connect to Socket.IO server
const socket = io(SERVER_URL, {
    transports: ['websocket'],
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
});

// Current user state
let currentUser = null;
let allTweets = [];
let notifications = [];
let messages = [];
let bookmarks = [];
let following = [];
let followers = [];
let currentPage = 'home';
let currentConversation = null;

// DOM Elements
const loginPage = document.getElementById('loginPage');
const mainApp = document.getElementById('mainApp');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const postTweetBtn = document.getElementById('postTweet');
const composeBtn = document.getElementById('composeBtn');
const showSignup = document.getElementById('showSignup');
const showLogin = document.getElementById('showLogin');
const signupBtn = document.getElementById('signupBtn');
const tweetsContainer = document.getElementById('tweetsContainer');
const profileTweetsContainer = document.getElementById('profileTweetsContainer');
const tweetContent = document.getElementById('tweetContent');
const userName = document.getElementById('userName');
const userHandle = document.getElementById('userHandle');
const userAvatar = document.getElementById('userAvatar');
const currentUserAvatar = document.getElementById('currentUserAvatar');
const notification = document.getElementById('notification');
const notificationBadge = document.getElementById('notificationBadge');
const messageBadge = document.getElementById('messageBadge');
const mobileNotificationBadge = document.getElementById('mobileNotificationBadge');
const mobileMessageBadge = document.getElementById('mobileMessageBadge');
const searchInput = document.getElementById('searchInput');
const themeToggle = document.getElementById('themeToggle');
const homePage = document.getElementById('homePage');
const explorePage = document.getElementById('explorePage');
const notificationsPage = document.getElementById('notificationsPage');
const messagesPage = document.getElementById('messagesPage');
const bookmarksPage = document.getElementById('bookmarksPage');
const profilePage = document.getElementById('profilePage');
const pageTitle = document.getElementById('pageTitle');
const profileName = document.getElementById('profileName');
const profileHandle = document.getElementById('profileHandle');
const profileAvatar = document.getElementById('profileAvatar');
const profileBio = document.getElementById('profileBio');
const profileCover = document.getElementById('profileCover');
const followingCount = document.getElementById('followingCount');
const followersCount = document.getElementById('followersCount');
const mobileComposeBtn = document.getElementById('mobileComposeBtn');
const newMessageBtn = document.getElementById('newMessageBtn');
const closeMessageModal = document.getElementById('closeMessageModal');
const newMessageModal = document.getElementById('newMessageModal');
const sendMessageBtn = document.getElementById('sendMessageBtn');
const messageRecipient = document.getElementById('messageRecipient');
const messageContent = document.getElementById('messageContent');
const conversationsList = document.getElementById('conversationsList');
const conversationView = document.getElementById('conversationView');
const backToConversations = document.getElementById('backToConversations');
const conversationUserName = document.getElementById('conversationUserName');
const conversationUserHandle = document.getElementById('conversationUserHandle');
const messagesContainer = document.getElementById('messagesContainer');
const newMessageInput = document.getElementById('newMessageInput');
const sendNewMessageBtn = document.getElementById('sendNewMessageBtn');
const editProfileBtn = document.getElementById('editProfileBtn');
const editProfileModal = document.getElementById('editProfileModal');
const closeEditProfileModal = document.getElementById('closeEditProfileModal');
const saveProfileBtn = document.getElementById('saveProfileBtn');
const editName = document.getElementById('editName');
const editBio = document.getElementById('editBio');
const coverUpload = document.getElementById('coverUpload');
const editCoverBtn = document.getElementById('editCoverBtn');
const avatarUpload = document.getElementById('avatarUpload');
const editAvatarBtn = document.getElementById('editAvatarBtn');
const tweetImageUpload = document.getElementById('tweetImageUpload');
const imagePreview = document.getElementById('imagePreview');
const previewImage = document.getElementById('previewImage');
const removeImageBtn = document.getElementById('removeImageBtn');
const loadingSpinner = document.getElementById('loadingSpinner');

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showMainApp();
        loadInitialData();
        
        // Authenticate socket connection if user exists
        if (currentUser?.token) {
            socket.emit('authenticate', { token: currentUser.token });
        }
    } else {
        loginPage.style.display = 'flex';
    }

    // Event listeners
    loginBtn.addEventListener('click', login);
    logoutBtn.addEventListener('click', logout);
    postTweetBtn.addEventListener('click', postTweet);
    composeBtn.addEventListener('click', focusTweetInput);
    mobileComposeBtn.addEventListener('click', focusTweetInput);
    showSignup.addEventListener('click', showSignupForm);
    showLogin.addEventListener('click', showLoginForm);
    signupBtn.addEventListener('click', signup);
    searchInput.addEventListener('input', searchTweets);
    themeToggle.addEventListener('click', toggleDarkMode);
    newMessageBtn.addEventListener('click', showNewMessageModal);
    closeMessageModal.addEventListener('click', hideNewMessageModal);
    sendMessageBtn.addEventListener('click', sendNewMessage);
    backToConversations.addEventListener('click', showConversationsList);
    sendNewMessageBtn.addEventListener('click', sendMessage);
    editProfileBtn.addEventListener('click', showEditProfileModal);
    closeEditProfileModal.addEventListener('click', hideEditProfileModal);
    saveProfileBtn.addEventListener('click', saveProfile);
    editCoverBtn.addEventListener('click', () => coverUpload.click());
    editAvatarBtn.addEventListener('click', () => avatarUpload.click());
    coverUpload.addEventListener('change', uploadCoverPhoto);
    avatarUpload.addEventListener('change', uploadAvatar);
    tweetImageUpload.addEventListener('change', handleImageUpload);
    removeImageBtn.addEventListener('click', removeImagePreview);
    newMessageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') sendMessage();
    });

    // Navigation
    document.querySelectorAll('.nav-item, .user-profile, .mobile-nav-item').forEach(item => {
        item.addEventListener('click', function() {
            const page = this.dataset.page;
            if (page) navigateToPage(page);
        });
    });

    // Socket.IO listeners
    socket.on('connect', () => {
        console.log('Connected to Socket.IO server with ID:', socket.id);
        if (currentUser?.token) {
            socket.emit('authenticate', { token: currentUser.token });
        }
    });

    socket.on('connect_error', (err) => {
        console.log('Connection error:', err);
    });

    socket.on('disconnect', (reason) => {
        console.log('Disconnected:', reason);
    });

    socket.on('new-tweet', (tweet) => {
        const tweetUserId = typeof tweet.userId === 'string' ? tweet.userId : tweet.userId._id;
        
        if (following.some(id => id.toString() === tweetUserId) || tweetUserId === currentUser._id) {
            allTweets.unshift(tweet);
            renderTweets();
            if (tweetUserId !== currentUser._id) {
                showNotification(`New tweet from ${tweet.author}`);
            }
        }
    });

    socket.on('tweet-liked', (updatedTweet) => {
        const index = allTweets.findIndex(t => t._id === updatedTweet._id);
        if (index !== -1) {
            allTweets[index] = updatedTweet;
            renderTweets();
        }
    });

    socket.on('new-notification', (notification) => {
        notifications.unshift(notification);
        updateNotificationBadge();
        if (currentPage === 'notifications') {
            renderNotifications();
        } else {
            showNotification(notification.message);
        }
    });

    socket.on('new-message', (message) => {
        const existingConversation = messages.find(m => 
            m._id === message.conversation || 
            (m.participants && m.participants.some(p => p._id === message.sender._id))
        );

        if (existingConversation) {
            if (!existingConversation.messages) existingConversation.messages = [];
            existingConversation.messages.push(message);
            
            if (currentPage === 'messages') {
                if (currentConversation && 
                    (currentConversation._id === message.conversation || 
                     currentConversation.participants.some(p => p._id === message.sender._id))) {
                    renderMessages(currentConversation.messages);
                } else {
                    renderConversations();
                }
            }
        } else {
            const newConversation = {
                _id: message.conversation,
                participants: [message.sender],
                messages: [message],
                updatedAt: new Date()
            };
            messages.unshift(newConversation);
            renderConversations();
        }
        
        updateMessageBadge();
    });

    socket.on('authenticated', () => {
        console.log('Socket.IO authenticated successfully');
    });

    socket.on('auth-error', (error) => {
        console.error('Socket.IO authentication failed:', error);
        if (error.message.includes('token')) {
            showNotification('Session expired. Please login again.', 'error');
            logout();
        }
    });
});

// Helper function to check token validity
function isTokenValid() {
    if (!currentUser || !currentUser.token) return false;
    
    try {
        const payload = JSON.parse(atob(currentUser.token.split('.')[1]));
        return payload.exp * 1000 > Date.now();
    } catch (e) {
        return false;
    }
}

// Helper function for authenticated requests
async function makeAuthenticatedRequest(url, options = {}) {
    if (!isTokenValid()) {
        showNotification('Session expired. Please login again.', 'error');
        logout();
        throw new Error('Invalid token');
    }

    const defaultOptions = {
        credentials: 'include',
        headers: {
            'Authorization': `Bearer ${currentUser.token}`,
            ...(options.headers || {})
        }
    };

    const mergedOptions = { ...defaultOptions, ...options };
    
    try {
        const response = await fetch(url, mergedOptions);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Request failed');
        }
        
        return response.json();
    } catch (error) {
        console.error('Request error:', error);
        
        if (error.message.includes('jwt') || error.message.includes('token')) {
            showNotification('Session expired. Please login again.', 'error');
            logout();
        }
        
        throw error;
    }
}

// Load initial data
async function loadInitialData() {
    showLoading(true);
    try {
        await Promise.all([
            loadTweets().catch(e => console.error('Tweet load error:', e)),
            loadNotifications().catch(e => console.error('Notification error:', e)),
            loadMessages().catch(e => console.error('Messages error:', e)),
            loadBookmarks().catch(e => console.error('Bookmarks error:', e)),
            loadFollowing().catch(e => console.error('Following error:', e)),
            loadUserProfile().catch(e => console.error('Profile error:', e))
        ]);
    } finally {
        showLoading(false);
    }
}

// Load tweets from server
async function loadTweets() {
    showLoading(true);
    try {
        const data = await makeAuthenticatedRequest(`${SERVER_URL}/api/tweets`);
        allTweets = data;
        renderTweets();
    } catch (error) {
        console.error('Tweet loading error:', error);
        showNotification(error.message || 'Failed to load tweets', 'error');
        allTweets = [];
        renderTweets();
    } finally {
        showLoading(false);
    }
}

// Load notifications from server
async function loadNotifications() {
    if (!currentUser) return;
    
    try {
        const data = await makeAuthenticatedRequest(`${SERVER_URL}/api/notifications`);
        notifications = data;
        updateNotificationBadge();
        if (currentPage === 'notifications') renderNotifications();
    } catch (error) {
        console.error('Error loading notifications:', error);
        throw error;
    }
}

// Load messages from server
async function loadMessages() {
    if (!currentUser) return;
    
    try {
        const data = await makeAuthenticatedRequest(`${SERVER_URL}/api/messages`);
        messages = data;
        updateMessageBadge();
        if (currentPage === 'messages') renderConversations();
    } catch (error) {
        console.error('Error loading messages:', error);
        throw error;
    }
}

// Load bookmarks from server
async function loadBookmarks() {
    if (!currentUser) return;
    
    try {
        const data = await makeAuthenticatedRequest(`${SERVER_URL}/api/bookmarks`);
        bookmarks = data;
        if (currentPage === 'bookmarks') renderBookmarks();
    } catch (error) {
        console.error('Error loading bookmarks:', error);
        throw error;
    }
}

// Load following list
async function loadFollowing() {
    if (!currentUser) return;
    
    try {
        const data = await makeAuthenticatedRequest(`${SERVER_URL}/api/users/${currentUser._id}/following`);
        following = data;
    } catch (error) {
        console.error('Error loading following:', error);
        throw error;
    }
}

// Load user profile
async function loadUserProfile() {
    if (!currentUser) return;
    
    try {
        const userData = await makeAuthenticatedRequest(`${SERVER_URL}/api/users/${currentUser._id}`);
        
        // Update profile info
        profileName.textContent = userData.name;
        profileHandle.textContent = `@${userData.username}`;
        profileBio.textContent = userData.bio || "This user hasn't added a bio yet.";
        followingCount.textContent = userData.following.length;
        followersCount.textContent = userData.followers || 0;
        
        // Update avatar
        if (userData.avatar) {
            profileAvatar.textContent = userData.avatar;
            userAvatar.textContent = userData.avatar;
            currentUserAvatar.textContent = userData.avatar;
        }
        
        // Update cover photo if exists
        if (userData.coverPhoto) {
            profileCover.style.backgroundImage = `url(${SERVER_URL}${userData.coverPhoto})`;
            profileCover.style.backgroundSize = 'cover';
            profileCover.style.backgroundPosition = 'center';
        }
        
        // Load profile tweets
        try {
            const profileTweets = await makeAuthenticatedRequest(`${SERVER_URL}/api/tweets/user/${userData._id}`);
            renderProfileTweets(profileTweets);
        } catch (tweetError) {
            console.error('Error loading profile tweets:', tweetError);
        }
    } catch (error) {
        console.error('Error loading user profile:', error);
        throw error;
    }
}

// Login function
async function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (!username || !password) {
        showNotification('Please enter both username and password', 'error');
        return;
    }
    
    showLoading(true);
    try {
        const response = await fetch(`${SERVER_URL}/api/login`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Login failed');
        }
        
        const data = await response.json();
        currentUser = data.user;
        currentUser.token = data.token;
        
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        showMainApp();
        loadInitialData();
        showNotification(`Welcome back, ${currentUser.name}!`);
        
        // Authenticate socket connection
        socket.emit('authenticate', { token: data.token });
    } catch (error) {
        console.error('Login error:', error);
        showNotification(error.message || 'Network error. Please try again.', 'error');
    } finally {
        showLoading(false);
    }
}

// Signup function
async function signup() {
    const name = document.getElementById('signupName').value.trim();
    const username = document.getElementById('signupUsername').value.trim();
    const password = document.getElementById('signupPassword').value.trim();
    const bio = document.getElementById('signupBio').value.trim();
    
    if (!name || !username || !password) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    showLoading(true);
    try {
        const response = await fetch(`${SERVER_URL}/api/signup`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password, name, bio })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Signup failed');
        }
        
        const data = await response.json();
        currentUser = data.user;
        currentUser.token = data.token;
        
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        showMainApp();
        loadInitialData();
        showNotification(`Welcome to Chirper, ${name}!`);
        
        // Authenticate socket connection
        socket.emit('authenticate', { token: data.token });
    } catch (error) {
        console.error('Signup error:', error);
        showNotification(error.message || 'Network error. Please try again.', 'error');
    } finally {
        showLoading(false);
    }
}

// Post a new tweet
async function postTweet() {
    const content = tweetContent.value.trim();
    
    if (!content) {
        showNotification('Please enter some text for your tweet', 'error');
        return;
    }
    
    const formData = new FormData();
    formData.append('content', content);
    
    if (tweetImageUpload.files[0]) {
        formData.append('image', tweetImageUpload.files[0]);
    }
    
    showLoading(true);
    try {
        const response = await fetch(`${SERVER_URL}/api/tweets`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Authorization': `Bearer ${currentUser.token}`
            },
            body: formData
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to post tweet');
        }
        
        const newTweet = await response.json();
        allTweets.unshift(newTweet);
        renderTweets();
        tweetContent.value = '';
        removeImagePreview();
        showNotification('Your tweet has been posted!');
        
        socket.emit('new-tweet', newTweet);
    } catch (error) {
        console.error('Error posting tweet:', error);
        
        if (error.message.includes('jwt') || error.message.includes('token')) {
            showNotification('Session expired. Please login again.', 'error');
            logout();
        } else {
            showNotification(error.message || 'Network error. Please try again.', 'error');
        }
    } finally {
        showLoading(false);
    }
}

// [Rest of your existing functions remain the same...]
// (All other functions like renderTweets, createTweetElement, etc. can stay as they were)
// [Previous code remains the same until the postTweet function...]

// Handle image upload for tweets
function handleImageUpload() {
    const file = tweetImageUpload.files[0];
    if (!file) return;
    
    if (!file.type.match('image.*')) {
        showNotification('Please upload an image file', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        previewImage.src = e.target.result;
        imagePreview.style.display = 'block';
    };
    reader.readAsDataURL(file);
}

// Remove image preview
function removeImagePreview() {
    imagePreview.style.display = 'none';
    previewImage.src = '';
    tweetImageUpload.value = '';
}

// Render tweets to the page
function renderTweets(tweetsToRender = allTweets) {
    try {
        tweetsContainer.innerHTML = '';
        
        if (!Array.isArray(tweetsToRender)) {
            console.error('Expected array but received:', tweetsToRender);
            tweetsToRender = [];
        }

        if (tweetsToRender.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'tweet';
            emptyMessage.innerHTML = `
                <div class="tweet-content" style="text-align: center; padding: 20px;">
                    ${currentUser ? 'No tweets found. Start following users to see tweets!' : 'Please login to view tweets'}
                </div>
            `;
            tweetsContainer.appendChild(emptyMessage);
            return;
        }

        tweetsToRender.forEach(tweet => {
            try {
                if (!tweet || typeof tweet !== 'object') {
                    console.error('Invalid tweet format:', tweet);
                    return;
                }
                
                const tweetElement = createTweetElement(tweet);
                if (tweetElement) {
                    tweetsContainer.appendChild(tweetElement);
                }
            } catch (tweetError) {
                console.error('Error rendering tweet:', tweetError, 'Tweet data:', tweet);
                const errorElement = document.createElement('div');
                errorElement.className = 'tweet-error';
                errorElement.textContent = 'Could not display this tweet';
                tweetsContainer.appendChild(errorElement);
            }
        });

    } catch (mainError) {
        console.error('Critical error in renderTweets:', mainError);
        tweetsContainer.innerHTML = `
            <div class="tweet-error" style="text-align: center; padding: 20px; color: red;">
                Error loading tweets. Please refresh the page.
            </div>
        `;
    }
}

// Render profile tweets
function renderProfileTweets(tweets) {
    profileTweetsContainer.innerHTML = '';
    
    if (tweets.length === 0) {
        profileTweetsContainer.innerHTML = '<div class="tweet"><div class="tweet-content" style="text-align: center; padding: 20px;">No tweets yet. Start chirping!</div></div>';
        return;
    }
    
    tweets.forEach(tweet => {
        const tweetElement = createTweetElement(tweet);
        profileTweetsContainer.appendChild(tweetElement);
    });
}

// Create a tweet element
function createTweetElement(tweet) {
    const tweetEl = document.createElement('div');
    tweetEl.className = 'tweet';
    tweetEl.dataset.id = tweet._id;
    
    const formattedTime = formatTime(tweet.createdAt);
    
    const isLiked = tweet.likes && tweet.likes.some(like => {
        const likeId = typeof like === 'string' ? like : like._id;
        return likeId === currentUser._id;
    });
    
    const isBookmarked = bookmarks.some(b => b.tweet._id === tweet._id);
    
    tweetEl.innerHTML = `
        <div class="tweet-avatar">${tweet.avatar || 'U'}</div>
        <div class="tweet-content">
            <div class="tweet-header">
                <div class="tweet-author">${tweet.author}</div>
                <div class="tweet-handle">${tweet.handle}</div>
                <div class="tweet-time">· ${formattedTime}</div>
            </div>
            <div class="tweet-text">${tweet.content}</div>
            ${tweet.image ? `<img src="${SERVER_URL}${tweet.image}" class="tweet-image">` : ''}
            <div class="tweet-stats">
                <div class="tweet-stat comment">
                    <i class="far fa-comment"></i>
                    <span>${tweet.comments ? tweet.comments.length : 0}</span>
                </div>
                <div class="tweet-stat retweet">
                    <i class="fas fa-retweet"></i>
                    <span>${tweet.retweets || 0}</span>
                </div>
                <div class="tweet-stat like ${isLiked ? 'liked' : ''}" data-id="${tweet._id}">
                    <i class="${isLiked ? 'fas' : 'far'} fa-heart"></i>
                    <span>${tweet.likes ? tweet.likes.length : 0}</span>
                </div>
                <div class="tweet-stat bookmark ${isBookmarked ? 'bookmarked' : ''}">
                    <i class="${isBookmarked ? 'fas' : 'far'} fa-bookmark"></i>
                </div>
                <div class="tweet-stat">
                    <i class="fas fa-share-alt"></i>
                </div>
            </div>
            
            <div class="comment-form" style="display:none;">
                <input type="text" class="comment-input" placeholder="Write a comment...">
                <button class="comment-btn">Reply</button>
            </div>
            
            <div class="comments-container">
                ${renderComments(tweet.comments || [])}
            </div>
        </div>
    `;
    
    // Add event listeners
    const likeButton = tweetEl.querySelector('.tweet-stat.like');
    likeButton.addEventListener('click', function(e) {
        e.stopPropagation();
        toggleLike(tweet._id);
    });
    
    const bookmarkButton = tweetEl.querySelector('.tweet-stat.bookmark');
    bookmarkButton.addEventListener('click', function(e) {
        e.stopPropagation();
        toggleBookmark(tweet._id);
    });
    
    const commentButton = tweetEl.querySelector('.tweet-stat.comment');
    commentButton.addEventListener('click', function(e) {
        e.stopPropagation();
        const commentForm = tweetEl.querySelector('.comment-form');
        commentForm.style.display = commentForm.style.display === 'none' ? 'flex' : 'none';
    });
    
    const commentBtn = tweetEl.querySelector('.comment-btn');
    const commentInput = tweetEl.querySelector('.comment-input');
    if (commentBtn && commentInput) {
        commentBtn.addEventListener('click', function() {
            postComment(tweet._id, commentInput.value);
            commentInput.value = '';
        });
        
        commentInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                postComment(tweet._id, commentInput.value);
                commentInput.value = '';
            }
        });
    }
    
    return tweetEl;
}

// Render comments
function renderComments(comments) {
    if (!comments || comments.length === 0) return '';
    
    return comments.map(comment => `
        <div class="comment">
            <div class="comment-avatar">${comment.user.avatar || 'U'}</div>
            <div class="comment-content">
                <div class="comment-header">
                    <div class="comment-author">${comment.user.name}</div>
                    <div class="comment-handle">@${comment.user.username}</div>
                    <div class="comment-time">· ${formatTime(comment.createdAt)}</div>
                </div>
                <div class="comment-text">${comment.content}</div>
            </div>
        </div>
    `).join('');
}

// Format time
function formatTime(dateString) {
    const now = new Date();
    const tweetDate = new Date(dateString);
    const diffInSeconds = Math.floor((now - tweetDate) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays}d`;
    return tweetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Toggle like on a tweet
async function toggleLike(tweetId) {
    try {
        const updatedTweet = await makeAuthenticatedRequest(`${SERVER_URL}/api/tweets/${tweetId}/like`, {
            method: 'POST'
        });
        
        const index = allTweets.findIndex(t => t._id === tweetId);
        if (index !== -1) {
            allTweets[index] = updatedTweet;
            renderTweets();
        }
        
        socket.emit('tweet-liked', updatedTweet);
    } catch (error) {
        console.error('Error toggling like:', error);
        showNotification(error.message || 'Network error. Please try again.', 'error');
    }
}

// Toggle bookmark on a tweet
async function toggleBookmark(tweetId) {
    try {
        const result = await makeAuthenticatedRequest(`${SERVER_URL}/api/bookmarks/${tweetId}`, {
            method: 'POST'
        });
        
        if (result.action === 'added') {
            bookmarks.unshift({ tweet: result.tweet });
            showNotification('Tweet added to bookmarks');
        } else {
            const index = bookmarks.findIndex(b => b.tweet._id === tweetId);
            if (index !== -1) bookmarks.splice(index, 1);
            showNotification('Tweet removed from bookmarks');
        }
        
        if (currentPage === 'bookmarks') renderBookmarks();
        renderTweets();
    } catch (error) {
        console.error('Error toggling bookmark:', error);
        showNotification(error.message || 'Network error. Please try again.', 'error');
    }
}

// Post a comment
async function postComment(tweetId, content) {
    if (!content.trim()) {
        showNotification('Comment cannot be empty', 'error');
        return;
    }
    
    try {
        const updatedTweet = await makeAuthenticatedRequest(`${SERVER_URL}/api/tweets/${tweetId}/comment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content })
        });
        
        const index = allTweets.findIndex(t => t._id === tweetId);
        if (index !== -1) {
            allTweets[index] = updatedTweet;
            renderTweets();
        }
        
        showNotification('Comment posted!');
    } catch (error) {
        console.error('Error posting comment:', error);
        showNotification(error.message || 'Network error. Please try again.', 'error');
    }
}

// Show main app
function showMainApp() {
    loginPage.style.display = 'none';
    mainApp.style.display = 'flex';
    
    if (currentUser) {
        userName.textContent = currentUser.name;
        userHandle.textContent = `@${currentUser.username}`;
        if (currentUser.avatar) {
            userAvatar.textContent = currentUser.avatar;
            currentUserAvatar.textContent = currentUser.avatar;
        }
    }
    
    if (localStorage.getItem('darkMode') === 'enabled') {
        document.body.classList.add('dark-mode');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i><span>Light Mode</span>';
    }
}

// Logout function
function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    loginPage.style.display = 'flex';
    mainApp.style.display = 'none';
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    showNotification('You have been logged out');
    socket.disconnect();
}

// Focus tweet input
function focusTweetInput() {
    tweetContent.focus();
}

// Show notification
function showNotification(message, type = '') {
    notification.textContent = message;
    notification.className = 'notification';
    if (type) notification.classList.add(type);
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Update notification badge
function updateNotificationBadge() {
    const unreadCount = notifications.filter(n => !n.read).length;
    notificationBadge.textContent = unreadCount;
    mobileNotificationBadge.textContent = unreadCount;
    notificationBadge.style.display = unreadCount > 0 ? 'block' : 'none';
    mobileNotificationBadge.style.display = unreadCount > 0 ? 'block' : 'none';
}

// Update message badge
function updateMessageBadge() {
    const unreadCount = messages.reduce((count, conversation) => {
        return count + (conversation.messages?.filter(m => 
            m.sender._id !== currentUser._id && !m.read
        ).length || 0);
    }, 0);
    
    messageBadge.textContent = unreadCount;
    mobileMessageBadge.textContent = unreadCount;
    messageBadge.style.display = unreadCount > 0 ? 'block' : 'none';
    mobileMessageBadge.style.display = unreadCount > 0 ? 'block' : 'none';
}

// Search tweets
function searchTweets() {
    const term = searchInput.value.toLowerCase().trim();
    
    if (!term) {
        renderTweets();
        return;
    }
    
    const filteredTweets = allTweets.filter(tweet => 
        tweet.content.toLowerCase().includes(term) ||
        tweet.author.toLowerCase().includes(term) ||
        tweet.handle.toLowerCase().includes(term)
    );
    
    renderTweets(filteredTweets);
}

// Toggle dark mode
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    
    if (document.body.classList.contains('dark-mode')) {
        localStorage.setItem('darkMode', 'enabled');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i><span>Light Mode</span>';
    } else {
        localStorage.setItem('darkMode', 'disabled');
        themeToggle.innerHTML = '<i class="fas fa-moon"></i><span>Dark Mode</span>';
    }
}

// Navigate to page
function navigateToPage(page) {
    document.querySelectorAll('.page').forEach(p => {
        p.style.display = 'none';
    });
    
    document.querySelectorAll('.nav-item, .mobile-nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    if (page === 'home') {
        homePage.style.display = 'block';
        pageTitle.textContent = 'Home';
        document.querySelector('[data-page="home"]').classList.add('active');
    } else if (page === 'explore') {
        explorePage.style.display = 'block';
        pageTitle.textContent = 'Explore';
        document.querySelector('[data-page="explore"]').classList.add('active');
    } else if (page === 'notifications') {
        notificationsPage.style.display = 'block';
        pageTitle.textContent = 'Notifications';
        document.querySelector('[data-page="notifications"]').classList.add('active');
        renderNotifications();
    } else if (page === 'messages') {
        messagesPage.style.display = 'block';
        pageTitle.textContent = 'Messages';
        document.querySelector('[data-page="messages"]').classList.add('active');
        renderConversations();
    } else if (page === 'bookmarks') {
        bookmarksPage.style.display = 'block';
        pageTitle.textContent = 'Bookmarks';
        document.querySelector('[data-page="bookmarks"]').classList.add('active');
        renderBookmarks();
    } else if (page === 'profile') {
        profilePage.style.display = 'block';
        pageTitle.textContent = 'Profile';
        document.querySelector('[data-page="profile"]').classList.add('active');
        loadUserProfile();
    }
    
    currentPage = page;
}

// Show loading spinner
function showLoading(show) {
    loadingSpinner.style.display = show ? 'flex' : 'none';
}

// [Rest of your existing functions...]
// Render notifications
function renderNotifications() {
    const container = document.getElementById('notificationsContainer');
    container.innerHTML = '';
    
    if (notifications.length === 0) {
        container.innerHTML = '<div class="tweet"><div class="tweet-content" style="text-align: center; padding: 20px;">No notifications yet.</div></div>';
        return;
    }
    
    notifications.forEach(notification => {
        const notifElement = document.createElement('div');
        notifElement.className = 'tweet';
        
        notifElement.innerHTML = `
            <div class="tweet-avatar">${notification.sender ? notification.sender.avatar : 'N'}</div>
            <div class="tweet-content">
                <div class="tweet-text">${notification.message}</div>
                <div class="tweet-time">${formatTime(notification.createdAt)}</div>
            </div>
        `;
        
        container.appendChild(notifElement);
    });
}

// Render conversations list
function renderConversations() {
    conversationsList.innerHTML = '';
    
    if (messages.length === 0) {
        conversationsList.innerHTML = '<div class="tweet"><div class="tweet-content" style="text-align: center; padding: 20px;">No messages yet.</div></div>';
        return;
    }
    
    messages.forEach(conversation => {
        const lastMessage = conversation.messages ? 
            conversation.messages[conversation.messages.length - 1] : 
            { content: 'No messages yet', createdAt: new Date() };
        
        const otherUser = conversation.participants.find(p => p._id !== currentUser._id);
        
        const convoElement = document.createElement('div');
        convoElement.className = 'tweet';
        convoElement.addEventListener('click', () => showConversation(conversation));
        
        convoElement.innerHTML = `
            <div class="tweet-avatar">${otherUser ? otherUser.avatar : 'U'}</div>
            <div class="tweet-content">
                <div class="tweet-header">
                    <div class="tweet-author">${otherUser ? otherUser.name : 'Unknown User'}</div>
                    <div class="tweet-time">${formatTime(lastMessage.createdAt)}</div>
                </div>
                <div class="tweet-text">${lastMessage.content.substring(0, 50)}${lastMessage.content.length > 50 ? '...' : ''}</div>
            </div>
        `;
        
        conversationsList.appendChild(convoElement);
    });
}

// Render messages in a conversation
function renderMessages(messages) {
    messagesContainer.innerHTML = '';
    
    if (!messages || messages.length === 0) {
        messagesContainer.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--light-text);">No messages yet. Start the conversation!</div>';
        return;
    }
    
    messages.forEach(message => {
        const isCurrentUser = message.sender._id === currentUser._id;
        
        const messageElement = document.createElement('div');
        messageElement.className = `message ${isCurrentUser ? 'sent' : 'received'}`;
        
        messageElement.innerHTML = `
            ${!isCurrentUser ? `<div class="message-avatar">${message.sender.avatar}</div>` : ''}
            <div class="message-content">
                ${!isCurrentUser ? `<div class="message-sender">${message.sender.name}</div>` : ''}
                <div class="message-text">${message.content}</div>
                <div class="message-time">${formatTime(message.createdAt)}</div>
            </div>
        `;
        
        messagesContainer.appendChild(messageElement);
    });
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Render bookmarks
function renderBookmarks() {
    const container = document.getElementById('bookmarksContainer');
    container.innerHTML = '';
    
    if (bookmarks.length === 0) {
        container.innerHTML = '<div class="tweet"><div class="tweet-content" style="text-align: center; padding: 20px;">No bookmarks yet.</div></div>';
        return;
    }
    
    bookmarks.forEach(bookmark => {
        const tweetElement = createTweetElement(bookmark.tweet);
        container.appendChild(tweetElement);
    });
}

// Show conversation view
function showConversation(conversation) {
    currentConversation = conversation;
    conversationView.style.display = 'block';
    conversationsList.style.display = 'none';
    
    const otherUser = conversation.participants.find(p => p._id !== currentUser._id);
    conversationUserName.textContent = otherUser.name;
    conversationUserHandle.textContent = `@${otherUser.username}`;
    
    renderMessages(conversation.messages || []);
}

// Show conversations list
function showConversationsList() {
    currentConversation = null;
    conversationView.style.display = 'none';
    conversationsList.style.display = 'block';
}

// Show new message modal
function showNewMessageModal() {
    newMessageModal.style.display = 'block';
    messageRecipient.focus();
}

// Hide new message modal
function hideNewMessageModal() {
    newMessageModal.style.display = 'none';
    messageRecipient.value = '';
    messageContent.value = '';
}

// Send a new message
async function sendNewMessage() {
    const recipient = messageRecipient.value.trim();
    const content = messageContent.value.trim();
    
    if (!recipient || !content) {
        showNotification('Please enter both recipient and message', 'error');
        return;
    }
    
    try {
        const newMessage = await makeAuthenticatedRequest(`${SERVER_URL}/api/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ recipient, content })
        });
        
        showNotification('Message sent!');
        hideNewMessageModal();
        
        // Update messages list
        await loadMessages();
    } catch (error) {
        console.error('Error sending message:', error);
        showNotification(error.message || 'Network error. Please try again.', 'error');
    }
}

// Send message in conversation
async function sendMessage() {
    const content = newMessageInput.value.trim();
    
    if (!content) {
        showNotification('Message cannot be empty', 'error');
        return;
    }
    
    if (!currentConversation) return;
    
    try {
        const recipientId = currentConversation.participants.find(p => p._id !== currentUser._id)._id;
        
        const newMessage = await makeAuthenticatedRequest(`${SERVER_URL}/api/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                recipient: recipientId,
                content,
                conversation: currentConversation._id
            })
        });
        
        newMessageInput.value = '';
        
        // Update conversation
        currentConversation.messages.push(newMessage);
        renderMessages(currentConversation.messages);
    } catch (error) {
        console.error('Error sending message:', error);
        showNotification(error.message || 'Network error. Please try again.', 'error');
    }
}

// Show edit profile modal
function showEditProfileModal() {
    editName.value = currentUser.name;
    editBio.value = currentUser.bio || '';
    editProfileModal.style.display = 'block';
}

// Hide edit profile modal
function hideEditProfileModal() {
    editProfileModal.style.display = 'none';
}

// Save profile changes
async function saveProfile() {
    const name = editName.value.trim();
    const bio = editBio.value.trim();
    
    if (!name) {
        showNotification('Name cannot be empty', 'error');
        return;
    }
    
    try {
        const updatedUser = await makeAuthenticatedRequest(`${SERVER_URL}/api/users/${currentUser._id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, bio })
        });
        
        currentUser = updatedUser;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        // Update UI
        userName.textContent = updatedUser.name;
        profileName.textContent = updatedUser.name;
        profileBio.textContent = updatedUser.bio || "This user hasn't added a bio yet.";
        
        hideEditProfileModal();
        showNotification('Profile updated successfully!');
    } catch (error) {
        console.error('Error updating profile:', error);
        showNotification(error.message || 'Network error. Please try again.', 'error');
    }
}

// Upload cover photo
async function uploadCoverPhoto() {
    const file = coverUpload.files[0];
    if (!file) return;
    
    if (!file.type.match('image.*')) {
        showNotification('Please upload an image file', 'error');
        return;
    }
    
    const formData = new FormData();
    formData.append('coverPhoto', file);
    
    try {
        const result = await makeAuthenticatedRequest(`${SERVER_URL}/api/users/${currentUser._id}/cover`, {
            method: 'POST',
            body: formData
        });
        
        profileCover.style.backgroundImage = `url(${SERVER_URL}${result.coverPhoto})`;
        profileCover.style.backgroundSize = 'cover';
        profileCover.style.backgroundPosition = 'center';
        
        showNotification('Cover photo updated!');
    } catch (error) {
        console.error('Error uploading cover photo:', error);
        showNotification(error.message || 'Network error. Please try again.', 'error');
    }
}

// Upload avatar
async function uploadAvatar() {
    const file = avatarUpload.files[0];
    if (!file) return;
    
    if (!file.type.match('image.*')) {
        showNotification('Please upload an image file', 'error');
        return;
    }
    
    const formData = new FormData();
    formData.append('avatar', file);
    
    try {
        const result = await makeAuthenticatedRequest(`${SERVER_URL}/api/users/${currentUser._id}/avatar`, {
            method: 'POST',
            body: formData
        });
        
        currentUser.avatar = result.avatar;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        // Update all avatar instances
        userAvatar.textContent = result.avatar;
        currentUserAvatar.textContent = result.avatar;
        profileAvatar.textContent = result.avatar;
        
        showNotification('Profile picture updated!');
    } catch (error) {
        console.error('Error uploading avatar:', error);
        showNotification(error.message || 'Network error. Please try again.', 'error');
    }
}

// Show signup form
function showSignupForm(e) {
    e.preventDefault();
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('signupForm').style.display = 'block';
}

// Show login form
function showLoginForm(e) {
    e.preventDefault();
    document.getElementById('signupForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
}
