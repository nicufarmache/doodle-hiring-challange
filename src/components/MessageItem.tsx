import { OptimisticChatMessage } from "@/types/message";
import { decodeHtmlEntities, formatMessageTime } from "@/lib/format";

interface MessageItemProps {
  message: OptimisticChatMessage;
  isSelf: boolean;
  onRetry?: (id: string) => void;
  onDismiss?: (id: string) => void;
}

export function MessageItem({
  message,
  isSelf,
  onRetry,
  onDismiss,
}: MessageItemProps) {
  const formattedTime = formatMessageTime(message.createdAt);
  const cleanMessage = decodeHtmlEntities(message.message);
  const isSending = message.status === "sending";
  const isFailed = message.status === "failed";

  if (isSelf) {
    return (
      <article
        className={`self-end flex flex-col max-w-[240px] sm:max-w-[420px] rounded-[3px] p-4 shadow-2xs transition-all ${
          isFailed
            ? "bg-red-50/70 border border-red-300"
            : "bg-[#fef4c0] border border-[#f0e5a2]"
        } ${isSending ? "opacity-70" : "opacity-100"}`}
        aria-label={
          isSending
            ? "Your message, sending..."
            : isFailed
            ? "Your message failed to send"
            : `Your message sent at ${formattedTime}`
        }
      >
        <p className="text-sm sm:text-base text-[#3d4146] leading-relaxed break-words whitespace-pre-wrap">
          {cleanMessage}
        </p>

        {isSending && (
          <div className="flex items-center gap-1.5 self-end mt-2 text-[11px] text-[#8c9ba5]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#8c9ba5] animate-pulse" />
            <span>Sending...</span>
          </div>
        )}

        {isFailed && (
          <div className="flex items-center gap-2 self-end mt-2 text-[11px] text-red-600">
            <span>Not delivered</span>
            {onRetry && (
              <button
                type="button"
                onClick={() => onRetry(message._id)}
                className="font-medium underline hover:text-red-800 cursor-pointer"
              >
                Retry
              </button>
            )}
            {onDismiss && (
              <button
                type="button"
                onClick={() => onDismiss(message._id)}
                className="text-red-400 hover:text-red-700 cursor-pointer text-xs px-0.5"
                aria-label="Dismiss failed message"
              >
                ✕
              </button>
            )}
          </div>
        )}

        {!isSending && !isFailed && (
          <time
            dateTime={message.createdAt}
            className="text-[11px] text-[#8c9ba5] text-right mt-2 self-end"
          >
            {formattedTime}
          </time>
        )}
      </article>
    );
  }

  return (
    <article
      className="self-start flex flex-col max-w-[240px] sm:max-w-[420px] bg-white border border-zinc-200 rounded-[3px] p-4 shadow-2xs transition-opacity"
      aria-label={`Message from ${message.author} sent at ${formattedTime}`}
    >
      <span className="text-xs text-[#8c9ba5] font-medium mb-1 truncate block">
        {message.author}
      </span>
      <p className="text-sm sm:text-base text-[#3d4146] leading-relaxed break-words whitespace-pre-wrap">
        {cleanMessage}
      </p>
      <time
        dateTime={message.createdAt}
        className="text-[11px] text-[#8c9ba5] mt-2"
      >
        {formattedTime}
      </time>
    </article>
  );
}
