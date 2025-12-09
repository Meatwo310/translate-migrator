"use client";

import {useState, useMemo, useCallback} from "react";

type StatusMessage = {
  uuid: string;
  content: string;
  spinner?: boolean;
};

const defaultStatusMessage = {
  uuid: "b3332455-b003-40fd-ba97-ce358099bf1d",
  content: "Loading Monaco",
  spinner: true,
};

export const useStatusManager = (isLoading: boolean) => {
  const [statusMessages, setStatusMessages] = useState<StatusMessage[]>([]);

  const pushStatusMessage = useCallback((content: string, spinner?: boolean) => {
    const uuid = self.crypto.randomUUID();
    const message = {content, spinner, uuid};
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

  const statusMessage = useMemo(() => {
    const messagesToShow = isLoading ? [defaultStatusMessage] : statusMessages;

    return messagesToShow.map((message) => (
      <span
        key={message.uuid}
        className={message.spinner ? "cli-spinner" : undefined}
        style={{ marginRight: "0.5em" }}
      >
        {message.content}
      </span>
    ));
  }, [isLoading, statusMessages]);

  return {
    pushStatusMessage,
    removeStatusMessage,
    statusMessage,
  };
};
