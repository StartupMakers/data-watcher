const DEFAULT_INTERVAL = 10 * 1000; // One minute

/**
 * Create External List Watcher
 * @param {String} URL
 * @param {Object} [options]
 * @param {Function|Promise} [options.transform]
 * @param {Function} [options.onSuccess]
 * @param {Function} [options.onFailure]
 * @param {Object} [options.fetchOptions]
 * @param {Number} [options.refreshInterval=60000]
 * @param {Number} [options.failureTimeout=60000]
 * @param {Boolean} [options.isPaused=false]
 * @param {Boolean} [options.skipFirstRequest=false]
 */
export default class ExternalListWatcher {
  constructor(listURL, options = {}) {
    if (!Array.isArray(listURL)) {
      throw new Error('Url list must be array!');
    }
    this.state = {
      targetURLIndex: 0,
      targetURL: listURL[0],
      isPaused: options.isPaused,
      isAllFailed: false
    };
    this.options = {
      listURL: listURL,
      refreshInterval: DEFAULT_INTERVAL,
      skipFirstRequest: false,
      fetch: fetch,
      ...options
  };
    this.handleSuccess = this.handleSuccess.bind(this);
    this.handleFailure = this.handleFailure.bind(this);
    if (this.state.isPaused !== true) {
      this.start();
    }
  }

  start() {
    const { skipFirstRequest, refreshInterval } = this.options;
    this.state.isPaused = false;
    if (skipFirstRequest === true && typeof this._timer === 'undefined') {
      this._timer = setTimeout(() => this._submitRequest(), refreshInterval);
    } else {
      this._submitRequest();
    }
  }

  setNextURL() {
    const { listURL } = this.options;
    let { targetURLIndex, isAllFailed, targetURL } = this.state;
    const nextURLIndex = targetURLIndex + 1;
    if (nextURLIndex === listURL.length) {
      targetURLIndex = 0;
      isAllFailed = true;
    } else {
      targetURLIndex = nextURLIndex;
      isAllFailed = false;
    }
    targetURL = listURL[targetURLIndex];
    this.state = { ...this.state, targetURLIndex, targetURL, isAllFailed };
  }

  handleSuccess(response) {
    const { onSuccess, transform, refreshInterval } = this.options;
    const finalData = (transform && transform(response)) || response;
    if (onSuccess) {
      onSuccess(finalData);
    }
    this.refresh(refreshInterval);
  }

  handleFailure(error) {
    this.setNextURL();
    const { onFailure, defaultResult, failureTimeout } = this.options;
    const { isAllFailed } = this.state;
    const timeout = isAllFailed ? 0 : failureTimeout;
    if (defaultResult && isAllFailed) {
      this.handleSuccess(defaultResult);
    } else {
      onFailure(error);
      this.refresh(timeout);
    }
  }

  refresh(timeout) {
    const { isPaused } = this.state;
    if (!isPaused) {
      this._timer = setTimeout(() => this._submitRequest(), timeout);
    }
  }

  _submitRequest() {
    const { fetchOptions, fetch } = this.options;
    const { targetURL } = this.state;
    clearTimeout(this._timer);
    return this.lastRequest = fetch(targetURL, fetchOptions)
      .then(this.handleSuccess)
      .catch(this.handleFailure);
  }

  pause() {
    clearTimeout(this._timer);
    this.state.isPaused = true;
  }

  forceRequest() {
    this._submitRequest();
    return this.lastRequest;
  }
}
