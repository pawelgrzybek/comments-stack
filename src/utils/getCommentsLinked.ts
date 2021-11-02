import obfuscateID from "./obfuscateId";

const commentsSort = (a: Comment, b: Comment) => a.createdAt - b.createdAt;
const commentsMapNormalize = (i: Comment) => ({
  ...i,
  id: obfuscateID(i.id),
  parent: obfuscateID(i.parent),
});
const commentsFilterTopLevel = (i: Comment) => i.parent === "";
const commentsFilterChildren = (i: Comment) => i.parent !== "";

export default (comments: Comment[]): Comment[] => {
  const commentsSorted = comments.sort(commentsSort).map(commentsMapNormalize);

  const commentsTopLevel = commentsSorted.filter(commentsFilterTopLevel);
  const commentsChildren = commentsSorted.filter(commentsFilterChildren);

  if (!commentsChildren.length) {
    return commentsTopLevel;
  }

  const levels: Comment[][] = [commentsTopLevel];

  while (levels.flat().length < comments.length) {
    const levelPrev = levels[levels.length - 1];
    const levelPrevIds = levelPrev.map(({ id }) => id);
    const levelNext = commentsChildren.filter(({ parent }) =>
      levelPrevIds.includes(parent)
    );
    levels.push(levelNext);
  }
  const levelsReversed = levels.reverse();
  const levelsReversedLastIndex = levelsReversed.length - 1;

  levelsReversed.forEach((level, index) => {
    if (index === levelsReversedLastIndex) {
      return;
    }

    level.forEach((comment) => {
      const parrentsArray = levelsReversed[index + 1];
      const parentCommentIndex = parrentsArray.findIndex(
        ({ id }) => id === comment.parent
      );
      const { comments = [] } = parrentsArray[parentCommentIndex];
      parrentsArray[parentCommentIndex].comments = [...comments, comment];
    });
  });

  return levelsReversed[levelsReversedLastIndex];
};
