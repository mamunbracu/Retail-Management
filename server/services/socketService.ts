let ioInstance: any = null;

export const setIoInstance = (io: any) => {
  ioInstance = io;
};

export const getIoInstance = () => {
  return ioInstance;
};

export const emitToAll = (event: string, data: any) => {
  if (ioInstance) {
    ioInstance.emit(event, data);
  }
};
