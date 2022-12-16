interface Comment {
  id: string;
  website: string;
  github: string;
  slug: string;
  createdAt: number;
  comment: string;
  parent: string;
  name: string;
  title: string;
  comments?: Comment[];
}

interface CommentsGroupedBySlug {
  [key: string]: {
    counter: number;
    comments: Comment[];
  };
}
