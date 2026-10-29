export const parseTags = (tags = "") => [
  ...new Set(
    tags
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean),
  ),
];
