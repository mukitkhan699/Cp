// Configuration
const SERVER_URL = 'http://localhost:5000'; // Change to your server URL if different

// Connect to Socket.IO server
const socket = io(SERVER_URL);

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
        console.log('Connected to Socket.IO server');
    });

    socket.on('new-tweet', (tweet) => {
        if (following.some(id => id === tweet.userId) || tweet.userId === currentUser._id) {
            allTweets.unshift(tweet);
            renderTweets();
            if (tweet.userId !== currentUser._id) {
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
            // Create a new conversation
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
});

// Load initial data
async function loadInitialData() {
    showLoading(true);
    try {
        await Promise.all([
            loadTweets(),
            loadNotifications(),
            loadMessages(),
            loadBookmarks(),
            loadFollowing(),
            loadUserProfile()
        ]);
    } catch (error) {
        console.error('Error loading initial data:', error);
        showNotification('Failed to load data. Please refresh the page.', 'error');
    } finally {
        showLoading(false);
    }
}

// Load tweets from server
async function loadTweets() {
    try {
        const response = await fetch(`${SERVER_URL}/api/tweets`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        allTweets = await response.json();
        renderTweets();
    } catch (error) {
        console.error('Error loading tweets:', error);
        throw error;
    }
}

// Load notifications from server
async function loadNotifications() {
    if (!currentUser) return;
    try {
        const response = await fetch(`${SERVER_URL}/api/notifications`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        notifications = await response.json();
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
        const response = await fetch(`${SERVER_URL}/api/messages`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        messages = await response.json();
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
        const response = await fetch(`${SERVER_URL}/api/bookmarks`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        bookmarks = await response.json();
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
        const response = await fetch(`${SERVER_URL}/api/users/${currentUser._id}/following`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        following = await response.json();
    } catch (error) {
        console.error('Error loading following:', error);
        throw error;
    }
}

// Load user profile
async function loadUserProfile() {
    if (!currentUser) return;
    try {
        const response = await fetch(`${SERVER_URL}/api/users/${currentUser._id}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const userData = await response.json();
        
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
        const tweetsResponse = await fetch(`${SERVER_URL}/api/tweets/user/${userData._id}`);
        if (tweetsResponse.ok) {
            const profileTweets = await tweetsResponse.json();
            renderProfileTweets(profileTweets);
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
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        showMainApp();
        loadInitialData();
        showNotification(`Welcome back, ${currentUser.name}!`);
    } catch (error) {
        console.error('Login error:', error);
        showNotification(error.message || 'Network error. Please try again.', 'error');
    } finally {
        showLoading(false);
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
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        showMainApp();
        loadInitialData();
        showNotification(`Welcome to Chirper, ${name}!`);
    } catch (error) {
        console.error('Signup error:', error);
        showNotification(error.message || 'Network error. Please try again.', 'error');
    } finally {
        showLoading(false);
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
}

// Show main app
function showMainApp() {
    loginPage.style.display = 'none';
    mainApp.style.display = 'flex';
    
    // Update user info
    if (currentUser) {
        userName.textContent = currentUser.name;
        userHandle.textContent = `@${currentUser.username}`;
        if (currentUser.avatar) {
            userAvatar.textContent = currentUser.avatar;
            currentUserAvatar.textContent = currentUser.avatar;
        }
    }
    
    // Check dark mode preference
    if (localStorage.getItem('darkMode') === 'enabled') {
        document.body.classList.add('dark-mode');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i><span>Light Mode</span>';
    }
}

// Post a new tweet
async function postTweet() {
    const content = tweetContent.value.trim();
    
    if (!content) {
        showNotification('Please enter some text for your tweet', 'error');
        return;
    }
    
    if (content.length > 280) {
        showNotification('Tweet cannot exceed 280 characters', 'error');
        return;
    }
    
    const formData = new FormData();
    formData.append('content', content);
    
    // Add image if uploaded
    if (tweetImageUpload.files[0]) {
        formData.append('image', tweetImageUpload.files[0]);
    }
    
    showLoading(true);
    try {
        const response = await fetch(`${SERVER_URL}/api/tweets`, {
            method: 'POST',
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
        
        // Notify followers via Socket.IO
        socket.emit('new-tweet', newTweet);
    } catch (error) {
        console.error('Error posting tweet:', error);
        showNotification(error.message || 'Network error. Please try again.', 'error');
    } finally {
        showLoading(false);
    }
}

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
    tweetsContainer.innerHTML = '';
    
    if (tweetsToRender.length === 0) {
        tweetsContainer.innerHTML = '<div class="tweet"><div class="tweet-content" style="text-align: center; padding: 20px;">No tweets found. Start following users to see tweets!</div></div>';
        return;
    }
    
    tweetsToRender.forEach(tweet => {
        const tweetElement = createTweetElement(tweet);
        tweetsContainer.appendChild(tweetElement);
    });
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

// Create a tweet element
function createTweetElement(tweet) {
    const tweetEl = document.createElement('div');
    tweetEl.className = 'tweet';
    tweetEl.dataset.id = tweet._id;
    
    // Format time
    const formattedTime = formatTime(tweet.createdAt);
    
    // Check if liked by current user
    const isLiked = tweet.likes && tweet.likes.some(like => {
        const likeId = typeof like === 'string' ? like : like._id;
        return likeId === currentUser._id;
    });
    
    // Check if bookmarked by current user
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
            
            <!-- Comment form -->
            <div class="comment-form" style="display:none;">
                <input type="text" class="comment-input" placeholder="Write a comment...">
                <button class="comment-btn">Reply</button>
            </div>
            
            <!-- Comments container -->
            <div class="comments-container">
                ${renderComments(tweet.comments || [])}
            </div>
        </div>
    `;
    
    // Add like functionality
    const likeButton = tweetEl.querySelector('.tweet-stat.like');
    likeButton.addEventListener('click', function(e) {
        e.stopPropagation();
        toggleLike(tweet._id);
    });
    
    // Add bookmark functionality
    const bookmarkButton = tweetEl.querySelector('.tweet-stat.bookmark');
    bookmarkButton.addEventListener('click', function(e) {
        e.stopPropagation();
        toggleBookmark(tweet._id);
    });
    
    // Add comment toggle
    const commentButton = tweetEl.querySelector('.tweet-stat.comment');
    commentButton.addEventListener('click', function(e) {
        e.stopPropagation();
        const commentForm = tweetEl.querySelector('.comment-form');
        commentForm.style.display = commentForm.style.display === 'none' ? 'flex' : 'none';
    });
    
    // Add comment submission
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
    
    if (diffInSeconds < 60) {
        return 'just now';
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
        return `${diffInMinutes}m`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
        return `${diffInHours}h`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
        return `${diffInDays}d`;
    }
    
    return tweetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Toggle like on a tweet
async function toggleLike(tweetId) {
    try {
        const response = await fetch(`${SERVER_URL}/api/tweets/${tweetId}/like`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentUser.token}`
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to like tweet');
        }
        
        const updatedTweet = await response.json();
        const index = allTweets.findIndex(t => t._id === tweetId);
        if (index !== -1) {
            allTweets[index] = updatedTweet;
            renderTweets();
        }
        
        // Notify via Socket.IO
        socket.emit('tweet-liked', updatedTweet);
    } catch (error) {
        console.error('Error toggling like:', error);
        showNotification(error.message || 'Network error. Please try again.', 'error');
    }
}

// Toggle bookmark on a tweet
async function toggleBookmark(tweetId) {
    try {
        const response = await fetch(`${SERVER_URL}/api/bookmarks/${tweetId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentUser.token}`
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to bookmark tweet');
        }
        
        const result = await response.json();
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
        const response = await fetch(`${SERVER_URL}/api/tweets/${tweetId}/comment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentUser.token}`
            },
            body: JSON.stringify({ content })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to post comment');
        }
        
        const updatedTweet = await response.json();
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
        const response = await fetch(`${SERVER_URL}/api/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentUser.token}`
            },
            body: JSON.stringify({ recipient, content })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to send message');
        }
        
        const newMessage = await response.json();
        showNotification('Message sent!');
        hideNewMessageModal();
        
        // Update messages list
        await loadMessages();
    } catch (error) {
        console.error('Error sending message:', error);
        showNotification(error.message || 'Network error. Please try again.', 'error');
    }
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
        
        const response = await fetch(`${SERVER_URL}/api/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentUser.token}`
            },
            body: JSON.stringify({ 
                recipient: recipientId,
                content,
                conversation: currentConversation._id
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to send message');
        }
        
        const newMessage = await response.json();
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
        const response = await fetch(`${SERVER_URL}/api/users/${currentUser._id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentUser.token}`
            },
            body: JSON.stringify({ name, bio })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update profile');
        }
        
        const updatedUser = await response.json();
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
        const response = await fetch(`${SERVER_URL}/api/users/${currentUser._id}/cover`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${currentUser.token}`
            },
            body: formData
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to upload cover photo');
        }
        
        const result = await response.json();
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
        const response = await fetch(`${SERVER_URL}/api/users/${currentUser._id}/avatar`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${currentUser.token}`
            },
            body: formData
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to upload avatar');
        }
        
        const result = await response.json();
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
    if (unreadCount > 0) {
        notificationBadge.textContent = unreadCount;
        notificationBadge.style.display = 'block';
        mobileNotificationBadge.textContent = unreadCount;
        mobileNotificationBadge.style.display = 'block';
    } else {
        notificationBadge.style.display = 'none';
        mobileNotificationBadge.style.display = 'none';
    }
}

// Update message badge
function updateMessageBadge() {
    const unreadCount = messages.reduce((count, conversation) => {
        const unreadMessages = conversation.messages.filter(m => 
            m.sender._id !== currentUser._id && !m.read
        ).length;
        return count + unreadMessages;
    }, 0);
    
    if (unreadCount > 0) {
        messageBadge.textContent = unreadCount;
        messageBadge.style.display = 'block';
        mobileMessageBadge.textContent = unreadCount;
        mobileMessageBadge.style.display = 'block';
    } else {
        messageBadge.style.display = 'none';
        mobileMessageBadge.style.display = 'none';
    }
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
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => {
        p.style.display = 'none';
    });
    
    // Update active nav item
    document.querySelectorAll('.nav-item, .mobile-nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Show selected page
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
        showConversationsList();
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