<script>
  import { onMount } from 'svelte';
  import { user } from '../stores/user.js';
  
  export let onClose = () => {};
  export let recording = null;
  
  let activeTab = 'share';
  let shareLink = '';
  let shareSettings = {
    allowDownload: true,
    allowComments: true,
    requirePassword: false,
    password: '',
    expiresIn: '7days',
    allowedEmails: []
  };
  
  let collaborators = [];
  let newCollaboratorEmail = '';
  let comments = [];
  let newComment = '';
  
  let teamMembers = [
    { id: 1, name: 'John Doe', email: 'john@company.com', role: 'Editor', avatar: '👨‍💼', status: 'online' },
    { id: 2, name: 'Jane Smith', email: 'jane@company.com', role: 'Viewer', avatar: '👩‍💼', status: 'offline' },
    { id: 3, name: 'Bob Wilson', email: 'bob@company.com', role: 'Editor', avatar: '👨‍💻', status: 'online' }
  ];
  
  let permissions = {
    canView: true,
    canComment: true,
    canEdit: false,
    canDownload: true,
    canShare: false
  };
  
  let activityLog = [
    { id: 1, user: 'John Doe', action: 'viewed', timestamp: new Date(Date.now() - 3600000) },
    { id: 2, user: 'Jane Smith', action: 'commented', timestamp: new Date(Date.now() - 7200000) },
    { id: 3, user: 'Bob Wilson', action: 'downloaded', timestamp: new Date(Date.now() - 10800000) }
  ];
  
  function generateShareLink() {
    const linkId = Math.random().toString(36).substring(2, 15);
    shareLink = `https://nebula-capture.app/share/${linkId}`;
  }
  
  function copyShareLink() {
    navigator.clipboard.writeText(shareLink);
    alert('Link copied to clipboard!');
  }
  
  function addCollaborator() {
    if (newCollaboratorEmail && isValidEmail(newCollaboratorEmail)) {
      collaborators = [
        ...collaborators,
        {
          id: Date.now(),
          email: newCollaboratorEmail,
          role: 'viewer',
          addedAt: new Date()
        }
      ];
      newCollaboratorEmail = '';
    }
  }
  
  function removeCollaborator(id) {
    collaborators = collaborators.filter(c => c.id !== id);
  }
  
  function updateCollaboratorRole(id, role) {
    collaborators = collaborators.map(c => 
      c.id === id ? { ...c, role } : c
    );
  }
  
  function addComment() {
    if (newComment.trim()) {
      comments = [
        {
          id: Date.now(),
          user: $user?.displayName || 'You',
          text: newComment,
          timestamp: new Date(),
          replies: []
        },
        ...comments
      ];
      newComment = '';
    }
  }
  
  function deleteComment(id) {
    comments = comments.filter(c => c.id !== id);
  }
  
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
  
  function formatTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }
  
  function shareViaEmail() {
    const subject = `Check out this video: ${recording?.name || 'Untitled'}`;
    const body = `I've shared a video with you:\n\n${shareLink}\n\nClick the link to view it.`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }
  
  onMount(() => {
    generateShareLink();
  });
</script>

<div class="collab-overlay" on:click={onClose}>
  <div class="collab-modal" on:click|stopPropagation>
    <div class="modal-header">
      <div class="header-title">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
        </svg>
        <div>
          <h2>Share & Collaborate</h2>
          <p class="subtitle">{recording?.name || 'Untitled Recording'}</p>
        </div>
      </div>
      <button class="close-btn" on:click={onClose}>
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      </button>
    </div>

    <div class="modal-body">
      <!-- Tabs -->
      <div class="collab-tabs">
        <button 
          class="tab-btn"
          class:active={activeTab === 'share'}
          on:click={() => activeTab = 'share'}
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
          </svg>
          Share Link
        </button>
        <button 
          class="tab-btn"
          class:active={activeTab === 'team'}
          on:click={() => activeTab = 'team'}
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
          </svg>
          Team ({teamMembers.length})
        </button>
        <button 
          class="tab-btn"
          class:active={activeTab === 'comments'}
          on:click={() => activeTab = 'comments'}
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
          </svg>
          Comments ({comments.length})
        </button>
        <button 
          class="tab-btn"
          class:active={activeTab === 'activity'}
          on:click={() => activeTab === 'activity'}
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.25 2.52.77-1.28-3.52-2.09V8z"/>
          </svg>
          Activity
        </button>
      </div>

      <!-- Tab Content -->
      <div class="tab-content">
        <!-- Share Link Tab -->
        {#if activeTab === 'share'}
          <div class="share-section">
            <div class="link-box">
              <div class="link-header">
                <h3>Share Link</h3>
                <button class="regenerate-btn" on:click={generateShareLink}>
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                  </svg>
                  Regenerate
                </button>
              </div>
              
              <div class="link-input-group">
                <input 
                  type="text" 
                  readonly 
                  value={shareLink}
                  class="link-input"
                />
                <button class="copy-btn" on:click={copyShareLink}>
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                  </svg>
                  Copy
                </button>
              </div>
            </div>

            <div class="share-options">
              <h3>Share Settings</h3>
              
              <div class="option-group">
                <label class="option-label">
                  <input type="checkbox" bind:checked={shareSettings.allowDownload} />
                  <div class="option-info">
                    <span class="option-title">Allow downloads</span>
                    <span class="option-desc">Recipients can download the video</span>
                  </div>
                </label>
              </div>

              <div class="option-group">
                <label class="option-label">
                  <input type="checkbox" bind:checked={shareSettings.allowComments} />
                  <div class="option-info">
                    <span class="option-title">Allow comments</span>
                    <span class="option-desc">Recipients can leave comments</span>
                  </div>
                </label>
              </div>

              <div class="option-group">
                <label class="option-label">
                  <input type="checkbox" bind:checked={shareSettings.requirePassword} />
                  <div class="option-info">
                    <span class="option-title">Password protection</span>
                    <span class="option-desc">Require password to view</span>
                  </div>
                </label>
                
                {#if shareSettings.requirePassword}
                  <input 
                    type="text" 
                    bind:value={shareSettings.password}
                    placeholder="Enter password"
                    class="password-input"
                  />
                {/if}
              </div>

              <div class="option-group">
                <label class="option-title">Link expires in</label>
                <select bind:value={shareSettings.expiresIn} class="select-input">
                  <option value="1day">1 day</option>
                  <option value="7days">7 days</option>
                  <option value="30days">30 days</option>
                  <option value="never">Never</option>
                </select>
              </div>
            </div>

            <div class="share-actions">
              <button class="action-btn email" on:click={shareViaEmail}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
                Share via Email
              </button>
              
              <button class="action-btn slack">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 15a2 2 0 0 1-2 2a2 2 0 0 1-2-2a2 2 0 0 1 2-2h2v2m1 0a2 2 0 0 1 2-2a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2a2 2 0 0 1-2-2v-5m2-8a2 2 0 0 1-2-2a2 2 0 0 1 2-2a2 2 0 0 1 2 2v2H9m0 1a2 2 0 0 1 2 2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2a2 2 0 0 1 2-2h5m8 2a2 2 0 0 1 2-2a2 2 0 0 1 2 2a2 2 0 0 1-2 2h-2v-2m-1 0a2 2 0 0 1-2 2a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2a2 2 0 0 1 2 2v5m-2 8a2 2 0 0 1 2 2a2 2 0 0 1-2 2a2 2 0 0 1-2-2v-2h2m0-1a2 2 0 0 1-2-2a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2a2 2 0 0 1-2 2h-5z"/>
                </svg>
                Share to Slack
              </button>
            </div>
          </div>
        {/if}

        <!-- Team Tab -->
        {#if activeTab === 'team'}
          <div class="team-section">
            <div class="add-collaborator">
              <h3>Add Team Member</h3>
              <div class="add-input-group">
                <input 
                  type="email"
                  bind:value={newCollaboratorEmail}
                  placeholder="Enter email address"
                  class="email-input"
                />
                <button class="add-btn" on:click={addCollaborator}>
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                  </svg>
                  Add
                </button>
              </div>
            </div>

            <div class="team-list">
              <h3>Team Members</h3>
              {#each teamMembers as member}
                <div class="member-card">
                  <div class="member-avatar">
                    {member.avatar}
                    <span class="status-dot" class:online={member.status === 'online'}></span>
                  </div>
                  <div class="member-info">
                    <div class="member-name">{member.name}</div>
                    <div class="member-email">{member.email}</div>
                  </div>
                  <select class="role-select" value={member.role}>
                    <option value="Viewer">Viewer</option>
                    <option value="Editor">Editor</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
              {/each}
            </div>

            <div class="permissions-panel">
              <h3>Default Permissions</h3>
              <div class="permission-list">
                <label class="permission-item">
                  <input type="checkbox" bind:checked={permissions.canView} />
                  <span>Can view recordings</span>
                </label>
                <label class="permission-item">
                  <input type="checkbox" bind:checked={permissions.canComment} />
                  <span>Can add comments</span>
                </label>
                <label class="permission-item">
                  <input type="checkbox" bind:checked={permissions.canEdit} />
                  <span>Can edit recordings</span>
                </label>
                <label class="permission-item">
                  <input type="checkbox" bind:checked={permissions.canDownload} />
                  <span>Can download</span>
                </label>
                <label class="permission-item">
                  <input type="checkbox" bind:checked={permissions.canShare} />
                  <span>Can share with others</span>
                </label>
              </div>
            </div>
          </div>
        {/if}

        <!-- Comments Tab -->
        {#if activeTab === 'comments'}
          <div class="comments-section">
            <div class="add-comment">
              <textarea
                bind:value={newComment}
                placeholder="Add a comment..."
                rows="3"
                class="comment-input"
              />
              <button class="comment-btn" on:click={addComment}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
                Post Comment
              </button>
            </div>

            <div class="comments-list">
              {#if comments.length === 0}
                <div class="empty-comments">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
                  </svg>
                  <p>No comments yet</p>
                  <small>Be the first to comment!</small>
                </div>
              {:else}
                {#each comments as comment}
                  <div class="comment-card">
                    <div class="comment-header">
                      <div class="comment-user">
                        <div class="user-avatar">👤</div>
                        <div>
                          <div class="user-name">{comment.user}</div>
                          <div class="comment-time">{formatTimeAgo(comment.timestamp)}</div>
                        </div>
                      </div>
                      <button class="delete-comment" on:click={() => deleteComment(comment.id)}>
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                        </svg>
                      </button>
                    </div>
                    <div class="comment-text">{comment.text}</div>
                  </div>
                {/each}
              {/if}
            </div>
          </div>
        {/if}

        <!-- Activity Tab -->
        {#if activeTab === 'activity'}
          <div class="activity-section">
            <h3>Recent Activity</h3>
            <div class="activity-list">
              {#each activityLog as activity}
                <div class="activity-item">
                  <div class="activity-icon">
                    {#if activity.action === 'viewed'}
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                      </svg>
                    {:else if activity.action === 'commented'}
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
                      </svg>
                    {:else}
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                      </svg>
                    {/if}
                  </div>
                  <div class="activity-info">
                    <div class="activity-text">
                      <strong>{activity.user}</strong> {activity.action} this recording
                    </div>
                    <div class="activity-time">{formatTimeAgo(activity.timestamp)}</div>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
  .collab-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    padding: 2rem;
  }

  .collab-modal {
    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
    border-radius: 24px;
    border: 1px solid rgba(102, 126, 234, 0.3);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    width: 100%;
    max-width: 900px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 24px 32px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .header-title {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .header-title svg {
    width: 32px;
    height: 32px;
    color: #667eea;
    flex-shrink: 0;
  }

  .header-title h2 {
    margin: 0;
    font-size: 24px;
    font-weight: 700;
    color: #fff;
  }

  .subtitle {
    margin: 4px 0 0 0;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.6);
  }

  .close-btn {
    background: rgba(255, 255, 255, 0.1);
    border: none;
    border-radius: 8px;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    cursor: pointer;
    transition: all 0.2s;
  }

  .close-btn:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  .close-btn svg {
    width: 20px;
    height: 20px;
  }

  .modal-body {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .collab-tabs {
    display: flex;
    gap: 8px;
    padding: 20px 32px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    overflow-x: auto;
  }

  .tab-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    color: rgba(255, 255, 255, 0.6);
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
  }

  .tab-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.9);
  }

  .tab-btn.active {
    background: linear-gradient(135deg, #667eea, #764ba2);
    border-color: rgba(102, 126, 234, 0.5);
    color: #fff;
  }

  .tab-btn svg {
    width: 18px;
    height: 18px;
  }

  .tab-content {
    flex: 1;
    overflow-y: auto;
    padding: 24px 32px;
  }

  /* Share Section */
  .share-section {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .link-box {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    padding: 20px;
  }

  .link-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
  }

  .link-header h3 {
    margin: 0;
    font-size: 16px;
    color: #fff;
  }

  .regenerate-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    background: rgba(255, 255, 255, 0.1);
    border: none;
    border-radius: 8px;
    color: #fff;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .regenerate-btn:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  .regenerate-btn svg {
    width: 16px;
    height: 16px;
  }

  .link-input-group {
    display: flex;
    gap: 12px;
  }

  .link-input {
    flex: 1;
    padding: 12px 16px;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    color: #fff;
    font-family: 'Courier New', monospace;
    font-size: 13px;
  }

  .copy-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    background: linear-gradient(135deg, #667eea, #764ba2);
    border: none;
    border-radius: 8px;
    color: #fff;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .copy-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
  }

  .copy-btn svg {
    width: 18px;
    height: 18px;
  }

  .share-options {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .share-options h3 {
    margin: 0 0 0.5rem 0;
    font-size: 16px;
    color: #fff;
  }

  .option-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .option-label {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    cursor: pointer;
  }

  .option-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .option-title {
    color: #fff;
    font-weight: 600;
  }

  .option-desc {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.6);
  }

  input[type="checkbox"] {
    width: 20px;
    height: 20px;
    cursor: pointer;
    margin-top: 2px;
  }

  .password-input,
  .select-input {
    padding: 10px 12px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: #fff;
    font-size: 14px;
  }

  .share-actions {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 20px;
    border: none;
    border-radius: 12px;
    color: #fff;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .action-btn.email {
    background: linear-gradient(135deg, #3b82f6, #1e40af);
  }

  .action-btn.slack {
    background: linear-gradient(135deg, #611f69, #4a154b);
  }

  .action-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
  }

  .action-btn svg {
    width: 18px;
    height: 18px;
  }

  /* Team Section */
  .team-section {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .add-collaborator h3,
  .team-list h3,
  .permissions-panel h3 {
    margin: 0 0 1rem 0;
    font-size: 16px;
    color: #fff;
  }

  .add-input-group {
    display: flex;
    gap: 12px;
  }

  .email-input {
    flex: 1;
    padding: 12px 16px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: #fff;
    font-size: 14px;
  }

  .add-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 12px 24px;
    background: linear-gradient(135deg, #10b981, #059669);
    border: none;
    border-radius: 8px;
    color: #fff;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .add-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(16, 185, 129, 0.4);
  }

  .add-btn svg {
    width: 18px;
    height: 18px;
  }

  .team-list,
  .permissions-panel {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    padding: 20px;
  }

  .member-card {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 12px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    margin-bottom: 12px;
  }

  .member-avatar {
    position: relative;
    width: 48px;
    height: 48px;
    background: linear-gradient(135deg, #667eea, #764ba2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
  }

  .status-dot {
    position: absolute;
    bottom: 2px;
    right: 2px;
    width: 12px;
    height: 12px;
    background: #6b7280;
    border: 2px solid #1e293b;
    border-radius: 50%;
  }

  .status-dot.online {
    background: #10b981;
  }

  .member-info {
    flex: 1;
  }

  .member-name {
    font-weight: 600;
    color: #fff;
  }

  .member-email {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.6);
  }

  .role-select {
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    color: #fff;
    font-weight: 600;
    cursor: pointer;
  }

  .permission-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .permission-item {
    display: flex;
    align-items: center;
    gap: 12px;
    color: #fff;
    cursor: pointer;
  }

  /* Comments Section */
  .comments-section {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .add-comment {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .comment-input {
    padding: 12px 16px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    color: #fff;
    font-family: inherit;
    font-size: 14px;
    resize: vertical;
  }

  .comment-btn {
    align-self: flex-end;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    background: linear-gradient(135deg, #667eea, #764ba2);
    border: none;
    border-radius: 8px;
    color: #fff;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .comment-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
  }

  .comment-btn svg {
    width: 16px;
    height: 16px;
  }

  .comments-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .empty-comments {
    text-align: center;
    padding: 3rem 1rem;
    color: rgba(255, 255, 255, 0.5);
  }

  .empty-comments svg {
    width: 48px;
    height: 48px;
    margin-bottom: 1rem;
    opacity: 0.3;
  }

  .comment-card {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 16px;
  }

  .comment-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  .comment-user {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .user-avatar {
    width: 36px;
    height: 36px;
    background: linear-gradient(135deg, #667eea, #764ba2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
  }

  .user-name {
    font-weight: 600;
    color: #fff;
    font-size: 14px;
  }

  .comment-time {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.5);
  }

  .delete-comment {
    background: rgba(239, 68, 68, 0.2);
    border: none;
    border-radius: 6px;
    padding: 6px;
    color: #ef4444;
    cursor: pointer;
    transition: all 0.2s;
  }

  .delete-comment:hover {
    background: rgba(239, 68, 68, 0.3);
  }

  .delete-comment svg {
    width: 16px;
    height: 16px;
  }

  .comment-text {
    color: rgba(255, 255, 255, 0.9);
    line-height: 1.6;
    font-size: 14px;
  }

  /* Activity Section */
  .activity-section h3 {
    margin: 0 0 1.5rem 0;
    font-size: 16px;
    color: #fff;
  }

  .activity-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .activity-item {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    padding: 16px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
  }

  .activity-icon {
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, #667eea, #764ba2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .activity-icon svg {
    width: 20px;
    height: 20px;
    color: #fff;
  }

  .activity-info {
    flex: 1;
  }

  .activity-text {
    color: #fff;
    font-size: 14px;
    margin-bottom: 4px;
  }

  .activity-time {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.5);
  }

  /* Scrollbar */
  .tab-content::-webkit-scrollbar {
    width: 8px;
  }

  .tab-content::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 4px;
  }

  .tab-content::-webkit-scrollbar-thumb {
    background: rgba(102, 126, 234, 0.5);
    border-radius: 4px;
  }

  @media (max-width: 768px) {
    .collab-modal {
      max-width: 95%;
    }

    .share-actions {
      grid-template-columns: 1fr;
    }
  }
</style>
