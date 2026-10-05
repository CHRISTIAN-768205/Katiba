/**
 * Every article/section/case links into the same ArticleDetail page, but via a different
 * base path depending on its law source, purely for URL readability:
 *   - Constitution entries -> /constitution/:chapter/:article (matches the Constitution browser)
 *   - Everything else (Acts, Case Law, Procedure Guide) -> /law/:chapter/:article
 * lawSource is always included as a query param so ArticleDetail can disambiguate chapter/article
 * numbers that happen to collide across different laws.
 */
export function getArticlePath(article) {
  const base = (article.lawSource || "").includes("Constitution") ? "/constitution" : "/law";
  return `${base}/${article.chapterNumber}/${article.articleNumber}?lawSource=${encodeURIComponent(article.lawSource)}`;
}