/**
 * Logger Tests
 */

import { logger } from '@/lib/logger';

describe('Logger', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleInfoSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleInfoSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('debug', () => {
    it('should log debug messages', () => {
      logger.debug('Test debug message', { data: 'test' });
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('info', () => {
    it('should log info messages', () => {
      logger.info('Test info message');
      expect(consoleInfoSpy).toHaveBeenCalled();
    });
  });

  describe('warn', () => {
    it('should log warning messages', () => {
      logger.warn('Test warning');
      expect(consoleWarnSpy).toHaveBeenCalled();
    });
  });

  describe('error', () => {
    it('should log error messages', () => {
      logger.error('Test error', new Error('Test'));
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('startTimer', () => {
    it('should track operation duration', () => {
      const timer = logger.startTimer();
      timer.done({ message: 'Test operation completed' });
      
      expect(consoleInfoSpy).toHaveBeenCalled();
    });
  });

  describe('request', () => {
    it('should log HTTP requests', () => {
      logger.request('GET', '/api/test');
      expect(consoleInfoSpy).toHaveBeenCalled();
    });
  });

  describe('response', () => {
    it('should log HTTP responses', () => {
      logger.response('GET', '/api/test', 200, 150);
      expect(consoleInfoSpy).toHaveBeenCalled();
    });
  });

  describe('integration', () => {
    it('should log integration calls', () => {
      logger.integration('firebase', 'getUsers', { count: 10 });
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });
});
