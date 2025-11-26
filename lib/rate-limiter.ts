/**
 * 客户端速率限制器
 * 
 * 简单的客户端速率限制实现，防止用户过于频繁地提交请求
 * 注意：这是客户端限制，不能替代服务端速率限制
 */

interface RateLimitConfig {
  minInterval: number; // 最小请求间隔（毫秒）
  maxRequests: number; // 时间窗口内最大请求数
  windowMs: number; // 时间窗口大小（毫秒）
}

class RateLimiter {
  private lastRequest: number = 0;
  private requestTimestamps: number[] = [];
  private config: RateLimitConfig;

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = {
      minInterval: config.minInterval ?? 2000, // 默认2秒
      maxRequests: config.maxRequests ?? 10, // 默认10次
      windowMs: config.windowMs ?? 60000, // 默认1分钟
    };
  }

  /**
   * 检查是否可以发起新请求
   * 
   * @returns 如果可以发起请求返回true，否则返回false
   */
  canMakeRequest(): boolean {
    const now = Date.now();

    // 检查最小间隔限制
    if (now - this.lastRequest < this.config.minInterval) {
      return false;
    }

    // 清理过期的时间戳
    this.requestTimestamps = this.requestTimestamps.filter(
      (timestamp) => now - timestamp < this.config.windowMs
    );

    // 检查时间窗口内的请求数
    if (this.requestTimestamps.length >= this.config.maxRequests) {
      return false;
    }

    return true;
  }

  /**
   * 记录一次请求
   * 
   * 应该在成功发起请求后调用
   */
  recordRequest(): void {
    const now = Date.now();
    this.lastRequest = now;
    this.requestTimestamps.push(now);
  }

  /**
   * 获取距离下次可以请求的剩余时间（毫秒）
   * 
   * @returns 剩余等待时间，如果可以立即请求则返回0
   */
  getTimeUntilNextRequest(): number {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequest;

    if (timeSinceLastRequest < this.config.minInterval) {
      return this.config.minInterval - timeSinceLastRequest;
    }

    // 清理过期的时间戳
    this.requestTimestamps = this.requestTimestamps.filter(
      (timestamp) => now - timestamp < this.config.windowMs
    );

    // 如果达到窗口限制，返回最早请求过期的时间
    if (this.requestTimestamps.length >= this.config.maxRequests) {
      const oldestTimestamp = this.requestTimestamps[0];
      return this.config.windowMs - (now - oldestTimestamp);
    }

    return 0;
  }

  /**
   * 重置速率限制器
   */
  reset(): void {
    this.lastRequest = 0;
    this.requestTimestamps = [];
  }
}

// 导出单例实例用于评估API
export const evaluationRateLimiter = new RateLimiter({
  minInterval: 2000, // 最少2秒间隔
  maxRequests: 10, // 1分钟内最多10次请求
  windowMs: 60000, // 1分钟窗口
});

export default RateLimiter;
