export default (comments: Comment[]): CommentsGroupedBySlug =>
  comments.reduce((acc, current) => {
    const { slug } = current;
    if (acc[slug]) {
      acc[slug].counter = acc[slug].counter + 1;
      acc[slug].comments.push(current);
      return acc;
    }

    return {
      ...acc,
      [slug]: {
        counter: 1,
        comments: [current],
      },
    };
  }, {} as CommentsGroupedBySlug);
