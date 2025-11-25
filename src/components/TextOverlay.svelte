<script>
  import { createEventDispatcher, onMount } from 'svelte';
  import { theme } from '../stores/theme.js';

  export let text = '';
  export let position = { x: 50, y: 50 }; // Percentage based
  export let style = {
    fontSize: 24,
    fontFamily: 'Arial',
    color: '#ffffff',
    backgroundColor: 'transparent',
    fontWeight: 'normal',
    fontStyle: 'normal',
    textAlign: 'left',
    padding: 10,
    borderRadius: 4,
    textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
    rotation: 0,
    opacity: 1
  };
  export let isSelected = false;
  export let index = 0;
  export let containerWidth = 800;
  export let containerHeight = 600;

  const dispatch = createEventDispatcher();

  let isDragging = false;
  let dragOffset = { x: 0, y: 0 };
  let textElement;
  let isResizing = false;

  function handleMouseDown(e) {
    if (e.target.classList.contains('resize-handle')) {
      isResizing = true;
      return;
    }
    isDragging = true;
    const rect = textElement.getBoundingClientRect();
    dragOffset.x = e.clientX - rect.left;
    dragOffset.y = e.clientY - rect.top;
    dispatch('select', { index });
    e.preventDefault();
  }

  function handleMouseMove(e) {
    if (isDragging) {
      const containerRect = textElement.parentElement.getBoundingClientRect();
      const newX = ((e.clientX - containerRect.left - dragOffset.x) / containerRect.width) * 100;
      const newY = ((e.clientY - containerRect.top - dragOffset.y) / containerRect.height) * 100;
      
      position = {
        x: Math.max(0, Math.min(100, newX)),
        y: Math.max(0, Math.min(100, newY))
      };
      
      dispatch('update', { index, position });
    }
  }

  function handleMouseUp() {
    isDragging = false;
    isResizing = false;
  }

  function handleKeyDown(e) {
    if (!isSelected) return;
    
    const step = e.shiftKey ? 10 : 1;
    let newPos = { ...position };
    
    switch(e.key) {
      case 'ArrowLeft':
        newPos.x = Math.max(0, position.x - step);
        break;
      case 'ArrowRight':
        newPos.x = Math.min(100, position.x + step);
        break;
      case 'ArrowUp':
        newPos.y = Math.max(0, position.y - step);
        break;
      case 'ArrowDown':
        newPos.y = Math.min(100, position.y + step);
        break;
      case 'Delete':
      case 'Backspace':
        dispatch('delete', { index });
        e.preventDefault();
        return;
      default:
        return;
    }
    
    position = newPos;
    dispatch('update', { index, position });
    e.preventDefault();
  }

  onMount(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('keydown', handleKeyDown);
    };
  });

  $: textStyle = `
    left: ${position.x}%;
    top: ${position.y}%;
    font-size: ${style.fontSize}px;
    font-family: ${style.fontFamily};
    color: ${style.color};
    background-color: ${style.backgroundColor};
    font-weight: ${style.fontWeight};
    font-style: ${style.fontStyle};
    text-align: ${style.textAlign};
    padding: ${style.padding}px;
    border-radius: ${style.borderRadius}px;
    text-shadow: ${style.textShadow};
    transform: translate(-50%, -50%) rotate(${style.rotation}deg);
    opacity: ${style.opacity};
  `;
</script>

<div
  bind:this={textElement}
  class="text-overlay"
  class:selected={isSelected}
  class:dragging={isDragging}
  style={textStyle}
  on:mousedown={handleMouseDown}
  role="button"
  tabindex="0"
  aria-label="Text overlay: {text}"
>
  {text || 'Double click to edit'}
  {#if isSelected}
    <div class="resize-handles" aria-hidden="true">
      <div class="resize-handle nw"></div>
      <div class="resize-handle ne"></div>
      <div class="resize-handle sw"></div>
      <div class="resize-handle se"></div>
    </div>
  {/if}
</div>

<style>
  .text-overlay {
    position: absolute;
    cursor: move;
    user-select: none;
    white-space: pre-wrap;
    word-wrap: break-word;
    max-width: 80%;
    min-width: 50px;
    min-height: 30px;
    z-index: 10;
    transition: box-shadow 0.2s ease;
  }

  .text-overlay:hover {
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
  }

  .text-overlay.selected {
    box-shadow: 0 0 0 2px #3b82f6;
    outline: none;
  }

  .text-overlay.dragging {
    cursor: grabbing;
    opacity: 0.8;
  }

  .resize-handles {
    position: absolute;
    inset: -6px;
    pointer-events: none;
  }

  .resize-handle {
    position: absolute;
    width: 12px;
    height: 12px;
    background: white;
    border: 2px solid #3b82f6;
    border-radius: 50%;
    pointer-events: all;
  }

  .resize-handle.nw {
    top: -6px;
    left: -6px;
    cursor: nw-resize;
  }

  .resize-handle.ne {
    top: -6px;
    right: -6px;
    cursor: ne-resize;
  }

  .resize-handle.sw {
    bottom: -6px;
    left: -6px;
    cursor: sw-resize;
  }

  .resize-handle.se {
    bottom: -6px;
    right: -6px;
    cursor: se-resize;
  }
</style>
