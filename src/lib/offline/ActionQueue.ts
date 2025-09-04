import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActionExecutors } from './ActionExecutors';

const OFFLINE_QUEUE_KEY = 'offline:queue';
const FAILED_QUEUE_KEY = 'offline:failed_queue';
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

export interface OfflineAction {
  id: string;
  type: keyof typeof ActionExecutors;
  payload: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  priority: 'low' | 'normal' | 'high';
}

class ActionQueue {
  private queue: OfflineAction[] = [];
  private failedQueue: OfflineAction[] = [];
  private isProcessing = false;
  private processingTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.loadQueues();
  }

  private async loadQueues() {
    try {
      const [storedQueue, storedFailedQueue] = await Promise.all([
        AsyncStorage.getItem(OFFLINE_QUEUE_KEY),
        AsyncStorage.getItem(FAILED_QUEUE_KEY)
      ]);
      
      if (storedQueue) {
        this.queue = JSON.parse(storedQueue);
      }
      
      if (storedFailedQueue) {
        this.failedQueue = JSON.parse(storedFailedQueue);
      }
    } catch (error) {
      console.error('Failed to load offline queues:', error);
    }
  }

  private async persistQueues() {
    try {
      await Promise.all([
        AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(this.queue)),
        AsyncStorage.setItem(FAILED_QUEUE_KEY, JSON.stringify(this.failedQueue))
      ]);
    } catch (error) {
      console.error('Failed to persist offline queues:', error);
    }
  }

  private generateActionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateRetryDelay(retryCount: number): number {
    // exponential backoff 
    const baseDelay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
    const jitter = Math.random() * 0.1 * baseDelay;
    return baseDelay + jitter;
  }

  async enqueue(
    type: keyof typeof ActionExecutors, 
    payload: any, 
    priority: 'low' | 'normal' | 'high' = 'normal'
  ) {
    const action: OfflineAction = {
      id: this.generateActionId(),
      type,
      payload,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: MAX_RETRIES,
      priority
    };

    // insert based on priority (high first, then normal, then low)
    const priorityOrder = { high: 0, normal: 1, low: 2 };
    const insertIndex = this.queue.findIndex(
      item => priorityOrder[item.priority] > priorityOrder[priority]
    );
    
    if (insertIndex === -1) {
      this.queue.push(action);
    } else {
      this.queue.splice(insertIndex, 0, action);
    }

    await this.persistQueues();
    console.log('Action enqueued:', action);
  }

  async process() {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    console.log('Processing offline queue...');

    // sorting queue by priority and timestamp
    this.queue.sort((a, b) => {
      const priorityOrder = { high: 0, normal: 1, low: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return a.timestamp - b.timestamp;
    });

    while (this.queue.length > 0) {
      const action = this.queue[0];
      try {
        const executor = ActionExecutors[action.type];
        if (!executor) {
          throw new Error(`No executor for action type: ${String(action.type)}`);
        }

        console.log(`Executing action:`, action);
        await executor(action.payload);

        // If successful, remove from queue
        this.queue.shift();
        await this.persistQueues();
        console.log(`Action executed successfully:`, action.id);
      } catch (error) {
        console.error(`Failed to execute action:`, action, error);
        
        action.retryCount++;
        
        if (action.retryCount >= action.maxRetries) {
          // move to failed queue
          const failedAction = { ...action };
          this.failedQueue.push(failedAction);
          this.queue.shift();
          console.log(`Action moved to failed queue after ${action.maxRetries} retries:`, action.id);
        } else {
          // schedule retry with exponential backoff
          const delay = this.calculateRetryDelay(action.retryCount);
          console.log(`Scheduling retry for action ${action.id} in ${delay}ms (attempt ${action.retryCount + 1}/${action.maxRetries})`);
          
          this.queue.shift(); // remove from front
          
          // schedule retry
          this.processingTimeout = setTimeout(async () => {
            this.queue.unshift(action); // add back to front
            await this.persistQueues();
            this.process(); // resume
          }, delay);
          
          await this.persistQueues();
          break; // stop processing for now
        }
        
        await this.persistQueues();
      }
    }

    this.isProcessing = false;
    console.log('Offline queue processing finished.');
  }

  async retryFailedActions() {
    console.log('Retrying failed actions...');
    
    // move failed actions back to main queue with reset retry count
    const actionsToRetry = this.failedQueue.splice(0);
    actionsToRetry.forEach(action => {
      action.retryCount = 0;
      this.queue.push(action);
    });
    
    await this.persistQueues();
    return this.process();
  }

  getQueueStatus() {
    return {
      pendingCount: this.queue.length,
      failedCount: this.failedQueue.length,
      isProcessing: this.isProcessing,
      pendingActions: this.queue.map(action => ({
        id: action.id,
        type: action.type,
        priority: action.priority,
        retryCount: action.retryCount,
        timestamp: action.timestamp
      })),
      failedActions: this.failedQueue.map(action => ({
        id: action.id,
        type: action.type,
        priority: action.priority,
        retryCount: action.retryCount,
        timestamp: action.timestamp
      }))
    };
  }

  async clearFailedQueue() {
    this.failedQueue.length = 0;
    await this.persistQueues();
  }

  async clearAllQueues() {
    this.queue.length = 0;
    this.failedQueue.length = 0;
    if (this.processingTimeout) {
      clearTimeout(this.processingTimeout);
      this.processingTimeout = null;
    }
    await this.persistQueues();
  }
}

export const OfflineActionQueue = new ActionQueue();