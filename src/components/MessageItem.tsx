import { ChatMessage } from "@/types/message";
import { decodeHtmlEntities, formatMessageTime } from "@/lib/format";

interface MessageItemProps {
  message: ChatMessage;
  isSelf: boolean;
}

export function MessageItem({ message, isSelf }: MessageItemProps) {
  const formattedTime = formatMessageTime(message.createdAt);
  const cleanMessage = decodeHtmlEntities(message.message);

  if (isSelf) {
    return (
      <article
        className="self-end flex flex-col max-w-[240px] sm:max-w-[420px] bg-[#fef4c0] border border-[#f0e5a2] rounded-[3px] p-4 shadow-2xs transition-opacity"
        aria-label={`Your message sent at ${formattedTime}`}
      >
        <p className="text-sm sm:text-base text-[#3d4146] leading-relaxed break-words">
          {cleanMessage}
        </p>
        <time
          dateTime={message.createdAt}
          className="text-[11px] text-[#8c9ba5] text-right mt-2 self-end"
        >
          {formattedTime}
        </time>
      </article>
    );
  }

  return (
    <article
      className="self-start flex flex-col max-w-[240px] sm:max-w-[420px] bg-white border border-zinc-200 rounded-[3px] p-4 shadow-2xs transition-opacity"
      aria-label={`Message from ${message.author} sent at ${formattedTime}`}
    >
      <span className="text-xs text-[#8c9ba5] font-medium mb-1">
        {message.author}
      </span>
      <p className="text-sm sm:text-base text-[#3d4146] leading-relaxed break-words">
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
