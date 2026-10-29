import { toast } from "@/components/ui/toast";
import { TOAST_TYPE } from "@/constants/toast";
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import React from "react";

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: () => {
      toast.add({
        type: TOAST_TYPE.ERROR,
        title: "Something went wrong",
        description: "Please try again later.",
      });
    },
  }),
});

const QueryProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

export default QueryProvider;
