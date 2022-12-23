const queue: any[] = [];
const p = Promise.resolve();

let isFlushPending = false;

export function nextTick(fn) {
  return fn ? p.then(fn) : p;
}

/* 创造 一个队列 */
export function queueJobs(job) {
  if (!queue.includes(job)) {
    queue.push(job);
  }
  queueFlush();
}
/* 同步变成异步 
   微任务的时候执行job()
*/
function queueFlush() {
  if (isFlushPending) return;

  isFlushPending = true;
  nextTick(flushJobs);
}
function flushJobs() {
  isFlushPending = false;
  let job;
  while ((job = queue.shift())) {
    job && job();
  }
}
