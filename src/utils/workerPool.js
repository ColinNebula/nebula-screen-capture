/**
 * Worker Pool Manager
 * Manages a pool of web workers for efficient parallel processing
 */

class WorkerPool {
  constructor(workerPath, poolSize = navigator.hardwareConcurrency || 4) {
    this.workerPath = workerPath;
    this.poolSize = Math.min(poolSize, 8); // Max 8 workers
    this.workers = [];
    this.availableWorkers = [];
    this.taskQueue = [];
    this.taskId = 0;
    
    this.initialize();
  }

  /**
   * Initialize worker pool
   */
  initialize() {
    for (let i = 0; i < this.poolSize; i++) {
      const worker = new Worker(this.workerPath, { type: 'module' });
      
      worker.onmessage = (event) => this.handleWorkerMessage(worker, event);
      worker.onerror = (error) => this.handleWorkerError(worker, error);
      
      this.workers.push(worker);
      this.availableWorkers.push(worker);
    }
    
    console.log(`✅ Worker pool initialized with ${this.poolSize} workers`);
  }

  /**
   * Execute task in worker
   */
  async executeTask(type, data) {
    return new Promise((resolve, reject) => {
      const taskId = this.taskId++;
      
      const task = {
        id: taskId,
        type,
        data,
        resolve,
        reject,
        timestamp: Date.now()
      };

      // Get available worker or queue task
      const worker = this.availableWorkers.pop();
      
      if (worker) {
        this.runTask(worker, task);
      } else {
        this.taskQueue.push(task);
      }
    });
  }

  /**
   * Run task on worker
   */
  runTask(worker, task) {
    worker.currentTask = task;
    worker.postMessage({
      type: task.type,
      data: task.data,
      id: task.id
    });
  }

  /**
   * Handle worker message
   */
  handleWorkerMessage(worker, event) {
    const { type, data, id, error } = event.data;
    
    if (!worker.currentTask) return;
    
    // Handle progress updates
    if (type === 'progress') {
      if (worker.currentTask.onProgress) {
        worker.currentTask.onProgress(data);
      }
      return;
    }
    
    // Handle task completion
    if (worker.currentTask.id === id) {
      const task = worker.currentTask;
      worker.currentTask = null;
      
      if (error) {
        task.reject(new Error(error));
      } else {
        task.resolve(data);
      }
      
      // Make worker available and process queue
      this.availableWorkers.push(worker);
      this.processQueue();
    }
  }

  /**
   * Handle worker error
   */
  handleWorkerError(worker, error) {
    console.error('Worker error:', error);
    
    if (worker.currentTask) {
      worker.currentTask.reject(error);
      worker.currentTask = null;
    }
    
    // Restart worker
    this.restartWorker(worker);
  }

  /**
   * Restart failed worker
   */
  restartWorker(worker) {
    const index = this.workers.indexOf(worker);
    if (index === -1) return;
    
    worker.terminate();
    
    const newWorker = new Worker(this.workerPath, { type: 'module' });
    newWorker.onmessage = (event) => this.handleWorkerMessage(newWorker, event);
    newWorker.onerror = (error) => this.handleWorkerError(newWorker, error);
    
    this.workers[index] = newWorker;
    this.availableWorkers.push(newWorker);
    
    this.processQueue();
  }

  /**
   * Process queued tasks
   */
  processQueue() {
    while (this.taskQueue.length > 0 && this.availableWorkers.length > 0) {
      const task = this.taskQueue.shift();
      const worker = this.availableWorkers.pop();
      this.runTask(worker, task);
    }
  }

  /**
   * Execute multiple tasks in parallel
   */
  async executeParallel(tasks) {
    return Promise.all(
      tasks.map(({ type, data }) => this.executeTask(type, data))
    );
  }

  /**
   * Get pool statistics
   */
  getStats() {
    return {
      poolSize: this.poolSize,
      availableWorkers: this.availableWorkers.length,
      busyWorkers: this.poolSize - this.availableWorkers.length,
      queuedTasks: this.taskQueue.length,
      totalTasks: this.taskId
    };
  }

  /**
   * Terminate all workers
   */
  terminate() {
    this.workers.forEach(worker => worker.terminate());
    this.workers = [];
    this.availableWorkers = [];
    this.taskQueue = [];
    console.log('Worker pool terminated');
  }
}

// Singleton instances
let encoderPool = null;
let thumbnailPool = null;

/**
 * Get video encoder worker pool
 */
export function getEncoderPool() {
  if (!encoderPool) {
    encoderPool = new WorkerPool('/src/workers/videoEncoder.worker.js');
  }
  return encoderPool;
}

/**
 * Get thumbnail generator worker pool
 */
export function getThumbnailPool() {
  if (!thumbnailPool) {
    thumbnailPool = new WorkerPool('/src/workers/thumbnailGenerator.worker.js');
  }
  return thumbnailPool;
}

/**
 * Terminate all worker pools
 */
export function terminateAllPools() {
  if (encoderPool) {
    encoderPool.terminate();
    encoderPool = null;
  }
  if (thumbnailPool) {
    thumbnailPool.terminate();
    thumbnailPool = null;
  }
}

export default WorkerPool;
