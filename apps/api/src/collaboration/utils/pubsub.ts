import { EventEmitter } from 'events';

export class PubSub {
  private eventEmitter = new EventEmitter();

  publish(triggerName: string, payload: any): boolean {
    this.eventEmitter.emit(triggerName, payload);
    return true;
  }

  subscribe(triggerName: string, onMessage: (payload: any) => void): number {
    this.eventEmitter.on(triggerName, onMessage);
    return Date.now(); // Simple subscription ID
  }

  unsubscribe(_subId: number): void {
    // Simple implementation - in real app you'd track subscriptions properly
    this.eventEmitter.removeAllListeners();
  }

  asyncIterator(triggers: string | string[]): AsyncIterable<any> {
    const triggerArray = Array.isArray(triggers) ? triggers : [triggers];
    const eventEmitter = this.eventEmitter;

    return {
      [Symbol.asyncIterator](): AsyncIterator<any> {
        return {
          async next(): Promise<IteratorResult<any>> {
            return new Promise(resolve => {
              const handler = (payload: any) => {
                resolve({ value: payload, done: false });
              };

              triggerArray.forEach(trigger => {
                eventEmitter.once(trigger, handler);
              });
            });
          },
          async return(): Promise<IteratorResult<any>> {
            return { value: undefined, done: true };
          },
          async throw(error: any): Promise<IteratorResult<any>> {
            throw error;
          },
        };
      },
    };
  }
}
