// Generated by CoffeeScript 1.4.0
(function() {
  var __slice = [].slice,
    __hasProp = {}.hasOwnProperty;

  Em.QueryLocation = Em.HistoryLocation.extend({
    initState: function() {
      var location, state;
      location = this.get('location');
      state = location.pathname + location.search;
      this.replaceState(state);
      return this.set('history', window.history);
    },
    queryString: function(url) {
      return url.split("?")[1] || "";
    },
    queryHash: function() {
      var url;
      url = this.newURL || this.get('location.search');
      return $.deparam(this.queryString(url));
    },
    willChangeURL: function(url) {
      return this.newURL = url;
    },
    alreadyHasParams: function(params) {
      return this.toQueryString(this.queryHash()) === this.toQueryString(params);
    },
    toQueryString: function(params) {
      return $.param(params).replace(/%5B/g, "[").replace(/%5D/g, "]");
    },
    setURL: function(url) {
      this._super(url);
      return this.newURL = void 0;
    },
    replaceURL: function(url) {
      this._super(url);
      return this.newURL = void 0;
    },
    replaceQueryParams: function(params) {
      return this.doUpdateQueryParams(params, this.replaceURL.bind(this));
    },
    setQueryParams: function(params) {
      return this.doUpdateQueryParams(params, this.setURL.bind(this));
    },
    doUpdateQueryParams: function(params, callback) {
      var newPath, query;
      newPath = this.get('location.pathname');
      query = this.toQueryString(params);
      if (!Em.isEmpty(query)) {
        newPath += "?" + query;
      }
      return callback(newPath);
    }
  });

  Em.Location.registerImplementation('query', Em.QueryLocation);

  Em.ControllerMixin.reopen({
    transitionParams: function(newParams) {
      return this.get('target').transitionParams(newParams);
    },
    transitionToRouteWithParams: function() {
      var args, _ref;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return (_ref = this.get('target')).transitionToRouteWithParams.apply(_ref, args);
    },
    transitionAllParams: function() {
      var args, _ref;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return (_ref = this.get('target')).transitionAllParams.apply(_ref, args);
    },
    replaceQueryParams: function() {
      var args, _ref;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return (_ref = this.get('target')).replaceQueryParams.apply(_ref, args);
    },
    currentParams: function() {
      return this.container.lookup('router:main').paramsFromRoutes();
    },
    init: function() {
      var args, param, _i, _len, _ref, _results,
        _this = this;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      this._super.apply(this, args);
      if (this.observeParams != null) {
        _ref = this.observeParams;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          param = _ref[_i];
          _results.push(this.addObserver(param, function() {
            return Em.run.once(function() {
              return _this.container.lookup('router:main').serializeParams();
            });
          }));
        }
        return _results;
      }
    }
  });

  Em.Router.reopen({
    hijackUpdateUrlParams: null,
    startRouting: function() {
      var defaultUpdateURL,
        _this = this;
      this._super();
      defaultUpdateURL = this.router.updateURL;
      return this.router.updateURL = function(url) {
        var qs;
        if (_this.hijackUpdateUrlParams != null) {
          qs = _this.location.toQueryString(_this.hijackUpdateUrlParams);
          if (!Em.isEmpty(qs)) {
            url += "?" + qs;
          }
          _this.hijackUpdateUrlParams = null;
        }
        defaultUpdateURL(url);
        return _this.location.willChangeURL(url);
      };
    },
    didTransition: function(infos) {
      var _this = this;
      this._super(infos);
      if (infos.someProperty('handler.redirected')) {
        return;
      }
      return Em.run.next(function() {
        return _this.replaceQueryParams(_this.paramsFromRoutes());
      });
    },
    currentRoute: function() {
      return this.router.currentHandlerInfos.get('lastObject').handler;
    },
    queryParams: function() {
      return this.get('location').queryHash();
    },
    transitionParams: function(newParams) {
      var key, params, value;
      params = this.location.queryHash();
      for (key in newParams) {
        if (!__hasProp.call(newParams, key)) continue;
        value = newParams[key];
        if (value != null) {
          params[key] = value;
        } else {
          delete params[key];
        }
      }
      return this.transitionAllParams(params);
    },
    transitionAllParams: function(params) {
      var controller, model,
        _this = this;
      if (this.router.isLoading) {
        return;
      }
      if (this.location.alreadyHasParams(params)) {
        return;
      }
      this.location.setQueryParams(params);
      if (this.get('namespace').LOG_TRANSITIONS) {
        Em.Logger.log('Transitioned query params', params);
      }
      this.router.currentHandlerInfos.forEach(function(info) {
        return info.handler.deserializeParams(params, info.handler.defaultController());
      });
      controller = this.currentRoute().defaultController();
      model = this.currentRoute().currentModel;
      this.currentRoute().setupController(controller, model, params);
      return this.notifyPropertyChange('url');
    },
    replaceQueryParams: function(params) {
      return this.location.replaceQueryParams(params);
    },
    transitionToRouteWithParams: function() {
      var args, name, _ref;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      name = args[0];
      if (!this.router.hasRoute(name)) {
        name = args[0] = args[0] + '.index';
      }
      this.hijackUpdateUrlParams = args.pop();
      this.replaceQueryParams(this.hijackUpdateUrlParams);
      Ember.assert("The route " + name + " was not found", this.router.hasRoute(name));
      (_ref = this.router).transitionTo.apply(_ref, args);
      return this.notifyPropertyChange('url');
    },
    isLoaded: function() {
      return this.router.currentHandlerInfos != null;
    },
    serializeParams: function() {
      if (!this.isLoaded()) {
        return;
      }
      return this.transitionAllParams(this.paramsFromRoutes());
    },
    paramsFromRoutes: function() {
      var params;
      params = {};
      this.router.currentHandlerInfos.forEach(function(info) {
        var handler, newParams;
        handler = info.handler;
        newParams = handler.serializeParams(handler.defaultController());
        return Em.merge(params, newParams);
      });
      return params;
    }
  });

  Em.Route.reopen({
    deserializeParams: Em.K,
    serializeParams: function() {
      return {};
    },
    queryParams: function() {
      return this.get('router').queryParams();
    },
    transitionParams: function(newParams) {
      if (this._checkingRedirect) {
        this.redirected = true;
      }
      return this.get('router').transitionParams(newParams);
    },
    transitionToRouteWithParams: function() {
      var args, _ref;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      if (this._checkingRedirect) {
        this.redirected = true;
      }
      return (_ref = this.get('router')).transitionToRouteWithParams.apply(_ref, args);
    },
    replaceQueryParams: function(params) {
      if (this._checkingRedirect) {
        this.redirected = true;
      }
      return this.get('router').replaceQueryParams(params);
    },
    defaultController: function() {
      return this.controllerFor(this.routeName);
    },
    deserialize: function(params) {
      var model, query;
      query = this.queryParams();
      model = this.model(params, query);
      this.deserializeParams(query, this.defaultController());
      return this.currentModel = model;
    },
    setup: function(context) {
      var controller;
      this.redirected = false;
      this._checkingRedirect = true;
      this.redirect(context);
      this._checkingRedirect = false;
      if (this.redirected) {
        return false;
      }
      controller = this.controllerFor(this.routeName, context);
      if (controller) {
        this.controller = controller;
        controller.set("model", context);
      }
      if (this.setupControllers) {
        Ember.deprecate("Ember.Route.setupControllers is deprecated. Please use Ember.Route.setupController(controller, model) instead.");
        this.setupControllers(controller, context, this.queryParams());
      } else {
        this.setupController(controller, context, this.queryParams());
      }
      if (this.renderTemplates) {
        Ember.deprecate("Ember.Route.renderTemplates is deprecated. Please use Ember.Route.renderTemplate(controller, model) instead.");
        return this.renderTemplates(context);
      } else {
        return this.renderTemplate(controller, context);
      }
    }
  });

}).call(this);
