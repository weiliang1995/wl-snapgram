import EmptyUI from "@/components/shared/EmptyUI";
import GridPostList from "@/components/shared/GridPostList";
import Loader from "@/components/shared/Loader";
import SearchResults from "@/components/shared/SearchResults";
import { Input } from "@/components/ui/input";
import useDebounce from "@/hooks/useDebounce";
import {
  useGetPosts,
  useSearchPosts,
} from "@/lib/react-query/queriesAndMutation";
import { useState, useEffect } from "react";
import { useInView } from "react-intersection-observer";

const Explore = () => {
  const { ref, inView } = useInView();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const {
    data: posts,
    isPending,
    isError,
    fetchNextPage,
    isFetchingNextPage,
    hasNextPage,
  } = useGetPosts();
  const { data: searchedPosts, isFetching: isSearchFetching } =
    useSearchPosts(debouncedSearch);

  const allPosts = posts?.pages.flatMap((page) => page.rows) ?? [];

  const isSearching = search !== "";
  const hasNoPosts = !isSearching && allPosts.length === 0;

  const isSearchPending = isSearchFetching || search !== debouncedSearch;

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage && !isSearching) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, isSearching, fetchNextPage]);
  if (isPending) {
    return (
      <div className="flex-center w-full h-full">
        <Loader />
      </div>
    );
  }
  if (isError) {
    return <EmptyUI type="error" />;
  }

  return (
    <div className="explore-container">
      <div className="explore-inner_container">
        <h2 className="h3-bold md:h2-bold w-full">Search Posts</h2>
        <div className="flex gap-1 px-4 w-full rounded-lg bg-dark-4">
          <img
            src="/assets/icons/search.svg"
            width={24}
            height={24}
            alt="search"
          />
          <Input
            type="text"
            placeholder="Search"
            className="explore-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      <div className="flex-between w-full max-w-5xl mt-16 mb-7">
        <h3 className="body-bold md:h3-bold">Popular Today</h3>
        <div className="flex-center gap-3 bg-dark-3 rounded-xl px-4 py-2 cursor-pointer">
          <p className="small-medium md:base-medium text-light-2">All</p>
          <img
            src="/assets/icons/filter.svg"
            width={20}
            height={20}
            alt="filter"
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-9 w-full max-w-5xl">
        {isSearching ? (
          <SearchResults
            isFetching={isSearchPending}
            posts={searchedPosts?.rows ?? []}
          />
        ) : hasNoPosts ? (
          <p className="text-light-4 mt-10 text-center w-full">No posts yet</p>
        ) : (
          <GridPostList posts={allPosts} />
        )}
      </div>
      {hasNextPage && !search && (
        <div ref={ref} className="mt-10">
          <Loader />
        </div>
      )}
    </div>
  );
};

export default Explore;
