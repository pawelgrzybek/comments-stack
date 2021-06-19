interface IComment {
  twitter: string;
  website: string;
  github: string;
  slug: string;
  createdAt: number;
  comment: string;
  parent: string;
  id: string;
  name: string;
  title: string;
  comments?: IComment[];
}

interface ICommentsGroupedBySlug {
  [key: string]: {
    counter: number;
    comments: IComment[];
  };
}

export default (comments: IComment[]): ICommentsGroupedBySlug =>
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
  }, {} as ICommentsGroupedBySlug);
