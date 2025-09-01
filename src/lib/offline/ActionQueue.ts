import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActionExecutors } from './ActionExecutors';

const OFFLINE_QUEUE_KEY = 'offline:queue';

export interface OfflineAction {
  type: keyof typeof ActionExecutors;
  payload: any;
  // TODO: metadata timestamp, retries
}

class ActionQueue {
  private queue: OfflineAction[] = [];
  private isProcessing = false;

  constructor() {
    this.loadQueue();
  }

  private async loadQueue() {
    try {
      const storedQueue = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
      if (storedQueue) {
        this.queue = JSON.parse(storedQueue);
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error);
    }
  }

  private async persistQueue() {
    try {
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to persist offline queue:', error);
    }
  }

  async enqueue(action: OfflineAction) {
    this.queue.push(action);
    await this.persistQueue();
    console.log('Action enqueued:', action);
  }

  async process() {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    console.log('Processing offline queue...');

    while (this.queue.length > 0) {
      const action = this.queue[0];
      try {
        const executor = ActionExecutors[action.type];
        if (!executor) {
          throw new Error(`No executor for action type: ${String(action.type)}`);
        }

        console.log(`Executing action:`, action);
        await executor(action.payload);

        // if successful, remove from queue
        this.queue.shift();
        await this.persistQueue();
      } catch (error) {
        console.error(`Failed to execute action:`, action, error);
        // TODO: Implement retry logic or move to a failed queue
        // RN, stop processing to prevent losing actions
        break;
      }
    }

    this.isProcessing = false;
    console.log('Offline queue processing finished.');
  }
}

export const OfflineActionQueue = new ActionQueue();