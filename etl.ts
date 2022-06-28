import _ from 'underscore';


type RetryOptions = {
  maxRetries: number,
  timeout?: number
}

async function asyncRetry<T>(
    f: () => Promise<T>, 
    options: RetryOptions
  ): Promise<T | undefined> {
    let retryIndex = 1;
  
    while (1) {
      try {
        return await f();
      } catch (err) {
        console.error(err);
        retryIndex++;

        if (retryIndex > options.maxRetries) {
          throw err;
        }
      }
    }
      
  }


interface AsyncJob {
  exec (): Promise<any>;
}


class AsyncIndependentJob implements AsyncJob {
  f: () => Promise<any>
  retryOptions: RetryOptions

  constructor (
    f: () => Promise<any>, 
    retryOptions: RetryOptions
  ) {
    this.f = f;
    this.retryOptions = retryOptions;
  }

  async exec (): Promise<any> {
    return await asyncRetry(this.f, this.retryOptions);
  }
}


type chordFunc = (depsResults: any[]) => Promise<any>


class AsyncChordJob implements AsyncJob {
  f: chordFunc
  deps: AsyncJob[]
  retryOptions: RetryOptions

  constructor (
    f: chordFunc, 
    deps: AsyncJob[],
    retryOptions: RetryOptions
  ) {
    this.f = f;
    this.deps = deps;
    this.retryOptions = retryOptions;
  }

  async exec (): Promise<any> {
    const depsResults: Promise<any>[] = [];

    for (let job of this.deps) {
      depsResults.push(
        await job.exec()
      );
    }
    await asyncRetry(_.partial(this.f, depsResults), this.retryOptions);
  }
}

export {AsyncJob, AsyncIndependentJob, AsyncChordJob, RetryOptions};
