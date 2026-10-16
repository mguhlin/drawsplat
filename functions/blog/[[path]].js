import {posts} from '../../server/blog/generated-posts.mjs';
import {scheduledBlog} from '../../server/blog/publication.mjs';
export const onRequest=context=>scheduledBlog(context,posts);
