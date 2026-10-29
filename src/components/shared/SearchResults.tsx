import EmptyUI from "@/components/shared/EmptyUI";
import GridPostList from "@/components/shared/GridPostList";
import Loader from "@/components/shared/Loader";
import type { IPost } from "@/types";

type Props = {
  isFetching: boolean;
  posts: IPost[];
};
const SearchResults = ({ isFetching, posts }: Props) => {
  if (isFetching) {
    return <Loader />;
  }

  if (posts.length === 0) {
    return <EmptyUI type="empty" />;
  }
  return <GridPostList posts={posts} />;
};

export default SearchResults;
