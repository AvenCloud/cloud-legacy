module.exports = {
  modify(config, { target, dev }, webpack) {
    const appConfig = config;
    appConfig.performance = { hints: false };
    return appConfig;
  },
};
