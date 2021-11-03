export type IMessage = {
  msgId: number;
  resolve: (value: unknown) => void;
  reject: (reason?: any) => void;
};
