// After https://github.com/atom/autocomplete-snippets/blob/master/lib/autocomplete-snippets.js
module.exports = {

  provider: null,

  activate() {},

  deactivate() {
    this.provider = null;
  },

  provide() {
    if (this.provider == null) {
      const BetterGenericProvider = require('./autocomplete-better-generic-provider');
      this.provider = new BetterGenericProvider();
    }

    return this.provider;
  }
}
