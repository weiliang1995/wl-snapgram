import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { ImageOffIcon, TriangleAlertIcon } from "lucide-react";

type Props = {
  type: "error" | "empty";
};

const EmptyUI = ({ type }: Props) => {
  let emptyTitle;
  let emptyDescription;

  switch (type) {
    case "error":
      emptyTitle = "Failed to load posts";
      emptyDescription = "Please check your connection.";
      break;
    case "empty":
      emptyTitle = "No posts yet";
      emptyDescription = "Be the first to share something!";
      break;
  }

  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          {type === "error" ? <TriangleAlertIcon /> : <ImageOffIcon />}
        </EmptyMedia>
        <EmptyTitle>{emptyTitle}</EmptyTitle>
        <EmptyDescription>{emptyDescription}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
};

export default EmptyUI;
