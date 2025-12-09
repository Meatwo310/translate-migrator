"use client";

import {useCallback, useMemo, useState} from "react";
import {randomUUID, UUID} from "node:crypto";

export type StatusMessage = {
  uuid: UUID;
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
    const message: StatusMessage = {
      uuid: randomUUID(),
      content,
      spinner,
    };
    setStatusMessages((prev) => [...prev, message]);

    return message;
  }, []);

  const removeStatusMessage = useCallback((toPop: StatusMessage | string) => {
    setStatusMessages((prev) => {
      if (typeof toPop === "string") {
        return prev.filter((msg) => msg.content !== toPop);
      }
      return prev.filter((msg) => msg.uuid !== toPop.uuid);
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
