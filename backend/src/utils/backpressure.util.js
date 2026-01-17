class BackpressureManager {
  constructor() {
    this.queue = [];
    this.processing = 0;
    this.maxQueue = 100;
    this.maxConcurrent = 10;
    this.circuitOpen = false;
    this.failures = 0;
    this.maxFailures = 5;
  }

  async process(task) {
    if (this.circuitOpen) {
      throw new Error('Circuit breaker open - system overloaded');
    }

    if (this.queue.length >= this.maxQueue) {
      throw new Error('Queue full - request rejected');
    }

    if (this.processing >= this.maxConcurrent) {
      return new Promise((resolve, reject) => {
        this.queue.push({ task, resolve, reject });
      });
    }

    return this.execute(task);
  }

  async execute(task) {
    this.processing++;
    try {
      const result = await task();
      this.failures = 0;
      return result;
    } catch (error) {
      this.failures++;
      if (this.failures >= this.maxFailures) {
        this.circuitOpen = true;
        setTimeout(() => { this.circuitOpen = false; this.failures = 0; }, 30000);
      }
      throw error;
    } finally {
      this.processing--;
      this.processNext();
    }
  }

  processNext() {
    if (this.queue.length > 0 && this.processing < this.maxConcurrent) {
      const { task, resolve, reject } = this.queue.shift();
      this.execute(task).then(resolve).catch(reject);
    }
  }

  getStats() {
    return {
      queueSize: this.queue.length,
      processing: this.processing,
      circuitOpen: this.circuitOpen
    };
  }
}

export const backpressureManager = new BackpressureManager();