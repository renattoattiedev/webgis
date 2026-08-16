import process from 'process';

if (typeof window !== 'undefined') {
  const globalWindow = window as unknown as Record<string, any>;

  if (!globalWindow['process']) {
    globalWindow['process'] = process;
  }

  if (!globalWindow['global']) {
    globalWindow['global'] = globalWindow;
  }
}
