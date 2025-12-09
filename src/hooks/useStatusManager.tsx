"use client";

import {useCallback, useMemo, useState} from "react";

export type StatusMessage = {
  uuid: string;
  content: string;
  spinner?: boolean;
};

const defaultStatusMessage: StatusMessage = {
  uuid: "b3332455-b003-40fd-ba97-ce358099bf1d",
  content: "Loading Monaco",
  spinner: true,
};

export const useStatusManager = (isLoading: boolean) => {
  const [statusMessages, setStatusMessages] = useState<StatusMessage[]>([]);

  const pushStatusMessage = useCallback((content: string, spinner?: boolean) => {
    const uuid = crypto.randomUUID();
    const message: StatusMessage = {
      uuid,
      content,
      spinner,
    };
    setStatusMessages((prev) => [...prev, message]);
    return uuid;
  }, []);

  const removeStatusMessage = useCallback((uuid: string) => {
    setStatusMessages((prev) => {
      return prev.filter((msg) => msg.uuid !== uuid);
    });
  }, []);

  const activeMessages = useMemo(() => {
    return isLoading ? [defaultStatusMessage] : statusMessages;
  }, [isLoading, statusMessages]);

  return {
    pushStatusMessage,
    removeStatusMessage,
    activeMessages,
  };
};
