import {posts} from '../_lib/scheduled-blog/generated-posts.mjs';
import {scheduledBlog} from '../_lib/scheduled-blog/publication.mjs';
export const onRequest=context=>scheduledBlog(context,posts);
