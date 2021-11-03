export enum CONNECTION_TARGET {
  BROWSER_WINDOW = 'browserWindow',
  WEBVIEW = 'webview',
}
// get connection id by target type and id
export const getConnectionId = (target: CONNECTION_TARGET, id: string) =>
  `connection_id_${target}_${id}`;

// get channel id by channelName and connectionId
// this is used for main process to call others by connection.getChannel(ipcChannelName)
export const getIpcChannelName = (options: {
  connectionId?: string;
  target: CONNECTION_TARGET;
  targetId?: string;
}) => {
  const { targetId, target, connectionId } = options;
  const _connectionId = connectionId || getConnectionId(target, targetId || '');
  return `${target}_ipc_channel_${_connectionId}`;
};
