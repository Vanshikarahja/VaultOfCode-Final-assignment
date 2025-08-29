import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
        import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
        import { getFirestore, collection, addDoc, onSnapshot, serverTimestamp, deleteDoc, doc, updateDoc, increment, query, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

        const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
        const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
        const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

        const app = initializeApp(firebaseConfig);
        const db = getFirestore(app);
        const auth = getAuth(app);

        let currentUserId = null;
        let allPosts = [];
        let filterUserId = null;

        const postIdDisplay = document.getElementById('user-id-display');
        const copyIdBtn = document.getElementById('copy-id-btn');
        const postForm = document.getElementById('post-form');
        const postsContainer = document.getElementById('posts-container');
        const statusMessage = document.getElementById('status-message');
        const searchBar = document.getElementById('search-bar');
        const showAllBtn = document.getElementById('show-all-btn');
        const postsTitle = document.getElementById('posts-title');
        const loadingSpinner = document.getElementById('loading-spinner');

        function showMessage(message) {
            statusMessage.textContent = message;
            statusMessage.classList.remove('hidden');
            setTimeout(() => {
                statusMessage.classList.add('hidden');
                statusMessage.textContent = '';
            }, 3000);
        }

        function showAlert(message) {
            const modal = document.getElementById('alert-modal');
            const msgEl = document.getElementById('alert-message');
            msgEl.textContent = message;
            modal.classList.remove('hidden');
            document.getElementById('alert-close-btn').onclick = () => {
                modal.classList.add('hidden');
            };
        }

        async function renderPosts(postsToRender) {
            postsContainer.innerHTML = '';
            if (postsToRender.length === 0) {
                postsContainer.innerHTML = `
                    <div class="col-span-full text-center py-10 text-gray-500 text-lg">
                        No posts found. Be the first to publish something!
                    </div>
                `;
                return;
            }

            postsToRender.forEach(post => {
                const isUserPost = post.userId === currentUserId;
                const postElement = document.createElement('div');
                postElement.id = `post-${post.id}`;
                postElement.classList.add('post-card', 'bg-white', 'p-6', 'rounded-2xl', 'shadow-xl', 'border', 'border-gray-100', 'flex', 'flex-col', 'justify-between');
                
                const formattedDate = post.createdAt ? new Date(post.createdAt.seconds * 1000).toLocaleString() : 'Just now';

                postElement.innerHTML = `
                    <div>
                        <div id="content-container-${post.id}">
                            <h3 class="text-2xl font-bold text-gray-800 mb-2">${post.title}</h3>
                            <p class="text-gray-600 mb-4 whitespace-pre-wrap">${post.content}</p>
                        </div>
                    </div>
                    <div class="flex justify-between items-center mt-4 text-gray-500 text-sm">
                        <div class="flex items-center space-x-2">
                            <button class="user-filter-btn font-medium text-indigo-500 hover:text-indigo-700 transition-colors p-1 rounded-full bg-indigo-100" data-user-id="${post.userId}">
                                View by User
                            </button>
                            <span class="text-xs">${formattedDate}</span>
                        </div>
                        <div class="flex items-center space-x-4">
                            <div class="flex items-center space-x-1">
                                <button class="like-btn text-red-400 hover:text-red-600 transition-colors transform hover:scale-125 focus:outline-none" data-post-id="${post.id}">
                                    <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5A5.5 5.5 0 017.5 3c1.74 0 3.41.81 4.5 2.09A5.5 5.5 0 0116.5 3c3.03 0 5.5 2.47 5.5 5.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path>
                                    </svg>
                                </button>
                                <span class="font-semibold text-gray-700">${post.likes || 0}</span>
                            </div>
                            ${isUserPost ? `
                                <div class="flex space-x-2">
                                    <button class="edit-btn text-blue-500 hover:text-blue-700 transition-colors p-1 rounded-full hover:bg-blue-100" data-post-id="${post.id}">
                                        <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M19 2.01L19.99 3l-3.99 4L15 6L19 2.01zM1 18.01v4h4L16.5 9.5l-4-4L1 18.01z"></path>
                                        </svg>
                                    </button>
                                    <button class="delete-btn text-red-500 hover:text-red-700 transition-colors p-1 rounded-full hover:bg-red-100" data-post-id="${post.id}">
                                        <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M16 9v11a2 2 0 01-2 2H8a2 2 0 01-2-2V9m11-4h-3.58l-1.4-1.4a1 1 0 00-.7-.2H7a1 1 0 00-.7.2L5 5h-3a1 1 0 000 2h20a1 1 0 000-2z"></path>
                                        </svg>
                                    </button>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                    <div class="mt-4">
                        <button class="toggle-comments-btn w-full text-center text-sm font-medium text-purple-500 hover:underline" data-post-id="${post.id}" data-comments-count="${post.commentsCount}">
                            View/Add Comments (${post.commentsCount || 0})
                        </button>
                        <div id="comments-section-${post.id}" class="hidden"></div>
                    </div>
                `;
                postsContainer.appendChild(postElement);
            });
        }

        async function handlePostSubmit(e) {
            e.preventDefault();
            const titleInput = document.getElementById('title');
            const contentInput = document.getElementById('content');

            const title = titleInput.value.trim();
            const content = contentInput.value.trim();

            if (!title || !content) {
                showAlert('Title and content cannot be empty.');
                return;
            }

            if (!currentUserId) {
                showAlert('Authentication error. Please refresh the page.');
                return;
            }

            const newPost = {
                title,
                content,
                userId: currentUserId,
                createdAt: serverTimestamp(),
                likes: 0
            };

            try {
                await addDoc(collection(db, `artifacts/${appId}/public/data/blog-posts`), newPost);
                titleInput.value = '';
                contentInput.value = '';
                showMessage('Post created successfully!');
            } catch (error) {
                console.error('Error adding document: ', error);
                showAlert('Error creating post. Please try again.');
            }
        }

        async function handleLike(postId) {
            try {
                const postRef = doc(db, `artifacts/${appId}/public/data/blog-posts`, postId);
                await updateDoc(postRef, { likes: increment(1) });
            } catch (error) {
                console.error('Error updating likes: ', error);
            }
        }

        async function handleDelete(postId) {
            try {
                await deleteDoc(doc(db, `artifacts/${appId}/public/data/blog-posts`, postId));
                showMessage('Post deleted successfully!');
            } catch (error) {
                console.error('Error deleting document: ', error);
                showAlert('Error deleting post. Please try again.');
            }
        }

        async function handleEdit(postId, currentTitle, currentContent) {
            const contentContainer = document.getElementById(`content-container-${postId}`);
            
            const editModeHTML = `
                <div class="space-y-2 mb-4">
                    <input type="text" id="edit-title-${postId}" value="${currentTitle}" class="w-full text-2xl font-bold text-gray-800 border-b border-gray-300 focus:outline-none" />
                    <textarea id="edit-content-${postId}" rows="6" class="w-full text-gray-600 border border-gray-300 rounded-lg p-2 focus:outline-none resize-none">${currentContent}</textarea>
                </div>
                <div class="flex space-x-2">
                    <button id="save-btn-${postId}" class="text-green-500 hover:text-green-700 transition-colors p-1 rounded-full hover:bg-green-100">Save</button>
                    <button id="cancel-btn-${postId}" class="text-gray-500 hover:text-gray-700 transition-colors p-1 rounded-full hover:bg-gray-100">Cancel</button>
                </div>
            `;
            
            const oldButtons = contentContainer.nextElementSibling;
            oldButtons.classList.add('hidden');
            contentContainer.innerHTML = editModeHTML;

            document.getElementById(`save-btn-${postId}`).addEventListener('click', async () => {
                const newTitle = document.getElementById(`edit-title-${postId}`).value;
                const newContent = document.getElementById(`edit-content-${postId}`).value;
                if (!newTitle.trim() || !newContent.trim()) {
                    showAlert('Title and content cannot be empty.');
                    return;
                }
                try {
                    await updateDoc(doc(db, `artifacts/${appId}/public/data/blog-posts`, postId), {
                        title: newTitle,
                        content: newContent
                    });
                    showMessage('Post updated successfully!');
                    oldButtons.classList.remove('hidden');
                } catch (error) {
                    console.error('Error updating post: ', error);
                    showAlert('Failed to update post.');
                }
            });

            document.getElementById(`cancel-btn-${postId}`).addEventListener('click', () => {
                const originalHTML = `
                    <h3 class="text-2xl font-bold text-gray-800 mb-2">${currentTitle}</h3>
                    <p class="text-gray-600 mb-4 whitespace-pre-wrap">${currentContent}</p>
                `;
                contentContainer.innerHTML = originalHTML;
                oldButtons.classList.remove('hidden');
            });
        }

        async function handleCopyUserId() {
            try {
                const userIdText = postIdDisplay.textContent.replace('Your ID: ', '');
                await navigator.clipboard.writeText(userIdText);
                showMessage('User ID copied to clipboard!');
            } catch (err) {
                console.error('Could not copy text: ', err);
                showMessage('Failed to copy user ID.');
            }
        }

        function handleUserFilter(userId) {
            filterUserId = filterUserId === userId ? null : userId;
            renderFilteredAndSearchedPosts();
            if (filterUserId) {
                postsTitle.textContent = `Posts by ${filterUserId.substring(0, 8)}...`;
                showAllBtn.classList.remove('hidden');
            } else {
                postsTitle.textContent = 'Recent Posts';
                showAllBtn.classList.add('hidden');
            }
        }

        function renderFilteredAndSearchedPosts() {
            const searchTerm = searchBar.value.toLowerCase();
            const filteredPosts = allPosts.filter(post => {
                const matchesUser = filterUserId ? post.userId === filterUserId : true;
                const matchesSearch = searchTerm === '' ||
                    post.title.toLowerCase().includes(searchTerm) ||
                    post.content.toLowerCase().includes(searchTerm);
                return matchesUser && matchesSearch;
            });
            renderPosts(filteredPosts);
        }

        async function renderComments(postId) {
            const commentsContainer = document.getElementById(`comments-section-${postId}`);
            commentsContainer.innerHTML = `
                <div class="mt-6 bg-gray-50 p-4 rounded-xl">
                    <h4 class="text-lg font-bold mb-3 text-gray-700">Comments...</h4>
                    <div id="comments-list-${postId}" class="space-y-4 max-h-64 overflow-y-auto mb-4"></div>
                    <form id="comment-form-${postId}" class="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mt-4">
                        <textarea id="comment-text-${postId}" placeholder="Add a comment..." rows="2" class="flex-grow px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm resize-none"></textarea>
                        <button type="submit" class="bg-purple-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-purple-600 transition-colors">Add Comment</button>
                    </form>
                    <p id="comment-status-${postId}" class="mt-2 text-center text-xs text-gray-500"></p>
                </div>
            `;
            
            const commentsList = document.getElementById(`comments-list-${postId}`);
            const commentStatus = document.getElementById(`comment-status-${postId}`);

            const commentsCollection = collection(db, `artifacts/${appId}/public/data/blog-posts/${postId}/comments`);
            const commentsQuery = query(commentsCollection, orderBy('createdAt', 'desc'));
            
            const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
                commentsList.innerHTML = '';
                if (snapshot.docs.length === 0) {
                    commentsList.innerHTML = `<p class="text-sm text-gray-400 text-center">No comments yet. Be the first to add one!</p>`;
                } else {
                    snapshot.docs.forEach(doc => {
                        const comment = doc.data();
                        const commentElement = document.createElement('div');
                        commentElement.classList.add('p-3', 'bg-white', 'rounded-lg', 'shadow-sm', 'border', 'border-gray-100');
                        const formattedCommentDate = comment.createdAt ? new Date(comment.createdAt.seconds * 1000).toLocaleString() : 'Just now';
                        commentElement.innerHTML = `
                            <div class="flex justify-between items-center mb-1">
                                <span class="text-xs font-medium text-purple-500 cursor-pointer hover:underline" data-user-id="${comment.userId}">
                                    ${comment.userId.substring(0, 8)}...
                                </span>
                                <span class="text-xs text-gray-400">${formattedCommentDate}</span>
                            </div>
                            <p class="text-sm text-gray-600">${comment.text}</p>
                        `;
                        commentsList.appendChild(commentElement);
                    });
                }
            });

            document.getElementById(`comment-form-${postId}`).addEventListener('submit', async (e) => {
                e.preventDefault();
                const commentText = document.getElementById(`comment-text-${postId}`).value;
                if (commentText.trim() === '') {
                    commentStatus.textContent = 'Comment cannot be empty.';
                    return;
                }
                try {
                    await addDoc(commentsCollection, {
                        text: commentText,
                        userId: currentUserId,
                        createdAt: serverTimestamp(),
                    });
                    document.getElementById(`comment-text-${postId}`).value = '';
                    commentStatus.textContent = 'Comment added!';
                } catch (error) {
                    console.error("Error adding comment: ", error);
                    commentStatus.textContent = 'Failed to add comment.';
                }
            });

            // Clean up the listener when comments are hidden
            const observer = new MutationObserver((mutationsList) => {
                for (let mutation of mutationsList) {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                        if (commentsContainer.classList.contains('hidden')) {
                            unsubscribe();
                            observer.disconnect();
                        }
                    }
                }
            });
            observer.observe(commentsContainer, { attributes: true });
        }


        // Main execution logic
        window.onload = function() {
            onAuthStateChanged(auth, async (user) => {
                if (user) {
                    currentUserId = user.uid;
                } else if (initialAuthToken) {
                    try {
                        const cred = await signInWithCustomToken(auth, initialAuthToken);
                        currentUserId = cred.user.uid;
                    } catch (error) {
                        console.error("Error signing in with custom token:", error);
                        await signInAnonymously(auth);
                        currentUserId = auth.currentUser.uid;
                    }
                } else {
                    await signInAnonymously(auth);
                    currentUserId = auth.currentUser.uid;
                }
                loadingSpinner.classList.add('hidden');
                postIdDisplay.textContent = `Your ID: ${currentUserId}`;
                
                // Set up main onSnapshot listener for posts
                const postsCollection = collection(db, `artifacts/${appId}/public/data/blog-posts`);
                const postsQuery = query(postsCollection, orderBy('createdAt', 'desc'));

                onSnapshot(postsQuery, async (snapshot) => {
                    allPosts = await Promise.all(snapshot.docs.map(async (postDoc) => {
                        const postData = { id: postDoc.id, ...postDoc.data() };
                        const commentsCount = (await getDocs(collection(db, `artifacts/${appId}/public/data/blog-posts/${postDoc.id}/comments`))).size;
                        return { ...postData, commentsCount };
                    }));
                    renderFilteredAndSearchedPosts();
                });
            });

            postForm.addEventListener('submit', handlePostSubmit);
            copyIdBtn.addEventListener('click', handleCopyUserId);
            showAllBtn.addEventListener('click', () => handleUserFilter(null));
            searchBar.addEventListener('input', renderFilteredAndSearchedPosts);

            postsContainer.addEventListener('click', (e) => {
                const target = e.target;
                const postId = target.dataset.postId || target.closest('button')?.dataset.postId;
                const userId = target.dataset.userId || target.closest('button')?.dataset.userId;

                if (target.closest('.like-btn')) {
                    handleLike(postId);
                } else if (target.closest('.delete-btn')) {
                    handleDelete(postId);
                } else if (target.closest('.edit-btn')) {
                    const post = allPosts.find(p => p.id === postId);
                    if (post) {
                        handleEdit(postId, post.title, post.content);
                    }
                } else if (target.closest('.user-filter-btn')) {
                    handleUserFilter(userId);
                } else if (target.closest('.toggle-comments-btn')) {
                    const commentsSection = document.getElementById(`comments-section-${postId}`);
                    commentsSection.classList.toggle('hidden');
                    if (!commentsSection.classList.contains('hidden') && !commentsSection.innerHTML) {
                        renderComments(postId);
                    }
                }
            });
        };