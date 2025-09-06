import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/hooks/use-realtime-chat";
import { Check, CheckCheck } from "lucide-react";

interface ChatMessageItemProps {
  message: ChatMessage & { readAt?: Date | null };
  isOwnMessage: boolean;
  showHeader: boolean;
}

export const ChatMessageItem = ({
  message,
  isOwnMessage,
  showHeader,
}: ChatMessageItemProps) => {
  const messageRead = isOwnMessage && !!message.readAt;
  const messageSent = isOwnMessage && !message.readAt;

  return (
    <div
      className={`flex mt-2 ${isOwnMessage ? "justify-end" : "justify-start"}`}
    >
      <div
        className={cn("max-w-[75%] w-fit flex flex-col gap-1", {
          "items-end": isOwnMessage,
        })}
      >
        {showHeader && (
          <div
            className={cn("flex items-center gap-2 text-xs px-3", {
              "justify-end flex-row-reverse": isOwnMessage,
            })}
          >
            <span className={"font-medium"}>{message.user.name}</span>
            <span className="flex items-center gap-1 text-foreground/60 text-xs">
              {new Date(message.createdAt).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })}
              {isOwnMessage &&
                (messageRead ? (
                  <CheckCheck className="h-3.5 w-3.5 text-blue-500" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                ))}
            </span>
          </div>
        )}
        <div
          className={cn(
            "py-2 px-3 rounded-xl text-sm w-fit",
            isOwnMessage
              ? "bg-primary text-primary-foreground [&>*]:text-primary-foreground"
              : "bg-muted text-muted-foreground [&>*]:text-muted-foreground",
            !showHeader ? (isOwnMessage ? "mr-3" : "ml-3") : ""
          )}
        >
          <p className="whitespace-pre-wrap break-words [&]:text-inherit">
            {message.content}
          </p>
        </div>
        {!showHeader && (
          <span className="flex items-center justify-end gap-1 text-foreground/60 text-xs px-1">
            {new Date(message.createdAt).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })}
            {isOwnMessage &&
              (messageRead ? (
                <CheckCheck className="h-3.5 w-3.5 text-blue-500" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              ))}
          </span>
        )}
      </div>
    </div>
  );
};
