<script>
  export let recordings = [];
  export let onSelect = () => {};
  export let onDownload = () => {};
  export let onDelete = () => {};
  export let onEdit = () => {};
  export let currentRecording = null;

  let searchQuery = '';
  let sortBy = 'newest';

  $: filteredRecordings = recordings
    .filter(rec => {
      if (!searchQuery) return true;
      return rec.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
             rec.date?.toLowerCase().includes(searchQuery.toLowerCase());
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.timestamp || b.date) - new Date(a.timestamp || a.date);
        case 'oldest':
          return new Date(a.timestamp || a.date) - new Date(b.timestamp || b.date);
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'size':
          return (b.size || 0) - (a.size || 0);
        default:
          return 0;
      }
    });

  $: totalSize = recordings.reduce((sum, rec) => sum + (rec.size || 0), 0);
  $: formattedTotalSize = formatBytes(totalSize);

  function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  function formatDuration(seconds) {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  function formatDate(dateString) {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString();
  }

  function handleDownloadAll() {
    recordings.forEach(rec => onDownload(rec));
  }

  function handleDeleteAll() {
    if (confirm(`Delete all ${recordings.length} recordings?`)) {
      recordings.forEach(rec => onDelete(rec));
    }
  }
</script>

<div class="file-manager">
  <div class="file-manager-header">
    <h3>Recorded Videos ({recordings.length})</h3>

    {#if recordings.length > 0}
      <div class="bulk-actions">
        <button
          class="bulk-btn download-all"
          on:click={handleDownloadAll}
          title="Download all"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
          </svg>
        </button>
        <button
          class="bulk-btn delete-all"
          on:click={handleDeleteAll}
          title="Delete all"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
          </svg>
        </button>
      </div>
    {/if}
  </div>

  {#if recordings.length > 0}
    <div class="file-controls">
      <input
        type="text"
        class="search-input"
        placeholder="Search recordings..."
        bind:value={searchQuery}
      />
      <select class="sort-select" bind:value={sortBy}>
        <option value="newest">Newest First</option>
        <option value="oldest">Oldest First</option>
        <option value="name">Name (A-Z)</option>
        <option value="size">Size (Largest)</option>
      </select>
    </div>

    <div class="file-stats">
      <div class="stat">
        <span>Total Files</span>
        <span>{recordings.length}</span>
      </div>
      <div class="stat">
        <span>Total Size</span>
        <span>{formattedTotalSize}</span>
      </div>
      <div class="stat">
        <span>Filtered</span>
        <span>{filteredRecordings.length}</span>
      </div>
    </div>

    <div class="file-list">
      {#each filteredRecordings as recording (recording.id)}
        <div
          class="file-item"
          class:active={currentRecording?.id === recording.id}
          on:click={() => onSelect(recording)}
        >
          <div class="file-thumbnail">
            {#if recording.thumbnail}
              <img src={recording.thumbnail} alt={recording.name} />
            {:else if recording.url}
              <video src={recording.url} preload="metadata"></video>
            {:else}
              <div style="width: 100%; height: 100%; background: #374151;"></div>
            {/if}
            <div class="play-overlay">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>

          <div class="file-details">
            <div class="file-name">{recording.name || 'Untitled Recording'}</div>
            <div class="file-meta">
              <span>{formatDuration(recording.duration)}</span>
              <span>•</span>
              <span>{formatBytes(recording.size)}</span>
              <span>•</span>
              <span>{recording.quality || '1080p'}</span>
            </div>
            <div class="file-date">{formatDate(recording.timestamp || recording.date)}</div>
          </div>

          <div class="file-actions">
            <button
              class="file-action-btn"
              on:click|stopPropagation={() => onEdit(recording)}
              title="Edit"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
            <button
              class="file-action-btn"
              on:click|stopPropagation={() => onDownload(recording)}
              title="Download"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
              </svg>
            </button>
            <button
              class="file-action-btn delete"
              on:click|stopPropagation={() => onDelete(recording)}
              title="Delete"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
              </svg>
            </button>
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <div class="empty-state">
      <div class="empty-message">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin: 0 auto;">
          <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        <p>No recordings yet</p>
        <span>Start recording to see your videos here</span>
      </div>
    </div>
  {/if}
</div>

<style>
  @import './FileManager.css';
</style>
