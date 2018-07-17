const uuid = require('uuid/v1');
const simpleClient = require('../simpleClient/simpleClient');

const startService = ({
  alert,
  name,
  monitorHost,
  monitorIntervalMs,
  downstreamMonitorHost,
  downstreamMonitorHostDisableHTTPS,
  downstreamMonitorByInterval,
}) => {
  name = name || `monitor-${uuid()}`;

  const isExpectingDownstreamMonitoring = !!downstreamMonitorHost;
  let downstreamMonitorExpectationTimeout = null;

  let monitorIntervalHandle = null;
  if (!!monitorHost) {
    const client = simpleClient({
      host: monitorHost,
      disableHTTPS: !!downstreamMonitorHostDisableHTTPS,
    });

    monitorIntervalHandle = setInterval(async () => {
      try {
        const a = await client.dispatch({
          type: 'monitorRequest',
        });
        if (!a.ok) {
          alert.actions.alert({ message: `Host ${monitorHost} may be down!` });
        }
      } catch (e) {
        alert.actions.alert({ message: `Host ${monitorHost} may be down!` });
      }
    }, monitorIntervalMs || 10000);
  }

  const actions = {
    monitorRequest: async () => {
      console.log('recieved monitor request!');
      if (isExpectingDownstreamMonitoring) {
        clearTimeout(downstreamMonitorExpectationTimeout);
        downstreamMonitorExpectationTimeout = setTimeout(() => {
          alert.actions.alert({
            message: 'Expected to be monitored by ' + downstreamMonitorHost,
          });
        }, downstreamMonitorByInterval || 30000);
      }
      return {
        ok: true,
      };
    },
  };

  return {
    actions,
    remove: () => {
      clearInterval(monitorIntervalHandle);
    },
    name,
  };
};

module.exports = { startService };
