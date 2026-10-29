import Loader from "@/components/shared/Loader";
import PostCard from "@/components/shared/PostCard";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { useGetRecentPosts } from "@/lib/react-query/queriesAndMutation";
import { ImageOffIcon, TriangleAlertIcon } from "lucide-react";

const Home = () => {
  const {
    data: posts,
    isPending: isPostLoading,
    isError: isErrorPosts,
    isRefetching,
    refetch,
  } = useGetRecentPosts();

  const renderContent = () => {
    if (isPostLoading) return <Loader />;

    // 错误提示由 QueryProvider 统一弹 toast，这里只负责页面上的错误状态
    if (isErrorPosts) {
      return (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <TriangleAlertIcon />
            </EmptyMedia>
            <EmptyTitle>Failed to load posts</EmptyTitle>
            <EmptyDescription>Please check your connection.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => refetch()} disabled={isRefetching}>
              {isRefetching ? "Retrying..." : "Retry"}
            </Button>
          </EmptyContent>
        </Empty>
      );
    }

    if (!posts.rows.length) {
      return (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ImageOffIcon />
            </EmptyMedia>
            <EmptyTitle>No posts yet</EmptyTitle>
            <EmptyDescription>Be the first to share something!</EmptyDescription>
          </EmptyHeader>
        </Empty>
      );
    }

    return (
      <ul className="flex flex-col flex-1 gap-9 w-full">
        {posts.rows.map((post) => (
          <PostCard post={post} key={post.$id} />
        ))}
      </ul>
    );
  };

  return (
    <div className="flex flex-1">
      <div className="home-container">
        <div className="home-posts">
          <h2 className="h3-bold md:h2-bold text-left w-full">Home Feed</h2>
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Home;
