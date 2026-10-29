import { differenceInDays, format, formatDistanceToNow } from "date-fns";

export function formatPostTime(date: string | Date) {
  if (differenceInDays(new Date(), date) < 7) {
    return formatDistanceToNow(date, { addSuffix: true });
  }
  return format(date, "MMM d, yyyy HH:mm");
}

export const checkIsLiked = (likeList: string[], userId: string) => {
  return likeList.includes(userId);
};
