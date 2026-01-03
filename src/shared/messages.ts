export type MessageMap = {
  ping: { time: number };
};

export type MessageType = keyof MessageMap;

export type Message<T extends MessageType> = {
  type: T;
  payload: MessageMap[T];
};
