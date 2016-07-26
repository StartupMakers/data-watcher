'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DEFAULT_INTERVAL = 10 * 1000; // One minute

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

var ExternalListWatcher = function () {
  function ExternalListWatcher(listURL) {
    var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    _classCallCheck(this, ExternalListWatcher);

    if (!Array.isArray(listURL)) {
      throw new Error('Url list must be array!');
    }
    this.state = {
      targetURLIndex: 0,
      targetURL: listURL[0],
      isPaused: options.isPaused,
      isAllFailed: false
    };
    this.options = _extends({
      listURL: listURL,
      refreshInterval: DEFAULT_INTERVAL,
      skipFirstRequest: false,
      fetch: fetch
    }, options);
    this.handleSuccess = this.handleSuccess.bind(this);
    this.handleFailure = this.handleFailure.bind(this);
    if (this.state.isPaused !== true) {
      this.start();
    }
  }

  _createClass(ExternalListWatcher, [{
    key: 'start',
    value: function start() {
      var _this = this;

      var _options = this.options;
      var skipFirstRequest = _options.skipFirstRequest;
      var refreshInterval = _options.refreshInterval;

      this.state.isPaused = false;
      if (skipFirstRequest === true && typeof this._timer === 'undefined') {
        this._timer = setTimeout(function () {
          return _this._submitRequest();
        }, refreshInterval);
      } else {
        this._submitRequest();
      }
    }
  }, {
    key: 'setNextURL',
    value: function setNextURL() {
      var listURL = this.options.listURL;
      var _state = this.state;
      var targetURLIndex = _state.targetURLIndex;
      var isAllFailed = _state.isAllFailed;
      var targetURL = _state.targetURL;

      var nextURLIndex = targetURLIndex + 1;
      if (nextURLIndex === listURL.length) {
        targetURLIndex = 0;
        isAllFailed = true;
      } else {
        targetURLIndex = nextURLIndex;
        isAllFailed = false;
      }
      targetURL = listURL[targetURLIndex];
      this.state = _extends({}, this.state, { targetURLIndex: targetURLIndex, targetURL: targetURL, isAllFailed: isAllFailed });
    }
  }, {
    key: 'handleSuccess',
    value: function handleSuccess(response) {
      var _options2 = this.options;
      var onSuccess = _options2.onSuccess;
      var transform = _options2.transform;
      var refreshInterval = _options2.refreshInterval;

      var finalData = transform && transform(response) || response;
      if (onSuccess) {
        onSuccess(finalData);
      }
      this.refresh(refreshInterval);
    }
  }, {
    key: 'handleFailure',
    value: function handleFailure(error) {
      this.setNextURL();
      var _options3 = this.options;
      var onFailure = _options3.onFailure;
      var defaultResult = _options3.defaultResult;
      var failureTimeout = _options3.failureTimeout;
      var isAllFailed = this.state.isAllFailed;

      var timeout = isAllFailed ? 0 : failureTimeout;
      if (defaultResult && isAllFailed) {
        this.handleSuccess(defaultResult);
      } else {
        onFailure(error);
        this.refresh(timeout);
      }
    }
  }, {
    key: 'refresh',
    value: function refresh(timeout) {
      var _this2 = this;

      var isPaused = this.state.isPaused;

      if (!isPaused) {
        this._timer = setTimeout(function () {
          return _this2._submitRequest();
        }, timeout);
      }
    }
  }, {
    key: '_submitRequest',
    value: function _submitRequest() {
      var _options4 = this.options;
      var fetchOptions = _options4.fetchOptions;
      var fetch = _options4.fetch;
      var targetURL = this.state.targetURL;

      clearTimeout(this._timer);
      return this.lastRequest = fetch(targetURL, fetchOptions).then(this.handleSuccess).catch(this.handleFailure);
    }
  }, {
    key: 'pause',
    value: function pause() {
      clearTimeout(this._timer);
      this.state.isPaused = true;
    }
  }, {
    key: 'forceRequest',
    value: function forceRequest() {
      this._submitRequest();
      return this.lastRequest;
    }
  }]);

  return ExternalListWatcher;
}();

exports.default = ExternalListWatcher;